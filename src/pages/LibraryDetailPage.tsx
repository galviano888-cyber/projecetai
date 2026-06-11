import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Commodity, Library } from '@/lib/supabase'
import { useCurrentClimate } from '@/contexts/ClimateContext'
import { useCfTanaman } from '@/hooks/useKalenderTanam'
import { LABEL_USER_TEKS, type KelasKesesuaian } from '@/lib/kalenderTanam'
import { Card, CardContent } from '@/components/ui/card'
import { RichContent } from '@/components/RichTextEditor'
import {
  ArrowLeft, Leaf, CloudRain, Thermometer, Droplets,
  Layers, Clock, Ruler, Sprout, AlertTriangle,
  Shield, BookOpen, Sun
} from 'lucide-react'

const MUSIM_CONFIG: Record<string, { label: string; color: string }> = {
  hujan:           { label: '🌧️ Musim Hujan',     color: 'bg-agri-blue/10 text-agri-blue border-agri-blue/20' },
  kemarau:         { label: '☀️ Musim Kemarau',   color: 'bg-agri-yellow/20 text-amber-800 border-agri-yellow/40' },
  sepanjang_tahun: { label: '🌤️ Sepanjang Tahun', color: 'bg-agri-green/10 text-agri-green-dark border-agri-green/20' },
}

export default function LibraryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [commodity, setCommodity] = useState<Commodity | null>(null)
  const [library, setLibrary] = useState<Library | null>(null)
  const [loading, setLoading] = useState(true)
  const { currentClimate } = useCurrentClimate()

  useEffect(() => {
    if (!id) return
    async function fetchData() {
      const [{ data: comm }, { data: lib }] = await Promise.all([
        supabase.from('commodities').select('*').eq('id', id).single(),
        supabase.from('library').select('*').eq('commodity_id', id).single(),
      ])
      setCommodity(comm as Commodity ?? null)
      setLibrary(lib as Library ?? null)
      setLoading(false)
    }
    fetchData()
  }, [id])

  const bulanSekarang = currentClimate?.bulan ?? new Date().getMonth() + 1
  const tahunSekarang = currentClimate?.tahun ?? new Date().getFullYear()
  const { hasil: cf } = useCfTanaman(commodity?.nama, bulanSekarang, tahunSekarang)

  // Derive status terburuk tiap parameter dari seluruh fase (untuk SyaratCard)
  const paramStatus = useMemo(() => {
    const order: KelasKesesuaian[] = ['S1', 'S2', 'S3', 'N']
    const worst = (vals: KelasKesesuaian[]): KelasKesesuaian =>
      vals.reduce((w, v) => (order.indexOf(v) > order.indexOf(w) ? v : w), 'S1')
    const toStatus = (k: KelasKesesuaian): 'optimal' | 'marjinal' | 'tidak' =>
      k === 'S1' ? 'optimal' : k === 'N' ? 'tidak' : 'marjinal'
    if (!cf) return null
    const ada = cf.detail.filter(d => d.dataAda)
    if (ada.length === 0) return null
    return {
      ch:   toStatus(worst(ada.map(d => d.kelasCh))),
      suhu: toStatus(worst(ada.map(d => d.kelasSuhu))),
      rh:   toStatus(worst(ada.map(d => d.kelasRh))),
      kat:  toStatus(worst(ada.map(d => d.kelasKat))),
    }
  }, [cf])

  const bulanIni = currentClimate
    ? new Date(0, currentClimate.bulan - 1).toLocaleString('id-ID', { month: 'long' })
    : null

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-4 py-12 space-y-4">
          <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
          <div className="h-48 bg-muted rounded-2xl animate-pulse" />
          <div className="h-32 bg-muted rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (!commodity) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Leaf className="size-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">Komoditas tidak ditemukan</p>
          <Link to="/library" className="text-sm text-agri-green hover:underline mt-2 inline-block">
            Kembali ke Library
          </Link>
        </div>
      </div>
    )
  }

  const musimCfg = MUSIM_CONFIG[commodity.musim ?? 'sepanjang_tahun']

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-agri-green-dark text-white">
        <div className="mx-auto max-w-3xl px-4 py-8">
          {/* Breadcrumb */}
          <Link
            to="/library"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="size-4" /> Kembali ke Library
          </Link>

          <div className="flex items-start gap-4">
            <div className="size-16 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <Leaf className="size-8 text-agri-yellow" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {musimCfg && (
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
                    musimCfg.color
                  }`}>
                    {musimCfg.label}
                  </span>
                )}
                {cf && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    cf.labelUser === 'cocok' ? 'bg-agri-green text-white' :
                    cf.labelUser === 'cukup' ? 'bg-agri-yellow text-amber-900' :
                    'bg-white/20 text-white'
                  }`}>
                    {cf.labelUser === 'cocok' && <Sprout className="size-2.5" />}
                    {LABEL_USER_TEKS[cf.labelUser]} {bulanIni && `(${bulanIni})`}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{commodity.nama}</h1>
              {commodity.nama_ilmiah && (
                <p className="text-white/60 italic text-sm mt-0.5">{commodity.nama_ilmiah}</p>
              )}
            </div>
          </div>

          {/* CF bar */}
          {cf && (
            <div className="mt-5 bg-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/80">Certainty Factor jika tanam {bulanIni}</span>
                <span className="text-lg font-bold text-agri-yellow">{cf.persenKeyakinan}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-white/20 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    cf.persenKeyakinan >= 70 ? 'bg-agri-green' :
                    cf.persenKeyakinan >= 40 ? 'bg-agri-yellow' : 'bg-red-400'
                  }`}
                  style={{ width: `${Math.max(0, cf.persenKeyakinan)}%` }}
                />
              </div>
              <p className="text-xs text-white/60 mt-2">
                Panen {new Date(0, cf.bulanPanen - 1).toLocaleString('id-ID', { month: 'long' })} {cf.tahunPanen}.
                Metode: Forward Chaining + Certainty Factor (Shortliffe &amp; Buchanan, 1975).
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        {/* Syarat Tumbuh */}
        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-5">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
              <CloudRain className="size-4 text-agri-blue" /> Syarat Tumbuh
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {commodity.ch_min != null && (
                <SyaratCard
                  icon={CloudRain}
                  iconColor="text-agri-blue"
                  iconBg="bg-agri-blue/10"
                  label="Curah Hujan"
                  value={`${commodity.ch_min}–${commodity.ch_max}`}
                  unit="mm/bln"
                  status={paramStatus?.ch}
                />
              )}
              {commodity.suhu_min != null && (
                <SyaratCard
                  icon={Thermometer}
                  iconColor="text-orange-500"
                  iconBg="bg-orange-500/10"
                  label="Suhu"
                  value={`${commodity.suhu_min}–${commodity.suhu_max}`}
                  unit="°C"
                  status={paramStatus?.suhu}
                />
              )}
              {commodity.kelembaban_min != null && (
                <SyaratCard
                  icon={Droplets}
                  iconColor="text-agri-green"
                  iconBg="bg-agri-green/10"
                  label="Kelembaban"
                  value={`${commodity.kelembaban_min}–${commodity.kelembaban_max}`}
                  unit="%"
                  status={paramStatus?.rh}
                />
              )}
              {commodity.air_tanah_min != null && (
                <SyaratCard
                  icon={Layers}
                  iconColor="text-purple-500"
                  iconBg="bg-purple-500/10"
                  label="Air Tanah Min"
                  value={`≥${commodity.air_tanah_min}`}
                  unit="%"
                  status={paramStatus?.kat}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info Budidaya */}
        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-5">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
              <Sprout className="size-4 text-agri-green" /> Info Budidaya
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {commodity.waktu_tanam && (
                <InfoCell icon={Sun} label="Waktu Tanam" value={commodity.waktu_tanam} />
              )}
              {commodity.durasi_panen && (
                <InfoCell icon={Clock} label="Durasi Panen" value={commodity.durasi_panen} />
              )}
              {commodity.jarak_tanam && (
                <InfoCell icon={Ruler} label="Jarak Tanam" value={commodity.jarak_tanam} />
              )}
            </div>
            {commodity.info_pupuk && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Rekomendasi Pupuk</p>
                <p className="text-sm text-foreground">{commodity.info_pupuk}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Library konten */}
        {library ? (
          <>
            {library.konten_detail && (
              <LibSection
                icon={BookOpen}
                iconColor="text-agri-blue"
                title="Tentang Tanaman Ini"
                content={library.konten_detail}
              />
            )}
            {library.tips_budidaya && (
              <LibSection
                icon={Sprout}
                iconColor="text-agri-green"
                title="Tips Budidaya"
                content={library.tips_budidaya}
              />
            )}
            {library.hama_umum && (
              <LibSection
                icon={AlertTriangle}
                iconColor="text-amber-600"
                title="Hama & Penyakit Umum"
                content={library.hama_umum}
              />
            )}
            {library.cara_pencegahan && (
              <LibSection
                icon={Shield}
                iconColor="text-agri-green"
                title="Cara Pencegahan & Pengendalian"
                content={library.cara_pencegahan}
              />
            )}
          </>
        ) : (
          <Card className="border-dashed shadow-none">
            <CardContent className="p-10 text-center">
              <BookOpen className="size-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium">Konten library belum tersedia</p>
              <p className="text-xs text-muted-foreground mt-1">
                Admin sedang menyiapkan konten edukasi untuk komoditas ini.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Risiko */}
        {commodity.risiko && (
          <Card className="shadow-sm border-amber-200 bg-amber-50/50">
            <CardContent className="pt-5 pb-5">
              <h2 className="text-sm font-semibold text-amber-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-600" /> Risiko yang Perlu Diperhatikan
              </h2>
              <p className="text-sm text-amber-900 leading-relaxed">{commodity.risiko}</p>
            </CardContent>
          </Card>
        )}

        {/* Sumber referensi */}
        <p className="text-[10px] text-muted-foreground text-center pb-4">
          Syarat tumbuh bersumber dari: Ritung et al. (2011) Petunjuk Teknis Evaluasi Lahan,
          BBSDLP Badan Litbang Pertanian &bull; FAO AQUASTAT (2002) &bull; IRRI Knowledge Bank (2023)
        </p>

        {/* Back link */}
        <Link
          to="/library"
          className="flex items-center justify-center gap-2 text-sm text-agri-green hover:text-agri-green-dark font-medium transition-colors pb-8"
        >
          <ArrowLeft className="size-4" /> Kembali ke Library
        </Link>
      </div>
    </div>
  )
}

// ─── Sub-components ───

function SyaratCard({
  icon: Icon, iconColor, iconBg, label, value, unit, status
}: {
  icon: React.ComponentType<{ className?: string }>
  iconColor: string; iconBg: string
  label: string; value: string; unit: string
  status?: 'optimal' | 'marjinal' | 'tidak'
}) {
  const statusColor = status === 'optimal'
    ? 'border-agri-green/30 bg-agri-green-light/50'
    : status === 'marjinal'
    ? 'border-agri-yellow/40 bg-agri-yellow/10'
    : status === 'tidak'
    ? 'border-red-300 bg-red-50'
    : 'border-border bg-muted/30'

  return (
    <div className={`rounded-xl border p-3 ${statusColor}`}>
      <div className={`size-7 rounded-lg ${iconBg} flex items-center justify-center mb-2`}>
        <Icon className={`size-3.5 ${iconColor}`} />
      </div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm font-bold text-foreground mt-0.5">{value}</p>
      <p className="text-[10px] text-muted-foreground">{unit}</p>
      {status && (
        <p className={`text-[10px] font-semibold mt-1 ${
          status === 'optimal' ? 'text-agri-green-dark' :
          status === 'marjinal' ? 'text-amber-700' : 'text-red-600'
        }`}>
          {status === 'optimal' ? '✓ Optimal' : status === 'marjinal' ? '~ Marjinal' : '× Tidak sesuai'}
        </p>
      )}
    </div>
  )
}

function InfoCell({
  icon: Icon, label, value
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string; value: string
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="size-7 rounded-lg bg-agri-green/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="size-3.5 text-agri-green" />
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  )
}

function LibSection({
  icon: Icon, iconColor, title, content
}: {
  icon: React.ComponentType<{ className?: string }>
  iconColor: string; title: string; content: string
}) {
  const isHtml = content.trim().startsWith('<')
  return (
    <Card className="shadow-sm">
      <CardContent className="pt-5 pb-5">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
          <Icon className={`size-4 ${iconColor}`} />
          {title}
        </h2>
        {isHtml
          ? <RichContent html={content} />
          : <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{content}</p>
        }
      </CardContent>
    </Card>
  )
}
