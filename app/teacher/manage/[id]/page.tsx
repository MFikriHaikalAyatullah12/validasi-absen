'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function ClassDetailPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [studentsWithoutClass, setStudentsWithoutClass] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddExistingStudent, setShowAddExistingStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', email: '', class_id: classId });
  const [downloading, setDownloading] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showTimeSettings, setShowTimeSettings] = useState(false);
  const [classTimes, setClassTimes] = useState({
    checkin_start_time: '07:00',
    checkin_end_time: '12:00',
    checkout_start_time: '14:00',
    checkout_end_time: '15:00'
  });
  const [savingTimes, setSavingTimes] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(userStr);
    if (userData.role !== 'TEACHER') {
      router.push('/login');
      return;
    }

    setUser(userData);
    fetchClassInfo();
    fetchStudents();
  }, [router, classId]);

  const fetchClassInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/teacher/classes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        const currentClass = data.classes.find((c: any) => c.id.toString() === classId);
        setClassInfo(currentClass);
        if (currentClass) {
          setClassTimes({
            checkin_start_time: currentClass.checkin_start_time || '07:00',
            checkin_end_time: currentClass.checkin_end_time || '12:00',
            checkout_start_time: currentClass.checkout_start_time || '14:00',
            checkout_end_time: currentClass.checkout_end_time || '15:00'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching class info:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/teacher/students?class_id=${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setStudents(data.students);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchStudentsWithoutClass = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/teacher/students-without-class', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setStudentsWithoutClass(data.students);
      }
    } catch (error) {
      console.error('Error fetching students without class:', error);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      // Generate password otomatis dari nama (untuk keperluan mendesak)
      const autoPassword = newStudent.name.toLowerCase().replace(/\s+/g, '') + '123';
      
      const response = await fetch('/api/teacher/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...newStudent, password: autoPassword }),
      });
      const data = await response.json();
      if (data.success) {
        alert(`Siswa berhasil ditambahkan!\nPassword otomatis: ${autoPassword}\n\nSilakan catat password ini untuk diberikan kepada siswa.`);
        setShowAddStudent(false);
        setNewStudent({ name: '', email: '', class_id: classId });
        fetchStudents();
      } else {
        alert(data.error || 'Gagal menambahkan siswa');
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    }
  };

  const handleAddExistingStudent = async (studentId: number, studentName: string) => {
    if (!confirm(`Tambahkan ${studentName} ke kelas ini?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/teacher/add-student-to-class', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ student_id: studentId, class_id: classId }),
      });
      const data = await response.json();
      if (data.success) {
        alert(data.message);
        setShowAddExistingStudent(false);
        fetchStudents();
        fetchStudentsWithoutClass();
      } else {
        alert(data.error || 'Gagal menambahkan siswa');
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    }
  };

  const handleRemoveStudent = async (studentId: number, studentName: string) => {
    if (!confirm(`Hapus ${studentName} dari kelas ini?\n\nSiswa tidak akan dihapus dari sistem, hanya dikeluarkan dari kelas.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/teacher/remove-student-from-class', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ student_id: studentId }),
      });
      const data = await response.json();
      if (data.success) {
        alert(data.message);
        fetchStudents();
        fetchClassInfo(); // Refresh count
      } else {
        alert(data.error || 'Gagal menghapus siswa dari kelas');
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    }
  };

  const handleDownloadExcel = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem('token');
      let url = `/api/teacher/attendance/download?class_id=${classId}`;
      
      if (dateRange.start) {
        url += `&start_date=${dateRange.start}`;
      }
      if (dateRange.end) {
        url += `&end_date=${dateRange.end}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Gagal mengunduh data');
      }

      // Get filename from response header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `Kehadiran_${classInfo.name}.xlsx`;
      if (contentDisposition) {
        const matches = /filename="?(.+)"?/i.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      // Download file
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      alert('✅ Data kehadiran berhasil diunduh!');
    } catch (error: any) {
      alert('❌ ' + error.message);
    } finally {
      setDownloading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleSaveClassTimes = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTimes(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/teacher/classes/${classId}/times`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(classTimes),
      });
      const data = await response.json();
      if (data.success) {
        alert('✅ Jam kelas berhasil diperbarui! Siswa di kelas ini akan melihat jam yang baru.');
        setShowTimeSettings(false);
        fetchClassInfo();
      } else {
        alert('❌ ' + (data.error || 'Gagal memperbarui jam kelas'));
      }
    } catch (error) {
      alert('❌ Terjadi kesalahan saat menyimpan');
    } finally {
      setSavingTimes(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <p className="text-gray-900 text-lg">Loading...</p>
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <p className="text-gray-900 text-lg mb-4">Kelas tidak ditemukan</p>
          <Link
            href="/teacher/manage"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Kembali
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link
                  href="/teacher/manage"
                  className="text-gray-600 hover:text-gray-800"
                >
                  ← Kembali
                </Link>
              </div>
              <h1 className="text-3xl font-bold text-gray-800">{classInfo.name}</h1>
              <p className="text-gray-600">Tingkat: Kelas {classInfo.grade_level}</p>
              <p className="text-sm text-blue-600 font-medium mt-1">
                👥 {classInfo.student_count} siswa terdaftar
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/teacher"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Class Time Settings */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">⏰</span> Pengaturan Jam Kelas
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Atur jam check-in dan check-out untuk kelas ini. Siswa akan melihat jam sesuai setting kelas.
              </p>
            </div>
            <button
              onClick={() => setShowTimeSettings(!showTimeSettings)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
            >
              {showTimeSettings ? 'Tutup' : 'Atur Jam'}
            </button>
          </div>

          {/* Current Times Display */}
          {!showTimeSettings && classInfo && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-white rounded-lg p-4 border-2 border-green-200">
                <div className="text-sm font-semibold text-gray-600 mb-1">🟢 Check Datang</div>
                <div className="text-lg font-bold text-gray-800">
                  {classInfo.checkin_start_time} - {classInfo.checkin_end_time}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
                <div className="text-sm font-semibold text-gray-600 mb-1">🔵 Check Pulang</div>
                <div className="text-lg font-bold text-gray-800">
                  {classInfo.checkout_start_time} - {classInfo.checkout_end_time}
                </div>
              </div>
            </div>
          )}

          {/* Time Settings Form */}
          {showTimeSettings && (
            <form onSubmit={handleSaveClassTimes} className="mt-4 bg-white rounded-lg p-6 border-2 border-purple-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-800 flex items-center gap-2">
                    🟢 Waktu Check Datang
                  </h4>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Jam Mulai</label>
                    <input
                      type="time"
                      value={classTimes.checkin_start_time}
                      onChange={(e) => setClassTimes({ ...classTimes, checkin_start_time: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Jam Selesai</label>
                    <input
                      type="time"
                      value={classTimes.checkin_end_time}
                      onChange={(e) => setClassTimes({ ...classTimes, checkin_end_time: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-800 flex items-center gap-2">
                    🔵 Waktu Check Pulang
                  </h4>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Jam Mulai</label>
                    <input
                      type="time"
                      value={classTimes.checkout_start_time}
                      onChange={(e) => setClassTimes({ ...classTimes, checkout_start_time: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Jam Selesai</label>
                    <input
                      type="time"
                      value={classTimes.checkout_end_time}
                      onChange={(e) => setClassTimes({ ...classTimes, checkout_end_time: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowTimeSettings(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingTimes}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-bold disabled:opacity-50"
                >
                  {savingTimes ? 'Menyimpan...' : '💾 Simpan Jam Kelas'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Download Section */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-2xl">📊</span> Download Data Kehadiran
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Download data kehadiran siswa dalam format Excel (.xlsx)
              </p>
              <div className="flex flex-wrap gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Dari Tanggal</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Sampai Tanggal</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200"
                  />
                </div>
              </div>
              {(dateRange.start || dateRange.end) && (
                <button
                  onClick={() => setDateRange({ start: '', end: '' })}
                  className="mt-2 text-xs text-gray-600 hover:text-gray-800 underline"
                >
                  Reset Filter
                </button>
              )}
            </div>
            <button
              onClick={handleDownloadExcel}
              disabled={downloading}
              className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed font-bold whitespace-nowrap flex items-center gap-2"
            >
              {downloading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Mengunduh...
                </>
              ) : (
                <>
                  <span className="text-xl">⬇️</span>
                  Download Excel
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => {
              fetchStudentsWithoutClass();
              setShowAddExistingStudent(true);
            }}
            className="bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 transition-all font-bold text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <span className="text-2xl">➕</span>
            Tambah Siswa Existing
          </button>
          <button
            onClick={() => setShowAddStudent(true)}
            className="bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 transition-all font-bold text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <span className="text-2xl">➕</span>
            Buat Siswa Baru
          </button>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Daftar Siswa</h2>
          
          {students.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-4xl mb-3">👨‍🎓</div>
              <p className="text-gray-600 font-medium mb-1">Belum ada siswa di kelas ini</p>
              <p className="text-sm text-gray-500">Klik tombol di atas untuk menambahkan siswa</p>
            </div>
          ) : (
            <div className="space-y-2">
              {students.map((student, index) => (
                <div key={student.id} className="p-3 border border-gray-200 rounded-lg hover:border-blue-400 transition-all bg-white hover:shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-white font-medium bg-gradient-to-br from-blue-500 to-indigo-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 text-sm">{student.name}</h4>
                        <p className="text-xs text-gray-500">{student.email}</p>
                        {student.teacher_validated && student.final_status && (
                          <div className="mt-1 flex items-center gap-2">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                              student.final_status === 'HADIR_PENUH' ? 'bg-green-100 text-green-800' :
                              student.final_status === 'HADIR_PARSIAL' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              ✓ {student.final_status === 'HADIR_PENUH' ? 'Hadir Penuh' :
                                 student.final_status === 'HADIR_PARSIAL' ? 'Hadir Parsial' :
                                 'Perlu Verifikasi'}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(student.validated_at).toLocaleDateString('id-ID', { 
                                day: 'numeric', 
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRemoveStudent(student.id, student.name)}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-xs font-medium"
                        title="Hapus dari kelas"
                      >
                        🗑️ Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Existing Student Modal */}
        {showAddExistingStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Tambah Siswa Existing ke Kelas</h3>
              {studentsWithoutClass.length === 0 ? (
                <p className="text-gray-600 text-center py-4">Tidak ada siswa yang belum terdaftar di kelas manapun.</p>
              ) : (
                <div className="space-y-2">
                  {studentsWithoutClass.map((student) => (
                    <div key={student.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 transition">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium text-gray-800">{student.name}</h4>
                          <p className="text-sm text-gray-500">{student.email}</p>
                        </div>
                        <button
                          onClick={() => handleAddExistingStudent(student.id, student.name)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                        >
                          Tambah
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddExistingStudent(false)}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Student Modal */}
        {showAddStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Buat Siswa Baru</h3>
              <p className="text-sm text-gray-600 mb-4">
                ℹ️ Password akan dibuat otomatis untuk keperluan mendesak
              </p>
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
                  <input
                    type="text"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                    placeholder="Nama siswa"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                    placeholder="email@example.com"
                    required
                  />
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    🔑 Password otomatis akan dibuat dari nama siswa (nama + "123")
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddStudent(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Tambah
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
