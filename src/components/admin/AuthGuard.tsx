import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth()

  // PENTING: tunggu auth state selesai dimuat sebelum memutuskan redirect.
  // Tanpa ini, user yang sudah login akan di-redirect ke login page
  // karena `user` masih null saat auth state belum selesai di-resolve.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 rounded-full border-4 border-agri-green border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Memeriksa sesi...</p>
        </div>
      </div>
    )
  }

  // Hanya redirect ke login setelah loading selesai dan user benar-benar null
  if (!user) {
    return <Navigate to="/admin/login" replace />
  }

  return <>{children}</>
}
