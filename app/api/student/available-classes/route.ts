import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { extractToken, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Get all available classes for students
export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('authorization'));
    const payload = await verifyToken(token || '');

    if (!payload || payload.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get only classes that have at least one teacher (real classes created by teachers)
    const result = await pool.query(
      `SELECT 
        c.id, 
        c.name, 
        c.grade_level,
        (SELECT COUNT(*) FROM users WHERE class_id = c.id AND role = 'STUDENT') as student_count,
        STRING_AGG(DISTINCT u.name, ', ') as teacher_names
      FROM classes c
      INNER JOIN teacher_classes tc ON tc.class_id = c.id
      LEFT JOIN users u ON u.id = tc.teacher_id AND u.role = 'TEACHER'
      GROUP BY c.id, c.name, c.grade_level
      ORDER BY c.grade_level, c.name`
    );

    return NextResponse.json({
      success: true,
      classes: result.rows,
    });
  } catch (error) {
    console.error('Get available classes error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
