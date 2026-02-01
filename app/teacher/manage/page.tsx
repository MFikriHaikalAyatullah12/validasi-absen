'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TeacherManagePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddClass, setShowAddClass] = useState(false);
  const [showJoinClass, setShowJoinClass] = useState(false);
  const [showEditClass, setShowEditClass] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [newClass, setNewClass] = useState({ name: '', grade_level: '10' });
  const [editingClass, setEditingClass] = useState<any>(null);

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
    fetchClasses();
  }, [router]);

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/teacher/classes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setClasses(data.classes);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableClasses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/teacher/join-class', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setAvailableClasses(data.available_classes);
      }
    } catch (error) {
      console.error('Error fetching available classes:', error);
    }
  };

  const handleJoinClass = async (classId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/teacher/join-class', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ class_id: classId }),
      });
      const data = await response.json();
      if (data.success) {
        alert(data.message);
        setShowJoinClass(false);
        fetchClasses();
      } else {
        alert(data.error || 'Gagal bergabung dengan kelas');
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/teacher/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newClass),
      });
      const data = await response.json();
      if (data.success) {
        alert('Kelas berhasil ditambahkan!');
        setShowAddClass(false);
        setNewClass({ name: '', grade_level: '10' });
        fetchClasses();
      } else {
        alert(data.error || 'Gagal menambahkan kelas');
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleEditClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;

    const confirmEdit = confirm(`Apakah Anda yakin ingin mengubah kelas "${editingClass.name}"?`);
    if (!confirmEdit) return;

    updateClass();
  };

  const updateClass = async () => {
    if (!editingClass) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/teacher/classes/${editingClass.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editingClass.name
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert('Kelas berhasil diubah!');
        setShowEditClass(false);
        setEditingClass(null);
        fetchClasses();
      } else {
        alert(data.error || 'Gagal mengubah kelas');
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    }
  };

  const handleDeleteClass = async (classId: number, className: string) => {
    const confirmDelete = confirm(`Apakah Anda yakin ingin menghapus kelas "${className}"? Semua data siswa di kelas ini akan dihapus!`);
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/teacher/classes/${classId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        alert('Kelas berhasil dihapus!');
        fetchClasses();
      } else {
        alert(data.error || 'Gagal menghapus kelas');
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    }
  };

  const openEditModal = (cls: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingClass({ ...cls });
    setShowEditClass(true);
  };

  const openDeleteConfirm = (classId: number, className: string, e: React.MouseEvent) => {
    e.stopPropagation();
    handleDeleteClass(classId, className);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-900">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6 border-t-4 border-purple-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
                📚 Kelola Kelas & Siswa
              </h1>
              <p className="text-xl text-gray-800 mt-2 font-semibold">{user?.name}</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/teacher"
                className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                ← Kembali
              </Link>
              <button
                onClick={handleLogout}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-xl hover:from-red-700 hover:to-rose-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Classes Section */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-3xl">🏛️</span> Kelas Saya
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    fetchAvailableClasses();
                    setShowJoinClass(true);
                  }}
                  className="px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold flex items-center gap-2"
                >
                  <span>➕</span> Gabung Kelas
                </button>
                <button
                  onClick={() => setShowAddClass(true)}
                  className="px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold flex items-center gap-2"
                >
                  <span>✨</span> Buat Kelas Baru
                </button>
              </div>
            </div>

            {classes.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-6xl mb-4">📚</p>
                <p className="text-gray-500 text-lg font-medium">Belum ada kelas</p>
                <p className="text-gray-400 text-sm mt-2">Buat kelas baru atau gabung kelas yang sudah ada</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="p-6 border-2 rounded-2xl transition-all hover:border-purple-400 hover:shadow-2xl border-gray-200 bg-gradient-to-br from-white to-purple-50 transform hover:-translate-y-1 relative"
                  >
                    <div 
                      onClick={() => router.push(`/teacher/manage/${cls.id}`)}
                      className="cursor-pointer"
                    >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 pr-2">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold text-gray-800">{cls.name}</h3>
                          {/* Action buttons */}
                          <div className="flex gap-1.5">
                            <button
                              onClick={(e) => openEditModal(cls, e)}
                              className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-all shadow-sm hover:shadow-md transform hover:scale-110 active:scale-95"
                              title="Edit Kelas"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => openDeleteConfirm(cls.id, cls.name, e)}
                              className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md transition-all shadow-sm hover:shadow-md transform hover:scale-110 active:scale-95"
                              title="Hapus Kelas"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
                            Kelas {cls.grade_level}
                          </span>
                        </p>
                      </div>
                      <div className="text-center bg-gradient-to-br from-purple-100 to-pink-100 px-4 py-3 rounded-xl border-2 border-purple-300">
                        <p className="text-2xl font-bold text-purple-700">{cls.student_count}</p>
                        <p className="text-xs text-purple-600 font-semibold">siswa</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t-2 border-purple-100">
                      <p className="text-sm text-purple-600 font-semibold flex items-center gap-2">
                        <span>👆</span> Klik untuk kelola kelas ini →
                      </p>
                    </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add Class Modal */}
        {showAddClass && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border-t-4 border-blue-500">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="text-3xl">✨</span> Buat Kelas Baru
              </h3>
              <form onSubmit={handleAddClass} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nama Kelas</label>
                  <input
                    type="text"
                    value={newClass.name}
                    onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                    placeholder="Contoh: Kelas 10 IPA 1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tingkat Kelas</label>
                  <select
                    value={newClass.grade_level}
                    onChange={(e) => setNewClass({ ...newClass, grade_level: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                    required
                  >
                    <option value="10">Kelas 10</option>
                    <option value="11">Kelas 11</option>
                    <option value="12">Kelas 12</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddClass(false)}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 font-semibold shadow-lg transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 font-semibold shadow-lg transition-all"
                  >
                    ✓ Buat Kelas
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Class Modal */}
        {showEditClass && editingClass && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border-t-4 border-blue-500">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="text-3xl">✏️</span> Edit Kelas
              </h3>
              <form onSubmit={handleEditClass} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nama Kelas</label>
                  <input
                    type="text"
                    value={editingClass.name}
                    onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                    placeholder="Contoh: Kelas 10 IPA 1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tingkat Kelas</label>
                  <input
                    type="text"
                    value={`Kelas ${editingClass.grade_level}`}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-gray-500 bg-gray-100 cursor-not-allowed"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">Tingkat kelas tidak dapat diubah</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditClass(false);
                      setEditingClass(null);
                    }}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 font-semibold shadow-lg transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 font-semibold shadow-lg transition-all"
                  >
                    ✓ Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Join Class Modal */}
        {showJoinClass && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border-t-4 border-green-500">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="text-3xl">➕</span> Gabung Kelas Yang Ada
              </h3>
              {availableClasses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-5xl mb-3">📋</p>
                  <p className="text-gray-600 font-medium">Tidak ada kelas yang tersedia untuk digabung.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {availableClasses.map((cls) => (
                    <div key={cls.id} className="p-5 border-2 border-gray-200 rounded-xl hover:border-green-400 hover:shadow-lg transition-all bg-gradient-to-r from-white to-green-50">
                      <div className="flex justify-between items-center gap-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 text-lg">{cls.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold text-xs">
                              Kelas {cls.grade_level}
                            </span>
                            <span className="ml-2 text-gray-500">• {cls.student_count} siswa</span>
                          </p>
                        </div>
                        <button
                          onClick={() => handleJoinClass(cls.id)}
                          className="px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-md font-semibold"
                        >
                          ✓ Gabung
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowJoinClass(false)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 font-semibold shadow-lg transition-all"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
