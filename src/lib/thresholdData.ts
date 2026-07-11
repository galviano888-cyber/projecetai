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
  // Ref Fase: FAO-56 Table 11 (Paddy rice, tropics) — disesuaikan varietas
  //           genjah lokal Indonesia (Ciherang, IR64, Inpari): 110-120 HST
  //           FAO-56 tropics: Lini=20, Ldev=30, Lmid=55, Llate=15 → 120 hari
  // Zona Oldeman: B1-C1 (butuh >= 4 BB berturut)
  // =========================================================================
  {
    nama: 'Padi Sawah',
    totalHari: 120,
    totalBulan: 4,
    zonaOldeman: 'B1-C1 (padi butuh >= 4 BB berturut)',
    polaCh: ['BB', 'BB', 'BB', 'BL'],
    fase: [
      { nama: 'Lini (Initial)',     hariAwal: 1,  hariAkhir: 20,  durasi: 20, chButuh: 'BB', keterangan: 'Perkecambahan, pembibitan, awal tanam' },
      { nama: 'Ldev (Development)', hariAwal: 21, hariAkhir: 50,  durasi: 30, chButuh: 'BB', keterangan: 'Vegetatif awal, pembentukan anakan' },
      { nama: 'Lmid (Mid-season)',  hariAwal: 51, hariAkhir: 105, durasi: 55, chButuh: 'BB', keterangan: 'Anakan aktif, pembungaan, pengisian biji' },
      { nama: 'Llate (Late-season)',hariAwal: 106, hariAkhir: 120, durasi: 15, chButuh: 'BL', keterangan: 'Pemasakan bulir, persiapan panen' },
    ],
    threshold: {
      suhuS1Min: 24, suhuS1Max: 29, suhuS2Min: 22, suhuS2Max: 32, suhuS3Min: 20, suhuS3Max: 35,
      rhS1Min: 70,   rhS1Max: 90,   rhS2Min: 60,   rhS2Max: 95,   rhS3Min: 50,   rhS3Max: 98,
      katS1Min: 80,  katS2Min: 70,  katS3Min: 60,
    },
    referensi: 'Djaenudin et al. 2011 hal.11-12; FAO-56 Table 11 (Paddy rice tropics); Oldeman 1975; BBPADI 2015 (var. Ciherang/Inpari)',
  },

  // =========================================================================
  // 2. JAGUNG
  // Ref Suhu/RH/KAT: Djaenudin 2011 hal.21-22
  // Ref Fase: FAO-56 Table 11 (Maize, field corn) — disesuaikan varietas lokal
  //           Indonesia (Pioneer P27, NK212, Bisi-2): 95-110 HST
  //           FAO-56: Lini=20, Ldev=35, Lmid=40, Llate=10 → 105 hari
  // Zona Oldeman: C2-D2 (palawija, BL vegetatif, BK panen)
  // =========================================================================
  {
    nama: 'Jagung',
    totalHari: 105,
    totalBulan: 4,
    zonaOldeman: 'C2-D2 (palawija, BL vegetatif, BK panen)',
    polaCh: ['BL', 'BL', 'BL', 'BK'],
    fase: [
      { nama: 'Lini (Initial)',     hariAwal: 1,   hariAkhir: 20,  durasi: 20, chButuh: 'BL', keterangan: 'Perkecambahan, emergence' },
      { nama: 'Ldev (Development)', hariAwal: 21,  hariAkhir: 55,  durasi: 35, chButuh: 'BL', keterangan: 'Vegetatif, pembentukan daun' },
      { nama: 'Lmid (Mid-season)',  hariAwal: 56,  hariAkhir: 95,  durasi: 40, chButuh: 'BL', keterangan: 'Pembungaan, pengisian biji' },
      { nama: 'Llate (Late-season)',hariAwal: 96,  hariAkhir: 105, durasi: 10, chButuh: 'BK', keterangan: 'Pemasakan biji, panen' },
    ],
    threshold: {
      suhuS1Min: 21, suhuS1Max: 30, suhuS2Min: 18, suhuS2Max: 32, suhuS3Min: 15, suhuS3Max: 35,
      rhS1Min: 60,   rhS1Max: 80,   rhS2Min: 50,   rhS2Max: 85,   rhS3Min: 40,   rhS3Max: 90,
      katS1Min: 55,  katS2Min: 45,  katS3Min: 35,
    },
    referensi: 'Djaenudin et al. 2011 hal.21-22; FAO-56 Table 11 (Maize field corn); Oldeman 1975; Badan Litbang Pertanian 2011',
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
  // Ref Fase: FAO-56 Table 11 (Onion, short-day) — disesuaikan varietas lokal
  //           Indonesia (Brebes, Bima Brebes, Tuk-Tuk): 60-75 HST
  //           FAO-56 short-day onion: Lini=15, Ldev=25, Lmid=20, Llate=10 → 70 hari
  // Zona Oldeman: Palawija (BL vegetatif, BK panen)
  // =========================================================================
  {
    nama: 'Bawang Merah',
    totalHari: 70,
    totalBulan: 3,
    zonaOldeman: 'Palawija (BL vegetatif, BK panen)',
    polaCh: ['BL', 'BL', 'BK'],
    fase: [
      { nama: 'Lini (Initial)',     hariAwal: 1,  hariAkhir: 15, durasi: 15, chButuh: 'BL', keterangan: 'Pertunasan, perkecambahan umbi bibit' },
      { nama: 'Ldev (Development)', hariAwal: 16, hariAkhir: 40, durasi: 25, chButuh: 'BL', keterangan: 'Vegetatif, pembentukan dan pemanjangan daun' },
      { nama: 'Lmid (Mid-season)',  hariAwal: 41, hariAkhir: 60, durasi: 20, chButuh: 'BL', keterangan: 'Pembesaran dan pematangan umbi' },
      { nama: 'Llate (Late-season)',hariAwal: 61, hariAkhir: 70, durasi: 10, chButuh: 'BK', keterangan: 'Pengeringan daun, panen umbi' },
    ],
    threshold: {
      suhuS1Min: 25, suhuS1Max: 32, suhuS2Min: 22, suhuS2Max: 35, suhuS3Min: 20, suhuS3Max: 38,
      rhS1Min: 65,   rhS1Max: 80,   rhS2Min: 55,   rhS2Max: 85,   rhS3Min: 45,   rhS3Max: 90,
      katS1Min: 60,  katS2Min: 50,  katS3Min: 40,
    },
    referensi: 'Djaenudin et al. 2011 hal.55-56; FAO-56 Table 11 (Onion short-day); Oldeman 1975; Puslitbang Hortikultura 2015 (var. Bima Brebes)',
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
  // Ref Fase: FAO-56 Table 11 (Pepper) — disesuaikan varietas lokal Indonesia
  //           (TM999, Lado, Keriting Lokal): panen perdana 75-90 HST setelah
  //           tanam pindah, total s/d panen perdana ~150 hari dari semai
  //           FAO-56: Lini=25, Ldev=35, Lmid=40, Llate=20 → 120h di lapang
  //           + 30 hari masa semai = 150 hari total (semai→panen perdana)
  // Zona Oldeman: Palawija sepanjang tahun (BL semua fase)
  // =========================================================================
  {
    nama: 'Cabai Keriting',
    totalHari: 150,
    totalBulan: 5,
    zonaOldeman: 'Palawija sepanjang tahun (BL semua fase)',
    polaCh: ['BL', 'BL', 'BL', 'BL', 'BL'],
    fase: [
      { nama: 'Lini (Semai+Initial)',  hariAwal: 1,   hariAkhir: 40,  durasi: 40, chButuh: 'BL', keterangan: 'Semai, perkecambahan, pindah tanam' },
      { nama: 'Ldev (Development)',    hariAwal: 41,  hariAkhir: 80,  durasi: 40, chButuh: 'BL', keterangan: 'Vegetatif, pembentukan cabang utama' },
      { nama: 'Lmid (Mid-season)',     hariAwal: 81,  hariAkhir: 130, durasi: 50, chButuh: 'BL', keterangan: 'Pembungaan, pembentukan buah pertama' },
      { nama: 'Llate (Late-season)',   hariAwal: 131, hariAkhir: 150, durasi: 20, chButuh: 'BL', keterangan: 'Panen perdana, awal panen rutin' },
    ],
    threshold: {
      suhuS1Min: 24, suhuS1Max: 30, suhuS2Min: 22, suhuS2Max: 32, suhuS3Min: 18, suhuS3Max: 35,
      rhS1Min: 65,   rhS1Max: 80,   rhS2Min: 55,   rhS2Max: 85,   rhS3Min: 45,   rhS3Max: 90,
      katS1Min: 60,  katS2Min: 50,  katS3Min: 40,
    },
    referensi: 'Djaenudin et al. 2011 hal.61-62; FAO-56 Table 11 (Pepper); Oldeman 1975; Puslitbang Hortikultura 2014 (var. TM999/Lado)',
  },

  // =========================================================================
  // 7. PETSAI/SAWI
  // Ref Suhu/RH/KAT: Djaenudin 2011 hal.73-74 (modif. var. dataran rendah)
  //                  AVRDC 2005 - Vegetable Production Training Manual
  // Ref Fase: FAO-56 Table 11 (Cabbage/Chinese cabbage) — disesuaikan varietas
  //           sawi lokal Indonesia (Sawi Hijau, Caisim, Pakcoy): 30-45 HST
  //           FAO-56 cabbage: Lini=10, Ldev=20, Lmid=10, Llate=5 → 45 hari
  // Zona Oldeman: Palawija (BL semua fase)
  // =========================================================================
  {
    nama: 'Petsai/Sawi',
    totalHari: 45,
    totalBulan: 2,
    zonaOldeman: 'Palawija (BL semua fase)',
    polaCh: ['BL', 'BL'],
    fase: [
      { nama: 'Lini+Ldev (Init+Dev)', hariAwal: 1,  hariAkhir: 30, durasi: 30, chButuh: 'BL', keterangan: 'Perkecambahan, pembentukan daun awal' },
      { nama: 'Lmid+Llate (Mid+Late)',hariAwal: 31, hariAkhir: 45, durasi: 15, chButuh: 'BL', keterangan: 'Pengisian daun, panen' },
    ],
    threshold: {
      suhuS1Min: 22, suhuS1Max: 32, suhuS2Min: 20, suhuS2Max: 35, suhuS3Min: 18, suhuS3Max: 38,
      rhS1Min: 70,   rhS1Max: 85,   rhS2Min: 60,   rhS2Max: 90,   rhS3Min: 50,   rhS3Max: 95,
      katS1Min: 65,  katS2Min: 55,  katS3Min: 45,
    },
    referensi: 'Djaenudin et al. 2011 hal.73-74 (modif. dataran rendah); AVRDC 2005; FAO-56 Table 11 (Cabbage); Oldeman 1975; Balitsa 2012 (var. Caisim/Pakcoy)',
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
  // Ref Fase: FAO-56 Table 11 (Pepper) — disesuaikan varietas lokal Indonesia
  //           (Cabai Rawit Putih, Cabai Kathur): lebih toleran suhu tinggi,
  //           panen perdana sedikit lebih lambat dari cabai keriting ~150h
  //           FAO-56 pepper: Lini=25, Ldev=35, Lmid=40, Llate=20 → 120h lapang
  //           + 30 hari semai = 150 hari total (semai→panen perdana)
  // Zona Oldeman: Palawija sepanjang tahun (BL semua fase)
  // =========================================================================
  {
    nama: 'Cabai Rawit',
    totalHari: 150,
    totalBulan: 5,
    zonaOldeman: 'Palawija sepanjang tahun (BL semua fase)',
    polaCh: ['BL', 'BL', 'BL', 'BL', 'BL'],
    fase: [
      { nama: 'Lini (Semai+Initial)',  hariAwal: 1,   hariAkhir: 40,  durasi: 40, chButuh: 'BL', keterangan: 'Semai, perkecambahan, pindah tanam' },
      { nama: 'Ldev (Development)',    hariAwal: 41,  hariAkhir: 80,  durasi: 40, chButuh: 'BL', keterangan: 'Vegetatif, pembentukan cabang utama' },
      { nama: 'Lmid (Mid-season)',     hariAwal: 81,  hariAkhir: 130, durasi: 50, chButuh: 'BL', keterangan: 'Pembungaan, pembentukan buah pertama' },
      { nama: 'Llate (Late-season)',   hariAwal: 131, hariAkhir: 150, durasi: 20, chButuh: 'BL', keterangan: 'Panen perdana, awal panen rutin' },
    ],
    threshold: {
      suhuS1Min: 24, suhuS1Max: 32, suhuS2Min: 20, suhuS2Max: 35, suhuS3Min: 18, suhuS3Max: 38,
      rhS1Min: 65,   rhS1Max: 80,   rhS2Min: 55,   rhS2Max: 85,   rhS3Min: 45,   rhS3Max: 90,
      katS1Min: 55,  katS2Min: 45,  katS3Min: 35,
    },
    referensi: 'Djaenudin et al. 2011 hal.63-64; FAO-56 Table 11 (Pepper); Oldeman 1975; Puslitbang Hortikultura 2014 (var. Rawit Putih/Kathur)',
  },

  // =========================================================================
  // 10. TERUNG
  // Ref Suhu/RH/KAT: Djaenudin 2011 hal.75-76
  // Ref Fase: FAO-56 Table 11 (Eggplant) — disesuaikan varietas lokal Indonesia
  //           (Terung Ungu, Terung Hijau Lokal): panen perdana 60-75 HST setelah
  //           tanam pindah (~75 HST dari semai), total ~90 hari semai→panen perdana
  //           FAO-56 eggplant: Lini=15, Ldev=30, Lmid=35, Llate=10 → 90 hari
  // Zona Oldeman: Palawija (BL vegetatif, BK panen)
  // =========================================================================
  {
    nama: 'Terung',
    totalHari: 90,
    totalBulan: 3,
    zonaOldeman: 'Palawija (BL vegetatif, BK panen)',
    polaCh: ['BL', 'BL', 'BK'],
    fase: [
      { nama: 'Lini (Initial)',     hariAwal: 1,  hariAkhir: 15, durasi: 15, chButuh: 'BL', keterangan: 'Semai, perkecambahan, pindah tanam' },
      { nama: 'Ldev (Development)', hariAwal: 16, hariAkhir: 45, durasi: 30, chButuh: 'BL', keterangan: 'Vegetatif, pembentukan cabang dan bunga' },
      { nama: 'Lmid (Mid-season)',  hariAwal: 46, hariAkhir: 80, durasi: 35, chButuh: 'BL', keterangan: 'Pembungaan, pembentukan buah' },
      { nama: 'Llate (Late-season)',hariAwal: 81, hariAkhir: 90, durasi: 10, chButuh: 'BK', keterangan: 'Panen perdana buah terung' },
    ],
    threshold: {
      suhuS1Min: 22, suhuS1Max: 30, suhuS2Min: 20, suhuS2Max: 32, suhuS3Min: 18, suhuS3Max: 35,
      rhS1Min: 65,   rhS1Max: 80,   rhS2Min: 55,   rhS2Max: 85,   rhS3Min: 45,   rhS3Max: 90,
      katS1Min: 55,  katS2Min: 45,  katS3Min: 35,
    },
    referensi: 'Djaenudin et al. 2011 hal.75-76; FAO-56 Table 11 (Eggplant); Oldeman 1975; Balitsa 2013 (var. Terung Ungu Lokal)',
  },
]

// ─── Helper: cari threshold berdasarkan nama tanaman ─────────────────────────
export function getThresholdByNama(nama: string): TanamanThreshold | undefined {
  return THRESHOLD_TANAMAN.find(
    t => t.nama.toLowerCase() === nama.toLowerCase()
  )
}
