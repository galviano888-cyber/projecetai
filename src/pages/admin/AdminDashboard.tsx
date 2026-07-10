import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ClimateData } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { CloudRain, Thermometer, Droplets, Layers, TrendingUp, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

const BULAN_NAMES = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
]

export default function AdminDashboard() {
  const [latestData, setLatestData] = useState<ClimateData | null>(null)
  const [totalData, setTotalData] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchSummary() {
      try {
        const [{ data: latest, error: e1 }, { count, error: e2 }] = await Promise.all([
          supabase
            .from('climate_data')
            .select('*')
            .order('tahun', { ascending: false })
            .order('bulan', { ascending: false })
            .limit(1)
            .single(),
          supabase
            .from('climate_data')
            .select('*', { count: 'exact', head: true }),
        ])
        if (cancelled) return
        if (!e1 && latest) setLatestData(latest as ClimateData)
        if (!e2) setTotalData(count ?? 0)
      } catch {
        // Gagal memuat summary — biarkan loading selesai tanpa crash
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchSummary()
    return () => { cancelled = true }
  }, [])

  const stats = latestData ? [
    { label: 'Curah Hujan', value: `${latestData.ch_mm} mm`, icon: CloudRain, color: 'text-agri-blue', bg: 'bg-agri-blue/10' },
    { label: 'Suhu', value: `${latestData.suhu} °C`, icon: Thermometer, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Kelembaban', value: `${latestData.kelembaban} %`, icon: Droplets, color: 'text-agri-green', bg: 'bg-agri-green/10' },
    { label: 'Air Tanah', value: `${latestData.air_tanah} %`, icon: Layers, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ] : []

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Dashboard Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">Selamat datang di panel admin AgroDemak.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="col-span-2 lg:col-span-4 shadow-sm">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-agri-green/10 flex items-center justify-center">
                  <TrendingUp className="size-5 text-agri-green" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Data Iklim Tersimpan</p>
                  {loading
                    ? <div className="h-6 w-16 bg-muted rounded animate-pulse mt-0.5" />
                    : <p className="text-2xl font-bold text-foreground">{totalData} <span className="text-sm font-normal text-muted-foreground">entri</span></p>
                  }
                </div>
              </div>
              <Link
                to="/admin/iklim"
                className="flex items-center gap-2 text-sm font-medium text-agri-green hover:text-agri-green-dark transition-colors"
              >
                <Plus className="size-4" /> Tambah Data
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Latest climate data */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardContent className="pt-5">
                <div className="h-4 w-20 bg-muted rounded animate-pulse mb-3" />
                <div className="h-7 w-16 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : latestData ? (
        <>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">Data Terbaru:</p>
            <span className="text-sm text-agri-green font-semibold">
              {BULAN_NAMES[latestData.bulan]} {latestData.tahun}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map((stat) => (
              <Card key={stat.label} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-5 pb-5">
                  <div className={`size-9 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                    <stat.icon className={`size-4 ${stat.color}`} />
                  </div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-bold text-foreground mt-0.5">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card className="shadow-sm border-dashed">
          <CardContent className="pt-8 pb-8 text-center">
            <CloudRain className="size-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">Belum ada data iklim</p>
            <p className="text-xs text-muted-foreground mt-1">Mulai dengan menambah data di menu Data Iklim.</p>
            <Link
              to="/admin/iklim"
              className="inline-flex items-center gap-2 mt-4 text-sm text-agri-green hover:text-agri-green-dark font-medium transition-colors"
            >
              <Plus className="size-4" /> Tambah Data Sekarang
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick links */}
      <div>
        <p className="text-sm font-semibold text-foreground mb-3">Menu Cepat</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { to: '/admin/iklim', icon: CloudRain, label: 'Input Data Iklim', desc: 'Tambah data curah hujan, suhu, kelembaban' },
            { to: '/admin/komoditas', icon: Layers, label: 'Kelola Komoditas', desc: 'CRUD data tanaman dan syarat tumbuhnya' },
            { to: '/admin/library', icon: Droplets, label: 'Kelola Library', desc: 'Konten edukasi dan tips budidaya tanaman' },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex gap-3 p-4 rounded-xl border border-border hover:border-agri-green/30 hover:bg-agri-green-light/20 transition-all group"
            >
              <div className="size-9 rounded-xl bg-agri-green/10 flex items-center justify-center shrink-0 group-hover:bg-agri-green/20 transition-colors">
                <item.icon className="size-4 text-agri-green" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
