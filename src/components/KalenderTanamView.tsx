import { useState } from 'react'
import { useKalenderTanam, useTahunPrediksi } from '@/hooks/useKalenderTanam'
import {
  LABEL_USER_TEKS,
  LABEL_USER_COLOR,
  type HasilKalenderTanam,
  type LabelUser,
} from '@/lib/kalenderTanam'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Info, AlertTriangle, X, Sprout, CloudRain, Thermometer, Droplets, Layers } from 'lucide-react'

const BULAN_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des']
const BULAN_FULL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const LABEL_SIMBOL: Record<LabelUser, string> = {
  cocok: '\u2713', // ✓
  cukup: '~',
  tidak: '\u00d7', // ×
}

const OLDEMAN_BADGE: Record<string, string> = {
  BB: 'bg-blue-100 text-blue-700 border-blue-200',
  BL: 'bg-green-100 text-green-700 border-green-200',
  BK: 'bg-amber-100 text-amber-700 border-amber-200',
}

interface Props {
  defaultYear?: number
}

export function KalenderTanamView({ defaultYear }: Props) {
  const tahunList = useTahunPrediksi()
  const currentYear = new Date().getFullYear()
  const [tahun, setTahun] = useState<number>(defaultYear ?? currentYear)
  const { hasil, iklim, loading, error } = useKalenderTanam(tahun)
  const [detailCell, setDetailCell] = useState<HasilKalenderTanam | null>(null)

  const adaData = iklim.length > 0
  const namaTanaman = Array.from(hasil.keys())

  // Tahun yang ditampilkan di selector (gabungan available + current)
  const yearOptions = tahunList.length > 0 ? tahunList : [currentYear]

  return (
    <Card className="shadow-sm overflow-hidden">
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-agri-green/10 flex items-center justify-center">
              <Calendar className="size-4 text-agri-green" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">Kalender Tanam</CardTitle>
              <p className="text-xs text-muted-foreground">
                Berdasarkan prediksi iklim BMKG &middot; Oldeman (1975) &amp; Ritung et al. (2011)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Year selector */}
            <select
              value={tahun}
              onChange={(e) => setTahun(parseInt(e.target.value))}
              className="h-8 rounded-lg border border-input bg-white px-2 text-xs font-medium outline-none focus-visible:border-agri-green"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            {/* Legend */}
            <div className="flex items-center gap-3 flex-wrap">
              {(['cocok', 'cukup', 'tidak'] as LabelUser[]).map((label) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className={`size-3 rounded-sm ${LABEL_USER_COLOR[label]}`} />
                  <span className="text-xs text-muted-foreground">{LABEL_USER_TEKS[label]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Error */}
      {error && (
        <div className="mx-5 mb-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertTriangle className="size-3.5 shrink-0" />
          <span>Gagal memuat data: {error}</span>
        </div>
      )}

      {/* Belum ada data prediksi */}
      {!loading && !adaData && (
        <div className="mx-5 mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-800">
          <AlertTriangle className="size-4 shrink-0" />
          <span>
            Belum ada data prediksi iklim untuk tahun {tahun}. Admin perlu mengisi data prediksi BMKG
            di menu <strong>Prediksi BMKG</strong> terlebih dahulu.
          </span>
        </div>
      )}

      <CardContent className="px-0 pb-0 overflow-x-auto">
        {loading ? (
          <div className="space-y-2 px-5 pb-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <table className="w-full min-w-[680px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-2.5 w-40">
                  Tanaman
                </th>
                {BULAN_SHORT.map((b) => (
                  <th key={b} className="text-center text-xs font-semibold py-2.5 px-1 w-10 text-muted-foreground">
                    {b}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {namaTanaman.map((nama, rowIdx) => {
                const bulanMap = hasil.get(nama)!
                const contoh = bulanMap.get(1)
                return (
                  <tr
                    key={nama}
                    className={`border-b border-border/50 ${rowIdx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                  >
                    <td className="px-5 py-2.5">
                      <p className="text-sm font-semibold text-foreground">{nama}</p>
                      {contoh && (
                        <p className="text-xs text-muted-foreground">
                          {contoh.tanaman.totalBulan} bln &middot; {contoh.tanaman.totalHari} hari
                        </p>
                      )}
                    </td>
                    {BULAN_SHORT.map((_, i) => {
                      const bulan = i + 1
                      const h = bulanMap.get(bulan)
                      if (!h) return <td key={i} />

                      const adaDataBulan = adaData && h.dataLengkap
                      const label = h.labelUser

                      return (
                        <td key={i} className="px-0.5 py-1.5 text-center">
                          <button
                            disabled={!adaDataBulan}
                            onClick={() => setDetailCell(h)}
                            className={`relative mx-auto size-8 rounded-lg flex items-center justify-center transition-all ${
                              adaDataBulan
                                ? `${LABEL_USER_COLOR[label]} cursor-pointer hover:scale-110 hover:shadow-sm`
                                : 'bg-muted text-muted-foreground/30 cursor-not-allowed'
                            }`}
                            title={
                              adaDataBulan
                                ? `${nama} tanam ${BULAN_FULL[i]}: ${LABEL_USER_TEKS[label]}`
                                : `${nama} tanam ${BULAN_FULL[i]}: data belum tersedia`
                            }
                          >
                            <span className="text-[10px] font-bold">
                              {adaDataBulan ? LABEL_SIMBOL[label] : '-'}
                            </span>
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </CardContent>

      {/* Catatan metode & validasi */}
      <div className="px-5 py-4 border-t border-border bg-muted/20 space-y-2">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          <Info className="inline size-3 mr-1 -mt-0.5" />
          Klik sel berwarna untuk melihat detail per fase tumbuh beserta nilai Certainty Factor (CF).
          Sistem menggunakan metode Sistem Pakar Forward Chaining + Certainty Factor (Shortliffe &amp;
          Buchanan, 1975) dengan basis aturan threshold Oldeman (1975), Ritung et al. (2011), dan FAO-56.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <div className="flex items-center gap-1.5 rounded-lg bg-agri-green/10 px-3 py-1.5 border border-agri-green/20">
            <span className="text-[10px] font-bold text-agri-green-dark uppercase tracking-wide">Validasi Sistem</span>
          </div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-agri-green" />
            <span>Padi Sawah: Presisi 100%, F1=0.635 (KSA BPS 2021–2024)</span>
          </div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-agri-green" />
            <span>Cabai Keriting: F1=0.966 &bull; Cabai Rawit: F1=0.874</span>
          </div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-amber-400" />
            <span>Tomat: F1=0.605 (suhu S1 18–26°C, Demak avg 27°C = S2)</span>
          </div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-full bg-agri-blue" />
            <span>Sumber data validasi: BPS Demak Statistik Hortikultura 2020–2024 &amp; KSA Padi</span>
          </div>
        </div>
      </div>

      {/* Modal detail per fase */}
      {detailCell && (
        <DetailModal hasil={detailCell} onClose={() => setDetailCell(null)} />
      )}
    </Card>
  )
}

// ─── Modal Detail Per Fase ────────────────────────────────────────────────────

function DetailModal({ hasil, onClose }: { hasil: HasilKalenderTanam; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <Card className="w-full max-w-2xl shadow-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="pb-3 sticky top-0 bg-white z-10 border-b border-border">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-agri-green/10 flex items-center justify-center">
                <Sprout className="size-5 text-agri-green" />
              </div>
              <div>
                <CardTitle className="text-base">{hasil.tanaman.nama}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tanam {BULAN_FULL[hasil.bulanTanam - 1]} {hasil.tahunTanam} &rarr;
                  Panen {BULAN_FULL[hasil.bulanPanen - 1]} {hasil.tahunPanen}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Tutup">
              <X className="size-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">

          {/* Kesimpulan */}
          <div className={`rounded-xl p-4 ${LABEL_USER_COLOR[hasil.labelUser]}`}>
            <p className="text-xs uppercase tracking-wide opacity-80 font-semibold">Kesimpulan Sistem Pakar</p>
            <div className="flex items-baseline gap-2">
              <p className="text-lg font-bold">{LABEL_USER_TEKS[hasil.labelUser]}</p>
              <p className="text-sm font-semibold opacity-90">
                CF = {hasil.cfTotal.toFixed(3)} ({hasil.persenKeyakinan}%)
              </p>
            </div>
            <p className="text-xs mt-1 opacity-90">
              Nilai Certainty Factor dihitung dari kombinasi keyakinan tiap parameter
              di seluruh fase tumbuh (metode MYCIN).
            </p>
          </div>

          {/* Zona Oldeman */}
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold">Zona Oldeman:</span> {hasil.tanaman.zonaOldeman}
          </div>

          {/* Tabel fase */}
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Fase / Bulan</th>
                  <th className="text-center px-2 py-2 font-semibold text-muted-foreground">
                    <CloudRain className="size-3.5 inline text-blue-500" /> CH
                  </th>
                  <th className="text-center px-2 py-2 font-semibold text-muted-foreground">
                    <Thermometer className="size-3.5 inline text-orange-500" /> Suhu
                  </th>
                  <th className="text-center px-2 py-2 font-semibold text-muted-foreground">
                    <Droplets className="size-3.5 inline text-agri-green" /> RH
                  </th>
                  <th className="text-center px-2 py-2 font-semibold text-muted-foreground">
                    <Layers className="size-3.5 inline text-purple-500" /> KAT
                  </th>
                  <th className="text-center px-2 py-2 font-semibold text-muted-foreground">CF Fase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {hasil.detail.map((d, idx) => (
                  <tr key={idx} className={d.dataAda ? '' : 'opacity-50'}>
                    <td className="px-3 py-2">
                      <p className="font-medium text-foreground">{BULAN_SHORT[d.bulanKalender - 1]} {d.tahun}</p>
                      <p className="text-[10px] text-muted-foreground">{d.namaFase}</p>
                    </td>
                    <td className="px-2 py-2 text-center">
                      {d.dataAda ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-semibold ${OLDEMAN_BADGE[d.oldemanAktual]}`}>
                            {d.oldemanAktual}
                          </span>
                          <span className="text-[9px] text-muted-foreground">butuh {d.chButuh}</span>
                          <span className="text-[9px] font-mono text-foreground">{d.cfCh >= 0 ? '+' : ''}{d.cfCh.toFixed(2)}</span>
                        </div>
                      ) : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {d.dataAda ? (
                        <span className="text-[10px] font-mono text-foreground">{d.cfSuhu >= 0 ? '+' : ''}{d.cfSuhu.toFixed(2)}</span>
                      ) : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {d.dataAda ? (
                        <span className="text-[10px] font-mono text-foreground">{d.cfRh >= 0 ? '+' : ''}{d.cfRh.toFixed(2)}</span>
                      ) : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {d.dataAda ? (
                        <span className="text-[10px] font-mono text-foreground">{d.cfKat >= 0 ? '+' : ''}{d.cfKat.toFixed(2)}</span>
                      ) : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {d.dataAda ? (
                        <span className="inline-block px-2 py-0.5 rounded-md border border-agri-green/30 bg-agri-green/5 text-[10px] font-bold text-agri-green-dark">
                          {d.cfFase.toFixed(3)}
                        </span>
                      ) : <span className="text-muted-foreground">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Referensi */}
          <p className="text-[10px] text-muted-foreground italic border-t border-border pt-3">
            Ref: {hasil.tanaman.referensi}. Metode inferensi: Forward Chaining + Certainty Factor
            (Shortliffe &amp; Buchanan, 1975).
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
