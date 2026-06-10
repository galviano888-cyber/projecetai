import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Commodity, Library } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { RichTextEditor, RichContent } from '@/components/RichTextEditor'
import {
  BookOpen, Pencil, Loader2, X,
  CheckCircle2, AlertCircle, Leaf, Eye
} from 'lucide-react'

type ToastType = { type: 'success' | 'error'; message: string } | null

const emptyForm = {
  konten_detail: '',
  tips_budidaya: '',
  hama_umum: '',
  cara_pencegahan: '',
}

export default function AdminLibrary() {
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [libraries, setLibraries] = useState<Record<string, Library>>({})
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<ToastType>(null)
  const [preview, setPreview] = useState<string | null>(null)

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  async function fetchData() {
    const [{ data: comms }, { data: libs }] = await Promise.all([
      supabase.from('commodities').select('*').order('nama'),
      supabase.from('library').select('*'),
    ])
    setCommodities((comms as Commodity[]) ?? [])
    const libMap: Record<string, Library> = {}
    ;(libs as Library[] ?? []).forEach(l => { if (l.commodity_id) libMap[l.commodity_id] = l })
    setLibraries(libMap)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  function openEdit(commodityId: string) {
    setSelectedId(commodityId)
    setPreview(null)
    const existing = libraries[commodityId]
    setForm(existing ? {
      konten_detail: existing.konten_detail ?? '',
      tips_budidaya: existing.tips_budidaya ?? '',
      hama_umum: existing.hama_umum ?? '',
      cara_pencegahan: existing.cara_pencegahan ?? '',
    } : { ...emptyForm })
  }


  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedId) return
    setSaving(true)

    const existing = libraries[selectedId]
    const payload = { commodity_id: selectedId, ...form }

    let error
    if (existing?.id) {
      ({ error } = await supabase.from('library').update(form).eq('id', existing.id))
    } else {
      ({ error } = await supabase.from('library').insert(payload))
    }

    setSaving(false)
    if (error) {
      showToast('error', `Gagal menyimpan: ${error.message}`)
    } else {
      const nama = commodities.find(c => c.id === selectedId)?.nama ?? ''
      showToast('success', `Konten library ${nama} berhasil disimpan.`)
      setSelectedId(null)
      fetchData()
    }
  }

  const selectedCommodity = commodities.find(c => c.id === selectedId)

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <BookOpen className="size-5 text-agri-green" /> Kelola Library
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola konten edukasi, tips budidaya, hama, dan cara pencegahan per komoditas.
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
          toast.type === 'success'
            ? 'bg-agri-green-light border-agri-green text-agri-green-dark'
            : 'bg-destructive/10 border-destructive/30 text-destructive'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle2 className="size-4 mt-0.5 shrink-0" />
            : <AlertCircle className="size-4 mt-0.5 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Commodity list */}
        <div className="lg:col-span-2 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Pilih Komoditas</p>
          {loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
            ))
          ) : commodities.map(c => {
            const hasContent = !!libraries[c.id!]
            const isSelected = selectedId === c.id
            return (
              <button
                key={c.id}
                onClick={() => openEdit(c.id!)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-agri-green bg-agri-green-light shadow-sm'
                    : 'border-border bg-white hover:border-agri-green/40 hover:bg-agri-green-light/30'
                }`}
              >
                <div className="size-8 rounded-lg bg-agri-green/10 flex items-center justify-center shrink-0">
                  <Leaf className="size-4 text-agri-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{c.nama}</p>
                  <p className="text-xs text-muted-foreground">
                    {hasContent ? '✓ Konten tersedia' : 'Belum ada konten'}
                  </p>
                </div>
                {hasContent && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setPreview(c.id!); setSelectedId(null) }}
                    className="p-1 rounded text-muted-foreground hover:text-agri-green transition-colors"
                    title="Preview"
                  >
                    <Eye className="size-3.5" />
                  </button>
                )}
              </button>
            )
          })}
        </div>

        {/* Right: Editor or Preview */}
        <div className="lg:col-span-3">
          {/* Edit Form */}
          {selectedId && selectedCommodity && (
            <Card className="shadow-sm border-agri-green/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Edit Library: {selectedCommodity.nama}</CardTitle>
                    <CardDescription>Isi konten edukasi untuk ditampilkan di halaman user.</CardDescription>
                  </div>
                  <button onClick={() => setSelectedId(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="size-5" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-4">
                  <RichEditorField
                    label="Deskripsi Detail"
                    value={form.konten_detail}
                    onChange={v => setForm(p => ({ ...p, konten_detail: v }))}
                    placeholder="Deskripsi lengkap tentang tanaman, manfaat, dan karakteristiknya..."
                  />
                  <RichEditorField
                    label="Tips Budidaya"
                    value={form.tips_budidaya}
                    onChange={v => setForm(p => ({ ...p, tips_budidaya: v }))}
                    placeholder="Tips dan panduan praktis untuk petani..."
                  />
                  <RichEditorField
                    label="Hama & Penyakit Umum"
                    value={form.hama_umum}
                    onChange={v => setForm(p => ({ ...p, hama_umum: v }))}
                    placeholder="Daftar hama dan penyakit yang sering menyerang..."
                    minHeight="100px"
                  />
                  <RichEditorField
                    label="Cara Pencegahan & Pengendalian"
                    value={form.cara_pencegahan}
                    onChange={v => setForm(p => ({ ...p, cara_pencegahan: v }))}
                    placeholder="Langkah-langkah pencegahan dan pengendalian OPT..."
                    minHeight="100px"
                  />
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      disabled={saving}
                      className="bg-agri-green hover:bg-agri-green-dark text-white font-semibold"
                    >
                      {saving
                        ? <><Loader2 className="size-4 mr-2 animate-spin" />Menyimpan...</>
                        : <><CheckCircle2 className="size-4 mr-2" />Simpan Konten</>}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setSelectedId(null)}>Batal</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Preview */}
          {preview && (() => {
            const lib = libraries[preview]
            const comm = commodities.find(c => c.id === preview)
            if (!lib || !comm) return null
            return (
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Preview: {comm.nama}</CardTitle>
                      <CardDescription>Tampilan seperti yang dilihat user</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(preview)}>
                        <Pencil className="size-3.5 mr-1" /> Edit
                      </Button>
                      <button onClick={() => setPreview(null)} className="text-muted-foreground hover:text-foreground">
                        <X className="size-5" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                 <CardContent className="space-y-4">
                   {lib.konten_detail && (
                     <PreviewSection title="Deskripsi Detail" content={lib.konten_detail} />
                   )}
                   {lib.tips_budidaya && (
                     <PreviewSection title="Tips Budidaya" content={lib.tips_budidaya} />
                   )}
                   {lib.hama_umum && (
                     <PreviewSection title="Hama & Penyakit" content={lib.hama_umum} />
                   )}
                   {lib.cara_pencegahan && (
                     <PreviewSection title="Cara Pencegahan" content={lib.cara_pencegahan} />
                   )}
                 </CardContent>
               
              </Card>
            )
          })()}

          {/* Empty state */}
          {!selectedId && !preview && (
            <div className="h-full flex items-center justify-center rounded-2xl border-2 border-dashed border-border p-12 text-center">
              <div>
                <BookOpen className="size-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground">Pilih komoditas</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Klik salah satu komoditas di sebelah kiri untuk mengedit konten library-nya.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RichEditorField({ label, value, onChange, placeholder, minHeight }: {
  label: string; value: string
  onChange: (v: string) => void
  placeholder?: string; minHeight?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <RichTextEditor
        content={value}
        onChange={onChange}
        placeholder={placeholder}
        minHeight={minHeight}
      />
    </div>
  )
}

function PreviewSection({ title, content }: { title: string; content: string }) {
  // Deteksi apakah konten adalah HTML atau plain text
  const isHtml = content.trim().startsWith('<')
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{title}</p>
      {isHtml
        ? <RichContent html={content} />
        : <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{content}</p>
      }
    </div>
  )
}
