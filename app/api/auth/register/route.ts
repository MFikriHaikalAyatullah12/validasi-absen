import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role, grade_level } = await request.json();

    console.log('Register attempt:', { name, email, role, grade_level });

    // Validation
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Semua field harus diisi' },
        { status: 400 }
      );
    }

    if (role !== 'TEACHER' && role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Role harus TEACHER atau STUDENT' },
        { status: 400 }
      );
    }

    if (role === 'STUDENT' && !grade_level) {
      return NextResponse.json(
        { error: 'Siswa harus memilih tingkat kelas (10, 11, atau 12)' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 400 }
      );
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // For students, don't auto-assign class_id - let them choose later
    // For teachers, class_id is always null
    const class_id = null;

    // Create user
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, class_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, class_id',
      [name, email, password_hash, role, class_id]
    );

    const user = result.rows[0];

    console.log('User created:', { id: user.id, role: user.role });

    return NextResponse.json({
      success: true,
      message: 'Registrasi berhasil! Silakan login.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat registrasi' },
      { status: 500 }
    );
  }
}
