// Type definitions for database models

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';
export type ValidationStatus = 'VALID' | 'KURANG_AKURAT' | 'TIDAK_VALID';
export type AttendanceStatus = 'HADIR_PENUH' | 'HADIR_PARSIAL' | 'PERLU_VERIFIKASI';

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  class_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface Class {
  id: number;
  name: string;
  wali_kelas_id: number | null;
  checkin_start_time?: string;
  checkin_end_time?: string;
  checkout_start_time?: string;
  checkout_end_time?: string;
  created_at: Date;
  updated_at: Date;
}

export interface SchoolSettings {
  id: number;
  school_latitude: number;
  school_longitude: number;
  valid_radius: number;
  checkin_start_time: string;
  checkin_end_time: string;
  checkout_start_time: string;
  checkout_end_time: string;
  created_at: Date;
  updated_at: Date;
}

export interface Attendance {
  id: number;
  user_id: number;
  date: string;
  check_in_time: Date | null;
  check_in_status: ValidationStatus | null;
  check_out_time: Date | null;
  check_out_status: ValidationStatus | null;
  final_status: AttendanceStatus;
  teacher_validated: boolean;
  teacher_note: string | null;
  validated_by: number | null;
  validated_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface ValidationResult {
  status: ValidationStatus;
  distance: number;
  message: string;
}
