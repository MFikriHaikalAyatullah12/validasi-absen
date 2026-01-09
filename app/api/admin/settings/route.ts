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

    const result = await pool.query('SELECT * FROM school_settings LIMIT 1');

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, settings: result.rows[0] });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('authorization'));
    const payload = await verifyToken(token || '');

    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      school_latitude,
      school_longitude,
      valid_radius,
      checkin_start_time,
      checkin_end_time,
      checkout_start_time,
      checkout_end_time,
    } = await request.json();

    const result = await pool.query(
      `UPDATE school_settings SET 
        school_latitude = $1,
        school_longitude = $2,
        valid_radius = $3,
        checkin_start_time = $4,
        checkin_end_time = $5,
        checkout_start_time = $6,
        checkout_end_time = $7
      WHERE id = 1
      RETURNING *`,
      [
        school_latitude,
        school_longitude,
        valid_radius,
        checkin_start_time,
        checkin_end_time,
        checkout_start_time,
        checkout_end_time,
      ]
    );

    return NextResponse.json({ success: true, settings: result.rows[0] });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
