import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { CfRuleSetting } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Gauge, Loader2, CheckCircle2, AlertCircle, Info, RotateCcw,
  CloudRain, Thermometer, Droplets, Layers
} from 'lucide-react'

type ToastType = { type: 'success' | 'error'; message: string } | null

const PARAM_META: Record<string, { label: string; icon: typeof CloudRain; color: string }> = {
  ch:   { label: 'Curah Hujan (CH)',           icon: CloudRain,   color: 'text-blue-500' },
  suhu: { label: 'Suhu',                        icon: Thermometer, color: 'text-orange-500' },
  rh:   { label: 'Kelembaban (RH)',             icon: Droplets,    color: 'text-agri-green' },
  kat:  { label: 'Ketersediaan Air Tanah (KAT)',icon: Layers,      color: 'text-purple-500' },
}

const URUTAN = ['ch', 'suhu', 'rh', 'kat']

// Nilai default literatur (fallback bila tabel kosong)
const DEFAULT_VALUES: Record<string, { cf: number; ket: string }> = {
  ch:   { cf: 0.90, ket: 'Curah hujan - faktor air paling kritis (Oldeman 1975; Ritung et al. 2011)' },
  suhu: { cf: 0.80, ket: 'Suhu - kritis untuk fotosintesis & metabolisme' },
  rh:   { cf: 0.70, ket: 'Kelembaban - memengaruhi OPT & transpirasi' },
  kat:  { cf: 0.60, ket: 'Ketersediaan air tanah - faktor pendukung' },
}

// Skala konversi keyakinan pakar (untuk panduan input)
const SKALA_PAKAR = [
  { teks: 'Pasti', cf: 1.0 },
  { teks: 'Hampir pasti', cf: 0.8 },
  { teks: 'Kemungkinan besar', cf: 0.6 },
  { teks: 'Mungkin', cf: 0.4 },
  { teks: 'Ragu-ragu', cf: 0.2 },
]

export default function AdminCertaintyFactor() {
  const [rows, setRows] = useState<CfRuleSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<ToastType>(null)

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  async function fetchData() {
    setLoading(true)
    const { data, error } = await supabase.from('cf_rule').select('*')
    if (error) {
      showToast('error', `Gagal memuat: ${error.message}`)
      setLoading(false)
      return
    }

    // Susun sesuai urutan parameter; jika belum ada di DB, pakai default
    const byParam: Record<string, CfRuleSetting> = {}
    for (const r of (data as CfRuleSetting[]) ?? []) byParam[r.parameter] = r

    const result: CfRuleSetting[] = URUTAN.map((p) =>
      byParam[p] ?? {
        parameter: p as CfRuleSetting['parameter'],
        cf_value: DEFAULT_VALUES[p].cf,
        keterangan: DEFAULT_VALUES[p].ket,
      }
    )
    setRows(result)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  function handleChange(parameter: string, value: number) {
    setRows((prev) =>
      prev.map((r) => (r.parameter === parameter ? { ...r, cf_value: value } : r))
    )
  }

  function resetDefault() {
    setRows((prev) =>
      prev.map((r) => ({ ...r, cf_value: DEFAULT_VALUES[r.parameter].cf }))
    )
  }

  async function handleSave() {
    // Validasi rentang 0-1
    for (const r of rows) {
      if (r.cf_value < 0 || r.cf_value > 1) {
        showToast('error', `Nilai CF ${PARAM_META[r.parameter].label} harus antara 0 dan 1.`)
        return
      }
    }

    setSaving(true)
    const payload = rows.map((r) => ({
      parameter: r.parameter,
      cf_value: r.cf_value,
      keterangan: r.keterangan ?? DEFAULT_VALUES[r.parameter].ket,
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from('cf_rule')
      .upsert(payload, { onConflict: 'parameter' })

    setSaving(false)
    if (error) showToast('error', `Gagal menyimpan: ${error.message}`)
    else showToast('success', 'Nilai Certainty Factor berhasil disimpan.')
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Gauge className="size-5 text-agri-green" /> Certainty Factor (CF)
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Atur nilai CF[rule] (keyakinan pakar) tiap parameter untuk mesin inferensi kalender tanam.
        </p>
      </div>

      {/* Info metode */}
      <div className="flex gap-2 p-3 rounded-xl border border-blue-200 bg-blue-50 text-xs text-blue-800">
        <Info className="size-4 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p>
            <span className="font-semibold">CF[rule]</span> adalah derajat keyakinan pakar terhadap
            pengaruh tiap parameter pada kesesuaian tanaman, bernilai 0&ndash;1. Nilai akhir CF tanaman
            dihitung dengan rumus Certainty Factor (Shortliffe &amp; Buchanan, 1975).
          </p>
          <p>
            Nilai awal bersifat <strong>sementara</strong> (dari literatur) dan sebaiknya divalidasi
            melalui wawancara pakar menggunakan skala: Pasti=1.0, Hampir pasti=0.8, Kemungkinan
            besar=0.6, Mungkin=0.4, Ragu=0.2.
          </p>
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

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Nilai CF per Parameter</CardTitle>
            <CardDescription>Geser slider atau ketik nilai 0&ndash;1.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {rows.map((r) => {
              const meta = PARAM_META[r.parameter]
              const Icon = meta.icon
              return (
                <div key={r.parameter} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`size-4 ${meta.color}`} />
                      <span className="text-sm font-medium text-foreground">{meta.label}</span>
                    </div>
                    <input
                      type="number"
                      min={0} max={1} step={0.05}
                      value={r.cf_value}
                      onChange={(e) => handleChange(r.parameter, parseFloat(e.target.value) || 0)}
                      className="w-20 h-9 rounded-lg border border-input bg-transparent px-2 text-sm text-center outline-none focus-visible:border-agri-green focus-visible:ring-2 focus-visible:ring-agri-green/20"
                    />
                  </div>
                  <input
                    type="range"
                    min={0} max={1} step={0.05}
                    value={r.cf_value}
                    onChange={(e) => handleChange(r.parameter, parseFloat(e.target.value))}
                    className="w-full accent-agri-green"
                  />
                  {r.keterangan && (
                    <p className="text-[11px] text-muted-foreground">{r.keterangan}</p>
                  )}
                </div>
              )
            })}

            <div className="flex gap-3 pt-2 border-t border-border">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-agri-green hover:bg-agri-green-dark text-white font-semibold"
              >
                {saving
                  ? <><Loader2 className="size-4 mr-2 animate-spin" />Menyimpan...</>
                  : <><CheckCircle2 className="size-4 mr-2" />Simpan Nilai CF</>}
              </Button>
              <Button type="button" variant="outline" onClick={resetDefault}>
                <RotateCcw className="size-4 mr-2" /> Reset ke Default
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabel skala pakar */}
      <Card className="bg-muted/30 border-dashed shadow-none">
        <CardContent className="pt-4 pb-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            Skala Konversi Keyakinan Pakar &rarr; Nilai CF
          </p>
          <div className="flex flex-wrap gap-2">
            {SKALA_PAKAR.map((s) => (
              <span key={s.teks} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-white text-xs">
                <span className="font-medium text-foreground">{s.teks}</span>
                <span className="font-mono text-agri-green-dark">{s.cf.toFixed(1)}</span>
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
