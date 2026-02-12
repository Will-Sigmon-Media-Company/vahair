# Acuity Migration Checklist

> Migrating from Squarespace-connected Acuity to standalone Acuity account

**Migration Date:** 2026-02-02
**Status:** IN PROGRESS - Account created, updating code

---

## Current Configuration (OLD - Squarespace-Connected)

| Item | Value |
|------|-------|
| **Booking URL** | `https://vahair.as.me/` |
| **Virginia Calendar ID** | `7785532` |
| **Kim Calendar ID** | `8172243` |
| **Alyssa Calendar ID** | `13454517` |
| **Account Type** | Squarespace-connected |

---

## New Configuration (COMPLETED)

| Item | Value |
|------|-------|
| **New Booking URL** | `https://app.acuityscheduling.com/schedule.php?owner=38274584` |
| **Virginia Calendar ID** | `13484734` |
| **Kim Calendar ID** | `13484780` |
| **Alyssa Calendar ID** | `13484805` |
| **ACUITY_USER_ID** | `38274584` |
| **ACUITY_API_KEY** | `REDACTED` |
| **Account Type** | Standalone |

---

> **Security note:** API keys must not be stored in git (including docs). If an API key was ever committed,\n+> rotate it in Acuity immediately and update Vercel/env vars.\n+\n ## Phase 1: Acuity Account Setup (User Action)
## Phase 1: Acuity Account Setup (User Action)

### Step 1: Create New Account
- [ ] Go to https://acuityscheduling.com
- [ ] Create a NEW account (separate from Squarespace)
- [ ] Use a different email or create as separate business
- [ ] Choose appropriate plan

### Step 2: Export Data from Old Account
- [ ] In OLD Acuity: Settings → Import/Export → Export
- [ ] Export client list (CSV)
- [ ] Export appointment history (CSV)
- [ ] Save files for import

### Step 3: Import into New Account
- [ ] In NEW Acuity: Settings → Import/Export → Import
- [ ] Import client list
- [ ] Import appointment history (if desired)

### Step 4: Configure Calendars (Stylists)
Create 3 calendars matching current setup:

| Stylist | Role | Old ID | New ID |
|---------|------|--------|--------|
| Virginia Page Watkins | Owner & Stylist | 7785532 | 13484734 |
| Kim Latham | Stylist | 8172243 | 13484780 |
| Alyssa | Color Specialist | 13454517 | 13484805 |

### Step 5: Create Appointment Types (Services)
Recreate all services and **assign to correct calendars**:

**Haircuts** (Virginia + Kim):
- [ ] Women's Haircut - $50
- [ ] Men's Haircut - $30
- [ ] Children's Cut (10 & under) - $30
- [ ] Blowdry Style - $45+

**Color** (Virginia + Kim + Alyssa):
- [ ] Root Touch Up - $105
- [ ] All Over Color - $135
- [ ] Halo Foil - $125
- [ ] Partial Foil - $145
- [ ] Full Foil - $185
- [ ] Color/Foil Combination - $220
- [ ] Glaze (Toner) - $85

**Extras/Waxing** (Virginia + Kim):
- [ ] Brazilian Blowout - $325+
- [ ] Eyebrow Tint - $45
- [ ] Eyebrow Wax - $25
- [ ] Lip Wax - $25
- [ ] Chin Wax - $25

> **CRITICAL:** The previous bug was that Alyssa had no services assigned.
> Make sure to assign color services to Alyssa's calendar!

### Step 6: Set Availability
- [ ] Virginia: Tue-Fri
- [ ] Kim: Tue-Fri
- [ ] Alyssa: Alternating weeks (configure per her schedule)

### Step 7: Get API Credentials
- [ ] Go to Settings → Integrations → API
- [ ] Copy User ID: _________________
- [ ] Copy API Key: _________________

### Step 8: Test New Account
- [ ] Visit new booking URL
- [ ] Verify all 3 stylists appear
- [ ] Verify services show for each stylist
- [ ] Do a test booking (then cancel)

---

## Phase 2: Code Updates (After Setup Complete)

### Files Requiring Updates (66 occurrences in 15 files)

#### Priority 0 - Core Constants
| File | Changes |
|------|---------|
| `site/src/lib/acuity/helpers.ts:15` | Update `ACUITY_BASE_BOOKING_URL` constant |
| `site/src/lib/data/stylists.ts` | Update 3 calendar IDs + booking URLs |

#### Priority 1 - Booking Components
| File | Changes |
|------|---------|
| `site/src/pages/book.astro:94` | Update iframe embed URL |
| `site/src/components/booking/StylistAvailabilityCard.astro:26` | Update booking URL builder |
| `site/src/components/booking/SmartBookButton.astro:23` | Update booking URL builder |

#### Priority 2 - Service Fallbacks (16 URLs each)
| File | Changes |
|------|---------|
| `site/src/pages/api/services.ts` | Update 16 fallback service URLs |
| `site/src/components/services/ServiceList.astro` | Update 16 fallback service URLs |

#### Priority 3 - Services Page
| File | Changes |
|------|---------|
| `site/src/pages/services.astro` | Update 4 category links + Alyssa's link |

#### Priority 4 - Layout/Prefetch
| File | Changes |
|------|---------|
| `site/src/layouts/Layout.astro:52` | Update dns-prefetch link |

#### Priority 5 - Documentation
| File | Changes |
|------|---------|
| `technical/acuity-integration.md` | Full rewrite with new URLs |
| `technical/sitemap.md` | Update Acuity URL |
| `technical/seo-metadata.md` | Update appointment URL |
| `content/appointments.md` | Update booking URLs and calendar IDs |
| `content/homepage.md` | Update Book Now link |
| `rebuild-notes.md` | Update booking URL reference |
| `README.md` | Update booking system reference |

#### Priority 6 - Environment
| File | Changes |
|------|---------|
| `.env.local` | Update ACUITY_USER_ID and ACUITY_API_KEY |

---

## Phase 3: Implementation Steps

Once new Acuity details are provided:

### Step 1: Update Core Constant
```typescript
// site/src/lib/acuity/helpers.ts line 15
const ACUITY_BASE_BOOKING_URL = 'https://NEW_ACCOUNT.as.me';
```

### Step 2: Update Stylist Data
```typescript
// site/src/lib/data/stylists.ts
export const STYLISTS: Stylist[] = [
  {
    id: NEW_VIRGINIA_ID,  // Replace with new calendar ID
    name: 'Virginia',
    fullName: 'Virginia Page Watkins',
    image: '/images/virginia.jpg',
    role: 'Owner & Stylist',
    experience: '14 years of experience',
    imagePosition: 'object-top',
    bookingUrl: 'https://NEW_ACCOUNT.as.me/?calendarID=NEW_VIRGINIA_ID',
  },
  // ... Kim and Alyssa with new IDs
];
```

### Step 3: Update Components
- Replace all hardcoded `vahair.as.me` references
- Update booking URL builders in components

### Step 4: Update Environment
```bash
# .env.local
ACUITY_USER_ID=new_user_id
ACUITY_API_KEY=new_api_key
```

### Step 5: Update Documentation
- Rewrite technical docs with new URLs
- Update content markdown files

---

## Phase 4: Verification

### Build Test
```bash
cd site
npm run build  # Should complete with no errors
```

### Dev Server Test
```bash
npm run dev
# Check all pages load correctly
```

### Functional Tests
- [ ] Homepage → Click stylist → Acuity opens with correct stylist
- [ ] Services page → Category links open correct Acuity page
- [ ] Book page → Iframe loads correctly
- [ ] Book page → Stylist quick-book buttons work

### API Tests
- [ ] `/api/stylists` returns correct data
- [ ] `/api/services` returns correct URLs
- [ ] `/api/availability/next-slot?calendarId=X` works for all stylists

### Production Deploy
- [ ] Push to Vercel
- [ ] Verify live site at vahair.studio

---

## Rollback Plan

If issues occur:

1. **Git revert:**
   ```bash
   git revert HEAD~N  # Revert N commits
   ```

2. **Environment restore:**
   - Keep backup of old `.env.local` credentials

3. **Old account:**
   - Keep old Squarespace-connected account active during transition

---

## Search/Replace Reference

For global replacement (after confirming new account name):

```bash
# From project root
grep -rl "vahair.as.me" . | xargs sed -i '' 's/vahair\.as\.me/NEW_ACCOUNT.as.me/g'
```

Replace calendar IDs individually (they may differ):
- `7785532` → New Virginia ID
- `8172243` → New Kim ID
- `13454517` → New Alyssa ID

---

## Notes

- Old Squarespace account: Keep active for 30 days after migration
- Client communication: Consider emailing clients about any booking URL changes
- DNS/SEO: If the new account has a different subdomain, update any external links

---

## Timeline

| Phase | Status | Date |
|-------|--------|------|
| Account Setup | ✅ COMPLETE | 2026-02-02 |
| Code Updates | ✅ COMPLETE | 2026-02-02 |
| Testing | IN PROGRESS | 2026-02-02 |
| Deploy | PENDING | |
| Go-Live | PENDING | |
