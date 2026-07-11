import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { PrediksiIklim } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  CalendarDays, Plus, Pencil, Trash2, Loader2, X,
  CheckCircle2, AlertCircle, CloudRain, Thermometer,
  Droplets, Layers, ChevronLeft, ChevronRight
} from 'lucide-react'

const BULAN_NAMES = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const BULAN_SHORT = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
]

const currentYear = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => currentYear - 1 + i)

type ToastType = { type: 'success' | 'error'; message: string } | null

const emptyForm: Omit<PrediksiIklim, 'id' | 'created_at'> = {
  bulan: new Date().getMonth() + 1,
  tahun: currentYear,
  ch_mm: 0,
  suhu: 0,
  kelembaban: 0,
  kat: undefined,
  sumber: 'BMKG',
  keterangan: '',
}

// Klasifikasi Oldeman
function oldeman(ch: number): string {
  if (ch >= 200) return 'BB'
  if (ch >= 100) return 'BL'
  return 'BK'
}

function oldemanColor(kelas: string) {
  if (kelas === 'BB') return 'bg-blue-100 text-blue-700 border-blue-200'
  if (kelas === 'BL') return 'bg-green-100 text-green-700 border-green-200'
  return 'bg-amber-100 text-amber-700 border-amber-200'
}

const PAGE_SIZE = 12

export default function AdminKalenderTanam() {
  const [data, setData] = useState<PrediksiIklim[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<PrediksiIklim | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<ToastType>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [filterTahun, setFilterTahun] = useState<number | 'semua'>('semua')

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  // useCallback memastikan fetchData stabil antar render sehingga tidak
  // menyebabkan stale closure saat dipanggil dari useEffect atau handler lain.
  const fetchData = useCallback(async (p: number) => {
    setLoading(true)
    const from = (p - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    let query = supabase
      .from('prediksi_iklim')
      .select('*', { count: 'exact' })
      .order('tahun', { ascending: false })
      .order('bulan', { ascending: true })
      .range(from, to)

    if (filterTahun !== 'semua') {
      query = query.eq('tahun', filterTahun)
    }

    const { data: rows, count, error } = await query
    if (!error) {
      setData((rows as PrediksiIklim[]) ?? [])
      setTotal(count ?? 0)
    }
    setLoading(false)
  }, [filterTahun])

  // Reset ke halaman 1 saat filter tahun berubah
  useEffect(() => { setPage(1); fetchData(1) }, [filterTahun, fetchData])
  useEffect(() => { fetchData(page) }, [page, fetchData])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  function openCreate() {
    setEditing(null)
    setForm({ ...emptyForm })
    setShowForm(true)
  }

  function openEdit(item: PrediksiIklim) {
    setEditing(item)
    setForm({
      bulan: item.bulan,
      tahun: item.tahun,
      ch_mm: item.ch_mm,
      suhu: item.suhu,
      kelembaban: item.kelembaban,
      kat: item.kat,
      sumber: item.sumber ?? 'BMKG',
      keterangan: item.keterangan ?? '',
    })
    setShowForm(true)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    const numericFields = ['bulan', 'tahun', 'ch_mm', 'suhu', 'kelembaban', 'kat']
    setForm(prev => ({
      ...prev,
      [name]: numericFields.includes(name)
        ? (value === '' ? undefined : parseFloat(value))
        : value
    }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const payload = {
      bulan: form.bulan,
      tahun: form.tahun,
      ch_mm: form.ch_mm,
      suhu: form.suhu,
      kelembaban: form.kelembaban,
      kat: form.kat ?? null,
      sumber: form.sumber || 'BMKG',
      keterangan: form.keterangan || null,
    }

    if (editing?.id) {
      const { error } = await supabase.from('prediksi_iklim').update(payload).eq('id', editing.id)
      if (error) showToast('error', `Gagal memperbarui: ${error.message}`)
      else showToast('success', `Data ${BULAN_NAMES[form.bulan]} ${form.tahun} berhasil diperbarui.`)
    } else {
      const { error } = await supabase.from('prediksi_iklim').insert(payload)
      if (error) {
        if (error.code === '23505') showToast('error', `Data ${BULAN_NAMES[form.bulan]} ${form.tahun} sudah ada. Gunakan edit.`)
        else showToast('error', `Gagal menambah: ${error.message}`)
      } else {
        showToast('success', `Data ${BULAN_NAMES[form.bulan]} ${form.tahun} berhasil ditambahkan.`)
      }
    }

    setSaving(false)
    setShowForm(false)
    fetchData(page)
  }

  async function handleDelete(id: string, label: string) {
    const { error } = await supabase.from('prediksi_iklim').delete().eq('id', id)
    if (error) showToast('error', `Gagal menghapus: ${error.message}`)
    else showToast('success', `Data ${label} berhasil dihapus.`)
    setDeleteId(null)
    fetchData(page)
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="size-5 text-agri-green" /> Prediksi Iklim BMKG
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Input data prediksi CH, suhu, kelembaban, dan KAT bulanan dari BMKG.
          </p>
        </div>
        {!showForm && (
          <Button
            onClick={openCreate}
            className="bg-agri-green hover:bg-agri-green-dark text-white font-semibold"
          >
            <Plus className="size-4 mr-2" /> Tambah Data
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

      {/* Form Input */}
      {showForm && (
        <Card className="shadow-sm border-agri-green/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  {editing ? `Edit: ${BULAN_NAMES[editing.bulan]} ${editing.tahun}` : 'Tambah Prediksi Iklim'}
                </CardTitle>
                <CardDescription>
                  Masukkan data prediksi iklim dari BMKG untuk bulan dan tahun tertentu.
                </CardDescription>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Tutup form"
              >
                <X className="size-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-5">

              {/* Bulan & Tahun */}
              <fieldset className="space-y-3">
                <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Periode</legend>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Bulan</label>
                    <select
                      name="bulan"
                      value={form.bulan}
                      onChange={handleChange}
                      className="w-full h-10 rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:border-agri-green focus-visible:ring-2 focus-visible:ring-agri-green/20"
                      required
                    >
                      {BULAN_NAMES.slice(1).map((b, i) => (
                        <option key={i + 1} value={i + 1}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Tahun</label>
                    <select
                      name="tahun"
                      value={form.tahun}
                      onChange={handleChange}
                      className="w-full h-10 rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:border-agri-green focus-visible:ring-2 focus-visible:ring-agri-green/20"
                      required
                    >
                      {YEAR_OPTIONS.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </fieldset>

              {/* Parameter Iklim */}
              <fieldset className="space-y-3">
                <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Parameter Iklim (Prediksi BMKG)
                </legend>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <CloudRain className="size-3.5 text-blue-500" />
                      CH (mm/bulan)
                    </label>
                    <input
                      name="ch_mm" type="number" step="0.01" min="0"
                      value={form.ch_mm}
                      onChange={handleChange}
                      required
                      className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-agri-green focus-visible:ring-2 focus-visible:ring-agri-green/20"
                      placeholder="cth: 280"
                    />
                    {form.ch_mm > 0 && (
                      <p className="text-xs font-medium">
                        <span className={`inline-block px-1.5 py-0.5 rounded border text-xs ${
                          oldemanColor(oldeman(form.ch_mm))
                        }`}>
                          {oldeman(form.ch_mm)}
                        </span>
                        <span className="text-muted-foreground ml-1">
                          {oldeman(form.ch_mm) === 'BB' ? 'Bulan Basah' :
                           oldeman(form.ch_mm) === 'BL' ? 'Bulan Lembab' : 'Bulan Kering'}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Thermometer className="size-3.5 text-orange-500" />
                      Suhu (°C)
                    </label>
                    <input
                      name="suhu" type="number" step="0.1" min="0"
                      value={form.suhu}
                      onChange={handleChange}
                      required
                      className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-agri-green focus-visible:ring-2 focus-visible:ring-agri-green/20"
                      placeholder="cth: 27.5"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Droplets className="size-3.5 text-agri-green" />
                      Kelembaban (%)
                    </label>
                    <input
                      name="kelembaban" type="number" step="0.1" min="0" max="100"
                      value={form.kelembaban}
                      onChange={handleChange}
                      required
                      className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-agri-green focus-visible:ring-2 focus-visible:ring-agri-green/20"
                      placeholder="cth: 82"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Layers className="size-3.5 text-purple-500" />
                      KAT (%)
                    </label>
                    <input
                      name="kat" type="number" step="0.1" min="0" max="100"
                      value={form.kat ?? ''}
                      onChange={handleChange}
                      className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-agri-green focus-visible:ring-2 focus-visible:ring-agri-green/20"
                      placeholder="Opsional"
                    />
                    <p className="text-xs text-muted-foreground">Ketersediaan Air Tanah</p>
                  </div>
                </div>
              </fieldset>

              {/* Metadata */}
              <fieldset className="space-y-3">
                <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Metadata</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Sumber Data</label>
                    <select
                      name="sumber"
                      value={form.sumber}
                      onChange={handleChange}
                      className="w-full h-10 rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:border-agri-green focus-visible:ring-2 focus-visible:ring-agri-green/20"
                    >
                      <option value="BMKG">BMKG</option>
                      <option value="BMKG Stasiun Semarang">BMKG Stasiun Semarang</option>
                      <option value="CHIRPS">CHIRPS</option>
                      <option value="ERA5">ERA5</option>
                      <option value="Manual">Input Manual</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Keterangan</label>
                    <input
                      name="keterangan" type="text"
                      value={form.keterangan}
                      onChange={handleChange}
                      placeholder="Catatan tambahan (opsional)"
                      className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-agri-green focus-visible:ring-2 focus-visible:ring-agri-green/20"
                    />
                  </div>
                </div>
              </fieldset>

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-agri-green hover:bg-agri-green-dark text-white font-semibold"
                >
                  {saving
                    ? <><Loader2 className="size-4 mr-2 animate-spin" />Menyimpan...</>
                    : <><CheckCircle2 className="size-4 mr-2" />{editing ? 'Perbarui' : 'Simpan'} Data</>}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filter Tahun */}
      <div className="flex items-center gap-3 flex-wrap">
        <p className="text-sm font-medium text-muted-foreground">Filter Tahun:</p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterTahun('semua')}
            className={`px-3 py-1 rounded-lg text-sm font-medium border transition-colors ${
              filterTahun === 'semua'
                ? 'bg-agri-green text-white border-agri-green'
                : 'border-border text-muted-foreground hover:border-agri-green/50'
            }`}
          >
            Semua
          </button>
          {YEAR_OPTIONS.map(y => (
            <button
              key={y}
              onClick={() => setFilterTahun(y)}
              className={`px-3 py-1 rounded-lg text-sm font-medium border transition-colors ${
                filterTahun === y
                  ? 'bg-agri-green text-white border-agri-green'
                  : 'border-border text-muted-foreground hover:border-agri-green/50'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground ml-auto">{total} data tersimpan</p>
      </div>

      {/* Tabel Data */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="pt-10 pb-10 text-center">
            <CloudRain className="size-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">Belum ada data prediksi iklim</p>
            <p className="text-xs text-muted-foreground mt-1">Mulai dengan menambah data prediksi BMKG.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Periode</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
                    <span className="flex items-center justify-end gap-1">
                      <CloudRain className="size-3.5 text-blue-500" /> CH
                    </span>
                  </th>
                  <th className="text-center px-3 py-3 font-semibold text-muted-foreground">Kelas</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">
                    <span className="flex items-center justify-end gap-1">
                      <Thermometer className="size-3.5 text-orange-500" /> Suhu
                    </span>
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">
                    <span className="flex items-center justify-end gap-1">
                      <Droplets className="size-3.5 text-agri-green" /> RH
                    </span>
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">
                    <span className="flex items-center justify-end gap-1">
                      <Layers className="size-3.5 text-purple-500" /> KAT
                    </span>
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Sumber</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((item) => {
                  const olk = oldeman(item.ch_mm)
                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {BULAN_SHORT[item.bulan]} {item.tahun}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-foreground">
                        {item.ch_mm} mm
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-md border text-xs font-semibold ${
                          oldemanColor(olk)
                        }`}>
                          {olk}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono hidden sm:table-cell">
                        {item.suhu}°C
                      </td>
                      <td className="px-4 py-3 text-right font-mono hidden sm:table-cell">
                        {item.kelembaban}%
                      </td>
                      <td className="px-4 py-3 text-right font-mono hidden md:table-cell">
                        {item.kat != null ? `${item.kat}%` : '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-xs">
                        {item.sumber}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-agri-green hover:bg-agri-green-light transition-colors"
                            aria-label="Edit"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteId(item.id!)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            aria-label="Hapus"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-sm text-muted-foreground">Halaman {page} dari {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Keterangan Oldeman */}
      <Card className="bg-muted/30 border-dashed shadow-none">
        <CardContent className="pt-4 pb-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Klasifikasi Oldeman (1975):</p>
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="inline-block px-2 py-0.5 rounded-md border bg-blue-100 text-blue-700 border-blue-200 font-semibold">BB</span>
              Bulan Basah: CH ≥ 200 mm
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block px-2 py-0.5 rounded-md border bg-green-100 text-green-700 border-green-200 font-semibold">BL</span>
              Bulan Lembab: 100 ≤ CH &lt; 200 mm
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block px-2 py-0.5 rounded-md border bg-amber-100 text-amber-700 border-amber-200 font-semibold">BK</span>
              Bulan Kering: CH &lt; 100 mm
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirm */}
      {deleteId && (() => {
        const item = data.find(x => x.id === deleteId)
        const label = item ? `${BULAN_NAMES[item.bulan]} ${item.tahun}` : ''
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <Card className="w-full max-w-sm shadow-2xl">
              <CardContent className="pt-6 pb-6 text-center">
                <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="size-5 text-destructive" />
                </div>
                <p className="text-base font-semibold text-foreground">Hapus data {label}?</p>
                <p className="text-sm text-muted-foreground mt-1">Data prediksi iklim ini akan dihapus permanen.</p>
                <div className="flex gap-3 mt-5 justify-center">
                  <Button variant="outline" onClick={() => setDeleteId(null)}>Batal</Button>
                  <Button
                    className="bg-destructive hover:bg-destructive/90 text-white"
                    onClick={() => handleDelete(deleteId, label)}
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
