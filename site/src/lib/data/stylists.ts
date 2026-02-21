/**
 * Centralized stylist data - Single source of truth
 * Used by pages, API fallbacks, and components
 */

import { acuityBookingUrlForCalendar } from '../acuity';

export interface Stylist {
  id: number;
  name: string;
  fullName: string;
  image: string;
  role: string;
  experience?: string;
  imagePosition?: string;
  bookingUrl: string;
}

/**
 * All stylists with their Acuity calendar IDs
 * Update this file when adding/removing stylists
 */
export const STYLISTS: Stylist[] = [
  {
    id: 13484734,
    name: 'Virginia',
    fullName: 'Virginia Page Watkins',
    image: '/images/virginia.jpg',
    role: '',
    experience: '17 years of experience',
    imagePosition: 'object-[center_20%]',
    bookingUrl: acuityBookingUrlForCalendar(13484734),
  },
  {
    id: 13484780,
    name: 'Kim',
    fullName: 'Kim Latham',
    image: '/images/kim.jpg',
    role: '',
    experience: '20 years of experience',
    imagePosition: 'object-[center_25%]',
    bookingUrl: acuityBookingUrlForCalendar(13484780),
  },
  {
    id: 13484805,
    name: 'Alyssa',
    fullName: 'Alyssa Valdes',
    image: '/images/alyssa.jpg',
    role: '',
    experience: '6 years of experience',
    imagePosition: 'object-[center_15%]',
    bookingUrl: acuityBookingUrlForCalendar(13484805),
  },
];

/**
 * Get stylists for homepage (excludes placeholder stylists)
 */
export function getHomepageStylists(): Stylist[] {
  return STYLISTS.filter(s => !s.image.includes('placeholder'));
}

/**
 * Get all stylists for booking page
 */
export function getAllStylists(): Stylist[] {
  return STYLISTS;
}

/**
 * Get stylist by ID
 */
export function getStylistById(id: number): Stylist | undefined {
  return STYLISTS.find(s => s.id === id);
}

/**
 * Valid calendar IDs for validation
 */
export const VALID_CALENDAR_IDS = STYLISTS.map(s => s.id);
