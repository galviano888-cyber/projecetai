import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ThresholdTanaman } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  FlaskConical, Pencil, Loader2, X,
  CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Info
} from 'lucide-react'

const KELAS_COLORS = {
  S1: 'bg-green-100 text-green-700 border-green-200',
  S2: 'bg-blue-100 text-blue-700 border-blue-200',
  S3: 'bg-amber-100 text-amber-700 border-amber-200',
  N:  'bg-red-100 text-red-700 border-red-200',
}

type ToastType = { type: 'success' | 'error'; message: string } | null

type FormState = Omit<ThresholdTanaman, 'id' | 'created_at'>

const emptyForm: FormState = {
  nama_tanaman: '',
  total_hari: 0,
  total_bulan: 0,
  pola_ch: '',
  suhu_s1_min: 0, suhu_s1_max: 0,
  suhu_s2_min: 0, suhu_s2_max: 0,
  suhu_s3_min: 0, suhu_s3_max: 0,
  rh_s1_min: 0, rh_s1_max: 0,
  rh_s2_min: 0, rh_s2_max: 0,
  rh_s3_min: 0, rh_s3_max: 0,
  kat_s1_min: 0,
  kat_s2_min: 0,
  kat_s3_min: 0,
  referensi: '',
}

export default function AdminThreshold() {
  const [data, setData] = useState<ThresholdTanaman[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ThresholdTanaman | null>(null)
  const [form, setForm] = useState<FormState>({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<ToastType>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  async function fetchData() {
    setLoading(true)
    const { data: rows, error } = await supabase
      .from('threshold_tanaman')
      .select('*')
      .order('nama_tanaman')
    if (!error) setData((rows as ThresholdTanaman[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  function openEdit(item: ThresholdTanaman) {
    setEditing(item)
    setForm({
      nama_tanaman: item.nama_tanaman,
      total_hari: item.total_hari,
      total_bulan: item.total_bulan,
      pola_ch: item.pola_ch,
      suhu_s1_min: item.suhu_s1_min, suhu_s1_max: item.suhu_s1_max,
      suhu_s2_min: item.suhu_s2_min, suhu_s2_max: item.suhu_s2_max,
      suhu_s3_min: item.suhu_s3_min, suhu_s3_max: item.suhu_s3_max,
      rh_s1_min: item.rh_s1_min, rh_s1_max: item.rh_s1_max,
      rh_s2_min: item.rh_s2_min, rh_s2_max: item.rh_s2_max,
      rh_s3_min: item.rh_s3_min, rh_s3_max: item.rh_s3_max,
      kat_s1_min: item.kat_s1_min,
      kat_s2_min: item.kat_s2_min,
      kat_s3_min: item.kat_s3_min,
      referensi: item.referensi ?? '',
    })
    setShowForm(true)
    setExpanded(null)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    const numericFields = [
      'total_hari', 'total_bulan',
      'suhu_s1_min', 'suhu_s1_max', 'suhu_s2_min', 'suhu_s2_max', 'suhu_s3_min', 'suhu_s3_max',
      'rh_s1_min', 'rh_s1_max', 'rh_s2_min', 'rh_s2_max', 'rh_s3_min', 'rh_s3_max',
      'kat_s1_min', 'kat_s2_min', 'kat_s3_min',
    ]
    setForm(prev => ({
      ...prev,
      [name]: numericFields.includes(name) ? (value === '' ? 0 : parseFloat(value)) : value
    }))
  }

  // Auto-hitung pola CH dan total bulan dari pola_ch string
  function handlePolaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.toUpperCase()
    const parts = val.split(',').map(s => s.trim()).filter(Boolean)
    setForm(prev => ({
      ...prev,
      pola_ch: val,
      total_bulan: parts.length,
    }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()

    // Validasi input sebelum simpan ke DB
    const errors: string[] = []
    if (!form.nama_tanaman.trim()) errors.push('Nama tanaman wajib diisi.')
    if (form.total_hari <= 0) errors.push('Total hari harus lebih dari 0.')
    if (form.total_bulan <= 0) errors.push('Total bulan harus lebih dari 0.')
    if (!form.pola_ch.trim()) errors.push('Pola CH wajib diisi (contoh: BB,BL,BK).')
    const validOldeman = /^(BB|BL|BK)(,(BB|BL|BK))*$/
    if (form.pola_ch && !validOldeman.test(form.pola_ch.trim())) {
      errors.push('Pola CH harus berisi BB, BL, atau BK dipisah koma (contoh: BB,BL,BK).')
    }
    if (form.suhu_s1_min >= form.suhu_s1_max) errors.push('Suhu S1: nilai minimum harus lebih kecil dari maksimum.')
    if (form.suhu_s2_min >= form.suhu_s2_max) errors.push('Suhu S2: nilai minimum harus lebih kecil dari maksimum.')
    if (form.suhu_s3_min >= form.suhu_s3_max) errors.push('Suhu S3: nilai minimum harus lebih kecil dari maksimum.')
    if (form.rh_s1_min >= form.rh_s1_max) errors.push('RH S1: nilai minimum harus lebih kecil dari maksimum.')
    if (form.rh_s2_min >= form.rh_s2_max) errors.push('RH S2: nilai minimum harus lebih kecil dari maksimum.')
    if (form.rh_s3_min >= form.rh_s3_max) errors.push('RH S3: nilai minimum harus lebih kecil dari maksimum.')
    if (form.kat_s1_min <= 0 || form.kat_s1_min > 100) errors.push('KAT S1 harus antara 1-100.')
    if (form.kat_s2_min <= 0 || form.kat_s2_min > 100) errors.push('KAT S2 harus antara 1-100.')
    if (form.kat_s3_min <= 0 || form.kat_s3_min > 100) errors.push('KAT S3 harus antara 1-100.')
    if (form.kat_s1_min <= form.kat_s2_min) errors.push('KAT S1 harus lebih besar dari KAT S2.')
    if (form.kat_s2_min <= form.kat_s3_min) errors.push('KAT S2 harus lebih besar dari KAT S3.')

    if (errors.length > 0) {
      showToast('error', errors[0])
      return
    }

    setSaving(true)

    const payload = { ...form }

    if (editing?.id) {
      const { error } = await supabase
        .from('threshold_tanaman')
        .update(payload)
        .eq('id', editing.id)
      if (error) showToast('error', `Gagal memperbarui: ${error.message}`)
      else showToast('success', `Threshold ${form.nama_tanaman} berhasil diperbarui.`)
    } else {
      const { error } = await supabase.from('threshold_tanaman').insert(payload)
      if (error) {
        if (error.code === '23505') showToast('error', `Tanaman ${form.nama_tanaman} sudah ada.`)
        else showToast('error', `Gagal menambah: ${error.message}`)
      } else {
        showToast('success', `Threshold ${form.nama_tanaman} berhasil ditambahkan.`)
      }
    }

    setSaving(false)
    setShowForm(false)
    fetchData()
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FlaskConical className="size-5 text-agri-green" /> Threshold Tanaman
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola threshold parameter agroklimat per tanaman berbasis Oldeman (1975) &amp; Ritung et al. (2011).
          </p>
        </div>
        {!showForm && (
          <Button
            onClick={() => { setEditing(null); setForm({ ...emptyForm }); setShowForm(true) }}
            className="bg-agri-green hover:bg-agri-green-dark text-white font-semibold"
          >
            + Tambah Tanaman
          </Button>
        )}
      </div>

      {/* Info referensi */}
      <div className="flex gap-2 p-3 rounded-xl border border-blue-200 bg-blue-50 text-xs text-blue-800">
        <Info className="size-4 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Referensi threshold:</span>{' '}
          Oldeman (1975) untuk klasifikasi CH (BB/BL/BK);
          Ritung et al. (2011) untuk suhu, RH, KAT;
          Allen et al. (1998) FAO-56 Table 11 untuk fase &amp; durasi tumbuh.
          Pola CH diisi dengan format: <code className="bg-blue-100 px-1 rounded">BB,BB,BL,BL,BK</code>
        </div>
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

      {/* Form Edit */}
      {showForm && (
        <Card className="shadow-sm border-agri-green/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  {editing ? `Edit Threshold: ${editing.nama_tanaman}` : 'Tambah Threshold Tanaman'}
                </CardTitle>
                <CardDescription>Isi parameter threshold kesesuaian lahan per kelas S1/S2/S3.</CardDescription>
              </div>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground" aria-label="Tutup">
                <X className="size-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-5">

              {/* Identitas */}
              <fieldset className="space-y-3">
                <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Identitas Tanaman</legend>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <NInput name="nama_tanaman" label="Nama Tanaman" value={form.nama_tanaman} onChange={handleChange} type="text" required disabled={!!editing} />
                  <NInput name="total_hari" label="Total Hari" value={form.total_hari} onChange={handleChange} type="number" />
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Pola CH (Oldeman)</label>
                    <input
                      name="pola_ch"
                      type="text"
                      value={form.pola_ch}
                      onChange={handlePolaChange}
                      placeholder="BB,BB,BL,BL,BK"
                      required
                      className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm font-mono outline-none focus-visible:border-agri-green focus-visible:ring-2 focus-visible:ring-agri-green/20"
                    />
                    {form.pola_ch && (
                      <div className="flex gap-1 flex-wrap pt-0.5">
                        {form.pola_ch.split(',').map((p, i) => {
                          const cls = p.trim()
                          return (
                            <span key={i} className={`inline-block px-1.5 py-0.5 rounded border text-xs font-semibold ${
                              cls === 'BB' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                              cls === 'BL' ? 'bg-green-100 text-green-700 border-green-200' :
                              cls === 'BK' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-muted'
                            }`}>
                              Bln{i + 1}: {cls}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </fieldset>

              {/* Threshold Suhu */}
              <fieldset className="space-y-3">
                <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                   Threshold Suhu (°C) — Ritung et al. 2011
                </legend>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <ThresholdRow label="S1" minName="suhu_s1_min" maxName="suhu_s1_max" minVal={form.suhu_s1_min} maxVal={form.suhu_s1_max} onChange={handleChange} color="green" />
                  <ThresholdRow label="S2" minName="suhu_s2_min" maxName="suhu_s2_max" minVal={form.suhu_s2_min} maxVal={form.suhu_s2_max} onChange={handleChange} color="blue" />
                  <ThresholdRow label="S3" minName="suhu_s3_min" maxName="suhu_s3_max" minVal={form.suhu_s3_min} maxVal={form.suhu_s3_max} onChange={handleChange} color="amber" />
                </div>
              </fieldset>

              {/* Threshold RH */}
              <fieldset className="space-y-3">
                <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                   Threshold Kelembaban RH (%) — Ritung et al. 2011
                </legend>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <ThresholdRow label="S1" minName="rh_s1_min" maxName="rh_s1_max" minVal={form.rh_s1_min} maxVal={form.rh_s1_max} onChange={handleChange} color="green" />
                  <ThresholdRow label="S2" minName="rh_s2_min" maxName="rh_s2_max" minVal={form.rh_s2_min} maxVal={form.rh_s2_max} onChange={handleChange} color="blue" />
                  <ThresholdRow label="S3" minName="rh_s3_min" maxName="rh_s3_max" minVal={form.rh_s3_min} maxVal={form.rh_s3_max} onChange={handleChange} color="amber" />
                </div>
              </fieldset>

              {/* Threshold KAT */}
              <fieldset className="space-y-3">
                <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                   Threshold KAT min (%) — Ritung et al. 2011
                </legend>
                <div className="grid grid-cols-3 gap-3">
                  <NInput name="kat_s1_min" label="KAT min S1" value={form.kat_s1_min} onChange={handleChange} type="number" />
                  <NInput name="kat_s2_min" label="KAT min S2" value={form.kat_s2_min} onChange={handleChange} type="number" />
                  <NInput name="kat_s3_min" label="KAT min S3" value={form.kat_s3_min} onChange={handleChange} type="number" />
                </div>
              </fieldset>

              {/* Referensi */}
              <fieldset>
                <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Referensi</legend>
                <textarea
                  name="referensi"
                  value={form.referensi ?? ''}
                  onChange={handleChange}
                  rows={2}
                   placeholder="Ritung et al. 2011 hal.xx; FAO-56 Table 11; Oldeman 1975"
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-agri-green focus-visible:ring-2 focus-visible:ring-agri-green/20 resize-none"
                />
              </fieldset>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saving} className="bg-agri-green hover:bg-agri-green-dark text-white font-semibold">
                  {saving
                    ? <><Loader2 className="size-4 mr-2 animate-spin" />Menyimpan...</>
                    : <><CheckCircle2 className="size-4 mr-2" />{editing ? 'Perbarui' : 'Simpan'} Threshold</>}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List Tanaman */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="pt-10 pb-10 text-center">
            <FlaskConical className="size-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium">Belum ada threshold tanaman</p>
            <p className="text-xs text-muted-foreground mt-1">Jalankan SQL seed data di Supabase, atau tambah manual.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {data.map((item) => {
            const pola = item.pola_ch.split(',').map(s => s.trim())
            const isExpanded = expanded === item.id
            return (
              <div key={item.id} className="rounded-xl border border-border bg-white overflow-hidden">
                {/* Row header */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{item.nama_tanaman}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.total_hari} hari &bull; {item.total_bulan} bulan</p>
                  </div>

                  {/* Pola CH chips */}
                  <div className="hidden sm:flex items-center gap-1 flex-wrap">
                    {pola.map((p, i) => (
                      <span key={i} className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-semibold ${
                        p === 'BB' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        p === 'BL' ? 'bg-green-100 text-green-700 border-green-200' :
                        'bg-amber-100 text-amber-700 border-amber-200'
                      }`}>
                        {p}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setExpanded(isExpanded ? null : item.id!)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      aria-label="Detail"
                    >
                      {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </button>
                    <button
                      onClick={() => openEdit(item)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-agri-green hover:bg-agri-green-light transition-colors"
                      aria-label="Edit"
                    >
                      <Pencil className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/30 px-4 py-4 space-y-4">

                    {/* Pola CH per bulan */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Pola CH Oldeman per Bulan Tumbuh:</p>
                      <div className="flex gap-2 flex-wrap">
                        {pola.map((p, i) => (
                          <div key={i} className="text-center">
                            <p className="text-[10px] text-muted-foreground">Bln {i + 1}</p>
                            <span className={`inline-block px-2 py-1 rounded-lg border text-xs font-bold ${
                              p === 'BB' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                              p === 'BL' ? 'bg-green-100 text-green-700 border-green-200' :
                              'bg-amber-100 text-amber-700 border-amber-200'
                            }`}>
                              {p}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Threshold tabel */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-muted-foreground">
                            <th className="text-left pb-2 font-semibold">Parameter</th>
                            {(['S1','S2','S3'] as const).map(k => (
                              <th key={k} className="text-center pb-2">
                                <span className={`inline-block px-2 py-0.5 rounded border font-bold ${
                                  KELAS_COLORS[k]
                                }`}>{k}</span>
                              </th>
                            ))}
                            <th className="text-center pb-2">
                              <span className={`inline-block px-2 py-0.5 rounded border font-bold ${KELAS_COLORS.N}`}>N</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          <tr>
                            <td className="py-1.5 font-medium text-foreground">Suhu (°C)</td>
                            <td className="py-1.5 text-center">{item.suhu_s1_min}–{item.suhu_s1_max}</td>
                            <td className="py-1.5 text-center">{item.suhu_s2_min}–{item.suhu_s2_max}</td>
                            <td className="py-1.5 text-center">{item.suhu_s3_min}–{item.suhu_s3_max}</td>
                            <td className="py-1.5 text-center">&lt;{item.suhu_s3_min}</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 font-medium text-foreground">RH (%)</td>
                            <td className="py-1.5 text-center">{item.rh_s1_min}–{item.rh_s1_max}</td>
                            <td className="py-1.5 text-center">{item.rh_s2_min}–{item.rh_s2_max}</td>
                            <td className="py-1.5 text-center">{item.rh_s3_min}–{item.rh_s3_max}</td>
                            <td className="py-1.5 text-center">&lt;{item.rh_s3_min}</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 font-medium text-foreground">KAT min (%)</td>
                            <td className="py-1.5 text-center">&gt;{item.kat_s1_min}</td>
                            <td className="py-1.5 text-center">&gt;{item.kat_s2_min}</td>
                            <td className="py-1.5 text-center">&gt;{item.kat_s3_min}</td>
                            <td className="py-1.5 text-center">&lt;{item.kat_s3_min}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {item.referensi && (
                      <p className="text-[11px] text-muted-foreground italic border-t border-border pt-2">
                        Ref: {item.referensi}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Helper Components ────────────────────────────────────────

function NInput({ name, label, value, onChange, type, required, disabled }: {
  name: string; label: string; value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type: string; required?: boolean; disabled?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium">{label}</label>
      <input
        id={name} name={name} type={type} step="0.01" min="0"
        value={value} onChange={onChange} required={required} disabled={disabled}
        className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-agri-green focus-visible:ring-2 focus-visible:ring-agri-green/20 disabled:opacity-60 disabled:cursor-not-allowed"
      />
    </div>
  )
}

function ThresholdRow({ label, minName, maxName, minVal, maxVal, onChange, color }: {
  label: string
  minName: string; maxName: string
  minVal: number; maxVal: number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  color: 'green' | 'blue' | 'amber'
}) {
  const colorClass = {
    green: 'text-green-700 bg-green-50 border-green-200',
    blue:  'text-blue-700 bg-blue-50 border-blue-200',
    amber: 'text-amber-700 bg-amber-50 border-amber-200',
  }[color]

  return (
    <div className={`rounded-lg border p-3 space-y-2 ${colorClass}`}>
      <p className="text-xs font-bold">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-medium opacity-70">Min</label>
          <input
            name={minName} type="number" step="0.1" min="0"
            value={minVal} onChange={onChange}
            className="w-full h-8 rounded-md border border-current/20 bg-white/80 px-2 text-sm outline-none focus-visible:border-current focus-visible:ring-1"
          />
        </div>
        <div>
          <label className="text-[10px] font-medium opacity-70">Max</label>
          <input
            name={maxName} type="number" step="0.1" min="0"
            value={maxVal} onChange={onChange}
            className="w-full h-8 rounded-md border border-current/20 bg-white/80 px-2 text-sm outline-none focus-visible:border-current focus-visible:ring-1"
          />
        </div>
      </div>
    </div>
  )
}
