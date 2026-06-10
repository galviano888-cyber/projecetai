import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ClimateData } from '@/lib/supabase'

export interface ClimateDataWithMonth extends ClimateData {
  bulan_nama: string
}

const BULAN_NAMES = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
]

export function useClimateData(tahun?: number) {
  const [data, setData] = useState<ClimateDataWithMonth[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('climate_data')
        .select('*')
        .order('tahun', { ascending: true })
        .order('bulan', { ascending: true })

      if (tahun) {
        query = query.eq('tahun', tahun)
      }

      const { data: rows, error: err } = await query

      // Jika komponen sudah unmount sebelum fetch selesai, batalkan setState
      if (cancelled) return

      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }

      const mapped: ClimateDataWithMonth[] = (rows ?? []).map((r) => ({
        ...r,
        bulan_nama: BULAN_NAMES[r.bulan] ?? `Bln ${r.bulan}`,
      }))

      setData(mapped)
      setLoading(false)
    }

    fetchData()

    // Cleanup: tandai sebagai cancelled saat unmount
    return () => { cancelled = true }
  }, [tahun])

  return { data, loading, error }
}

// Ambil data bulan ini
export function useCurrentMonthClimate() {
  const [data, setData] = useState<ClimateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFallback, setIsFallback] = useState(false) // true jika data bukan bulan berjalan

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      const now = new Date()
      const bulan = now.getMonth() + 1
      const tahun = now.getFullYear()

      try {
        // Coba bulan ini dulu
        const { data: exact } = await supabase
          .from('climate_data')
          .select('*')
          .eq('bulan', bulan)
          .eq('tahun', tahun)
          .single()

        if (cancelled) return

        if (exact) {
          setData(exact as ClimateData)
          setIsFallback(false)
          setLoading(false)
          return
        }

        // Fallback: data terbaru yang tersedia
        const { data: latest, error: err } = await supabase
          .from('climate_data')
          .select('*')
          .order('tahun', { ascending: false })
          .order('bulan', { ascending: false })
          .limit(1)
          .single()

        if (cancelled) return

        if (err) {
          // PGRST116 = no rows found, bukan error sebenarnya
          if (err.code !== 'PGRST116') {
            setError(err.message)
          }
          setData(null)
          setIsFallback(false)
        } else {
          setData(latest as ClimateData ?? null)
          setIsFallback(true) // data ini fallback, bukan bulan berjalan
        }
      } catch (e) {
        if (!cancelled) {
          setError('Gagal memuat data iklim. Periksa koneksi internet.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()

    return () => { cancelled = true }
  }, [])

  return { data, loading, error, isFallback }
}

// Deteksi musim berdasarkan curah hujan
export function detectSeason(ch_mm: number): 'hujan' | 'kemarau' | 'pancaroba' {
  if (ch_mm >= 200) return 'hujan'
  if (ch_mm <= 100) return 'kemarau'
  return 'pancaroba'
}

// Ambil daftar tahun yang ada di database
export function useAvailableYears() {
  const [years, setYears] = useState<number[]>([])

  useEffect(() => {
    let cancelled = false

    supabase
      .from('climate_data')
      .select('tahun')
      .order('tahun', { ascending: false })
      .then(({ data }) => {
        if (cancelled) return
        const unique = [...new Set((data ?? []).map((r: { tahun: number }) => r.tahun))]
        setYears(unique)
      })

    return () => { cancelled = true }
  }, [])

  return years
}
