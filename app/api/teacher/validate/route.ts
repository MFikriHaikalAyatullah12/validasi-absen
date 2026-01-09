import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { extractToken, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('authorization'));
    const payload = await verifyToken(token || '');

    if (!payload || payload.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attendance_id, final_status, teacher_note } = await request.json();

    if (!attendance_id) {
      return NextResponse.json({ error: 'Attendance ID harus diisi' }, { status: 400 });
    }

    // Update attendance with teacher validation
    const result = await pool.query(
      `UPDATE attendance SET 
        final_status = $1,
        teacher_note = $2,
        teacher_validated = true,
        validated_by = $3,
        validated_at = $4
      WHERE id = $5
      RETURNING *`,
      [final_status, teacher_note || null, payload.userId, new Date(), attendance_id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Attendance tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      attendance: result.rows[0],
    });
  } catch (error) {
    console.error('Validate attendance error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
