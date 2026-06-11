import { Routes, Route } from "react-router-dom"
import { lazy, Suspense } from "react"
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

export default function App() {
  return (
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
  )
}
