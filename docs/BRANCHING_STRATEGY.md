# Strategi Percabangan: Trunk-Based Development

Dokumen ini menjelaskan alasan tim memakai **Trunk-Based Development (TBD)** pada repositori *Order Processing Engine*, sebuah monorepo yang berisi `backend/` (Express.js, worker BullMQ, migrasi SQL, telemetri Prometheus) dan `frontend/` (SPA Vanilla JS + Vite). Cabang `main` adalah *trunk*: satu-satunya jalur yang selalu harus siap rilis.

## 1. Analisis Kritis: GitFlow vs Trunk-Based Development

GitFlow memelihara beberapa cabang berumur panjang (`develop`, `release/*`, `hotfix/*`, ditambah `feature/*` yang bisa hidup berminggu-minggu). Model ini dirancang untuk produk yang dirilis berkala, misalnya sekali per kuartal. Untuk basis kode kami yang siklus rilisnya harian, ada empat kelemahan utama.

**a. Merge Debt.** Setiap hari sebuah cabang terisolasi dari trunk, selisih kode di antara keduanya bertambah. Selisih inilah yang kami sebut *merge debt*: utang integrasi yang harus dibayar sekaligus saat cabang akhirnya digabung. Pada monorepo ini, satu fitur sering menyentuh banyak lapisan sekaligus, misalnya endpoint di `backend/src/routes/`, kolom baru di `backend/src/db/migrations/`, dan tampilan di `frontend/src/pages/dashboard.js`. Cabang yang hidup lama hampir pasti bentrok dengan perubahan rekan di file yang sama, dan konfliknya muncul pada saat paling buruk, yaitu menjelang rilis.

**b. Lead Time for Changes (LTTC) memanjang.** LTTC adalah waktu dari commit pertama sampai kode berjalan di produksi. Pada GitFlow, kode harus melewati `feature` → `develop` → `release` → `main`, dan tiap perpindahan menambah antrean review, integrasi, dan stabilisasi. Perbaikan satu baris pun bisa menunggu rilis berikutnya. Pada TBD, perubahan kecil langsung masuk ke `main` lewat satu Pull Request, sehingga LTTC diukur dalam jam, bukan minggu.

**c. Change Failure Rate (CFR) membengkak.** CFR adalah persentase perubahan yang menyebabkan kegagalan di produksi. Cabang panjang menghasilkan PR besar. PR besar sulit direview dengan teliti, sehingga cacat lolos, dan ketika rilis gagal, sulit menentukan perubahan mana penyebabnya. Pada TBD, perubahan kecil (≤ 400 baris) mudah diperiksa, mudah diuji, dan mudah di-*revert* secara terisolasi, sehingga CFR turun.

**d. Beban proses ganda.** Perbaikan di `release/*` atau `hotfix/*` harus digabung ulang ke `develop`. Langkah yang terlupakan menyebabkan bug yang sama muncul kembali. TBD meniadakan masalah ini karena hanya ada satu jalur.

| Aspek | GitFlow | Trunk-Based Development |
|---|---|---|
| Cabang berumur panjang | `develop`, `release/*`, `hotfix/*` | Tidak ada, hanya `main` |
| Umur cabang fitur | Hari hingga minggu | Maksimal 24 jam |
| Merge debt | Tinggi | Rendah |
| LTTC | Panjang | Pendek |
| CFR | Cenderung tinggi | Cenderung rendah |
| Rilis | Menunggu cabang release | Dari `main`, ditandai tag SemVer |

## 2. SOP Cabang Berumur Pendek (Short-Lived Branches)

1. **Sinkron dulu.** Mulai dari `main` terbaru: `git switch main && git pull`.
2. **Satu cabang, satu tujuan.** Beri nama `<kategori>/<deskripsi-singkat>`, misalnya `feat/order-stats-endpoint`.
3. **Batas usia 24 jam.** Cabang harus sudah di-merge atau dihapus dalam 24 jam sejak dibuat. Cabang yang belum selesai dipecah menjadi potongan yang bisa di-merge hari itu juga.
4. **Batas ukuran 400 baris.** Perubahan tidak lebih dari 400 baris kode (tidak termasuk `package-lock.json`). Jika lebih, pecah menjadi beberapa PR.
5. **Tes lokal hijau.** Jalankan `npm test` sebelum push. Hook commit-msg dari commitlint menolak pesan commit yang tidak mengikuti Conventional Commits.
6. **PR kecil dan segera.** Buka PR di hari yang sama, minta review dari code owner modul terkait, dan tanggapi komentar dengan commit perbaikan.
7. **Squash and Merge, lalu hapus.** Setelah disetujui, gabungkan dengan Squash and Merge sehingga riwayat `main` tetap linear, lalu hapus cabang fitur.
8. **Cabang basi dipecah, bukan dipertahankan.** Jika sebuah cabang mendekati 24 jam dan belum selesai, simpan pekerjaan yang sudah berjalan lewat feature flag (bagian 3) dan merge bagian yang aman.

Aturan ini ditegakkan oleh ruleset pada `main`: wajib PR, minimal 1 approval, approval lama dibatalkan jika ada commit baru, riwayat linear, dan hanya Squash merge yang diizinkan, tanpa pengecualian bagi administrator.

## 3. Fitur Kompleks: Feature Flags (Toggles)

Bagaimana jika sebuah fitur backend memakan waktu dua minggu? Jawabannya bukan cabang panjang, melainkan **memecah fitur menjadi potongan kecil yang di-merge ke `main` setiap hari, dengan kode baru disembunyikan di balik *feature flag***. Kode yang belum selesai ikut terintegrasi dan teruji, tetapi tidak aktif untuk pengguna sampai flag dinyalakan.

Contoh konseptual pada layanan Express.js:

```js
// backend/src/config/feature-flags.js
export const featureFlags = {
  // Dinyalakan lewat environment variable, default MATI
  orderStats: process.env.FEATURE_ORDER_STATS === 'true'
};

// backend/src/middleware/require-feature.js
import { featureFlags } from '../config/feature-flags.js';

export function requireFeature(name) {
  return (req, res, next) => {
    if (!featureFlags[name]) {
      return res.status(404).json({ error: 'Not found' });
    }
    next();
  };
}

// backend/src/routes/order.routes.js
router.get('/stats', requireFeature('orderStats'), async (req, res, next) => {
  try {
    const stats = await orderService.getOrderStats();
    res.status(200).json({ data: stats });
  } catch (err) {
    next(err);
  }
});
```

Rencana dua minggu dengan flag ini kira-kira sebagai berikut:

- **Hari 1-2:** tambahkan migrasi aditif (kolom atau tabel baru, tanpa menghapus apa pun) dan flag dengan nilai mati.
- **Hari 3-7:** tambahkan service dan route di balik flag, masing-masing PR kecil dengan tes Vitest.
- **Hari 8-10:** hubungkan frontend, juga di balik flag.
- **Hari 11-12:** nyalakan flag di lingkungan staging, perbaiki temuan.
- **Hari 13-14:** nyalakan flag di produksi, lalu hapus flag dan kode lamanya dalam PR pembersihan.

Karena kode selalu berada di `main`, tidak ada merge debt, setiap potongan sudah melewati review, dan jika terjadi masalah cukup mematikan flag tanpa *rollback* rilis. Flag yang sudah tidak dibutuhkan wajib dihapus agar tidak menjadi utang teknis baru.
