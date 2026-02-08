/**
 * Acuity scheduling constants + URL builders.
 *
 * Single source of truth so we don't have `owner=38274584` scattered everywhere.
 */

export const ACUITY_OWNER_ID = '38274584';

export const ACUITY_APP_ORIGIN = 'https://app.acuityscheduling.com';
export const ACUITY_SCHEDULE_PATH = '/schedule.php';

export const ACUITY_BASE_SCHEDULE_URL = `${ACUITY_APP_ORIGIN}${ACUITY_SCHEDULE_PATH}?owner=${ACUITY_OWNER_ID}`;

export const ACUITY_EMBED_ORIGIN = 'https://embed.acuityscheduling.com';
export const ACUITY_EMBED_JS_URL = `${ACUITY_EMBED_ORIGIN}/js/embed.js`;

export function acuityBookingUrlForCalendar(calendarId: number | string): string {
  return `${ACUITY_BASE_SCHEDULE_URL}&calendarID=${calendarId}`;
}

export function acuityBookingUrlForAppointmentType(appointmentTypeId: number | string): string {
  return `${ACUITY_BASE_SCHEDULE_URL}&appointmentType=${appointmentTypeId}`;
}

export function acuityBookingUrlForCategory(categoryName: string): string {
  // Keep the `category:` prefix readable; encode only the category text.
  return `${ACUITY_BASE_SCHEDULE_URL}&appointmentType=category:${encodeURIComponent(categoryName)}`;
}

export const ACUITY_EMBED_BASE_URL = `${ACUITY_BASE_SCHEDULE_URL}&showHeader=false`;

