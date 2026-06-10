-- ============================================================
-- AgroDemak - UPDATE Syarat Tumbuh Komoditas
-- Jalankan di Supabase SQL Editor jika tabel commodities
-- sudah terisi sebelumnya (untuk memperbarui nilai parameter).
--
-- Sumber:
--   [1] Ritung, S. et al. (2011). Petunjuk Teknis Evaluasi Lahan
--       untuk Komoditas Pertanian (Edisi Revisi). BBSDLP, Bogor.
--   [2] FAO AQUASTAT (2002). Crop Water Requirements. Paper No.56.
--   [3] IRRI Knowledge Bank (2023). Rice Production.
--   [4] Balitsa (2015, 2017). Budidaya Cabai & Bawang Merah.
--   [5] Balitkabi (2016). Varietas Unggul Kedelai.
--   [6] AVRDC/WorldVeg (2003). Cultural Practices for Kangkong.
-- ============================================================

UPDATE commodities SET
  nama_ilmiah    = 'Oryza sativa',
  ch_min         = 150,
  ch_max         = 300,
  suhu_min       = 22,
  suhu_max       = 32,
  kelembaban_min = 70,
  kelembaban_max = 90,
  air_tanah_min  = 5.0,
  info_pupuk     = 'Urea 250 kg/ha, SP-36 100 kg/ha, KCl 100 kg/ha',
  hama           = 'Wereng coklat, penggerek batang, tikus, blast',
  risiko         = 'Genangan >30 cm dapat menyebabkan layu; suhu >35°C meningkatkan spikelet steril',
  deskripsi      = 'Tanaman pangan utama Kabupaten Demak. Sumber: Ritung et al. (2011) BBSDLP hal.24-27 & IRRI (2023).'
WHERE nama = 'Padi';

UPDATE commodities SET
  nama_ilmiah    = 'Zea mays',
  ch_min         = 100,
  ch_max         = 200,
  suhu_min       = 21,
  suhu_max       = 34,
  kelembaban_min = 60,
  kelembaban_max = 80,
  air_tanah_min  = 3.0,
  info_pupuk     = 'Urea 300 kg/ha, SP-36 150 kg/ha, KCl 100 kg/ha',
  hama           = 'Penggerek batang, ulat grayak, bulai, hawar daun',
  risiko         = 'Kekeringan fase pembungaan menurunkan hasil; genangan >2 hari menyebabkan busuk akar',
  deskripsi      = 'Palawija utama setelah padi. Sumber: Ritung et al. (2011) BBSDLP hal.38-41 & FAO AQUASTAT (2002).'
WHERE nama = 'Jagung';

UPDATE commodities SET
  nama_ilmiah    = 'Capsicum annuum',
  ch_min         = 100,
  ch_max         = 200,
  suhu_min       = 18,
  suhu_max       = 27,
  kelembaban_min = 60,
  kelembaban_max = 80,
  air_tanah_min  = 4.0,
  info_pupuk     = 'NPK 15-15-15 500 kg/ha, pupuk kandang 20 ton/ha',
  hama           = 'Antraknosa, layu fusarium, thrips, kutu daun, virus kuning',
  risiko         = 'Kelembaban >80% meningkatkan antraknosa; suhu malam <15°C menghambat pembuahan',
  deskripsi      = 'Hortikultura bernilai tinggi. Sumber: Ritung et al. (2011) BBSDLP hal.96-99 & Balitsa (2017).'
WHERE nama = 'Cabai';

UPDATE commodities SET
  nama_ilmiah    = 'Allium cepa var. aggregatum',
  ch_min         = 80,
  ch_max         = 150,
  suhu_min       = 22,
  suhu_max       = 32,
  kelembaban_min = 50,
  kelembaban_max = 70,
  air_tanah_min  = 3.0,
  info_pupuk     = 'ZA 300 kg/ha, SP-36 200 kg/ha, KCl 200 kg/ha',
  hama           = 'Ulat bawang, thrips, layu fusarium, busuk umbi',
  risiko         = 'CH >150 mm/bulan dan RH >70% meningkatkan busuk umbi; butuh drainase sangat baik',
  deskripsi      = 'Komoditas strategis Demak. Sumber: Ritung et al. (2011) BBSDLP hal.103-106 & Balitsa (2015).'
WHERE nama = 'Bawang Merah';

UPDATE commodities SET
  nama_ilmiah    = 'Glycine max',
  ch_min         = 100,
  ch_max         = 200,
  suhu_min       = 22,
  suhu_max       = 32,
  kelembaban_min = 60,
  kelembaban_max = 80,
  air_tanah_min  = 3.0,
  info_pupuk     = 'SP-36 100 kg/ha, KCl 75 kg/ha, Rhizobium inokulasi',
  hama           = 'Ulat grayak, pengisap polong, karat daun, virus mozaik',
  risiko         = 'Genangan >7 hari fase vegetatif menyebabkan klorosis; kekeringan fase biji menurunkan bobot',
  deskripsi      = 'Sumber protein nabati. Sumber: Ritung et al. (2011) BBSDLP hal.55-58 & Balitkabi (2016).'
WHERE nama = 'Kedelai';

UPDATE commodities SET
  nama_ilmiah    = 'Citrullus lanatus',
  ch_min         = 40,
  ch_max         = 100,
  suhu_min       = 22,
  suhu_max       = 30,
  kelembaban_min = 50,
  kelembaban_max = 70,
  air_tanah_min  = 3.5,
  info_pupuk     = 'NPK 15-15-15 400 kg/ha, pupuk kandang 15 ton/ha',
  hama           = 'Layu fusarium, antraknosa, kutu daun, lalat buah',
  risiko         = 'CH >100 mm/bulan menurunkan kadar gula; kelembaban tinggi meningkatkan busuk buah',
  deskripsi      = 'Buah musim kemarau. Sumber: Ritung et al. (2011) BBSDLP hal.117-119 & FAO AQUASTAT (2002).'
WHERE nama = 'Semangka';

UPDATE commodities SET
  nama_ilmiah    = 'Ipomoea aquatica',
  ch_min         = 100,
  ch_max         = 250,
  suhu_min       = 22,
  suhu_max       = 36,
  kelembaban_min = 60,
  kelembaban_max = 90,
  air_tanah_min  = 2.5,
  info_pupuk     = 'Urea 100 kg/ha, NPK 150 kg/ha',
  hama           = 'Ulat daun, kutu daun, karat putih',
  risiko         = 'Relatif tahan hama; risiko rendah sepanjang tahun',
  deskripsi      = 'Sayuran adaptif toleran genangan. Sumber: Ritung et al. (2011) BBSDLP hal.130-131 & AVRDC/WorldVeg (2003).'
WHERE nama = 'Kangkung';
