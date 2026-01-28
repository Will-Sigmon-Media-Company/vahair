/**
 * Acuity Scheduling API Client
 * Uses Basic Authentication with User ID and API Key
 */

import type {
  AcuityCalendar,
  AcuityAppointmentType,
  AcuityTimeSlot,
  AcuityAvailabilityDate,
} from './types';

const ACUITY_BASE_URL = 'https://acuityscheduling.com/api/v1';

/** API request timeout in milliseconds */
const API_TIMEOUT = 8000;

/** Cached auth header (computed once at module load) */
let cachedAuthHeader: string | null = null;

/** Get Basic Auth header from env vars */
function getAuthHeader(): string {
  if (cachedAuthHeader) return cachedAuthHeader;

  const userId = import.meta.env.ACUITY_USER_ID;
  const apiKey = import.meta.env.ACUITY_API_KEY;

  if (!userId || !apiKey) {
    throw new Error('Missing ACUITY_USER_ID or ACUITY_API_KEY environment variables');
  }

  // Use btoa() instead of Buffer.from() for Edge Runtime compatibility
  const credentials = btoa(`${userId}:${apiKey}`);
  cachedAuthHeader = `Basic ${credentials}`;
  return cachedAuthHeader;
}

/** Make authenticated request to Acuity API with timeout */
async function acuityFetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${ACUITY_BASE_URL}${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value);
    });
  }

  // Add timeout to prevent hanging requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: getAuthHeader(),
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      // Log detailed error server-side, throw generic error for clients
      const errorText = await response.text();
      console.error(`Acuity API error ${response.status}: ${errorText}`);
      throw new Error('Service temporarily unavailable');
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Acuity API timeout after', API_TIMEOUT, 'ms');
      throw new Error('Service temporarily unavailable');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─────────────────────────────────────────────────────────────
// API Methods
// ─────────────────────────────────────────────────────────────

/** Get all calendars (stylists) */
export async function getCalendars(): Promise<AcuityCalendar[]> {
  return acuityFetch<AcuityCalendar[]>('/calendars');
}

/** Get all appointment types (services) */
export async function getAppointmentTypes(): Promise<AcuityAppointmentType[]> {
  return acuityFetch<AcuityAppointmentType[]>('/appointment-types');
}

/** Get available dates for a calendar and appointment type */
export async function getAvailableDates(
  calendarId: number,
  appointmentTypeId: number,
  month: string // YYYY-MM
): Promise<AcuityAvailabilityDate[]> {
  return acuityFetch<AcuityAvailabilityDate[]>('/availability/dates', {
    calendarID: calendarId.toString(),
    appointmentTypeID: appointmentTypeId.toString(),
    month,
  });
}

/** Get available time slots for a specific date */
export async function getAvailableTimes(
  calendarId: number,
  appointmentTypeId: number,
  date: string // YYYY-MM-DD
): Promise<AcuityTimeSlot[]> {
  return acuityFetch<AcuityTimeSlot[]>('/availability/times', {
    calendarID: calendarId.toString(),
    appointmentTypeID: appointmentTypeId.toString(),
    date,
  });
}

/** Check if Acuity API is configured */
export function isAcuityConfigured(): boolean {
  return !!(import.meta.env.ACUITY_USER_ID && import.meta.env.ACUITY_API_KEY);
}
