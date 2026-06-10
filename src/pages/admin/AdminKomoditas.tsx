import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { Commodity } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Leaf, Plus, Pencil, Trash2, Loader2, X,
  CheckCircle2, AlertCircle, ChevronDown, ChevronUp,
  Upload, ImageIcon, ChevronLeft, ChevronRight
} from 'lucide-react'

const PAGE_SIZE = 10

const MUSIM_LABELS: Record<string, string> = {
  hujan: 'Musim Hujan',
  kemarau: 'Musim Kemarau',
  sepanjang_tahun: 'Sepanjang Tahun',
}

const MUSIM_COLORS: Record<string, string> = {
  hujan: 'bg-agri-blue/10 text-agri-blue border-agri-blue/20',
  kemarau: 'bg-agri-yellow/20 text-amber-800 border-agri-yellow/40',
  sepanjang_tahun: 'bg-agri-green/10 text-agri-green-dark border-agri-green/20',
}

const emptyForm: Omit<Commodity, 'id' | 'created_at'> = {
  nama: '', nama_ilmiah: '', deskripsi: '',
  ch_min: undefined, ch_max: undefined,
  suhu_min: undefined, suhu_max: undefined,
  kelembaban_min: undefined, kelembaban_max: undefined,
  air_tanah_min: undefined,
  waktu_tanam: '', durasi_panen: '', jarak_tanam: '',
  info_pupuk: '', hama: '', risiko: '',
  musim: 'hujan',
}

type ToastType = { type: 'success' | 'error'; message: string } | null

export default function AdminKomoditas() {
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Commodity | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<ToastType>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  async function fetchCommodities(p = page) {
    setLoading(true)
    const from = (p - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const [{ data, error }, { count }] = await Promise.all([
      supabase.from('commodities').select('*').order('nama').range(from, to),
      supabase.from('commodities').select('*', { count: 'exact', head: true }),
    ])

    if (!error) {
      setCommodities((data as Commodity[]) ?? [])
      setTotal(count ?? 0)
    }
    setLoading(false)
  }

  useEffect(() => { fetchCommodities(page) }, [page])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  async function handleUploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validasi tipe dan ukuran
    if (!file.type.startsWith('image/')) {
      showToast('error', 'File harus berupa gambar (jpg, png, webp).')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('error', 'Ukuran gambar maksimal 2MB.')
      return
    }

    setUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = `komoditas/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('agrodemak-images')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      showToast('error', `Gagal upload: ${uploadError.message}`)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('agrodemak-images')
      .getPublicUrl(fileName)

    setForm(prev => ({ ...prev, foto_url: urlData.publicUrl }))
    showToast('success', 'Gambar berhasil diupload.')
    setUploading(false)
  }

  function openCreate() {
    setEditing(null)
    setForm({ ...emptyForm })
    setShowForm(true)
  }

  function openEdit(c: Commodity) {
    setEditing(c)
    setForm({
      nama: c.nama, nama_ilmiah: c.nama_ilmiah ?? '',
      deskripsi: c.deskripsi ?? '',
      ch_min: c.ch_min, ch_max: c.ch_max,
      suhu_min: c.suhu_min, suhu_max: c.suhu_max,
      kelembaban_min: c.kelembaban_min, kelembaban_max: c.kelembaban_max,
      air_tanah_min: c.air_tanah_min,
      waktu_tanam: c.waktu_tanam ?? '', durasi_panen: c.durasi_panen ?? '',
      jarak_tanam: c.jarak_tanam ?? '', info_pupuk: c.info_pupuk ?? '',
      hama: c.hama ?? '', risiko: c.risiko ?? '',
      musim: c.musim ?? 'hujan',
    })
    setShowForm(true)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    const numericFields = ['ch_min','ch_max','suhu_min','suhu_max','kelembaban_min','kelembaban_max','air_tanah_min']
    setForm((prev) => ({
      ...prev,
      [name]: numericFields.includes(name) ? (value === '' ? undefined : parseFloat(value)) : value
    }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    if (editing?.id) {
      const { error } = await supabase.from('commodities').update(form).eq('id', editing.id)
      if (error) showToast('error', `Gagal memperbarui: ${error.message}`)
      else showToast('success', `${form.nama} berhasil diperbarui.`)
    } else {
      const { error } = await supabase.from('commodities').insert(form)
      if (error) showToast('error', `Gagal menambah: ${error.message}`)
      else showToast('success', `${form.nama} berhasil ditambahkan.`)
    }

    setSaving(false)
    setShowForm(false)
    fetchCommodities()
  }

  async function handleDelete(id: string, nama: string) {
    const { error } = await supabase.from('commodities').delete().eq('id', id)
    if (error) showToast('error', `Gagal menghapus: ${error.message}`)
    else showToast('success', `${nama} berhasil dihapus.`)
    setDeleteId(null)
    fetchCommodities()
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Leaf className="size-5 text-agri-green" /> Kelola Komoditas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total} komoditas terdaftar
          </p>
        </div>
        {!showForm && (
          <Button
            onClick={openCreate}
            className="bg-agri-green hover:bg-agri-green-dark text-white font-semibold"
          >
            <Plus className="size-4 mr-2" /> Tambah Komoditas
          </Button>
        )}
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

      {/* Form */}
      {showForm && (
        <Card className="shadow-sm border-agri-green/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  {editing ? `Edit: ${editing.nama}` : 'Tambah Komoditas Baru'}
                </CardTitle>
                <CardDescription>Isi data dasar dan syarat tumbuh komoditas.</CardDescription>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Tutup form"
              >
                <X className="size-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-5">
              {/* Identitas */}
              <fieldset className="space-y-4">
                <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Identitas Tanaman</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TextInput name="nama" label="Nama Tanaman" value={form.nama} onChange={handleChange} required />
                  <TextInput name="nama_ilmiah" label="Nama Ilmiah" value={form.nama_ilmiah ?? ''} onChange={handleChange} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Deskripsi</label>
                  <textarea
                    name="deskripsi"
                    value={form.deskripsi}
                    onChange={handleChange}
                    rows={2}
                    className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-agri-green focus-visible:ring-2 focus-visible:ring-agri-green/20 resize-none placeholder:text-muted-foreground"
                    placeholder="Deskripsi singkat tanaman..."
                  />
                </div>

                {/* Upload foto */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Foto Komoditas</label>
                  <div className="flex items-start gap-3">
                    {form.foto_url ? (
                      <img src={form.foto_url} alt="Preview" className="size-16 rounded-xl object-cover border border-border shrink-0" />
                    ) : (
                      <div className="size-16 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <ImageIcon className="size-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <label
                        htmlFor="foto-upload"
                        className={`flex items-center gap-2 h-9 px-3 rounded-lg border border-input text-sm cursor-pointer hover:bg-muted transition-colors ${
                          uploading ? 'opacity-50 pointer-events-none' : ''
                        }`}
                      >
                        {uploading
                          ? <><Loader2 className="size-3.5 animate-spin" /> Mengupload...</>
                          : <><Upload className="size-3.5" /> Pilih Gambar</>}
                        <input
                          id="foto-upload"
                          type="file"
                          accept="image/*"
                          ref={fileRef}
                          onChange={handleUploadImage}
                          className="sr-only"
                        />
                      </label>
                      <p className="text-xs text-muted-foreground">JPG, PNG, WebP. Maks 2MB.</p>
                      {form.foto_url && (
                        <button
                          type="button"
                          onClick={() => setForm(p => ({ ...p, foto_url: '' }))}
                          className="text-xs text-destructive hover:underline"
                        >
                          Hapus foto
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Musim Tanam</label>
                  <select
                    name="musim"
                    value={form.musim}
                    onChange={handleChange}
                    className="w-full h-10 rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:border-agri-green focus-visible:ring-2 focus-visible:ring-agri-green/20"
                  >
                    <option value="hujan">Musim Hujan</option>
                    <option value="kemarau">Musim Kemarau</option>
                    <option value="sepanjang_tahun">Sepanjang Tahun</option>
                  </select>
                </div>
              </fieldset>

              {/* Syarat Iklim */}
              <fieldset>
                <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Syarat Iklim</legend>
                <div className="grid grid-cols-2 gap-3">
                  <NumericInput name="ch_min" label="CH Min (mm)" value={form.ch_min} onChange={handleChange} />
                  <NumericInput name="ch_max" label="CH Max (mm)" value={form.ch_max} onChange={handleChange} />
                  <NumericInput name="suhu_min" label="Suhu Min (°C)" value={form.suhu_min} onChange={handleChange} />
                  <NumericInput name="suhu_max" label="Suhu Max (°C)" value={form.suhu_max} onChange={handleChange} />
                  <NumericInput name="kelembaban_min" label="Kelembaban Min (%)" value={form.kelembaban_min} onChange={handleChange} />
                  <NumericInput name="kelembaban_max" label="Kelembaban Max (%)" value={form.kelembaban_max} onChange={handleChange} />
                  <NumericInput name="air_tanah_min" label="Air Tanah Min (mm/hr)" value={form.air_tanah_min} onChange={handleChange} />
                </div>
              </fieldset>

              {/* Info Budidaya */}
              <fieldset>
                <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Info Budidaya</legend>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <TextInput name="waktu_tanam" label="Waktu Tanam" value={form.waktu_tanam ?? ''} onChange={handleChange} placeholder="Nov-Feb" />
                  <TextInput name="durasi_panen" label="Durasi Panen" value={form.durasi_panen ?? ''} onChange={handleChange} placeholder="90-110 hari" />
                  <TextInput name="jarak_tanam" label="Jarak Tanam" value={form.jarak_tanam ?? ''} onChange={handleChange} placeholder="25x25 cm" />
                </div>
                <div className="mt-3 space-y-3">
                  <TextAreaInput name="info_pupuk" label="Info Pupuk" value={form.info_pupuk ?? ''} onChange={handleChange} />
                  <TextAreaInput name="hama" label="Hama Utama" value={form.hama ?? ''} onChange={handleChange} />
                  <TextAreaInput name="risiko" label="Risiko" value={form.risiko ?? ''} onChange={handleChange} />
                </div>
              </fieldset>

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-agri-green hover:bg-agri-green-dark text-white font-semibold"
                >
                  {saving ? <><Loader2 className="size-4 mr-2 animate-spin" />Menyimpan...</> : <><CheckCircle2 className="size-4 mr-2" />{editing ? 'Perbarui' : 'Simpan'} Komoditas</>}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : commodities.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="pt-10 pb-10 text-center">
            <Leaf className="size-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">Belum ada komoditas</p>
            <p className="text-xs text-muted-foreground mt-1">Klik tombol di atas untuk menambah komoditas.</p>
          </CardContent>
        </Card>
      ) : (
        <>
        <div className="space-y-2">
          {commodities.map((c) => (
            <div key={c.id} className="rounded-xl border border-border bg-white overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Foto atau icon */}
                {c.foto_url ? (
                  <img src={c.foto_url} alt={c.nama} loading="lazy" className="size-8 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="size-8 rounded-lg bg-agri-green/10 flex items-center justify-center shrink-0">
                    <Leaf className="size-4 text-agri-green" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{c.nama}</p>
                  {c.nama_ilmiah && <p className="text-xs text-muted-foreground italic truncate">{c.nama_ilmiah}</p>}
                </div>
                {c.musim && (
                  <Badge className={`text-xs shrink-0 hidden sm:inline-flex ${MUSIM_COLORS[c.musim] ?? ''}`}>
                    {MUSIM_LABELS[c.musim] ?? c.musim}
                  </Badge>
                )}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setExpanded(expanded === c.id ? null : c.id!)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    aria-label="Detail"
                  >
                    {expanded === c.id ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </button>
                  <button
                    onClick={() => openEdit(c)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-agri-green hover:bg-agri-green-light transition-colors"
                    aria-label="Edit"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(c.id!)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    aria-label="Hapus"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              {/* Expanded detail */}
              {expanded === c.id && (
                <div className="border-t border-border bg-muted/30 px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <InfoCell label="CH" value={c.ch_min != null ? `${c.ch_min}–${c.ch_max} mm` : '—'} />
                  <InfoCell label="Suhu" value={c.suhu_min != null ? `${c.suhu_min}–${c.suhu_max} °C` : '—'} />
                  <InfoCell label="Kelembaban" value={c.kelembaban_min != null ? `${c.kelembaban_min}–${c.kelembaban_max} %` : '—'} />
                  <InfoCell label="Air Tanah Min" value={c.air_tanah_min != null ? `${c.air_tanah_min} mm/hr` : '—'} />
                  {c.waktu_tanam && <InfoCell label="Waktu Tanam" value={c.waktu_tanam} />}
                  {c.durasi_panen && <InfoCell label="Durasi Panen" value={c.durasi_panen} />}
                  {c.jarak_tanam && <InfoCell label="Jarak Tanam" value={c.jarak_tanam} />}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Halaman {page} dari {totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
        </>
      )}

      {/* Delete confirm dialog */}
      {deleteId && (() => {
        const c = commodities.find(x => x.id === deleteId)
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <Card className="w-full max-w-sm shadow-2xl">
              <CardContent className="pt-6 pb-6 text-center">
                <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="size-5 text-destructive" />
                </div>
                <p className="text-base font-semibold text-foreground">Hapus {c?.nama}?</p>
                <p className="text-sm text-muted-foreground mt-1">Tindakan ini tidak bisa dibatalkan. Data terkait di library dan rekomendasi juga akan terhapus.</p>
                <div className="flex gap-3 mt-5 justify-center">
                  <Button variant="outline" onClick={() => setDeleteId(null)}>Batal</Button>
                  <Button
                    className="bg-destructive hover:bg-destructive/90 text-white"
                    onClick={() => handleDelete(deleteId, c?.nama ?? '')}
                  >
                    Ya, Hapus
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      })()}
    </div>
  )
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground mt-0.5">{value}</p>
    </div>
  )
}

function TextInput({ name, label, value, onChange, required, placeholder }: {
  name: string; label: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean; placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium">{label}</label>
      <input
        id={name} name={name} type="text" value={value} onChange={onChange}
        required={required} placeholder={placeholder}
        className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-agri-green focus-visible:ring-2 focus-visible:ring-agri-green/20 placeholder:text-muted-foreground"
      />
    </div>
  )
}

function NumericInput({ name, label, value, onChange }: {
  name: string; label: string; value: number | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium">{label}</label>
      <input
        id={name} name={name} type="number" step="0.01" min="0"
        value={value ?? ''} onChange={onChange}
        className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-agri-green focus-visible:ring-2 focus-visible:ring-agri-green/20"
      />
    </div>
  )
}

function TextAreaInput({ name, label, value, onChange }: {
  name: string; label: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium">{label}</label>
      <textarea
        id={name} name={name} value={value} onChange={onChange} rows={2}
        className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-agri-green focus-visible:ring-2 focus-visible:ring-agri-green/20 resize-none placeholder:text-muted-foreground"
      />
    </div>
  )
}
