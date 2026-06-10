import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!supabaseUrl || supabaseUrl === 'https://YOUR_PROJECT_ID.supabase.co') {
  console.error(
    '[AgroDemak] VITE_SUPABASE_URL belum diisi di file .env.local. ' +
    'Salin .env.local dan isi dengan nilai dari Supabase Dashboard > Settings > API.'
  )
}

if (!supabaseAnonKey || supabaseAnonKey === 'YOUR_ANON_KEY') {
  console.error(
    '[AgroDemak] VITE_SUPABASE_ANON_KEY belum diisi di file .env.local.'
  )
}

// Fallback agar app tidak crash total saat env belum diisi (misal saat development awal)
export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-key'
)

// ─── Type Definitions ───────────────────────────────────────────────
export interface ClimateData {
  id?: string
  bulan: number
  tahun: number
  ch_mm: number
  suhu: number
  kelembaban: number
  air_tanah: number
  created_at?: string
}

export interface Commodity {
  id?: string
  nama: string
  nama_ilmiah?: string
  deskripsi?: string
  foto_url?: string
  ch_min?: number
  ch_max?: number
  suhu_min?: number
  suhu_max?: number
  kelembaban_min?: number
  kelembaban_max?: number
  air_tanah_min?: number
  waktu_tanam?: string
  durasi_panen?: string
  jarak_tanam?: string
  info_pupuk?: string
  hama?: string
  risiko?: string
  musim?: string
  created_at?: string
}

export interface Recommendation {
  id?: string
  bulan: number
  commodity_id: string
  skor_kecocokan: number
  catatan?: string
  created_at?: string
  commodities?: Commodity
}

export interface Library {
  id?: string
  commodity_id: string
  konten_detail?: string
  tips_budidaya?: string
  hama_umum?: string
  cara_pencegahan?: string
  created_at?: string
  commodities?: Commodity
}
