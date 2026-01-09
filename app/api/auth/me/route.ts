import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { extractToken, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('authorization'));

    if (!token) {
      return NextResponse.json(
        { error: 'Token tidak ditemukan' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Token tidak valid' },
        { status: 401 }
      );
    }

    // Get updated user info
    const result = await pool.query(
      'SELECT id, name, email, role, class_id FROM users WHERE id = $1',
      [payload.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    // Get class info if exists
    let classInfo = null;
    if (user.class_id) {
      const classResult = await pool.query(
        'SELECT id, name FROM classes WHERE id = $1',
        [user.class_id]
      );
      if (classResult.rows.length > 0) {
        classInfo = classResult.rows[0];
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        class: classInfo,
      },
    });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memverifikasi token' },
      { status: 500 }
    );
  }
}
