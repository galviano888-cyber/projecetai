import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Commodity } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Info } from 'lucide-react'

const BULAN_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des']

// Mapping waktu_tanam ke array bulan aktif
// Format: "Nov-Feb" atau "Apr-Jul, Nov-Feb"
function parsePlantingMonths(waktuTanam: string): number[] {
  if (!waktuTanam || waktuTanam.toLowerCase().includes('sepanjang')) {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  }

  const BULAN_MAP: Record<string, number> = {
    jan: 1, feb: 2, mar: 3, apr: 4, mei: 5, jun: 6,
    jul: 7, agt: 8, sep: 9, okt: 10, nov: 11, des: 12,
    // English fallback
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
          // Wrap around year (e.g. Nov-Feb)
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

// Skor kecocokan berdasarkan parameter iklim bulan berjalan vs syarat komoditas
function scoreCommodity(
  c: Commodity,
  ch_mm: number,
  suhu: number,
  kelembaban: number,
  air_tanah: number
): number {
  let score = 0
  let checks = 0

  if (c.ch_min != null && c.ch_max != null) {
    checks++
    if (ch_mm >= c.ch_min && ch_mm <= c.ch_max) score += 25
    else if (ch_mm >= c.ch_min * 0.8 && ch_mm <= c.ch_max * 1.2) score += 12
  }
  if (c.suhu_min != null && c.suhu_max != null) {
    checks++
    if (suhu >= c.suhu_min && suhu <= c.suhu_max) score += 25
    else if (suhu >= c.suhu_min - 2 && suhu <= c.suhu_max + 2) score += 12
  }
  if (c.kelembaban_min != null && c.kelembaban_max != null) {
    checks++
    if (kelembaban >= c.kelembaban_min && kelembaban <= c.kelembaban_max) score += 25
    else if (kelembaban >= c.kelembaban_min * 0.9 && kelembaban <= c.kelembaban_max * 1.1) score += 12
  }
  if (c.air_tanah_min != null) {
    checks++
    if (air_tanah >= c.air_tanah_min) score += 25
    else if (air_tanah >= c.air_tanah_min * 0.7) score += 12
  }

  return checks > 0 ? Math.round((score / (checks * 25)) * 100) : 50
}

function getCellStatus(
  bulan: number,
  plantingMonths: number[],
  score: number
): 'cocok' | 'cukup' | 'tidak' | 'off' {
  const isPlantingMonth = plantingMonths.includes(bulan)
  if (!isPlantingMonth) return 'off'
  if (score >= 70) return 'cocok'
  if (score >= 40) return 'cukup'
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
  } | null
}

export function PlantingCalendar({ currentClimate }: PlantingCalendarProps) {
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [loading, setLoading] = useState(true)
  const [tooltip, setTooltip] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('commodities')
      .select('*')
      .order('nama')
      .then(({ data }) => {
        setCommodities((data as Commodity[]) ?? [])
        setLoading(false)
      })
  }, [])

  const currentBulan = currentClimate?.bulan ?? new Date().getMonth() + 1

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
              <p className="text-xs text-muted-foreground">Jadwal tanam komoditas per bulan</p>
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
              const score = currentClimate
                ? scoreCommodity(c, currentClimate.ch_mm, currentClimate.suhu, currentClimate.kelembaban, currentClimate.air_tanah)
                : 50

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
                    const cellScore = getCellStatus(bulan, plantingMonths, score)
                    const isCurrentMonth = bulan === currentBulan

                    return (
                      <td key={i} className="px-0.5 py-1.5 text-center">
                        <div
                          className={`relative mx-auto size-8 rounded-lg flex items-center justify-center cursor-pointer transition-all hover:scale-110 hover:shadow-sm ${
                            CELL_STYLES[cellScore]
                          } ${
                            isCurrentMonth ? 'ring-2 ring-agri-green ring-offset-1' : ''
                          }`}
                          title={`${c.nama} - ${BULAN_SHORT[i]}: ${STATUS_LABELS[cellScore]}`}
                          onMouseEnter={() => setTooltip(`${c.nama} – ${BULAN_SHORT[i]}: ${STATUS_LABELS[cellScore]}`)}
                          onMouseLeave={() => setTooltip(null)}
                          role="cell"
                          aria-label={`${c.nama} bulan ${BULAN_SHORT[i]}: ${STATUS_LABELS[cellScore]}`}
                        >
                          {cellScore !== 'off' && (
                            <span className="text-[10px] font-bold">
                              {cellScore === 'cocok' ? '✓' : cellScore === 'cukup' ? '~' : '×'}
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
