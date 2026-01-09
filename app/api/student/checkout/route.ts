import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { extractToken, verifyToken } from '@/lib/auth';
import { validateLocation, calculateFinalStatus, isWithinCheckoutWindow } from '@/lib/location';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('authorization'));
    const payload = await verifyToken(token || '');

    if (!payload || payload.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { latitude, longitude, accuracy } = await request.json();

    if (!latitude || !longitude || !accuracy) {
      return NextResponse.json(
        { error: 'Data lokasi tidak lengkap' },
        { status: 400 }
      );
    }

    // Get school settings
    const settingsResult = await pool.query('SELECT * FROM school_settings LIMIT 1');
    if (settingsResult.rows.length === 0) {
      return NextResponse.json({ error: 'Pengaturan sekolah belum dikonfigurasi' }, { status: 500 });
    }
    const settings = settingsResult.rows[0];

    // Check if within check-out time window
    const now = new Date();
    if (!isWithinCheckoutWindow(now, settings)) {
      return NextResponse.json(
        { 
          error: 'Check-out hanya dapat dilakukan pada jam yang ditentukan',
          checkout_time: `${settings.checkout_start_time} - ${settings.checkout_end_time}`
        },
        { status: 400 }
      );
    }

    // Validate location (NO GPS COORDINATES STORED!)
    const validation = validateLocation({ latitude, longitude, accuracy }, settings);

    // Get today's date
    const today = now.toISOString().split('T')[0];

    // Check if attendance record exists
    const existingResult = await pool.query(
      'SELECT * FROM attendance WHERE user_id = $1 AND date = $2',
      [payload.userId, today]
    );

    if (existingResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Anda belum melakukan check-in hari ini' },
        { status: 400 }
      );
    }

    const existing = existingResult.rows[0];

    if (existing.check_out_time) {
      return NextResponse.json(
        { error: 'Anda sudah melakukan check-out hari ini' },
        { status: 400 }
      );
    }

    const finalStatus = calculateFinalStatus(existing.check_in_status, validation.status);

    const updateResult = await pool.query(
      `UPDATE attendance SET 
        check_out_time = $1,
        check_out_status = $2,
        final_status = $3
      WHERE id = $4
      RETURNING *`,
      [now, validation.status, finalStatus, existing.id]
    );

    const attendance = updateResult.rows[0];

    return NextResponse.json({
      success: true,
      attendance,
      validation: {
        status: validation.status,
        message: validation.message,
        distance: validation.distance,
      },
    });
  } catch (error) {
    console.error('Check-out error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat check-out' }, { status: 500 });
  }
}
