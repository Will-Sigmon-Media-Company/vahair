/**
 * GET /api/services
 * Returns all services grouped by category
 */

import type { APIRoute } from 'astro';
import {
  getAppointmentTypes,
  isAcuityConfigured,
  withCache,
  servicesCacheKey,
  CacheTTL,
  transformAppointmentType,
  groupServicesByCategory,
  type ServiceCategory,
  type ApiResponse,
} from '../../lib/acuity';

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

// Fallback data when API is unavailable
const fallbackServices: ServiceCategory[] = [
  {
    name: 'Haircuts',
    slug: 'haircuts',
    services: [
      { id: 1, name: "Women's Haircut", price: '$50', duration: 45, category: 'Haircuts', description: '', bookingUrl: 'https://vahair.as.me/schedule.php?appointmentType=category:Haircuts' },
      { id: 2, name: "Men's Haircut", price: '$30', duration: 30, category: 'Haircuts', description: '', bookingUrl: 'https://vahair.as.me/schedule.php?appointmentType=category:Haircuts' },
      { id: 3, name: "Children's Cut (10 & under)", price: '$30', duration: 30, category: 'Haircuts', description: '', bookingUrl: 'https://vahair.as.me/schedule.php?appointmentType=category:Haircuts' },
      { id: 4, name: 'Blowdry Style', price: '$45+', duration: 30, category: 'Haircuts', description: '', bookingUrl: 'https://vahair.as.me/schedule.php?appointmentType=category:Haircuts' },
    ],
  },
  {
    name: 'Color',
    slug: 'color',
    services: [
      { id: 5, name: 'Root Touch Up', price: '$105', duration: 90, category: 'Color', description: '', bookingUrl: 'https://vahair.as.me/schedule.php?appointmentType=category:Color' },
      { id: 6, name: 'All Over Color', price: '$135', duration: 120, category: 'Color', description: '', bookingUrl: 'https://vahair.as.me/schedule.php?appointmentType=category:Color' },
      { id: 7, name: 'Halo Foil', price: '$125', duration: 120, category: 'Color', description: '', bookingUrl: 'https://vahair.as.me/schedule.php?appointmentType=category:Color' },
      { id: 8, name: 'Partial Foil', price: '$145', duration: 120, category: 'Color', description: '', bookingUrl: 'https://vahair.as.me/schedule.php?appointmentType=category:Color' },
      { id: 9, name: 'Full Foil', price: '$185', duration: 150, category: 'Color', description: '', bookingUrl: 'https://vahair.as.me/schedule.php?appointmentType=category:Color' },
      { id: 10, name: 'Color/Foil Combination', price: '$220', duration: 180, category: 'Color', description: '', bookingUrl: 'https://vahair.as.me/schedule.php?appointmentType=category:Color' },
      { id: 11, name: 'Glaze (Toner)', price: '$85', duration: 45, category: 'Color', description: '', bookingUrl: 'https://vahair.as.me/schedule.php?appointmentType=category:Color' },
    ],
  },
  {
    name: 'Waxing',
    slug: 'waxing',
    services: [
      { id: 12, name: 'Brazilian Blowout', price: '$325+', duration: 120, category: 'Waxing', description: '', bookingUrl: 'https://vahair.as.me/schedule.php?appointmentType=category:Waxing' },
      { id: 13, name: 'Eyebrow Tint', price: '$45', duration: 15, category: 'Waxing', description: '', bookingUrl: 'https://vahair.as.me/schedule.php?appointmentType=category:Waxing' },
      { id: 14, name: 'Eyebrow Wax', price: '$25', duration: 15, category: 'Waxing', description: '', bookingUrl: 'https://vahair.as.me/schedule.php?appointmentType=category:Waxing' },
      { id: 15, name: 'Lip Wax', price: '$25', duration: 15, category: 'Waxing', description: '', bookingUrl: 'https://vahair.as.me/schedule.php?appointmentType=category:Waxing' },
      { id: 16, name: 'Chin Wax', price: '$25', duration: 15, category: 'Waxing', description: '', bookingUrl: 'https://vahair.as.me/schedule.php?appointmentType=category:Waxing' },
    ],
  },
];

export const GET: APIRoute = async () => {
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
