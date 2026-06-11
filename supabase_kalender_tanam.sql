-- ============================================================
-- AgroDemak - Kalender Tanam Schema
-- Jalankan di Supabase SQL Editor
-- ============================================================
-- Tambahan tabel untuk fitur Kalender Tanam berbasis:
--   [1] Oldeman, L.R. 1975. An Agroclimatic Classification of
--       the Environments in Indonesia. CRIA, Bogor.
--   [2] Djaenudin et al. 2011. Petunjuk Teknis Evaluasi Lahan
--       Untuk Komoditas Pertanian. Edisi Revisi. Kementan.
--   [3] Allen et al. 1998. FAO Irrigation Drainage Paper No.56
--       Table 11 (Length of growth stages).
-- ============================================================

-- 1. PREDIKSI IKLIM BULANAN (dari BMKG)
--    Berbeda dengan climate_data (historis/aktual),
--    tabel ini khusus untuk data prediksi BMKG per bulan-tahun.
CREATE TABLE IF NOT EXISTS prediksi_iklim (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bulan        smallint NOT NULL CHECK (bulan BETWEEN 1 AND 12),
  tahun        smallint NOT NULL CHECK (tahun BETWEEN 2000 AND 2100),
  ch_mm        numeric(8,2) NOT NULL,   -- Prediksi CH (mm/bulan) dari BMKG
  suhu         numeric(5,2) NOT NULL,   -- Prediksi suhu rata-rata (C)
  kelembaban   numeric(5,2) NOT NULL,   -- Prediksi kelembaban relatif (%)
  kat          numeric(5,2),            -- Ketersediaan Air Tanah (% kapasitas lapang)
  sumber       text DEFAULT 'BMKG',     -- Sumber prediksi
  keterangan   text,                    -- Catatan tambahan
  created_at   timestamptz DEFAULT now(),
  UNIQUE (bulan, tahun)
);

-- 2. THRESHOLD TANAMAN (berbasis Oldeman + Djaenudin 2011)
--    Menyimpan threshold parameter agroklimat per tanaman
--    beserta pola CH Oldeman per fase tumbuh.
CREATE TABLE IF NOT EXISTS threshold_tanaman (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_tanaman     text NOT NULL UNIQUE,
  total_hari       smallint NOT NULL,        -- Total hari tumbuh (FAO-56 Table 11)
  total_bulan      smallint NOT NULL,        -- Konversi ke bulan
  pola_ch          text NOT NULL,            -- Pola CH Oldeman: "BB,BB,BB,BB,BL"
  -- Threshold Suhu (Djaenudin 2011)
  suhu_s1_min      numeric(5,2) NOT NULL,
  suhu_s1_max      numeric(5,2) NOT NULL,
  suhu_s2_min      numeric(5,2) NOT NULL,
  suhu_s2_max      numeric(5,2) NOT NULL,
  suhu_s3_min      numeric(5,2) NOT NULL,
  suhu_s3_max      numeric(5,2) NOT NULL,
  -- Threshold RH (Djaenudin 2011)
  rh_s1_min        numeric(5,2) NOT NULL,
  rh_s1_max        numeric(5,2) NOT NULL,
  rh_s2_min        numeric(5,2) NOT NULL,
  rh_s2_max        numeric(5,2) NOT NULL,
  rh_s3_min        numeric(5,2) NOT NULL,
  rh_s3_max        numeric(5,2) NOT NULL,
  -- Threshold KAT (Djaenudin 2011)
  kat_s1_min       numeric(5,2) NOT NULL,
  kat_s2_min       numeric(5,2) NOT NULL,
  kat_s3_min       numeric(5,2) NOT NULL,
  -- Referensi
  referensi        text,
  created_at       timestamptz DEFAULT now()
);

-- 3. HASIL KALENDER TANAM
--    Hasil kalkulasi kesesuaian tanam per bulan per tanaman
--    berdasarkan prediksi iklim BMKG.
CREATE TABLE IF NOT EXISTS kalender_tanam (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tahun            smallint NOT NULL,
  bulan_tanam      smallint NOT NULL CHECK (bulan_tanam BETWEEN 1 AND 12),
  nama_tanaman     text NOT NULL REFERENCES threshold_tanaman(nama_tanaman) ON DELETE CASCADE,
  kelas_akhir      text NOT NULL CHECK (kelas_akhir IN ('S1','S2','S3','N')),
  detail_per_bulan jsonb,   -- [{bulan, ch_aktual, oldeman, ch_butuh, kelas}, ...]
  bulan_panen      smallint CHECK (bulan_panen BETWEEN 1 AND 12),
  created_at       timestamptz DEFAULT now(),
  UNIQUE (tahun, bulan_tanam, nama_tanaman)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE prediksi_iklim    ENABLE ROW LEVEL SECURITY;
ALTER TABLE threshold_tanaman ENABLE ROW LEVEL SECURITY;
ALTER TABLE kalender_tanam    ENABLE ROW LEVEL SECURITY;

-- Public READ
DROP POLICY IF EXISTS "public_read_prediksi"    ON prediksi_iklim;
DROP POLICY IF EXISTS "public_read_threshold"   ON threshold_tanaman;
DROP POLICY IF EXISTS "public_read_kalender"    ON kalender_tanam;
CREATE POLICY "public_read_prediksi"    ON prediksi_iklim    FOR SELECT USING (true);
CREATE POLICY "public_read_threshold"   ON threshold_tanaman FOR SELECT USING (true);
CREATE POLICY "public_read_kalender"    ON kalender_tanam    FOR SELECT USING (true);

-- Admin WRITE
DROP POLICY IF EXISTS "admin_insert_prediksi"   ON prediksi_iklim;
DROP POLICY IF EXISTS "admin_update_prediksi"   ON prediksi_iklim;
DROP POLICY IF EXISTS "admin_delete_prediksi"   ON prediksi_iklim;
CREATE POLICY "admin_insert_prediksi"   ON prediksi_iklim    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_update_prediksi"   ON prediksi_iklim    FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "admin_delete_prediksi"   ON prediksi_iklim    FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "admin_insert_threshold"  ON threshold_tanaman;
DROP POLICY IF EXISTS "admin_update_threshold"  ON threshold_tanaman;
DROP POLICY IF EXISTS "admin_delete_threshold"  ON threshold_tanaman;
CREATE POLICY "admin_insert_threshold"  ON threshold_tanaman FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_update_threshold"  ON threshold_tanaman FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "admin_delete_threshold"  ON threshold_tanaman FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "admin_insert_kalender"   ON kalender_tanam;
DROP POLICY IF EXISTS "admin_update_kalender"   ON kalender_tanam;
DROP POLICY IF EXISTS "admin_delete_kalender"   ON kalender_tanam;
CREATE POLICY "admin_insert_kalender"   ON kalender_tanam    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_update_kalender"   ON kalender_tanam    FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "admin_delete_kalender"   ON kalender_tanam    FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- SEED DATA - Threshold 10 Tanaman
-- Referensi:
--   [1] Oldeman 1975: BB=>=200mm, BL=100-199mm, BK=<100mm
--   [2] Djaenudin et al. 2011 (halaman per tanaman)
--   [3] Allen et al. 1998, FAO-56 Table 11
-- ============================================================
INSERT INTO threshold_tanaman (
  nama_tanaman, total_hari, total_bulan, pola_ch,
  suhu_s1_min, suhu_s1_max, suhu_s2_min, suhu_s2_max, suhu_s3_min, suhu_s3_max,
  rh_s1_min, rh_s1_max, rh_s2_min, rh_s2_max, rh_s3_min, rh_s3_max,
  kat_s1_min, kat_s2_min, kat_s3_min,
  referensi
) VALUES
  (
    'Padi Sawah', 150, 5, 'BB,BB,BB,BB,BL',
    24, 29, 22, 32, 20, 35,
    70, 90, 60, 95, 50, 98,
    80, 70, 60,
    'Djaenudin et al. 2011 hal.11-12; FAO-56 Table 11; Oldeman 1975'
  ),
  (
    'Jagung', 140, 5, 'BL,BL,BL,BL,BK',
    21, 30, 18, 33, 15, 35,
    60, 80, 50, 85, 40, 90,
    60, 50, 40,
    'Djaenudin et al. 2011 hal.21-22; FAO-56 Table 11; Oldeman 1975'
  ),
  (
    'Kedelai', 85, 3, 'BL,BL,BK',
    22, 30, 20, 32, 18, 35,
    60, 80, 50, 85, 40, 90,
    60, 50, 40,
    'Djaenudin et al. 2011 hal.25-26; FAO-56 Table 11; Oldeman 1975'
  ),
  (
    'Bawang Merah', 210, 7, 'BL,BL,BL,BL,BL,BL,BK',
    25, 32, 22, 35, 20, 38,
    65, 80, 55, 85, 45, 90,
    60, 50, 40,
    'Djaenudin et al. 2011 hal.55-56; FAO-56 Table 11; Oldeman 1975'
  ),
  (
    'Semangka', 110, 4, 'BL,BK,BK,BK',
    25, 35, 22, 38, 20, 40,
    60, 75, 50, 80, 40, 85,
    50, 40, 30,
    'Djaenudin et al. 2011 hal.91-92; FAO-56 Table 11; Oldeman 1975'
  ),
  (
    'Cabai Keriting', 210, 7, 'BL,BL,BL,BL,BL,BL,BL',
    24, 30, 22, 32, 18, 35,
    65, 80, 55, 85, 45, 90,
    60, 50, 40,
    'Djaenudin et al. 2011 hal.61-62; FAO-56 Table 11; Oldeman 1975'
  ),
  (
    'Petsai/Sawi', 95, 3, 'BL,BL,BL',
    22, 32, 20, 35, 18, 38,
    70, 85, 60, 90, 50, 95,
    65, 55, 45,
    'Djaenudin et al. 2011 hal.73-74 (modif. var. dataran rendah); AVRDC 2005; FAO-56 Table 11; Oldeman 1975'
  ),
  (
    'Melon', 120, 4, 'BL,BK,BK,BK',
    25, 35, 22, 38, 20, 40,
    55, 75, 45, 80, 35, 85,
    50, 40, 30,
    'Djaenudin et al. 2011 hal.87-88; FAO-56 Table 11; Oldeman 1975'
  ),
  (
    'Cabai Rawit', 210, 7, 'BL,BL,BL,BL,BL,BL,BL',
    24, 30, 20, 32, 18, 35,
    65, 80, 55, 85, 45, 90,
    55, 45, 35,
    'Djaenudin et al. 2011 hal.63-64; FAO-56 Table 11; Oldeman 1975'
  ),
  (
    'Terung', 130, 4, 'BL,BL,BL,BK',
    22, 30, 20, 32, 18, 35,
    65, 80, 55, 85, 45, 90,
    55, 45, 35,
    'Djaenudin et al. 2011 hal.75-76; FAO-56 Table 11; Oldeman 1975'
  )
ON CONFLICT (nama_tanaman) DO NOTHING;

-- ============================================================
-- CF RULE - Nilai Certainty Factor per Parameter (keyakinan pakar)
-- Metode: Certainty Factor (Shortliffe & Buchanan, 1975)
-- Catatan: nilai awal bersifat sementara (dari bobot kepentingan
--          parameter pada literatur evaluasi lahan). WAJIB
--          divalidasi melalui wawancara pakar. Nilai dapat
--          diperbarui via admin panel tanpa mengubah kode.
-- ============================================================
CREATE TABLE IF NOT EXISTS cf_rule (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parameter   text NOT NULL UNIQUE CHECK (parameter IN ('ch','suhu','rh','kat')),
  cf_value    numeric(3,2) NOT NULL CHECK (cf_value >= 0 AND cf_value <= 1),
  keterangan  text,
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE cf_rule ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_cf_rule"  ON cf_rule;
DROP POLICY IF EXISTS "admin_update_cf_rule" ON cf_rule;
DROP POLICY IF EXISTS "admin_insert_cf_rule" ON cf_rule;
CREATE POLICY "public_read_cf_rule"  ON cf_rule FOR SELECT USING (true);
CREATE POLICY "admin_insert_cf_rule" ON cf_rule FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_update_cf_rule" ON cf_rule FOR UPDATE USING (auth.role() = 'authenticated');

INSERT INTO cf_rule (parameter, cf_value, keterangan) VALUES
  ('ch',   0.90, 'Curah hujan - faktor air paling kritis (Oldeman 1975; Ritung et al. 2011)'),
  ('suhu', 0.80, 'Suhu - kritis untuk fotosintesis & metabolisme'),
  ('rh',   0.70, 'Kelembaban - memengaruhi OPT & transpirasi'),
  ('kat',  0.60, 'Ketersediaan air tanah - faktor pendukung')
ON CONFLICT (parameter) DO NOTHING;
