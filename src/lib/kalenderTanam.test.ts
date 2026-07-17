import { describe, it, expect } from 'vitest'
import {
  kombinasiCF,
  cfKeLabelUser,
  hitungKalenderTanam,
  buatIklimMap,
  type IklimBulan,
} from './kalenderTanam'
import { klasifikasiOldeman, THRESHOLD_TANAMAN } from './thresholdData'

// ─── Klasifikasi Oldeman ───────────────────────────────────────────────────────
describe('klasifikasiOldeman', () => {
  it('CH >= 200 -> BB (Bulan Basah)', () => {
    expect(klasifikasiOldeman(200)).toBe('BB')
    expect(klasifikasiOldeman(350)).toBe('BB')
  })
  it('100 <= CH < 200 -> BL (Bulan Lembab)', () => {
    expect(klasifikasiOldeman(100)).toBe('BL')
    expect(klasifikasiOldeman(199)).toBe('BL')
  })
  it('CH < 100 -> BK (Bulan Kering)', () => {
    expect(klasifikasiOldeman(99)).toBe('BK')
    expect(klasifikasiOldeman(0)).toBe('BK')
  })
})

// ─── Pemetaan CF ke label ───────────────────────────────────────────────────────
describe('cfKeLabelUser', () => {
  it('CF >= 0.70 -> cocok', () => {
    expect(cfKeLabelUser(0.70)).toBe('cocok')
    expect(cfKeLabelUser(1.0)).toBe('cocok')
  })
  it('0.40 <= CF < 0.70 -> cukup', () => {
    expect(cfKeLabelUser(0.40)).toBe('cukup')
    expect(cfKeLabelUser(0.69)).toBe('cukup')
  })
  it('CF < 0.40 -> tidak', () => {
    expect(cfKeLabelUser(0.39)).toBe('tidak')
    expect(cfKeLabelUser(-1)).toBe('tidak')
  })
})

// ─── Rumus kombinasi CF (MYCIN) ────────────────────────────────────────────────
describe('kombinasiCF (MYCIN)', () => {
  it('dua CF positif saling menguatkan', () => {
    // 0.5 + 0.5*(1-0.5) = 0.75
    expect(kombinasiCF(0.5, 0.5)).toBeCloseTo(0.75, 5)
  })
  it('dua CF negatif saling memperlemah', () => {
    // -0.5 + -0.5*(1+(-0.5)) = -0.75
    expect(kombinasiCF(-0.5, -0.5)).toBeCloseTo(-0.75, 5)
  })
  it('tanda berbeda saling meredam', () => {
    // (0.5 + -0.3) / (1 - 0.3) = 0.2/0.7
    expect(kombinasiCF(0.5, -0.3)).toBeCloseTo(0.2 / 0.7, 5)
  })
})

// ─── Helper buat data iklim 12 bulan ────────────────────────────────────────────
function iklim12(tahun: number, override: Partial<Record<number, Partial<IklimBulan>>> = {}): IklimBulan[] {
  const base: IklimBulan[] = []
  for (let b = 1; b <= 12; b++) {
    base.push({
      bulan: b, tahun,
      ch_mm: 250, suhu: 27, kelembaban: 80, kat: 85,
      ...(override[b] ?? {}),
    })
  }
  return base
}

// ─── Engine inti: diskriminatif (regression test masalah "semua cocok") ─────────
describe('hitungKalenderTanam - diskriminasi CF', () => {
  const padi = THRESHOLD_TANAMAN.find(t => t.nama === 'Padi Sawah')!

  it('kondisi ideal padi (semua bulan BB, suhu/RH/KAT optimal) -> cocok, CF tinggi', () => {
    // Padi 4 bulan: fase 1-3 butuh BB, fase 4 (Llate) butuh BL.
    // Tanam Januari → fase Llate jatuh di April (bulan ke-4).
    const data = iklim12(2026, {
      4: { ch_mm: 150, suhu: 27, kelembaban: 80, kat: 85 }, // BL untuk pemasakan
    })
    const map = buatIklimMap(data)
    const hasil = hitungKalenderTanam(padi, 1, 2026, map)
    expect(hasil.labelUser).toBe('cocok')
    expect(hasil.cfTotal).toBeGreaterThanOrEqual(0.70)
  })

  it('padi di musim kering (CH rendah) -> tidak disarankan', () => {
    // Semua bulan kering (BK) -> CH butuh BB tidak terpenuhi -> N -> CF negatif
    const data = iklim12(2026, Object.fromEntries(
      Array.from({ length: 12 }, (_, i) => [i + 1, { ch_mm: 30 }])
    ))
    const map = buatIklimMap(data)
    const hasil = hitungKalenderTanam(padi, 6, 2026, map)
    expect(hasil.labelUser).toBe('tidak')
    expect(hasil.cfTotal).toBeLessThan(0.40)
  })

  it('hasil tidak selalu "cocok" - CF bervariasi antar kondisi', () => {
    const ideal = hitungKalenderTanam(padi, 1, 2026, buatIklimMap(iklim12(2026, {
      5: { ch_mm: 150 },
    })))
    const buruk = hitungKalenderTanam(padi, 6, 2026, buatIklimMap(iklim12(2026,
      Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, { ch_mm: 30 }]))
    )))
    // CF kondisi ideal harus jauh lebih tinggi dari kondisi buruk
    expect(ideal.cfTotal).toBeGreaterThan(buruk.cfTotal + 0.3)
  })
})

// ─── Hukum faktor pembatas (Liebig) antar fase ──────────────────────────────────
describe('hitungKalenderTanam - hukum faktor pembatas', () => {
  const padi = THRESHOLD_TANAMAN.find(t => t.nama === 'Padi Sawah')!

  it('satu fase buruk menurunkan CF total (CF total = fase terendah)', () => {
    // Semua bulan ideal kecuali bulan ke-3 dibuat sangat kering
    const data = iklim12(2026, {
      3: { ch_mm: 20, kat: 10 }, // fase ke-3 (Maret) jelek
      5: { ch_mm: 150 },
    })
    const hasil = hitungKalenderTanam(padi, 1, 2026, buatIklimMap(data))
    const cfTerendah = Math.min(...hasil.detail.filter(d => d.dataAda).map(d => d.cfFase))
    expect(hasil.cfTotal).toBeCloseTo(cfTerendah, 5)
  })
})

// ─── Data tidak lengkap ─────────────────────────────────────────────────────────
describe('hitungKalenderTanam - data tidak lengkap', () => {
  const cabaiRawit = THRESHOLD_TANAMAN.find(t => t.nama === 'Cabai Rawit')!

  it('menandai dataLengkap=false bila ada bulan tanpa data', () => {
    // Hanya isi bulan 1, sisanya kosong
    const map = buatIklimMap([{ bulan: 1, tahun: 2026, ch_mm: 150, suhu: 27, kelembaban: 70, kat: 65 }])
    const hasil = hitungKalenderTanam(cabaiRawit, 1, 2026, map)
    expect(hasil.dataLengkap).toBe(false)
  })
})
