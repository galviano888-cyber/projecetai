/**
 * AgroDemak - Data Threshold Agroklimat 10 Tanaman
 *
 * Sumber:
 *   [1] Threshold CH   : Oldeman, L.R. 1975. An Agroclimatic Classification of
 *                        the Environments in Indonesia. CRIA, Bogor.
 *                        BB = CH >= 200 mm/bln | BL = 100-199 mm/bln | BK = <100 mm/bln
 *   [2] Threshold Suhu,
 *       RH, KAT        : Djaenudin, D. et al. 2011. Petunjuk Teknis Evaluasi Lahan
 *                        Untuk Komoditas Pertanian. Edisi Revisi. Kementan, Bogor.
 *   [3] Fase & Durasi  : Allen, R.G. et al. 1998. Crop Evapotranspiration.
 *                        FAO Irrigation and Drainage Paper No.56 Table 11. FAO, Rome.
 *
 * File ini adalah representasi TypeScript dari:
 *   - D:\STMKG\PROJECT AI\CSV\Tabel_1_Klasifikasi_Oldeman.csv
 *   - D:\STMKG\PROJECT AI\CSV\Tabel_2_Fase_Tumbuh_10_Tanaman.csv
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
  // Suhu rata-rata (°C) — Djaenudin 2011
  suhuS1Min: number; suhuS1Max: number
  suhuS2Min: number; suhuS2Max: number
  suhuS3Min: number; suhuS3Max: number
  // Kelembaban RH (%) — Djaenudin 2011
  rhS1Min: number; rhS1Max: number
  rhS2Min: number; rhS2Max: number
  rhS3Min: number; rhS3Max: number
  // KAT minimum (%) — Djaenudin 2011
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
// CATATAN PENTING (untuk skripsi):
//   Nilai CF[rule] di bawah ini bersifat SEMENTARA, diturunkan dari bobot
//   kepentingan parameter agroklimat pada literatur kesesuaian lahan, yaitu
//   curah hujan sebagai faktor paling menentukan ketersediaan air, diikuti
//   suhu, kelembaban, dan ketersediaan air tanah.
//
//   Rujukan bobot kepentingan parameter:
//     - Ritung, S. et al. (2011). Petunjuk Teknis Evaluasi Lahan untuk
//       Komoditas Pertanian. BBSDLP, Bogor. (CH & suhu = pembatas utama)
//     - FAO (1976). A Framework for Land Evaluation. Soil Bulletin No.32.
//     - Oldeman, L.R. (1975). (CH sebagai dasar klasifikasi agroklimat)
//
//   Nilai final WAJIB divalidasi melalui wawancara pakar (dosen pertanian /
//   penyuluh BPP Demak) menggunakan skala konversi keyakinan:
//     Pasti=1.0 | Hampir pasti=0.8 | Kemungkinan besar=0.6 | Mungkin=0.4 | Ragu=0.2
//   Sistem dirancang agar nilai CF dapat diperbarui melalui admin panel
//   tanpa mengubah kode.

export interface CfRule {
  ch: number    // CF[rule] untuk parameter curah hujan
  suhu: number  // CF[rule] untuk parameter suhu
  rh: number    // CF[rule] untuk parameter kelembaban
  kat: number   // CF[rule] untuk parameter ketersediaan air tanah
}

/**
 * Nilai CF[rule] default per parameter (sementara, dari literatur).
 * CH tertinggi karena merupakan faktor pembatas air paling kritis
 * (Oldeman 1975; Ritung et al. 2011).
 */
export const DEFAULT_CF_RULE: CfRule = {
  ch:   0.9,  // Curah hujan - faktor air paling kritis
  suhu: 0.8,  // Suhu - kritis untuk fotosintesis & metabolisme
  rh:   0.7,  // Kelembaban - memengaruhi OPT & transpirasi
  kat:  0.6,  // Ketersediaan air tanah - faktor pendukung
}

// CATATAN: CF[evidence] (derajat keyakinan fakta terhadap syarat tumbuh)
// didefinisikan bertingkat per kelas kesesuaian di engine (kalenderTanam.ts):
//   S1=1.0, S2=0.6, S3=0.3, N=-1.0
// sehingga fakta yang lebih sesuai memberi keyakinan lebih tinggi.

// ─── Data Threshold 10 Tanaman ────────────────────────────────────────────────

export const THRESHOLD_TANAMAN: TanamanThreshold[] = [
  // =========================================================================
  // 1. PADI SAWAH
  // Ref Suhu/RH/KAT: Djaenudin 2011 hal.11-12
  // Ref Fase: FAO-56 Table 11 (Paddy rice, tropics)
  // Zona Oldeman: B1-C1 (butuh >= 5 BB berturut)
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
      { nama: 'Lmid (Mid-season)',  hariAwal: 61,  hariAkhir: 120, durasi: 60, chButuh: 'BB', keterangan: 'Anakan aktif, pembungaan, pengisian' },
      { nama: 'Llate (Late-season)',hariAwal: 121, hariAkhir: 150, durasi: 30, chButuh: 'BL', keterangan: 'Pemasakan bulir, persiapan panen' },
    ],
    threshold: {
      suhuS1Min: 24, suhuS1Max: 29, suhuS2Min: 22, suhuS2Max: 32, suhuS3Min: 20, suhuS3Max: 35,
      rhS1Min: 70,   rhS1Max: 90,   rhS2Min: 60,   rhS2Max: 95,   rhS3Min: 50,   rhS3Max: 98,
      katS1Min: 80,  katS2Min: 70,  katS3Min: 60,
    },
    referensi: 'Djaenudin et al. 2011 hal.11-12; FAO-56 Table 11; Oldeman 1975',
  },

  // =========================================================================
  // 2. JAGUNG
  // Ref Suhu/RH/KAT: Djaenudin 2011 hal.21-22
  // Ref Fase: FAO-56 Table 11 (Maize, Arid climate)
  // Zona Oldeman: C2-D2 (palawija, BL vegetatif, BK panen)
  // =========================================================================
  {
    nama: 'Jagung',
    totalHari: 140,
    totalBulan: 5,
    zonaOldeman: 'C2-D2 (palawija, BL vegetatif, BK panen)',
    polaCh: ['BL', 'BL', 'BL', 'BL', 'BK'],
    fase: [
      { nama: 'Lini (Initial)',     hariAwal: 1,   hariAkhir: 25,  durasi: 25, chButuh: 'BL', keterangan: 'Perkecambahan, emergence' },
      { nama: 'Ldev (Development)', hariAwal: 26,  hariAkhir: 65,  durasi: 40, chButuh: 'BL', keterangan: 'Vegetatif, pembentukan daun' },
      { nama: 'Lmid (Mid-season)',  hariAwal: 66,  hariAkhir: 110, durasi: 45, chButuh: 'BL', keterangan: 'Pembungaan, pengisian biji' },
      { nama: 'Llate (Late-season)',hariAwal: 111, hariAkhir: 140, durasi: 30, chButuh: 'BK', keterangan: 'Pemasakan, pengeringan biji' },
    ],
    threshold: {
      suhuS1Min: 21, suhuS1Max: 30, suhuS2Min: 18, suhuS2Max: 33, suhuS3Min: 15, suhuS3Max: 35,
      rhS1Min: 60,   rhS1Max: 80,   rhS2Min: 50,   rhS2Max: 85,   rhS3Min: 40,   rhS3Max: 90,
      katS1Min: 60,  katS2Min: 50,  katS3Min: 40,
    },
    referensi: 'Djaenudin et al. 2011 hal.21-22; FAO-56 Table 11; Oldeman 1975',
  },

  // =========================================================================
  // 3. KEDELAI
  // Ref Suhu/RH/KAT: Djaenudin 2011 hal.25-26
  // Ref Fase: FAO-56 Table 11 (Soybean, tropics)
  // Zona Oldeman: C2-C3 (palawija, BL vegetatif, BK panen)
  // =========================================================================
  {
    nama: 'Kedelai',
    totalHari: 85,
    totalBulan: 3,
    zonaOldeman: 'C2-C3 (palawija, BL vegetatif, BK panen)',
    polaCh: ['BL', 'BL', 'BK'],
    fase: [
      { nama: 'Lini+Ldev (Init+Dev)', hariAwal: 1,  hariAkhir: 30, durasi: 30, chButuh: 'BL', keterangan: 'Perkecambahan hingga vegetatif awal' },
      { nama: 'Lmid (Mid-season)',     hariAwal: 31, hariAkhir: 70, durasi: 40, chButuh: 'BL', keterangan: 'Pembungaan, pembentukan polong' },
      { nama: 'Llate (Late-season)',   hariAwal: 71, hariAkhir: 85, durasi: 15, chButuh: 'BK', keterangan: 'Pemasakan polong, panen' },
    ],
    threshold: {
      suhuS1Min: 22, suhuS1Max: 30, suhuS2Min: 20, suhuS2Max: 32, suhuS3Min: 18, suhuS3Max: 35,
      rhS1Min: 60,   rhS1Max: 80,   rhS2Min: 50,   rhS2Max: 85,   rhS3Min: 40,   rhS3Max: 90,
      katS1Min: 60,  katS2Min: 50,  katS3Min: 40,
    },
    referensi: 'Djaenudin et al. 2011 hal.25-26; FAO-56 Table 11; Oldeman 1975',
  },

  // =========================================================================
  // 4. BAWANG MERAH
  // Ref Suhu/RH/KAT: Djaenudin 2011 hal.55-56
  // Ref Fase: FAO-56 Table 11 (Onion, Arid)
  // Zona Oldeman: Palawija (BL vegetatif, BK panen)
  // =========================================================================
  {
    nama: 'Bawang Merah',
    totalHari: 210,
    totalBulan: 7,
    zonaOldeman: 'Palawija (BL vegetatif, BK panen)',
    polaCh: ['BL', 'BL', 'BL', 'BL', 'BL', 'BL', 'BK'],
    fase: [
      { nama: 'Lini (Initial)',     hariAwal: 1,   hariAkhir: 20,  durasi: 20,  chButuh: 'BL', keterangan: 'Perkecambahan, pertunasan' },
      { nama: 'Ldev (Development)', hariAwal: 21,  hariAkhir: 55,  durasi: 35,  chButuh: 'BL', keterangan: 'Vegetatif, pembentukan daun' },
      { nama: 'Lmid (Mid-season)',  hariAwal: 56,  hariAkhir: 165, durasi: 110, chButuh: 'BL', keterangan: 'Pembesaran umbi, pematangan' },
      { nama: 'Llate (Late-season)',hariAwal: 166, hariAkhir: 210, durasi: 45,  chButuh: 'BK', keterangan: 'Pengeringan, panen umbi' },
    ],
    threshold: {
      suhuS1Min: 25, suhuS1Max: 32, suhuS2Min: 22, suhuS2Max: 35, suhuS3Min: 20, suhuS3Max: 38,
      rhS1Min: 65,   rhS1Max: 80,   rhS2Min: 55,   rhS2Max: 85,   rhS3Min: 45,   rhS3Max: 90,
      katS1Min: 60,  katS2Min: 50,  katS3Min: 40,
    },
    referensi: 'Djaenudin et al. 2011 hal.55-56; FAO-56 Table 11; Oldeman 1975',
  },

  // =========================================================================
  // 5. SEMANGKA
  // Ref Suhu/RH/KAT: Djaenudin 2011 hal.91-92
  // Ref Fase: FAO-56 Table 11 (Watermelon)
  // Zona Oldeman: Tanaman kemarau (BL awal, BK buah-panen)
  // =========================================================================
  {
    nama: 'Semangka',
    totalHari: 110,
    totalBulan: 4,
    zonaOldeman: 'Tanaman kemarau (BL awal, BK buah-panen)',
    polaCh: ['BL', 'BK', 'BK', 'BK'],
    fase: [
      { nama: 'Lini (Initial)',     hariAwal: 1,  hariAkhir: 20,  durasi: 20, chButuh: 'BL', keterangan: 'Perkecambahan, perakaran awal' },
      { nama: 'Ldev (Development)', hariAwal: 21, hariAkhir: 50,  durasi: 30, chButuh: 'BK', keterangan: 'Vegetatif, pembentukan sulur' },
      { nama: 'Lmid (Mid-season)',  hariAwal: 51, hariAkhir: 80,  durasi: 30, chButuh: 'BK', keterangan: 'Pembungaan, pembentukan buah' },
      { nama: 'Llate (Late-season)',hariAwal: 81, hariAkhir: 110, durasi: 30, chButuh: 'BK', keterangan: 'Pematangan buah, panen' },
    ],
    threshold: {
      suhuS1Min: 25, suhuS1Max: 35, suhuS2Min: 22, suhuS2Max: 38, suhuS3Min: 20, suhuS3Max: 40,
      rhS1Min: 60,   rhS1Max: 75,   rhS2Min: 50,   rhS2Max: 80,   rhS3Min: 40,   rhS3Max: 85,
      katS1Min: 50,  katS2Min: 40,  katS3Min: 30,
    },
    referensi: 'Djaenudin et al. 2011 hal.91-92; FAO-56 Table 11; Oldeman 1975',
  },

  // =========================================================================
  // 6. CABAI KERITING
  // Ref Suhu/RH/KAT: Djaenudin 2011 hal.61-62
  // Ref Fase: FAO-56 Table 11 (Pepper, Arid)
  // Zona Oldeman: Palawija sepanjang tahun (BL semua fase)
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
      suhuS1Min: 24, suhuS1Max: 30, suhuS2Min: 22, suhuS2Max: 32, suhuS3Min: 18, suhuS3Max: 35,
      rhS1Min: 65,   rhS1Max: 80,   rhS2Min: 55,   rhS2Max: 85,   rhS3Min: 45,   rhS3Max: 90,
      katS1Min: 60,  katS2Min: 50,  katS3Min: 40,
    },
    referensi: 'Djaenudin et al. 2011 hal.61-62; FAO-56 Table 11; Oldeman 1975',
  },

  // =========================================================================
  // 7. PETSAI/SAWI
  // Ref Suhu/RH/KAT: Djaenudin 2011 hal.73-74 (modif. var. dataran rendah)
  //                  AVRDC 2005 - Vegetable Production Training Manual
  // Ref Fase: FAO-56 Table 11 (Lettuce/Cabbage)
  // Zona Oldeman: Palawija (BL semua fase)
  // =========================================================================
  {
    nama: 'Petsai/Sawi',
    totalHari: 95,
    totalBulan: 3,
    zonaOldeman: 'Palawija (BL semua fase)',
    polaCh: ['BL', 'BL', 'BL'],
    fase: [
      { nama: 'Lini+Ldev (Init+Dev)',    hariAwal: 1,  hariAkhir: 60, durasi: 60, chButuh: 'BL', keterangan: 'Perkecambahan hingga vegetatif' },
      { nama: 'Lmid (Mid-season)',        hariAwal: 61, hariAkhir: 85, durasi: 25, chButuh: 'BL', keterangan: 'Pembentukan daun, pengisian' },
      { nama: 'Llate (Late-season)',      hariAwal: 86, hariAkhir: 95, durasi: 10, chButuh: 'BL', keterangan: 'Panen daun' },
    ],
    threshold: {
      suhuS1Min: 22, suhuS1Max: 32, suhuS2Min: 20, suhuS2Max: 35, suhuS3Min: 18, suhuS3Max: 38,
      rhS1Min: 70,   rhS1Max: 85,   rhS2Min: 60,   rhS2Max: 90,   rhS3Min: 50,   rhS3Max: 95,
      katS1Min: 65,  katS2Min: 55,  katS3Min: 45,
    },
    referensi: 'Djaenudin et al. 2011 hal.73-74 (modif. dataran rendah); AVRDC 2005; FAO-56 Table 11; Oldeman 1975',
  },

  // =========================================================================
  // 8. MELON
  // Ref Suhu/RH/KAT: Djaenudin 2011 hal.87-88
  // Ref Fase: FAO-56 Table 11 (Melons)
  // Zona Oldeman: Tanaman kemarau (BL awal, BK buah-panen)
  // =========================================================================
  {
    nama: 'Melon',
    totalHari: 120,
    totalBulan: 4,
    zonaOldeman: 'Tanaman kemarau (BL awal, BK buah-panen)',
    polaCh: ['BL', 'BK', 'BK', 'BK'],
    fase: [
      { nama: 'Lini (Initial)',     hariAwal: 1,   hariAkhir: 25,  durasi: 25, chButuh: 'BL', keterangan: 'Perkecambahan, perakaran awal' },
      { nama: 'Ldev (Development)', hariAwal: 26,  hariAkhir: 60,  durasi: 35, chButuh: 'BK', keterangan: 'Vegetatif, pembentukan sulur' },
      { nama: 'Lmid (Mid-season)',  hariAwal: 61,  hariAkhir: 100, durasi: 40, chButuh: 'BK', keterangan: 'Pembungaan, pembentukan buah' },
      { nama: 'Llate (Late-season)',hariAwal: 101, hariAkhir: 120, durasi: 20, chButuh: 'BK', keterangan: 'Pematangan buah, panen' },
    ],
    threshold: {
      suhuS1Min: 25, suhuS1Max: 35, suhuS2Min: 22, suhuS2Max: 38, suhuS3Min: 20, suhuS3Max: 40,
      rhS1Min: 55,   rhS1Max: 75,   rhS2Min: 45,   rhS2Max: 80,   rhS3Min: 35,   rhS3Max: 85,
      katS1Min: 50,  katS2Min: 40,  katS3Min: 30,
    },
    referensi: 'Djaenudin et al. 2011 hal.87-88; FAO-56 Table 11; Oldeman 1975',
  },

  // =========================================================================
  // 9. CABAI RAWIT
  // Ref Suhu/RH/KAT: Djaenudin 2011 hal.63-64
  // Ref Fase: FAO-56 Table 11 (Pepper, Arid) - sama dengan cabai keriting
  // Zona Oldeman: Palawija sepanjang tahun (BL semua fase)
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
      suhuS1Min: 24, suhuS1Max: 30, suhuS2Min: 20, suhuS2Max: 32, suhuS3Min: 18, suhuS3Max: 35,
      rhS1Min: 65,   rhS1Max: 80,   rhS2Min: 55,   rhS2Max: 85,   rhS3Min: 45,   rhS3Max: 90,
      katS1Min: 55,  katS2Min: 45,  katS3Min: 35,
    },
    referensi: 'Djaenudin et al. 2011 hal.63-64; FAO-56 Table 11; Oldeman 1975',
  },

  // =========================================================================
  // 10. TERUNG
  // Ref Suhu/RH/KAT: Djaenudin 2011 hal.75-76
  // Ref Fase: FAO-56 Table 11 (Eggplant, Arid)
  // Zona Oldeman: Palawija (BL vegetatif, BK panen)
  // =========================================================================
  {
    nama: 'Terung',
    totalHari: 130,
    totalBulan: 4,
    zonaOldeman: 'Palawija (BL vegetatif, BK panen)',
    polaCh: ['BL', 'BL', 'BL', 'BK'],
    fase: [
      { nama: 'Lini (Initial)',     hariAwal: 1,   hariAkhir: 30,  durasi: 30, chButuh: 'BL', keterangan: 'Perkecambahan, pembibitan' },
      { nama: 'Ldev (Development)', hariAwal: 31,  hariAkhir: 70,  durasi: 40, chButuh: 'BL', keterangan: 'Vegetatif, pembentukan cabang' },
      { nama: 'Lmid (Mid-season)',  hariAwal: 71,  hariAkhir: 110, durasi: 40, chButuh: 'BL', keterangan: 'Pembungaan, pembentukan buah' },
      { nama: 'Llate (Late-season)',hariAwal: 111, hariAkhir: 130, durasi: 20, chButuh: 'BK', keterangan: 'Panen buah, akhir musim' },
    ],
    threshold: {
      suhuS1Min: 22, suhuS1Max: 30, suhuS2Min: 20, suhuS2Max: 32, suhuS3Min: 18, suhuS3Max: 35,
      rhS1Min: 65,   rhS1Max: 80,   rhS2Min: 55,   rhS2Max: 85,   rhS3Min: 45,   rhS3Max: 90,
      katS1Min: 55,  katS2Min: 45,  katS3Min: 35,
    },
    referensi: 'Djaenudin et al. 2011 hal.75-76; FAO-56 Table 11; Oldeman 1975',
  },
]

// ─── Helper: cari threshold berdasarkan nama tanaman ─────────────────────────
export function getThresholdByNama(nama: string): TanamanThreshold | undefined {
  return THRESHOLD_TANAMAN.find(
    t => t.nama.toLowerCase() === nama.toLowerCase()
  )
}
