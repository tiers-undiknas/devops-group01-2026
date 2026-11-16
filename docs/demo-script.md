# Skrip Demo Babak 4: Live Run (4–5 menit)

Penyaji: Anggota 4. Semua perintah dijalankan dari folder `deployments/`.

## Sebelum rekaman (jangan direkam)
- Docker Desktop aktif.
- Tutup kontainer proyek lain yang memakai port 3000 atau 8080
  (`docker ps` untuk memeriksa).
- Pastikan `deployments/.env` sudah ada (`cp .env.example .env`).
- Buka dua terminal dan satu tab browser kosong.

## Langkah 1: Clean boot
```
docker compose down -v
docker compose up -d --build
```
Hasil: semua kontainer dan volume lama dihapus, lalu image dibangun dan
kontainer dinyalakan. Jelaskan: `-v` menghapus volume `pgdata`, jadi mulai dari nol.

## Langkah 2: Status kelima layanan
```
docker compose ps
```
Hasil: `postgres`, `redis`, `api`, `frontend` berstatus **healthy**;
`worker` berstatus **Up** (tanpa healthcheck, karena tidak punya port HTTP).
Kalau masih "starting", tunggu 30 detik lalu ulangi.

## Langkah 3: Migrasi database di dalam kontainer
```
docker compose logs api | grep -i migration
docker compose exec api npm run db:migrate
```
Hasil: log pertama menunjukkan migrasi 001 sampai 003 diterapkan saat `api` start.
Perintah manual mencetak `totalApplied: 0`. Jelaskan: migrasi idempoten,
yang sudah diterapkan tidak diulang.

## Langkah 4: Readiness probe
```
curl -i http://localhost:3000/healthz/ready
```
(Windows PowerShell: `curl.exe -i ...`)
Hasil: `HTTP/1.1 200 OK` dan `"status":"READY"` dengan database dan redis `UP`.

## Langkah 5: Transaksi end-to-end
1. Terminal 1: `docker compose logs -f worker`
2. Browser: `http://localhost:8080`, menu Orders, buat satu order.
3. Terminal 1: tampil "Job started processing" lalu "Job completed successfully".
Jelaskan alurnya: browser, nginx, API, Redis (BullMQ), worker, PostgreSQL.
Tekan Ctrl+C untuk menghentikan log.

## Langkah 6: Vitest di dalam kontainer
Dari root repo:
```
docker build --target test -t ope-backend-test ./backend
docker run --rm ope-backend-test
```
Hasil: `Test Files 10 passed`, `Tests 72 passed`.

## Jika terjadi masalah saat rekaman
| Gejala | Tindakan |
|---|---|
| "port is already allocated" | `docker ps`, hentikan kontainer lama, ulangi langkah 1 |
| `api` unhealthy | `docker compose logs api`, lalu `down -v` dan `up` lagi |
| Halaman lain muncul di :8080 | Hentikan kontainer proyek lama, hard refresh browser |
| Frontend tidak memuat data | Periksa `docker compose logs frontend` |