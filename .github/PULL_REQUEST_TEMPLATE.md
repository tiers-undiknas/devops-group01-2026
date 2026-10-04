## Deskripsi Teknis


## Tipe Perubahan
- [ ] `feat` - fitur baru
- [ ] `fix` - perbaikan bug
- [ ] `docs` - dokumentasi
- [ ] `style` - format kode (tanpa perubahan logika)
- [ ] `refactor` - restrukturisasi kode
- [ ] `perf` - peningkatan performa
- [ ] `test` - menambah/memperbaiki tes
- [ ] `build` - sistem build/dependensi
- [ ] `ci` - konfigurasi CI
- [ ] `chore` - tugas rutin lainnya
- [ ] **Breaking change** (kenaikan versi MAJOR)

## Modul Terdampak
- [ ] backend (API / services)
- [ ] frontend
- [ ] worker
- [ ] db (migrations)
- [ ] tests

## Checklist Verifikasi Mandiri
- [ ] Unit test Vitest lulus di lokal (`npm test`)
- [ ] Tidak ada file rahasia (`.env`, kredensial) yang ikut ter-commit
- [ ] Umur branch ≤ 24 jam dan perubahan ≤ 400 baris kode
- [ ] Pesan commit mengikuti Conventional Commits
- [ ] Reviewer yang sesuai CODEOWNERS sudah diminta untuk me-review

## Catatan untuk Reviewer
- [ ] Cermati dengan teliti