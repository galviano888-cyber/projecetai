import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Commodity, ClimateData } from '@/lib/supabase'
import { getTopRecommendations, saveRecommendations } from '@/lib/expertSystem'
import type { RecommendationResult } from '@/lib/expertSystem'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Sprout, TrendingUp, AlertTriangle, XCircle,
  CheckCircle2, ChevronDown, ChevronUp, RefreshCw, Info
} from 'lucide-react'

const BULAN_NAMES = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const GRADE_CONFIG = {
  S1: {
    label: 'Sangat Cocok',
    bg: 'bg-agri-green-light',
    border: 'border-agri-green',
    text: 'text-agri-green-dark',
    badge: 'bg-agri-green text-white',
    bar: 'bg-agri-green',
    icon: CheckCircle2,
  },
  S2: {
    label: 'Cukup Cocok',
    bg: 'bg-agri-yellow/15',
    border: 'border-agri-yellow',
    text: 'text-amber-800',
    badge: 'bg-agri-yellow text-amber-900',
    bar: 'bg-agri-yellow',
    icon: TrendingUp,
  },
  S3: {
    label: 'Marjinal',
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    text: 'text-orange-800',
    badge: 'bg-orange-400 text-white',
    bar: 'bg-orange-400',
    icon: AlertTriangle,
  },
  N: {
    label: 'Tidak Cocok',
    bg: 'bg-red-50',
    border: 'border-red-300',
    text: 'text-red-800',
    badge: 'bg-red-400 text-white',
    bar: 'bg-red-400',
    icon: XCircle,
  },
}

const PARAM_STATUS_COLORS = {
  optimal:  'text-agri-green-dark bg-agri-green-light',
  marjinal: 'text-amber-800 bg-agri-yellow/20',
  tidak:    'text-red-700 bg-red-50',
}

interface RecommendationCardProps {
  climate: ClimateData
  topN?: number
}

export function RecommendationCard({ climate, topN = 3 }: RecommendationCardProps) {
  const [results, setResults] = useState<RecommendationResult[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  async function runAnalysis() {
    setLoading(true)
    const { data } = await supabase.from('commodities').select('*')
    if (!data || data.length === 0) {
      setLoading(false)
      return
    }

    const top = getTopRecommendations(data as Commodity[], climate, topN)
    setResults(top)
    setLastUpdated(new Date())

    // Simpan ke Supabase di background
    saveRecommendations(top, climate.bulan).catch(console.error)
    setLoading(false)
  }

  useEffect(() => {
    runAnalysis()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [climate.bulan, climate.tahun, climate.ch_mm, climate.suhu, climate.kelembaban, climate.air_tanah])

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(topN)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <Card className="border-dashed shadow-none">
        <CardContent className="p-10 text-center">
          <Sprout className="size-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">Belum ada data komoditas</p>
          <p className="text-xs text-muted-foreground mt-1">
            Admin perlu menambahkan data komoditas terlebih dahulu.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header info */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="size-3.5" />
          <span>
            Berdasarkan data iklim <strong>{BULAN_NAMES[climate.bulan]} {climate.tahun}</strong>
            {' — '}
            CH: {climate.ch_mm} mm, Suhu: {climate.suhu}°C,
            RH: {climate.kelembaban}%, Air Tanah: {climate.air_tanah} mm/hr
          </span>
        </div>
        <button
          onClick={runAnalysis}
          className="flex items-center gap-1.5 text-xs text-agri-green hover:text-agri-green-dark font-medium transition-colors"
        >
          <RefreshCw className="size-3.5" />
          Hitung ulang
        </button>
      </div>

      {/* Recommendation cards */}
      {results.map((result, idx) => {
        const cfg = GRADE_CONFIG[result.grade]
        const isExpanded = expanded === result.commodity.id

        return (
          <div
            key={result.commodity.id}
            className={`rounded-2xl border-2 overflow-hidden transition-all ${cfg.bg} ${cfg.border}`}
          >
            {/* Rank badge */}
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-start gap-3">
                {/* Rank number */}
                <div className={`shrink-0 flex size-8 items-center justify-center rounded-xl text-sm font-bold ${cfg.badge}`}>
                  #{idx + 1}
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`text-base font-bold ${cfg.text}`}>
                      {result.commodity.nama}
                    </h3>
                    {result.commodity.nama_ilmiah && (
                      <span className="text-xs text-muted-foreground italic hidden sm:inline">
                        {result.commodity.nama_ilmiah}
                      </span>
                    )}
                    <Badge className={`text-xs ${cfg.badge} border-0`}>
                      {result.grade_label}
                    </Badge>
                  </div>

                  {/* Score bar */}
                  <div className="mt-2 mb-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Skor Kecocokan</span>
                      <span className={`text-sm font-bold ${cfg.text}`}>
                        {result.skor_kecocokan}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-black/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`}
                        style={{ width: `${result.skor_kecocokan}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-foreground/70 leading-relaxed mt-2">
                    {result.catatan}
                  </p>
                </div>

                {/* Expand button */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : result.commodity.id!)}
                  className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-black/5 transition-colors"
                  aria-label="Detail parameter"
                >
                  {isExpanded
                    ? <ChevronUp className="size-4" />
                    : <ChevronDown className="size-4" />}
                </button>
              </div>
            </div>

            {/* Expanded parameter detail */}
            {isExpanded && result.detail.length > 0 && (
              <div className="border-t border-black/10 bg-white/50 px-4 py-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Detail Parameter Iklim
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {result.detail.map((d) => (
                    <div
                      key={d.parameter}
                      className={`rounded-xl px-3 py-2.5 text-xs ${PARAM_STATUS_COLORS[d.status]}`}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        {d.status === 'optimal'
                          ? <CheckCircle2 className="size-3 shrink-0" />
                          : d.status === 'marjinal'
                          ? <AlertTriangle className="size-3 shrink-0" />
                          : <XCircle className="size-3 shrink-0" />}
                        <span className="font-semibold">{d.parameter}</span>
                      </div>
                      <p className="font-bold text-sm">
                        {d.nilai} <span className="font-normal text-xs">{d.unit}</span>
                      </p>
                      <p className="text-[10px] mt-0.5 leading-relaxed opacity-80">
                        {d.keterangan}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Crop info */}
                {(result.commodity.waktu_tanam || result.commodity.durasi_panen) && (
                  <div className="flex gap-4 mt-3 pt-3 border-t border-black/10 flex-wrap">
                    {result.commodity.waktu_tanam && (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Waktu Tanam</p>
                        <p className="text-xs font-semibold text-foreground">{result.commodity.waktu_tanam}</p>
                      </div>
                    )}
                    {result.commodity.durasi_panen && (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Durasi Panen</p>
                        <p className="text-xs font-semibold text-foreground">{result.commodity.durasi_panen}</p>
                      </div>
                    )}
                    {result.commodity.jarak_tanam && (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Jarak Tanam</p>
                        <p className="text-xs font-semibold text-foreground">{result.commodity.jarak_tanam}</p>
                      </div>
                    )}
                    {result.commodity.musim && (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Musim</p>
                        <p className="text-xs font-semibold text-foreground capitalize">
                          {result.commodity.musim.replace('_', ' ')}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {result.commodity.risiko && (
                  <div className="mt-3 pt-3 border-t border-black/10">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Risiko</p>
                    <p className="text-xs text-foreground/80 leading-relaxed">{result.commodity.risiko}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Disclaimer */}
      {lastUpdated && (
        <p className="text-[10px] text-muted-foreground text-center">
          Dihitung pada {lastUpdated.toLocaleTimeString('id-ID')} •
          Metode: Forward Chaining + Weighted CF •
          Sumber: Ritung et al. (2011) BBSDLP & FAO AQUASTAT (2002)
        </p>
      )}
    </div>
  )
}
