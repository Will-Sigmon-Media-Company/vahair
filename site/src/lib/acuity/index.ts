/**
 * Acuity API - Public exports
 */

// Re-export types
export type {
  AcuityCalendar,
  AcuityAppointmentType,
  AcuityTimeSlot,
  AcuityAvailabilityDate,
  Stylist,
  NextSlot,
  Service,
  ServiceCategory,
  ApiResponse,
} from './types';

// Re-export client functions
export {
  getCalendars,
  getAppointmentTypes,
  getAvailableDates,
  getAvailableTimes,
  isAcuityConfigured,
} from './client';

// Re-export cache utilities
export {
  withCache,
  clearCache,
  clearAllCache,
  availabilityCacheKey,
  servicesCacheKey,
  stylistsCacheKey,
  CacheTTL,
} from './cache';

// Re-export helpers
export {
  formatTime,
  getRelativeDay,
  formatNextSlot,
  getUpcomingDates,
  getCurrentMonth,
  transformCalendar,
  transformAppointmentType,
  groupServicesByCategory,
  slugify,
} from './helpers';

// Re-export constants / URL helpers
export {
  ACUITY_OWNER_ID,
  ACUITY_APP_ORIGIN,
  ACUITY_SCHEDULE_PATH,
  ACUITY_BASE_SCHEDULE_URL,
  ACUITY_EMBED_ORIGIN,
  ACUITY_EMBED_JS_URL,
  ACUITY_EMBED_BASE_URL,
  acuityBookingUrlForCalendar,
  acuityBookingUrlForAppointmentType,
  acuityBookingUrlForCategory,
} from './constants';
