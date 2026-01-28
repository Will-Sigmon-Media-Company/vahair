/**
 * GET /api/availability/next-slot?calendarId=<id>
 * Returns the next available time slot for a stylist
 */

import type { APIRoute } from 'astro';
import {
  getAppointmentTypes,
  getAvailableTimes,
  isAcuityConfigured,
  withCache,
  availabilityCacheKey,
  CacheTTL,
  formatNextSlot,
  getUpcomingDates,
  type NextSlot,
  type ApiResponse,
} from '../../../lib/acuity';

// CORS and security headers for API responses
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': 'https://www.vahair.studio',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'X-Content-Type-Options': 'nosniff',
};

// Handle CORS preflight
export const OPTIONS: APIRoute = () => {
  return new Response(null, { status: 204, headers: corsHeaders });
};

export const GET: APIRoute = async ({ url }) => {
  const calendarId = url.searchParams.get('calendarId');

  if (!calendarId) {
    return new Response(
      JSON.stringify({ error: 'Missing calendarId parameter' }),
      { status: 400, headers: corsHeaders }
    );
  }

  const calendarIdNum = parseInt(calendarId, 10);

  // Comprehensive validation
  if (isNaN(calendarIdNum) || calendarIdNum <= 0) {
    return new Response(
      JSON.stringify({ error: 'Invalid calendarId' }),
      { status: 400, headers: corsHeaders }
    );
  }

  if (!isAcuityConfigured()) {
    // Return null (no availability data) when not configured
    return new Response(
      JSON.stringify({
        data: null,
        cached: false,
        fallback: true,
        error: 'API not configured',
      } satisfies ApiResponse<NextSlot | null>),
      {
        status: 503,
        headers: { ...corsHeaders, 'Retry-After': '300' },
      }
    );
  }

  try {
    const result = await withCache(
      availabilityCacheKey(calendarIdNum),
      async () => {
        // First, get a common appointment type to check availability
        const appointmentTypes = await getAppointmentTypes();
        // Find a basic appointment type (haircut is usually available for all stylists)
        const basicType = appointmentTypes.find(
          (apt) =>
            apt.active &&
            !apt.private &&
            apt.calendarIDs.includes(calendarIdNum)
        );

        if (!basicType) {
          return null;
        }

        // Check next 14 days for availability
        const dates = getUpcomingDates(14);

        for (const date of dates) {
          const times = await getAvailableTimes(calendarIdNum, basicType.id, date);
          if (times && times.length > 0) {
            // Found available slot
            return formatNextSlot(times[0].time);
          }
        }

        return null; // No availability in next 14 days
      },
      CacheTTL.NEXT_SLOT
    );

    return new Response(
      JSON.stringify({
        data: result.data,
        cached: result.cached,
        cachedAt: result.cachedAt,
        stale: result.stale,
      } satisfies ApiResponse<NextSlot | null>),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error('Error fetching next slot:', error);

    return new Response(
      JSON.stringify({
        data: null,
        cached: false,
        fallback: true,
        error: 'Service temporarily unavailable',
      } satisfies ApiResponse<NextSlot | null>),
      {
        status: 503,
        headers: { ...corsHeaders, 'Retry-After': '60' },
      }
    );
  }
};
