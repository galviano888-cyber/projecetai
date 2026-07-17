/**
 * AgroDemak - Data Threshold Agroklimat 4 Komoditas (Platform)
 *
 * Sumber:
 *   [1] Threshold CH   : Oldeman, L.R. 1975. An Agroclimatic Classification of
 *                        the Environments in Indonesia. CRIA, Bogor.
 *                        BB = CH >= 200 mm/bln | BL = 100-199 mm/bln | BK = <100 mm/bln
 *   [2] Threshold Suhu,
 *       RH, KAT        : Ritung, S. et al. 2011. Petunjuk Teknis Evaluasi Lahan
 *                        Untuk Komoditas Pertanian. Edisi Revisi. BBSDLP, Bogor.
 *   [3] Fase & Durasi  : Allen, R.G. et al. 1998. Crop Evapotranspiration.
 *                        FAO Irrigation and Drainage Paper No.56 Table 11. FAO, Rome.
 *
 * Komoditas dipilih berdasarkan validasi empiris terhadap data luas panen
 * aktual BPS Demak 2020-2024 (Statistik Hortikultura + KSA Padi):
 *   - Padi Sawah    : F1=0.635, Presisi=1.000 (KSA BPS 2021-2024)
 *   - Cabai Keriting: F1=0.966 (Statistik Hortikultura BPS Demak 2021-2024)
 *   - Cabai Rawit   : F1=0.874 (Statistik Hortikultura BPS Demak 2020-2024)
 *   - Tomat         : F1=0.605 (Statistik Hortikultura BPS Demak 2020-2024)
 *
 * Komoditas yang dikeluarkan dari platform (tetap dibahas di paper):
 *   - Jagung, Kedelai  : tidak ada data BPS luas panen per bulan untuk validasi
 *   - Bawang Merah     : F1=0.000, threshold RH S1 (50-70%) tidak cocok RH Demak (76-83%)
 *   - Semangka, Melon  : F1 < 0.30, threshold tidak konsisten dengan praktik petani
 *   - Terung           : F1=0.431 borderline, dikeluarkan untuk menjaga kualitas sistem
 *   - Kacang Panjang   : F1=0.812 semu, threshold Ritung hal.62 untuk dataran tinggi
 *                        (S1=12-24 derajat C), bukan dataran rendah Demak (27 derajat C = S3)
 *
 * File ini adalah representasi TypeScript dari:
 *   - D:\STMKG\PROJECT AI\CSV\Tabel_1_Klasifikasi_Oldeman.csv
 *   - D:\STMKG\PROJECT AI\CSV\THRESHOLD.csv
 */

// ─── Tipe Data ────────────────────────────────────────────────────────────────

export type OldemanKelas = 'BB' | 'BL' | 'BK'

export interface FaseTumbuh {
  nama: string          // Nama fase (Lini, Ldev, Lmid, Llate)
  hariAwal: number      // Hari ke- mulai fase
  hariAkhir: number     // Hari ke- akhir fase
  durasi: number        // Durasi hari
  chButuh: OldemanKelas // Kebutuhan CH Oldeman per fase
  keterangan: string    // Kegiatan utama fase
}

export interface ThresholdSuhuRhKat {
  // Suhu rata-rata (°C) — Ritung et al. 2011
  suhuS1Min: number; suhuS1Max: number
  suhuS2Min: number; suhuS2Max: number
  suhuS3Min: number; suhuS3Max: number
  // Kelembaban RH (%) — Ritung et al. 2011
  rhS1Min: number; rhS1Max: number
  rhS2Min: number; rhS2Max: number
  rhS3Min: number; rhS3Max: number
  // KAT minimum (%) — Ritung et al. 2011
  katS1Min: number
  katS2Min: number
  katS3Min: number
}

export interface TanamanThreshold {
  nama: string
  totalHari: number
  totalBulan: number
  zonaOldeman: string       // Zona Oldeman yang sesuai
  polaCh: OldemanKelas[]    // Pola CH per bulan tumbuh
  fase: FaseTumbuh[]        // Detail fase tumbuh
  threshold: ThresholdSuhuRhKat
  referensi: string
}

// ─── Klasifikasi Oldeman ───────────────────────────────────────────────────────

/**
 * Klasifikasikan CH bulanan ke kelas Oldeman (1975)
 */
export function klasifikasiOldeman(ch: number): OldemanKelas {
  if (ch >= 200) return 'BB'
  if (ch >= 100) return 'BL'
  return 'BK'
}

/**
 * Label lengkap kelas Oldeman
 */
export const OLDEMAN_LABEL: Record<OldemanKelas, string> = {
  BB: 'Bulan Basah (CH \u2265 200 mm)',
  BL: 'Bulan Lembab (100 \u2264 CH < 200 mm)',
  BK: 'Bulan Kering (CH < 100 mm)',
}

// ─── Certainty Factor (CF) Knowledge Base ──────────────────────────────────────
//
// CF[rule] = derajat keyakinan pakar terhadap aturan "parameter X menentukan
//            kesesuaian tanaman". Nilai 0-1.
//
// Nilai CF[rule] diturunkan dari hierarki kualitas lahan agroklimat
// Ritung et al. (2011) Tabel 3-4 hal.8-15:
//   - CH (0.9): komponen utama ketersediaan air, satu-satunya yang bisa diperbaiki via irigasi
//   - Suhu (0.8): kualitas lahan pertama, tidak bisa diperbaiki
//   - RH (0.7): komponen sekunder ketersediaan air
//   - KAT (0.6): faktor pendukung, bisa dimitigasi via irigasi tambahan
// Penetapan numerik menggunakan interval proporsional (Kusrini 2008).

export interface CfRule {
  ch: number    // CF[rule] untuk parameter curah hujan
  suhu: number  // CF[rule] untuk parameter suhu
  rh: number    // CF[rule] untuk parameter kelembaban
  kat: number   // CF[rule] untuk parameter ketersediaan air tanah
}

/**
 * Nilai CF[rule] default per parameter (Ritung et al. 2011 + Kusrini 2008).
 */
export const DEFAULT_CF_RULE: CfRule = {
  ch:   0.9,  // Curah hujan - faktor air paling kritis
  suhu: 0.8,  // Suhu - kritis untuk fotosintesis & metabolisme
  rh:   0.7,  // Kelembaban - memengaruhi OPT & transpirasi
  kat:  0.6,  // Ketersediaan air tanah - faktor pendukung
}

// CATATAN: CF[evidence] (derajat keyakinan fakta terhadap syarat tumbuh)
// didefinisikan bertingkat per kelas kesesuaian di engine (kalenderTanam.ts):
//   S1=1.0, S2=0.6, S3=0.3, N=-0.8
// N=-0.8 (bukan -1.0) karena ketidaksesuaian agroklimat bersifat pembatas
// parsial, bukan mematikan (lethal). Ref: Shortliffe & Buchanan 1975.

// ─── Data Threshold 4 Komoditas ──────────────────────────────────────────────

export const THRESHOLD_TANAMAN: TanamanThreshold[] = [
  // =========================================================================
  // 1. PADI SAWAH
  // Ref Suhu/RH/KAT: Ritung et al. 2011 hal.30 (Padi sawah irigasi)
  // Ref Fase: FAO-56 Table 11 (Paddy rice, tropics)
  //           Lini=30, Ldev=30, Lmid=60, Llate=30 -> 150 hari
  // Zona Oldeman: B1-C1 (butuh >= 5 BB berturut)
  // Validasi BPS: F1=0.635, Presisi=1.000 (KSA Padi 2021-2024)
  // =========================================================================
  {
    nama: 'Padi Sawah',
    totalHari: 150,
    totalBulan: 5,
    zonaOldeman: 'B1-C1 (padi butuh >= 5 BB berturut)',
    polaCh: ['BB', 'BB', 'BB', 'BB', 'BL'],
    fase: [
      { nama: 'Lini (Initial)',     hariAwal: 1,   hariAkhir: 30,  durasi: 30, chButuh: 'BB', keterangan: 'Perkecambahan, pembibitan, awal tanam' },
      { nama: 'Ldev (Development)', hariAwal: 31,  hariAkhir: 60,  durasi: 30, chButuh: 'BB', keterangan: 'Vegetatif awal, pembentukan anakan' },
      { nama: 'Lmid (Mid-season)',  hariAwal: 61,  hariAkhir: 120, durasi: 60, chButuh: 'BB', keterangan: 'Anakan aktif, pembungaan, pengisian bulir' },
      { nama: 'Llate (Late-season)',hariAwal: 121, hariAkhir: 150, durasi: 30, chButuh: 'BL', keterangan: 'Pemasakan bulir, persiapan panen' },
    ],
    threshold: {
      suhuS1Min: 24, suhuS1Max: 29, suhuS2Min: 22, suhuS2Max: 32, suhuS3Min: 18, suhuS3Max: 35,
      rhS1Min: 33,   rhS1Max: 90,   rhS2Min: 30,   rhS2Max: 95,   rhS3Min: 20,   rhS3Max: 98,
      katS1Min: 80,  katS2Min: 70,  katS3Min: 60,
    },
    referensi: 'Ritung et al. 2011 hal.30 (Padi sawah irigasi); FAO-56 Table 11 (Paddy rice tropics); Oldeman 1975',
  },

  // =========================================================================
  // 2. CABAI KERITING
  // Ref Suhu/RH/KAT: Ritung et al. 2011 hal.54 (Cabai merah/Capsicum annuum)
  // Ref Fase: FAO-56 Table 11 (Pepper/Arid region)
  //           Lini=30, Ldev=40, Lmid=110, Llate=30 -> 210 hari
  // Zona Oldeman: Palawija sepanjang tahun (BL semua fase)
  // Validasi BPS: F1=0.966 (Statistik Hortikultura BPS Demak 2021-2024)
  // =========================================================================
  {
    nama: 'Cabai Keriting',
    totalHari: 210,
    totalBulan: 7,
    zonaOldeman: 'Palawija sepanjang tahun (BL semua fase)',
    polaCh: ['BL', 'BL', 'BL', 'BL', 'BL', 'BL', 'BL'],
    fase: [
      { nama: 'Lini (Initial)',     hariAwal: 1,   hariAkhir: 30,  durasi: 30,  chButuh: 'BL', keterangan: 'Perkecambahan, pembibitan' },
      { nama: 'Ldev (Development)', hariAwal: 31,  hariAkhir: 70,  durasi: 40,  chButuh: 'BL', keterangan: 'Vegetatif, pembentukan cabang' },
      { nama: 'Lmid (Mid-season)',  hariAwal: 71,  hariAkhir: 180, durasi: 110, chButuh: 'BL', keterangan: 'Pembungaan, pembuahan, panen awal' },
      { nama: 'Llate (Late-season)',hariAwal: 181, hariAkhir: 210, durasi: 30,  chButuh: 'BL', keterangan: 'Panen lanjutan, akhir musim' },
    ],
    threshold: {
      suhuS1Min: 21, suhuS1Max: 27, suhuS2Min: 14, suhuS2Max: 28, suhuS3Min: 14, suhuS3Max: 30,
      rhS1Min: 60,   rhS1Max: 80,   rhS2Min: 50,   rhS2Max: 85,   rhS3Min: 40,   rhS3Max: 90,
      katS1Min: 60,  katS2Min: 50,  katS3Min: 40,
    },
    referensi: 'Ritung et al. 2011 hal.54 (Cabai merah/Capsicum annuum); FAO-56 Table 11 (Pepper); Oldeman 1975',
  },

  // =========================================================================
  // 3. CABAI RAWIT
  // Ref Suhu/RH/KAT: Ritung et al. 2011 hal.54 (Cabai merah/Capsicum annuum)
  //                  Tidak ada halaman terpisah untuk rawit di Ritung 2011
  // Ref Fase: FAO-56 Table 11 (Pepper/Arid region)
  //           Lini=30, Ldev=40, Lmid=110, Llate=30 -> 210 hari
  // Zona Oldeman: Palawija sepanjang tahun (BL semua fase)
  // Validasi BPS: F1=0.874 (Statistik Hortikultura BPS Demak 2020-2024)
  // =========================================================================
  {
    nama: 'Cabai Rawit',
    totalHari: 210,
    totalBulan: 7,
    zonaOldeman: 'Palawija sepanjang tahun (BL semua fase)',
    polaCh: ['BL', 'BL', 'BL', 'BL', 'BL', 'BL', 'BL'],
    fase: [
      { nama: 'Lini (Initial)',     hariAwal: 1,   hariAkhir: 30,  durasi: 30,  chButuh: 'BL', keterangan: 'Perkecambahan, pembibitan' },
      { nama: 'Ldev (Development)', hariAwal: 31,  hariAkhir: 70,  durasi: 40,  chButuh: 'BL', keterangan: 'Vegetatif, pembentukan cabang' },
      { nama: 'Lmid (Mid-season)',  hariAwal: 71,  hariAkhir: 180, durasi: 110, chButuh: 'BL', keterangan: 'Pembungaan, pembuahan, panen awal' },
      { nama: 'Llate (Late-season)',hariAwal: 181, hariAkhir: 210, durasi: 30,  chButuh: 'BL', keterangan: 'Panen lanjutan, akhir musim' },
    ],
    threshold: {
      suhuS1Min: 21, suhuS1Max: 27, suhuS2Min: 14, suhuS2Max: 28, suhuS3Min: 14, suhuS3Max: 30,
      rhS1Min: 60,   rhS1Max: 80,   rhS2Min: 50,   rhS2Max: 85,   rhS3Min: 40,   rhS3Max: 90,
      katS1Min: 55,  katS2Min: 45,  katS3Min: 35,
    },
    referensi: 'Ritung et al. 2011 hal.54 (Cabai merah/Capsicum annuum); FAO-56 Table 11 (Pepper); Oldeman 1975',
  },

  // =========================================================================
  // 4. TOMAT
  // Ref Suhu/RH/KAT: Ritung et al. 2011 hal.71 (Tomat sayur/Solanum lycopersicon)
  // Ref Fase: FAO-56 Table 11 (Tomato, arid region)
  //           Lini=35, Ldev=40, Lmid=50, Llate=30 -> 155 hari
  // Zona Oldeman: Palawija (BL semua fase)
  // Validasi BPS: F1=0.605 (Statistik Hortikultura BPS Demak 2020-2024)
  // =========================================================================
  {
    nama: 'Tomat',
    totalHari: 155,
    totalBulan: 5,
    zonaOldeman: 'Palawija (BL semua fase)',
    polaCh: ['BL', 'BL', 'BL', 'BL', 'BL'],
    fase: [
      { nama: 'Lini (Initial)',     hariAwal: 1,   hariAkhir: 35,  durasi: 35, chButuh: 'BL', keterangan: 'Perkecambahan, pembibitan, pindah tanam' },
      { nama: 'Ldev (Development)', hariAwal: 36,  hariAkhir: 75,  durasi: 40, chButuh: 'BL', keterangan: 'Vegetatif, pembentukan cabang dan bunga' },
      { nama: 'Lmid (Mid-season)',  hariAwal: 76,  hariAkhir: 125, durasi: 50, chButuh: 'BL', keterangan: 'Pembungaan, pembentukan dan pembesaran buah' },
      { nama: 'Llate (Late-season)',hariAwal: 126, hariAkhir: 155, durasi: 30, chButuh: 'BL', keterangan: 'Pematangan buah, panen' },
    ],
    threshold: {
      suhuS1Min: 18, suhuS1Max: 26, suhuS2Min: 13, suhuS2Max: 30, suhuS3Min: 13, suhuS3Max: 35,
      rhS1Min: 24,   rhS1Max: 80,   rhS2Min: 20,   rhS2Max: 90,   rhS3Min: 20,   rhS3Max: 90,
      katS1Min: 60,  katS2Min: 50,  katS3Min: 40,
    },
    referensi: 'Ritung et al. 2011 hal.71 (Tomat sayur/Solanum lycopersicon); FAO-56 Table 11 (Tomato); Oldeman 1975',
  },
]

// ─── Helper: cari threshold berdasarkan nama tanaman ─────────────────────────
export function getThresholdByNama(nama: string): TanamanThreshold | undefined {
  return THRESHOLD_TANAMAN.find(
    t => t.nama.toLowerCase() === nama.toLowerCase()
  )
}
