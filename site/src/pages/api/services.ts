/**
 * GET /api/services
 * Returns all services grouped by category
 */

import type { APIRoute } from 'astro';
import { rateLimit } from '../../lib/api/rateLimit';
import {
  getAppointmentTypes,
  isAcuityConfigured,
  withCache,
  servicesCacheKey,
  CacheTTL,
  transformAppointmentType,
  groupServicesByCategory,
  acuityBookingUrlForCategory,
  type ServiceCategory,
  type ApiResponse,
} from '../../lib/acuity';

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

// Fallback data when API is unavailable
const fallbackServices: ServiceCategory[] = [
  {
    name: 'Haircuts',
    slug: 'haircuts',
    services: [
      { id: 1, name: "Women's Haircut", price: '$50', duration: 45, category: 'Haircuts', description: '', bookingUrl: acuityBookingUrlForCategory('Haircuts') },
      { id: 2, name: "Men's Haircut", price: '$25+', duration: 30, category: 'Haircuts', description: '', bookingUrl: acuityBookingUrlForCategory('Haircuts') },
      { id: 3, name: "Children's Cut (10 & under)", price: '$30', duration: 30, category: 'Haircuts', description: '', bookingUrl: acuityBookingUrlForCategory('Haircuts') },
      { id: 4, name: 'Blowdry Style', price: '$45+', duration: 30, category: 'Haircuts', description: '', bookingUrl: acuityBookingUrlForCategory('Haircuts') },
    ],
  },
  {
    name: 'Color',
    slug: 'color',
    services: [
      { id: 5, name: 'Root Touch Up', price: '$95+', duration: 90, category: 'Color', description: '', bookingUrl: acuityBookingUrlForCategory('Color') },
      { id: 6, name: 'All Over Color', price: '$125+', duration: 90, category: 'Color', description: '', bookingUrl: acuityBookingUrlForCategory('Color') },
      { id: 7, name: 'Halo Foil', price: '$130+', duration: 90, category: 'Color', description: '', bookingUrl: acuityBookingUrlForCategory('Color') },
      { id: 8, name: 'Partial Foil', price: '$150+', duration: 90, category: 'Color', description: '', bookingUrl: acuityBookingUrlForCategory('Color') },
      { id: 9, name: 'Full Foil', price: '$180+', duration: 120, category: 'Color', description: '', bookingUrl: acuityBookingUrlForCategory('Color') },
      { id: 10, name: 'Color/Foil Combination', price: '$200+', duration: 120, category: 'Color', description: '', bookingUrl: acuityBookingUrlForCategory('Color') },
      { id: 11, name: 'Glaze (Toner)', price: '$75+', duration: 60, category: 'Color', description: '', bookingUrl: acuityBookingUrlForCategory('Color') },
    ],
  },
  {
    name: 'Extras',
    slug: 'extras',
    services: [
      { id: 12, name: 'Brazilian Blowout', price: '$325+', duration: 120, category: 'Extras', description: '', bookingUrl: acuityBookingUrlForCategory('Extras') },
      { id: 13, name: 'Eyebrow Tint', price: '$45', duration: 15, category: 'Extras', description: '', bookingUrl: acuityBookingUrlForCategory('Extras') },
      { id: 14, name: 'Eyebrow Wax', price: '$20', duration: 15, category: 'Extras', description: '', bookingUrl: acuityBookingUrlForCategory('Extras') },
      { id: 15, name: 'Lip Wax', price: '$25', duration: 15, category: 'Extras', description: '', bookingUrl: acuityBookingUrlForCategory('Extras') },
      { id: 16, name: 'Chin Wax', price: '$25', duration: 15, category: 'Extras', description: '', bookingUrl: acuityBookingUrlForCategory('Extras') },
    ],
  },
];

export const GET: APIRoute = async ({ request }) => {
  // Best-effort abuse protection (per-instance on serverless)
  const rl = rateLimit(request, {
    key: 'api:services',
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
      // Return fallback data when API not configured (503 Service Unavailable)
      return new Response(
        JSON.stringify({
          data: fallbackServices,
          cached: false,
          fallback: true,
          error: 'API not configured',
        } satisfies ApiResponse<ServiceCategory[]>),
        {
          status: 503,
          headers: { ...corsHeaders, 'Retry-After': '300' },
        }
      );
    }

    const result = await withCache(
      servicesCacheKey(),
      async () => {
        const appointmentTypes = await getAppointmentTypes();
        // Filter to active, public services only
        const activeServices = appointmentTypes
          .filter((apt) => apt.active && !apt.private)
          .map(transformAppointmentType);
        return groupServicesByCategory(activeServices);
      },
      CacheTTL.SERVICES
    );

    return new Response(
      JSON.stringify({
        data: result.data,
        cached: result.cached,
        cachedAt: result.cachedAt,
        stale: result.stale,
      } satisfies ApiResponse<ServiceCategory[]>),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error('Error fetching services:', error);

    // Return fallback on error with 503 status
    return new Response(
      JSON.stringify({
        data: fallbackServices,
        cached: false,
        fallback: true,
        error: 'Service temporarily unavailable',
      } satisfies ApiResponse<ServiceCategory[]>),
      {
        status: 503,
        headers: { ...corsHeaders, 'Retry-After': '60' },
      }
    );
  }
};
