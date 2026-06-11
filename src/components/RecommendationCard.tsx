import { useState } from 'react'
import { useRekomendasiBulan } from '@/hooks/useKalenderTanam'
import { LABEL_USER_TEKS } from '@/lib/kalenderTanam'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Sprout, TrendingUp, XCircle,
  CheckCircle2, ChevronDown, ChevronUp, Info, CloudRain,
  Thermometer, Droplets, Layers
} from 'lucide-react'

const BULAN_NAMES = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const LABEL_CFG = {
  cocok: {
    bg: 'bg-agri-green-light', border: 'border-agri-green', text: 'text-agri-green-dark',
    badge: 'bg-agri-green text-white', bar: 'bg-agri-green', icon: CheckCircle2,
  },
  cukup: {
    bg: 'bg-agri-yellow/15', border: 'border-agri-yellow', text: 'text-amber-800',
    badge: 'bg-agri-yellow text-amber-900', bar: 'bg-agri-yellow', icon: TrendingUp,
  },
  tidak: {
    bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800',
    badge: 'bg-red-400 text-white', bar: 'bg-red-400', icon: XCircle,
  },
} as const

const OLDEMAN_BADGE: Record<string, string> = {
  BB: 'bg-blue-100 text-blue-700 border-blue-200',
  BL: 'bg-green-100 text-green-700 border-green-200',
  BK: 'bg-amber-100 text-amber-700 border-amber-200',
}

interface RecommendationCardProps {
  /** Bulan tanam yang dievaluasi (1-12) */
  bulan: number
  /** Tahun tanam */
  tahun: number
  topN?: number
}

export function RecommendationCard({ bulan, tahun, topN = 3 }: RecommendationCardProps) {
  const { hasil, loading, adaData } = useRekomendasiBulan(bulan, tahun, topN)
  const [expanded, setExpanded] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(topN)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (!adaData) {
    return (
      <Card className="border-dashed shadow-none">
        <CardContent className="p-10 text-center">
          <Sprout className="size-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">Belum ada data prediksi iklim</p>
          <p className="text-xs text-muted-foreground mt-1">
            Admin perlu mengisi prediksi iklim BMKG untuk {BULAN_NAMES[bulan]} {tahun} di menu Prediksi BMKG.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header info */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Info className="size-3.5" />
        <span>
          Rekomendasi jika <strong>tanam {BULAN_NAMES[bulan]} {tahun}</strong> &mdash;
          diurutkan dari nilai Certainty Factor tertinggi.
        </span>
      </div>

      {/* Recommendation cards */}
      {hasil.map((result, idx) => {
        const cfg = LABEL_CFG[result.labelUser]
        const isExpanded = expanded === result.tanaman.nama
        const persen = Math.max(0, result.persenKeyakinan)

        return (
          <div
            key={result.tanaman.nama}
            className={`rounded-2xl border-2 overflow-hidden transition-all ${cfg.bg} ${cfg.border}`}
          >
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-start gap-3">
                <div className={`shrink-0 flex size-8 items-center justify-center rounded-xl text-sm font-bold ${cfg.badge}`}>
                  #{idx + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`text-base font-bold ${cfg.text}`}>{result.tanaman.nama}</h3>
                    <Badge className={`text-xs ${cfg.badge} border-0`}>
                      {LABEL_USER_TEKS[result.labelUser]}
                    </Badge>
                  </div>

                  {/* CF bar */}
                  <div className="mt-2 mb-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Certainty Factor</span>
                      <span className={`text-sm font-bold ${cfg.text}`}>
                        {result.cfTotal.toFixed(3)} ({persen}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-black/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`}
                        style={{ width: `${persen}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-foreground/70 leading-relaxed mt-2">
                    Masa tanam {result.tanaman.totalBulan} bulan &middot; panen {BULAN_NAMES[result.bulanPanen]} {result.tahunPanen}.
                    {' '}Zona Oldeman: {result.tanaman.zonaOldeman}.
                  </p>
                </div>

                <button
                  onClick={() => setExpanded(isExpanded ? null : result.tanaman.nama)}
                  className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-black/5 transition-colors"
                  aria-label="Detail fase"
                >
                  {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>
              </div>
            </div>

            {/* Expanded detail per fase */}
            {isExpanded && (
              <div className="border-t border-black/10 bg-white/50 px-4 py-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Detail Certainty Factor per Fase Tumbuh
                </p>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Fase / Bulan</th>
                        <th className="text-center px-2 py-2 font-semibold text-muted-foreground"><CloudRain className="size-3.5 inline text-blue-500" /> CH</th>
                        <th className="text-center px-2 py-2 font-semibold text-muted-foreground"><Thermometer className="size-3.5 inline text-orange-500" /> Suhu</th>
                        <th className="text-center px-2 py-2 font-semibold text-muted-foreground"><Droplets className="size-3.5 inline text-agri-green" /> RH</th>
                        <th className="text-center px-2 py-2 font-semibold text-muted-foreground"><Layers className="size-3.5 inline text-purple-500" /> KAT</th>
                        <th className="text-center px-2 py-2 font-semibold text-muted-foreground">CF Fase</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {result.detail.map((d, i) => (
                        <tr key={i} className={d.dataAda ? '' : 'opacity-50'}>
                          <td className="px-3 py-2">
                            <p className="font-medium text-foreground">{BULAN_NAMES[d.bulanKalender].slice(0, 3)} {d.tahun}</p>
                            <p className="text-[10px] text-muted-foreground">{d.namaFase}</p>
                          </td>
                          <td className="px-2 py-2 text-center">
                            {d.dataAda ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <span className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-semibold ${OLDEMAN_BADGE[d.oldemanAktual]}`}>{d.oldemanAktual}</span>
                                <span className="text-[9px] text-muted-foreground">butuh {d.chButuh}</span>
                                <span className="text-[9px] font-mono">{d.cfCh >= 0 ? '+' : ''}{d.cfCh.toFixed(2)}</span>
                              </div>
                            ) : '-'}
                          </td>
                          <td className="px-2 py-2 text-center font-mono text-[10px]">{d.dataAda ? `${d.cfSuhu >= 0 ? '+' : ''}${d.cfSuhu.toFixed(2)}` : '-'}</td>
                          <td className="px-2 py-2 text-center font-mono text-[10px]">{d.dataAda ? `${d.cfRh >= 0 ? '+' : ''}${d.cfRh.toFixed(2)}` : '-'}</td>
                          <td className="px-2 py-2 text-center font-mono text-[10px]">{d.dataAda ? `${d.cfKat >= 0 ? '+' : ''}${d.cfKat.toFixed(2)}` : '-'}</td>
                          <td className="px-2 py-2 text-center">
                            {d.dataAda ? (
                              <span className="inline-block px-2 py-0.5 rounded-md border border-agri-green/30 bg-agri-green/5 text-[10px] font-bold text-agri-green-dark">
                                {d.cfFase.toFixed(3)}
                              </span>
                            ) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-muted-foreground italic mt-2">
                  Ref: {result.tanaman.referensi}
                </p>
              </div>
            )}
          </div>
        )
      })}

      {/* Disclaimer */}
      <p className="text-[10px] text-muted-foreground text-center">
        Metode: Sistem Pakar Forward Chaining + Certainty Factor (Shortliffe &amp; Buchanan, 1975).
        Basis aturan: Oldeman (1975), Djaenudin et al. (2011), FAO-56 (Allen et al. 1998).
      </p>
    </div>
  )
}
