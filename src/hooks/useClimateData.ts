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

// Deteksi musim berdasarkan curah hujan
export function detectSeason(ch_mm: number): 'hujan' | 'kemarau' | 'pancaroba' {
  if (ch_mm >= 200) return 'hujan'
  if (ch_mm <= 100) return 'kemarau'
  return 'pancaroba'
}

// Ambil daftar tahun yang ada di database (distinct di server)
export function useAvailableYears() {
  const [years, setYears] = useState<number[]>([])

  useEffect(() => {
    let cancelled = false

    // Gunakan select dengan kolom tunggal agar Supabase bisa di-deduplicate,
    // lalu deduplicate di client karena Supabase JS tidak expose DISTINCT secara langsung.
    // Namun kita batasi jumlah row yang ditarik dengan hanya memilih kolom tahun.
    supabase
      .from('climate_data')
      .select('tahun')
      .order('tahun', { ascending: false })
      .then(({ data }) => {
        if (cancelled) return
        // Deduplicate di client — payload tetap kecil karena hanya kolom tahun yang ditarik
        const unique = [...new Set((data ?? []).map((r: { tahun: number }) => r.tahun))]
        setYears(unique)
      })

    return () => { cancelled = true }
  }, [])

  return years
}
