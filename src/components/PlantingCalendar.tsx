import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type { Commodity, ClimateData } from '@/lib/supabase'
import { scoreCommodity } from '@/lib/expertSystem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Info, AlertTriangle } from 'lucide-react'

const BULAN_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des']
const BULAN_FULL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

// Mapping waktu_tanam ke array bulan aktif
function parsePlantingMonths(waktuTanam: string): number[] {
  if (!waktuTanam || waktuTanam.toLowerCase().includes('sepanjang')) {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  }

  const BULAN_MAP: Record<string, number> = {
    jan: 1, feb: 2, mar: 3, apr: 4, mei: 5, jun: 6,
    jul: 7, agt: 8, sep: 9, okt: 10, nov: 11, des: 12,
    may: 5, aug: 8, oct: 10, dec: 12,
  }

  const result = new Set<number>()
  const ranges = waktuTanam.split(',')

  for (const range of ranges) {
    const parts = range.trim().toLowerCase().split('-')
    if (parts.length === 2) {
      const start = BULAN_MAP[parts[0].trim()]
      const end = BULAN_MAP[parts[1].trim()]
      if (start && end) {
        if (start <= end) {
          for (let m = start; m <= end; m++) result.add(m)
        } else {
          for (let m = start; m <= 12; m++) result.add(m)
          for (let m = 1; m <= end; m++) result.add(m)
        }
      }
    } else if (parts.length === 1) {
      const m = BULAN_MAP[parts[0].trim()]
      if (m) result.add(m)
    }
  }

  return Array.from(result).sort((a, b) => a - b)
}

function getCellStatus(
  bulan: number,
  plantingMonths: number[],
  score: number
): 'cocok' | 'cukup' | 'tidak' | 'off' {
  if (!plantingMonths.includes(bulan)) return 'off'
  if (score >= 75) return 'cocok'
  if (score >= 50) return 'cukup'
  return 'tidak'
}

const CELL_STYLES = {
  cocok: 'bg-agri-green text-white',
  cukup: 'bg-agri-yellow text-amber-900',
  tidak: 'bg-red-400 text-white',
  off: 'bg-muted text-muted-foreground/40',
}

const STATUS_LABELS = {
  cocok: 'Sangat Cocok',
  cukup: 'Cukup',
  tidak: 'Tidak Disarankan',
  off: 'Bukan Musim Tanam',
}

interface PlantingCalendarProps {
  currentClimate?: {
    ch_mm: number
    suhu: number
    kelembaban: number
    air_tanah: number
    bulan: number
    tahun?: number
  } | null
  // Data iklim historis per bulan (dari useClimateData)
  allClimateData?: ClimateData[]
}

export function PlantingCalendar({ currentClimate, allClimateData = [] }: PlantingCalendarProps) {
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [loading, setLoading] = useState(true)
  const [tooltip, setTooltip] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('commodities')
      .select('*')
      .order('nama')
      .then(({ data }) => {
        if (!cancelled) {
          setCommodities((data as Commodity[]) ?? [])
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [])

  const currentBulan = currentClimate?.bulan ?? new Date().getMonth() + 1
  const currentTahun = currentClimate?.tahun

  // Buat map bulan -> data iklim dari data historis
  // Prioritas: data tahun yang sama dengan currentClimate, fallback rata-rata semua tahun
  const climateByMonth = useMemo((): Record<number, ClimateData> => {
    const map: Record<number, ClimateData> = {}

    if (allClimateData.length === 0) return map

    // Kelompokkan per bulan
    const byMonth: Record<number, ClimateData[]> = {}
    for (const d of allClimateData) {
      if (!byMonth[d.bulan]) byMonth[d.bulan] = []
      byMonth[d.bulan].push(d)
    }

    for (let bulan = 1; bulan <= 12; bulan++) {
      const entries = byMonth[bulan]
      if (!entries || entries.length === 0) continue

      // Coba ambil data tahun yang sama dulu
      const sameYear = currentTahun
        ? entries.find(e => e.tahun === currentTahun)
        : null

      if (sameYear) {
        map[bulan] = sameYear
        continue
      }

      // Fallback: rata-rata semua tahun untuk bulan ini
      const avg: ClimateData = {
        ...entries[0],
        bulan,
        ch_mm:      Math.round((entries.reduce((s, e) => s + e.ch_mm, 0) / entries.length) * 10) / 10,
        suhu:       Math.round((entries.reduce((s, e) => s + e.suhu, 0) / entries.length) * 10) / 10,
        kelembaban: Math.round((entries.reduce((s, e) => s + e.kelembaban, 0) / entries.length) * 10) / 10,
        air_tanah:  Math.round((entries.reduce((s, e) => s + e.air_tanah, 0) / entries.length) * 10) / 10,
      }
      map[bulan] = avg
    }

    return map
  }, [allClimateData, currentTahun])

  const hasHistoricalData = Object.keys(climateByMonth).length > 0

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-5">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (commodities.length === 0) {
    return (
      <Card className="shadow-sm border-dashed">
        <CardContent className="p-10 text-center">
          <Calendar className="size-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">Belum ada data komoditas</p>
          <p className="text-xs text-muted-foreground mt-1">Admin perlu menambahkan data komoditas terlebih dahulu.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm overflow-hidden">
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-agri-green/10 flex items-center justify-center">
              <Calendar className="size-4 text-agri-green" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">Kalender Tanam</CardTitle>
              <p className="text-xs text-muted-foreground">
                {hasHistoricalData
                  ? 'Warna berdasarkan data iklim historis per bulan'
                  : 'Jadwal tanam komoditas per bulan'}
              </p>
            </div>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-3 flex-wrap">
            {([
              { status: 'cocok', label: 'Sangat Cocok' },
              { status: 'cukup', label: 'Cukup' },
              { status: 'tidak', label: 'Tidak Disarankan' },
              { status: 'off', label: 'Bukan Musim' },
            ] as const).map(({ status, label }) => (
              <div key={status} className="flex items-center gap-1.5">
                <span className={`size-3 rounded-sm ${CELL_STYLES[status]}`} />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>

      {/* Peringatan jika tidak ada data historis */}
      {!hasHistoricalData && currentClimate && (
        <div className="mx-5 mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertTriangle className="size-3.5 shrink-0" />
          <span>
            Data iklim historis tidak tersedia. Semua kolom menggunakan data
            <strong> {BULAN_FULL[currentBulan - 1]}</strong> sebagai referensi.
          </span>
        </div>
      )}

      <CardContent className="px-0 pb-0 overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-2.5 w-36">Komoditas</th>
              {BULAN_SHORT.map((b, i) => (
                <th
                  key={b}
                  className={`text-center text-xs font-semibold py-2.5 px-1 w-10 ${
                    i + 1 === currentBulan
                      ? 'text-agri-green bg-agri-green-light/50'
                      : 'text-muted-foreground'
                  }`}
                >
                  {b}
                  {i + 1 === currentBulan && (
                    <div className="mx-auto mt-1 size-1.5 rounded-full bg-agri-green" />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {commodities.map((c, rowIdx) => {
              const plantingMonths = parsePlantingMonths(c.waktu_tanam ?? '')

              return (
                <tr
                  key={c.id}
                  className={`border-b border-border/50 ${
                    rowIdx % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                  }`}
                >
                  <td className="px-5 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{c.nama}</p>
                      {c.durasi_panen && (
                        <p className="text-xs text-muted-foreground">{c.durasi_panen}</p>
                      )}
                    </div>
                  </td>
                  {BULAN_SHORT.map((_, i) => {
                    const bulan = i + 1
                    const isCurrentMonth = bulan === currentBulan

                    // Gunakan data iklim historis bulan tsb, fallback ke currentClimate
                    const climateForMonth = climateByMonth[bulan] ?? (
                      currentClimate ? {
                        ...currentClimate,
                        id: '',
                        tahun: currentClimate.tahun ?? new Date().getFullYear(),
                        created_at: '',
                      } as ClimateData : null
                    )

                    let score = 50
                    if (climateForMonth) {
                      const result = scoreCommodity(c, climateForMonth)
                      score = result.skor_kecocokan
                    }

                    const cellStatus = getCellStatus(bulan, plantingMonths, score)
                    const tooltipText = climateByMonth[bulan]
                      ? `${c.nama} – ${BULAN_SHORT[i]}: ${STATUS_LABELS[cellStatus]} (CH: ${climateByMonth[bulan].ch_mm}mm, ${score}%)`
                      : `${c.nama} – ${BULAN_SHORT[i]}: ${STATUS_LABELS[cellStatus]}`

                    return (
                      <td key={i} className="px-0.5 py-1.5 text-center">
                        <div
                          className={`relative mx-auto size-8 rounded-lg flex items-center justify-center cursor-pointer transition-all hover:scale-110 hover:shadow-sm ${
                            CELL_STYLES[cellStatus]
                          } ${
                            isCurrentMonth ? 'ring-2 ring-agri-green ring-offset-1' : ''
                          }`}
                          title={tooltipText}
                          onMouseEnter={() => setTooltip(tooltipText)}
                          onMouseLeave={() => setTooltip(null)}
                          role="cell"
                          aria-label={`${c.nama} bulan ${BULAN_SHORT[i]}: ${STATUS_LABELS[cellStatus]}`}
                        >
                          {cellStatus !== 'off' && (
                            <span className="text-[10px] font-bold">
                              {cellStatus === 'cocok' ? '✓' : cellStatus === 'cukup' ? '~' : '×'}
                            </span>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Floating tooltip info */}
        {tooltip && (
          <div className="sticky bottom-0 left-0 right-0 bg-foreground/90 text-background text-xs text-center py-2 px-4 font-medium">
            <Info className="inline size-3 mr-1" />
            {tooltip}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
