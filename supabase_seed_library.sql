-- ============================================================
-- AgroDemak - Seed Library 10 Komoditas Fokus
-- Jalankan di Supabase SQL Editor SETELAH supabase_schema.sql
-- ============================================================
-- Mengisi tabel commodities + library dengan 10 tanaman fokus
-- kalender tanam (selaras knowledge base sistem pakar).
--
-- Sumber syarat tumbuh:
--   - Djaenudin et al. 2011, Petunjuk Teknis Evaluasi Lahan, BBSDLP
--   - Oldeman 1975 (klasifikasi iklim), FAO-56 (fase tumbuh)
-- Gambar: tersimpan lokal di folder /public
-- ============================================================

-- Hapus 10 komoditas fokus jika sudah ada (library ikut terhapus via CASCADE)
DELETE FROM commodities WHERE nama IN (
  'Padi Sawah', 'Jagung', 'Kedelai', 'Bawang Merah', 'Semangka',
  'Cabai Keriting', 'Petsai/Sawi', 'Melon', 'Cabai Rawit', 'Terung'
);

-- ============================================================
-- INSERT komoditas + library memakai CTE agar id tersambung
-- ============================================================

-- 1. PADI SAWAH ---------------------------------------------------------------
WITH c AS (
  INSERT INTO commodities (nama, nama_ilmiah, deskripsi, foto_url,
    ch_min, ch_max, suhu_min, suhu_max, kelembaban_min, kelembaban_max, air_tanah_min,
    waktu_tanam, durasi_panen, jarak_tanam, info_pupuk, hama, risiko, musim)
  VALUES ('Padi Sawah', 'Oryza sativa',
    'Komoditas pangan utama Kabupaten Demak yang dibudidayakan pada lahan sawah beririgasi maupun tadah hujan. Membutuhkan ketersediaan air tinggi sepanjang fase vegetatif hingga generatif.',
    '/sawah_padi.webp',
    150, 300, 24, 29, 70, 90, 80,
    'Awal musim hujan (Nov-Des)', '110-120 hari', '25 x 25 cm (jajar legowo)',
    'Urea 200-250 kg/ha, SP-36 100 kg/ha, KCl 100 kg/ha. Pemupukan bertahap pada 7, 21, dan 40 HST.',
    'Wereng batang cokelat, penggerek batang, tikus, blas',
    'Kekeringan saat fase pengisian bulir dan serangan wereng dapat menurunkan hasil hingga 30%.',
    'hujan')
  RETURNING id
)
INSERT INTO library (commodity_id, konten_detail, tips_budidaya, hama_umum, cara_pencegahan)
SELECT id,
  '<p>Padi sawah adalah tulang punggung ketahanan pangan Kabupaten Demak. Tanaman ini tumbuh optimal pada kondisi tergenang dengan suhu 24-29&deg;C dan curah hujan tinggi (Bulan Basah, &ge;200 mm) selama fase vegetatif hingga generatif.</p><p>Fase pemasakan bulir justru membutuhkan kondisi lebih kering agar gabah berisi penuh dan mudah dipanen. Karena itu waktu tanam terbaik adalah awal musim hujan sehingga panen jatuh menjelang kemarau.</p>',
  '<ul><li>Gunakan benih bersertifikat dan lakukan persemaian 21-25 hari.</li><li>Terapkan sistem tanam jajar legowo untuk sirkulasi udara dan cahaya lebih baik.</li><li>Atur pengairan berselang (intermittent) untuk menghemat air dan memperkuat akar.</li><li>Lakukan penyiangan pada 15 dan 30 HST.</li></ul>',
  '<p>Wereng batang cokelat, penggerek batang padi (sundep/beluk), tikus sawah, dan penyakit blas (<em>Pyricularia oryzae</em>).</p>',
  '<ul><li>Tanam serempak dalam satu hamparan untuk memutus siklus hama.</li><li>Gunakan varietas tahan wereng (mis. Inpari 32).</li><li>Sanitasi pematang dan gropyokan tikus secara gotong royong.</li><li>Pemupukan nitrogen berimbang agar tanaman tidak terlalu sukulen.</li></ul>'
FROM c;

-- 2. JAGUNG -------------------------------------------------------------------
WITH c AS (
  INSERT INTO commodities (nama, nama_ilmiah, deskripsi, foto_url,
    ch_min, ch_max, suhu_min, suhu_max, kelembaban_min, kelembaban_max, air_tanah_min,
    waktu_tanam, durasi_panen, jarak_tanam, info_pupuk, hama, risiko, musim)
  VALUES ('Jagung', 'Zea mays',
    'Tanaman pangan serbaguna untuk pangan dan pakan ternak. Toleran terhadap berbagai kondisi lahan namun sensitif terhadap genangan air.',
    '/ladang_jagung.webp',
    100, 200, 21, 30, 60, 80, 60,
    'Awal/akhir musim hujan', '95-110 hari', '70 x 20 cm',
    'Urea 300 kg/ha, SP-36 100 kg/ha, KCl 75 kg/ha. Aplikasi pada 10 dan 35 HST.',
    'Ulat grayak (Spodoptera frugiperda), penggerek tongkol, bulai',
    'Genangan air dan serangan ulat grayak pada fase vegetatif awal menurunkan populasi tanaman.',
    'sepanjang_tahun')
  RETURNING id
)
INSERT INTO library (commodity_id, konten_detail, tips_budidaya, hama_umum, cara_pencegahan)
SELECT id,
  '<p>Jagung tumbuh baik pada Bulan Lembab (100-200 mm) selama fase vegetatif dan pembungaan, lalu membutuhkan kondisi kering saat pemasakan biji. Tanaman ini sangat tidak tahan genangan, sehingga drainase lahan menjadi kunci keberhasilan.</p><p>Di Demak, jagung umumnya ditanam sebagai rotasi setelah padi (MT-2) untuk memutus siklus hama sekaligus memanfaatkan sisa lengas tanah.</p>',
  '<ul><li>Buat saluran drainase yang baik untuk mencegah genangan.</li><li>Tanam 1-2 biji per lubang sedalam 3-5 cm.</li><li>Lakukan pembumbunan saat tanaman setinggi 30-40 cm untuk memperkuat perakaran.</li><li>Pastikan kebutuhan air tercukupi saat fase berbunga (kritis).</li></ul>',
  '<p>Ulat grayak frugiperda (<em>fall armyworm</em>), penggerek tongkol, dan penyakit bulai (<em>downy mildew</em>).</p>',
  '<ul><li>Perlakuan benih dengan fungisida untuk cegah bulai.</li><li>Pengamatan rutin pucuk tanaman terhadap ulat grayak sejak dini.</li><li>Pengendalian hayati dengan musuh alami atau agens hayati.</li><li>Tanam serempak dan rotasi tanaman.</li></ul>'
FROM c;

-- 3. KEDELAI ------------------------------------------------------------------
WITH c AS (
  INSERT INTO commodities (nama, nama_ilmiah, deskripsi, foto_url,
    ch_min, ch_max, suhu_min, suhu_max, kelembaban_min, kelembaban_max, air_tanah_min,
    waktu_tanam, durasi_panen, jarak_tanam, info_pupuk, hama, risiko, musim)
  VALUES ('Kedelai', 'Glycine max',
    'Tanaman palawija sumber protein nabati. Cocok ditanam pada musim kemarau setelah padi karena membutuhkan air sedang dan kondisi kering saat panen.',
    '/kedelai.webp',
    100, 200, 22, 30, 60, 80, 60,
    'Awal kemarau (Apr-Mei)', '80-90 hari', '40 x 15 cm',
    'Urea 50 kg/ha, SP-36 100 kg/ha, KCl 75 kg/ha. Inokulasi Rhizobium dianjurkan.',
    'Lalat kacang, ulat grayak, penggerek polong, kepik hijau',
    'Curah hujan tinggi saat panen menyebabkan polong busuk dan biji berkecambah di lapang.',
    'kemarau')
  RETURNING id
)
INSERT INTO library (commodity_id, konten_detail, tips_budidaya, hama_umum, cara_pencegahan)
SELECT id,
  '<p>Kedelai adalah palawija bernilai ekonomi tinggi yang ideal ditanam pada musim kemarau (MT-2/MT-3). Fase vegetatif dan pembungaan membutuhkan Bulan Lembab, sedangkan fase pengisian polong hingga panen menghendaki kondisi kering agar kualitas biji terjaga.</p><p>Bintil akar kedelai mampu mengikat nitrogen dari udara, sehingga kebutuhan pupuk nitrogen relatif rendah.</p>',
  '<ul><li>Inokulasi benih dengan <em>Rhizobium</em> untuk meningkatkan pembentukan bintil akar.</li><li>Tanam tanpa olah tanah (TOT) pada lahan bekas padi untuk efisiensi.</li><li>Jaga kelembapan tanah saat fase pembungaan dan pengisian polong.</li><li>Panen saat 95% polong berwarna cokelat dan daun rontok.</li></ul>',
  '<p>Lalat kacang, ulat grayak, penggerek polong (<em>Etiella</em>), dan kepik hijau pengisap polong.</p>',
  '<ul><li>Tanam serempak di awal musim untuk menghindari puncak populasi hama.</li><li>Pasang perangkap feromon untuk penggerek polong.</li><li>Konservasi musuh alami seperti laba-laba dan kumbang predator.</li><li>Penyemprotan selektif hanya bila melewati ambang ekonomi.</li></ul>'
FROM c;

-- 4. BAWANG MERAH -------------------------------------------------------------
WITH c AS (
  INSERT INTO commodities (nama, nama_ilmiah, deskripsi, foto_url,
    ch_min, ch_max, suhu_min, suhu_max, kelembaban_min, kelembaban_max, air_tanah_min,
    waktu_tanam, durasi_panen, jarak_tanam, info_pupuk, hama, risiko, musim)
  VALUES ('Bawang Merah', 'Allium cepa var. aggregatum',
    'Komoditas hortikultura unggulan Demak dengan nilai ekonomi tinggi. Membutuhkan penyinaran penuh dan tidak tahan kelembapan berlebih.',
    '/bawang_merah.webp',
    100, 180, 25, 32, 65, 80, 60,
    'Awal kemarau', '55-70 hari', '15 x 20 cm',
    'Urea 200 kg/ha, ZA 300 kg/ha, SP-36 200 kg/ha, KCl 150 kg/ha.',
    'Ulat bawang (Spodoptera exigua), trips, penyakit moler (layu fusarium)',
    'Hujan tinggi memicu penyakit jamur dan pembusukan umbi; harga sangat fluktuatif.',
    'kemarau')
  RETURNING id
)
INSERT INTO library (commodity_id, konten_detail, tips_budidaya, hama_umum, cara_pencegahan)
SELECT id,
  '<p>Bawang merah adalah ikon hortikultura Kabupaten Demak. Tanaman ini menyukai suhu hangat (25-32&deg;C), penyinaran penuh, dan kelembapan sedang. Curah hujan berlebih sangat berisiko memicu penyakit jamur dan busuk umbi.</p><p>Karena itu bawang merah paling aman ditanam pada musim kemarau dengan pengairan terkendali, dan fase panen membutuhkan kondisi kering.</p>',
  '<ul><li>Gunakan umbi bibit yang telah disimpan 2-3 bulan dan sehat.</li><li>Buat bedengan tinggi dengan drainase sangat baik.</li><li>Siram dua kali sehari pada awal pertumbuhan di musim kemarau.</li><li>Panen saat 70-80% daun rebah dan menguning.</li></ul>',
  '<p>Ulat bawang (<em>Spodoptera exigua</em>), trips, dan penyakit moler atau layu fusarium serta bercak ungu (<em>trotol</em>).</p>',
  '<ul><li>Pasang perangkap likat kuning dan lampu perangkap ngengat.</li><li>Pungut dan musnahkan kelompok telur ulat secara manual.</li><li>Rotasi tanaman dengan non-Allium untuk menekan patogen tanah.</li><li>Gunakan mulsa jerami dan hindari penyiraman berlebih.</li></ul>'
FROM c;

-- 5. SEMANGKA -----------------------------------------------------------------
WITH c AS (
  INSERT INTO commodities (nama, nama_ilmiah, deskripsi, foto_url,
    ch_min, ch_max, suhu_min, suhu_max, kelembaban_min, kelembaban_max, air_tanah_min,
    waktu_tanam, durasi_panen, jarak_tanam, info_pupuk, hama, risiko, musim)
  VALUES ('Semangka', 'Citrullus lanatus',
    'Buah semusim musim kemarau dengan perputaran modal cepat. Membutuhkan penyinaran penuh dan kondisi kering saat pembentukan buah untuk rasa manis optimal.',
    '/semangka.webp',
    40, 100, 25, 35, 60, 75, 50,
    'Pertengahan kemarau', '60-70 hari', '90 x 50 cm',
    'NPK 16-16-16 sebagai pupuk dasar, ditambah pupuk daun saat pembungaan.',
    'Kutu daun, lalat buah, embun tepung, antraknosa',
    'Hujan saat pembungaan menggugurkan bunga dan menurunkan kadar gula buah.',
    'kemarau')
  RETURNING id
)
INSERT INTO library (commodity_id, konten_detail, tips_budidaya, hama_umum, cara_pencegahan)
SELECT id,
  '<p>Semangka adalah tanaman kemarau dengan siklus pendek (&plusmn;60-70 hari) sehingga ideal untuk perputaran modal cepat. Fase awal masih menoleransi Bulan Lembab, namun fase pembungaan hingga panen sangat membutuhkan kondisi kering (Bulan Kering) agar buah manis dan tidak pecah.</p><p>Penyinaran matahari penuh adalah syarat mutlak untuk pembentukan gula pada buah.</p>',
  '<ul><li>Gunakan mulsa plastik hitam perak untuk menjaga kelembapan dan menekan gulma.</li><li>Lakukan pemangkasan cabang dan seleksi buah (1-2 buah per tanaman).</li><li>Bantu penyerbukan pada pagi hari bila populasi lebah sedikit.</li><li>Kurangi penyiraman menjelang panen untuk meningkatkan kadar gula.</li></ul>',
  '<p>Kutu daun (<em>Aphis</em>), lalat buah, penyakit embun tepung, dan antraknosa pada daun serta buah.</p>',
  '<ul><li>Pasang perangkap lalat buah berbahan metil eugenol.</li><li>Atur jarak tanam agar sirkulasi udara baik dan kelembapan rendah.</li><li>Sanitasi buah terserang dan sisa tanaman.</li><li>Rotasi tanaman dengan famili non-Cucurbitaceae.</li></ul>'
FROM c;

-- 6. CABAI KERITING -----------------------------------------------------------
WITH c AS (
  INSERT INTO commodities (nama, nama_ilmiah, deskripsi, foto_url,
    ch_min, ch_max, suhu_min, suhu_max, kelembaban_min, kelembaban_max, air_tanah_min,
    waktu_tanam, durasi_panen, jarak_tanam, info_pupuk, hama, risiko, musim)
  VALUES ('Cabai Keriting', 'Capsicum annuum',
    'Hortikultura bernilai tinggi dengan masa panen panjang. Dapat ditanam sepanjang tahun dengan pengelolaan air dan drainase yang baik.',
    '/cabai.webp',
    100, 200, 24, 30, 65, 80, 60,
    'Sepanjang tahun', '90-100 hari (mulai panen)', '60 x 50 cm',
    'NPK 16-16-16, pupuk kandang matang 20 ton/ha, pupuk daun saat vegetatif.',
    'Trips, kutu kebul, lalat buah, antraknosa (patek)',
    'Kelembapan tinggi memicu antraknosa; serangan kutu kebul menularkan virus kuning.',
    'sepanjang_tahun')
  RETURNING id
)
INSERT INTO library (commodity_id, konten_detail, tips_budidaya, hama_umum, cara_pencegahan)
SELECT id,
  '<p>Cabai keriting membutuhkan air yang relatif konsisten (Bulan Lembab) sepanjang fase tumbuhnya yang panjang, dengan masa panen bisa berlangsung berbulan-bulan. Suhu optimal 24-30&deg;C dengan kelembapan terkendali untuk mencegah penyakit antraknosa.</p><p>Komoditas ini sangat menguntungkan namun menuntut perawatan intensif dan pengendalian hama yang disiplin.</p>',
  '<ul><li>Semai benih 30-35 hari sebelum pindah tanam.</li><li>Gunakan mulsa plastik dan ajir/lanjaran untuk menopang tanaman.</li><li>Pasang drainase baik agar tidak tergenang saat hujan.</li><li>Panen rutin setiap 3-5 hari untuk merangsang pembuahan.</li></ul>',
  '<p>Trips, kutu kebul (<em>Bemisia tabaci</em>) pembawa virus kuning, lalat buah, dan penyakit antraknosa/patek (<em>Colletotrichum</em>).</p>',
  '<ul><li>Gunakan mulsa perak untuk memantulkan cahaya dan mengusir vektor.</li><li>Pasang perangkap likat kuning di sekitar tanaman.</li><li>Cabut dan musnahkan tanaman bergejala virus.</li><li>Sanitasi buah terserang antraknosa dan atur jarak tanam.</li></ul>'
FROM c;

-- 7. PETSAI / SAWI ------------------------------------------------------------
WITH c AS (
  INSERT INTO commodities (nama, nama_ilmiah, deskripsi, foto_url,
    ch_min, ch_max, suhu_min, suhu_max, kelembaban_min, kelembaban_max, air_tanah_min,
    waktu_tanam, durasi_panen, jarak_tanam, info_pupuk, hama, risiko, musim)
  VALUES ('Petsai/Sawi', 'Brassica rapa',
    'Sayuran daun bersiklus sangat pendek yang dapat dipanen dalam 1-1,5 bulan. Cocok ditanam berulang sepanjang tahun.',
    '/sawi.webp',
    100, 200, 22, 32, 70, 85, 65,
    'Sepanjang tahun', '30-45 hari', '20 x 20 cm',
    'Urea 100 kg/ha, pupuk kandang 10 ton/ha. Banyak butuh nitrogen untuk daun.',
    'Ulat daun (Plutella xylostella), kutu daun, busuk lunak',
    'Curah hujan ekstrem merusak daun; kekeringan membuat daun keras dan pahit.',
    'sepanjang_tahun')
  RETURNING id
)
INSERT INTO library (commodity_id, konten_detail, tips_budidaya, hama_umum, cara_pencegahan)
SELECT id,
  '<p>Petsai/sawi adalah sayuran daun dengan siklus tercepat di antara 10 komoditas fokus, hanya 30-45 hari sampai panen. Karena pendek, tanaman ini dapat ditanam berulang sepanjang tahun selama kebutuhan air terpenuhi (Bulan Lembab).</p><p>Varietas dataran rendah yang adaptif panas cocok dengan iklim Demak yang hangat (22-32&deg;C).</p>',
  '<ul><li>Pilih varietas dataran rendah yang toleran suhu tinggi.</li><li>Olah tanah gembur dan kaya bahan organik.</li><li>Siram rutin pagi dan sore agar daun tetap renyah.</li><li>Panen tepat waktu sebelum daun menua agar tidak pahit.</li></ul>',
  '<p>Ulat daun kubis (<em>Plutella xylostella</em>), kutu daun, dan penyakit busuk lunak (<em>soft rot</em>).</p>',
  '<ul><li>Gunakan jaring/net untuk menghalangi ngengat bertelur.</li><li>Pungut ulat secara manual pada skala kecil.</li><li>Jaga drainase agar tidak terjadi busuk lunak.</li><li>Rotasi dengan tanaman non-Brassica.</li></ul>'
FROM c;

-- 8. MELON --------------------------------------------------------------------
WITH c AS (
  INSERT INTO commodities (nama, nama_ilmiah, deskripsi, foto_url,
    ch_min, ch_max, suhu_min, suhu_max, kelembaban_min, kelembaban_max, air_tanah_min,
    waktu_tanam, durasi_panen, jarak_tanam, info_pupuk, hama, risiko, musim)
  VALUES ('Melon', 'Cucumis melo',
    'Buah semusim premium musim kemarau. Membutuhkan penyinaran penuh dan kondisi kering saat pematangan untuk rasa manis maksimal.',
    '/melon.webp',
    40, 100, 25, 35, 55, 75, 50,
    'Pertengahan kemarau', '60-75 hari', '60 x 50 cm',
    'NPK 16-16-16 bertahap, kalsium dan kalium tinggi saat pembentukan buah.',
    'Kutu daun, lalat buah, embun tepung, layu fusarium',
    'Kelembapan tinggi menyebabkan jamur; hujan saat matang menurunkan kadar gula.',
    'kemarau')
  RETURNING id
)
INSERT INTO library (commodity_id, konten_detail, tips_budidaya, hama_umum, cara_pencegahan)
SELECT id,
  '<p>Melon adalah buah premium yang menuntut penyinaran penuh dan kondisi kering (Bulan Kering) saat pembungaan hingga pematangan. Hanya fase awal pertumbuhan yang masih menoleransi Bulan Lembab.</p><p>Dengan harga jual tinggi, melon menjadi pilihan menarik untuk ditanam pada musim kemarau di lahan berdrainase baik.</p>',
  '<ul><li>Gunakan mulsa plastik dan ajir/turus atau sistem lanjaran.</li><li>Seleksi buah 1 per tanaman untuk ukuran dan kualitas maksimal.</li><li>Tingkatkan kalium dan kurangi air menjelang panen untuk kadar gula tinggi.</li><li>Panen saat jaring kulit penuh dan tangkai mudah lepas (full slip).</li></ul>',
  '<p>Kutu daun, lalat buah, penyakit embun tepung, dan layu fusarium.</p>',
  '<ul><li>Pasang perangkap lalat buah dan likat kuning.</li><li>Gunakan benih tahan penyakit dan rotasi tanaman.</li><li>Jaga sirkulasi udara dengan jarak tanam memadai.</li><li>Sanitasi gulma dan sisa tanaman terinfeksi.</li></ul>'
FROM c;

-- 9. CABAI RAWIT --------------------------------------------------------------
WITH c AS (
  INSERT INTO commodities (nama, nama_ilmiah, deskripsi, foto_url,
    ch_min, ch_max, suhu_min, suhu_max, kelembaban_min, kelembaban_max, air_tanah_min,
    waktu_tanam, durasi_panen, jarak_tanam, info_pupuk, hama, risiko, musim)
  VALUES ('Cabai Rawit', 'Capsicum frutescens',
    'Cabai bercita rasa pedas tinggi dengan masa panen panjang dan lebih toleran terhadap cuaca dibanding cabai besar.',
    '/cabai.webp',
    100, 200, 24, 30, 65, 80, 55,
    'Sepanjang tahun', '90-110 hari (mulai panen)', '50 x 50 cm',
    'NPK 16-16-16, pupuk kandang 20 ton/ha, tambahan KNO3 saat pembuahan.',
    'Trips, kutu kebul, lalat buah, antraknosa',
    'Virus kuning yang ditularkan kutu kebul dapat menggagalkan panen.',
    'sepanjang_tahun')
  RETURNING id
)
INSERT INTO library (commodity_id, konten_detail, tips_budidaya, hama_umum, cara_pencegahan)
SELECT id,
  '<p>Cabai rawit lebih tahan terhadap variasi cuaca dibanding cabai besar dan memiliki masa panen yang panjang. Tanaman ini membutuhkan air yang konsisten (Bulan Lembab) sepanjang siklus tumbuhnya, dengan suhu optimal 24-30&deg;C.</p><p>Permintaan pasar yang stabil membuat cabai rawit menjadi komoditas andalan petani sepanjang tahun.</p>',
  '<ul><li>Semai dan pindah tanam bibit umur 30-35 hari.</li><li>Pasang ajir untuk menopang tanaman yang berbuah lebat.</li><li>Lakukan perempelan tunas air di bawah cabang utama.</li><li>Panen rutin untuk merangsang pembungaan berkelanjutan.</li></ul>',
  '<p>Trips, kutu kebul pembawa virus kuning (gemini), lalat buah, dan antraknosa.</p>',
  '<ul><li>Gunakan mulsa perak dan perangkap likat kuning.</li><li>Cabut tanaman bergejala virus untuk mencegah penyebaran.</li><li>Konservasi musuh alami dan semprot selektif.</li><li>Jaga kebersihan kebun dari gulma inang virus.</li></ul>'
FROM c;

-- 10. TERUNG ------------------------------------------------------------------
WITH c AS (
  INSERT INTO commodities (nama, nama_ilmiah, deskripsi, foto_url,
    ch_min, ch_max, suhu_min, suhu_max, kelembaban_min, kelembaban_max, air_tanah_min,
    waktu_tanam, durasi_panen, jarak_tanam, info_pupuk, hama, risiko, musim)
  VALUES ('Terung', 'Solanum melongena',
    'Sayuran buah yang produktif dan mudah dibudidayakan, dengan masa panen panjang dan adaptasi luas terhadap iklim.',
    '/terung.webp',
    100, 200, 22, 30, 65, 80, 55,
    'Sepanjang tahun', '70-80 hari (mulai panen)', '60 x 50 cm',
    'NPK 16-16-16, pupuk kandang 15-20 ton/ha, pupuk susulan tiap 2 minggu.',
    'Kumbang epilachna, kutu kebul, lalat buah, layu bakteri',
    'Layu bakteri pada tanah lembap dan serangan lalat buah menurunkan kualitas.',
    'sepanjang_tahun')
  RETURNING id
)
INSERT INTO library (commodity_id, konten_detail, tips_budidaya, hama_umum, cara_pencegahan)
SELECT id,
  '<p>Terung adalah sayuran buah yang produktif dengan masa panen panjang dan adaptasi luas. Fase vegetatif hingga pembungaan membutuhkan Bulan Lembab, sedangkan fase akhir panen menoleransi kondisi lebih kering.</p><p>Tanaman ini relatif mudah dibudidayakan sehingga cocok bagi petani pemula maupun skala komersial.</p>',
  '<ul><li>Semai bibit 30 hari sebelum pindah tanam.</li><li>Pasang ajir agar tanaman tidak rebah saat berbuah lebat.</li><li>Lakukan pemangkasan tunas dan daun tua untuk sirkulasi udara.</li><li>Panen saat buah masih mengkilap sebelum biji mengeras.</li></ul>',
  '<p>Kumbang daun (<em>Epilachna</em>), kutu kebul, lalat buah, dan penyakit layu bakteri (<em>Ralstonia</em>).</p>',
  '<ul><li>Rotasi tanaman dengan non-Solanaceae untuk menekan layu bakteri.</li><li>Gunakan bibit sehat dan tanah berdrainase baik.</li><li>Pasang perangkap lalat buah.</li><li>Sanitasi buah terserang dan gulma di sekitar tanaman.</li></ul>'
FROM c;
