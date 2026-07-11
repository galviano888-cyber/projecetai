import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard, CloudRain, Leaf, BookOpen,
  LogOut, Menu, X, ChevronRight, CalendarDays, FlaskConical, Gauge
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/iklim', label: 'Data Iklim', icon: CloudRain, end: false },
  { to: '/admin/kalender-tanam', label: 'Prediksi BMKG', icon: CalendarDays, end: false },
  { to: '/admin/threshold', label: 'Threshold', icon: FlaskConical, end: false },
  { to: '/admin/certainty-factor', label: 'Certainty Factor', icon: Gauge, end: false },
  { to: '/admin/komoditas', label: 'Komoditas', icon: Leaf, end: false },
  { to: '/admin/library', label: 'Library', icon: BookOpen, end: false },
]

export default function AdminLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/admin/login')
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside className={`flex flex-col h-full bg-gradient-to-b from-agri-green-dark to-[oklch(0.34_0.10_152)] text-white ${
      mobile ? 'w-64' : 'w-64 hidden lg:flex'
    }`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="flex size-10 items-center justify-center rounded-xl bg-white shadow-soft overflow-hidden shrink-0">
          <img src="/logo-stmkg.png" alt="STMKG" className="h-7 w-auto object-contain" />
        </div>
        <div>
          <p className="font-extrabold text-white text-sm tracking-tight">Agro<span className="text-agri-yellow">Demak</span></p>
          <p className="text-[10px] text-white/50 uppercase tracking-[0.18em]">Admin Panel</p>
        </div>
        {mobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto text-white/60 hover:text-white"
            aria-label="Tutup menu"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <p className="px-3 pt-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Menu Utama</p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => mobile && setSidebarOpen(false)}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-white/15 text-white shadow-soft'
                  : 'text-white/65 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-agri-yellow" />}
                <item.icon className={`size-4 shrink-0 ${
                  isActive ? 'text-agri-yellow' : 'text-white/55 group-hover:text-white/80'
                }`} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="size-3 text-agri-yellow" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-white/10">
        <div className="mb-3 flex items-center gap-3 px-2">
          <div className="flex size-9 items-center justify-center rounded-full bg-white/10 text-agri-yellow font-bold text-sm shrink-0">
            {(user?.email?.[0] ?? 'A').toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-white/40 uppercase tracking-wide">Masuk sebagai</p>
            <p className="text-sm font-medium text-white truncate">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="w-full justify-start gap-2 text-white/70 hover:text-white hover:bg-white/10 h-9 px-3"
        >
          <LogOut className="size-4" />
          Keluar
        </Button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <Sidebar mobile />
          </div>
        </>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 sm:px-6 h-14 border-b border-border glass shrink-0 z-10">
          <button
            className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            onClick={() => setSidebarOpen(true)}
            aria-label="Buka menu"
          >
            <Menu className="size-5" />
          </button>
          <div className="hidden lg:block">
            <p className="text-sm font-semibold text-foreground">Panel Administrasi</p>
            <p className="text-[11px] text-muted-foreground">Kelola data iklim, threshold &amp; kalender tanam</p>
          </div>
          <div className="flex-1" />

        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-secondary/30">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
