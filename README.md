# Order Processing Engine (DevOps Seed Project)

[![CI Pipeline Status](https://github.com/tiers-undiknas/devops-group01-2026/actions/workflows/ci.yml/badge.svg)](https://github.com/tiers-undiknas/devops-group01-2026/actions/workflows/ci.yml)
[![Code Coverage](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/USER_PEMBUAT_GIST/GIST_ID/raw/coverage.json)](#10-laporan-praktikum-lab-3--lab-4-ci-pipeline)
[![Node.js](https://img.shields.io/badge/Node.js-v24_LTS-green.svg)](https://nodejs.org/)
[![Architecture](https://img.shields.io/badge/Architecture-Multi--Tier_%26_Multi--Process-blue.svg)](#1-arsitektur-sistem)
[![Observability](https://img.shields.io/badge/Observability-Prometheus_%2B_Pino-orange.svg)](#6-observabilitas-probes--telemetri)

**Order Processing Engine** adalah aplikasi acuan (_Seed Project_) berstandar _production-grade_ untuk praktikum mata kuliah DevOps (Semester 5). Aplikasi ini dirancang sebagai target nyata untuk rekayasa infrastruktur, kontainerisasi, automasi CI/CD, DevSecOps, Infrastructure as Code (IaC), dan Observabilitas modern.

Aplikasi ini menggunakan arsitektur **Multi-Tier & Multi-Process** dengan pemisahan tegas antara **Frontend SPA Dashboard** dan **Backend API & Background Worker**.

---

## 1. Arsitektur Sistem

```
                              ┌────────────────────────┐
                              │  Frontend Dashboard    │
                              │  (Vite SPA, Port 5173) │
                              └───────────┬────────────┘
                                          │ HTTP / JSON
                                          ▼
                              ┌────────────────────────┐
                              │    Backend API Server  │
                              │  (Express, Port 3000)  │
                              └─────┬────────────┬─────┘
                                    │            │
                     Jobs Enqueued  │            │ Relational Data
                     (BullMQ)       │            │
                                    ▼            ▼
                           ┌─────────────┐  ┌──────────────┐
                           │    Redis    │  │  PostgreSQL  │
                           │  (Port 6379)│  │ (Port 5432)  │
                           └──────┬──────┘  └──────┬───────┘
                                  │                │
                        Job Deq.  │                │ State Updates
                                  ▼                │
                           ┌─────────────┐         │
                           │ Background  │─────────┘
                           │   Worker    │
                           │ (Proc 2)    │
                           └─────────────┘
```

### Komponen & Multi-Process Model

1. **Frontend Tier (`frontend/`)**: SPA berbasis Vanilla JavaScript dan Vite. Menyediakan dashboard operasional, formulir transaksi pemesanan, inspeksi _audit trail_ event, serta _Chaos & SRE Console_. Port default `5173` (dilengkapi _reverse-proxy_ ke backend).
2. **Backend API Server (`backend/src/server.js`)**: Proses HTTP berbasis Node.js LTS v24 dan Express. Menangani validasi payload (Joi), _idempotent database transactions_, structured JSON logging dengan `x-request-id` (`pino` & `pino-http`), serta mengekspor metrik Prometheus. Port default `3000`.
3. **Background Worker (`backend/src/worker.js`)**: Proses terpisah (_standalone background consumer_) berbasis BullMQ. Mengambil pekerjaan dari Redis, memproses pembayaran & validasi inventaris, memperbarui status pesanan, dan mencatat _audit trail_ ke PostgreSQL.
4. **PostgreSQL 16+**: Menyimpan tabel `orders` dan riwayat status `order_events`.
5. **Redis 7+**: Antrean pesan (_message broker_) persisten untuk BullMQ.

---

## 2. Struktur Direktori Monorepo

```
seed-project-devops/
├── .env.example                        # Template environment variables
├── .gitignore
├── package.json                        # Root orchestrator scripts
├── README.md
│
├── backend/                            # Backend Service (API + Worker)
│   ├── package.json
│   ├── vitest.config.js                # Konfigurasi pengujian & target coverage
│   ├── src/
│   │   ├── app.js                      # Express App factory
│   │   ├── server.js                   # Entry point HTTP API Server
│   │   ├── worker.js                   # Entry point BullMQ Background Worker
│   │   ├── config/index.js             # Konfigurasi 12-Factor App
│   │   ├── db/                         # PostgreSQL migrations & runner
│   │   ├── infra/                      # database, redis, queue, logger
│   │   ├── middleware/                 # request-id, metrics, error-handler
│   │   ├── routes/                     # health, diagnostics, order
│   │   ├── services/                   # order.service, order-processor.service
│   │   └── telemetry/metrics.js        # Prometheus histograms/counters/gauges
│   └── tests/
│       ├── helpers/mocks.js
│       ├── unit/
│       └── integration/
│
└── frontend/                           # Frontend Service (Vite SPA)
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── src/                            # main.js, api.js, components/, pages/
    └── tests/api.test.js
```

---

## 3. Prasyarat Sistem

- **Node.js**: LTS v24.x atau lebih baru (`node --version`)
- **NPM**: v10.x atau lebih baru (`npm --version`)
- **PostgreSQL**: v16+ (lokal atau remote)
- **Redis**: v7+ (lokal atau remote)

---

## 4. Panduan Menjalankan Aplikasi

### Langkah 1: Instalasi Dependensi

```bash
npm run install:all
```

### Langkah 2: Konfigurasi Variabel Lingkungan

```bash
cp .env.example .env
```

```env
DATABASE_URL=postgresql://devops_user:devops_pass@localhost:5432/order_processing
REDIS_URL=redis://localhost:6379
```

### Langkah 3: Migrasi Database

```bash
cd backend
npm run db:migrate
cd ..
```

### Langkah 4: Menjalankan Komponen (Multi-Process)

Buka 3 terminal:

```bash
npm run dev:backend    # Terminal 1: API Server (Port 3000)
npm run dev:worker     # Terminal 2: Background Worker
npm run dev:frontend   # Terminal 3: Frontend (Port 5173)
```

Buka `http://localhost:5173` untuk mengakses dashboard.

---

## 5. Pengujian Otomatis & Code Coverage

Pengujian unit dan integrasi memakai **Vitest** dan **Supertest** dengan _mock_ terisolasi untuk PostgreSQL dan Redis.

```bash
npm test                  # seluruh pengujian
npm run test:coverage     # laporan coverage (text, JSON, HTML di backend/coverage/index.html)
```

---

## 6. Observabilitas, Probes & Telemetri

| Endpoint         | Method | Fungsi                                                          | Expected Status                                      |
| ---------------- | ------ | --------------------------------------------------------------- | ---------------------------------------------------- |
| `/healthz/live`  | `GET`  | Event loop responsif, memori heap V8 & uptime                   | `200 OK`                                             |
| `/healthz/ready` | `GET`  | Ping ke pool PostgreSQL dan koneksi Redis                       | `200 OK` (keduanya UP) / `503` (salah satu DOWN)     |

**Structured JSON Logging (Pino)**: setiap request membawa `x-request-id` (dari klien atau UUIDv4 otomatis).

```json
{
  "level": "info",
  "time": "2026-09-09T08:30:00.000Z",
  "service": "order-processing-engine",
  "env": "development",
  "reqId": "c3d5e2a1-8d2b-4b1f-998f-4f24ef789012",
  "msg": "POST /api/v1/orders completed with status 201"
}
```

**Prometheus Metrics (`GET /metrics`)**:

- `ope_http_request_duration_seconds`: histogram durasi HTTP request (method, route, status_code).
- `ope_orders_created_total`: counter order berhasil dibuat per status.
- `ope_order_processing_duration_seconds`: histogram durasi pemrosesan order di worker.
- `ope_queue_active_jobs`: gauge job aktif di antrean Redis.

---

## 7. Chaos & Incident Injection Endpoints (SRE Lab)

```bash
# CPU stress (loop SHA-256)
curl -X POST http://localhost:3000/api/v1/diagnostics/cpu-stress \
  -H "Content-Type: application/json" -d '{"durationMs": 3000}'

# Memory leak simulation
curl -X POST http://localhost:3000/api/v1/diagnostics/memory-leak \
  -H "Content-Type: application/json" -d '{"sizeMb": 50}'

# Process crash (process.exit(1))
curl -X POST http://localhost:3000/api/v1/diagnostics/crash
```

---

## 8. Ringkasan API Endpoints

| Method | Endpoint                          | Keterangan                                               |
| ------ | --------------------------------- | -------------------------------------------------------- |
| `GET`  | `/healthz/live`                   | Liveness probe Node.js                                   |
| `GET`  | `/healthz/ready`                  | Readiness probe (PostgreSQL & Redis)                     |
| `GET`  | `/metrics`                        | Prometheus metrics                                       |
| `POST` | `/api/v1/orders`                  | Membuat order baru                                       |
| `GET`  | `/api/v1/orders`                  | Daftar order dengan pagination & filter status           |
| `GET`  | `/api/v1/orders/:id`              | Detail order berdasarkan UUID                            |
| `GET`  | `/api/v1/orders/:id/events`       | Audit trail / riwayat status order                       |
| `POST` | `/api/v1/diagnostics/cpu-stress`  | Pemicu lonjakan CPU                                      |
| `POST` | `/api/v1/diagnostics/memory-leak` | Pemicu kebocoran memori                                  |
| `POST` | `/api/v1/diagnostics/crash`       | Pemicu crash proses                                      |

---

## 9. Menjalankan dengan Docker Compose

Prasyarat: Docker Desktop aktif.

```bash
cd deployments
cp .env.example .env
docker compose up -d --build
docker compose ps
```

| Layanan  | Alamat                              |
| -------- | ----------------------------------- |
| Frontend | http://localhost:8080               |
| API      | http://localhost:3000/healthz/ready |

Migrasi database (otomatis saat `api` start, perintah ini idempoten):

```bash
docker compose exec api npm run db:migrate
```

Melihat pemrosesan worker:

```bash
docker compose logs -f worker
```

Automated test (Vitest) di dalam kontainer, dari root repo:

```bash
docker build --target test -t ope-backend-test ./backend
docker run --rm ope-backend-test
```

Reset total termasuk data: `docker compose down -v`.

---

## 10. Laporan Praktikum Lab 3 & Lab 4 (CI Pipeline)

### Tahap 1: ESLint & Vitest Lokal (SC-01)

![SC-01](docs/screenshots/sc01-tahap1-local-vitest-coverage.png)

Hasil `npx eslint src tests` menghasilkan **0 error dan 4 warning** (`no-unused-vars`). Hasil `npx vitest run --coverage`: **10 test file dan 72 test lulus**, dengan coverage keseluruhan **97,11%** (Statements), 86,42% (Branch), 83,33% (Functions), 97,11% (Lines).

- `tests/unit/` menguji fungsi/modul secara terisolasi (config, service, middleware, infra) dengan mock database/Redis/queue.
- `tests/integration/` menguji endpoint API (health, diagnostics, orders, order-stats) lewat HTTP menggunakan Supertest, sehingga alur route, middleware, dan service diuji bersama.

### Tahap 2: Pipeline CI Paralel (SC-02)

![SC-02](docs/screenshots/sc02-tahap2-lab3-ci-passed.png)

Workflow GitHub Actions pada PR #17 (`feat(ci): add parallel backend and frontend github actions pipeline`) menjalankan dua job paralel yang keduanya hijau: **Backend Lint, Vitest, & Coverage Gate** dan **Frontend Test & Vite Production Build**.

Cara kerja cache: `actions/setup-node` dengan `cache: 'npm'` memakai hash `package-lock.json` sebagai kunci cache. Jika lock file tidak berubah, paket dipulihkan dari cache dan tidak diunduh ulang dari registry, sehingga `npm ci` lebih cepat.

### Tahap 3: Quality Gate & Badge (SC-03)

![SC-03](docs/screenshots/sc03-tahap3-lab4-badge-coverage.png)

Riwayat workflow **CI Quality Pipeline (Lab 3 & 4)** menunjukkan seluruh run hijau, baik pada branch fitur (`feat/ci-lint-setup`, `feat/badge-and-demo-gate`) maupun pada `main` setelah merge PR #17, #18, dan #19. Quality gate coverage 70% serta badge dinamis ditambahkan melalui PR #18.

### Tahap 4: Simulasi Kegagalan (SC-04 & SC-05)

**Simulasi A: Failing Test PR (SC-04)**

> _Dokumentasi belum tersedia._ Screenshot `docs/screenshots/sc04-tahap4-failing-test-pr.png` akan ditambahkan setelah simulasi test gagal dijalankan.

**Simulasi B: Coverage < 70% (SC-05)**

![SC-05](docs/screenshots/sc05-tahap4-coverage-gate-blocked.png)

Step **Enforce Code Coverage Quality Gate (Threshold >= 70%)** gagal dengan log `[QUALITY GATE FAILED]`: coverage aktual **62,69%** berada di bawah ambang batas **70,0%**, sehingga proses keluar dengan exit code 1. Step berikutnya (_Update Dynamic Coverage Badge_) otomatis dilewati.

Analisis proteksi ganda: test yang gagal melindungi dari logika yang rusak, sedangkan quality gate coverage melindungi dari kode baru yang tidak teruji walaupun semua test lama lulus. Keduanya dipaksa oleh Branch Protection Rule sehingga PR bermasalah tidak bisa di-merge ke `main`.

### Tahap 5: Troubleshooting Workflow (Analisis)

1. Tanpa `working-directory: ./backend`, perintah berjalan di root repo, padahal `package.json` dan konfigurasi Vitest ada di `backend/`, sehingga dependensi dan config tidak ditemukan. `npm ci` lebih baik daripada `npm install` di CI karena memakai versi eksak dari `package-lock.json`, tidak mengubahnya, dan gagal jika lock file tidak sinkron, sehingga hasilnya deterministik dan identik dengan lokal.
2. `|| true` membuat exit code test yang gagal diabaikan, sehingga step dianggap sukses dan pipeline tetap hijau walau ada test rusak. Kode cacat bisa masuk ke `main` dan quality gate kehilangan fungsinya.
3. Trigger hanya `on: push` ke `main` dan tidak ada `pull_request`, sehingga PR dari branch fitur ke `main` tidak memicu workflow. Perbaikannya menambahkan `pull_request: branches: [main]`.

### Latihan Mandiri: Coverage ≥ 82% (SC-06)

> _Dokumentasi belum tersedia._ Screenshot `docs/screenshots/sc06-tahap5-mandiri-coverage-82.png` akan ditambahkan. Sebagai referensi, coverage backend lokal saat ini sudah mencapai 97,11% (lihat SC-01).

### Matriks Kontribusi

| NIM       | Nama Anggota        | Peran & Cabang Git                              | Tautan PR     | Reviewer PR         |
| --------- | ------------------- | ----------------------------------------------- | ------------- | ------------------- |
| (isi NIM) | obipranata2006      | CI & Lint (`feat/ci-lint-setup`)                | (isi link PR) | Xrimm               |
| (isi NIM) | Xrimm               | Backend Vitest (`feat/backend-vitest-ci`)       | (isi link PR) | andriyantoay595-art |
| (isi NIM) | andriyantoay595-art | Quality Gate 70% (`feat/quality-gate-70`)       | (isi link PR) | RosanKelvino        |
| (isi NIM) | RosanKelvino        | Badge & Failing PR (`feat/badge-and-demo-gate`) | (isi link PR) | obipranata2006      |
