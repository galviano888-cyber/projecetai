import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  Sprout, LayoutDashboard, CloudRain, Leaf, BookOpen,
  LogOut, Menu, X, ChevronRight
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/iklim', label: 'Data Iklim', icon: CloudRain, end: false },
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
    <aside className={`flex flex-col h-full bg-agri-green-dark text-white ${
      mobile ? 'w-64' : 'w-64 hidden lg:flex'
    }`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="flex size-9 items-center justify-center rounded-xl bg-white/10">
          <Sprout className="size-5 text-agri-yellow" />
        </div>
        <div>
          <p className="font-bold text-white text-sm">Agro<span className="text-agri-yellow">Demak</span></p>
          <p className="text-[10px] text-white/60 uppercase tracking-widest">Admin Panel</p>
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
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => mobile && setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`size-4 shrink-0 ${
                  isActive ? 'text-agri-yellow' : 'text-white/60 group-hover:text-white/80'
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
        <div className="mb-3 px-2">
          <p className="text-xs text-white/40 uppercase tracking-wide">Masuk sebagai</p>
          <p className="text-sm font-medium text-white truncate mt-0.5">{user?.email}</p>
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
        <header className="flex items-center gap-3 px-4 sm:px-6 h-14 border-b border-border bg-white shrink-0">
          <button
            className="lg:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            onClick={() => setSidebarOpen(true)}
            aria-label="Buka menu"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-agri-green animate-pulse" />
            <span className="text-xs text-muted-foreground hidden sm:inline">Sistem Aktif</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
