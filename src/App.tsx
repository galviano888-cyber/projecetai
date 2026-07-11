import { Routes, Route } from "react-router-dom"
import { lazy, Suspense, Component, type ReactNode, type ErrorInfo } from "react"
import LandingPage from "./pages/LandingPage"
import LibraryPage from "./pages/LibraryPage"
import LibraryDetailPage from "./pages/LibraryDetailPage"
import NotFoundPage from "./pages/NotFoundPage"
import { AuthGuard } from "./components/admin/AuthGuard"

// Admin panel di-lazy-load (tidak dimuat untuk user biasa) → bundle awal lebih kecil
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"))
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"))
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"))
const AdminIklim = lazy(() => import("./pages/admin/AdminIklim"))
const AdminKomoditas = lazy(() => import("./pages/admin/AdminKomoditas"))
const AdminLibrary = lazy(() => import("./pages/admin/AdminLibrary"))
const AdminKalenderTanam = lazy(() => import("./pages/admin/AdminKalenderTanam"))
const AdminThreshold = lazy(() => import("./pages/admin/AdminThreshold"))
const AdminCertaintyFactor = lazy(() => import("./pages/admin/AdminCertaintyFactor"))

function PageFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="size-8 rounded-full border-2 border-agri-green border-t-transparent animate-spin" />
    </div>
  )
}

// ─── Error Boundary ──────────────────────────────────────────────────────────
// Menangkap runtime error dari komponen manapun (termasuk lazy-loaded admin pages)
// sehingga satu halaman yang crash tidak membuat seluruh app blank.

interface ErrorBoundaryState {
  hasError: boolean
  message: string
}

class AppErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AgroDemak] Uncaught error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="size-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
              <span className="text-3xl">⚠</span>
            </div>
            <h1 className="text-xl font-bold text-foreground">Terjadi Kesalahan</h1>
            <p className="text-sm text-muted-foreground">
              Halaman ini mengalami error dan tidak bisa ditampilkan.
            </p>
            {this.state.message && (
              <pre className="text-xs bg-muted rounded-lg px-4 py-3 text-left overflow-auto text-destructive">
                {this.state.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-agri-green text-white text-sm font-semibold hover:bg-agri-green-dark transition-colors"
            >
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* User-facing */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/library/:id" element={<LibraryDetailPage />} />

          {/* Admin auth */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Admin panel - dilindungi AuthGuard */}
          <Route
            path="/admin"
            element={
              <AuthGuard>
                <AdminLayout />
              </AuthGuard>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="iklim" element={<AdminIklim />} />
            <Route path="komoditas" element={<AdminKomoditas />} />
            <Route path="library" element={<AdminLibrary />} />
            <Route path="kalender-tanam" element={<AdminKalenderTanam />} />
            <Route path="threshold" element={<AdminThreshold />} />
            <Route path="certainty-factor" element={<AdminCertaintyFactor />} />
          </Route>

          {/* 404 - fallback untuk semua route yang tidak cocok */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AppErrorBoundary>
  )
}
