import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { extractToken, verifyToken } from '@/lib/auth';
import { validateLocation, calculateFinalStatus, isWithinCheckinWindow, getWITATime, getWITATimeISO, getWITADateString } from '@/lib/location';

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

    // Get school settings for location validation
    const settingsResult = await pool.query('SELECT * FROM school_settings LIMIT 1');
    if (settingsResult.rows.length === 0) {
      return NextResponse.json({ error: 'Pengaturan sekolah belum dikonfigurasi' }, { status: 500 });
    }
    const settings = settingsResult.rows[0];

    // Get user's class to check time settings
    const userClassResult = await pool.query(
      `SELECT c.checkin_start_time, c.checkin_end_time, c.checkout_start_time, c.checkout_end_time
       FROM users u
       JOIN classes c ON u.class_id = c.id
       WHERE u.id = $1`,
      [payload.userId]
    );

    if (userClassResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Anda belum terdaftar di kelas manapun' },
        { status: 400 }
      );
    }

    const classSettings = userClassResult.rows[0];

    // Check if within check-in time window (uses WITA and class times)
    const now = getWITATime();
    const nowISO = getWITATimeISO(); // For database storage with proper timezone
    
    // Use class settings for time validation
    const timeSettings = {
      checkin_start_time: classSettings.checkin_start_time,
      checkin_end_time: classSettings.checkin_end_time,
      checkout_start_time: classSettings.checkout_start_time,
      checkout_end_time: classSettings.checkout_end_time
    };
    
    if (!isWithinCheckinWindow(now, timeSettings)) {
      return NextResponse.json(
        { 
          error: 'Check-in hanya dapat dilakukan pada jam yang ditentukan',
          checkin_time: `${timeSettings.checkin_start_time} - ${timeSettings.checkin_end_time}`
        },
        { status: 400 }
      );
    }

    // Validate location (NO GPS COORDINATES STORED!)
    const validation = validateLocation({ latitude, longitude, accuracy }, settings);

    // Get today's date in WITA
    const today = getWITADateString();

    // Check if already checked in today
    const existingResult = await pool.query(
      'SELECT * FROM attendance WHERE user_id = $1 AND date = $2',
      [payload.userId, today]
    );

    let attendance;

    if (existingResult.rows.length > 0) {
      // Update existing record
      const existing = existingResult.rows[0];
      
      if (existing.check_in_time) {
        return NextResponse.json(
          { error: 'Anda sudah melakukan check-in hari ini' },
          { status: 400 }
        );
      }

      const finalStatus = calculateFinalStatus(validation.status, existing.check_out_status);

      const updateResult = await pool.query(
        `UPDATE attendance SET 
          check_in_time = $1,
          check_in_status = $2,
          final_status = $3
        WHERE id = $4
        RETURNING *`,
        [nowISO, validation.status, finalStatus, existing.id]
      );
      attendance = updateResult.rows[0];
    } else {
      // Create new record
      const finalStatus = calculateFinalStatus(validation.status, null);

      const insertResult = await pool.query(
        `INSERT INTO attendance 
          (user_id, date, check_in_time, check_in_status, final_status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [payload.userId, today, nowISO, validation.status, finalStatus]
      );
      attendance = insertResult.rows[0];
    }

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
    console.error('Check-in error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat check-in' }, { status: 500 });
  }
}
