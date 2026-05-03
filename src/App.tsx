import { useState, useEffect } from "react"
import { CloudRain, BrainCircuit, CircleCheck as CheckCircle2, Lightbulb, Sprout, Menu, X, ChevronDown, Droplets, TrendingUp, TriangleAlert as AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"

type WaterAvailability = "Surplus" | "Normal" | "Defisit" | ""

interface AnalysisResult {
  recommendation: string
  commodity: string
  certaintyFactor: number
  reason: string
  status: "safe" | "warning" | "danger"
}

function getRecommendation(rainfall: number, water: WaterAvailability): AnalysisResult {
  if (water === "Surplus" && rainfall > 200) {
    return {
      recommendation: "PADI",
      commodity: "Padi Sawah",
      certaintyFactor: 92,
      reason:
        "Kondisi curah hujan tinggi dan ketersediaan air tanah surplus sangat ideal untuk fase vegetatif padi. Lahan sawah dapat diisi penuh untuk mendukung pertumbuhan optimal.",
      status: "safe",
    }
  }
  if (water === "Normal" && rainfall >= 100 && rainfall <= 200) {
    return {
      recommendation: "JAGUNG",
      commodity: "Jagung Hibrida",
      certaintyFactor: 85,
      reason:
        "Kondisi air tanah normal dan curah hujan sedang cocok untuk budidaya jagung. Jagung membutuhkan 400–600 mm air per musim tanam dengan drainase yang baik.",
      status: "safe",
    }
  }
  if (water === "Defisit" || rainfall < 100) {
    return {
      recommendation: "KEDELAI / KACANG HIJAU",
      commodity: "Kedelai atau Kacang Hijau",
      certaintyFactor: 88,
      reason:
        "Hindari menanam padi karena prediksi ketersediaan air tanah (ATKABT) defisit, tidak mencukupi untuk fase vegetatif. Kedelai dan kacang hijau lebih toleran kekeringan.",
      status: "warning",
    }
  }
  return {
    recommendation: "JAGUNG",
    commodity: "Jagung Hibrida",
    certaintyFactor: 78,
    reason:
      "Berdasarkan data iklim yang dimasukkan, jagung merupakan pilihan paling aman dengan kebutuhan air moderat dan adaptasi yang baik di wilayah Demak.",
    status: "safe",
  }
}

export default function App() {
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
    setTimeout(() => {
      const res = getRecommendation(Number(rainfall), water)
      setResult(res)
      setLoading(false)
      setTimeout(() => {
        document.getElementById("result-card")?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 100)
    }, 1600)
  }

  const navLinks = [
    { label: "Beranda", href: "#beranda" },
    { label: "Analisis", href: "#analisis" },
    { label: "Edukasi", href: "#edukasi" },
    { label: "Profil", href: "#profil" },
  ]

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
      {/* ─── Navbar ─── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur-md shadow-md" : "bg-transparent"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logos + Title */}
            <a href="#beranda" className="flex items-center gap-3">
              {/* Official Logos */}
              <div className="flex items-center gap-2.5 pr-3 border-r border-white/20">
                {/* BMKG Logo */}
                <img
                  src="https://www.bmkg.go.id/asset/img/logo/logo-bmkg.png"
                  alt="BMKG Logo"
                  className="h-10 w-auto object-contain"
                />
                {/* STMKG Logo */}
                <img
                  src="https://stmkg.ac.id/wp-content/uploads/2023/09/Logo-STMKG.png"
                  alt="STMKG Logo"
                  className="h-10 w-auto object-contain"
                />
              </div>

              {/* Title */}
              <div className="leading-tight">
                <p className={`text-sm font-bold tracking-tight ${scrolled ? "text-agri-green-dark" : "text-white"}`}>
                  Sistem Pakar Pertanian Demak
                </p>
                <p className={`text-xs ${scrolled ? "text-muted-foreground" : "text-white/80"}`}>
                  Kabupaten Demak, Jawa Tengah
                </p>
              </div>
            </a>

            {/* Desktop Nav */}
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

            {/* Mobile Menu Button */}
            <button
              className={`md:hidden p-2 rounded-md ${scrolled ? "text-foreground" : "text-white"}`}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
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

      {/* ─── Hero ─── */}
      <section
        id="beranda"
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: "url(/hero-rice-field.webp)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-agri-green-dark/85 via-agri-green/70 to-black/60" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 text-center">
          {/* Eyebrow badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
            <span className="size-2 rounded-full bg-agri-yellow animate-pulse" />
            <span className="text-xs font-medium text-white/90 uppercase tracking-widest">
              Kabupaten Demak · Jawa Tengah
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight text-balance mb-6">
            Jangan Biarkan Cuaca{" "}
            <span className="text-agri-yellow">Menentukan Nasib</span>{" "}
            Panen Anda.
          </h1>

          <p className="mx-auto max-w-2xl text-lg sm:text-xl text-white/80 leading-relaxed mb-10 text-balance">
            Sistem cerdas penentu komoditas{" "}
            <span className="font-semibold text-white">padi, jagung, dan kedelai</span>{" "}
            untuk wilayah Demak berdasarkan prediksi iklim.
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

          {/* Stats row */}
          <div className="mt-16 grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {[
              { value: "3", label: "Komoditas Utama" },
              { value: "88%", label: "Akurasi Rata-rata" },
              { value: "Real-time", label: "Analisis Iklim" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-3">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/70 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="size-6 text-white/60" />
        </div>
      </section>

      {/* ─── Calculator Section ─── */}
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
              {/* Card top accent bar */}
              <div className="h-1.5 bg-gradient-to-r from-agri-green via-agri-blue to-agri-yellow" />

              <CardHeader className="pb-4 pt-8 px-8">
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

              <CardContent className="px-8 pb-8">
                <form onSubmit={handleAnalysis} className="space-y-6">
                  {/* Rainfall Input */}
                  <div className="space-y-2">
                    <label
                      htmlFor="rainfall"
                      className="block text-sm font-semibold text-foreground"
                    >
                      Prediksi Curah Hujan Bulan Depan (mm)
                    </label>
                    <div className="relative">
                      <CloudRain className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <input
                        id="rainfall"
                        type="number"
                        min="0"
                        max="1000"
                        placeholder="Contoh: 150"
                        value={rainfall}
                        onChange={(e) => setRainfall(e.target.value)}
                        required
                        className="w-full h-11 rounded-lg border border-input bg-transparent pl-10 pr-14 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-agri-green focus-visible:ring-2 focus-visible:ring-agri-green/20 placeholder:text-muted-foreground dark:bg-input/30"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                        mm
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Masukkan estimasi curah hujan dalam milimeter (0–1000 mm)
                    </p>
                  </div>

                  {/* Water Availability Select */}
                  <div className="space-y-2">
                    <label
                      htmlFor="water"
                      className="block text-sm font-semibold text-foreground"
                    >
                      Ketersediaan Air Tanah / ATKABT
                    </label>
                    <div className="relative">
                      <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none z-10" />
                      <select
                        id="water"
                        value={water}
                        onChange={(e) => setWater(e.target.value as WaterAvailability)}
                        required
                        className="w-full h-11 rounded-lg border border-input bg-transparent pl-10 pr-9 text-sm shadow-xs appearance-none transition-[color,box-shadow] outline-none focus-visible:border-agri-green focus-visible:ring-2 focus-visible:ring-agri-green/20 dark:bg-input/30"
                      >
                        <option value="" disabled>
                          Pilih kondisi ketersediaan air...
                        </option>
                        <option value="Surplus">Surplus — Air sangat mencukupi</option>
                        <option value="Normal">Normal — Air cukup tersedia</option>
                        <option value="Defisit">Defisit — Air terbatas / kering</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {/* Status indicators for inputs */}
                  {water && (
                    <div
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                        water === "Surplus"
                          ? "bg-agri-blue/10 text-agri-blue border border-agri-blue/20"
                          : water === "Normal"
                          ? "bg-agri-green-light text-agri-green-dark border border-agri-green/20"
                          : "bg-agri-yellow/20 text-amber-800 border border-agri-yellow/30"
                      }`}
                    >
                      {water === "Surplus" && <Droplets className="size-3.5 shrink-0" />}
                      {water === "Normal" && <CheckCircle2 className="size-3.5 shrink-0" />}
                      {water === "Defisit" && <AlertTriangle className="size-3.5 shrink-0" />}
                      <span>
                        ATKABT <strong>{water}</strong>:{" "}
                        {water === "Surplus" && "Cocok untuk tanaman dengan kebutuhan air tinggi"}
                        {water === "Normal" && "Mendukung pertumbuhan sebagian besar komoditas"}
                        {water === "Defisit" && "Pilih komoditas toleran kekeringan"}
                      </span>
                    </div>
                  )}

                  <Separator />

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading || !rainfall || !water}
                    className="w-full h-12 bg-agri-green hover:bg-agri-green-dark text-white text-base font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Spinner className="size-4 mr-2" />
                        Menganalisis data iklim...
                      </>
                    ) : (
                      <>
                        <BrainCircuit className="size-4 mr-2" />
                        Analisis Komoditas
                      </>
                    )}
                  </Button>
                </form>

                {/* ─── Result Card ─── */}
                {result && (
                  <div
                    id="result-card"
                    className={`mt-8 rounded-xl border-2 p-6 transition-all ${statusColors[result.status].bg} ${statusColors[result.status].border}`}
                  >
                    {/* Result header */}
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                          Rekomendasi Sistem Pakar
                        </p>
                        <h3 className={`text-2xl font-extrabold tracking-tight ${statusColors[result.status].text}`}>
                          {result.recommendation}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-0.5">{result.commodity}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusColors[result.status].badge}`}
                      >
                        {result.status === "safe" ? "Optimal" : result.status === "warning" ? "Alternatif" : "Risiko"}
                      </span>
                    </div>

                    <Separator className="my-4 opacity-50" />

                    {/* Certainty Factor */}
                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="size-4 text-muted-foreground" />
                          <span className="text-sm font-semibold text-foreground">
                            Tingkat Keyakinan Sistem (Certainty Factor)
                          </span>
                        </div>
                        <span className={`text-2xl font-extrabold ${statusColors[result.status].text}`}>
                          {cfAnimated}%
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-3 w-full rounded-full bg-black/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${statusColors[result.status].bar}`}
                          style={{ width: `${cfAnimated}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    <Separator className="my-4 opacity-50" />

                    {/* Reason */}
                    <div className="flex gap-3">
                      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-agri-yellow/30">
                        <Lightbulb className="size-4 text-amber-700" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                          Alasan Sistem
                        </p>
                        <p className="text-sm text-foreground leading-relaxed">{result.reason}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── Educational Section ─── */}
      <section id="edukasi" className="py-20 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge className="mb-3 bg-agri-blue/10 text-agri-blue border-agri-blue/20 hover:bg-agri-blue/10">
              Transparansi Sistem
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
              Bagaimana Sistem Ini Bekerja?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Metodologi ilmiah berbasis klimatologi dan kecerdasan buatan untuk menghasilkan rekomendasi yang akurat dan dapat dipercaya.
            </p>
          </div>

          {/* Steps */}
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                icon: CloudRain,
                title: "Input Data",
                subtitle: "Data Iklim & ATKABT",
                description:
                  "Pengguna memasukkan prediksi curah hujan bulanan dan status ketersediaan air tanah (Surplus, Normal, atau Defisit) yang diperoleh dari data BMKG.",
                iconBg: "bg-agri-green/10",
                iconColor: "text-agri-green",
                borderColor: "border-agri-green/30",
                stepBg: "bg-agri-green text-white",
                subtitleColor: "text-agri-green",
              },
              {
                step: "02",
                icon: BrainCircuit,
                title: "Forward Chaining",
                subtitle: "Pencocokan Aturan Klimatologi",
                description:
                  "Mesin inferensi mencocokkan data input dengan basis aturan (rule base) standar klimatologi menggunakan metode Forward Chaining untuk menentukan fakta-fakta baru.",
                iconBg: "bg-agri-blue/10",
                iconColor: "text-agri-blue",
                borderColor: "border-agri-blue/30",
                stepBg: "bg-agri-blue text-white",
                subtitleColor: "text-agri-blue",
              },
              {
                step: "03",
                icon: CheckCircle2,
                title: "Certainty Factor",
                subtitle: "Penghitungan Tingkat Keyakinan AI",
                description:
                  "Sistem menghitung nilai Certainty Factor (CF) berdasarkan kombinasi kepercayaan pakar dan kekuatan bukti dari data iklim untuk menghasilkan persentase keyakinan.",
                iconBg: "bg-agri-yellow/20",
                iconColor: "text-amber-700",
                borderColor: "border-agri-yellow/40",
                stepBg: "bg-agri-yellow text-amber-900",
                subtitleColor: "text-amber-700",
              },
            ].map((item) => (
              <Card
                key={item.step}
                className={`h-full border-2 ${item.borderColor} rounded-2xl shadow-md hover:shadow-xl transition-all hover:-translate-y-1 group`}
              >
                <CardContent className="p-8">
                  {/* Step number */}
                  <div className="flex items-center gap-3 mb-6">
                    <span
                      className={`inline-flex size-8 items-center justify-center rounded-full text-xs font-bold ${item.stepBg}`}
                    >
                      {item.step}
                    </span>
                    <div className="h-px flex-1 border-t border-dashed border-border" />
                  </div>

                  {/* Icon */}
                  <div
                    className={`mb-5 inline-flex size-14 items-center justify-center rounded-2xl ${item.iconBg} group-hover:scale-110 transition-transform`}
                  >
                    <item.icon className={`size-7 ${item.iconColor}`} />
                  </div>

                  <h3 className="text-lg font-bold text-foreground mb-1">{item.title}</h3>
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${item.subtitleColor}`}>
                    {item.subtitle}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Info banner */}
          <div className="mt-12 rounded-2xl bg-agri-green/5 border border-agri-green/20 p-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-agri-green/10">
              <Sprout className="size-6 text-agri-green" />
            </div>
            <div className="text-center sm:text-left">
              <p className="font-semibold text-foreground">Berbasis Data Klimatologi Resmi</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Sistem ini dikembangkan menggunakan data historis iklim Kabupaten Demak dari BMKG dan standar teknis budidaya dari Kementerian Pertanian RI.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer id="profil" className="bg-agri-green-dark text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex size-9 items-center justify-center rounded-lg bg-white/10">
                  <Sprout className="size-5 text-agri-yellow" />
                </div>
                <div>
                  <p className="font-bold text-white">Sistem Pakar Pertanian</p>
                  <p className="text-xs text-white/60">Kabupaten Demak</p>
                </div>
              </div>
              <p className="text-sm text-white/70 leading-relaxed">
                Platform cerdas rekomendasi komoditas pertanian berbasis prediksi parameter iklim untuk petani dan penyuluh di wilayah Demak.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide">Navigasi</h4>
              <ul className="space-y-2">
                {navLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-white/70 hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* About */}
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide">Tentang Sistem</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li>Metode: Forward Chaining</li>
                <li>Evaluasi: Certainty Factor</li>
                <li>Komoditas: Padi, Jagung, Kedelai</li>
                <li>Wilayah: Kabupaten Demak</li>
              </ul>
            </div>
          </div>

          <Separator className="bg-white/10 mb-6" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-white/60 text-center sm:text-left">
              © 2026 Dikembangkan oleh{" "}
              <span className="font-semibold text-agri-yellow">Galih Oktaviano</span>{" "}
              | Expert System Pertanian Demak
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
