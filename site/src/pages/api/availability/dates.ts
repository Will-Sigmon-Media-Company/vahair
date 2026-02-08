/**
 * GET /api/availability/dates?calendarId=<id>&appointmentTypeId=<id>&month=<YYYY-MM>
 * Returns available dates for a calendar view
 */

import type { APIRoute } from 'astro';

// Ensure this endpoint is deployed as a serverless function (not prerendered to a static file).
export const prerender = false;
import {
  getAvailableDates,
  isAcuityConfigured,
  withCache,
  availabilityCacheKey,
  CacheTTL,
  getCurrentMonth,
  type AcuityAvailabilityDate,
  type ApiResponse,
} from '../../../lib/acuity';

// CORS and security headers for API responses
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': 'https://vahair.studio',
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
  const appointmentTypeId = url.searchParams.get('appointmentTypeId');
  const month = url.searchParams.get('month') || getCurrentMonth();

  // Validate month format (YYYY-MM)
  const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
  if (!monthRegex.test(month)) {
    return new Response(
      JSON.stringify({ error: 'Invalid month format. Expected YYYY-MM' }),
      { status: 400, headers: corsHeaders }
    );
  }

  if (!calendarId || !appointmentTypeId) {
    return new Response(
      JSON.stringify({ error: 'Missing calendarId or appointmentTypeId parameter' }),
      { status: 400, headers: corsHeaders }
    );
  }

  const calendarIdNum = parseInt(calendarId, 10);
  const appointmentTypeIdNum = parseInt(appointmentTypeId, 10);

  // Comprehensive validation
  if (
    isNaN(calendarIdNum) ||
    isNaN(appointmentTypeIdNum) ||
    calendarIdNum <= 0 ||
    appointmentTypeIdNum <= 0
  ) {
    return new Response(
      JSON.stringify({ error: 'Invalid calendarId or appointmentTypeId' }),
      { status: 400, headers: corsHeaders }
    );
  }

  if (!isAcuityConfigured()) {
    return new Response(
      JSON.stringify({
        data: [],
        cached: false,
        fallback: true,
        error: 'API not configured',
      } satisfies ApiResponse<AcuityAvailabilityDate[]>),
      {
        status: 503,
        headers: { ...corsHeaders, 'Retry-After': '300' },
      }
    );
  }

  try {
    const cacheKey = `${availabilityCacheKey(calendarIdNum, month)}:${appointmentTypeIdNum}`;

    const result = await withCache(
      cacheKey,
      async () => {
        return await getAvailableDates(calendarIdNum, appointmentTypeIdNum, month);
      },
      CacheTTL.AVAILABILITY
    );

    return new Response(
      JSON.stringify({
        data: result.data,
        cached: result.cached,
        cachedAt: result.cachedAt,
        stale: result.stale,
      } satisfies ApiResponse<AcuityAvailabilityDate[]>),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error('Error fetching available dates:', error);

    return new Response(
      JSON.stringify({
        data: [],
        cached: false,
        fallback: true,
        error: 'Service temporarily unavailable',
      } satisfies ApiResponse<AcuityAvailabilityDate[]>),
      {
        status: 503,
        headers: { ...corsHeaders, 'Retry-After': '60' },
      }
    );
  }
};
