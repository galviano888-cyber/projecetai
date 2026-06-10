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
    async function fetch() {
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

    fetch()
  }, [tahun])

  return { data, loading, error }
}

// Ambil data bulan ini
export function useCurrentMonthClimate() {
  const [data, setData] = useState<ClimateData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const now = new Date()
      const bulan = now.getMonth() + 1
      const tahun = now.getFullYear()

      // Coba bulan ini dulu, kalau tidak ada ambil data terbaru
      const { data: exact } = await supabase
        .from('climate_data')
        .select('*')
        .eq('bulan', bulan)
        .eq('tahun', tahun)
        .single()

      if (exact) {
        setData(exact as ClimateData)
        setLoading(false)
        return
      }

      // Fallback: data terbaru
      const { data: latest } = await supabase
        .from('climate_data')
        .select('*')
        .order('tahun', { ascending: false })
        .order('bulan', { ascending: false })
        .limit(1)
        .single()

      setData(latest as ClimateData ?? null)
      setLoading(false)
    }

    fetch()
  }, [])

  return { data, loading }
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
    supabase
      .from('climate_data')
      .select('tahun')
      .order('tahun', { ascending: false })
      .then(({ data }) => {
        const unique = [...new Set((data ?? []).map((r: { tahun: number }) => r.tahun))]
        setYears(unique)
      })
  }, [])

  return years
}
