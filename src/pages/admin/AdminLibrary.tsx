import { BookOpen } from 'lucide-react'

export default function AdminLibrary() {
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
        <BookOpen className="size-5 text-agri-green" /> Kelola Library
      </h1>
      <p className="text-sm text-muted-foreground mt-1">
        Halaman ini akan diimplementasikan di Fase 4 (Library).
      </p>
      <div className="mt-8 rounded-xl border-2 border-dashed border-border p-12 text-center">
        <BookOpen className="size-10 text-muted-foreground mx-auto mb-4" />
        <p className="text-base font-semibold text-foreground">Segera Hadir</p>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
          CRUD konten library tanaman termasuk tips budidaya, hama umum, dan cara pencegahan akan tersedia di Fase 4.
        </p>
      </div>
    </div>
  )
}
