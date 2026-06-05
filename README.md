# 📢 Aplikasi Sambat Untid

> *Platform Aspirasi dan Keluh Kesah Mahasiswa Universitas Tidar (Untid) yang Aman, Transparan, dan Terstruktur.*

**Aplikasi Sambat Untid** adalah solusi modern berarsitektur microservices untuk menampung, melacak, dan menindaklanjuti keluhan mahasiswa. Menggabungkan gaya diskusi berbasis *thread* (ala Reddit) dengan fitur pemantauan isu (ala GitHub Issues) dan estetika premium bernuansa *Newspaper/Editorial*, aplikasi ini mendorong transparansi kampus tanpa mengorbankan privasi pelapor.

---

## ✨ Nilai Jual & Fitur Utama (The Pitch)

1. **Privasi & Kebebasan Berpendapat (Anonymity Switch)**
   Setiap pelapor dapat menyalakan mode *Anonim* saat membuat *rant* (keluhan) atau membalas komentar. Identitas terlindungi, mahasiswa bisa jujur tanpa takut sanksi, namun sistem tetap mencatat kepemilikan secara internal untuk mencegah penyalahgunaan.
   
2. **Eskalasi Otomatis Berbasis Komunitas (Community-driven Resolution)**
   Aplikasi dilengkapi sistem *Upvote/Downvote*. Keluhan yang mendapatkan banyak dukungan akan otomatis mendapatkan status prioritas dan visibilitas lebih tinggi agar segera direspons oleh pihak BEM/Kampus.

3. **Status Penyelesaian Terbuka (Transparent Tracking)**
   Setiap *Rant* memiliki *Status Badge* (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`). Mahasiswa tidak perlu lagi bertanya-tanya *"Apakah keluhan saya didengar?"*.

4. **Arsitektur Enterprise yang Sangat Cepat (Microservices + Bun)**
   Dibangun dengan runtime **Bun** dan kerangka web **Elysia.js**, backend kami mampu menangani ribuan *request* per detik (RPS) dengan latensi sub-milidetik. Frontend menggunakan **Svelte 5** terbaru untuk memastikan pengalaman Single Page Application (SPA) yang instan dan mulus tanpa *loading screen* yang mengganggu.

---

## 🏗️ Arsitektur & Teknologi (Tech Stack)

Aplikasi ini menggunakan pendekatan **Microservices** murni yang semuanya dikemas dalam *Docker Containers*.

### 1. Frontend Layer
- **Framework**: Svelte 5 (Runes) + Vite.
- **Styling**: Vanilla CSS (CSS Variables) dengan estetika *Dark Mode Newspaper*.
- **State Management**: Reactive Svelte 5 `$state.raw` & `$derived`.

### 2. Microservices Backend (Bun + Elysia)
- **User Service** (`:3001`): Menangani registrasi, otentikasi JWT, dan pengelolaan profil.
- **Rant Service** (`:3002`): Menangani operasi CRUD untuk keluhan/aspirasi utama.
- **Interaction Service** (`:3003`): Menangani *threading* komentar bersarang (recursive) dan *voting*.

### 3. Database Layer
- **Database Utama**: PostgreSQL.
- **ORM**: Drizzle ORM (Type-safe & Blazing Fast).

### 4. Gateway Layer
- **Reverse Proxy**: NGINX (Merutekan lalu lintas `api/users`, `api/rants`, dll. ke layanan internal masing-masing).

---

## 📚 Dokumentasi (Documentations)

### Struktur Repositori
```text
.
├── frontend/                 # Svelte 5 SPA Application
├── nginx/                    # Konfigurasi Reverse Proxy NGINX
├── services/                 # Backend Microservices
│   ├── user-service/         # Autentikasi & Akun
│   ├── rant-service/         # Manajemen Keluhan
│   └── interaction-service/  # Komentar & Voting
├── docker-compose.yml        # Orkestrasi Kontainer Lokal
└── init-db.sql               # Skema Inisialisasi Database
```

### Panduan Desain (Code Conventions)
1. **Frontend**: Semua *state* menggunakan Rune Svelte 5. Jangan gunakan `$:` (Svelte 4 style). *Fetch* data dikelola secara paralel menggunakan `Promise.all` untuk performa tinggi. UI harus *accessible* (a11y) dan menggunakan elemen semantik (`<button>`, bukan `<div onclick>`).
2. **Backend**: Komunikasi antar microservice dilakukan dengan *internal fetch*. Autentikasi disalurkan lewat NGINX dan diverifikasi secara independen oleh *middleware* JWT di setiap layanan.

---

## 🚀 Cara Deploy (Deployment Guide)

Aplikasi ini dilengkapi dengan alur CI/CD otomatis (*GitHub Actions*) yang akan melakukan *build* dan *push* citra Docker ke **GitHub Container Registry (GHCR)** setiap kali ada *push* ke *branch* `main`.

### Prasyarat Deployment Server (Production)
- **Docker** dan **Docker Compose** V2.
- RAM minimal 1GB (Bun sangat efisien dalam penggunaan memori).

### Langkah-langkah Deploy via Docker Compose

1. **Clone Repositori di Server**
   ```bash
   git clone https://github.com/MaiAphrodite/AplikasiSambatUntid.git
   cd AplikasiSambatUntid
   ```

2. **Konfigurasi Environment**
   Salin berkas referensi ke berkas asli:
   ```bash
   cp .env.example .env
   ```
   Buka berkas `.env` dan ganti rahasia (*secrets*) terutama `JWT_SECRET` dan kata sandi database.

3. **Jalankan Aplikasi**
   Karena semuanya telah dikemas rapi dalam kontainer, proses *build* dan *run* bisa dilakukan dengan satu perintah:
   ```bash
   docker compose up -d --build
   ```

4. **Akses Aplikasi**
   - Frontend akan tersedia di `http://ip-server-anda:80`
   - NGINX secara otomatis menyalurkan semua panggilan `/api/*` ke backend.

### Alur CI/CD Otomatis
Jika Anda ingin menerapkan rilis terbaru dari GHCR di masa depan:
```bash
docker compose pull
docker compose up -d
```

---

## 💻 Development (Cara Menjalankan Secara Lokal)

Jika Anda ingin ikut berkontribusi pada pengembangan aplikasi, Anda membutuhkan **Bun** terinstal di sistem Anda.

1. **Jalankan Database via Docker**
   Hanya nyalakan kontainer postgres di latar belakang:
   ```bash
   docker compose up -d postgres
   ```

2. **Jalankan Semua Layanan Secara Bersamaan**
   Kami tidak menggunakan *monorepo manager* berat. Anda cukup masuk ke masing-masing *directory* atau menjalankan layanan spesifik:
   ```bash
   # Di Terminal 1 (Frontend)
   cd frontend && bun install && bun run dev

   # Di Terminal 2 (User Service)
   cd services/user-service && bun install && bun run dev

   # Di Terminal 3 (Rant Service)
   cd services/rant-service && bun install && bun run dev

   # Di Terminal 4 (Interaction Service)
   cd services/interaction-service && bun install && bun run dev
   ```

3. **Type Checking (Doctor)**
   Pastikan kode tidak rusak sebelum *push* ke repositori:
   ```bash
   # Validasi seluruh proyek
   cd frontend && bun run check
   cd services/user-service && bun run check
   cd services/rant-service && bun run check
   cd services/interaction-service && bun run check
   ```

---
*Dibangun dengan ❤️ untuk masa depan kampus yang lebih baik.*