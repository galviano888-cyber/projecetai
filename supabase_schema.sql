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
-- Sumber parameter syarat tumbuh:
--   [1] Ritung, S. et al. (2011). Petunjuk Teknis Evaluasi Lahan untuk Komoditas
--       Pertanian (Edisi Revisi). BBSDLP, Badan Litbang Pertanian, Bogor.
--   [2] FAO AQUASTAT (2002). Crop Water Requirements. FAO Irr. & Drainage Paper No.56.
--   [3] IRRI Knowledge Bank (2023). Climate and Soils - Rice Production.
--   [4] Balitsa (2017). Teknologi Budidaya Cabai & Bawang Merah. Balitbangtan, Lembang.
--   [5] Balitkabi (2016). Deskripsi Varietas Unggul Kedelai. Balitbangtan, Malang.
--   [6] AVRDC/WorldVeg (2003). Cultural Practices for Kangkong. Pub. No. 03-552.
-- ============================================================
INSERT INTO commodities (
  nama, nama_ilmiah, deskripsi,
  ch_min, ch_max, suhu_min, suhu_max,
  kelembaban_min, kelembaban_max, air_tanah_min,
  waktu_tanam, durasi_panen, jarak_tanam,
  info_pupuk, hama, risiko, musim
) VALUES
  (
    'Padi', 'Oryza sativa',
    'Tanaman pangan utama Kabupaten Demak, ditanam di sawah irigasi maupun tadah hujan. Syarat tumbuh: Ritung et al. (2011) BBSDLP hal.24-27 & IRRI Knowledge Bank (2023).',
    150, 300, 22, 32, 70, 90, 5.0,
    'Nov-Feb, Apr-Jul', '100-120 hari', '25x25 cm',
    'Urea 250 kg/ha, SP-36 100 kg/ha, KCl 100 kg/ha',
    'Wereng coklat, penggerek batang, tikus, blast',
    'Genangan berlebih >30 cm dapat menyebabkan layu; suhu >35°C meningkatkan spikelet steril',
    'hujan'
  ),
  (
    'Jagung', 'Zea mays',
    'Palawija utama setelah padi, toleran terhadap berbagai kondisi iklim. Syarat tumbuh: Ritung et al. (2011) BBSDLP hal.38-41 & FAO AQUASTAT (2002).',
    100, 200, 21, 34, 60, 80, 3.0,
    'Mar-Jun, Jul-Okt', '75-100 hari', '70x25 cm',
    'Urea 300 kg/ha, SP-36 150 kg/ha, KCl 100 kg/ha',
    'Penggerek batang, ulat grayak, bulai, hawar daun',
    'Kekeringan pada fase pembungaan menurunkan hasil drastis; genangan >2 hari menyebabkan busuk akar',
    'kemarau'
  ),
  (
    'Cabai', 'Capsicum annuum',
    'Komoditas hortikultura bernilai tinggi, membutuhkan drainase baik. Syarat tumbuh: Ritung et al. (2011) BBSDLP hal.96-99 & Balitsa (2017).',
    100, 200, 18, 27, 60, 80, 4.0,
    'Apr-Jul', '80-100 hari', '60x50 cm',
    'NPK 15-15-15 500 kg/ha, pupuk kandang 20 ton/ha',
    'Antraknosa, layu fusarium, thrips, kutu daun, virus kuning',
    'Kelembaban >80% meningkatkan risiko antraknosa; suhu malam <15°C menghambat pembuahan',
    'kemarau'
  ),
  (
    'Bawang Merah', 'Allium cepa var. aggregatum',
    'Komoditas strategis Demak, sangat sensitif terhadap kelebihan air dan kelembaban tinggi. Syarat tumbuh: Ritung et al. (2011) BBSDLP hal.103-106 & Balitsa (2015).',
    80, 150, 22, 32, 50, 70, 3.0,
    'Apr-Agt', '60-70 hari', '15x15 cm',
    'ZA 300 kg/ha, SP-36 200 kg/ha, KCl 200 kg/ha',
    'Ulat bawang, thrips, layu fusarium, busuk umbi',
    'Curah hujan >150 mm/bulan dan kelembaban >70% meningkatkan busuk umbi; butuh drainase sangat baik',
    'kemarau'
  ),
  (
    'Kedelai', 'Glycine max',
    'Sumber protein nabati, cocok musim kemarau dengan irigasi teratur. Syarat tumbuh: Ritung et al. (2011) BBSDLP hal.55-58 & Balitkabi (2016).',
    100, 200, 22, 32, 60, 80, 3.0,
    'Mar-Jun', '75-85 hari', '40x15 cm',
    'SP-36 100 kg/ha, KCl 75 kg/ha, Rhizobium inokulasi',
    'Ulat grayak, pengisap polong, karat daun, virus mozaik',
    'Genangan >7 hari pada fase vegetatif menyebabkan klorosis; kekeringan pada fase pengisian biji menurunkan bobot',
    'kemarau'
  ),
  (
    'Semangka', 'Citrullus lanatus',
    'Buah musim kemarau, butuh sinar matahari penuh dan suhu tinggi untuk kadar gula optimal. Syarat tumbuh: Ritung et al. (2011) BBSDLP hal.117-119 & FAO AQUASTAT (2002).',
    40, 100, 22, 30, 50, 70, 3.5,
    'Apr-Jul', '70-80 hari', '200x50 cm',
    'NPK 15-15-15 400 kg/ha, pupuk kandang 15 ton/ha',
    'Layu fusarium, antraknosa, kutu daun, lalat buah',
    'Curah hujan >100 mm/bulan menurunkan kadar gula; kelembaban tinggi meningkatkan busuk buah',
    'kemarau'
  ),
  (
    'Kangkung', 'Ipomoea aquatica',
    'Sayuran adaptif sepanjang tahun, toleran genangan tinggi. Syarat tumbuh: Ritung et al. (2011) BBSDLP hal.130-131 & AVRDC/WorldVeg (2003) Pub.No.03-552.',
    100, 250, 22, 36, 60, 90, 2.5,
    'Sepanjang tahun', '25-30 hari', '20x20 cm',
    'Urea 100 kg/ha, NPK 150 kg/ha',
    'Ulat daun, kutu daun, karat putih',
    'Relatif tahan hama; risiko rendah sepanjang tahun',
    'sepanjang_tahun'
  )
ON CONFLICT DO NOTHING;
