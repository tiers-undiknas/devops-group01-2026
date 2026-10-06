# Panduan Kontribusi

Repositori ini memakai **Trunk-Based Development**, **Conventional Commits
v1.0.0**, dan **Semantic Versioning 2.0.0**. Baca juga
[`docs/BRANCHING_STRATEGY.md`](docs/BRANCHING_STRATEGY.md) untuk alasan di balik
aturan-aturan ini.

## 1. Persiapan Awal

```bash
git clone https://github.com/tiers-undiknas/devops-group01-2026.git
cd devops-group01-2026
npm run install:all
cp .env.example .env
```

`npm install` di root akan memasang Husky. Hook `commit-msg` akan memvalidasi
pesan commit dengan commitlint dan **menolak commit yang tidak sesuai format**.
Jangan pernah memakai `--no-verify` untuk melewatinya.

Jangan pernah meng-commit file `.env` atau rahasia apa pun.

## 2. Penamaan Cabang

Format: `<kategori>/<deskripsi-singkat>` dengan huruf kecil dan tanda hubung.

| Kategori | Kegunaan | Contoh |
|---|---|---|
| `feat/` | Fitur baru | `feat/order-stats-endpoint` |
| `fix/` | Perbaikan bug | `fix/dashboard-status-count` |
| `docs/` | Dokumentasi | `docs/contributing-guide` |
| `test/` | Penambahan/perbaikan test | `test/order-service-edge-cases` |
| `refactor/` | Refactor tanpa ubah perilaku | `refactor/order-processor` |
| `perf/` | Optimasi performa | `perf/orders-composite-index` |
| `chore/` | Pemeliharaan | `chore/update-dependencies` |
| `ci/`, `build/` | Pipeline dan build | `ci/add-test-workflow` |

Cabang harus berumur **maksimal 24 jam** dan berukuran **maksimal 400 baris**
perubahan.

## 3. Taksonomi Conventional Commits

Format pesan:

```
<tipe>(<scope>): <deskripsi singkat dalam bentuk perintah>

[body opsional]

[footer opsional]
```

Tipe yang diizinkan: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`,
`test`, `build`, `ci`, `chore`.

| Tipe | Kapan dipakai |
|---|---|
| `feat` | Menambah kemampuan baru (memicu kenaikan **MINOR**) |
| `fix` | Memperbaiki bug (memicu kenaikan **PATCH**) |
| `docs` | Perubahan dokumentasi saja |
| `style` | Format/spasi/titik koma, tanpa ubah logika |
| `refactor` | Merapikan kode tanpa mengubah perilaku |
| `perf` | Meningkatkan performa |
| `test` | Menambah atau memperbaiki test |
| `build` | Sistem build dan dependensi |
| `ci` | Konfigurasi CI/CD |
| `chore` | Tugas pemeliharaan lain |

### Contoh nyata per modul

**API (`backend/src/routes/`, `backend/src/services/`)**
```
feat(api): add order stats endpoint
fix(api): return 404 when order id is not found
refactor(orders): extract tax calculation into helper
```

**Worker (`backend/src/worker.js`, `backend/src/services/order-processor.service.js`)**
```
fix(worker): retry failed payment jobs with exponential backoff
feat(worker): record audit trail on each status transition
perf(worker): process inventory validation concurrently
```

**Database & Migrations (`backend/src/db/migrations/`)**
```
feat(db): add composite index on orders status and created_at
fix(db): make migration 002 idempotent
chore(db): add schema_migrations check to migrate runner
```

**Frontend UI (`frontend/`)**
```
fix(frontend): count order stats per status on dashboard
feat(frontend): add status filter to orders page
style(frontend): align navbar spacing
```

**Vitest suite (`backend/tests/`, `frontend/tests/`)**
```
test(orders): add edge case and telemetry tests for order service
test(api): cover 503 response on readiness probe failure
ci: run vitest on every pull request
```

### Contoh pesan yang DITOLAK

```
update            # tanpa tipe dan terlalu singkat
fix               # tanpa deskripsi
Added new stuff   # bukan format Conventional Commits
feature: login    # tipe "feature" tidak baku (gunakan "feat")
```

## 4. Penandaan Breaking Change (Kenaikan MAJOR)

Perubahan yang merusak kompatibilitas (misalnya mengubah bentuk respons API,
menghapus endpoint, atau mengubah skema DB secara tidak aditif) **wajib**
ditandai secara eksplisit. Ada dua cara, dan sebaiknya dipakai bersamaan:

1. Tambahkan `!` setelah tipe/scope.
2. Tambahkan footer `BREAKING CHANGE:` yang menjelaskan dampak dan cara migrasi.

```
feat(api)!: rename status field to order_status in order response

BREAKING CHANGE: GET /api/v1/orders now returns `order_status` instead of
`status`. Clients must update their parsers. The frontend dashboard is
updated in the same release.
```

Prosedur:

1. Tandai di pesan commit (dan judul PR, karena PR di-squash).
2. Centang "Breaking Change" pada template PR dan jelaskan dampaknya.
3. Reviewer wajib memeriksa catatan migrasi sebelum approve.
4. Saat rilis, versi **MAJOR** dinaikkan (`1.4.2` → `2.0.0`). Selama masih
   versi `0.x`, tim menaikkan **MINOR** untuk breaking change (`0.1.0` →
   `0.2.0`), sesuai SemVer yang mengizinkan perubahan bebas pada fase `0.x`.

## 5. Alur Kerja Harian

### a. Sinkronkan trunk

```bash
git switch main
git pull
```

### b. Buat cabang lokal

```bash
git switch -c feat/order-stats-endpoint
```

### c. Kerjakan dan commit

Commit kecil dan sering, dengan pesan sesuai konvensi. Jalankan test sebelum
push:

```bash
npm test
```

### d. Push dan buka Pull Request

```bash
git push -u origin feat/order-stats-endpoint
```

Buka PR ke `main`. **Judul PR harus mengikuti Conventional Commits**, karena
judul itulah yang menjadi pesan commit hasil squash. Isi template PR dengan
lengkap: deskripsi teknis, tipe perubahan, modul terdampak, dan checklist.

### e. Peer review

Etika bagi reviewer dan pembuat PR:

- Review sesuai domain `CODEOWNERS`. Pembuat PR tidak boleh menyetujui PR-nya
  sendiri.
- Reviewer wajib memberi **minimal 1 komentar teknis yang substantif** pada tab
  *Files changed* (misalnya soal validasi input, penanganan error, atau
  cakupan test), bukan sekadar "LGTM".
- Komentar ditujukan pada kode, bukan pada orangnya. Jelaskan alasannya dan
  tawarkan alternatif.
- Reviewer merespons dalam jam kerja yang sama agar cabang tidak melewati batas
  24 jam.
- Pembuat PR menanggapi setiap komentar, baik dengan commit perbaikan maupun
  penjelasan.

### f. Perbaikan revisi

Perbaiki di cabang yang sama dengan commit susulan (misalnya
`fix(api): validate status query parameter`) lalu push. Perlu diingat bahwa
commit baru akan **membatalkan approval lama** (*dismiss stale approvals*),
sehingga reviewer perlu menyetujui ulang.

### g. Squash and Merge

Setelah ada approval dan test hijau:

1. Klik **Squash and merge** (satu-satunya metode yang diizinkan).
2. Pastikan pesan akhir mengikuti Conventional Commits.
3. Klik **Delete branch**.
4. Sinkronkan lokal:
   ```bash
   git switch main
   git pull
   git branch -d feat/order-stats-endpoint
   ```

## 6. Aturan Penting

- Dilarang push langsung ke `main` dan dilarang force push.
- Dilarang commit di cabang `main` lokal. Selalu buat cabang baru.
- Dilarang meng-commit `.env`, kredensial, atau token.
- Semua unit test Vitest harus lulus sebelum PR di-merge.
- Rilis ditandai dengan *annotated tag* SemVer:
  ```bash
  git tag -a v0.1.0 -m "chore(release): baseline release v0.1.0"
  git push origin v0.1.0
  ```
