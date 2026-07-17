import { useState, useEffect, useMemo } from "react"
import { Link } from "react-router-dom"
import { CloudRain, BrainCircuit, CircleCheck as CheckCircle2, Sprout, Menu, X, ChevronDown, Droplets, TrendingUp, TriangleAlert as AlertTriangle, BarChart2, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ClimateCharts } from "@/components/ClimateCharts"
import { KalenderTanamView } from "@/components/KalenderTanamView"
import { SeasonIndicator } from "@/components/SeasonIndicator"
import { RecommendationCard } from "@/components/RecommendationCard"
import { useClimateData, useAvailableYears } from "@/hooks/useClimateData"
import { useCurrentClimate } from "@/contexts/ClimateContext"
import { usePrediksiIklim } from "@/hooks/useKalenderTanam"

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks = [
    { label: "Beranda", href: "#beranda" },
    { label: "Dashboard", href: "#dashboard" },
    { label: "Library", href: "/library" },
    { label: "Edukasi", href: "#edukasi" },
    { label: "Profil", href: "#profil" },
  ]

  // Dashboard data
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const { data: climateData, loading: climateLoading, error: climateError } = useClimateData(selectedYear)
  const { currentClimate, error: currentClimateError } = useCurrentClimate()
  const availableYears = useAvailableYears()

  // Data prediksi BMKG (sumber utama dashboard & rekomendasi)
  const { data: prediksiData, current: prediksiCurrent } = usePrediksiIklim(selectedYear)

  // Pakai prediksi sebagai sumber utama; fallback ke climate_data historis bila kosong
  const dashboardClimate = prediksiCurrent ?? currentClimate
  const chartData = prediksiData.length > 0 ? prediksiData : climateData

  // Memoize stat cards agar tidak dihitung ulang setiap render
  const currentClimateStats = useMemo(() => {
    if (!dashboardClimate) return []
    return [
      { label: 'Curah Hujan', value: `${dashboardClimate.ch_mm}`, unit: 'mm', icon: CloudRain, color: 'text-agri-blue', bg: 'bg-agri-blue/10' },
      { label: 'Suhu', value: `${dashboardClimate.suhu}`, unit: '\u00b0C', icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-500/10' },
      { label: 'Kelembaban', value: `${dashboardClimate.kelembaban}`, unit: '%', icon: Droplets, color: 'text-agri-green', bg: 'bg-agri-green/10' },
      { label: 'Air Tanah', value: `${dashboardClimate.air_tanah}`, unit: '%', icon: BarChart2, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    ]
  }, [dashboardClimate])

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Top utility bar - kesan resmi institusi */}
      <div className="hidden md:block bg-agri-green-dark text-white/80 text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-end h-9">
          <div className="flex items-center gap-4">
            <span>Sistem Pakar Kalender Tanam</span>
            <span className="text-white/40">|</span>
            <span className="text-agri-yellow font-medium">Berbasis Prediksi Iklim BMKG</span>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <header
        className={`sticky top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? "glass shadow-soft border-b border-border/60" : "bg-transparent"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <a href="#beranda" className="flex items-center gap-3 group">
              <div className="flex size-11 items-center justify-center rounded-xl bg-white shadow-soft ring-1 ring-border/60 overflow-hidden">
                <img
                  src="/logo-stmkg.png"
                  alt="STMKG"
                  className="h-8 w-auto object-contain"
                />
              </div>
              <div className="leading-tight">
                <h1 className={`text-base font-extrabold tracking-tight transition-colors ${scrolled ? "text-agri-green-dark" : "text-white"}`}>
                  Agro<span className="text-agri-yellow">Demak</span>
                </h1>
                <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${scrolled ? "text-muted-foreground" : "text-white/70"}`}>
                  Sistem Pakar Pertanian
                </p>
              </div>
            </a>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const cls = `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  scrolled
                    ? "text-foreground/80 hover:bg-agri-green-light hover:text-agri-green-dark"
                    : "text-white/90 hover:text-white hover:bg-white/10"
                }`
                return link.href.startsWith('/') ? (
                  <Link key={link.label} to={link.href} className={cls}>{link.label}</Link>
                ) : (
                  <a key={link.label} href={link.href} className={cls}>{link.label}</a>
                )
              })}
              <a
                href="#dashboard"
                className={`ml-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  scrolled
                    ? "bg-agri-green text-white hover:bg-agri-green-dark shadow-soft"
                    : "bg-agri-yellow text-amber-900 hover:bg-amber-300"
                }`}
              >
                Buka Dashboard
              </a>
            </nav>

            <button
              className={`md:hidden p-2 rounded-lg ${scrolled ? "text-foreground hover:bg-muted" : "text-white hover:bg-white/10"}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden glass border-b border-border shadow-soft px-4 pb-4 pt-2">
            {navLinks.map((link) => {
              const cls = "block py-2.5 text-sm font-medium text-foreground hover:text-agri-green border-b border-border/50 last:border-0"
              return link.href.startsWith('/') ? (
                <Link key={link.label} to={link.href} onClick={() => setMenuOpen(false)} className={cls}>{link.label}</Link>
              ) : (
                <a key={link.label} href={link.href} onClick={() => setMenuOpen(false)} className={cls}>{link.label}</a>
              )
            })}
          </div>
        )}
      </header>

      {/* Hero */}
      <section
        id="beranda"
        className="relative flex items-center justify-center overflow-hidden -mt-16 min-h-[calc(100vh-0px)]"
        style={{
          backgroundImage: "url(/hero-rice-field.webp)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-agri-green-dark/92 via-agri-green-dark/75 to-black/70" />
        <div className="absolute inset-0 bg-grid opacity-30" />
        {/* Glow accents */}
        <div className="absolute -top-20 -left-20 size-96 rounded-full bg-agri-green/30 blur-[120px]" />
        <div className="absolute bottom-0 right-0 size-96 rounded-full bg-agri-blue/20 blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 text-center pt-28 pb-20">
          <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-white/15 glass-dark px-5 py-2 animate-fade-up">
            <div className="relative flex size-2 items-center justify-center">
              <span className="absolute size-full rounded-full bg-agri-yellow animate-ping opacity-75" />
              <span className="relative size-1.5 rounded-full bg-agri-yellow" />
            </div>
            <span className="text-[10px] font-bold text-white/90 uppercase tracking-[0.22em] leading-none">
              Monitoring Iklim Wilayah Demak
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-white leading-[1.08] tracking-tight text-balance mb-6 animate-fade-up" style={{ animationDelay: '60ms' }}>
            Tentukan Waktu Tanam Terbaik <br className="hidden sm:block" />
            <span className="text-agri-yellow">Berdasarkan Iklim</span> Demak
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-white/80 leading-relaxed mb-9 text-balance animate-fade-up" style={{ animationDelay: '120ms' }}>
            Sistem pakar kalender tanam berbasis prediksi iklim BMKG untuk komoditas unggulan
            Demak — padi, jagung, kedelai, bawang merah, hingga hortikultura.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-up" style={{ animationDelay: '180ms' }}>
            <Button
              size="lg"
              className="bg-agri-yellow hover:bg-amber-300 text-amber-900 font-bold px-8 py-6 text-base shadow-soft-lg transition-all hover:-translate-y-0.5"
              onClick={() => document.getElementById("dashboard")?.scrollIntoView({ behavior: "smooth" })}
            >
              Lihat Dashboard
              <ChevronDown className="size-4 ml-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/40 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm px-8 py-6 text-base"
              onClick={() => document.getElementById("edukasi")?.scrollIntoView({ behavior: "smooth" })}
            >
              Pelajari Cara Kerja
            </Button>
          </div>

          <div className="mt-14 grid grid-cols-3 gap-3 sm:gap-4 max-w-xl mx-auto animate-fade-up" style={{ animationDelay: '240ms' }}>
            {[
              { value: "4", label: "Komoditas Tervalidasi" },
              { value: "BMKG", label: "Sumber Data Iklim" },
              { value: "CF", label: "Metode Sistem Pakar" },
            ].map((stat) => (
              <div key={stat.label} className="group relative rounded-2xl glass-dark border border-white/15 p-4 transition-all hover:border-white/30 hover:-translate-y-0.5">
                <p className="text-2xl sm:text-3xl font-extrabold text-white group-hover:scale-105 transition-transform">{stat.value}</p>
                <p className="text-[10px] text-white/60 uppercase tracking-[0.15em] mt-1 font-bold">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="size-6 text-white/50" />
        </div>
      </section>

      {/* ─── Dashboard Section ─── */}
      <section id="dashboard" className="py-20 bg-background relative">
        <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-agri-green/10 text-agri-green-dark border-agri-green/20 hover:bg-agri-green/10">
              Data Iklim Terkini
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
              Dashboard Iklim <span className="text-gradient-green">Kabupaten Demak</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Data iklim bulanan Kabupaten Demak berdasarkan pencatatan dan prediksi BMKG.
            </p>
          </div>

          {/* Season indicator + year selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            {dashboardClimate ? (
              <SeasonIndicator
                ch_mm={dashboardClimate.ch_mm}
                bulan={prediksiCurrent?.bulan ?? currentClimate?.bulan}
                tahun={selectedYear}
              />
            ) : (
              <div className="h-14 w-64 rounded-2xl bg-muted animate-pulse" />
            )}

            {/* Year selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-medium">Tahun:</span>
              {availableYears.length > 0 ? (
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="h-9 rounded-lg border border-input bg-white px-3 text-sm font-medium outline-none focus-visible:border-agri-green focus-visible:ring-2 focus-visible:ring-agri-green/20"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              ) : (
                <span className="text-sm text-muted-foreground">{selectedYear}</span>
              )}
            </div>
          </div>

          {/* Stats summary cards */}
          {dashboardClimate && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {currentClimateStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-border bg-card p-5 shadow-soft hover:shadow-soft-lg transition-all hover:-translate-y-0.5">
                  <div className={`size-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                    <stat.icon className={`size-5 ${stat.color}`} />
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                  <p className="text-2xl font-extrabold text-foreground mt-0.5 tracking-tight">
                    {stat.value} <span className="text-xs font-normal text-muted-foreground">{stat.unit}</span>
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Error state grafik iklim */}
          {climateError && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              <span>Gagal memuat data iklim: {climateError}. Periksa koneksi atau konfigurasi Supabase.</span>
            </div>
          )}

          {/* Error state iklim bulan ini */}
          {!dashboardClimate && currentClimateError && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-300 bg-agri-yellow/10 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="size-4 shrink-0" />
              <span>Data prediksi iklim belum tersedia. Admin perlu mengisi data di menu Prediksi BMKG terlebih dahulu.</span>
            </div>
          )}

          {/* Info bila dashboard pakai data prediksi (bukan bulan berjalan) */}
          {prediksiCurrent && prediksiCurrent.bulan !== (new Date().getMonth() + 1) && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-agri-blue/20 bg-agri-blue/5 px-4 py-3 text-sm text-agri-blue">
              <AlertTriangle className="size-4 shrink-0" />
              <span>
                Menampilkan data prediksi bulan terakhir yang tersedia:
                <strong> {new Date(0, prediksiCurrent.bulan - 1).toLocaleString('id-ID', { month: 'long' })} {selectedYear}</strong>.
              </span>
            </div>
          )}

          {/* Rekomendasi Sistem Pakar */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Sprout className="size-4 text-agri-green" />
              <h3 className="text-base font-semibold text-foreground">Rekomendasi Komoditas Bulan Ini</h3>
              <Badge className="text-xs bg-agri-green/10 text-agri-green-dark border-agri-green/20">
                Top 3
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Dihitung otomatis menggunakan sistem pakar berbasis prediksi iklim BMKG.
              Metode: Forward Chaining + Certainty Factor.
            </p>
            <RecommendationCard bulan={new Date().getMonth() + 1} tahun={selectedYear} topN={3} />
          </div>

          {/* Planting Calendar */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays className="size-4 text-agri-green" />
              <h3 className="text-base font-semibold text-foreground">Kalender Tanam Komoditas</h3>
            </div>
            <KalenderTanamView defaultYear={selectedYear} />
          </div>

          {/* Climate Charts */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="size-4 text-agri-green" />
              <h3 className="text-base font-semibold text-foreground">Grafik Iklim Bulanan</h3>
              {climateLoading && <span className="text-xs text-muted-foreground animate-pulse">Memuat data...</span>}
            </div>
            <ClimateCharts data={chartData} />
          </div>
        </div>
      </section>



      {/* Commodities */}
      <section className="py-20 bg-agri-green-dark text-white overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
              <Badge className="mb-4 bg-agri-yellow text-amber-900 border-none hover:bg-agri-yellow/90">Analisis Pertanian Demak</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">Potensi Pertanian <br /> Kabupaten Demak</h2>
              <p className="text-white/70 text-lg mb-8 leading-relaxed text-justify">
                Demak dikenal sebagai lumbung pangan Jawa Tengah. Sistem ini berfokus pada 4 komoditas
                unggulan daerah yang tervalidasi secara empiris, mencakup padi sawah hingga hortikultura bernilai tinggi.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: "Tanaman Pangan", items: "Padi Sawah" },
                  { title: "Hortikultura Sayuran", items: "Cabai Keriting, Cabai Rawit, Tomat" },
                ].map((cat) => (
                  <div key={cat.title} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <h4 className="font-bold text-agri-yellow text-sm uppercase tracking-wider mb-1">{cat.title}</h4>
                    <p className="text-sm text-white/80">{cat.items}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2 relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4 pt-8">
                  <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl hover:scale-105 transition-transform">
                    <img src="/sawah_padi.webp" alt="Padi Sawah Demak" loading="lazy" className="w-full h-full object-cover" />
                  </div>
                  <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl hover:scale-105 transition-transform">
                    <img src="/cabai.webp" alt="Cabai Keriting & Rawit" loading="lazy" className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl hover:scale-105 transition-transform">
                    <img src="/panen_sayuran.webp" alt="Panen Sayuran Demak" loading="lazy" className="w-full h-full object-cover" />
                  </div>
                  <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl hover:scale-105 transition-transform">
                    <img src="/hero-rice-field.webp" alt="Lahan Pertanian Demak" loading="lazy" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
              <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-64 bg-agri-green rounded-full blur-[100px] opacity-20" />
            </div>
          </div>
        </div>
      </section>

      {/* Educational */}
      <section id="edukasi" className="py-20 bg-secondary/40 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge className="mb-3 bg-agri-blue/10 text-agri-blue border-agri-blue/20 hover:bg-agri-blue/10">Transparansi Sistem</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">Bagaimana Sistem Ini Bekerja?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Data prediksi iklim BMKG diproses sistem pakar untuk menghasilkan kalender tanam dan rekomendasi komoditas tiap bulan.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                icon: CloudRain,
                title: "Data Prediksi Iklim",
                subtitle: "Input oleh Admin",
                description: "Admin memasukkan data prediksi iklim bulanan Kabupaten Demak — curah hujan, suhu, kelembaban, dan ketersediaan air tanah — berdasarkan prakiraan resmi BMKG.",
                iconBg: "bg-agri-green/10", iconColor: "text-agri-green",
                borderColor: "border-agri-green/30", stepBg: "bg-agri-green text-white", subtitleColor: "text-agri-green"
              },
              {
                step: "02",
                icon: BrainCircuit,
                title: "Sistem Pakar Berjalan",
                subtitle: "Forward Chaining + Certainty Factor",
                description: "Mesin inferensi mencocokkan prediksi iklim dengan syarat tumbuh tiap tanaman per fase (Forward Chaining), lalu menghitung derajat keyakinan dengan metode Certainty Factor (Shortliffe & Buchanan, 1975).",
                iconBg: "bg-agri-blue/10", iconColor: "text-agri-blue",
                borderColor: "border-agri-blue/30", stepBg: "bg-agri-blue text-white", subtitleColor: "text-agri-blue"
              },
              {
                step: "03",
                icon: CheckCircle2,
                title: "Kalender Tanam Tampil",
                subtitle: "Nilai CF & Rekomendasi",
                description: "Setiap tanaman mendapat nilai Certainty Factor 0–100% per bulan tanam. Kalender tanam dan rekomendasi komoditas terbaik tampil otomatis di dashboard beserta detail penalaran tiap fase.",
                iconBg: "bg-agri-yellow/20", iconColor: "text-amber-700",
                borderColor: "border-agri-yellow/40", stepBg: "bg-agri-yellow text-amber-900", subtitleColor: "text-amber-700"
              },
            ].map((item) => (
              <Card key={item.step} className={`h-full border-2 ${item.borderColor} rounded-2xl shadow-md hover:shadow-xl transition-all hover:-translate-y-1 group`}>
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <span className={`inline-flex size-8 items-center justify-center rounded-full text-xs font-bold ${item.stepBg}`}>{item.step}</span>
                    <div className="h-px flex-1 border-t border-dashed border-border" />
                  </div>
                  <div className={`mb-5 inline-flex size-14 items-center justify-center rounded-2xl ${item.iconBg} group-hover:scale-110 transition-transform`}>
                    <item.icon className={`size-7 ${item.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">{item.title}</h3>
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${item.subtitleColor}`}>{item.subtitle}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed text-justify">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-12 rounded-2xl bg-agri-green/5 border border-agri-green/20 p-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-agri-green/10">
              <Sprout className="size-6 text-agri-green" />
            </div>
            <div className="text-center sm:text-left">
              <p className="font-semibold text-foreground">Berbasis Referensi Ilmiah Terverifikasi</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Basis aturan bersumber dari Oldeman (1975) untuk klasifikasi iklim, Ritung et al. (2011)
                BBSDLP untuk evaluasi lahan, dan FAO-56 (Allen et al., 1998) untuk fase tumbuh tanaman.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="profil" className="bg-agri-green-dark text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex size-9 items-center justify-center rounded-lg bg-white/10">
                  <Sprout className="size-5 text-agri-yellow" />
                </div>
                <div>
                  <p className="font-bold text-white">AgroDemak</p>
                  <p className="text-xs text-white/60">Sistem Pakar Pertanian</p>
                </div>
              </div>
              <p className="text-sm text-white/80 leading-relaxed text-justify max-w-sm">
                Platform cerdas rekomendasi komoditas pertanian berbasis prediksi parameter iklim untuk membantu petani dan penyuluh di wilayah Kabupaten Demak.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide">Navigasi</h4>
              <ul className="space-y-2">
                {navLinks.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-white/70 hover:text-agri-yellow transition-colors flex items-center gap-2">
                      <span className="size-1 rounded-full bg-agri-yellow/40" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide">Tentang Sistem</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2"><span className="text-agri-yellow">&#9657;</span> Metode: Forward Chaining</li>
                <li className="flex items-center gap-2"><span className="text-agri-yellow">&#9657;</span> Evaluasi: Certainty Factor</li>
                <li className="flex items-center gap-2"><span className="text-agri-yellow">&#9657;</span> Komoditas: Padi Sawah, Cabai Keriting, Cabai Rawit, Tomat</li>
                <li className="flex items-center gap-2"><span className="text-agri-yellow">&#9657;</span> Wilayah: Kabupaten Demak</li>
              </ul>
            </div>
          </div>
          <Separator className="bg-white/10 mb-6" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-white/60 text-center sm:text-left">
              &copy; 2026 Dikembangkan oleh <span className="font-semibold text-agri-yellow">Galih Oktaviano</span> | AgroDemak
            </p>

          </div>
        </div>
      </footer>
    </div>
  )
}
