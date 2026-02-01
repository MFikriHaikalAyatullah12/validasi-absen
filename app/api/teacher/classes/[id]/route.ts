import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { extractToken, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Update class (teacher can only update their own classes)
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

    const { name } = await request.json();
    const classId = params.id;

    // Check if teacher owns this class
    const checkResult = await pool.query(
      'SELECT * FROM teacher_classes WHERE teacher_id = $1 AND class_id = $2',
      [payload.userId, classId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Anda tidak memiliki akses ke kelas ini' }, { status: 403 });
    }

    // Update class name
    const result = await pool.query(
      'UPDATE classes SET name = $1 WHERE id = $2 RETURNING *',
      [name, classId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, class: result.rows[0] });
  } catch (error) {
    console.error('Update class error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Delete class (teacher can only delete their own classes)
export async function DELETE(
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

    // Check if teacher owns this class
    const checkResult = await pool.query(
      'SELECT * FROM teacher_classes WHERE teacher_id = $1 AND class_id = $2',
      [payload.userId, classId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Anda tidak memiliki akses ke kelas ini' }, { status: 403 });
    }

    // Delete class (this will cascade delete students and teacher_classes entries)
    await pool.query('DELETE FROM classes WHERE id = $1', [classId]);

    return NextResponse.json({ success: true, message: 'Kelas berhasil dihapus' });
  } catch (error) {
    console.error('Delete class error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
