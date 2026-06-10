import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { ClimateData } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Papa from 'papaparse'
import {
  CloudRain, Upload, Plus, CheckCircle2, AlertCircle,
  Loader2, FileText, Trash2, RefreshCw
} from 'lucide-react'

const BULAN_NAMES = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const CURRENT_YEAR = new Date().getFullYear()

const emptyForm: Omit<ClimateData, 'id' | 'created_at'> = {
  bulan: 1,
  tahun: CURRENT_YEAR,
  ch_mm: 0,
  suhu: 0,
  kelembaban: 0,
  air_tanah: 0,
}

type ToastType = { type: 'success' | 'error'; message: string } | null

export default function AdminIklim() {
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<ToastType>(null)
  const [csvRows, setCsvRows] = useState<ClimateData[]>([])
  const [csvError, setCsvError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<'manual' | 'csv'>('manual')
  const fileRef = useRef<HTMLInputElement>(null)

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: name === 'bulan' || name === 'tahun' ? parseInt(value) : parseFloat(value) || 0 }))
  }

  async function handleSubmitManual(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase
      .from('climate_data')
      .upsert(form, { onConflict: 'bulan,tahun' })

    setSaving(false)

    if (error) {
      showToast('error', `Gagal menyimpan: ${error.message}`)
    } else {
      showToast('success', `Data iklim ${BULAN_NAMES[form.bulan]} ${form.tahun} berhasil disimpan.`)
      setForm({ ...emptyForm })
    }
  }

  function handleCSVFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvError('')
    setCsvRows([])

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: ClimateData[] = []
        const errors: string[] = []

        results.data.forEach((row, idx) => {
          const bulan = parseInt(row.bulan)
          const tahun = parseInt(row.tahun)
          const ch_mm = parseFloat(row.ch_mm)
          const suhu = parseFloat(row.suhu)
          const kelembaban = parseFloat(row.kelembaban)
          const air_tanah = parseFloat(row.air_tanah)

          if (isNaN(bulan) || bulan < 1 || bulan > 12)
            errors.push(`Baris ${idx + 2}: kolom 'bulan' tidak valid (${row.bulan})`)
          else if (isNaN(tahun))
            errors.push(`Baris ${idx + 2}: kolom 'tahun' tidak valid`)
          else if (isNaN(ch_mm) || isNaN(suhu) || isNaN(kelembaban) || isNaN(air_tanah))
            errors.push(`Baris ${idx + 2}: ada kolom angka yang tidak valid`)
          else
            rows.push({ bulan, tahun, ch_mm, suhu, kelembaban, air_tanah })
        })

        if (errors.length > 0) {
          setCsvError(errors.slice(0, 5).join('\n') + (errors.length > 5 ? `\n... dan ${errors.length - 5} error lainnya` : ''))
        }
        setCsvRows(rows)
      },
      error: () => {
        setCsvError('File tidak bisa dibaca. Pastikan format CSV sesuai.')
      },
    })
  }

  async function handleUploadCSV() {
    if (csvRows.length === 0) return
    setUploading(true)

    const { error } = await supabase
      .from('climate_data')
      .upsert(csvRows, { onConflict: 'bulan,tahun' })

    setUploading(false)

    if (error) {
      showToast('error', `Gagal upload: ${error.message}`)
    } else {
      showToast('success', `${csvRows.length} data iklim berhasil diupload.`)
      setCsvRows([])
      setCsvError('')
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function clearCSV() {
    setCsvRows([])
    setCsvError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <CloudRain className="size-5 text-agri-blue" />
          Input Data Iklim
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tambah atau perbarui data iklim bulanan. Data duplikat (bulan + tahun sama) akan otomatis diperbarui.
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

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'manual'
              ? 'bg-white text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-2">
            <Plus className="size-3.5" /> Input Manual
          </span>
        </button>
        <button
          onClick={() => setActiveTab('csv')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'csv'
              ? 'bg-white text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-2">
            <Upload className="size-3.5" /> Upload CSV
          </span>
        </button>
      </div>

      {/* Tab: Manual */}
      {activeTab === 'manual' && (
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Input Manual Per Bulan</CardTitle>
            <CardDescription>Isi data iklim untuk satu bulan tertentu.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitManual} className="space-y-5">
              {/* Bulan + Tahun */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Bulan</label>
                  <select
                    name="bulan"
                    value={form.bulan}
                    onChange={handleFormChange}
                    required
                    className="w-full h-10 rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:border-agri-green focus-visible:ring-2 focus-visible:ring-agri-green/20"
                  >
                    {BULAN_NAMES.slice(1).map((name, idx) => (
                      <option key={idx + 1} value={idx + 1}>{name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Tahun</label>
                  <input
                    type="number"
                    name="tahun"
                    value={form.tahun}
                    onChange={handleFormChange}
                    min={2000}
                    max={2100}
                    required
                    className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-agri-green focus-visible:ring-2 focus-visible:ring-agri-green/20"
                  />
                </div>
              </div>

              {/* Parameter fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  name="ch_mm"
                  label="Curah Hujan"
                  unit="mm/bulan"
                  value={form.ch_mm}
                  onChange={handleFormChange}
                  hint="Contoh: 150.5"
                />
                <FormField
                  name="suhu"
                  label="Suhu Rata-rata"
                  unit="°C"
                  value={form.suhu}
                  onChange={handleFormChange}
                  hint="Contoh: 27.3"
                />
                <FormField
                  name="kelembaban"
                  label="Kelembaban Udara"
                  unit="%"
                  value={form.kelembaban}
                  onChange={handleFormChange}
                  hint="Contoh: 78"
                />
                <FormField
                  name="air_tanah"
                  label="Ketersediaan Air Tanah"
                  unit="mm/hari"
                  value={form.air_tanah}
                  onChange={handleFormChange}
                  hint="Contoh: 3.2"
                />
              </div>

              <Button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto bg-agri-green hover:bg-agri-green-dark text-white font-semibold"
              >
                {saving ? (
                  <><Loader2 className="size-4 mr-2 animate-spin" /> Menyimpan...</>
                ) : (
                  <><Plus className="size-4 mr-2" /> Simpan Data Iklim</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab: CSV */}
      {activeTab === 'csv' && (
        <div className="space-y-4">
          {/* Format info */}
          <Card className="border-agri-blue/30 bg-agri-blue/5 shadow-none">
            <CardContent className="pt-4 pb-4">
              <div className="flex gap-3">
                <FileText className="size-4 text-agri-blue mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">Format CSV yang dibutuhkan</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    File harus memiliki header di baris pertama dengan kolom berikut (tanpa spasi):
                  </p>
                  <code className="block bg-white border border-border rounded-md px-3 py-2 text-xs font-mono text-foreground">
                    bulan,tahun,ch_mm,suhu,kelembaban,air_tanah
                  </code>
                  <p className="text-xs text-muted-foreground mt-2">
                    Contoh baris data: <code className="bg-white px-1 rounded">1,2025,250.5,27.3,82,3.5</code>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload area */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Upload File CSV</CardTitle>
              <CardDescription>Data duplikat (bulan + tahun sama) akan diperbarui secara otomatis.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Drop area */}
              <label
                htmlFor="csv-upload"
                className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-agri-green/50 hover:bg-agri-green-light/30 transition-all"
              >
                <div className="size-12 rounded-full bg-agri-green/10 flex items-center justify-center">
                  <Upload className="size-5 text-agri-green" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Klik untuk pilih file CSV</p>
                  <p className="text-xs text-muted-foreground mt-1">Format: .csv, ukuran maks. 5MB</p>
                </div>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleCSVFile}
                  ref={fileRef}
                  className="sr-only"
                />
              </label>

              {/* CSV Errors */}
              {csvError && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4">
                  <p className="text-sm font-semibold text-destructive mb-1">Ditemukan error pada CSV:</p>
                  <pre className="text-xs text-destructive whitespace-pre-wrap">{csvError}</pre>
                </div>
              )}

              {/* Preview table */}
              {csvRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-agri-green/10 text-agri-green-dark border-agri-green/20">
                        {csvRows.length} baris siap diupload
                      </Badge>
                      {csvError && (
                        <Badge variant="destructive" className="text-xs">
                          Ada baris yang dilewati
                        </Badge>
                      )}
                    </div>
                    <button
                      onClick={clearCSV}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="size-3" /> Hapus
                    </button>
                  </div>

                  {/* Table preview */}
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted border-b border-border">
                          {['Bulan', 'Tahun', 'CH (mm)', 'Suhu (\u00b0C)', 'Kelembaban (%)', 'Air Tanah (mm/hr)'].map(h => (
                            <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvRows.slice(0, 10).map((row, idx) => (
                          <tr key={idx} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="px-3 py-2">{BULAN_NAMES[row.bulan]}</td>
                            <td className="px-3 py-2">{row.tahun}</td>
                            <td className="px-3 py-2">{row.ch_mm}</td>
                            <td className="px-3 py-2">{row.suhu}</td>
                            <td className="px-3 py-2">{row.kelembaban}</td>
                            <td className="px-3 py-2">{row.air_tanah}</td>
                          </tr>
                        ))}
                        {csvRows.length > 10 && (
                          <tr>
                            <td colSpan={6} className="px-3 py-2 text-center text-xs text-muted-foreground">
                              ... dan {csvRows.length - 10} baris lainnya
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <Button
                    onClick={handleUploadCSV}
                    disabled={uploading}
                    className="w-full sm:w-auto bg-agri-green hover:bg-agri-green-dark text-white font-semibold"
                  >
                    {uploading ? (
                      <><Loader2 className="size-4 mr-2 animate-spin" /> Mengupload {csvRows.length} baris...</>
                    ) : (
                      <><RefreshCw className="size-4 mr-2" /> Upload {csvRows.length} Data Iklim</>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// ─── Reusable FormField component ──────────────────────────────────────────
interface FormFieldProps {
  name: string
  label: string
  unit: string
  value: number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  hint?: string
}

function FormField({ name, label, unit, value, onChange, hint }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
        <span className="ml-1 text-muted-foreground font-normal">({unit})</span>
      </label>
      <input
        id={name}
        type="number"
        name={name}
        value={value === 0 ? '' : value}
        onChange={onChange}
        placeholder={hint}
        step="0.01"
        min="0"
        required
        className="w-full h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-agri-green focus-visible:ring-2 focus-visible:ring-agri-green/20 placeholder:text-muted-foreground"
      />
    </div>
  )
}
