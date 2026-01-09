import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { extractToken, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('authorization'));
    const payload = await verifyToken(token || '');

    if (!payload || payload.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's class and teachers
    const userResult = await pool.query(
      `SELECT 
        u.id, u.name, u.email, u.role, u.class_id,
        c.name as class_name,
        c.grade_level as class_grade_level,
        STRING_AGG(DISTINCT t.name, ', ') as teacher_names
      FROM users u
      LEFT JOIN classes c ON u.class_id = c.id
      LEFT JOIN teacher_classes tc ON c.id = tc.class_id
      LEFT JOIN users t ON tc.teacher_id = t.id
      WHERE u.id = $1
      GROUP BY u.id, u.name, u.email, u.role, u.class_id, c.name, c.grade_level`,
      [payload.userId]
    );

    const userData = userResult.rows[0];
    const user = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      class: userData.class_id ? {
        id: userData.class_id,
        name: userData.class_name,
        grade_level: userData.class_grade_level,
        teacher_names: userData.teacher_names || 'Belum ada wali kelas'
      } : null
    };

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    const result = await pool.query(
      'SELECT * FROM attendance WHERE user_id = $1 AND date = $2',
      [payload.userId, today]
    );

    return NextResponse.json({
      success: true,
      user: user,
      attendance: result.rows.length > 0 ? result.rows[0] : null,
    });
  } catch (error) {
    console.error('Get attendance status error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
