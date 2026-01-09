import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { extractToken, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('authorization'));
    const payload = await verifyToken(token || '');

    if (!payload || payload.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get date and class_id from query params
    const url = new URL(request.url);
    const dateParam = url.searchParams.get('date');
    const classIdParam = url.searchParams.get('class_id');
    const date = dateParam || new Date().toISOString().split('T')[0];

    let query, params;

    if (classIdParam) {
      // Get students in specific class
      query = `
        SELECT 
          u.id, u.name, u.email, c.name as class_name,
          a.id as attendance_id,
          a.date,
          a.check_in_time,
          a.check_in_status,
          a.check_out_time,
          a.check_out_status,
          a.final_status,
          a.teacher_validated,
          a.teacher_note
        FROM users u
        JOIN classes c ON u.class_id = c.id
        JOIN teacher_classes tc ON tc.class_id = c.id
        LEFT JOIN attendance a ON u.id = a.user_id AND a.date = $1
        WHERE u.role = 'STUDENT' AND tc.teacher_id = $2 AND u.class_id = $3
        ORDER BY u.name
      `;
      params = [date, payload.userId, classIdParam];
    } else {
      // Get all students in teacher's classes
      query = `
        SELECT 
          u.id, u.name, u.email, c.name as class_name,
          a.id as attendance_id,
          a.date,
          a.check_in_time,
          a.check_in_status,
          a.check_out_time,
          a.check_out_status,
          a.final_status,
          a.teacher_validated,
          a.teacher_note
        FROM users u
        JOIN classes c ON u.class_id = c.id
        JOIN teacher_classes tc ON tc.class_id = c.id
        LEFT JOIN attendance a ON u.id = a.user_id AND a.date = $1
        WHERE u.role = 'STUDENT' AND tc.teacher_id = $2
        ORDER BY c.grade_level, c.name, u.name
      `;
      params = [date, payload.userId];
    }

    const result = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      date,
      students: result.rows,
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
