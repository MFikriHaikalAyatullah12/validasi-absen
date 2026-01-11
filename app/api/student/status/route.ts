import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { extractToken, verifyToken } from '@/lib/auth';
import { getWITADateString } from '@/lib/location';

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
        c.checkin_start_time, c.checkin_end_time,
        c.checkout_start_time, c.checkout_end_time,
        STRING_AGG(DISTINCT t.name, ', ') as teacher_names
      FROM users u
      LEFT JOIN classes c ON u.class_id = c.id
      LEFT JOIN teacher_classes tc ON c.id = tc.class_id
      LEFT JOIN users t ON tc.teacher_id = t.id
      WHERE u.id = $1
      GROUP BY u.id, u.name, u.email, u.role, u.class_id, c.name, c.grade_level, c.checkin_start_time, c.checkin_end_time, c.checkout_start_time, c.checkout_end_time`,
      [payload.userId]
    );

    const userData = userResult.rows[0];
    
    // Helper function to format time from HH:MM:SS to HH:MM
    const formatTime = (timeStr: string | null) => {
      if (!timeStr) return null;
      // If already in HH:MM format, return as is
      if (timeStr.length === 5) return timeStr;
      // If in HH:MM:SS format, remove seconds
      return timeStr.substring(0, 5);
    };
    
    const user = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      class: userData.class_id ? {
        id: userData.class_id,
        name: userData.class_name,
        grade_level: userData.class_grade_level,
        teacher_names: userData.teacher_names || 'Belum ada wali kelas',
        checkin_start_time: formatTime(userData.checkin_start_time),
        checkin_end_time: formatTime(userData.checkin_end_time),
        checkout_start_time: formatTime(userData.checkout_start_time),
        checkout_end_time: formatTime(userData.checkout_end_time)
      } : null
    };

    // Get today's date in WITA
    const today = getWITADateString();

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
