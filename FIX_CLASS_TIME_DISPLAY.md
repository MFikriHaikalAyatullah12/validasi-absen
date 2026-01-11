# Panduan Testing Class Time Settings

## Masalah yang Diperbaiki
❌ Siswa masih melihat jam default (07:00-12:00 & 14:00-15:00) meskipun guru sudah setting jam kelas

## Perbaikan yang Dilakukan

### 1. Format Waktu di API
- **File**: `/app/api/student/status/route.ts`
- **Perbaikan**: Menambahkan fungsi `formatTime()` untuk mengkonversi format PostgreSQL "HH:MM:SS" menjadi "HH:MM"

### 2. Update User Data di Student
- **File**: `/app/student/page.tsx`
- **Perbaikan**: 
  - `fetchAttendanceStatus()` sekarang selalu update `timeInfo` saat dapat data user baru
  - Auto-refresh setiap 10 detik akan memperbarui jam kelas juga

### 3. Tampilan Jam di UI
- **File**: `/app/student/page.tsx`
- **Perbaikan**: Menggunakan `timeInfo.checkin` dan `timeInfo.checkout` (bukan hardcoded)

## Cara Testing

### Test 1: Setting Jam oleh Guru
1. Login sebagai **Teacher**
2. Klik "📚 Kelola Kelas & Siswa"
3. Pilih salah satu kelas
4. Scroll ke "⏰ Pengaturan Jam Kelas"
5. Klik "Atur Jam"
6. Ubah jam, misal:
   - Check-in: 08:00 - 13:00
   - Check-out: 15:00 - 16:30
7. Klik "💾 Simpan Jam Kelas"
8. ✅ Konfirmasi muncul: "Jam kelas berhasil diperbarui!"

### Test 2: Verifikasi di Siswa
1. Login sebagai **Student** yang terdaftar di kelas tersebut
2. Di dashboard student, cek section "⏰ Jadwal Absensi"
3. ✅ Seharusnya muncul jam yang BARU (08:00 - 13:00 & 15:00 - 16:30)
4. Jika belum muncul:
   - Tunggu 10 detik (auto-refresh)
   - Atau refresh browser (F5)

### Test 3: Real-time Update
1. Buka 2 browser/tab:
   - Tab 1: Login sebagai Teacher
   - Tab 2: Login sebagai Student (kelas yang sama)
2. Di Tab 1 (Teacher):
   - Ubah jam kelas ke jam yang berbeda
   - Simpan
3. Di Tab 2 (Student):
   - Tunggu maksimal 10 detik
   - ✅ Jam akan berubah otomatis tanpa refresh manual

### Test 4: Kelas Berbeda, Jam Berbeda
1. Login sebagai Teacher
2. Setting 2 kelas dengan jam berbeda:
   - Kelas A: 07:00-12:00 & 14:00-15:00
   - Kelas B: 08:00-13:00 & 15:00-16:30
3. Login sebagai siswa dari Kelas A
   - ✅ Melihat jam Kelas A
4. Login sebagai siswa dari Kelas B
   - ✅ Melihat jam Kelas B

## Troubleshooting

### Siswa masih melihat jam lama
**Solusi**:
1. Refresh browser (Ctrl+R atau F5)
2. Atau tunggu 10 detik untuk auto-refresh
3. Pastikan siswa terdaftar di kelas yang benar
4. Cek browser console untuk error

### Jam tidak berubah sama sekali
**Solusi**:
1. Cek apakah migration database sudah jalan:
   ```bash
   node scripts/add-class-times.js
   ```
2. Cek di database apakah kolom sudah ada:
   ```sql
   SELECT * FROM classes LIMIT 1;
   ```
3. Pastikan ada data di kolom `checkin_start_time`, dll

### Format waktu salah (muncul 07:00:00)
**Sudah diperbaiki**: API sekarang otomatis format ke HH:MM

## Flow Data

```
Guru Setting Jam
    ↓
API: PUT /api/teacher/classes/[id]/times
    ↓
Database: UPDATE classes SET checkin_start_time = ...
    ↓
Siswa Auto-refresh (10 detik)
    ↓
API: GET /api/student/status
    ↓
Response: { user: { class: { checkin_start_time: "08:00", ... } } }
    ↓
Student UI: setTimeInfo({ checkin: "08:00 - 13:00", ... })
    ↓
Tampilan: "🟢 Check-in: 08:00 - 13:00 WITA"
```

## Verifikasi Database

Jalankan query ini untuk cek jam di database:

```sql
SELECT 
  c.id,
  c.name,
  c.checkin_start_time,
  c.checkin_end_time,
  c.checkout_start_time,
  c.checkout_end_time,
  COUNT(u.id) as student_count
FROM classes c
LEFT JOIN users u ON u.class_id = c.id AND u.role = 'STUDENT'
GROUP BY c.id, c.name, c.checkin_start_time, c.checkin_end_time, c.checkout_start_time, c.checkout_end_time
ORDER BY c.name;
```

## Status
✅ Perbaikan selesai
✅ API mengembalikan format waktu yang benar
✅ Student UI menggunakan data dinamis (bukan hardcoded)
✅ Auto-refresh 10 detik untuk update otomatis

**Silakan refresh halaman student atau tunggu 10 detik untuk melihat perubahan jam dari guru!**
