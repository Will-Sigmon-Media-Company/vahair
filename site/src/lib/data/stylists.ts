/**
 * Centralized stylist data - Single source of truth
 * Used by pages, API fallbacks, and components
 */

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
    id: 7785532,
    name: 'Virginia',
    fullName: 'Virginia Page Watkins',
    image: '/images/virginia.jpg',
    role: 'Owner & Stylist',
    experience: '14 years of experience',
    imagePosition: 'object-top',
    bookingUrl: 'https://vahair.as.me/?calendarID=7785532',
  },
  {
    id: 8172243,
    name: 'Kim',
    fullName: 'Kim Latham',
    image: '/images/kim.jpg',
    role: 'Stylist',
    experience: '20 years of experience',
    imagePosition: 'object-center',
    bookingUrl: 'https://vahair.as.me/?calendarID=8172243',
  },
  {
    id: 13454517,
    name: 'Alyssa',
    fullName: 'Alyssa',
    image: '/images/salon.jpg',
    role: 'Stylist',
    experience: 'Stylist',
    imagePosition: 'object-center',
    bookingUrl: 'https://vahair.as.me/?calendarID=13454517',
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
