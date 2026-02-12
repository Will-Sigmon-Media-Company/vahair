# Booking Ops Runbook (Acuity)

Use this when there is any risk of a missed appointment, especially during migrations.

## 1) Standard Response Template (Text/Email)

**Goal:** acknowledge, take ownership, ask for the minimum info needed, and commit to a concrete next step/time.

Copy/paste and fill brackets:

> Thanks for flagging this. I agree we need to make sure nothing is getting missed.
> 
> 1. I’m going to pull an audit of Alyssa’s booked appointments on our side for **[DATE RANGE]** and send you a list of anything that looks unexpected.
> 2. For the **[TIME]** today: can you send me the client’s **name** and the **email or phone** they used to book (if you have it)? I’ll look up the booking record and confirm **exactly when/how it was created** (client booking vs admin booking) so we can prevent repeats.
> 3. On the block-time conversions: **please don’t delete any of those yet**. Deleting risks losing contact details. We’ll export/capture the client info first, then recreate them as proper appointments so reminders work.
> 
> I’ll get you the audit list by **[TIME TODAY]**.

## 2) Immediate “Stop The Bleed” Checklist

Do these in order.

1. Confirm staff notifications are configured.
   - In Acuity admin: verify “New appointment” notifications go to the correct staff emails.
   - Do a test booking and ensure Virginia and Alyssa both receive the expected notification.

2. Audit upcoming appointments.
   - Pull upcoming appointments for each stylist for the next 14-30 days.
   - Specifically look for entries with missing contact info.

3. Freeze destructive edits.
   - No deleting appointments or block-offs until exports are captured.

## 3) How To Audit Appointments (Fast)

### Option A: Acuity UI export

1. In Acuity admin: Appointments
2. Filter the date range (start = today; end = +30 days)
3. Export CSV (or print list) for Virginia/Kim/Alyssa

### Option B: Local API audit script (recommended during migration)

This repo includes a local script that queries Acuity via API and outputs a list/CSV.

> Treat the output as sensitive client data. Don’t paste it into group chats; prefer sending a summary.
Calendar IDs:

- Virginia: `13484734`
- Kim: `13484780`
- Alyssa: `13484805`

1. Ensure env vars are set:

```bash
export ACUITY_USER_ID='38274584'
export ACUITY_API_KEY='your_api_key'
```

2. Run an audit (example: Alyssa, next 30 days):

```bash
node scripts/acuity-audit-appointments.mjs \
  --from 2026-02-08 \
  --to 2026-03-10 \
  --calendar 13484805 \
  --direction ASC \
  --csv output/alyssa-appointments.csv
```

3. If you need “who created this booking” data, add `--details` (slower):

```bash
node scripts/acuity-audit-appointments.mjs --from 2026-02-08 --to 2026-03-10 --calendar 13484805 --direction ASC --details
```

## 4) Block Time Conversion (Don’t Lose Contact Info)

Problem:
- “Block off time” entries do not behave like client appointments (no reminders).
- Deleting/overwriting entries can lose the only copy of client contact info.

Safe process:

1. Export first.
   - Export client list.
   - Export appointments for the affected date range.

2. Recreate second.
   - Recreate client appointments as actual appointment types (not block-offs).
   - Verify the client has email/phone on the appointment.
   - Verify reminders are enabled for that appointment type.

3. Delete last.
   - Only delete the old block-offs after verifying the replacement appointment exists and has contact info.

## 5) Migration Window Reconciliation

If someone says “I booked last week but you didn’t get notified”, treat it like a reconciliation issue:

1. Find the appointment by date/time + stylist calendar.
2. Check `dateCreated` and (if needed) `scheduledBy`.
3. If it was created during the migration window, assume notifications may not have been wired correctly yet.
4. After remediation: re-test with a fresh booking.
