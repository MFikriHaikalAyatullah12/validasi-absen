import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { extractToken, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Student leaves their current class
export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('authorization'));
    const payload = await verifyToken(token || '');

    if (!payload || payload.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if student has a class
    const userCheck = await pool.query(
      'SELECT class_id FROM users WHERE id = $1',
      [payload.userId]
    );

    if (!userCheck.rows[0].class_id) {
      return NextResponse.json(
        { error: 'Anda tidak terdaftar di kelas manapun' },
        { status: 400 }
      );
    }

    // Delete all attendance records for this student (fresh start when rejoining)
    await pool.query(
      'DELETE FROM attendance WHERE user_id = $1',
      [payload.userId]
    );

    // Remove student from class
    await pool.query(
      'UPDATE users SET class_id = NULL WHERE id = $1',
      [payload.userId]
    );

    // Get updated user data
    const userResult = await pool.query(
      `SELECT 
        users.id, users.name, users.email, users.role, users.class_id,
        classes.name as class_name,
        classes.grade_level as class_grade_level
      FROM users
      LEFT JOIN classes ON users.class_id = classes.id
      WHERE users.id = $1`,
      [payload.userId]
    );

    const updatedUser = userResult.rows[0];
    const userData = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      class: updatedUser.class_id ? {
        id: updatedUser.class_id,
        name: updatedUser.class_name,
        grade_level: updatedUser.class_grade_level
      } : null
    };

    return NextResponse.json({
      success: true,
      message: 'Berhasil keluar dari kelas',
      user: userData
    });
  } catch (error) {
    console.error('Error leaving class:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
