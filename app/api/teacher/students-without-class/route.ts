import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { extractToken, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Get all students who don't have a class yet
export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('authorization'));
    const payload = await verifyToken(token || '');

    if (!payload || payload.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get students without a class
    const result = await pool.query(
      `SELECT id, name, email
       FROM users
       WHERE role = 'STUDENT' AND class_id IS NULL
       ORDER BY name`
    );

    return NextResponse.json({ 
      success: true, 
      students: result.rows 
    });
  } catch (error) {
    console.error('Get students without class error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
