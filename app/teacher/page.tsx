'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TeacherDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [validatingId, setValidatingId] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

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
    fetchAttendance(date);
  }, [router, date]);

  // Real-time auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    
    const refreshInterval = setInterval(() => {
      fetchAttendance(date, true); // Silent refresh
    }, 10000); // 10 seconds
    
    return () => clearInterval(refreshInterval);
  }, [date, autoRefresh]);

  const fetchAttendance = async (selectedDate: string, silent: boolean = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/teacher/attendance?date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setStudents(data.students);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleValidate = async (attendanceId: number, finalStatus: string, note: string = '') => {
    setValidatingId(attendanceId);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/teacher/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ attendance_id: attendanceId, final_status: finalStatus, teacher_note: note }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Validasi gagal');
      }

      // Refresh data
      fetchAttendance(date);
      alert('Validasi berhasil!');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setValidatingId(null);
    }
  };

  const handleQuickValidate = (student: any, status: string) => {
    if (!student.attendance_id) {
      alert('Siswa belum melakukan check-in');
      return;
    }

    const note = prompt(`Masukkan catatan untuk ${student.name} (opsional):`);
    handleValidate(student.attendance_id, status, note || '');
  };

  const handleLogout = async () => {
    try {
      // Call logout API to clear cookie
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login
      router.push('/login');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'HADIR_PENUH':
        return <span className="px-3 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-xs font-bold border-2 border-green-300 shadow-sm">🟢 Hadir Penuh</span>;
      case 'HADIR_PARSIAL':
        return <span className="px-3 py-1.5 bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 rounded-full text-xs font-bold border-2 border-yellow-300 shadow-sm">🟡 Hadir Parsial</span>;
      case 'PERLU_VERIFIKASI':
        return <span className="px-3 py-1.5 bg-gradient-to-r from-red-100 to-rose-100 text-red-800 rounded-full text-xs font-bold border-2 border-red-300 shadow-sm">🔴 Perlu Verifikasi</span>;
      default:
        return <span className="px-3 py-1.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 rounded-full text-xs font-bold border-2 border-gray-300 shadow-sm">⚪ Belum Absen</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-8 mb-4 sm:mb-6 border-t-4 border-indigo-500">
          <div className="flex flex-col gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2 flex-wrap">
                👨‍🏫 Dashboard Guru
              </h1>
              <p className="text-lg sm:text-xl text-gray-800 mt-2 font-semibold break-words">{user?.name}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Link
                href="/teacher/manage"
                className="w-full sm:w-auto text-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl font-semibold text-sm sm:text-base"
              >
                📚 Kelola Kelas & Siswa
              </Link>
              <button
                onClick={handleLogout}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
              >
                🚪 Logout
              </button>
            </div>
          </div>

          {/* Date Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 sm:p-4 rounded-xl border-2 border-blue-200">
            <label className="text-sm sm:text-base font-semibold text-gray-800 flex items-center gap-2 whitespace-nowrap">
              <span className="text-xl sm:text-2xl">📅</span> Tanggal:
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium shadow-sm text-sm sm:text-base"
            />
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                  autoRefresh 
                    ? 'bg-green-100 text-green-800 border-2 border-green-300' 
                    : 'bg-gray-100 text-gray-600 border-2 border-gray-300'
                }`}
              >
                {autoRefresh ? '🔄 Auto-refresh ON' : '⏸️ Auto-refresh OFF'}
              </button>
            </div>
          </div>
          {autoRefresh && (
            <div className="mt-2 text-xs text-indigo-600 font-medium flex items-center gap-1">
              <span className="animate-pulse">🔴</span> Live - Data diperbarui otomatis setiap 10 detik
            </div>
          )}
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b-2 border-indigo-200">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">📊</span> Daftar Kehadiran Siswa
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">No</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Nama Siswa</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Datang</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Pulang</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Validasi</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((student, index) => (
                  <tr key={student.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">{student.name}</div>
                      <div className="text-xs text-gray-600">{student.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {student.check_in_time ? (
                        <div>
                          <div>{new Date(student.check_in_time).toLocaleTimeString('id-ID')}</div>
                          <div className="text-xs text-gray-500">{student.check_in_status}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {student.check_out_time ? (
                        <div>
                          <div>{new Date(student.check_out_time).toLocaleTimeString('id-ID')}</div>
                          <div className="text-xs text-gray-500">{student.check_out_status}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(student.final_status)}</td>
                    <td className="px-6 py-4">
                      {student.teacher_validated ? (
                        <span className="text-xs text-green-600">✓ Sudah</span>
                      ) : (
                        <span className="text-xs text-gray-400">Belum</span>
                      )}
                      {student.teacher_note && (
                        <div className="text-xs text-gray-500 mt-1">
                          {student.teacher_note}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {student.attendance_id && !student.teacher_validated && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleQuickValidate(student, 'HADIR_PENUH')}
                            disabled={validatingId === student.attendance_id}
                            className="px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-bold rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                            title="Hadir Penuh"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => handleQuickValidate(student, 'HADIR_PARSIAL')}
                            disabled={validatingId === student.attendance_id}
                            className="px-3 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-sm font-bold rounded-lg hover:from-yellow-600 hover:to-amber-700 disabled:opacity-50 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                            title="Hadir Parsial"
                          >
                            ~
                          </button>
                          <button
                            onClick={() => handleQuickValidate(student, 'PERLU_VERIFIKASI')}
                            disabled={validatingId === student.attendance_id}
                            className="px-3 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-bold rounded-lg hover:from-red-600 hover:to-rose-700 disabled:opacity-50 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                            title="Perlu Verifikasi"
                          >
                            ✗
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {students.length === 0 && (
            <div className="text-center py-16">
              <p className="text-6xl mb-4">📚</p>
              <p className="text-gray-500 text-lg font-medium">Tidak ada data siswa</p>
              <p className="text-gray-400 text-sm mt-2">Siswa akan muncul setelah melakukan check-in</p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mt-6 border-l-4 border-indigo-500">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
            <span className="text-2xl">ℹ️</span> Panduan Aksi Validasi Cepat
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border-2 border-green-200">
              <span className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold shadow-md">✓</span>
              <span className="font-semibold text-gray-700">Validasi Hadir Penuh</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border-2 border-yellow-200">
              <span className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-lg font-bold shadow-md">~</span>
              <span className="font-semibold text-gray-700">Validasi Hadir Parsial</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border-2 border-red-200">
              <span className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg font-bold shadow-md">✗</span>
              <span className="font-semibold text-gray-700">Tandai Perlu Verifikasi</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
