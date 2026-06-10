/**
 * AgroDemak - Sistem Pakar Rule-Based
 * 
 * Metode: Forward Chaining + Certainty Factor (CF)
 * 
 * Sumber parameter syarat tumbuh:
 *   [1] Ritung, S. et al. (2011). Petunjuk Teknis Evaluasi Lahan untuk
 *       Komoditas Pertanian (Edisi Revisi). BBSDLP, Badan Litbang
 *       Pertanian, Bogor. Hal. 24-131.
 *   [2] FAO AQUASTAT (2002). Crop Water Requirements.
 *       FAO Irrigation & Drainage Paper No. 56.
 *   [3] IRRI Knowledge Bank (2023). Climate & Soils - Rice Production.
 *   [4] Balitsa (2015, 2017). Budidaya Cabai & Bawang Merah. Lembang.
 *   [5] Balitkabi (2016). Deskripsi Varietas Unggul Kedelai. Malang.
 *   [6] AVRDC/WorldVeg (2003). Cultural Practices for Kangkong.
 */

import type { Commodity, ClimateData } from './supabase'

export interface RecommendationResult {
  commodity: Commodity
  skor_kecocokan: number   // 0-100
  grade: 'S1' | 'S2' | 'S3' | 'N'  // S1=sangat cocok, S2=cukup, S3=marjinal, N=tidak cocok
  grade_label: string
  catatan: string
  detail: ParameterDetail[]
}

export interface ParameterDetail {
  parameter: string
  nilai: number
  unit: string
  status: 'optimal' | 'marjinal' | 'tidak'
  keterangan: string
}

/**
 * Hitung skor kecocokan satu parameter menggunakan trapezoid fuzzy membership.
 * Nilai dalam rentang optimal = CF penuh.
 * Nilai dalam rentang toleransi (±20%) = CF sebagian.
 * Di luar toleransi = CF = 0.
 */
function fuzzyScore(
  nilai: number,
  min: number,
  max: number,
  toleransi = 0.20
): number {
  if (nilai >= min && nilai <= max) return 1.0

  const toleranMin = min * (1 - toleransi)
  const toleranMax = max * (1 + toleransi)

  if (nilai >= toleranMin && nilai < min) {
    // Ramp up
    return (nilai - toleranMin) / (min - toleranMin)
  }
  if (nilai > max && nilai <= toleranMax) {
    // Ramp down
    return (toleranMax - nilai) / (toleranMax - max)
  }

  return 0
}

/**
 * Bobot kepentingan tiap parameter (total = 1.0)
 * Berdasarkan tingkat kritis parameter terhadap pertumbuhan tanaman.
 * Sumber: Ritung et al. (2011) - framework kesesuaian lahan.
 */
const BOBOT = {
  ch:        0.35,  // Curah hujan - paling kritis (ketersediaan air)
  suhu:      0.30,  // Suhu - kritis (fotosintesis, metabolisme)
  kelembaban: 0.20, // Kelembaban - sedang (OPT, transpirasi)
  air_tanah:  0.15, // Air tanah - pendukung (cadangan air)
} as const

/**
 * Grade kesesuaian lahan (FAO / BBSDLP framework)
 * S1 >= 75 : Sangat Sesuai
 * S2 50-74 : Cukup Sesuai
 * S3 25-49 : Sesuai Marjinal
 * N  < 25  : Tidak Sesuai
 */
function getGrade(skor: number): {
  grade: RecommendationResult['grade']
  label: string
} {
  if (skor >= 75) return { grade: 'S1', label: 'Sangat Cocok' }
  if (skor >= 50) return { grade: 'S2', label: 'Cukup Cocok' }
  if (skor >= 25) return { grade: 'S3', label: 'Marjinal' }
  return { grade: 'N', label: 'Tidak Cocok' }
}

/**
 * Buat catatan otomatis berdasarkan parameter yang tidak optimal.
 */
function buildCatatan(
  commodity: Commodity,
  _climate: ClimateData,
  details: ParameterDetail[]
): string {
  const masalah = details.filter(d => d.status !== 'optimal')
  if (masalah.length === 0) {
    return `Kondisi iklim saat ini sangat ideal untuk ${commodity.nama}. Semua parameter berada dalam rentang optimal.`
  }

  const parts = masalah.map(d => {
    if (d.status === 'marjinal') return `${d.parameter} (${d.nilai} ${d.unit}) sedikit di luar rentang optimal`
    return `${d.parameter} (${d.nilai} ${d.unit}) tidak sesuai — ${d.keterangan}`
  })

  return `Perhatian: ${parts.join('; ')}.`
}

/**
 * Fungsi utama: hitung skor kecocokan satu komoditas terhadap kondisi iklim.
 */
export function scoreCommodity(
  commodity: Commodity,
  climate: ClimateData
): RecommendationResult {
  // Guard: pastikan data iklim valid sebelum kalkulasi
  const safeCH = Number.isFinite(climate.ch_mm) ? climate.ch_mm : 0
  const safeSuhu = Number.isFinite(climate.suhu) ? climate.suhu : 0
  const safeRH = Number.isFinite(climate.kelembaban) ? climate.kelembaban : 0
  const safeAir = Number.isFinite(climate.air_tanah) ? climate.air_tanah : 0

  const safeClimate: ClimateData = {
    ...climate,
    ch_mm: safeCH,
    suhu: safeSuhu,
    kelembaban: safeRH,
    air_tanah: safeAir,
  }

  const details: ParameterDetail[] = []

  // ─── Curah Hujan ───
  let chScore = 0.5 // default jika tidak ada data syarat
  if (commodity.ch_min != null && commodity.ch_max != null) {
    chScore = fuzzyScore(safeClimate.ch_mm, commodity.ch_min, commodity.ch_max)
    const chStatus = chScore >= 1 ? 'optimal' : chScore > 0 ? 'marjinal' : 'tidak'
    details.push({
      parameter: 'Curah Hujan',
      nilai: safeClimate.ch_mm,
      unit: 'mm/bln',
      status: chStatus,
      keterangan: chScore === 0
        ? safeClimate.ch_mm < commodity.ch_min
          ? `Terlalu kering, min ${commodity.ch_min} mm`
          : `Terlalu basah, max ${commodity.ch_max} mm`
        : `Rentang optimal ${commodity.ch_min}–${commodity.ch_max} mm`,
    })
  }

  // ─── Suhu ───
  let suhuScore = 0.5
  if (commodity.suhu_min != null && commodity.suhu_max != null) {
    suhuScore = fuzzyScore(safeClimate.suhu, commodity.suhu_min, commodity.suhu_max, 0.10)
    const suhuStatus = suhuScore >= 1 ? 'optimal' : suhuScore > 0 ? 'marjinal' : 'tidak'
    details.push({
      parameter: 'Suhu',
      nilai: safeClimate.suhu,
      unit: '°C',
      status: suhuStatus,
      keterangan: suhuScore === 0
        ? safeClimate.suhu < commodity.suhu_min
          ? `Terlalu dingin, min ${commodity.suhu_min}°C`
          : `Terlalu panas, max ${commodity.suhu_max}°C`
        : `Rentang optimal ${commodity.suhu_min}–${commodity.suhu_max}°C`,
    })
  }

  // ─── Kelembaban ───
  let rhScore = 0.5
  if (commodity.kelembaban_min != null && commodity.kelembaban_max != null) {
    rhScore = fuzzyScore(safeClimate.kelembaban, commodity.kelembaban_min, commodity.kelembaban_max, 0.15)
    const rhStatus = rhScore >= 1 ? 'optimal' : rhScore > 0 ? 'marjinal' : 'tidak'
    details.push({
      parameter: 'Kelembaban',
      nilai: safeClimate.kelembaban,
      unit: '%',
      status: rhStatus,
      keterangan: rhScore === 0
        ? safeClimate.kelembaban < commodity.kelembaban_min
          ? `Terlalu kering, min ${commodity.kelembaban_min}%`
          : `Terlalu lembab, max ${commodity.kelembaban_max}%`
        : `Rentang optimal ${commodity.kelembaban_min}–${commodity.kelembaban_max}%`,
    })
  }

  // ─── Air Tanah ───
  let airScore = 0.5
  if (commodity.air_tanah_min != null) {
    if (safeClimate.air_tanah >= commodity.air_tanah_min) {
      airScore = 1.0
    } else {
      const toleranMin = commodity.air_tanah_min * 0.7
      airScore = safeClimate.air_tanah >= toleranMin
        ? (safeClimate.air_tanah - toleranMin) / (commodity.air_tanah_min - toleranMin)
        : 0
    }
    const airStatus = airScore >= 1 ? 'optimal' : airScore > 0 ? 'marjinal' : 'tidak'
    details.push({
      parameter: 'Air Tanah',
      nilai: safeClimate.air_tanah,
      unit: 'mm/hr',
      status: airStatus,
      keterangan: airScore === 0
        ? `Ketersediaan air tanah sangat rendah, min ${commodity.air_tanah_min} mm/hr`
        : `Minimum ${commodity.air_tanah_min} mm/hr`,
    })
  }

  // ─── Hitung skor tertimbang (weighted CF) ───
  const skorRaw =
    chScore        * BOBOT.ch +
    suhuScore      * BOBOT.suhu +
    rhScore        * BOBOT.kelembaban +
    airScore       * BOBOT.air_tanah

  // Guard NaN: jika kalkulasi menghasilkan NaN karena data tidak valid, fallback ke 0
  const skorRawSafe = Number.isFinite(skorRaw) ? skorRaw : 0
  const skor_kecocokan = Math.round(Math.min(100, Math.max(0, skorRawSafe * 100)))
  const { grade, label } = getGrade(skor_kecocokan)

  return {
    commodity,
    skor_kecocokan,
    grade,
    grade_label: label,
    catatan: buildCatatan(commodity, climate, details),
    detail: details,
  }
}

/**
 * Hitung rekomendasi untuk semua komoditas, urutkan dari skor tertinggi.
 * Return top N komoditas.
 */
export function getTopRecommendations(
  commodities: Commodity[],
  climate: ClimateData,
  topN = 3
): RecommendationResult[] {
  return commodities
    .map(c => scoreCommodity(c, climate))
    .sort((a, b) => b.skor_kecocokan - a.skor_kecocokan)
    .slice(0, topN)
}

/**
 * Simpan hasil rekomendasi ke tabel recommendations di Supabase.
 */
import { supabase } from './supabase'

export async function saveRecommendations(
  results: RecommendationResult[],
  bulan: number
): Promise<void> {
  const rows = results.map(r => ({
    bulan,
    commodity_id: r.commodity.id!,
    skor_kecocokan: r.skor_kecocokan,
    catatan: r.catatan,
  }))

  // Hapus rekomendasi bulan ini dulu, lalu insert baru
  await supabase.from('recommendations').delete().eq('bulan', bulan)
  await supabase.from('recommendations').insert(rows)
}
