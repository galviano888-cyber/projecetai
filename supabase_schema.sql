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
  air_tanah   numeric(8,2) NOT NULL,        -- Ketersediaan Air Tanah / KAT (% kapasitas lapang)
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
  air_tanah_min   numeric(8,2),   -- Ketersediaan Air Tanah / KAT min (% kapasitas lapang)
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
DROP POLICY IF EXISTS "public_read_climate"      ON climate_data;
DROP POLICY IF EXISTS "public_read_commodities"  ON commodities;
DROP POLICY IF EXISTS "public_read_recommendations" ON recommendations;
DROP POLICY IF EXISTS "public_read_library"      ON library;
CREATE POLICY "public_read_climate"    ON climate_data    FOR SELECT USING (true);
CREATE POLICY "public_read_commodities" ON commodities    FOR SELECT USING (true);
CREATE POLICY "public_read_recommendations" ON recommendations FOR SELECT USING (true);
CREATE POLICY "public_read_library"    ON library         FOR SELECT USING (true);

-- Admin WRITE hanya untuk authenticated users
DROP POLICY IF EXISTS "admin_insert_climate" ON climate_data;
DROP POLICY IF EXISTS "admin_update_climate" ON climate_data;
DROP POLICY IF EXISTS "admin_delete_climate" ON climate_data;
CREATE POLICY "admin_insert_climate"   ON climate_data    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_update_climate"   ON climate_data    FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "admin_delete_climate"   ON climate_data    FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "admin_insert_commodities" ON commodities;
DROP POLICY IF EXISTS "admin_update_commodities" ON commodities;
DROP POLICY IF EXISTS "admin_delete_commodities" ON commodities;
CREATE POLICY "admin_insert_commodities" ON commodities   FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_update_commodities" ON commodities   FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "admin_delete_commodities" ON commodities   FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "admin_insert_recommendations" ON recommendations;
DROP POLICY IF EXISTS "admin_update_recommendations" ON recommendations;
DROP POLICY IF EXISTS "admin_delete_recommendations" ON recommendations;
CREATE POLICY "admin_insert_recommendations" ON recommendations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_update_recommendations" ON recommendations FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "admin_delete_recommendations" ON recommendations FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "admin_insert_library" ON library;
DROP POLICY IF EXISTS "admin_update_library" ON library;
DROP POLICY IF EXISTS "admin_delete_library" ON library;
CREATE POLICY "admin_insert_library"   ON library         FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_update_library"   ON library         FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "admin_delete_library"   ON library         FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- SEED DATA - Komoditas Demak
-- ============================================================
-- CATATAN: Seed komoditas + library untuk 10 tanaman fokus kalender tanam
-- dipindahkan ke file `supabase_seed_library.sql` agar:
--   1. Nama komoditas konsisten dengan knowledge base sistem pakar
--      (mis. "Padi Sawah", "Cabai Keriting", bukan "Padi"/"Cabai").
--   2. Satuan KAT (air_tanah) konsisten dalam % kapasitas lapang.
--
-- Jalankan `supabase_seed_library.sql` SETELAH file ini.
-- ============================================================
