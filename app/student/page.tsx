'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [showClassList, setShowClassList] = useState(false);
  const [joiningClass, setJoiningClass] = useState(false);
  const [leavingClass, setLeavingClass] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(userStr);
    if (userData.role !== 'STUDENT') {
      router.push('/login');
      return;
    }

    setUser(userData);
    
    // If user doesn't have a class, show class selection
    if (!userData.class) {
      fetchAvailableClasses();
      setShowClassList(true);
      setLoading(false);
    } else {
      fetchAttendanceStatus();
    }
  }, [router]);

  const fetchAttendanceStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setAttendance(data.attendance);
        if (data.user) {
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableClasses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student/available-classes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setAvailableClasses(data.classes);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleLeaveClass = async () => {
    if (!confirm('Apakah Anda yakin ingin meninggalkan kelas ini? Anda perlu bergabung dengan kelas lain setelah keluar.')) {
      return;
    }

    setLeavingClass(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student/leave-class', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal keluar dari kelas');
      }

      // Update user data in localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      setMessage({ type: 'success', text: data.message });
      setShowClassList(true);
      setAttendance(null);
      
      // Fetch available classes
      fetchAvailableClasses();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLeavingClass(false);
    }
  };

  const handleJoinClass = async (classId: number, className: string) => {
    if (!confirm(`Apakah Anda yakin ingin bergabung dengan kelas ${className}? Anda hanya dapat bergabung dengan satu kelas.`)) {
      return;
    }

    setJoiningClass(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student/join-class', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ class_id: classId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal bergabung ke kelas');
      }

      // Update user data in localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      setMessage({ type: 'success', text: data.message });
      setShowClassList(false);
      
      // Fetch attendance status after joining class
      fetchAttendanceStatus();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setJoiningClass(false);
    }
  };

  const getLocation = (): Promise<{ latitude: number; longitude: number; accuracy: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation tidak didukung oleh browser Anda'));
        return;
      }

      console.log('Requesting high accuracy location...');
      
      let watchId: number;
      let bestAccuracy = Infinity;
      let bestPosition: GeolocationPosition | null = null;
      let attempts = 0;
      const maxAttempts = 5; // Try to get better accuracy for up to 5 readings (faster)
      const acceptableAccuracy = 150; // Accept if accuracy is better than 150 meters

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          attempts++;
          console.log(`Location attempt ${attempts}: accuracy = ${position.coords.accuracy}m`);
          
          // Keep track of the best (most accurate) position
          if (position.coords.accuracy < bestAccuracy) {
            bestAccuracy = position.coords.accuracy;
            bestPosition = position;
          }

          // If we got good accuracy or reached max attempts, resolve
          if (position.coords.accuracy <= acceptableAccuracy || attempts >= maxAttempts) {
            navigator.geolocation.clearWatch(watchId);
            
            if (bestPosition) {
              console.log('Best location found:', {
                lat: bestPosition.coords.latitude,
                lng: bestPosition.coords.longitude,
                accuracy: bestPosition.coords.accuracy
              });
              
              resolve({
                latitude: bestPosition.coords.latitude,
                longitude: bestPosition.coords.longitude,
                accuracy: bestPosition.coords.accuracy,
              });
            } else {
              reject(new Error('Tidak dapat mendapatkan lokasi yang akurat'));
            }
          }
        },
        (error) => {
          if (watchId) {
            navigator.geolocation.clearWatch(watchId);
          }
          
          console.error('Geolocation error:', error);
          let errorMessage = 'Gagal mendapatkan lokasi. ';
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Izin lokasi ditolak. Silakan berikan izin di pengaturan browser.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Informasi lokasi tidak tersedia. Pastikan GPS aktif dan Anda di luar ruangan.';
              break;
            case error.TIMEOUT:
              errorMessage += 'Waktu permintaan lokasi habis. Silakan coba lagi di area dengan sinyal GPS lebih baik.';
              break;
            default:
              errorMessage += 'Terjadi kesalahan tidak dikenal.';
          }
          
          reject(new Error(errorMessage));
        },
        { 
          enableHighAccuracy: true, 
          timeout: 5000, // 5 seconds timeout
          maximumAge: 0 
        }
      );

      // Fallback: if nothing happens after 5 seconds, use best position we got
      setTimeout(() => {
        navigator.geolocation.clearWatch(watchId);
        if (bestPosition) {
          console.log('Timeout reached, using best position with accuracy:', bestPosition.coords.accuracy);
          resolve({
            latitude: bestPosition.coords.latitude,
            longitude: bestPosition.coords.longitude,
            accuracy: bestPosition.coords.accuracy,
          });
        } else {
          reject(new Error('Timeout: Tidak dapat mendapatkan lokasi. Pastikan GPS aktif dan Anda berada di area terbuka.'));
        }
      }, 5000);
    });
  };

  const handleCheckin = async () => {
    setActionLoading(true);
    setMessage({ type: 'success', text: '📍 Mencari sinyal GPS... Mohon tunggu sebentar (maks. 5 detik).' });

    try {
      const location = await getLocation();
      
      // Show accuracy in message
      const accuracyText = location.accuracy < 50 
        ? '✓ Akurasi sangat baik' 
        : location.accuracy < 100 
        ? '✓ Akurasi baik'
        : location.accuracy < 500
        ? '⚠️ Akurasi cukup'
        : '⚠️ Akurasi rendah';
      
      setMessage({ 
        type: 'success', 
        text: `${accuracyText} (${Math.round(location.accuracy)}m). Memproses check-in...` 
      });
      
      const token = localStorage.getItem('token');

      const response = await fetch('/api/student/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(location),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Check-in gagal');
      }

      setMessage({ type: 'success', text: data.validation.message });
      setAttendance(data.attendance);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckout = async () => {
    setActionLoading(true);
    setMessage({ type: 'success', text: '📍 Mencari sinyal GPS... Mohon tunggu sebentar (maks. 5 detik).' });

    try {
      const location = await getLocation();
      
      // Show accuracy in message
      const accuracyText = location.accuracy < 50 
        ? '✓ Akurasi sangat baik' 
        : location.accuracy < 100 
        ? '✓ Akurasi baik'
        : location.accuracy < 500
        ? '⚠️ Akurasi cukup'
        : '⚠️ Akurasi rendah';
      
      setMessage({ 
        type: 'success', 
        text: `${accuracyText} (${Math.round(location.accuracy)}m). Memproses check-out...` 
      });
      
      const token = localStorage.getItem('token');

      const response = await fetch('/api/student/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(location),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Check-out gagal');
      }

      setMessage({ type: 'success', text: data.validation.message });
      setAttendance(data.attendance);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Show class selection if user doesn't have a class
  if (showClassList) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Pilih Kelas Anda</h1>
                <p className="text-gray-600">{user?.name}</p>
                <p className="text-sm text-yellow-600 mt-2">⚠️ Anda belum terdaftar di kelas manapun. Silakan pilih kelas untuk bergabung.</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`rounded-lg p-4 mb-6 ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Available Classes */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Daftar Kelas Tersedia</h2>
            
            {availableClasses.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Tidak ada kelas yang tersedia saat ini.</p>
            ) : (
              <div className="space-y-4">
                {availableClasses.map((classItem) => (
                  <div
                    key={classItem.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800">{classItem.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Tingkat:</span> Kelas {classItem.grade_level}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Wali Kelas:</span> {classItem.teacher_names}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          👥 {classItem.student_count} siswa terdaftar
                        </p>
                      </div>
                      <button
                        onClick={() => handleJoinClass(classItem.id, classItem.name)}
                        disabled={joiningClass}
                        className="ml-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {joiningClass ? 'Bergabung...' : 'Gabung Kelas'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <p className="text-sm text-blue-800">
              ℹ️ <strong>Catatan:</strong> Anda hanya dapat bergabung dengan satu kelas. Pilih dengan hati-hati sesuai dengan kelas Anda yang sebenarnya.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'HADIR_PENUH':
        return <span className="px-5 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-base font-bold shadow-md border-2 border-green-300">🟢 Hadir Penuh</span>;
      case 'HADIR_PARSIAL':
        return <span className="px-5 py-2 bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 rounded-full text-base font-bold shadow-md border-2 border-yellow-300">🟡 Hadir Parsial</span>;
      case 'PERLU_VERIFIKASI':
        return <span className="px-5 py-2 bg-gradient-to-r from-red-100 to-rose-100 text-red-800 rounded-full text-base font-bold shadow-md border-2 border-red-300">🔴 Perlu Verifikasi</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with animated gradient */}
        <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-8 mb-4 sm:mb-6 border-t-4 border-blue-500">
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                🎓 Dashboard Siswa
              </h1>
              <p className="text-lg sm:text-xl text-gray-800 mt-2 font-semibold break-words">{user?.name}</p>
              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                    📚 {user?.class?.name || 'Belum ada kelas'}
                  </span>
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
                    🎯 Kelas {user?.class?.grade_level || '-'}
                  </span>
                </div>
                {user?.class?.teacher_names && (
                  <p className="text-xs sm:text-sm text-gray-600 flex flex-wrap items-center gap-2">
                    <span className="font-semibold whitespace-nowrap">👨‍🏫 Wali Kelas:</span>
                    <span className="text-gray-800 font-medium break-words">{user.class.teacher_names}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <button
                onClick={handleLogout}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
              >
                🚪 Logout
              </button>
              {user?.class && (
                <button
                  onClick={handleLeaveClass}
                  disabled={leavingClass}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:from-red-600 hover:to-rose-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base"
                >
                  {leavingClass ? '⏳ Memproses...' : '🚫 Tinggalkan Kelas'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Message with better styling */}
        {message && (
          <div
            className={`rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6 shadow-lg border-l-4 ${
              message.type === 'success'
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-500 text-green-800'
                : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-500 text-red-800'
            }`}
          >
            <div className="flex items-start gap-2 sm:gap-3">
              <span className="text-xl sm:text-2xl flex-shrink-0">{message.type === 'success' ? '✅' : '⚠️'}</span>
              <p className="flex-1 font-medium text-sm sm:text-base break-words">{message.text}</p>
            </div>
          </div>
        )}

        {/* Status Card with modern design */}
        <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-8 mb-4 sm:mb-6 border border-gray-100">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2 text-gray-800">
            <span className="text-2xl sm:text-3xl">📊</span> 
            <span className="break-words">Status Kehadiran Hari Ini</span>
          </h2>
          
          {attendance ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                <span className="text-gray-700 font-semibold text-lg">Status Saat Ini:</span>
                {getStatusBadge(attendance.final_status)}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 sm:p-5 rounded-xl border-2 border-green-200">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <span className="text-2xl sm:text-3xl">🟢</span>
                    <span className="text-gray-700 font-semibold text-sm sm:text-base">Check-in</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-800">
                    {attendance.check_in_time
                      ? new Date(attendance.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                      : '-- : --'}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">
                    {attendance.check_in_time ? new Date(attendance.check_in_time).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Belum check-in'}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-sky-50 p-4 sm:p-5 rounded-xl border-2 border-blue-200">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <span className="text-2xl sm:text-3xl">🔵</span>
                    <span className="text-gray-700 font-semibold text-sm sm:text-base">Check-out</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-800">
                    {attendance.check_out_time
                      ? new Date(attendance.check_out_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                      : '-- : --'}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">
                    {attendance.check_out_time ? new Date(attendance.check_out_time).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Belum check-out'}
                  </p>
                </div>
              </div>

              {attendance.teacher_validated && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-5 shadow-md">
                  <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                    <span className="text-xl">✅</span> Sudah divalidasi oleh guru
                  </p>
                  {attendance.teacher_note && (
                    <p className="text-sm text-gray-700 mt-2 pl-7">
                      <span className="font-semibold">Catatan:</span> {attendance.teacher_note}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-6xl mb-4">📅</p>
              <p className="text-gray-500 text-lg">Belum ada data kehadiran hari ini</p>
              <p className="text-gray-400 text-sm mt-2">Silakan check-in untuk memulai</p>
            </div>
          )}
        </div>

        {/* Action Buttons with better design */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <button
            onClick={handleCheckin}
            disabled={actionLoading || attendance?.check_in_time}
            className={`${
              attendance?.check_in_time 
                ? 'bg-gradient-to-r from-gray-300 to-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-xl hover:shadow-2xl active:scale-95'
            } text-white py-6 sm:py-8 rounded-2xl font-bold text-lg sm:text-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed touch-manipulation`}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl sm:text-4xl">{attendance?.check_in_time ? '✅' : '📍'}</span>
              <span className="text-sm sm:text-base">{attendance?.check_in_time ? 'Sudah Check-in' : 'Check-in Kehadiran'}</span>
              {!attendance?.check_in_time && (
                <span className="text-xs sm:text-sm font-normal opacity-90">Jam 07:00 - 12:00</span>
              )}
            </div>
          </button>

          <button
            onClick={handleCheckout}
            disabled={actionLoading || !attendance?.check_in_time || attendance?.check_out_time}
            className={`${
              attendance?.check_out_time 
                ? 'bg-gradient-to-r from-gray-300 to-gray-400 cursor-not-allowed' 
                : attendance?.check_in_time
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-xl hover:shadow-2xl active:scale-95'
                : 'bg-gradient-to-r from-gray-300 to-gray-400 cursor-not-allowed'
            } text-white py-6 sm:py-8 rounded-2xl font-bold text-lg sm:text-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed touch-manipulation`}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl sm:text-4xl">{attendance?.check_out_time ? '✅' : '🏁'}</span>
              <span className="text-sm sm:text-base">{attendance?.check_out_time ? 'Sudah Check-out' : 'Check-out Kehadiran'}</span>
              {attendance?.check_in_time && !attendance?.check_out_time && (
                <span className="text-xs sm:text-sm font-normal opacity-90">Jam 14:00 - 15:00</span>
              )}
            </div>
          </button>
        </div>

        {/* Info Box for time windows */}
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-2xl p-4 sm:p-6 mt-4 sm:mt-6 shadow-lg">
          <div className="flex items-start gap-2 sm:gap-3">
            <span className="text-2xl sm:text-3xl flex-shrink-0">⏰</span>
            <div className="flex-1">
              <h3 className="font-bold text-gray-800 mb-2 text-sm sm:text-base">Jadwal Absensi</h3>
              <div className="space-y-1 text-xs sm:text-sm text-gray-700">
                <p className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-green-700 whitespace-nowrap">🟢 Check-in:</span> 
                  <span>07:00 - 12:00 WIB</span>
                </p>
                <p className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-blue-700 whitespace-nowrap">🔵 Check-out:</span> 
                  <span>14:00 - 15:00 WIB</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Notice with modern styling */}
        <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-8 mt-4 sm:mt-6 border-l-4 border-purple-500">
          <h3 className="font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2 text-base sm:text-lg">
            <span className="text-xl sm:text-2xl">🔒</span> Privasi Anda Terlindungi
          </h3>
          <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-700">
            <li className="flex items-start gap-2 sm:gap-3">
              <span className="text-green-500 font-bold flex-shrink-0">✓</span>
              <span>Lokasi hanya diambil saat Anda menekan tombol check-in/check-out</span>
            </li>
            <li className="flex items-start gap-2 sm:gap-3">
              <span className="text-green-500 font-bold flex-shrink-0">✓</span>
              <span>Tidak ada pelacakan berkelanjutan atau background tracking</span>
            </li>
            <li className="flex items-start gap-2 sm:gap-3">
              <span className="text-green-500 font-bold flex-shrink-0">✓</span>
              <span>Koordinat GPS tidak disimpan, hanya status validasi kehadiran</span>
            </li>
            <li className="flex items-start gap-2 sm:gap-3">
              <span className="text-green-500 font-bold flex-shrink-0">✓</span>
              <span>Guru dapat memvalidasi kehadiran secara manual jika diperlukan</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
