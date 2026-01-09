import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { extractToken, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Get all available classes that teacher hasn't joined yet
export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('authorization'));
    const payload = await verifyToken(token || '');

    if (!payload || payload.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all classes that this teacher hasn't joined
    const result = await pool.query(
      `SELECT c.id, c.name, c.grade_level,
        (SELECT COUNT(*) FROM users WHERE class_id = c.id AND role = 'STUDENT') as student_count
      FROM classes c
      WHERE c.id NOT IN (
        SELECT class_id FROM teacher_classes WHERE teacher_id = $1
      )
      ORDER BY c.grade_level, c.name`,
      [payload.userId]
    );

    return NextResponse.json({
      success: true,
      available_classes: result.rows,
    });
  } catch (error) {
    console.error('Get available classes error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Join an existing class
export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('authorization'));
    const payload = await verifyToken(token || '');

    if (!payload || payload.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { class_id } = await request.json();

    if (!class_id) {
      return NextResponse.json(
        { error: 'class_id diperlukan' },
        { status: 400 }
      );
    }

    // Check if class exists
    const classCheck = await pool.query(
      'SELECT id, name FROM classes WHERE id = $1',
      [class_id]
    );

    if (classCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Kelas tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if teacher already joined this class
    const existingJoin = await pool.query(
      'SELECT id FROM teacher_classes WHERE teacher_id = $1 AND class_id = $2',
      [payload.userId, class_id]
    );

    if (existingJoin.rows.length > 0) {
      return NextResponse.json(
        { error: 'Anda sudah bergabung dengan kelas ini' },
        { status: 400 }
      );
    }

    // Join the class
    await pool.query(
      'INSERT INTO teacher_classes (teacher_id, class_id) VALUES ($1, $2)',
      [payload.userId, class_id]
    );

    return NextResponse.json({
      success: true,
      message: `Berhasil bergabung dengan kelas ${classCheck.rows[0].name}`,
    });
  } catch (error) {
    console.error('Join class error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
