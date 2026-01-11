# Dokumentasi Update: Class Time Settings & Real-time Updates

## Fitur Baru yang Ditambahkan

### 1. ⏰ Pengaturan Jam Per Kelas (Class-Specific Time Settings)

**Deskripsi**: Guru sekarang dapat mengatur jam check-in dan check-out untuk setiap kelas secara individual. Setiap kelas dapat memiliki waktu yang berbeda sesuai kebutuhan.

**Implementasi**:

#### Database Changes
- Menambahkan 4 kolom baru di tabel `classes`:
  - `checkin_start_time` (TIME) - Default: 07:00
  - `checkin_end_time` (TIME) - Default: 12:00
  - `checkout_start_time` (TIME) - Default: 14:00
  - `checkout_end_time` (TIME) - Default: 15:00

#### API Endpoints Baru
- `PUT /api/teacher/classes/[id]/times` - Update jam kelas
- `GET /api/teacher/classes/[id]/times` - Get jam kelas

#### UI Changes untuk Guru
**Lokasi**: `/teacher/manage/[id]` (Halaman Detail Kelas)

Fitur baru di halaman detail kelas:
- **Section "Pengaturan Jam Kelas"** dengan icon ⏰
- Form untuk mengatur 4 waktu:
  - Jam Mulai Check-in
  - Jam Selesai Check-in
  - Jam Mulai Check-out
  - Jam Selesai Check-out
- Tampilan jam saat ini untuk kelas
- Tombol "Atur Jam" untuk membuka/menutup form

**Cara Penggunaan**:
1. Login sebagai Teacher
2. Klik "📚 Kelola Kelas & Siswa"
3. Pilih kelas yang ingin diatur
4. Scroll ke section "⏰ Pengaturan Jam Kelas"
5. Klik tombol "Atur Jam"
6. Isi waktu yang diinginkan
7. Klik "💾 Simpan Jam Kelas"

#### UI Changes untuk Siswa
**Lokasi**: `/student` (Dashboard Siswa)

Siswa sekarang akan melihat jam check-in/check-out sesuai dengan setting kelas mereka:
- Jam ditampilkan otomatis dari setting kelas
- Validasi waktu menggunakan jam dari kelas
- Button check-in/check-out hanya aktif di waktu yang telah ditentukan guru

**Cara Kerja**:
- Sistem otomatis membaca jam dari kelas siswa
- Jika kelas belum di-setting, menggunakan default (07:00-12:00 & 14:00-15:00)
- Update otomatis ketika guru mengubah setting jam kelas

---

### 2. 🔄 Real-time Updates di Halaman Guru

**Deskripsi**: Halaman dashboard guru sekarang memiliki fitur auto-refresh untuk melihat perubahan kehadiran siswa secara real-time tanpa perlu refresh manual.

**Implementasi**:

#### Auto-refresh System
- Polling setiap 10 detik untuk data terbaru
- Toggle button untuk ON/OFF auto-refresh
- Indicator "🔴 Live" yang berkedip saat auto-refresh aktif
- Silent refresh (tidak mengganggu tampilan)

#### UI Changes
**Lokasi**: `/teacher` (Dashboard Guru)

Fitur baru:
- **Toggle Button**: "🔄 Auto-refresh ON" / "⏸️ Auto-refresh OFF"
- **Live Indicator**: Text "🔴 Live - Data diperbarui otomatis setiap 10 detik" dengan animasi pulse
- Refresh otomatis berjalan di background tanpa loading screen

**Cara Penggunaan**:
1. Login sebagai Teacher
2. Di dashboard guru, auto-refresh aktif secara default
3. Klik toggle button untuk menonaktifkan jika diperlukan
4. Saat siswa melakukan check-in/check-out, data akan muncul otomatis dalam 10 detik

**Benefits**:
- ✅ Tidak perlu refresh manual
- ✅ Monitoring real-time kehadiran siswa
- ✅ Pengalaman yang lebih smooth dan modern
- ✅ Dapat dimatikan jika tidak diperlukan

---

## Files yang Dimodifikasi

### Database
- ✅ `/scripts/add-class-times.js` - Migration script

### Backend API
- ✅ `/app/api/teacher/classes/[id]/times/route.ts` - NEW: API untuk setting jam kelas
- ✅ `/app/api/teacher/classes/route.ts` - Update: Include time fields
- ✅ `/app/api/student/status/route.ts` - Update: Include class time fields

### Frontend
- ✅ `/app/teacher/manage/[id]/page.tsx` - Add: Time settings UI
- ✅ `/app/teacher/page.tsx` - Add: Real-time auto-refresh
- ✅ `/app/student/page.tsx` - Update: Use class times

### Types
- ✅ `/lib/types.ts` - Update: Class interface dengan time fields

---

## Testing Checklist

### Fitur 1: Class Time Settings
- [ ] Guru dapat membuka form setting jam di halaman detail kelas
- [ ] Guru dapat menyimpan jam check-in/check-out untuk kelas
- [ ] Jam yang disimpan muncul di tampilan kelas
- [ ] Siswa di kelas tersebut melihat jam sesuai setting guru
- [ ] Siswa hanya bisa check-in/check-out di waktu yang telah ditentukan
- [ ] Kelas berbeda dapat memiliki jam yang berbeda

### Fitur 2: Real-time Updates
- [ ] Toggle auto-refresh dapat diaktifkan/dinonaktifkan
- [ ] Indicator "Live" muncul saat auto-refresh aktif
- [ ] Data attendance terupdate otomatis setiap 10 detik
- [ ] Tidak ada loading screen saat refresh otomatis
- [ ] Siswa melakukan check-in → muncul di guru dalam 10 detik
- [ ] Siswa melakukan check-out → muncul di guru dalam 10 detik

---

## Notes & Best Practices

1. **Default Values**: Semua kelas existing akan mendapat default jam (07:00-12:00 & 14:00-15:00)
2. **Timezone**: Sistem tetap menggunakan WITA (UTC+8)
3. **Performance**: Auto-refresh menggunakan silent mode untuk tidak mengganggu UX
4. **Flexibility**: Setiap kelas independen - perubahan di satu kelas tidak mempengaruhi kelas lain

---

## Cara Deployment

Jika deploy ke production:

```bash
# 1. Jalankan migration di production database
node scripts/add-class-times.js

# 2. Atau jalankan SQL langsung di Neon Database Console:
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS checkin_start_time TIME DEFAULT '07:00',
ADD COLUMN IF NOT EXISTS checkin_end_time TIME DEFAULT '12:00',
ADD COLUMN IF NOT EXISTS checkout_start_time TIME DEFAULT '14:00',
ADD COLUMN IF NOT EXISTS checkout_end_time TIME DEFAULT '15:00';

UPDATE classes 
SET 
  checkin_start_time = COALESCE(checkin_start_time, '07:00'),
  checkin_end_time = COALESCE(checkin_end_time, '12:00'),
  checkout_start_time = COALESCE(checkout_start_time, '14:00'),
  checkout_end_time = COALESCE(checkout_end_time, '15:00');

# 3. Deploy aplikasi
vercel --prod
```

---

## Troubleshooting

### Jam tidak berubah di siswa
- Pastikan siswa refresh halaman setelah guru mengubah setting
- Cek apakah siswa terdaftar di kelas yang benar

### Auto-refresh tidak jalan
- Cek apakah toggle auto-refresh dalam keadaan ON
- Cek console browser untuk error
- Pastikan connection ke API lancar

### Migration error
- Pastikan DATABASE_URL benar
- Cek apakah tabel classes sudah ada
- Gunakan SQL manual jika script gagal

---

**Update Date**: January 11, 2026
**Version**: 2.0.0
