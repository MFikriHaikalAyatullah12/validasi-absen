import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { extractToken, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('authorization'));
    const payload = await verifyToken(token || '');

    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await pool.query(`
      SELECT c.*, u.name as wali_kelas_name, 
             (SELECT COUNT(*) FROM users WHERE class_id = c.id AND role = 'STUDENT') as student_count
      FROM classes c
      LEFT JOIN users u ON c.wali_kelas_id = u.id
      ORDER BY c.name
    `);

    return NextResponse.json({ success: true, classes: result.rows });
  } catch (error) {
    console.error('Get classes error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('authorization'));
    const payload = await verifyToken(token || '');

    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, wali_kelas_id } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Nama kelas harus diisi' }, { status: 400 });
    }

    const result = await pool.query(
      'INSERT INTO classes (name, wali_kelas_id) VALUES ($1, $2) RETURNING *',
      [name, wali_kelas_id || null]
    );

    return NextResponse.json({ success: true, class: result.rows[0] });
  } catch (error) {
    console.error('Create class error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
