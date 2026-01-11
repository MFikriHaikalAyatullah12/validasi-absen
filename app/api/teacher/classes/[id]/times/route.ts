import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { extractToken, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Update class times
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = extractToken(request.headers.get('authorization'));
    const payload = await verifyToken(token || '');

    if (!payload || payload.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { checkin_start_time, checkin_end_time, checkout_start_time, checkout_end_time } = await request.json();
    const classId = params.id;

    // Verify teacher has access to this class
    const accessCheck = await pool.query(
      'SELECT * FROM teacher_classes WHERE teacher_id = $1 AND class_id = $2',
      [payload.userId, classId]
    );

    if (accessCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Anda tidak memiliki akses ke kelas ini' }, { status: 403 });
    }

    // Update class times
    const result = await pool.query(
      `UPDATE classes 
       SET checkin_start_time = $1, 
           checkin_end_time = $2, 
           checkout_start_time = $3, 
           checkout_end_time = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 
       RETURNING *`,
      [checkin_start_time, checkin_end_time, checkout_start_time, checkout_end_time, classId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      class: result.rows[0],
      message: 'Jam kelas berhasil diperbarui' 
    });
  } catch (error) {
    console.error('Update class times error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Get class times
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = extractToken(request.headers.get('authorization'));
    const payload = await verifyToken(token || '');

    if (!payload || payload.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const classId = params.id;

    // Verify teacher has access to this class
    const accessCheck = await pool.query(
      'SELECT * FROM teacher_classes WHERE teacher_id = $1 AND class_id = $2',
      [payload.userId, classId]
    );

    if (accessCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Anda tidak memiliki akses ke kelas ini' }, { status: 403 });
    }

    // Get class times
    const result = await pool.query(
      `SELECT id, name, grade_level, 
              checkin_start_time, checkin_end_time, 
              checkout_start_time, checkout_end_time
       FROM classes 
       WHERE id = $1`,
      [classId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      class: result.rows[0]
    });
  } catch (error) {
    console.error('Get class times error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
