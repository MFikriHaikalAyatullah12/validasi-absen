import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { extractToken, verifyToken, hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Get students in teacher's classes
export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('authorization'));
    const payload = await verifyToken(token || '');

    if (!payload || payload.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const classId = url.searchParams.get('class_id');

    let query, params;

    if (classId) {
      // Get students in specific class with latest validation status
      query = `
        SELECT 
          u.id, 
          u.name, 
          u.email, 
          u.class_id, 
          c.name as class_name, 
          c.grade_level,
          a.final_status,
          a.teacher_validated,
          a.validated_at
        FROM users u
        JOIN classes c ON u.class_id = c.id
        JOIN teacher_classes tc ON tc.class_id = c.id
        LEFT JOIN LATERAL (
          SELECT final_status, teacher_validated, validated_at
          FROM attendance
          WHERE user_id = u.id AND teacher_validated = true
          ORDER BY validated_at DESC
          LIMIT 1
        ) a ON true
        WHERE u.role = 'STUDENT' AND tc.teacher_id = $1 AND u.class_id = $2
        ORDER BY u.name
      `;
      params = [payload.userId, classId];
    } else {
      // Get all students in teacher's classes with latest validation status
      query = `
        SELECT 
          u.id, 
          u.name, 
          u.email, 
          u.class_id, 
          c.name as class_name, 
          c.grade_level,
          a.final_status,
          a.teacher_validated,
          a.validated_at
        FROM users u
        JOIN classes c ON u.class_id = c.id
        JOIN teacher_classes tc ON tc.class_id = c.id
        LEFT JOIN LATERAL (
          SELECT final_status, teacher_validated, validated_at
          FROM attendance
          WHERE user_id = u.id AND teacher_validated = true
          ORDER BY validated_at DESC
          LIMIT 1
        ) a ON true
        WHERE u.role = 'STUDENT' AND tc.teacher_id = $1
        ORDER BY c.grade_level, c.name, u.name
      `;
      params = [payload.userId];
    }

    const result = await pool.query(query, params);

    return NextResponse.json({ success: true, students: result.rows });
  } catch (error) {
    console.error('Get students error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Add student to teacher's class
export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('authorization'));
    const payload = await verifyToken(token || '');

    if (!payload || payload.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, password, class_id } = await request.json();

    if (!name || !email || !password || !class_id) {
      return NextResponse.json({ error: 'Semua field harus diisi' }, { status: 400 });
    }

    // Check if teacher teaches this class
    const teacherClass = await pool.query(
      'SELECT id FROM teacher_classes WHERE teacher_id = $1 AND class_id = $2',
      [payload.userId, class_id]
    );

    if (teacherClass.rows.length === 0) {
      return NextResponse.json({ error: 'Anda tidak mengajar kelas ini' }, { status: 403 });
    }

    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 });
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Create student
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, class_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, class_id',
      [name, email, password_hash, 'STUDENT', class_id]
    );

    return NextResponse.json({ success: true, student: result.rows[0] });
  } catch (error) {
    console.error('Add student error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
