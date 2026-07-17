/**
 * AgroDemak - Sistem Pakar Kalender Tanam
 *
 * METODE: Forward Chaining + Certainty Factor (CF / MYCIN)
 *
 * Alur inferensi (Forward Chaining):
 *   FAKTA   : data prediksi iklim BMKG per bulan (CH, suhu, RH, KAT)
 *   ATURAN  : threshold tiap tanaman per fase tumbuh (knowledge base)
 *   Telusuri maju: untuk tiap tanaman & tiap bulan tanam, cek tiap fase
 *   tumbuh, nyalakan aturan yang antecedent-nya terpenuhi.
 *
 * Certainty Factor:
 *   - Tiap parameter (CH/suhu/RH/KAT) memiliki CF[rule] (keyakinan pakar)
 *     yang diturunkan dari hierarki kualitas lahan Ritung et al. 2011.
 *   - CF[evidence] per parameter = kelas kesesuaian threshold Ritung et al. 2011:
 *       S1 (Sangat Sesuai)  → +1.0
 *       S2 (Cukup Sesuai)   →  0.6
 *       S3 (Marginal)       →  0.3
 *       N  (Tidak Sesuai)   → -0.8  (bukan -1.0, lihat komentar CF_EVIDENCE_KELAS)
 *   - Aturan menyala:
 *       CF parameter = CF[rule] × CF[evidence]
 *   - Kombinasi CF antar-parameter & antar-fase memakai weighted average
 *     dan rumus MYCIN (Shortliffe & Buchanan, 1975).
 *
 * Knowledge Base (basis aturan):
 *   [1] Oldeman, L.R. 1975. An Agroclimatic Classification of the
 *       Environments in Indonesia. CRIA, Bogor. (threshold CH BB/BL/BK)
 *   [2] Ritung, S. et al. 2011. Petunjuk Teknis Evaluasi Lahan Untuk
 *       Komoditas Pertanian. Edisi Revisi. BBSDLP, Bogor. (suhu/RH/KAT)
 *   [3] Allen et al. 1998. FAO Irrigation Drainage Paper No.56 Table 11.
 *       (fase & durasi tumbuh)
 *
 * Metode CF:
 *   [4] Shortliffe, E.H. & Buchanan, B.G. 1975. A Model of Inexact
 *       Reasoning in Medicine. Mathematical Biosciences 23(3-4):351-379.
 */

import {
  THRESHOLD_TANAMAN,
  klasifikasiOldeman,
  DEFAULT_CF_RULE,
  type TanamanThreshold,
  type OldemanKelas,
  type CfRule,
} from './thresholdData'

// ─── Tipe Data ────────────────────────────────────────────────────────────────

export type KelasKesesuaian = 'S1' | 'S2' | 'S3' | 'N'

/**
 * Label user yang disederhanakan menjadi 3 kategori.
 * Pemetaan: S1 → cocok | S2 → cukup | S3 & N → tidak
 */
export type LabelUser = 'cocok' | 'cukup' | 'tidak'

export interface IklimBulan {
  bulan: number   // 1-12
  tahun: number
  ch_mm: number
  suhu: number
  kelembaban: number
  kat?: number
}

export interface DetailBulanTanam {
  bulanKe: number           // Urutan bulan tumbuh (1, 2, 3, ...)
  bulanKalender: number     // Bulan kalender (1-12)
  tahun: number
  namaFase: string          // Nama fase tumbuh
  dataAda: boolean          // false jika data iklim bulan ini tidak tersedia
  chAktual: number          // CH aktual (mm)
  oldemanAktual: OldemanKelas  // Kelas Oldeman aktual
  chButuh: OldemanKelas        // Kelas Oldeman yang dibutuhkan
  kelasCh: KelasKesesuaian     // Kesesuaian CH (untuk info)
  kelasSuhu: KelasKesesuaian   // Kesesuaian suhu (untuk info)
  kelasRh: KelasKesesuaian     // Kesesuaian RH (untuk info)
  kelasKat: KelasKesesuaian    // Kesesuaian KAT (untuk info)
  // Certainty Factor per parameter (hasil aturan menyala)
  cfCh: number              // CF parameter CH pada fase ini
  cfSuhu: number            // CF parameter suhu
  cfRh: number              // CF parameter RH
  cfKat: number             // CF parameter KAT
  cfFase: number            // CF gabungan fase ini (kombinasi 4 parameter)
}

export interface HasilKalenderTanam {
  tanaman: TanamanThreshold
  bulanTanam: number        // Bulan mulai tanam (1-12)
  tahunTanam: number
  bulanPanen: number        // Bulan panen (1-12)
  tahunPanen: number
  cfTotal: number           // CF akhir 0-1 (kombinasi semua fase)
  persenKeyakinan: number   // CF dalam persen (0-100)
  labelUser: LabelUser      // 3 kategori: cocok/cukup/tidak
  detail: DetailBulanTanam[]
  dataLengkap: boolean      // true jika semua bulan ada datanya
}

// ─── Konstanta Label ────────────────────────────────────────────────────────

export const KELAS_LABEL: Record<KelasKesesuaian, string> = {
  S1: 'Sangat Sesuai',
  S2: 'Cukup Sesuai',
  S3: 'Sesuai Marginal',
  N:  'Tidak Sesuai',
}

export const KELAS_COLOR: Record<KelasKesesuaian, string> = {
  S1: 'bg-agri-green text-white',
  S2: 'bg-agri-yellow text-amber-900',
  S3: 'bg-orange-400 text-white',
  N:  'bg-red-500 text-white',
}

export const KELAS_BORDER: Record<KelasKesesuaian, string> = {
  S1: 'border-agri-green/30 bg-agri-green/5',
  S2: 'border-amber-300/50 bg-amber-50/50',
  S3: 'border-orange-300/50 bg-orange-50/50',
  N:  'border-red-300/50 bg-red-50/50',
}

/**
 * Pemetaan 4 kelas kesesuaian (Ritung et al. 2011 / FAO) → 3 label user.
 * S1 → cocok | S2 → cukup | S3 & N → tidak disarankan
 */
export function keLabelUser(kelas: KelasKesesuaian): LabelUser {
  if (kelas === 'S1') return 'cocok'
  if (kelas === 'S2') return 'cukup'
  return 'tidak' // S3 dan N
}

export const LABEL_USER_TEKS: Record<LabelUser, string> = {
  cocok: 'Sangat Cocok',
  cukup: 'Cukup Cocok',
  tidak: 'Tidak Disarankan',
}

export const LABEL_USER_COLOR: Record<LabelUser, string> = {
  cocok: 'bg-agri-green text-white',
  cukup: 'bg-agri-yellow text-amber-900',
  tidak: 'bg-red-500 text-white',
}

export const LABEL_USER_BORDER: Record<LabelUser, string> = {
  cocok: 'border-agri-green/30 bg-agri-green/5',
  cukup: 'border-amber-300/50 bg-amber-50/50',
  tidak: 'border-red-300/50 bg-red-50/50',
}

// ─── Fungsi Utilitas: Evaluasi Kelas Kesesuaian Lahan ─────────────────────────
//
// Tiap parameter dievaluasi terhadap threshold tanaman (Ritung et al. 2011 untuk
// suhu/RH/KAT, Oldeman 1975 untuk CH) dan diklasifikasikan ke kelas
// kesesuaian lahan: S1 (Sangat Sesuai), S2 (Cukup), S3 (Marginal), N (Tidak).
//
// Kelas ini menjadi dasar nilai CF[evidence] bertingkat (lihat cfParameter):
// makin sesuai fakta dengan syarat tumbuh, makin tinggi keyakinan buktinya.

/**
 * Evaluasi kelas CH Oldeman aktual vs kebutuhan fase (info).
 */
function evaluasiCh(aktual: OldemanKelas, butuh: OldemanKelas): KelasKesesuaian {
  if (aktual === butuh) return 'S1'
  if (butuh === 'BB') return aktual === 'BL' ? 'S2' : 'N'
  if (butuh === 'BL') return aktual === 'BB' ? 'S2' : 'S3'
  return aktual === 'BL' ? 'S2' : 'N' // butuh BK
}

function evaluasiSuhu(suhu: number, t: TanamanThreshold['threshold']): KelasKesesuaian {
  if (suhu >= t.suhuS1Min && suhu <= t.suhuS1Max) return 'S1'
  if (suhu >= t.suhuS2Min && suhu <= t.suhuS2Max) return 'S2'
  if (suhu >= t.suhuS3Min && suhu <= t.suhuS3Max) return 'S3'
  return 'N'
}

function evaluasiRh(rh: number, t: TanamanThreshold['threshold']): KelasKesesuaian {
  if (rh >= t.rhS1Min && rh <= t.rhS1Max) return 'S1'
  if (rh >= t.rhS2Min && rh <= t.rhS2Max) return 'S2'
  if (rh >= t.rhS3Min && rh <= t.rhS3Max) return 'S3'
  return 'N'
}

function evaluasiKat(kat: number | undefined, t: TanamanThreshold['threshold']): KelasKesesuaian {
  // KAT null/undefined berarti data tidak tersedia — gunakan S3 (marginal)
  // bukan S2, agar sistem tidak terlalu optimistis saat data KAT absen.
  if (kat == null) return 'S3'
  if (kat >= t.katS1Min) return 'S1'
  if (kat >= t.katS2Min) return 'S2'
  if (kat >= t.katS3Min) return 'S3'
  return 'N'
}

// ─── Certainty Factor (Metode Berbasis Derajat Kecocokan) ──────────────────────

/**
 * CF[evidence] bertingkat sesuai derajat kecocokan fakta terhadap syarat
 * tumbuh (hasil evaluasi kelas kesesuaian lahan Ritung et al. 2011 / Oldeman 1975).
 *
 *   S1 (Sangat Sesuai)  →  1.0  (bukti mendukung penuh)
 *   S2 (Cukup Sesuai)   →  0.6  (bukti mendukung sebagian)
 *   S3 (Marginal)       →  0.3  (bukti lemah)
 *   N  (Tidak Sesuai)   → -0.8  (bukti menolak kuat, bukan absolut)
 *
 * N diubah dari -1.0 ke -0.8 agar proporsional dengan skala positif.
 * Nilai -1.0 terlalu ekstrem — satu parameter N langsung mendominasi
 * seluruh fase meskipun 3 parameter lain mendukung penuh (S1).
 * Dalam MYCIN (Shortliffe & Buchanan 1975), nilai -1.0 dipakai hanya
 * untuk kondisi yang bersifat mematikan (lethal), bukan sekadar di luar
 * rentang optimal. Untuk evaluasi kesesuaian lahan, -0.8 lebih tepat.
 *
 * Ref: Shortliffe & Buchanan (1975); Ritung et al. (2011).
 */
const CF_EVIDENCE_KELAS: Record<KelasKesesuaian, number> = {
  S1:  1.0,
  S2:  0.6,
  S3:  0.3,
  N:  -0.8,
}

/**
 * CF satu parameter = CF[rule] (keyakinan pakar) × CF[evidence] (derajat
 * kecocokan fakta). Rentang -CF[rule]×0.8 .. +CF[rule].
 */
function cfParameter(kelas: KelasKesesuaian, cfRule: number): number {
  return cfRule * CF_EVIDENCE_KELAS[kelas]
}

/**
 * CF gabungan satu fase = rata-rata berbobot CF[evidence] tiap parameter,
 * dengan bobot = CF[rule] parameter tersebut.
 *
 * Rumus: cfFase = sum(CF_EVIDENCE_i × cfRule_i) / sum(cfRule_i)
 *
 * Ini adalah weighted average murni di mana:
 *   - CF_EVIDENCE_i adalah derajat kecocokan aktual (S1=1.0, S2=0.6, S3=0.3, N=-0.8)
 *   - cfRule_i adalah bobot kepentingan parameter menurut pakar (CH=0.9, dst)
 *   - Nilai akhir berada di rentang [-0.8, 1.0]
 *
 * Rentang hasil dan pemetaan ke label:
 *   Semua S1 → cfFase = 1.0    → "cocok"
 *   Semua S2 → cfFase = 0.6    → "cukup"
 *   Semua S3 → cfFase = 0.3    → "tidak"
 *   Semua N  → cfFase = -0.8   → "tidak"
 *
 * Tidak memakai penjumlahan MYCIN antar parameter agar nilai tidak jenuh ke 1.0.
 * Ref: Shortliffe & Buchanan (1975); adaptasi kesesuaian lahan Ritung et al. (2011).
 */
function cfGabunganFase(
  cfParams: { cf: number; bobot: number; evidence: number }[]
): number {
  const totalBobot = cfParams.reduce((s, p) => s + p.bobot, 0)
  if (totalBobot === 0) return 0

  // Weighted average CF[evidence] dengan bobot = cfRule
  // sum(evidence_i × cfRule_i) / sum(cfRule_i)
  return cfParams.reduce((s, p) => s + p.evidence * p.bobot, 0) / totalBobot
}

/**
 * Kombinasi dua nilai CF (rumus MYCIN / Shortliffe-Buchanan 1975).
 *
 * CATATAN ARSITEKTUR: Fungsi ini adalah utilitas murni dan dipakai oleh
 * unit test (kalenderTanam.test.ts) untuk memverifikasi rumus MYCIN secara
 * terpisah. Engine utama (hitungKalenderTanam) TIDAK memanggil fungsi ini —
 * engine menggunakan cfGabunganFase (weighted average per fase) agar nilai
 * CF tetap proporsional dan tidak jenuh ke 1.0.
 *
 * Fungsi ini tetap di-export sebagai referensi akademis / keperluan ekstensi.
 */
export function kombinasiCF(cf1: number, cf2: number): number {
  if (cf1 >= 0 && cf2 >= 0) return cf1 + cf2 * (1 - cf1)
  if (cf1 <= 0 && cf2 <= 0) return cf1 + cf2 * (1 + cf1)
  const minAbs = Math.min(Math.abs(cf1), Math.abs(cf2))
  return minAbs === 1 ? (cf1 + cf2) : (cf1 + cf2) / (1 - minAbs)
}

// ─── Engine Utama (Forward Chaining + Certainty Factor) ────────────────────────

/**
 * Pemetaan CF akhir (0-1) ke 3 label user.
 *
 * Ambang batas (interval keyakinan CF):
 *   CF >= 0.70        → Sangat Cocok    (keyakinan tinggi)
 *   0.40 <= CF < 0.70 → Cukup Cocok     (keyakinan sedang)
 *   CF < 0.40         → Tidak Disarankan (keyakinan rendah/negatif)
 *
 * Ambang ini mengikuti pembagian interval derajat keyakinan yang umum
 * dipakai pada penerapan Certainty Factor di Indonesia (Kusrini, 2008),
 * di mana CF tinggi mencerminkan kondisi mendekati Sangat Sesuai (S1) dan
 * CF rendah mencerminkan kondisi marginal/tidak sesuai (S3/N).
 */
export function cfKeLabelUser(cf: number): LabelUser {
  if (cf >= 0.70) return 'cocok'
  if (cf >= 0.40) return 'cukup'
  return 'tidak'
}

/**
 * Hitung kesesuaian satu tanaman untuk satu bulan tanam
 * menggunakan Forward Chaining + Certainty Factor.
 *
 * @param tanaman    - Data threshold tanaman (knowledge base)
 * @param bulanTanam - Bulan tanam (1-12)
 * @param tahunTanam - Tahun tanam
 * @param iklimMap   - Map dari key "bulan-tahun" ke data iklim (fakta)
 * @param cfRule     - CF[rule] per parameter (keyakinan pakar)
 */
export function hitungKalenderTanam(
  tanaman: TanamanThreshold,
  bulanTanam: number,
  tahunTanam: number,
  iklimMap: Map<string, IklimBulan>,
  cfRule: CfRule = DEFAULT_CF_RULE
): HasilKalenderTanam {
  const detail: DetailBulanTanam[] = []
  let dataLengkap = true
  const cfFaseList: number[] = []

  for (let i = 0; i < tanaman.totalBulan; i++) {
    // Forward chaining: tentukan fase & bulan kalender
    const bulanOffset = (bulanTanam - 1 + i) % 12 + 1
    const tahunOffset = tahunTanam + Math.floor((bulanTanam - 1 + i) / 12)
    const key = `${bulanOffset}-${tahunOffset}`

    const iklim = iklimMap.get(key)
    const fase = tanaman.fase[i] ?? tanaman.fase[tanaman.fase.length - 1]
    const chButuh = tanaman.polaCh[i]

    if (!iklim) {
      // Fakta tidak tersedia → fase ini tidak bisa dinilai
      dataLengkap = false
      detail.push({
        bulanKe: i + 1,
        bulanKalender: bulanOffset,
        tahun: tahunOffset,
        namaFase: fase.nama,
        dataAda: false,
        chAktual: 0,
        oldemanAktual: 'BK',
        chButuh,
        kelasCh: 'N', kelasSuhu: 'N', kelasRh: 'N', kelasKat: 'N',
        cfCh: 0, cfSuhu: 0, cfRh: 0, cfKat: 0, cfFase: 0,
      })
      continue
    }

    // Klasifikasi & evaluasi kelas (untuk info transparansi)
    const oldemanAktual = klasifikasiOldeman(iklim.ch_mm)
    const kelasCh   = evaluasiCh(oldemanAktual, chButuh)
    const kelasSuhu = evaluasiSuhu(iklim.suhu, tanaman.threshold)
    const kelasRh   = evaluasiRh(iklim.kelembaban, tanaman.threshold)
    const kelasKat  = evaluasiKat(iklim.kat, tanaman.threshold)

    // ─── Forward Chaining: nyalakan aturan, hitung CF tiap parameter ───
    const cfCh   = cfParameter(kelasCh,   cfRule.ch)
    const cfSuhu = cfParameter(kelasSuhu, cfRule.suhu)
    const cfRh   = cfParameter(kelasRh,   cfRule.rh)
    const cfKat  = cfParameter(kelasKat,  cfRule.kat)

    // CF gabungan fase = rata-rata berbobot CF[evidence] dengan bobot = cfRule
    let cfFase = cfGabunganFase([
      { cf: cfCh,   bobot: cfRule.ch,   evidence: CF_EVIDENCE_KELAS[kelasCh] },
      { cf: cfSuhu, bobot: cfRule.suhu, evidence: CF_EVIDENCE_KELAS[kelasSuhu] },
      { cf: cfRh,   bobot: cfRule.rh,   evidence: CF_EVIDENCE_KELAS[kelasRh] },
      { cf: cfKat,  bobot: cfRule.kat,  evidence: CF_EVIDENCE_KELAS[kelasKat] },
    ])

    // ─── Hukum Faktor Pembatas Air (Liebig/Oldeman) ───────────────────────────
    // CH adalah faktor pembatas primer dalam agroklimatologi (Oldeman 1975).
    // Jika kebutuhan CH fase tidak terpenuhi (kelasCh = N), tanaman tidak
    // dapat tumbuh terlepas kondisi suhu/RH/KAT sebaik apapun.
    // Cap cfFase maksimal 0.39 ("tidak") saat CH = N.
    if (kelasCh === 'N') {
      cfFase = Math.min(cfFase, 0.39)
    }
    cfFaseList.push(cfFase)

    detail.push({
      bulanKe: i + 1,
      bulanKalender: bulanOffset,
      tahun: tahunOffset,
      namaFase: fase.nama,
      dataAda: true,
      chAktual: iklim.ch_mm,
      oldemanAktual,
      chButuh,
      kelasCh, kelasSuhu, kelasRh, kelasKat,
      cfCh, cfSuhu, cfRh, cfKat, cfFase,
    })
  }

  // CF total = CF fase TERENDAH (hukum faktor pembatas / Liebig).
  // Satu fase tumbuh yang buruk menentukan keseluruhan, karena tanaman
  // gagal bila kebutuhannya tak terpenuhi pada salah satu fase kritis.
  const cfTotal = cfFaseList.length > 0 ? Math.min(...cfFaseList) : 0
  const cfTotalClamp = Math.max(-1, Math.min(1, cfTotal))
  const persenKeyakinan = Math.round(cfTotalClamp * 100)

  const labelUser = cfKeLabelUser(cfTotalClamp)

  // Hitung bulan panen
  const panenOffset = (bulanTanam - 1 + tanaman.totalBulan - 1) % 12 + 1
  const tahunPanen  = tahunTanam + Math.floor((bulanTanam - 1 + tanaman.totalBulan - 1) / 12)

  return {
    tanaman,
    bulanTanam,
    tahunTanam,
    bulanPanen: panenOffset,
    tahunPanen,
    cfTotal: cfTotalClamp,
    persenKeyakinan,
    labelUser,
    detail,
    dataLengkap,
  }
}

/**
 * Hitung kalender tanam untuk semua tanaman dan semua 12 bulan tanam.
 *
 * @param tahun         - Tahun yang dievaluasi
 * @param iklimList     - Array data iklim (prediksi BMKG)
 * @param cfRule        - Nilai CF[rule] per parameter
 * @param thresholdList - Knowledge base tanaman (opsional, default THRESHOLD_TANAMAN)
 * @returns Map<namaTanaman, Map<bulanTanam, HasilKalenderTanam>>
 */
export function hitungKalenderTanamLengkap(
  tahun: number,
  iklimList: IklimBulan[],
  cfRule: CfRule = DEFAULT_CF_RULE,
  thresholdList: TanamanThreshold[] = THRESHOLD_TANAMAN
): Map<string, Map<number, HasilKalenderTanam>> {
  // Buat iklimMap dari list
  const iklimMap = new Map<string, IklimBulan>()
  for (const d of iklimList) {
    iklimMap.set(`${d.bulan}-${d.tahun}`, d)
  }

  const hasil = new Map<string, Map<number, HasilKalenderTanam>>()

  for (const tanaman of thresholdList) {
    const bulanMap = new Map<number, HasilKalenderTanam>()
    for (let bulan = 1; bulan <= 12; bulan++) {
      bulanMap.set(bulan, hitungKalenderTanam(tanaman, bulan, tahun, iklimMap, cfRule))
    }
    hasil.set(tanaman.nama, bulanMap)
  }

  return hasil
}

/**
 * Buat iklimMap dari data prediksi untuk dipakai engine.
 * Mendukung multi-tahun.
 */
export function buatIklimMap(iklimList: IklimBulan[]): Map<string, IklimBulan> {
  const map = new Map<string, IklimBulan>()
  for (const d of iklimList) {
    map.set(`${d.bulan}-${d.tahun}`, d)
  }
  return map
}

/**
 * Ringkasan rekomendasi bulan tanam terbaik per tanaman untuk tahun tertentu.
 * Menggunakan 3 label user: cocok / cukup / tidak
 */
export interface RingkasanKalender {
  namaTanaman: string
  bulanCocok: number[]   // labelUser = 'cocok' (S1)
  bulanCukup: number[]   // labelUser = 'cukup' (S2)
  bulanTidak: number[]   // labelUser = 'tidak' (S3, N, atau gugur CH)
  bulanTanamOptimal: number | null   // Bulan 'cocok' pertama, fallback 'cukup'
}

export function ringkasanKalenderTanam(
  tahun: number,
  iklimList: IklimBulan[]
): RingkasanKalender[] {
  const hasilLengkap = hitungKalenderTanamLengkap(tahun, iklimList)
  const ringkasan: RingkasanKalender[] = []

  for (const [nama, bulanMap] of hasilLengkap) {
    const bulanCocok: number[] = []
    const bulanCukup: number[] = []
    const bulanTidak: number[] = []

    for (const [bulan, hasil] of bulanMap) {
      switch (hasil.labelUser) {
        case 'cocok': bulanCocok.push(bulan); break
        case 'cukup': bulanCukup.push(bulan); break
        case 'tidak': bulanTidak.push(bulan); break
      }
    }

    const bulanTanamOptimal = bulanCocok[0] ?? bulanCukup[0] ?? null

    ringkasan.push({ namaTanaman: nama, bulanCocok, bulanCukup, bulanTidak, bulanTanamOptimal })
  }

  return ringkasan
}

/**
 * Cari hasil CF satu tanaman (by nama) untuk satu bulan tanam.
 * Mengembalikan null jika tanaman tidak ada di knowledge base (9 tanaman).
 * Dipakai oleh halaman Library untuk menampilkan badge kecocokan.
 */
export function hitungTanamanByNama(
  nama: string,
  bulanTanam: number,
  tahunTanam: number,
  iklimList: IklimBulan[],
  cfRule: CfRule = DEFAULT_CF_RULE
): HasilKalenderTanam | null {
  const tanaman = THRESHOLD_TANAMAN.find(
    t => t.nama.toLowerCase() === nama.toLowerCase()
  )
  if (!tanaman) return null
  const iklimMap = buatIklimMap(iklimList)
  return hitungKalenderTanam(tanaman, bulanTanam, tahunTanam, iklimMap, cfRule)
}

/**
 * Rekomendasi tanaman untuk SATU bulan tanam tertentu, diurutkan dari
 * CF tertinggi. Dipakai untuk fitur "Rekomendasi Komoditas Bulan Ini".
 *
 * Menggunakan engine & knowledge base yang SAMA dengan kalender tanam
 * (Forward Chaining + Certainty Factor) — tidak ada engine terpisah.
 *
 * @param bulanTanam    - bulan tanam (1-12)
 * @param tahunTanam    - tahun tanam
 * @param iklimList     - data prediksi iklim BMKG
 * @param cfRule        - nilai CF[rule] (opsional, default dari literatur)
 * @param topN          - jumlah tanaman teratas yang dikembalikan (0 = semua)
 * @param thresholdList - knowledge base tanaman (opsional, default THRESHOLD_TANAMAN)
 */
export function rekomendasiBulan(
  bulanTanam: number,
  tahunTanam: number,
  iklimList: IklimBulan[],
  cfRule: CfRule = DEFAULT_CF_RULE,
  topN = 0,
  thresholdList: TanamanThreshold[] = THRESHOLD_TANAMAN
): HasilKalenderTanam[] {
  const iklimMap = buatIklimMap(iklimList)

  const semua = thresholdList.map(tanaman =>
    hitungKalenderTanam(tanaman, bulanTanam, tahunTanam, iklimMap, cfRule)
  )

  // Urutkan dari CF tertinggi
  semua.sort((a, b) => b.cfTotal - a.cfTotal)

  return topN > 0 ? semua.slice(0, topN) : semua
}
