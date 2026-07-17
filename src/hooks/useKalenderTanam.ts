import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  hitungKalenderTanamLengkap,
  rekomendasiBulan,
  hitungTanamanByNama,
  type HasilKalenderTanam,
  type IklimBulan,
} from '@/lib/kalenderTanam'
import {
  DEFAULT_CF_RULE,
  THRESHOLD_TANAMAN,
  type CfRule,
  type TanamanThreshold,
  type OldemanKelas,
} from '@/lib/thresholdData'

/**
 * Ambil nilai CF[rule] dari tabel cf_rule di Supabase.
 * Jika tabel kosong / gagal, fallback ke DEFAULT_CF_RULE (literatur).
 */
async function fetchCfRule(): Promise<CfRule> {
  const { data, error } = await supabase.from('cf_rule').select('parameter, cf_value')
  if (error || !data || data.length === 0) return DEFAULT_CF_RULE

  const map: Record<string, number> = {}
  for (const row of data as { parameter: string; cf_value: number }[]) {
    map[row.parameter] = row.cf_value
  }
  return {
    ch:   map.ch   ?? DEFAULT_CF_RULE.ch,
    suhu: map.suhu ?? DEFAULT_CF_RULE.suhu,
    rh:   map.rh   ?? DEFAULT_CF_RULE.rh,
    kat:  map.kat  ?? DEFAULT_CF_RULE.kat,
  }
}

/**
 * Ambil threshold tanaman dari tabel threshold_tanaman di Supabase.
 * Konversi dari format DB (snake_case) ke format engine (camelCase).
 * Jika tabel kosong / gagal, fallback ke THRESHOLD_TANAMAN hardcoded.
 *
 * Catatan: fase tumbuh (Lini/Ldev/Lmid/Llate) tidak disimpan di DB —
 * tetap menggunakan data FAO-56 Table 11 dari thresholdData.ts karena
 * fase adalah konstanta ilmiah, bukan parameter yang perlu diubah admin.
 */
async function fetchThreshold(): Promise<TanamanThreshold[]> {
  const { data, error } = await supabase
    .from('threshold_tanaman')
    .select('*')
    .order('nama_tanaman')

  if (error || !data || data.length === 0) return THRESHOLD_TANAMAN

  return data.map((d: {
    nama_tanaman: string
    total_hari: number
    total_bulan: number
    pola_ch: string
    suhu_s1_min: number; suhu_s1_max: number
    suhu_s2_min: number; suhu_s2_max: number
    suhu_s3_min: number; suhu_s3_max: number
    rh_s1_min: number; rh_s1_max: number
    rh_s2_min: number; rh_s2_max: number
    rh_s3_min: number; rh_s3_max: number
    kat_s1_min: number; kat_s2_min: number; kat_s3_min: number
    referensi?: string
  }): TanamanThreshold => {
    // Cari data fase dari THRESHOLD_TANAMAN hardcoded (FAO-56)
    const base = THRESHOLD_TANAMAN.find(t => t.nama === d.nama_tanaman)
    const polaCh = d.pola_ch.split(',').map(s => s.trim() as OldemanKelas)

    return {
      nama: d.nama_tanaman,
      totalHari: d.total_hari,
      totalBulan: d.total_bulan,
      zonaOldeman: base?.zonaOldeman ?? '',
      polaCh,
      fase: base?.fase ?? [],
      threshold: {
        suhuS1Min: d.suhu_s1_min, suhuS1Max: d.suhu_s1_max,
        suhuS2Min: d.suhu_s2_min, suhuS2Max: d.suhu_s2_max,
        suhuS3Min: d.suhu_s3_min, suhuS3Max: d.suhu_s3_max,
        rhS1Min: d.rh_s1_min,   rhS1Max: d.rh_s1_max,
        rhS2Min: d.rh_s2_min,   rhS2Max: d.rh_s2_max,
        rhS3Min: d.rh_s3_min,   rhS3Max: d.rh_s3_max,
        katS1Min: d.kat_s1_min,
        katS2Min: d.kat_s2_min,
        katS3Min: d.kat_s3_min,
      },
      referensi: d.referensi ?? base?.referensi ?? '',
    }
  })
}

/**
 * Ambil data prediksi iklim BMKG untuk tahun + tahun depan
 * (masa tumbuh bisa menyeberang tahun).
 *
 * Sumber utama: tabel prediksi_iklim (menu admin "Prediksi BMKG").
 * Fallback   : tabel climate_data (menu admin "Data Iklim") bila
 *              prediksi_iklim kosong, agar data tetap terpakai.
 */
async function fetchIklim(tahun: number): Promise<IklimBulan[]> {
  const { data, error } = await supabase
    .from('prediksi_iklim')
    .select('*')
    .in('tahun', [tahun, tahun + 1])
    .order('tahun', { ascending: true })
    .order('bulan', { ascending: true })

  if (!error && data && data.length > 0) {
    return data.map((d: {
      bulan: number; tahun: number; ch_mm: number
      suhu: number; kelembaban: number; kat?: number | null
    }) => ({
      bulan: d.bulan,
      tahun: d.tahun,
      ch_mm: d.ch_mm,
      suhu: d.suhu,
      kelembaban: d.kelembaban,
      kat: d.kat ?? undefined,
    }))
  }

  // Fallback: climate_data (kolom air_tanah dipakai sebagai KAT)
  const { data: cd, error: cdErr } = await supabase
    .from('climate_data')
    .select('*')
    .in('tahun', [tahun, tahun + 1])
    .order('bulan', { ascending: true })

  if (cdErr || !cd) return []

  return cd.map((d: {
    bulan: number; tahun: number; ch_mm: number
    suhu: number; kelembaban: number; air_tanah?: number | null
  }) => ({
    bulan: d.bulan,
    tahun: d.tahun,
    ch_mm: d.ch_mm,
    suhu: d.suhu,
    kelembaban: d.kelembaban,
    kat: d.air_tanah ?? undefined,
  }))
}

/**
 * Hook untuk memuat data prediksi iklim BMKG + nilai CF dari Supabase,
 * lalu menghitung kalender tanam untuk semua tanaman.
 *
 * Engine: kalenderTanam.ts (Forward Chaining + Certainty Factor)
 */
export function useKalenderTanam(tahun: number) {
  const [hasil, setHasil] = useState<Map<string, Map<number, HasilKalenderTanam>>>(new Map())
  const [iklim, setIklim] = useState<IklimBulan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      setLoading(true)
      setError(null)
      try {
        const [cfRule, iklimList, thresholdList] = await Promise.all([
          fetchCfRule(),
          fetchIklim(tahun),
          fetchThreshold(),
        ])
        if (cancelled) return
        setIklim(iklimList)
        setHasil(hitungKalenderTanamLengkap(tahun, iklimList, cfRule, thresholdList))
      } catch (err) {
        console.error('Error useKalenderTanam:', err)
        if (!cancelled) setError('Gagal memuat data kalender tanam.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => { cancelled = true }
  }, [tahun])

  return { hasil, iklim, loading, error }
}

/**
 * Hook rekomendasi tanaman untuk satu bulan tanam tertentu,
 * diurutkan dari CF tertinggi. Memakai engine & knowledge base yang sama.
 */
export function useRekomendasiBulan(bulanTanam: number, tahunTanam: number, topN = 0) {
  const [hasil, setHasil] = useState<HasilKalenderTanam[]>([])
  const [loading, setLoading] = useState(true)
  const [adaData, setAdaData] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      setLoading(true)
      setError(null)
      try {
        const [cfRule, iklimList, thresholdList] = await Promise.all([
          fetchCfRule(),
          fetchIklim(tahunTanam),
          fetchThreshold(),
        ])
        if (cancelled) return
        setAdaData(iklimList.length > 0)
        setHasil(rekomendasiBulan(bulanTanam, tahunTanam, iklimList, cfRule, topN, thresholdList))
      } catch {
        if (!cancelled) setError('Gagal memuat data rekomendasi.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => { cancelled = true }
  }, [bulanTanam, tahunTanam, topN])

  return { hasil, loading, adaData, error }
}

/**
 * Hook untuk daftar tahun yang punya data prediksi iklim.
 */
export function useTahunPrediksi() {
  const [years, setYears] = useState<number[]>([])

  useEffect(() => {
    let cancelled = false
    async function run() {
      const [{ data: pred }, { data: cd }] = await Promise.all([
        supabase.from('prediksi_iklim').select('tahun'),
        supabase.from('climate_data').select('tahun'),
      ])
      if (cancelled) return
      const all = [
        ...((pred ?? []) as { tahun: number }[]),
        ...((cd ?? []) as { tahun: number }[]),
      ].map(r => r.tahun)
      const unique = [...new Set(all)].sort((a, b) => b - a)
      setYears(unique)
    }
    run()
    return () => { cancelled = true }
  }, [])

  return years
}

/**
 * Hook CF satu tanaman (by nama) untuk bulan tanam tertentu.
 * Dipakai halaman Library: menampilkan badge kecocokan bila tanaman
 * ada di knowledge base (9 tanaman strategis). Mengembalikan null jika tidak.
 */
export function useCfTanaman(nama: string | undefined, bulanTanam: number, tahunTanam: number) {
  const [hasil, setHasil] = useState<HasilKalenderTanam | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!nama) { setHasil(null); setLoading(false); return }
      setLoading(true)
      const [cfRule, iklimList] = await Promise.all([fetchCfRule(), fetchIklim(tahunTanam)])
      if (cancelled) return
      setHasil(hitungTanamanByNama(nama, bulanTanam, tahunTanam, iklimList, cfRule))
      setLoading(false)
    }
    run()
    return () => { cancelled = true }
  }, [nama, bulanTanam, tahunTanam])

  return { hasil, loading }
}

/**
 * Hook CF banyak tanaman sekaligus (by daftar nama) untuk satu bulan tanam.
 * Mengembalikan Map<namaLowerCase, HasilKalenderTanam>.
 */
export function useCfTanamanBatch(namaList: string[], bulanTanam: number, tahunTanam: number) {
  const [map, setMap] = useState<Map<string, HasilKalenderTanam>>(new Map())
  const [loading, setLoading] = useState(true)
  const key = namaList.join('|')

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      const [cfRule, iklimList] = await Promise.all([fetchCfRule(), fetchIklim(tahunTanam)])
      if (cancelled) return
      const m = new Map<string, HasilKalenderTanam>()
      for (const nama of namaList) {
        const r = hitungTanamanByNama(nama, bulanTanam, tahunTanam, iklimList, cfRule)
        if (r) m.set(nama.toLowerCase(), r)
      }
      setMap(m)
      setLoading(false)
    }
    run()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, bulanTanam, tahunTanam])

  return { map, loading }
}

// ─── Dashboard: data prediksi iklim untuk grafik & stat ────────────────────────

export interface PrediksiBulan {
  bulan: number
  bulan_nama: string
  ch_mm: number
  suhu: number
  kelembaban: number
  air_tanah: number   // dari kolom kat (% kapasitas lapang)
}

const BULAN_SHORT = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
]

/**
 * Hook data prediksi iklim BMKG untuk dashboard user.
 * Mengembalikan deret 12 bulan (chart-ready) + data bulan berjalan.
 * Sumber: tabel prediksi_iklim (yang diisi admin di menu Prediksi BMKG).
 */
export function usePrediksiIklim(tahun: number) {
  const [data, setData] = useState<PrediksiBulan[]>([])
  const [current, setCurrent] = useState<PrediksiBulan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      // Sumber utama: prediksi_iklim
      let rows: { bulan: number; ch_mm: number; suhu: number; kelembaban: number; kat: number | null }[] = []
      const { data: pred } = await supabase
        .from('prediksi_iklim')
        .select('*')
        .eq('tahun', tahun)
        .order('bulan', { ascending: true })

      if (pred && pred.length > 0) {
        rows = (pred as { bulan: number; ch_mm: number; suhu: number; kelembaban: number; kat: number | null }[]).map((d) => ({
          bulan: d.bulan, ch_mm: d.ch_mm, suhu: d.suhu,
          kelembaban: d.kelembaban, kat: d.kat,
        }))
      } else {
        // Fallback: climate_data (air_tanah -> kat)
        const { data: cd } = await supabase
          .from('climate_data')
          .select('*')
          .eq('tahun', tahun)
          .order('bulan', { ascending: true })
        rows = ((cd ?? []) as { bulan: number; ch_mm: number; suhu: number; kelembaban: number; air_tanah: number | null }[]).map((d) => ({
          bulan: d.bulan, ch_mm: d.ch_mm, suhu: d.suhu,
          kelembaban: d.kelembaban, kat: d.air_tanah,
        }))
      }

      if (cancelled) return

      const mapped: PrediksiBulan[] = rows.map((d) => ({
        bulan: d.bulan,
        bulan_nama: BULAN_SHORT[d.bulan] ?? `Bln ${d.bulan}`,
        ch_mm: d.ch_mm,
        suhu: d.suhu,
        kelembaban: d.kelembaban,
        air_tanah: d.kat ?? 0,
      }))

      setData(mapped)

      // Bulan berjalan, fallback ke data terakhir yang tersedia
      const bulanIni = new Date().getMonth() + 1
      const exact = mapped.find(m => m.bulan === bulanIni)
      setCurrent(exact ?? mapped[mapped.length - 1] ?? null)
      setLoading(false)
    }
    run()
    return () => { cancelled = true }
  }, [tahun])

  return { data, current, loading }
}
