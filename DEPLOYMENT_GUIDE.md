# Panduan Lengkap Deploy Aplikasi BelajarYuk ke Vercel & Supabase

Aplikasi **BelajarYuk** dirancang khusus untuk siswa Sekolah Dasar (SD) Kelas 1-6 dengan Kurikulum Merdeka, dilengkapi role-based access (Admin, Guru, Siswa), AI Task Generator berbasis Gemini 3.8 Flash, serta interaksi real-time Supabase.

---

## 1. Persiapan Database di Supabase

1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan buat proyek baru (*New Project*).
2. Beri nama proyek, misalnya: `belajaryuk-sd`.
3. Setelah database selesai dibuat:
   - Masuk ke menu **SQL Editor** di sidebar kiri.
   - Klik **New Query**.
   - Buka file `supabase-schema.sql` dari repositori ini, salin seluruh isinya, tempel ke SQL Editor Supabase, lalu klik **Run**.
4. Skrip tersebut secara otomatis akan:
   - Membuat seluruh tabel (`profiles`, `rombel`, `mapel`, `materi`, `tugas`, `soal`, `pengumpulan`, `notifikasi`, `chat_kelas`, `lencana`, dll).
   - Mengaktifkan **Row Level Security (RLS)** dengan policy yang mengisolasi data siswa.
   - Mengaktifkan **Supabase Realtime** pada tabel `pengumpulan`, `notifikasi`, `chat_kelas`, `materi`, dan `tugas`.
   - Menambahkan data awal (Seed Data): 1 Admin, 2 Guru, 6 Siswa SD, kelas rombel 1A-6A, mata pelajaran Kurikulum Merdeka, materi contoh, dan kuis interaktif.
5. Dapatkan kredensial API:
   - Masuk ke **Project Settings** > **API**.
   - Salin **Project URL** (ini adalah `VITE_SUPABASE_URL`).
   - Salin **anon public key** (ini adalah `VITE_SUPABASE_ANON_KEY`).

---

## 2. Dapatkan Gemini API Key

1. Buka [Google AI Studio](https://aistudio.google.com/).
2. Buat API Key baru.
3. Simpan key ini sebagai `GEMINI_API_KEY`. (Digunakan server-side di `/api/generate-task.ts` tanpa pernah bocor ke browser client).

---

## 3. Deploy ke Vercel

### Metode A: Melalui Vercel Dashboard (Rekomendasi)
1. Push kode aplikasi BelajarYuk ini ke repositori GitHub atau GitLab Anda.
2. Buka [Vercel Dashboard](https://vercel.com/) dan klik **Add New...** > **Project**.
3. Hubungkan repositori GitHub Anda dan pilih repositori `BelajarYuk`.
4. Konfigurasi Project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Buka bagian **Environment Variables** dan tambahkan variabel berikut:
   | Key | Value | Keterangan |
   |-----|-------|------------|
   | `GEMINI_API_KEY` | `AIzaSy...` | API Key dari Google AI Studio |
   | `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` | URL Project Supabase Anda |
   | `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | Anon Key Supabase Anda |
6. Klik tombol **Deploy**.
7. Tunggu beberapa saat hingga proses build selesai. Vercel akan otomatis mendeteksi folder `/api/generate-task.ts` sebagai Vercel Serverless Function!

### Metode B: Melalui Vercel CLI
```bash
npm install -g vercel
vercel login
vercel
# Masukkan Environment Variables saat diminta atau set di dashboard Vercel
```

---

## 🛠️ Solusi Eror: `vite: perintah tidak ditemukan` [BUILD_UTILS_SPAWN_127]

Jika saat deploy ke Vercel Anda mengalami eror:
```
sh: baris 1: vite: perintah tidak ditemukan
Kesalahan: [BUILD_UTILS_SPAWN_127] Perintah "vite build"
```

**Penyebab:**
Vercel melewatkan proses instalasi dependensi (`npm install`) atau terjadi konflik dependensi (peer dependencies), sehingga paket `vite` belum terpasang saat script `vite build` dijalankan.

**Solusi yang telah dikonfigurasi dalam repositori ini:**
1. **File `vercel.json`**: Menetapkan `installCommand: "npm install --legacy-peer-deps"` dan `buildCommand: "npm run build"` secara eksplisit.
2. **File `.npmrc`**: Menambahkan opsi `legacy-peer-deps=true` agar npm tidak gagal saat memeriksa dependensi.
3. **File `package-lock.json`**: Lockfile standar npm telah dibuat agar Vercel mendeteksi dependensi dengan tepat.

**Langkah yang harus Anda lakukan:**
1. Lakukan `git add .`, `git commit -m "fix vercel deployment config"`, dan `git push origin main`.
2. Buka dashboard Vercel pada proyek Anda:
   - Masuk ke menu **Settings** > **General** > **Build & Development Settings**.
   - Pastikan **Framework Preset** bernilai `Vite`.
   - Pada bagian **Install Command**, pastikan aktif atau diatur ke: `npm install --legacy-peer-deps` (atau biarkan default yang membaca `vercel.json`).
3. Masuk ke tab **Deployments** di Vercel, klik titik tiga `...` pada deployment terakhir, lalu pilih **Redeploy** (centang *Clear Build Cache* jika tersedia).


---

## 4. Akun Demo Bawaan (Seed Data)

Setelah database dijalankan atau menggunakan mode offline bawaan, Anda dapat langsung mencoba login dengan akun berikut:

### 👑 Admin
- **Email**: `admin@belajaryuk.id`
- **Password**: `admin123`
- **Fitur**: Dashboard sekolah, CRUD akun guru & siswa, penetapan wali kelas & mapel, statistik dan ekspor rekap nilai.

### 👩‍🏫 Guru
- **Email**: `guru.sri@belajaryuk.id` (Wali Kelas 1A, Pengampu Kelas 1 & 3)
- **Email**: `guru.ahmad@belajaryuk.id` (Wali Kelas 5A, Pengampu Kelas 4 & 5)
- **Password**: `guru123`
- **Fitur**: Upload materi pembelajaran, buat kuis, **AI Task Generator (Gemini)**, koreksi & feedback nilai, chat kelas.

### 🎒 Siswa (Login Mudah: Cukup NIS + Password)
- **Kelas 1 (Fase A - UI Khusus Ikon Besar & Sederhana)**:
  - NIS: `1001` | Password: `budi123` (Budi Santoso)
  - NIS: `1002` | Password: `siti123` (Siti Aisyah)
- **Kelas 3 (Fase B)**:
  - NIS: `3001` | Password: `edo123` (Edo Pratama)
  - NIS: `3002` | Password: `dayu123` (Dayu Wijaya)
- **Kelas 5 (Fase C)**:
  - NIS: `5001` | Password: `lani123` (Lani Melani)
  - NIS: `5002` | Password: `udin123` (Udin Setiawan)

---

## 5. Fitur Unggulan Kurikulum Merdeka
- **Fase A (Kelas 1-2)**: Soal konkret kalimat pendek, 3 opsi pilihan ganda (A, B, C), penilaian ramah dengan bintang (1-3 ⭐) dan deskripsi capaian.
- **Fase B (Kelas 3-4)**: Pemahaman bacaan kontekstual, 4 opsi pilihan ganda (A, B, C, D), mulai materi IPAS.
- **Fase C (Kelas 5-6)**: Soal berbasis penalaran / HOTS ringan, literasi dan numerasi praktis.
- **Chat Kelas Termoderasi**: Diskusi kelas real-time dengan filter kata kasar untuk keselamatan anak SD.
- **Gamifikasi Positif**: Bintang terkumpul, streak belajar harian, lencana penghargaan tanpa sistem peringkat yang membebani mental siswa.
