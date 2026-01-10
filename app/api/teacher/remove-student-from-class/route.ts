import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { extractToken, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Remove student from class (set class_id to NULL)
export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('authorization'));
    const payload = await verifyToken(token || '');

    if (!payload || payload.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { student_id } = await request.json();

    if (!student_id) {
      return NextResponse.json({ error: 'student_id diperlukan' }, { status: 400 });
    }

    // Get student info before removing
    const student = await pool.query(
      'SELECT id, name, class_id FROM users WHERE id = $1 AND role = $\'STUDENT\'',
      [student_id]
    );

    if (student.rows.length === 0) {
      return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 });
    }

    if (!student.rows[0].class_id) {
      return NextResponse.json({ 
        error: 'Siswa tidak terdaftar di kelas manapun' 
      }, { status: 400 });
    }

    // Check if teacher teaches this class
    const teacherClass = await pool.query(
      'SELECT id FROM teacher_classes WHERE teacher_id = $1 AND class_id = $2',
      [payload.userId, student.rows[0].class_id]
    );

    if (teacherClass.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Anda tidak mengajar kelas siswa ini' 
      }, { status: 403 });
    }

    // Delete all attendance records for this student (fresh start when rejoining)
    await pool.query(
      'DELETE FROM attendance WHERE user_id = $1',
      [student_id]
    );

    // Remove student from class (set class_id to NULL)
    await pool.query(
      'UPDATE users SET class_id = NULL WHERE id = $1',
      [student_id]
    );

    return NextResponse.json({ 
      success: true, 
      message: `${student.rows[0].name} berhasil dikeluarkan dari kelas`
    });
  } catch (error) {
    console.error('Remove student from class error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
