import { useState, useEffect } from "react"
import { CloudRain, BrainCircuit, CircleCheck as CheckCircle2, Lightbulb, Sprout, Menu, X, ChevronDown, Droplets, TrendingUp, TriangleAlert as AlertTriangle, BarChart2, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { ClimateCharts } from "@/components/ClimateCharts"
import { PlantingCalendar } from "@/components/PlantingCalendar"
import { SeasonIndicator } from "@/components/SeasonIndicator"
import { RecommendationCard } from "@/components/RecommendationCard"
import { useClimateData, useCurrentMonthClimate, useAvailableYears } from "@/hooks/useClimateData"

type WaterAvailability = "Sangat Cukup" | "Cukup" | "Sedang" | "Kurang" | "Sangat Kurang" | ""

interface AnalysisResult {
  recommendation: string
  commodity: string
  certaintyFactor: number
  reason: string
  status: "safe" | "warning" | "danger"
  alternatives?: {
    commodity: string
    certaintyFactor: number
    reason: string
  }[]
}

function getRecommendation(rainfall: number, water: WaterAvailability): AnalysisResult {
  let cf = 80;

  const isSurplus = water === "Sangat Cukup" || water === "Cukup";
  const isNormal = water === "Sedang";

  if (rainfall > 300) {
    if (isSurplus) {
      cf = Math.max(85, 98 - Math.abs(400 - rainfall) * 0.05);
      return {
        recommendation: "PADI SAWAH",
        commodity: "Padi Sawah (Varietas Unggul)",
        certaintyFactor: Math.round(cf),
        reason: "Kondisi air berlebih (Cukup/Sangat Cukup) dan curah hujan tinggi/sangat tinggi (>300mm) sangat ideal untuk budidaya padi sawah. Pasokan air melimpah mendukung fase vegetatif secara optimal.",
        status: "safe",
        alternatives: [
          { commodity: "Sayuran Air (Kangkung)", certaintyFactor: Math.round(cf * 0.8), reason: "Sangat adaptif terhadap genangan air tinggi." },
          { commodity: "Padi Rawa", certaintyFactor: Math.round(cf * 0.65), reason: "Alternatif untuk lahan yang rawan tergenang dalam waktu lama." }
        ]
      }
    } else {
      cf = Math.max(75, 90 - Math.abs(350 - rainfall) * 0.05);
      return {
        recommendation: "PADI TADAH HUJAN",
        commodity: "Padi Tadah Hujan",
        certaintyFactor: Math.round(cf),
        reason: "Walaupun air tanah tidak berlebih, curah hujan tinggi (>300mm) memaksa penanaman komoditas rakus air untuk menghindari gagal panen akibat akar busuk pada palawija.",
        status: "warning",
        alternatives: [
          { commodity: "Singkong / Ubi", certaintyFactor: Math.round(cf * 0.85), reason: "Cukup tahan terhadap curah hujan ekstrem jika ditanam di bedengan tinggi." },
          { commodity: "Jagung Manis", certaintyFactor: Math.round(cf * 0.7), reason: "Bisa dipaksakan tumbuh asal memiliki sistem drainase parit yang sangat baik." }
        ]
      }
    }
  } else if (rainfall > 100 && rainfall <= 300) {
    if (isSurplus) {
      cf = Math.max(80, 95 - Math.abs(200 - rainfall) * 0.1);
      return {
        recommendation: "JAMBU AIR / BELIMBING",
        commodity: "Jambu Air (Merah Delima) atau Belimbing",
        certaintyFactor: Math.round(cf),
        reason: "Air tanah cukup/sangat cukup dipadu curah hujan menengah (101-300mm) sangat mendukung kualitas buah unggulan Demak agar bunganya tidak mudah rontok.",
        status: "safe",
        alternatives: [
          { commodity: "Bawang Merah", certaintyFactor: Math.round(cf * 0.8), reason: "Risiko pembusukan sedang, butuh pengawasan ekstra pada tata kelola air bedengan." },
          { commodity: "Jagung", certaintyFactor: Math.round(cf * 0.75), reason: "Dapat tumbuh sangat subur asalkan saluran drainase lancar." }
        ]
      }
    } else if (isNormal) {
      cf = Math.max(82, 96 - Math.abs(200 - rainfall) * 0.1);
      return {
        recommendation: "JAGUNG / BAWANG MERAH",
        commodity: "Jagung Hibrida atau Bawang Merah",
        certaintyFactor: Math.round(cf),
        reason: "Kondisi air tanah sedang dan curah hujan menengah adalah kondisi paling absolut di Demak untuk Bawang Merah atau Jagung yang butuh drainase berimbang.",
        status: "safe",
        alternatives: [
          { commodity: "Kacang Hijau", certaintyFactor: Math.round(cf * 0.85), reason: "Dapat ditanam dengan risiko sangat rendah jika irigasi terkontrol." },
          { commodity: "Kedelai", certaintyFactor: Math.round(cf * 0.78), reason: "Tumbuh maksimal pada kelembapan menengah tanpa ada genangan sedikitpun." }
        ]
      }
    } else {
      cf = Math.max(78, 88 - Math.abs(200 - rainfall) * 0.1);
      return {
        recommendation: "KEDELAI / KACANG TANAH",
        commodity: "Kedelai atau Kacang Tanah",
        certaintyFactor: Math.round(cf),
        reason: "Meskipun air tanah kurang, bantuan dari curah hujan menengah (101-300mm) cukup menyelamatkan palawija yang tidak terlalu rakus air.",
        status: "warning",
        alternatives: [
          { commodity: "Kacang Hijau", certaintyFactor: Math.round(cf * 0.9), reason: "Sangat adaptif mengejar ketersediaan air yang terbatas." },
          { commodity: "Tembakau", certaintyFactor: Math.round(cf * 0.7), reason: "Curah hujan menengah yang mendekati 300mm mulai berisiko menurunkan kualitas daun tembakau." }
        ]
      }
    }
  } else {
    if (isSurplus) {
      cf = Math.max(80, 92 - Math.abs(50 - rainfall) * 0.1);
      return {
        recommendation: "JAMBU AIR / BELIMBING",
        commodity: "Jambu Air (Merah Delima) atau Belimbing",
        certaintyFactor: Math.round(cf),
        reason: "Hujan dari langit tergolong rendah (0-100mm), namun ini bukan masalah karena akar pohon buah bisa memompa cadangan air tanah yang cukup/sangat cukup.",
        status: "safe",
        alternatives: [
          { commodity: "Semangka / Melon", certaintyFactor: Math.round(cf * 0.85), reason: "Akar buah menyerap air tanah, curah hujan rendah mencegah jamur merusak daun." },
          { commodity: "Jagung", certaintyFactor: Math.round(cf * 0.7), reason: "Bisa ditanam namun perlu penyiraman bantuan memompa air tanah." }
        ]
      }
    } else {
      cf = Math.max(82, 97 - Math.abs(0 - rainfall) * 0.1);
      return {
        recommendation: "TEMBAKAU / KACANG HIJAU",
        commodity: "Tembakau atau Kacang Hijau",
        certaintyFactor: Math.round(cf),
        reason: "Pada musim kemarau (hujan rendah 0-100mm & air tanah sedang/kurang), ini adalah pilihan super. Tembakau justru menghasilkan kualitas daun terbaik saat kekeringan.",
        status: "safe",
        alternatives: [
          { commodity: "Kacang Tanah", certaintyFactor: Math.round(cf * 0.88), reason: "Memiliki daya tahan luar biasa tangguh pada lahan kering dan gersang." },
          { commodity: "Singkong", certaintyFactor: Math.round(cf * 0.75), reason: "Pilihan paling akhir yang selalu bisa bertahan di cuaca ekstrem kering." }
        ]
      }
    }
  }
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [rainfall, setRainfall] = useState("")
  const [water, setWater] = useState<WaterAvailability>("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [cfAnimated, setCfAnimated] = useState(0)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (result) {
      setCfAnimated(0)
      const target = result.certaintyFactor
      let current = 0
      const step = target / 60
      const interval = setInterval(() => {
        current += step
        if (current >= target) {
          setCfAnimated(target)
          clearInterval(interval)
        } else {
          setCfAnimated(Math.round(current))
        }
      }, 16)
      return () => clearInterval(interval)
    }
  }, [result])

  function handleAnalysis(e: React.FormEvent) {
    e.preventDefault()
    if (!rainfall || !water) return
    setLoading(true)
    setResult(null)

    let parsedRainfall = 0
    if (rainfall.includes("-")) {
      const parts = rainfall.split("-").map(p => parseFloat(p.trim()))
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        parsedRainfall = (parts[0] + parts[1]) / 2
      } else {
        parsedRainfall = parseFloat(rainfall) || 0
      }
    } else {
      parsedRainfall = parseFloat(rainfall) || 0
    }

    setTimeout(() => {
      const res = getRecommendation(parsedRainfall, water)
      setResult(res)
      setLoading(false)
      setTimeout(() => {
        document.getElementById("result-card")?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 100)
    }, 1600)
  }

  const navLinks = [
    { label: "Beranda", href: "#beranda" },
    { label: "Dashboard", href: "#dashboard" },
    { label: "Analisis", href: "#analisis" },
    { label: "Edukasi", href: "#edukasi" },
    { label: "Profil", href: "#profil" },
  ]

  // Dashboard data
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const { data: climateData, loading: climateLoading } = useClimateData(selectedYear)
  const { data: currentClimate } = useCurrentMonthClimate()
  const availableYears = useAvailableYears()

  const statusColors = {
    safe: {
      bg: "bg-agri-green-light",
      border: "border-agri-green",
      text: "text-agri-green-dark",
      badge: "bg-agri-green text-white",
      bar: "bg-agri-green",
    },
    warning: {
      bg: "bg-agri-yellow/20",
      border: "border-agri-yellow",
      text: "text-amber-800",
      badge: "bg-agri-yellow text-amber-900",
      bar: "bg-agri-yellow",
    },
    danger: {
      bg: "bg-red-50",
      border: "border-red-400",
      text: "text-red-800",
      badge: "bg-red-500 text-white",
      bar: "bg-red-500",
    },
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Navbar */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur-md shadow-md" : "bg-transparent"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <a href="#beranda" className="flex items-center gap-4 group">
              <div className="flex items-center gap-3 pr-4 border-r border-white/20">
                <img
                  src="https://www.bmkg.go.id/asset/img/logo/logo-bmkg.png"
                  alt="BMKG Logo"
                  className="h-10 w-auto object-contain"
                />
                <img
                  src="/logo-stmkg.png"
                  alt="STMKG Logo"
                  className="h-10 w-auto object-contain"
                />
              </div>
              <div className="leading-tight">
                <h1 className={`text-base font-bold tracking-tight transition-colors ${scrolled ? "text-agri-green-dark" : "text-white"}`}>
                  Agro<span className="text-agri-yellow">Demak</span>
                </h1>
                <p className={`text-[10px] font-medium uppercase tracking-widest ${scrolled ? "text-muted-foreground" : "text-white/70"}`}>
                  Sistem Pakar Pertanian
                </p>
              </div>
            </a>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    scrolled
                      ? "text-foreground hover:bg-agri-green-light hover:text-agri-green-dark"
                      : "text-white/90 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {link.label}
                </a>
              ))}
              <Button
                size="sm"
                className="ml-2 bg-agri-green hover:bg-agri-green-dark text-white shadow-sm"
                onClick={() => document.getElementById("analisis")?.scrollIntoView({ behavior: "smooth" })}
              >
                Mulai Analisis
              </Button>
            </nav>

            <button
              className={`md:hidden p-2 rounded-md ${scrolled ? "text-foreground" : "text-white"}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white border-b border-border shadow-lg px-4 pb-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block py-2.5 text-sm font-medium text-foreground hover:text-agri-green border-b border-border/50 last:border-0"
              >
                {link.label}
              </a>
            ))}
            <Button
              className="mt-3 w-full bg-agri-green hover:bg-agri-green-dark text-white"
              onClick={() => {
                setMenuOpen(false)
                document.getElementById("analisis")?.scrollIntoView({ behavior: "smooth" })
              }}
            >
              Mulai Analisis
            </Button>
          </div>
        )}
      </header>

      {/* Hero */}
      <section
        id="beranda"
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: "url(/hero-rice-field.webp)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-agri-green-dark/85 via-agri-green/70 to-black/60" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 text-center pt-20">
          <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-black/30 px-5 py-2 backdrop-blur-md">
            <div className="relative flex size-2 items-center justify-center">
              <span className="absolute size-full rounded-full bg-agri-yellow animate-ping opacity-75" />
              <span className="relative size-1.5 rounded-full bg-agri-yellow" />
            </div>
            <span className="text-[10px] font-bold text-white/90 uppercase tracking-[0.2em] leading-none">
              Monitoring Iklim Wilayah Demak
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight text-balance mb-6">
            Optimalkan Hasil Tanam <br />
            <span className="text-agri-yellow">Berdasarkan Iklim</span>{" "}
            Demak.
          </h1>

          <p className="mx-auto max-w-2xl text-lg sm:text-xl text-white/80 leading-relaxed mb-10 text-balance">
            Sistem cerdas penentu komoditas unggulan Demak:{" "}
            <span className="font-semibold text-white">Padi, Bawang Merah, Jambu Air, hingga Tembakau</span>{" "}
            berdasarkan analisis klimatologi dan prediksi iklim terkini.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="bg-agri-yellow hover:bg-amber-400 text-amber-900 font-bold px-8 py-6 text-base shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5"
              onClick={() => document.getElementById("analisis")?.scrollIntoView({ behavior: "smooth" })}
            >
              Mulai Analisis
              <ChevronDown className="size-4 ml-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/50 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm px-8 py-6 text-base"
              onClick={() => document.getElementById("edukasi")?.scrollIntoView({ behavior: "smooth" })}
            >
              Pelajari Cara Kerja
            </Button>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-4 max-w-xl mx-auto">
            {[
              { value: "15+", label: "Komoditas Daerah" },
              { value: "BETA", label: "Tahap Uji Coba" },
              { value: "SISTEM", label: "Analisis Cerdas" },
            ].map((stat) => (
              <div key={stat.label} className="group relative rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-4 transition-all hover:bg-white/15 hover:border-white/30">
                <p className="text-3xl font-extrabold text-white group-hover:scale-110 transition-transform">{stat.value}</p>
                <p className="text-[10px] text-white/60 uppercase tracking-widest mt-1 font-bold">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="size-6 text-white/60" />
        </div>
      </section>

      {/* ─── Dashboard Section ─── */}
      <section id="dashboard" className="py-16 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center mb-10">
            <Badge className="mb-3 bg-agri-green/10 text-agri-green-dark border-agri-green/20">
              Data Real-time
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
              Dashboard Iklim Demak
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Data iklim bulanan Kabupaten Demak berdasarkan pencatatan historis BMKG.
            </p>
          </div>

          {/* Season indicator + year selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            {currentClimate ? (
              <SeasonIndicator
                ch_mm={currentClimate.ch_mm}
                bulan={currentClimate.bulan}
                tahun={currentClimate.tahun}
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
          {currentClimate && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {[
                { label: 'Curah Hujan', value: `${currentClimate.ch_mm}`, unit: 'mm', icon: CloudRain, color: 'text-agri-blue', bg: 'bg-agri-blue/10' },
                { label: 'Suhu', value: `${currentClimate.suhu}`, unit: '°C', icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                { label: 'Kelembaban', value: `${currentClimate.kelembaban}`, unit: '%', icon: Droplets, color: 'text-agri-green', bg: 'bg-agri-green/10' },
                { label: 'Air Tanah', value: `${currentClimate.air_tanah}`, unit: 'mm/hr', icon: BarChart2, color: 'text-purple-500', bg: 'bg-purple-500/10' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-border bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className={`size-8 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                    <stat.icon className={`size-4 ${stat.color}`} />
                  </div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold text-foreground mt-0.5">
                    {stat.value} <span className="text-xs font-normal text-muted-foreground">{stat.unit}</span>
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Climate Charts */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="size-4 text-agri-green" />
              <h3 className="text-base font-semibold text-foreground">Grafik Iklim Bulanan</h3>
              {climateLoading && <span className="text-xs text-muted-foreground animate-pulse">Memuat data...</span>}
            </div>
            <ClimateCharts data={climateData} />
          </div>

          {/* Rekomendasi Sistem Pakar */}
          {currentClimate && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <Sprout className="size-4 text-agri-green" />
                <h3 className="text-base font-semibold text-foreground">Rekomendasi Komoditas Bulan Ini</h3>
                <Badge className="text-xs bg-agri-green/10 text-agri-green-dark border-agri-green/20">
                  Top 3
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Dihitung otomatis menggunakan sistem pakar rule-based berbasis data iklim terkini.
                Metode: Forward Chaining + Weighted Certainty Factor.
              </p>
              <RecommendationCard climate={currentClimate} topN={3} />
            </div>
          )}

          {/* Planting Calendar */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays className="size-4 text-agri-green" />
              <h3 className="text-base font-semibold text-foreground">Kalender Tanam Komoditas</h3>
            </div>
            <PlantingCalendar
              currentClimate={currentClimate ? {
                ch_mm: currentClimate.ch_mm,
                suhu: currentClimate.suhu,
                kelembaban: currentClimate.kelembaban,
                air_tanah: currentClimate.air_tanah,
                bulan: currentClimate.bulan,
              } : null}
            />
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section id="analisis" className="py-20 bg-gradient-to-b from-agri-green-light/30 to-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-agri-green/10 text-agri-green-dark border-agri-green/20 hover:bg-agri-green/10">
              Sistem Pakar
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
              Analisis Komoditas
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Masukkan data prediksi iklim wilayah Anda untuk mendapatkan rekomendasi komoditas terbaik.
            </p>
          </div>

          <div className="mx-auto max-w-2xl">
            <Card className="shadow-2xl border-agri-green/20 rounded-2xl overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-agri-green via-agri-blue to-agri-yellow" />
              <CardHeader className="pb-4 pt-6 sm:pt-8 px-5 sm:px-8">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-agri-green/10">
                    <CloudRain className="size-5 text-agri-green" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Data Parameter Iklim</CardTitle>
                    <CardDescription>Isi data prediksi untuk analisis akurat</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-5 sm:px-8 pb-6 sm:pb-8">
                <form onSubmit={handleAnalysis} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="rainfall" className="block text-sm font-semibold text-foreground">
                      Prediksi Curah Hujan Bulan Depan (mm)
                    </label>
                    <div className="relative">
                      <CloudRain className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <input
                        id="rainfall"
                        type="text"
                        inputMode="text"
                        placeholder="Contoh: 150 atau 50-150"
                        value={rainfall}
                        onChange={(e) => setRainfall(e.target.value)}
                        required
                        className="w-full h-11 rounded-lg border border-input bg-transparent pl-10 pr-14 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-agri-green focus-visible:ring-2 focus-visible:ring-agri-green/20 placeholder:text-muted-foreground dark:bg-input/30"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">mm</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Berdasarkan klasifikasi BMKG: Rendah (0-100), Menengah (101-300), Tinggi (&gt;300)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="water" className="block text-sm font-semibold text-foreground">
                      Ketersediaan Air Tanah / ATKABT
                    </label>
                    <div className="relative">
                      <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none z-10" />
                      <select
                        id="water"
                        value={water}
                        onChange={(e) => setWater(e.target.value as WaterAvailability)}
                        required
                        className="w-full h-11 rounded-lg border border-input bg-white text-slate-900 pl-10 pr-9 text-sm shadow-xs appearance-none transition-all outline-none focus-visible:border-agri-green focus-visible:ring-2 focus-visible:ring-agri-green/20"
                      >
                        <option value="" disabled>Pilih kondisi ketersediaan air...</option>
                        <option value="Sangat Cukup">80-100% (Sangat Cukup)</option>
                        <option value="Cukup">60-80% (Cukup)</option>
                        <option value="Sedang">40-60% (Sedang)</option>
                        <option value="Kurang">20-40% (Kurang)</option>
                        <option value="Sangat Kurang">0-20% (Sangat Kurang)</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {water && (
                    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                      water === "Sangat Cukup" ? "bg-blue-500/10 text-blue-700 border border-blue-500/20"
                      : water === "Cukup" ? "bg-agri-green-light text-agri-green-dark border border-agri-green/20"
                      : water === "Sedang" ? "bg-agri-yellow/20 text-amber-800 border border-agri-yellow/30"
                      : water === "Kurang" ? "bg-orange-500/10 text-orange-700 border border-orange-500/20"
                      : "bg-red-500/10 text-red-700 border border-red-500/20"
                    }`}>
                      {(water === "Sangat Cukup" || water === "Cukup") && <Droplets className="size-3.5 shrink-0" />}
                      {water === "Sedang" && <CheckCircle2 className="size-3.5 shrink-0" />}
                      {(water === "Kurang" || water === "Sangat Kurang") && <AlertTriangle className="size-3.5 shrink-0" />}
                      <span>
                        ATKABT <strong>{water}</strong>:{" "}
                        {water === "Sangat Cukup" && "Kandungan air maksimal, waspada genangan."}
                        {water === "Cukup" && "Kondisi basah ideal untuk masa vegetatif."}
                        {water === "Sedang" && "Kondisi seimbang untuk mayoritas komoditas."}
                        {water === "Kurang" && "Kekurangan air, butuh tanaman toleran."}
                        {water === "Sangat Kurang" && "Kering ekstrem, prioritas palawija tangguh."}
                      </span>
                    </div>
                  )}

                  <Separator />

                  <Button
                    type="submit"
                    disabled={loading || !rainfall || !water}
                    className="w-full h-12 bg-agri-green hover:bg-agri-green-dark text-white text-base font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
                  >
                    {loading ? (
                      <><Spinner className="size-4 mr-2" />Menganalisis data iklim...</>
                    ) : (
                      <><BrainCircuit className="size-4 mr-2" />Analisis Komoditas</>
                    )}
                  </Button>
                </form>

                {!result && !loading && (
                  <div className="mt-8 rounded-xl border-2 border-dashed border-muted p-8 text-center bg-muted/20">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted/50 mb-4">
                      <Sprout className="size-6 text-muted-foreground" />
                    </div>
                    <h4 className="text-sm font-semibold text-foreground mb-1">Belum Ada Analisis</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                      Silakan lengkapi form parameter iklim di atas, lalu klik tombol <strong>Analisis Komoditas</strong>.
                    </p>
                  </div>
                )}

                {result && (
                  <div
                    id="result-card"
                    className={`mt-8 rounded-xl border-2 p-5 sm:p-6 transition-all ${statusColors[result.status].bg} ${statusColors[result.status].border}`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-black/50 mb-1">Rekomendasi Sistem Pakar</p>
                        <h3 className={`text-2xl font-extrabold tracking-tight ${statusColors[result.status].text}`}>
                          {result.recommendation}
                        </h3>
                        <p className="text-sm text-black/60 mt-0.5">{result.commodity}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusColors[result.status].badge}`}>
                        {result.status === "safe" ? "Optimal" : result.status === "warning" ? "Alternatif" : "Risiko"}
                      </span>
                    </div>

                    <Separator className="my-4 opacity-50" />

                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="size-4 text-muted-foreground" />
                          <span className="text-sm font-semibold text-foreground">Tingkat Keyakinan Sistem</span>
                        </div>
                        <span className={`text-2xl font-extrabold ${statusColors[result.status].text}`}>{cfAnimated}%</span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-black/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${statusColors[result.status].bar}`}
                          style={{ width: `${cfAnimated}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
                        <span>0%</span><span>50%</span><span>100%</span>
                      </div>
                    </div>

                    <Separator className="my-4 opacity-50" />

                    <div className="flex gap-3">
                      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-agri-yellow/30">
                        <Lightbulb className="size-4 text-amber-700" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-black/50 mb-1">Alasan Sistem</p>
                        <p className="text-sm text-slate-900 leading-relaxed text-justify">{result.reason}</p>
                      </div>
                    </div>

                    {result.alternatives && result.alternatives.length > 0 && (
                      <>
                        <Separator className="my-4 opacity-50" />
                        <div className="space-y-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-black/50">Komoditas Alternatif</p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {result.alternatives.map((alt, idx) => (
                              <div key={idx} className="rounded-xl border border-black/5 bg-white/40 p-3 shadow-sm hover:bg-white/60 transition-all">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-bold text-sm text-foreground">{alt.commodity}</span>
                                  <span className={`text-xs font-extrabold ${statusColors[result.status].text}`}>{alt.certaintyFactor}%</span>
                                </div>
                                <p className="text-[11px] text-black/70 leading-relaxed text-justify">{alt.reason}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
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
                Demak dikenal sebagai lumbung pangan Jawa Tengah dengan komoditas yang sangat beragam, mulai dari tanaman pangan hingga buah-buahan ikonik.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: "Tanaman Pangan", items: "Padi, Jagung, Kacang Hijau, Kedelai" },
                  { title: "Hortikultura Buah", items: "Jambu Air (Merah Delima), Belimbing" },
                  { title: "Sayuran Musiman", items: "Bawang Merah, Cabai, Tomat" },
                  { title: "Tanaman Perkebunan", items: "Tembakau, Kelapa" },
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
                    <img src="/sawah_padi.png" alt="Lahan Pertanian Padi" className="w-full h-full object-cover" />
                  </div>
                  <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl hover:scale-105 transition-transform">
                    <img src="/ladang_jagung.png" alt="Palawija Jagung" className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl hover:scale-105 transition-transform">
                    <img src="/panen_sayuran.png" alt="Panen Sayuran" className="w-full h-full object-cover" />
                  </div>
                  <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl hover:scale-105 transition-transform">
                    <img src="/perkebunan_tembakau.png" alt="Perkebunan Tembakau" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
              <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-64 bg-agri-green rounded-full blur-[100px] opacity-20" />
            </div>
          </div>
        </div>
      </section>

      {/* Educational */}
      <section id="edukasi" className="py-20 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge className="mb-3 bg-agri-blue/10 text-agri-blue border-agri-blue/20 hover:bg-agri-blue/10">Transparansi Sistem</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">Bagaimana Sistem Ini Bekerja?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Metodologi ilmiah berbasis klimatologi dan kecerdasan buatan untuk menghasilkan rekomendasi yang akurat.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { step: "01", icon: CloudRain, title: "Input Data", subtitle: "Data Iklim & ATKABT", description: "Pengguna memasukkan parameter prediksi curah hujan dan indeks ketersediaan air tanah (ATKABT) yang bersumber dari portal iklim resmi wilayah Jawa Tengah.", iconBg: "bg-agri-green/10", iconColor: "text-agri-green", borderColor: "border-agri-green/30", stepBg: "bg-agri-green text-white", subtitleColor: "text-agri-green" },
              { step: "02", icon: BrainCircuit, title: "Forward Chaining", subtitle: "Pencocokan Aturan Klimatologi", description: "Mesin inferensi mencocokkan data input dengan basis aturan standar klimatologi menggunakan metode Forward Chaining.", iconBg: "bg-agri-blue/10", iconColor: "text-agri-blue", borderColor: "border-agri-blue/30", stepBg: "bg-agri-blue text-white", subtitleColor: "text-agri-blue" },
              { step: "03", icon: CheckCircle2, title: "Certainty Factor", subtitle: "Penghitungan Tingkat Keyakinan AI", description: "Sistem menghitung nilai Certainty Factor (CF) berdasarkan kombinasi kepercayaan pakar dan kekuatan bukti dari data iklim.", iconBg: "bg-agri-yellow/20", iconColor: "text-amber-700", borderColor: "border-agri-yellow/40", stepBg: "bg-agri-yellow text-amber-900", subtitleColor: "text-amber-700" },
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
              <p className="font-semibold text-foreground">Berbasis Data Klimatologi Resmi</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Sistem ini mengintegrasikan luaran data teknis dari Stasiun Klimatologi Jawa Tengah serta parameter analisis Deputi Bidang Klimatologi sebagai basis aturan mesin inferensi.
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
                <li className="flex items-center gap-2"><span className="text-agri-yellow">&#9657;</span> Komoditas: Padi, Jagung, Bawang, Tembakau</li>
                <li className="flex items-center gap-2"><span className="text-agri-yellow">&#9657;</span> Wilayah: Kabupaten Demak</li>
              </ul>
            </div>
          </div>
          <Separator className="bg-white/10 mb-6" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-white/60 text-center sm:text-left">
              &copy; 2026 Dikembangkan oleh <span className="font-semibold text-agri-yellow">Galih Oktaviano</span> | AgroDemak
            </p>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-agri-yellow animate-pulse" />
              <span className="text-xs text-white/50">Sistem Aktif</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
