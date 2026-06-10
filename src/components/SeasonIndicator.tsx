import { detectSeason } from '@/hooks/useClimateData'
import { CloudRain, Sun, Wind } from 'lucide-react'

interface SeasonIndicatorProps {
  ch_mm: number
  bulan?: number
  tahun?: number
  size?: 'sm' | 'md'
}

const BULAN_NAMES = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

export function SeasonIndicator({ ch_mm, bulan, tahun, size = 'md' }: SeasonIndicatorProps) {
  const season = detectSeason(ch_mm)

  const config = {
    hujan: {
      label: 'Musim Hujan',
      icon: CloudRain,
      bg: 'bg-agri-blue/15 border-agri-blue/30',
      text: 'text-agri-blue',
      dot: 'bg-agri-blue',
      emoji: '🌧️',
    },
    kemarau: {
      label: 'Musim Kemarau',
      icon: Sun,
      bg: 'bg-agri-yellow/20 border-agri-yellow/40',
      text: 'text-amber-700',
      dot: 'bg-agri-yellow',
      emoji: '☀️',
    },
    pancaroba: {
      label: 'Pancaroba',
      icon: Wind,
      bg: 'bg-agri-green/10 border-agri-green/20',
      text: 'text-agri-green-dark',
      dot: 'bg-agri-green',
      emoji: '🌤️',
    },
  }[season]

  const Icon = config.icon

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${config.bg} ${config.text}`}>
        <span className="text-sm">{config.emoji}</span>
        {config.label}
      </span>
    )
  }

  return (
    <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${config.bg}`}>
      <div className={`flex size-10 items-center justify-center rounded-xl ${config.bg}`}>
        <Icon className={`size-5 ${config.text}`} />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${config.text}`}>
            {config.emoji} {config.label}
          </span>
          <span className={`size-2 rounded-full ${config.dot} animate-pulse`} />
        </div>
        {bulan && tahun && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {BULAN_NAMES[bulan]} {tahun} &bull; CH: {ch_mm} mm/bulan
          </p>
        )}
      </div>
    </div>
  )
}
