import { Link } from 'react-router-dom'
import { Sprout, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="inline-flex items-center justify-center size-20 rounded-3xl bg-agri-green/10 mb-6">
          <Sprout className="size-10 text-agri-green" />
        </div>

        {/* 404 */}
        <h1 className="text-7xl font-extrabold text-agri-green mb-2">404</h1>
        <h2 className="text-xl font-bold text-foreground mb-3">Halaman Tidak Ditemukan</h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
          Halaman yang kamu cari tidak ada atau sudah dipindahkan.
          Kembali ke beranda untuk melanjutkan.
        </p>

        <div className="flex gap-3 justify-center">
          <Button asChild className="bg-agri-green hover:bg-agri-green-dark text-white font-semibold">
            <Link to="/">
              <Home className="size-4 mr-2" />
              Ke Beranda
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/library">
              <ArrowLeft className="size-4 mr-2" />
              Library Tanaman
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
