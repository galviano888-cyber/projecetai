-- ============================================================
-- AgroDemak - Supabase Schema
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. CLIMATE DATA
CREATE TABLE IF NOT EXISTS climate_data (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bulan       smallint NOT NULL CHECK (bulan BETWEEN 1 AND 12),
  tahun       smallint NOT NULL CHECK (tahun BETWEEN 2000 AND 2100),
  ch_mm       numeric(8,2) NOT NULL,        -- Curah Hujan (mm/bulan)
  suhu        numeric(5,2) NOT NULL,        -- Suhu rata-rata (°C)
  kelembaban  numeric(5,2) NOT NULL,        -- Kelembaban udara (%)
  air_tanah   numeric(8,2) NOT NULL,        -- Ketersediaan air tanah (mm/hari)
  created_at  timestamptz DEFAULT now(),
  UNIQUE (bulan, tahun)
);

-- 2. COMMODITIES
CREATE TABLE IF NOT EXISTS commodities (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama            text NOT NULL,
  nama_ilmiah     text,
  deskripsi       text,
  foto_url        text,
  ch_min          numeric(8,2),   -- Curah hujan min (mm)
  ch_max          numeric(8,2),   -- Curah hujan max (mm)
  suhu_min        numeric(5,2),   -- Suhu min (°C)
  suhu_max        numeric(5,2),   -- Suhu max (°C)
  kelembaban_min  numeric(5,2),   -- Kelembaban min (%)
  kelembaban_max  numeric(5,2),   -- Kelembaban max (%)
  air_tanah_min   numeric(8,2),   -- Air tanah min (mm/hari)
  waktu_tanam     text,           -- Bulan cocok tanam (contoh: "Nov-Feb")
  durasi_panen    text,           -- Contoh: "90-110 hari"
  jarak_tanam     text,           -- Contoh: "25x25 cm"
  info_pupuk      text,
  hama            text,
  risiko          text,
  musim           text,           -- "hujan", "kemarau", "sepanjang_tahun"
  created_at      timestamptz DEFAULT now()
);

-- 3. RECOMMENDATIONS
CREATE TABLE IF NOT EXISTS recommendations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bulan           smallint NOT NULL CHECK (bulan BETWEEN 1 AND 12),
  commodity_id    uuid REFERENCES commodities(id) ON DELETE CASCADE,
  skor_kecocokan  numeric(5,2) NOT NULL CHECK (skor_kecocokan BETWEEN 0 AND 100),
  catatan         text,
  created_at      timestamptz DEFAULT now()
);

-- 4. LIBRARY
CREATE TABLE IF NOT EXISTS library (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commodity_id     uuid REFERENCES commodities(id) ON DELETE CASCADE UNIQUE,
  konten_detail    text,
  tips_budidaya    text,
  hama_umum        text,
  cara_pencegahan  text,
  created_at       timestamptz DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE climate_data    ENABLE ROW LEVEL SECURITY;
ALTER TABLE commodities     ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE library         ENABLE ROW LEVEL SECURITY;

-- Public READ untuk semua tabel (user biasa bisa lihat)
CREATE POLICY "public_read_climate"    ON climate_data    FOR SELECT USING (true);
CREATE POLICY "public_read_commodities" ON commodities    FOR SELECT USING (true);
CREATE POLICY "public_read_recommendations" ON recommendations FOR SELECT USING (true);
CREATE POLICY "public_read_library"    ON library         FOR SELECT USING (true);

-- Admin WRITE hanya untuk authenticated users
CREATE POLICY "admin_insert_climate"   ON climate_data    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_update_climate"   ON climate_data    FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "admin_delete_climate"   ON climate_data    FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "admin_insert_commodities" ON commodities   FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_update_commodities" ON commodities   FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "admin_delete_commodities" ON commodities   FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "admin_insert_recommendations" ON recommendations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_update_recommendations" ON recommendations FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "admin_delete_recommendations" ON recommendations FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "admin_insert_library"   ON library         FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_update_library"   ON library         FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "admin_delete_library"   ON library         FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- SEED DATA - Komoditas Prioritas Demak
-- ============================================================
INSERT INTO commodities (nama, nama_ilmiah, deskripsi, ch_min, ch_max, suhu_min, suhu_max, kelembaban_min, kelembaban_max, air_tanah_min, waktu_tanam, durasi_panen, jarak_tanam, musim) VALUES
  ('Padi', 'Oryza sativa', 'Tanaman pangan utama Kabupaten Demak, ditanam di sawah irigasi maupun tadah hujan.', 200, 400, 22, 32, 70, 90, 5, 'Nov-Feb, Apr-Jul', '100-120 hari', '25x25 cm', 'hujan'),
  ('Jagung', 'Zea mays', 'Palawija utama setelah padi, toleran terhadap berbagai kondisi iklim.', 100, 300, 21, 34, 50, 80, 2, 'Mar-Jun, Jul-Okt', '75-100 hari', '70x25 cm', 'kemarau'),
  ('Cabai', 'Capsicum annuum', 'Komoditas hortikultura bernilai tinggi, membutuhkan drainase baik.', 100, 200, 24, 32, 60, 80, 3, 'Apr-Jul', '80-100 hari', '60x50 cm', 'kemarau'),
  ('Bawang Merah', 'Allium cepa', 'Komoditas strategis Demak, sangat sensitif terhadap kelebihan air.', 100, 200, 25, 32, 50, 70, 2, 'Apr-Agt', '60-70 hari', '15x15 cm', 'kemarau'),
  ('Kedelai', 'Glycine max', 'Sumber protein nabati, cocok ditanam pada musim kemarau dengan irigasi cukup.', 100, 250, 23, 30, 60, 80, 2, 'Mar-Jun', '75-85 hari', '40x15 cm', 'kemarau'),
  ('Semangka', 'Citrullus lanatus', 'Buah musim kemarau yang populer, butuh sinar matahari penuh dan air teratur.', 50, 150, 25, 35, 50, 70, 3, 'Apr-Jul', '70-80 hari', '200x50 cm', 'kemarau'),
  ('Kangkung', 'Ipomoea aquatica', 'Sayuran adaptif yang tumbuh sepanjang tahun, sangat toleran genangan.', 100, 400, 20, 35, 60, 90, 2, 'Sepanjang tahun', '25-30 hari', '20x20 cm', 'sepanjang_tahun')
ON CONFLICT DO NOTHING;
