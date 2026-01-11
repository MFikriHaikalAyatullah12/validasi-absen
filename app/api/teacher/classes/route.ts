import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { extractToken, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Get teacher's classes
export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('authorization'));
    const payload = await verifyToken(token || '');

    if (!payload || payload.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get teacher's classes
    const result = await pool.query(
      `SELECT c.id, c.name, c.grade_level,
              c.checkin_start_time, c.checkin_end_time,
              c.checkout_start_time, c.checkout_end_time,
              COUNT(DISTINCT u.id) as student_count
       FROM teacher_classes tc
       JOIN classes c ON tc.class_id = c.id
       LEFT JOIN users u ON u.class_id = c.id AND u.role = 'STUDENT'
       WHERE tc.teacher_id = $1
       GROUP BY c.id, c.name, c.grade_level, c.checkin_start_time, c.checkin_end_time, c.checkout_start_time, c.checkout_end_time
       ORDER BY c.grade_level, c.name`,
      [payload.userId]
    );

    return NextResponse.json({ success: true, classes: result.rows });
  } catch (error) {
    console.error('Get teacher classes error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Add class for teacher
export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('authorization'));
    const payload = await verifyToken(token || '');

    if (!payload || payload.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, grade_level } = await request.json();

    if (!name || !grade_level) {
      return NextResponse.json({ error: 'Nama kelas dan tingkat harus diisi' }, { status: 400 });
    }

    // Create class
    const classResult = await pool.query(
      'INSERT INTO classes (name, grade_level) VALUES ($1, $2) RETURNING *',
      [name, grade_level]
    );

    const newClass = classResult.rows[0];

    // Assign teacher to class
    await pool.query(
      'INSERT INTO teacher_classes (teacher_id, class_id) VALUES ($1, $2)',
      [payload.userId, newClass.id]
    );

    return NextResponse.json({ success: true, class: newClass });
  } catch (error) {
    console.error('Create class error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
