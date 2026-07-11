import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { ClimateData } from '@/lib/supabase'

interface ClimateContextValue {
  currentClimate: ClimateData | null
  loading: boolean
  error: string | null
  isFallback: boolean
}

const ClimateContext = createContext<ClimateContextValue>({
  currentClimate: null,
  loading: true,
  error: null,
  isFallback: false,
})

export function ClimateProvider({ children }: { children: ReactNode }) {
  const [currentClimate, setCurrentClimate] = useState<ClimateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFallback, setIsFallback] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      const now = new Date()
      const bulan = now.getMonth() + 1
      const tahun = now.getFullYear()

      try {
        // Coba bulan ini dulu — tangkap error agar tidak lanjut ke fallback
        // saat query memang gagal (bukan sekadar no rows).
        const { data: exact, error: exactErr } = await supabase
          .from('climate_data')
          .select('*')
          .eq('bulan', bulan)
          .eq('tahun', tahun)
          .single()

        if (cancelled) return

        // PGRST116 = no rows → lanjut ke fallback. Error lain → lempar.
        if (exactErr && exactErr.code !== 'PGRST116') {
          throw new Error(exactErr.message)
        }

        if (exact) {
          setCurrentClimate(exact as ClimateData)
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
          setCurrentClimate(null)
          setIsFallback(false)
        } else {
          setCurrentClimate((latest as ClimateData) ?? null)
          setIsFallback(true)
        }
      } catch {
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

  return (
    <ClimateContext.Provider value={{ currentClimate, loading, error, isFallback }}>
      {children}
    </ClimateContext.Provider>
  )
}

/**
 * Hook untuk mengakses data iklim bulan ini dari Context.
 * Gunakan ini sebagai pengganti useCurrentMonthClimate() di semua komponen.
 */
export function useCurrentClimate() {
  return useContext(ClimateContext)
}
