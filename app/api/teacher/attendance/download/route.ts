import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { extractToken, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('authorization'));
    const payload = await verifyToken(token || '');

    if (!payload || payload.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('class_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!classId) {
      return NextResponse.json(
        { error: 'class_id diperlukan' },
        { status: 400 }
      );
    }

    // Verify teacher has access to this class
    const classCheck = await pool.query(
      'SELECT * FROM teacher_classes WHERE teacher_id = $1 AND class_id = $2',
      [payload.userId, classId]
    );

    if (classCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses ke kelas ini' },
        { status: 403 }
      );
    }

    // Get class info
    const classInfo = await pool.query(
      'SELECT name, grade_level FROM classes WHERE id = $1',
      [classId]
    );

    if (classInfo.rows.length === 0) {
      return NextResponse.json(
        { error: 'Kelas tidak ditemukan' },
        { status: 404 }
      );
    }

    const className = classInfo.rows[0].name;

    // Build query for attendance data
    let query = `
      SELECT 
        u.name as student_name,
        u.email as student_email,
        a.date,
        a.check_in_time,
        a.check_in_status,
        a.check_out_time,
        a.check_out_status,
        a.final_status,
        a.teacher_validated,
        a.teacher_note
      FROM users u
      LEFT JOIN attendance a ON u.id = a.user_id
      WHERE u.class_id = $1 AND u.role = 'STUDENT'
    `;

    const queryParams: any[] = [classId];
    let paramCount = 1;

    if (startDate) {
      paramCount++;
      query += ` AND a.date >= $${paramCount}`;
      queryParams.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND a.date <= $${paramCount}`;
      queryParams.push(endDate);
    }

    query += ' ORDER BY a.date DESC, u.name ASC';

    const result = await pool.query(query, queryParams);

    // Prepare data for Excel
    const excelData = result.rows.map((row: any, index: number) => ({
      'No': index + 1,
      'Nama Siswa': row.student_name,
      'Email': row.student_email,
      'Tanggal': row.date ? new Date(row.date).toLocaleDateString('id-ID') : '-',
      'Check-in': row.check_in_time ? new Date(row.check_in_time).toLocaleTimeString('id-ID') : '-',
      'Status Check-in': row.check_in_status || '-',
      'Check-out': row.check_out_time ? new Date(row.check_out_time).toLocaleTimeString('id-ID') : '-',
      'Status Check-out': row.check_out_status || '-',
      'Status Akhir': row.final_status || 'Belum Absen',
      'Validasi Guru': row.teacher_validated ? 'Sudah' : 'Belum',
      'Catatan Guru': row.teacher_note || '-'
    }));

    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Add workbook properties for better Excel compatibility
    wb.Props = {
      Title: `Data Kehadiran ${className}`,
      Subject: "Laporan Kehadiran Siswa",
      Author: "Sistem Absensi Sekolah",
      CreatedDate: new Date()
    };
    
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
      { wch: 5 },  // No
      { wch: 25 }, // Nama Siswa
      { wch: 30 }, // Email
      { wch: 15 }, // Tanggal
      { wch: 12 }, // Check-in
      { wch: 18 }, // Status Check-in
      { wch: 12 }, // Check-out
      { wch: 18 }, // Status Check-out
      { wch: 18 }, // Status Akhir
      { wch: 15 }, // Validasi Guru
      { wch: 30 }  // Catatan Guru
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Data Kehadiran');

    // Create filename - simple and clean
    const dateRange = startDate && endDate 
      ? `_${startDate}_sampai_${endDate}`
      : startDate 
      ? `_dari_${startDate}`
      : endDate
      ? `_sampai_${endDate}`
      : '_semua';
    
    // Sanitize class name - remove spaces and special chars
    const cleanClassName = className.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    const filename = `Kehadiran_${cleanClassName}${dateRange}.xlsx`;

    // Generate Excel file as base64 then convert to Buffer for proper binary format
    const excelBuffer = XLSX.write(wb, { 
      bookType: 'xlsx',
      type: 'base64'
    });

    // Convert base64 to proper binary Buffer
    const binaryBuffer = Buffer.from(excelBuffer, 'base64');

    // Return file with proper Excel headers
    return new NextResponse(binaryBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=${filename}`,
        'Content-Length': binaryBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Download attendance error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
