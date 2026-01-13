'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login gagal');
      }

      // Save token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect based on role
      if (data.user.role === 'TEACHER') {
        router.push('/teacher');
      } else if (data.user.role === 'STUDENT') {
        router.push('/student');
      } else {
        throw new Error('Role tidak valid');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Student branding content
  const StudentBranding = () => (
    <>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white rounded-full blur-3xl"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <span className="text-2xl">📍</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Validasi Absen</h1>
        </div>
        <p className="text-blue-100 text-lg">Student Attendance System</p>
      </div>

      <div className="relative z-10 space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full mb-6">
            <span className="text-6xl">👨‍🎓</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Portal Siswa</h2>
          <p className="text-blue-100 text-lg max-w-sm mx-auto">
            Lakukan check-in dan check-out kehadiran dengan mudah dan cepat
          </p>
        </div>

        <div className="space-y-4 max-w-sm mx-auto">
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <span className="text-2xl">📱</span>
            <div>
              <h3 className="text-white font-semibold">Absensi Mudah</h3>
              <p className="text-blue-100 text-sm">Cukup 1 klik untuk check-in</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <span className="text-2xl">📍</span>
            <div>
              <h3 className="text-white font-semibold">Lokasi GPS</h3>
              <p className="text-blue-100 text-sm">Validasi otomatis lokasi</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <span className="text-2xl">📊</span>
            <div>
              <h3 className="text-white font-semibold">Riwayat Lengkap</h3>
              <p className="text-blue-100 text-sm">Lihat rekap kehadiran</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <p className="text-blue-200 text-sm">© 2026 Chekin-out. All rights reserved.</p>
      </div>
    </>
  );

  // Teacher branding content
  const TeacherBranding = () => (
    <>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white rounded-full blur-3xl"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <span className="text-2xl">📍</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Validasi Absen</h1>
        </div>
        <p className="text-emerald-100 text-lg">Student Attendance System</p>
      </div>

      <div className="relative z-10 space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full mb-6">
            <span className="text-6xl">👨‍🏫</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Portal Guru</h2>
          <p className="text-emerald-100 text-lg max-w-sm mx-auto">
            Kelola kelas dan pantau kehadiran siswa dengan dashboard lengkap
          </p>
        </div>

        <div className="space-y-4 max-w-sm mx-auto">
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <span className="text-2xl">👥</span>
            <div>
              <h3 className="text-white font-semibold">Kelola Siswa</h3>
              <p className="text-emerald-100 text-sm">Tambah & atur data siswa</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <span className="text-2xl">✅</span>
            <div>
              <h3 className="text-white font-semibold">Validasi Kehadiran</h3>
              <p className="text-emerald-100 text-sm">Verifikasi absensi siswa</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <span className="text-2xl">📥</span>
            <div>
              <h3 className="text-white font-semibold">Download Laporan</h3>
              <p className="text-emerald-100 text-sm">Export rekap ke Excel</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <p className="text-emerald-200 text-sm">© 2026 Chekin-out. All rights reserved.</p>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Dynamic Branding based on role */}
      <div className={`hidden lg:flex lg:w-1/2 p-12 flex-col justify-between relative overflow-hidden transition-all duration-500 ${
        selectedRole === 'STUDENT' 
          ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700' 
          : 'bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700'
      }`}>
        {selectedRole === 'STUDENT' ? <StudentBranding /> : <TeacherBranding />}
      </div>

      {/* Right Side - Login Form */}
      <div className={`w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 transition-all duration-500 ${
        selectedRole === 'STUDENT'
          ? 'bg-gradient-to-br from-gray-50 to-blue-50'
          : 'bg-gradient-to-br from-gray-50 to-emerald-50'
      }`}>
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="inline-flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-500 ${
                selectedRole === 'STUDENT'
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-600'
                  : 'bg-gradient-to-br from-emerald-600 to-teal-600'
              }`}>
                <span className="text-xl">📍</span>
              </div>
              <h1 className={`text-xl font-bold bg-clip-text text-transparent transition-all duration-500 ${
                selectedRole === 'STUDENT'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600'
              }`}>
                Validasi Absen
              </h1>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {selectedRole === 'STUDENT' ? 'Login Siswa 👨‍🎓' : 'Login Guru 👨‍🏫'}
              </h2>
              <p className="text-gray-500 text-sm">Silakan masuk ke akun Anda</p>
            </div>

            {/* Role Selector */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Masuk Sebagai
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole('STUDENT')}
                  className={`py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                    selectedRole === 'STUDENT'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-[1.02]'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-xl">👨‍🎓</span>
                  <span>Siswa</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('TEACHER')}
                  className={`py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                    selectedRole === 'TEACHER'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg transform scale-[1.02]'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-xl">👨‍🏫</span>
                  <span>Guru</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
                  <span className="text-xl">⚠️</span>
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-400">✉️</span>
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl transition-all text-gray-800 bg-gray-50 focus:bg-white ${
                      selectedRole === 'STUDENT'
                        ? 'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        : 'focus:ring-2 focus:ring-emerald-500 focus:border-transparent'
                    }`}
                    placeholder={selectedRole === 'STUDENT' ? 'siswa@sekolah.com' : 'guru@sekolah.com'}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-400">🔒</span>
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl transition-all text-gray-800 bg-gray-50 focus:bg-white ${
                      selectedRole === 'STUDENT'
                        ? 'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        : 'focus:ring-2 focus:ring-emerald-500 focus:border-transparent'
                    }`}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full text-white py-3.5 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 ${
                  selectedRole === 'STUDENT'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Memproses...
                  </span>
                ) : (
                  `Masuk sebagai ${selectedRole === 'STUDENT' ? 'Siswa' : 'Guru'}`
                )}
              </button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <p className="text-gray-600">
                Belum punya akun?{' '}
                <Link href="/register" className={`font-semibold hover:underline transition ${
                  selectedRole === 'STUDENT' ? 'text-blue-600 hover:text-blue-700' : 'text-emerald-600 hover:text-emerald-700'
                }`}>
                  Daftar Sekarang
                </Link>
              </p>
              
              <button
                type="button"
                onClick={() => {
                  localStorage.clear();
                  alert('Cache dihapus! Silakan login ulang.');
                  window.location.reload();
                }}
                className="text-xs text-gray-400 hover:text-gray-600 transition"
              >
                Bermasalah login? Klik untuk reset
              </button>
            </div>
          </div>

          {/* Footer for mobile */}
          <p className="lg:hidden text-center text-gray-400 text-xs mt-6">
            © 2026 Chekin-out. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
