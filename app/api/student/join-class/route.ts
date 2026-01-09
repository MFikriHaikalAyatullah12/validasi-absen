import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { extractToken, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Student joins a class
export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('authorization'));
    const payload = await verifyToken(token || '');

    if (!payload || payload.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { class_id } = await request.json();

    if (!class_id) {
      return NextResponse.json(
        { error: 'class_id diperlukan' },
        { status: 400 }
      );
    }

    // Check if class exists
    const classCheck = await pool.query(
      'SELECT id, name FROM classes WHERE id = $1',
      [class_id]
    );

    if (classCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Kelas tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if student already has a class
    const userCheck = await pool.query(
      'SELECT class_id FROM users WHERE id = $1',
      [payload.userId]
    );

    if (userCheck.rows[0].class_id) {
      return NextResponse.json(
        { error: 'Anda sudah terdaftar di sebuah kelas. Siswa hanya dapat bergabung dengan satu kelas.' },
        { status: 400 }
      );
    }

    // Join the class
    await pool.query(
      'UPDATE users SET class_id = $1 WHERE id = $2',
      [class_id, payload.userId]
    );

    // Get updated user data with class info
    const updatedUser = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.class_id,
        c.name as class_name, c.grade_level
      FROM users u
      LEFT JOIN classes c ON u.class_id = c.id
      WHERE u.id = $1`,
      [payload.userId]
    );

    return NextResponse.json({
      success: true,
      message: `Berhasil bergabung dengan kelas ${classCheck.rows[0].name}`,
      user: {
        id: updatedUser.rows[0].id,
        name: updatedUser.rows[0].name,
        email: updatedUser.rows[0].email,
        role: updatedUser.rows[0].role,
        class: updatedUser.rows[0].class_id ? {
          id: updatedUser.rows[0].class_id,
          name: updatedUser.rows[0].class_name,
          grade_level: updatedUser.rows[0].grade_level
        } : null
      }
    });
  } catch (error) {
    console.error('Join class error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
