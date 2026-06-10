import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY harus diisi di file .env.local'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
