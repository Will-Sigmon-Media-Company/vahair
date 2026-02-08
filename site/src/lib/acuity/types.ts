/**
 * Acuity Scheduling API Types
 * Based on: https://developers.acuityscheduling.com/reference
 */

/** Acuity Calendar (represents a stylist) */
export interface AcuityCalendar {
  id: number;
  name: string;
  email: string;
  image: string;
  description: string;
  location: string;
  timezone: string;
  replyTo: string;
}

/** Acuity Appointment Type (service) */
export interface AcuityAppointmentType {
  id: number;
  active: boolean;
  name: string;
  description: string;
  duration: number;
  price: string;
  deposit: string;
  category: string;
  paddingAfter: number;
  paddingBefore: number;
  color: string;
  private: boolean;
  type: string;
  classSize: number | null;
  calendarIDs: number[];
  image: string;
  schedulingUrl: string;
}

/** Acuity Availability Time Slot */
export interface AcuityTimeSlot {
  time: string; // ISO 8601
  slotsAvailable: number;
}

/** Acuity Availability Date */
export interface AcuityAvailabilityDate {
  date: string; // YYYY-MM-DD
}

// ─────────────────────────────────────────────────────────────
// Transformed types for our site
// ─────────────────────────────────────────────────────────────

/** Stylist info with availability */
export interface Stylist {
  id: number;
  name: string;
  image: string;
  description: string;
  bookingUrl: string;
  nextAvailable?: NextSlot | null;
}

/** Next available time slot */
export interface NextSlot {
  datetime: string; // ISO 8601
  displayText: string; // "Tomorrow at 2:00 PM"
  relativeText: string; // "Tomorrow" or "Tuesday"
}

/** Grouped services by category */
export interface ServiceCategory {
  name: string;
  slug: string;
  services: Service[];
}

/** Individual service */
export interface Service {
  id: number;
  name: string;
  description: string;
  duration: number;
  price: string;
  category: string;
  bookingUrl: string;
  /** Which stylists (calendars) can perform this service (from Acuity `calendarIDs`). */
  calendarIds?: number[];
}

/** API Response wrapper */
export interface ApiResponse<T> {
  data: T;
  cached: boolean;
  cachedAt?: string;
  error?: string;
}
