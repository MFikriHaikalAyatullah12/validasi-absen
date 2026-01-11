import { LocationData, ValidationResult, ValidationStatus, SchoolSettings } from './types';

// Interface for time settings (can be from school_settings or classes table)
interface TimeSettings {
  checkin_start_time: string;
  checkin_end_time: string;
  checkout_start_time: string;
  checkout_end_time: string;
}

/**
 * GET CURRENT TIME IN WITA (Waktu Indonesia Tengah / Central Indonesia Time)
 * WITA is UTC+8
 */
export function getWITATime(): Date {
  const now = new Date();
  // Convert to WITA (UTC+8)
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const witaTime = new Date(utcTime + (8 * 3600000));
  return witaTime;
}

/**
 * GET CURRENT TIME IN WITA AS ISO STRING
 * Returns ISO 8601 format with WITA timezone offset (+08:00)
 * This ensures correct time display across all clients
 */
export function getWITATimeISO(): string {
  const witaTime = getWITATime();
  const year = witaTime.getFullYear();
  const month = String(witaTime.getMonth() + 1).padStart(2, '0');
  const day = String(witaTime.getDate()).padStart(2, '0');
  const hours = String(witaTime.getHours()).padStart(2, '0');
  const minutes = String(witaTime.getMinutes()).padStart(2, '0');
  const seconds = String(witaTime.getSeconds()).padStart(2, '0');
  
  // Return with WITA timezone offset (+08:00)
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+08:00`;
}

/**
 * GET WITA DATE STRING (YYYY-MM-DD)
 */
export function getWITADateString(): string {
  const witaTime = getWITATime();
  return witaTime.toISOString().split('T')[0];
}

/**
 * HAVERSINE FORMULA
 * Calculate distance between two points on Earth
 * Returns distance in meters
 * 
 * PRIVACY NOTE: This calculation is done server-side
 * GPS coordinates are NEVER stored in database
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // Distance in meters
  return distance;
}

/**
 * LOCATION VALIDATION LOGIC
 * Validates if student is within school radius
 * 
 * PRIVACY PRINCIPLES:
 * 1. Only called when user explicitly presses check-in/check-out
 * 2. Coordinates never stored - only validation status
 * 3. No background tracking
 * 4. No continuous monitoring
 */
export function validateLocation(
  locationData: LocationData,
  schoolSettings: SchoolSettings
): ValidationResult {
  const { latitude, longitude, accuracy } = locationData;
  const { school_latitude, school_longitude, valid_radius } = schoolSettings;

  // Calculate distance from school
  const distance = calculateDistance(
    latitude,
    longitude,
    school_latitude,
    school_longitude
  );

  // Determine validation status
  let status: ValidationStatus;
  let message: string;

  // Check accuracy first
  if (accuracy > 100) {
    status = 'KURANG_AKURAT';
    message = `Akurasi GPS kurang baik (${Math.round(accuracy)}m). Silakan coba lagi atau hubungi guru.`;
  } 
  // Check if within valid radius
  else if (distance <= valid_radius) {
    status = 'VALID';
    message = `Lokasi terverifikasi. Jarak dari sekolah: ${Math.round(distance)}m`;
  } 
  // Slightly outside but with good accuracy - needs teacher verification
  else if (distance <= valid_radius + 50 && accuracy <= 50) {
    status = 'KURANG_AKURAT';
    message = `Anda berada ${Math.round(distance)}m dari sekolah. Memerlukan verifikasi guru.`;
  } 
  // Too far from school
  else {
    status = 'TIDAK_VALID';
    message = `Lokasi terlalu jauh dari sekolah (${Math.round(distance)}m). Radius valid: ${valid_radius}m`;
  }

  return {
    status,
    distance: Math.round(distance),
    message,
  };
}

/**
 * CALCULATE FINAL ATTENDANCE STATUS
 * Based on check-in and check-out status
 */
export function calculateFinalStatus(
  checkInStatus: ValidationStatus | null,
  checkOutStatus: ValidationStatus | null
): 'HADIR_PENUH' | 'HADIR_PARSIAL' | 'PERLU_VERIFIKASI' {
  // Both check-in and check-out valid
  if (checkInStatus === 'VALID' && checkOutStatus === 'VALID') {
    return 'HADIR_PENUH';
  }
  
  // Check-in valid but no check-out or check-out not valid
  if (checkInStatus === 'VALID') {
    return 'HADIR_PARSIAL';
  }
  
  // No valid check-in
  return 'PERLU_VERIFIKASI';
}

/**
 * CHECK IF CURRENT TIME IS WITHIN CHECK-IN WINDOW
 * Uses WITA (Waktu Indonesia Tengah) timezone
 */
export function isWithinCheckinWindow(
  currentTime: Date,
  settings: TimeSettings | SchoolSettings
): boolean {
  // Convert to WITA time
  const witaTime = getWITATime();
  const current = witaTime.getHours() * 60 + witaTime.getMinutes();
  const [startHour, startMin] = settings.checkin_start_time.split(':').map(Number);
  const [endHour, endMin] = settings.checkin_end_time.split(':').map(Number);
  
  const start = startHour * 60 + startMin;
  const end = endHour * 60 + endMin;
  
  return current >= start && current <= end;
}

/**
 * CHECK IF CURRENT TIME IS WITHIN CHECK-OUT WINDOW
 * Uses WITA (Waktu Indonesia Tengah) timezone
 */
export function isWithinCheckoutWindow(
  currentTime: Date,
  settings: TimeSettings | SchoolSettings
): boolean {
  // Convert to WITA time
  const witaTime = getWITATime();
  const current = witaTime.getHours() * 60 + witaTime.getMinutes();
  const [startHour, startMin] = settings.checkout_start_time.split(':').map(Number);
  const [endHour, endMin] = settings.checkout_end_time.split(':').map(Number);
  
  const start = startHour * 60 + startMin;
  const end = endHour * 60 + endMin;
  
  return current >= start && current <= end;
}
