# Aplikasi Sambat Untid

> *Platform Aspirasi dan Keluh Kesah Mahasiswa Universitas Tidar (Untid) yang Aman, Transparan, dan Terstruktur.*

[![CI/CD Pipeline](https://github.com/MaiAphrodite/AplikasiSambatUntid/actions/workflows/ci.yml/badge.svg)](https://github.com/MaiAphrodite/AplikasiSambatUntid/actions/workflows/ci.yml)

**Aplikasi Sambat Untid** adalah solusi modern berarsitektur *microservices* untuk menampung, melacak, dan menindaklanjuti keluhan mahasiswa. Menggabungkan gaya diskusi berbasis *thread* (ala Reddit) dengan fitur pemantauan isu (ala GitHub Issues) dan estetika premium bernuansa *Dark Newspaper*, aplikasi ini mendorong transparansi kampus tanpa mengorbankan privasi pelapor.

---

## Daftar Isi

- [Fitur Utama (The Pitch)](#fitur-utama-the-pitch)
- [Arsitektur & Teknologi](#arsitektur--teknologi-tech-stack)
- [Dokumentasi API](#dokumentasi-api)
- [Cara Deploy (Production)](#cara-deploy-production)
- [Development (Lokal)](#development-lokal)
- [Environment Variables](#environment-variables)
- [Monitoring & Logging](#monitoring--logging)
- [CI/CD Pipeline](#cicd-pipeline)
- [Troubleshooting](#troubleshooting)
- [Kontribusi](#kontribusi)
- [Lisensi](#lisensi)

---

## Fitur Utama (The Pitch)

| Fitur | Deskripsi |
|---|---|
| **Anonymity Switch** | Pelapor dapat mengaktifkan mode Anonim saat membuat keluhan atau membalas komentar. Identitas terlindungi di UI, namun tetap tercatat secara internal untuk mencegah penyalahgunaan. |
| **Upvote / Downvote** | Keluhan yang banyak didukung otomatis naik prioritas. Mekanisme eskalasi otomatis memastikan isu populer segera ditangani. |
| **Status Tracking** | Setiap Rant memiliki status (`OPEN` → `ACKNOWLEDGED` → `RESOLVED` → `CLOSED`) yang terlihat oleh semua pengguna. |
| **Kategori Keluhan** | Lima kategori: `akademik`, `fasilitas`, `dosen`, `organisasi`, `lainnya` — memudahkan filtrasi dan penanganan. |
| **Threaded Comments** | Komentar bersarang (nested/recursive) dengan kedalaman maksimal 3 level indentasi. Thread panjang dapat di-collapse. |
| **Profil Pengguna** | Setiap pengguna memiliki halaman profil yang menampilkan riwayat keluhan dan statistik. |
| **Role-Based Access** | Dua peran: `student` (pengguna biasa) dan `admin` (dapat mengubah status keluhan dan menghapus konten). |

---

## Arsitektur & Teknologi (Tech Stack)

Aplikasi ini menggunakan pendekatan **Microservices** murni yang semuanya dikemas dalam Docker Containers dan diorganisir melalui Docker Compose.

```text
┌─────────────────────────────────────────────────────────────────┐
│                        NGINX Gateway (:80)                      │
│         Reverse Proxy — Routing, Rate Limiting, Security        │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│   /api/users │  /api/rants  │ /api/inter…  │     / (SPA)        │
│      ↓       │      ↓       │      ↓       │        ↓           │
│ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │ ┌──────────────┐  │
│ │  User    │ │ │  Rant    │ │ │Interact° │ │ │   Frontend   │  │
│ │ Service  │ │ │ Service  │ │ │ Service  │ │ │  Svelte 5    │  │
│ │  :3001   │ │ │  :3002   │ │ │  :3003   │ │ │  (SPA)       │  │
│ └────┬─────┘ │ └────┬─────┘ │ └────┬─────┘ │ └──────────────┘  │
│      │       │      │       │      │       │                    │
│      └───────┴──────┴───────┴──────┘       │                    │
│                     ↓                       │                    │
│            ┌───────────────┐                │                    │
│            │  PostgreSQL   │                │                    │
│            │  3 Databases  │                │                    │
│            └───────────────┘                │                    │
└─────────────────────────────────────────────────────────────────┘
                      ↕ Docker Socket (read-only)
               ┌──────────────┐
               │   Dozzle     │
               │ Log Viewer   │
               │   :8080      │
               └──────────────┘
```

### Stack Teknologi

| Layer | Teknologi | Versi |
|---|---|---|
| Frontend | Svelte 5 (Runes) + Vite | 5.x |
| Styling | Vanilla CSS (Dark Mode Newspaper) | — |
| Backend Runtime | Bun | Latest |
| Backend Framework | Elysia.js | 1.2+ |
| Database | PostgreSQL (Alpine) | 16 |
| ORM | Drizzle ORM | 0.40+ |
| Auth | JWT (jose library) | 6.x |
| Gateway | NGINX | Latest |
| Logging | Dozzle | Latest |
| CI/CD | GitHub Actions → GHCR | — |

---

## Dokumentasi API

Semua endpoint API diakses melalui NGINX reverse proxy di port `80`.

### User Service (`/api/users`)

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `POST` | `/api/users/register` | No | Registrasi pengguna baru |
| `POST` | `/api/users/login` | No | Login dan dapatkan JWT token |
| `GET` | `/api/users/me` | Yes | Profil pengguna yang sedang login |
| `PUT` | `/api/users/me` | Yes | Update profil (display name) |
| `GET` | `/api/users/profile/:id` | No | Lihat profil pengguna publik |

### Rant Service (`/api/rants`)

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `GET` | `/api/rants` | No | Daftar semua keluhan (dengan filter & sorting) |
| `GET` | `/api/rants/:id` | No | Detail keluhan spesifik |
| `POST` | `/api/rants` | Yes | Buat keluhan baru |
| `PUT` | `/api/rants/:id` | Yes | Edit keluhan (pemilik) |
| `DELETE` | `/api/rants/:id` | Yes | Hapus keluhan (pemilik / admin) |
| `PATCH` | `/api/rants/:id/status` | Admin | Ubah status keluhan |

**Query Parameters untuk `GET /api/rants`:**
- `category` — Filter berdasarkan kategori (`akademik`, `fasilitas`, `dosen`, `organisasi`, `lainnya`)
- `status` — Filter berdasarkan status (`open`, `acknowledged`, `resolved`, `closed`)
- `sort` — Urutan (`newest`, `oldest`, `most_upvoted`)

### Interaction Service (`/api/interactions`)

| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `POST` | `/api/interactions/votes` | Yes | Beri vote (upvote/downvote) pada keluhan |
| `DELETE` | `/api/interactions/votes/:rantId` | Yes | Hapus vote |
| `GET` | `/api/interactions/votes/:rantId` | Yes | Cek status vote pengguna |
| `GET` | `/api/interactions/comments/:rantId` | No | Daftar komentar pada keluhan |
| `POST` | `/api/interactions/comments` | Yes | Tambah komentar (opsional: `parentId` untuk reply) |
| `DELETE` | `/api/interactions/comments/:id` | Yes | Hapus komentar (pemilik / admin) |

**Header Autentikasi:**
```
Authorization: Bearer <jwt_token>
```

---

## Cara Deploy (Production)

### Prasyarat
- Server Ubuntu/Debian dengan minimal **1GB RAM**
- Akses root atau sudo

### One-Line Bootstrap

SSH ke server Anda, lalu jalankan:

```bash
curl -sSL https://raw.githubusercontent.com/MaiAphrodite/AplikasiSambatUntid/main/install.sh | bash
```

Skrip ini otomatis melakukan:
1. Update sistem dan install dependensi (`curl`, `git`, `ufw`, `openssl`)
2. Konfigurasi UFW Firewall (port 22, 80, 443, 8080 — dengan Docker `FORWARD` policy fix)
3. Install Docker Engine dan Docker Compose plugin
4. Clone repositori dari GitHub
5. Generate password kriptografis acak untuk database, JWT, dan Dozzle
6. Build dan jalankan seluruh stack via `docker compose up -d --build`

> **Peringatan**: Skrip ini mengaktifkan UFW dan hanya membuka port 22 (SSH), 80 (HTTP), 443 (HTTPS), dan 8080 (Dozzle). Pastikan server Anda menggunakan port SSH standar (22).

### Startup Script (DigitalOcean / Cloud Provider)

Jika Anda menggunakan fitur "Startup Scripts" atau "User Data" pada cloud provider:

```bash
#!/bin/bash
exec > /var/log/sambat-bootstrap.log 2>&1
curl -sSL https://raw.githubusercontent.com/MaiAphrodite/AplikasiSambatUntid/main/install.sh | bash
```

### Update ke Versi Terbaru

```bash
cd AplikasiSambatUntid
git pull origin main
docker compose up -d --build
```

---

## Development (Lokal)

### Prasyarat

| Tool | Versi | Install |
|---|---|---|
| Bun | Latest | `curl -fsSL https://bun.sh/install \| bash` |
| Docker | 24+ | `curl -fsSL https://get.docker.com \| bash` |
| Git | 2.x+ | `sudo apt install git` |

### Langkah-langkah

**1. Clone dan Setup Environment**
```bash
git clone https://github.com/MaiAphrodite/AplikasiSambatUntid.git
cd AplikasiSambatUntid
cp .env.example .env
```

**2. Jalankan Database**
```bash
docker compose up -d postgres
```

**3. Jalankan Semua Layanan**

Anda memerlukan 4 terminal terpisah:

```bash
# Terminal 1 — Frontend (http://localhost:5173)
cd frontend && bun install && bun run dev

# Terminal 2 — User Service (:3001)
cd services/user-service && bun install && bun run dev

# Terminal 3 — Rant Service (:3002)
cd services/rant-service && bun install && bun run dev

# Terminal 4 — Interaction Service (:3003)
cd services/interaction-service && bun install && bun run dev
```

**4. Type Checking (Doctor)**

Pastikan kode bebas dari error sebelum commit:

```bash
cd frontend && bun run check
cd services/user-service && bun run check
cd services/rant-service && bun run check
cd services/interaction-service && bun run check
```

---

## Environment Variables

| Variable | Deskripsi | Default |
|---|---|---|
| `DB_PASSWORD` | Password untuk PostgreSQL | `sambat_secret_2026` |
| `JWT_SECRET` | Secret key untuk signing JWT token | `supersecret_jwt_key_change_in_production` |
| `ESCALATION_THRESHOLD` | Jumlah upvote untuk eskalasi otomatis | `10` |
| `DOZZLE_USERNAME` | Username untuk login ke Dozzle dashboard | `admin_dozzle` |
| `DOZZLE_PASSWORD` | Password untuk login ke Dozzle dashboard | `dozzle_password_here` |

> **Jangan pernah** gunakan nilai default di production. Script `install.sh` otomatis men-generate nilai acak yang aman.

---

## Monitoring & Logging

### Dozzle — Real-time Log Viewer

Aplikasi ini menggunakan **Dozzle** sebagai log viewer berbasis web yang ringan (~15MB RAM). Dozzle membaca stream `stdout`/`stderr` dari semua container melalui Docker socket secara read-only.

**Akses:** `http://<server-ip>:8080`

**Fitur:**
- Live-streaming log dari semua container
- Pencarian dan filter berbasis regex
- Tidak memerlukan database atau agen tambahan

---

## CI/CD Pipeline

Pipeline otomatis berjalan via **GitHub Actions** pada setiap push ke `main`:

```text
Push ke main
    │
    ▼
┌──────────────────────┐
│  Doctor / Code Check  │  ← svelte-check + tsc --noEmit (semua service)
└──────────┬───────────┘
           │ (jika lulus)
           ▼
┌──────────────────────┐
│  Build & Push GHCR   │  ← Matrix build: frontend, user, rant, interaction
└──────────────────────┘
```

**Image Registry:** `ghcr.io/maiaphrodite/aplikasisambatuntid-<service>:latest`

---

## Troubleshooting

### Website tidak bisa diakses setelah deploy

**Gejala:** Browser timeout saat mengakses `http://<ip>`.

**Penyebab:** UFW `DEFAULT_FORWARD_POLICY` diset `DROP`, memblokir Docker port forwarding.

**Solusi:** Script `install.sh` terbaru sudah menangani ini otomatis. Jika Anda deploy dengan versi lama:
```bash
sudo sed -i 's/DEFAULT_FORWARD_POLICY="DROP"/DEFAULT_FORWARD_POLICY="ACCEPT"/' /etc/default/ufw
sudo ufw reload
```

### Container keluar terus-menerus (restart loop)

**Periksa log:**
```bash
docker compose logs -f --tail 50
```

**Penyebab umum:**
- Database belum siap → pastikan healthcheck PostgreSQL berjalan
- `.env` tidak ada atau kosong → jalankan ulang `install.sh`

### Port 8080 (Dozzle) tidak bisa diakses

```bash
sudo ufw allow 8080/tcp
sudo ufw reload
```

---

## Kontribusi

1. Fork repositori ini
2. Buat branch fitur (`git checkout -b feat/fitur-baru`)
3. Pastikan semua doctor check lulus (`bun run check` di setiap package)
4. Commit dengan format [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` untuk fitur baru
   - `fix:` untuk perbaikan bug
   - `docs:` untuk dokumentasi
   - `ci:` untuk perubahan pipeline
5. Buat Pull Request ke `main`

### Struktur Repositori

```text
.
├── .github/workflows/ci.yml     # GitHub Actions CI/CD pipeline
├── frontend/                     # Svelte 5 SPA
│   ├── src/
│   │   ├── lib/
│   │   │   ├── api/client.ts         # HTTP client wrapper
│   │   │   ├── components/           # Reusable UI components
│   │   │   │   ├── CategoryBadge.svelte
│   │   │   │   ├── CommentThread.svelte
│   │   │   │   ├── Navbar.svelte
│   │   │   │   ├── RantCard.svelte
│   │   │   │   ├── StatusBadge.svelte
│   │   │   │   └── VoteButton.svelte
│   │   │   ├── router.svelte.ts      # Hash-based SPA router
│   │   │   └── stores/auth.svelte.ts # JWT auth state
│   │   ├── pages/                    # Route pages
│   │   │   ├── Home.svelte
│   │   │   ├── Login.svelte
│   │   │   ├── CreateRant.svelte
│   │   │   ├── RantPage.svelte
│   │   │   └── Profile.svelte
│   │   └── App.svelte
│   ├── Dockerfile
│   └── nginx.conf                    # Frontend static serve config
├── services/
│   ├── user-service/
│   │   ├── src/
│   │   │   ├── db/                   # Drizzle schema & connection
│   │   │   ├── routes/               # Auth, profile, internal
│   │   │   ├── middleware/auth.ts
│   │   │   └── index.ts
│   │   └── Dockerfile
│   ├── rant-service/
│   │   ├── src/
│   │   │   ├── db/
│   │   │   ├── routes/               # CRUD rants, internal
│   │   │   ├── middleware/auth.ts
│   │   │   └── index.ts
│   │   └── Dockerfile
│   └── interaction-service/
│       ├── src/
│       │   ├── db/
│       │   ├── routes/               # Comments, votes
│       │   ├── middleware/auth.ts
│       │   ├── utils/escalation.ts   # Auto-escalation logic
│       │   └── index.ts
│       └── Dockerfile
├── nginx/
│   ├── nginx.conf                    # Reverse proxy rules
│   └── Dockerfile
├── docker-compose.yml
├── init-db.sql                       # Database schema bootstrap
├── install.sh                        # One-click server setup
├── .env.example
└── README.md
```

---

## Lisensi

MIT License — Dibangun untuk masa depan kampus yang lebih baik.