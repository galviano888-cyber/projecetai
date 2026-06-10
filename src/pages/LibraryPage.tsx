import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Commodity, Library } from '@/lib/supabase'
import { useCurrentMonthClimate } from '@/hooks/useClimateData'
import { scoreCommodity } from '@/lib/expertSystem'
import { Card, CardContent } from '@/components/ui/card'
import {
  Sprout, Search, Leaf, CloudRain, Sun, Wind,
  ChevronRight, BookOpen
} from 'lucide-react'

const MUSIM_CONFIG: Record<string, { label: string; icon: typeof CloudRain; color: string }> = {
  hujan:           { label: 'Musim Hujan',     icon: CloudRain, color: 'bg-agri-blue/10 text-agri-blue border-agri-blue/20' },
  kemarau:         { label: 'Musim Kemarau',   icon: Sun,       color: 'bg-agri-yellow/20 text-amber-800 border-agri-yellow/40' },
  sepanjang_tahun: { label: 'Sepanjang Tahun', icon: Wind,      color: 'bg-agri-green/10 text-agri-green-dark border-agri-green/20' },
}

const GRADE_BADGE: Record<string, string> = {
  S1: 'bg-agri-green text-white',
  S2: 'bg-agri-yellow text-amber-900',
  S3: 'bg-orange-400 text-white',
  N:  'bg-muted text-muted-foreground',
}

const GRADE_LABEL: Record<string, string> = {
  S1: 'Cocok Bulan Ini',
  S2: 'Cukup Cocok',
  S3: 'Marjinal',
  N:  'Kurang Cocok',
}

type FilterMusim = 'semua' | 'hujan' | 'kemarau' | 'sepanjang_tahun'

export default function LibraryPage() {
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [libraries, setLibraries] = useState<Record<string, Library>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterMusim>('semua')
  const { data: currentClimate } = useCurrentMonthClimate()

  useEffect(() => {
    async function fetchData() {
      const [{ data: comms }, { data: libs }] = await Promise.all([
        supabase.from('commodities').select('*').order('nama'),
        supabase.from('library').select('*'),
      ])
      setCommodities((comms as Commodity[]) ?? [])
      const libMap: Record<string, Library> = {}
      ;((libs as Library[]) ?? []).forEach(l => { if (l.commodity_id) libMap[l.commodity_id] = l })
      setLibraries(libMap)
      setLoading(false)
    }
    fetchData()
  }, [])

  const filtered = commodities.filter(c => {
    const matchSearch = c.nama.toLowerCase().includes(search.toLowerCase()) ||
      (c.nama_ilmiah ?? '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'semua' || c.musim === filter
    return matchSearch && matchFilter
  })

  // Hitung skor kecocokan bulan ini
  function getGrade(c: Commodity): { grade: string; label: string; skor: number } {
    if (!currentClimate) return { grade: '', label: '', skor: 0 }
    const result = scoreCommodity(c, currentClimate)
    return { grade: result.grade, label: result.grade_label, skor: result.skor_kecocokan }
  }

  const bulanIni = currentClimate
    ? new Date(0, currentClimate.bulan - 1).toLocaleString('id-ID', { month: 'long' })
    : null

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-agri-green-dark text-white py-14 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest mb-4">
            <BookOpen className="size-3.5" />
            Perpustakaan Tanaman
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Library Komoditas <span className="text-agri-yellow">Demak</span>
          </h1>
          <p className="text-white/70 max-w-xl mx-auto text-sm sm:text-base">
            Panduan lengkap budidaya komoditas unggulan Kabupaten Demak — syarat tumbuh,
            tips budidaya, hama, dan rekomendasi berdasarkan kondisi iklim terkini.
          </p>

          {/* Search */}
          <div className="mt-8 mx-auto max-w-md relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/50" />
            <input
              type="text"
              placeholder="Cari tanaman..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-11 rounded-xl border border-white/20 bg-white/10 pl-10 pr-4 text-sm text-white placeholder:text-white/50 outline-none focus:border-agri-yellow focus:bg-white/15 transition-all"
            />
          </div>
        </div>
      </section>

      {/* Filter tabs */}
      <div className="border-b border-border bg-white sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-none">
            {([
              { value: 'semua', label: 'Semua' },
              { value: 'hujan', label: '🌧️ Musim Hujan' },
              { value: 'kemarau', label: '☀️ Musim Kemarau' },
              { value: 'sepanjang_tahun', label: '🌤️ Sepanjang Tahun' },
            ] as { value: FilterMusim; label: string }[]).map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === f.value
                    ? 'bg-agri-green text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Info bulan ini */}
        {bulanIni && (
          <div className="flex items-center gap-2 mb-6">
            <Sprout className="size-4 text-agri-green" />
            <p className="text-sm text-muted-foreground">
              Badge <span className="font-semibold text-agri-green">Cocok Bulan Ini</span> dihitung berdasarkan
              data iklim <strong>{bulanIni}</strong>.
            </p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-52 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Leaf className="size-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium">Tidak ditemukan</p>
            <p className="text-xs text-muted-foreground mt-1">Coba kata kunci lain atau ubah filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(c => {
              const { grade, skor } = getGrade(c)
              const musimCfg = MUSIM_CONFIG[c.musim ?? 'sepanjang_tahun']
              const MIcon = musimCfg?.icon ?? Leaf
              const hasLibrary = !!libraries[c.id!]

              return (
                <Link
                  key={c.id}
                  to={`/library/${c.id}`}
                  className="group block"
                >
                  <Card className="h-full shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 border-border group-hover:border-agri-green/30 overflow-hidden">
                    {/* Top accent */}
                    <div className="h-1 bg-gradient-to-r from-agri-green to-agri-blue" />

                    <CardContent className="p-5">
                      {/* Badges row */}
                      <div className="flex items-center gap-2 flex-wrap mb-4">
                        {/* Cocok bulan ini badge */}
                        {grade && grade !== '' && (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            GRADE_BADGE[grade]
                          }`}>
                            {grade === 'S1' && <Sprout className="size-2.5" />}
                            {GRADE_LABEL[grade]}
                          </span>
                        )}
                        {/* Musim badge */}
                        {musimCfg && (
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
                            musimCfg.color
                          }`}>
                            <MIcon className="size-2.5" />
                            {musimCfg.label}
                          </span>
                        )}
                      </div>

                      {/* Icon + Name */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="size-12 rounded-2xl bg-agri-green/10 flex items-center justify-center shrink-0 group-hover:bg-agri-green/20 transition-colors">
                          <Leaf className="size-6 text-agri-green" />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground">{c.nama}</h3>
                          {c.nama_ilmiah && (
                            <p className="text-xs text-muted-foreground italic">{c.nama_ilmiah}</p>
                          )}
                        </div>
                      </div>

                      {/* Skor bar */}
                      {currentClimate && skor > 0 && (
                        <div className="mb-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Kecocokan bulan ini</span>
                            <span className="font-semibold text-foreground">{skor}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                skor >= 75 ? 'bg-agri-green' :
                                skor >= 50 ? 'bg-agri-yellow' :
                                skor >= 25 ? 'bg-orange-400' : 'bg-red-400'
                              }`}
                              style={{ width: `${skor}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Deskripsi singkat */}
                      {c.deskripsi && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                          {c.deskripsi.split('.')[0]}.
                        </p>
                      )}

                      {/* Info row */}
                      <div className="flex items-center justify-between">
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          {c.durasi_panen && <span>{c.durasi_panen}</span>}
                        </div>
                        <div className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                          hasLibrary ? 'text-agri-green group-hover:text-agri-green-dark' : 'text-muted-foreground'
                        }`}>
                          {hasLibrary ? 'Lihat detail' : 'Belum ada konten'}
                          <ChevronRight className="size-3" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
