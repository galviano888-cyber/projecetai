import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ClimateDataWithMonth } from '@/hooks/useClimateData'
import { CloudRain, Thermometer, Droplets, Layers } from 'lucide-react'

interface ClimateChartsProps {
  data: ClimateDataWithMonth[]
}

// Custom Tooltip
function CustomTooltip({ active, payload, label, unit }: {
  active?: boolean
  payload?: Array<{ value: number; color: string; name: string }>
  label?: string
  unit: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-white shadow-lg px-3 py-2.5 text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold text-foreground">{p.value} {unit}</span>
        </div>
      ))}
    </div>
  )
}

export function ClimateCharts({ data }: ClimateChartsProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center">
        <CloudRain className="size-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-semibold text-foreground">Belum ada data iklim</p>
        <p className="text-xs text-muted-foreground mt-1">
          Admin perlu menambahkan data iklim terlebih dahulu.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Curah Hujan */}
      <ChartCard
        title="Curah Hujan"
        subtitle="mm/bulan"
        icon={CloudRain}
        iconColor="text-agri-blue"
        iconBg="bg-agri-blue/10"
      >
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="bulan_nama"
              tick={{ fontSize: 11, fill: '#888' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#888' }}
              axisLine={false}
              tickLine={false}
              unit=" mm"
            />
            <Tooltip content={<TooltipMM />} />
            <Bar
              dataKey="ch_mm"
              name="Curah Hujan"
              fill="oklch(0.55 0.18 230)"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Suhu */}
      <ChartCard
        title="Suhu Rata-rata"
        subtitle="°C"
        icon={Thermometer}
        iconColor="text-orange-500"
        iconBg="bg-orange-500/10"
      >
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="suhuGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="bulan_nama"
              tick={{ fontSize: 11, fill: '#888' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#888' }}
              axisLine={false}
              tickLine={false}
              unit="°C"
              domain={['auto', 'auto']}
            />
            <Tooltip content={<TooltipC />} />
            <Area
              type="monotone"
              dataKey="suhu"
              name="Suhu"
              stroke="#f97316"
              strokeWidth={2.5}
              fill="url(#suhuGrad)"
              dot={{ r: 3, fill: '#f97316' }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Kelembaban */}
      <ChartCard
        title="Kelembaban Udara"
        subtitle="%"
        icon={Droplets}
        iconColor="text-agri-green"
        iconBg="bg-agri-green/10"
      >
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="kelembGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.48 0.14 145)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="oklch(0.48 0.14 145)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="bulan_nama"
              tick={{ fontSize: 11, fill: '#888' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#888' }}
              axisLine={false}
              tickLine={false}
              unit="%"
              domain={[0, 100]}
            />
            <Tooltip content={<TooltipPct />} />
            <Area
              type="monotone"
              dataKey="kelembaban"
              name="Kelembaban"
              stroke="oklch(0.48 0.14 145)"
              strokeWidth={2.5}
              fill="url(#kelembGrad)"
              dot={{ r: 3, fill: 'oklch(0.48 0.14 145)' }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Air Tanah */}
      <ChartCard
        title="Ketersediaan Air Tanah"
        subtitle="%"
        icon={Layers}
        iconColor="text-purple-500"
        iconBg="bg-purple-500/10"
      >
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="airGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="bulan_nama"
              tick={{ fontSize: 11, fill: '#888' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#888' }}
              axisLine={false}
              tickLine={false}
              unit=" %"
            />
            <Tooltip content={<TooltipAir />} />
            <Area
              type="monotone"
              dataKey="air_tanah"
              name="Air Tanah"
              stroke="#a855f7"
              strokeWidth={2.5}
              fill="url(#airGrad)"
              dot={{ r: 3, fill: '#a855f7' }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}

// Wrapper untuk custom tooltip agar bisa terima unit
function makeTooltip(unit: string) {
  const TooltipComponent = (props: {
    active?: boolean
    payload?: Array<{ value: number; color: string; name: string }>
    label?: string
  }) => <CustomTooltip {...props} unit={unit} />
  TooltipComponent.displayName = 'TooltipComponent'
  return TooltipComponent
}

const TooltipMM = makeTooltip('mm')
const TooltipC = makeTooltip('°C')
const TooltipPct = makeTooltip('%')
const TooltipAir = makeTooltip('%')

// Chart Card wrapper
interface ChartCardProps {
  title: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  iconColor: string
  iconBg: string
  children: React.ReactNode
}

function ChartCard({ title, subtitle, icon: Icon, iconColor, iconBg, children }: ChartCardProps) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-5 px-5">
        <div className="flex items-center gap-3">
          <div className={`size-9 rounded-xl ${iconBg} flex items-center justify-center`}>
            <Icon className={`size-4 ${iconColor}`} />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-4">
        {children}
      </CardContent>
    </Card>
  )
}
