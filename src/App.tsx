import { Routes, Route } from "react-router-dom"
import LandingPage from "./pages/LandingPage"
import LibraryPage from "./pages/LibraryPage"
import LibraryDetailPage from "./pages/LibraryDetailPage"
import AdminLogin from "./pages/admin/AdminLogin"
import AdminLayout from "./pages/admin/AdminLayout"
import AdminDashboard from "./pages/admin/AdminDashboard"
import AdminIklim from "./pages/admin/AdminIklim"
import AdminKomoditas from "./pages/admin/AdminKomoditas"
import AdminLibrary from "./pages/admin/AdminLibrary"
import { AuthGuard } from "./components/admin/AuthGuard"

export default function App() {
  return (
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
      </Route>
    </Routes>
  )
}
