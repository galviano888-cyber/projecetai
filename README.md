# AgroDemak - Sistem Kalender Tanam Cerdas

Sistem pakar berbasis data iklim untuk rekomendasi komoditas pertanian Kabupaten Demak, Jawa Tengah.

## Tech Stack

- **Frontend**: React 19 + Vite + TypeScript
- **Styling**: Tailwind CSS + Shadcn/UI
- **Database & Auth**: Supabase
- **Grafik**: Recharts
- **Rich Text**: Tiptap
- **CSV Parser**: Papaparse
- **Icons**: Lucide React
- **Deploy**: Vercel

## Setup

### 1. Clone & Install

```bash
git clone https://github.com/galviano888-cyber/projecetai.git
cd projecetai
npm install
```

### 2. Konfigurasi Environment

```bash
cp .env.example .env.local
```

Isi `.env.local` dengan credentials dari Supabase Dashboard > Project Settings > API:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Setup Database Supabase

1. Buka [Supabase Dashboard](https://supabase.com) > SQL Editor
2. Jalankan `supabase_schema.sql` untuk membuat tabel dan seed data
3. Jika tabel sudah ada, jalankan `supabase_update_commodities.sql` untuk update parameter syarat tumbuh

### 4. Setup Supabase Storage

1. Buka Supabase Dashboard > Storage
2. Buat bucket baru bernama `agrodemak-images`
3. Set bucket visibility ke **Public**
4. Tambah policy: Allow public SELECT dan authenticated INSERT/DELETE

### 5. Buat Akun Admin

1. Buka Supabase Dashboard > Authentication > Users
2. Klik **Add user** > **Create new user**
3. Gunakan email dan password untuk login ke `/admin/login`

### 6. Jalankan Development Server

```bash
npm run dev
```

Buka `http://localhost:5173`

## Struktur Halaman

| Route | Deskripsi |
|---|---|
| `/` | Landing page + dashboard iklim + rekomendasi |
| `/library` | Grid komoditas dengan badge kecocokan |
| `/library/:id` | Detail komoditas + konten edukasi |
| `/admin/login` | Login admin |
| `/admin` | Dashboard admin |
| `/admin/iklim` | Input data iklim (manual & CSV) |
| `/admin/komoditas` | CRUD komoditas + upload foto |
| `/admin/library` | CRUD konten edukasi (rich text editor) |

## Sistem Pakar

Metode: **Forward Chaining + Weighted Certainty Factor**

Bobot parameter (Ritung et al., 2011 BBSDLP):
- Curah Hujan: 35%
- Suhu: 30%
- Kelembaban: 20%
- Air Tanah: 15%

Grade output: S1 (≥75%), S2 (50-74%), S3 (25-49%), N (<25%)

## Sumber Data

- Ritung, S. et al. (2011). *Petunjuk Teknis Evaluasi Lahan untuk Komoditas Pertanian*. BBSDLP, Badan Litbang Pertanian, Bogor.
- FAO AQUASTAT (2002). *Crop Water Requirements*. FAO Irrigation & Drainage Paper No. 56.
- IRRI Knowledge Bank (2023). *Climate and Soils - Rice Production*.
- Balitsa (2015, 2017). *Budidaya Cabai & Bawang Merah*. Balitbangtan, Lembang.
- Balitkabi (2016). *Deskripsi Varietas Unggul Kedelai*. Balitbangtan, Malang.
- AVRDC/WorldVeg (2003). *Cultural Practices for Kangkong*. Pub. No. 03-552.

## Deploy ke Vercel

1. Push ke GitHub
2. Import repo di [vercel.com](https://vercel.com)
3. Tambah environment variables di Vercel Dashboard > Settings > Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

---

&copy; 2026 Dikembangkan oleh Galih Oktaviano | AgroDemak
