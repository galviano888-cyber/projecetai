import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Commodity, Library } from '@/lib/supabase'
import { useCurrentClimate } from '@/contexts/ClimateContext'
import { useCfTanamanBatch } from '@/hooks/useKalenderTanam'
import { LABEL_USER_TEKS, type LabelUser } from '@/lib/kalenderTanam'
import { THRESHOLD_TANAMAN } from '@/lib/thresholdData'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Sprout, Search, Leaf, CloudRain, Sun, Wind,
  ChevronRight, BookOpen, ChevronLeft, ArrowLeft
} from 'lucide-react'

// Nama komoditas yang ada di knowledge base (4 komoditas tervalidasi)
const KOMODITAS_AKTIF = new Set(THRESHOLD_TANAMAN.map(t => t.nama))

const PAGE_SIZE = 6

const MUSIM_CONFIG: Record<string, { label: string; icon: typeof CloudRain; color: string }> = {
  hujan:           { label: 'Musim Hujan',     icon: CloudRain, color: 'bg-agri-blue/10 text-agri-blue border-agri-blue/20' },
  kemarau:         { label: 'Musim Kemarau',   icon: Sun,       color: 'bg-agri-yellow/20 text-amber-800 border-agri-yellow/40' },
  sepanjang_tahun: { label: 'Sepanjang Tahun', icon: Wind,      color: 'bg-agri-green/10 text-agri-green-dark border-agri-green/20' },
}

const LABEL_BADGE: Record<LabelUser, string> = {
  cocok: 'bg-agri-green text-white',
  cukup: 'bg-agri-yellow text-amber-900',
  tidak: 'bg-muted text-muted-foreground',
}

type FilterMusim = 'semua' | 'hujan' | 'kemarau' | 'sepanjang_tahun'

export default function LibraryPage() {
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [libraries, setLibraries] = useState<Record<string, Library>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterMusim>('semua')
  const [page, setPage] = useState(1)
  const { currentClimate } = useCurrentClimate()

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      const [{ data: comms }, { data: libs }] = await Promise.all([
        supabase.from('commodities').select('*').order('nama'),
        supabase.from('library').select('commodity_id'),
      ])
      if (cancelled) return
      // Filter hanya komoditas yang ada di knowledge base (4 komoditas tervalidasi)
      const filtered = ((comms as Commodity[]) ?? []).filter(c => KOMODITAS_AKTIF.has(c.nama))
      setCommodities(filtered)
      const libMap: Record<string, Library> = {}
      ;((libs as Library[]) ?? []).forEach(l => { if (l.commodity_id) libMap[l.commodity_id] = l })
      setLibraries(libMap)
      setLoading(false)
    }
    fetchData()
    return () => { cancelled = true }
  }, [])

  // Memoize filtered list - hanya hitung ulang saat search/filter/data berubah
  const filtered = useMemo(() => commodities.filter(c => {
    const matchSearch = c.nama.toLowerCase().includes(search.toLowerCase()) ||
      (c.nama_ilmiah ?? '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'semua' || c.musim === filter
    return matchSearch && matchFilter
  }), [commodities, search, filter])

  // Reset ke halaman 1 saat filter/search berubah
  useEffect(() => { setPage(1) }, [search, filter])

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  )

  // Hitung CF kecocokan komoditas di halaman aktif (jika tanam bulan ini)
  // Hanya tanaman yang ada di knowledge base (4 komoditas tervalidasi) yang dapat nilai.
  const namaPaginated = useMemo(() => paginated.map(c => c.nama), [paginated])
  const bulanSekarang = currentClimate?.bulan ?? new Date().getMonth() + 1
  const tahunSekarang = currentClimate?.tahun ?? new Date().getFullYear()
  const { map: cfMap } = useCfTanamanBatch(namaPaginated, bulanSekarang, tahunSekarang)

  const bulanIni = currentClimate
    ? new Date(0, currentClimate.bulan - 1).toLocaleString('id-ID', { month: 'long' })
    : null

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-agri-green-dark to-[oklch(0.34_0.10_152)] text-white py-16 px-4">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute -top-24 -right-16 size-80 rounded-full bg-agri-blue/20 blur-[120px]" />
        <div className="absolute -bottom-24 -left-16 size-80 rounded-full bg-agri-green/30 blur-[120px]" />

        <div className="relative mx-auto max-w-4xl">
          {/* Back to dashboard */}
          <div className="mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-medium transition-colors group"
            >
              <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
              Kembali ke Dashboard
            </Link>
          </div>
          <div className="text-center animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 glass-dark px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] mb-5">
              <BookOpen className="size-3.5 text-agri-yellow" />
              Perpustakaan Tanaman
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 tracking-tight">
              Library Komoditas <span className="text-agri-yellow">Demak</span>
            </h1>
            <p className="text-white/75 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
              Panduan lengkap budidaya komoditas unggulan Kabupaten Demak — syarat tumbuh,
              tips budidaya, hama, dan rekomendasi berdasarkan kondisi iklim terkini.
            </p>

            {/* Search */}
            <div className="mt-8 mx-auto max-w-md relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-white/50" />
              <input
                type="text"
                placeholder="Cari nama tanaman..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-12 rounded-2xl border border-white/20 bg-white/10 pl-11 pr-4 text-sm text-white placeholder:text-white/50 outline-none focus:border-agri-yellow focus:bg-white/15 transition-all shadow-soft"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filter tabs */}
      <div className="border-b border-border glass sticky top-0 z-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex gap-1.5 overflow-x-auto py-2.5 scrollbar-none">
            {([
              { value: 'semua', label: 'Semua' },
              { value: 'hujan', label: '🌧️ Musim Hujan' },
              { value: 'kemarau', label: '☀️ Musim Kemarau' },
              { value: 'sepanjang_tahun', label: '🌤️ Sepanjang Tahun' },
            ] as { value: FilterMusim; label: string }[]).map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filter === f.value
                    ? 'bg-agri-green text-white shadow-soft'
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
          <>
            {/* Info jumlah hasil */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-muted-foreground">
                Menampilkan {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length} komoditas
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginated.map(c => {
                const cf = cfMap.get(c.nama.toLowerCase())
                const label = cf?.labelUser
                const musimCfg = MUSIM_CONFIG[c.musim ?? 'sepanjang_tahun']
                const MIcon = musimCfg?.icon ?? Leaf
                const hasLibrary = !!libraries[c.id!]

                return (
                  <Link key={c.id} to={`/library/${c.id}`} className="group block">
                    <Card className="h-full shadow-soft hover:shadow-soft-lg transition-all hover:-translate-y-1 border-border group-hover:border-agri-green/40 overflow-hidden rounded-2xl">
                      {/* Image / gradient header */}
                      <div className="relative h-32 overflow-hidden bg-gradient-to-br from-agri-green/15 to-agri-blue/10">
                        {c.foto_url ? (
                          <img
                            src={c.foto_url}
                            alt={c.nama}
                            loading="lazy"
                            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="size-full flex items-center justify-center">
                            <Leaf className="size-12 text-agri-green/40" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                        {/* Badges over image */}
                        <div className="absolute top-3 left-3 right-3 flex items-center gap-1.5 flex-wrap">
                          {label && (
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-soft ${LABEL_BADGE[label]}`}>
                              {label === 'cocok' && <Sprout className="size-2.5" />}
                              {LABEL_USER_TEKS[label]}
                            </span>
                          )}
                          {musimCfg && (
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold bg-white/90 backdrop-blur-sm ${musimCfg.color}`}>
                              <MIcon className="size-2.5" />
                              {musimCfg.label}
                            </span>
                          )}
                        </div>
                      </div>

                      <CardContent className="p-5">
                        <div className="mb-2">
                          <h3 className="font-bold text-foreground text-lg leading-tight group-hover:text-agri-green-dark transition-colors">{c.nama}</h3>
                          {c.nama_ilmiah && <p className="text-xs text-muted-foreground italic mt-0.5">{c.nama_ilmiah}</p>}
                        </div>

                        {cf && cf.persenKeyakinan > 0 && (
                          <div className="mb-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Certainty Factor (tanam bulan ini)</span>
                              <span className="font-semibold text-foreground">{cf.persenKeyakinan}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${
                                  cf.persenKeyakinan >= 70 ? 'bg-agri-green' :
                                  cf.persenKeyakinan >= 40 ? 'bg-agri-yellow' :
                                  'bg-red-400'
                                }`}
                                style={{ width: `${cf.persenKeyakinan}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {c.deskripsi && (
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-4">
                            {c.deskripsi.split('.')[0]}.
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t border-border/60">
                          <span className="text-xs text-muted-foreground">{c.durasi_panen ?? ''}</span>
                          <span className={`flex items-center gap-1 text-xs font-semibold ${
                            hasLibrary ? 'text-agri-green group-hover:text-agri-green-dark' : 'text-muted-foreground'
                          }`}>
                            {hasLibrary ? 'Lihat detail' : 'Belum ada konten'}
                            <ChevronRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                {[...Array(totalPages)].map((_, i) => (
                  <Button
                    key={i}
                    variant={page === i + 1 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(i + 1)}
                    className={page === i + 1 ? 'bg-agri-green hover:bg-agri-green-dark text-white' : ''}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
