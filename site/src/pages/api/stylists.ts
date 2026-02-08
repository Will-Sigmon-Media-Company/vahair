/**
 * GET /api/stylists
 * Returns all stylists (calendars) from Acuity
 */

import type { APIRoute } from 'astro';
import { rateLimit } from '../../lib/api/rateLimit';
import {
  getCalendars,
  isAcuityConfigured,
  withCache,
  stylistsCacheKey,
  CacheTTL,
  transformCalendar,
  type Stylist,
  type ApiResponse,
} from '../../lib/acuity';
import { STYLISTS } from '../../lib/data/stylists';

// Ensure this endpoint is deployed as a serverless function (not prerendered to a static file).
export const prerender = false;

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

// Use centralized stylist data for fallback
const fallbackStylists: Stylist[] = STYLISTS.map(s => ({
  id: s.id,
  name: s.name,
  image: s.image,
  description: s.role,
  bookingUrl: s.bookingUrl,
}));

export const GET: APIRoute = async ({ request }) => {
  // Best-effort abuse protection (per-instance on serverless)
  const rl = rateLimit(request, {
    key: 'api:stylists',
    limit: 120,
    windowMs: 60_000,
  });

  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: {
        ...corsHeaders,
        'Retry-After': String(rl.retryAfterSeconds ?? 60),
        'X-RateLimit-Limit': String(rl.limit),
        'X-RateLimit-Remaining': String(rl.remaining),
        'X-RateLimit-Reset': String(Math.ceil(rl.resetAtMs / 1000)),
      },
    });
  }

  try {
    if (!isAcuityConfigured()) {
      return new Response(
        JSON.stringify({
          data: fallbackStylists,
          cached: false,
          fallback: true,
          error: 'API not configured',
        } satisfies ApiResponse<Stylist[]>),
        {
          status: 503,
          headers: { ...corsHeaders, 'Retry-After': '300' },
        }
      );
    }

    const result = await withCache(
      stylistsCacheKey(),
      async () => {
        const calendars = await getCalendars();
        return calendars.map(transformCalendar);
      },
      CacheTTL.STYLISTS
    );

    return new Response(
      JSON.stringify({
        data: result.data,
        cached: result.cached,
        cachedAt: result.cachedAt,
        stale: result.stale,
      } satisfies ApiResponse<Stylist[]>),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error('Error fetching stylists:', error);

    return new Response(
      JSON.stringify({
        data: fallbackStylists,
        cached: false,
        fallback: true,
        error: 'Service temporarily unavailable',
      } satisfies ApiResponse<Stylist[]>),
      {
        status: 503,
        headers: { ...corsHeaders, 'Retry-After': '60' },
      }
    );
  }
};
