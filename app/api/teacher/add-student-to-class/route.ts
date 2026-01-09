import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { extractToken, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Add existing student to a class
export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('authorization'));
    const payload = await verifyToken(token || '');

    if (!payload || payload.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { student_id, class_id } = await request.json();

    if (!student_id || !class_id) {
      return NextResponse.json({ error: 'student_id dan class_id diperlukan' }, { status: 400 });
    }

    // Check if teacher teaches this class
    const teacherClass = await pool.query(
      'SELECT id FROM teacher_classes WHERE teacher_id = $1 AND class_id = $2',
      [payload.userId, class_id]
    );

    if (teacherClass.rows.length === 0) {
      return NextResponse.json({ error: 'Anda tidak mengajar kelas ini' }, { status: 403 });
    }

    // Check if student exists and doesn't have a class
    const student = await pool.query(
      'SELECT id, name, email, class_id FROM users WHERE id = $1 AND role = $\'STUDENT\'',
      [student_id]
    );

    if (student.rows.length === 0) {
      return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 });
    }

    if (student.rows[0].class_id) {
      return NextResponse.json({ 
        error: 'Siswa sudah terdaftar di kelas lain' 
      }, { status: 400 });
    }

    // Add student to class
    await pool.query(
      'UPDATE users SET class_id = $1 WHERE id = $2',
      [class_id, student_id]
    );

    // Get class name
    const classInfo = await pool.query(
      'SELECT name FROM classes WHERE id = $1',
      [class_id]
    );

    return NextResponse.json({ 
      success: true, 
      message: `${student.rows[0].name} berhasil ditambahkan ke kelas ${classInfo.rows[0].name}`
    });
  } catch (error) {
    console.error('Add student to class error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
