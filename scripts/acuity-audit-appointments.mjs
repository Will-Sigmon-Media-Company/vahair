#!/usr/bin/env node
/*
 * Acuity appointment audit helper.
 *
 * Goal: quickly answer "what's booked on our side?" during migrations,
 * without exposing client data in a public API.
 */

import { writeFileSync } from 'node:fs';

const ACUITY_BASE_URL = 'https://acuityscheduling.com/api/v1';

function usage(exitCode = 0) {
  // Keep this terse; it's meant for operators.
  const msg = `
Usage:
  node scripts/acuity-audit-appointments.mjs [options]

Env:
  ACUITY_USER_ID   (required)
  ACUITY_API_KEY   (required)

Options:
  --from YYYY-MM-DD           (default: today)
  --to YYYY-MM-DD             (default: today+30d)
  --calendar <id>             (repeatable)
  --max <n>                   (default: 100)
  --direction ASC|DESC        (default: ASC)
  --include-canceled          (fetch both active + canceled)
  --canceled                  (fetch only canceled)
  --include-forms             (include intake forms; default: excluded for speed)

  --first-name <value>
  --last-name <value>
  --email <value>
  --phone <value>

  --details                   (fetch /appointments/:id for scheduledBy)
  --csv <path>                (write CSV; also prints summary)

Examples:
  ACUITY_USER_ID=... ACUITY_API_KEY=... node scripts/acuity-audit-appointments.mjs --from 2026-02-01 --to 2026-03-01 --calendar 13484805 --csv output/alyssa-feb.csv
  ACUITY_USER_ID=... ACUITY_API_KEY=... node scripts/acuity-audit-appointments.mjs --from 2026-02-08 --to 2026-02-08 --calendar 13484805 --direction ASC --details
`.trim();

  console.error(msg);
  process.exit(exitCode);
}

function parseArgs(argv) {
  const out = {
    from: null,
    to: null,
    calendars: [],
    max: 100,
    direction: 'ASC',
    canceled: false,
    includeCanceled: false,
    excludeForms: true,
    firstName: null,
    lastName: null,
    email: null,
    phone: null,
    details: false,
    csvPath: null,
  };

  const args = [...argv];
  while (args.length) {
    const a = args.shift();
    if (!a) break;

    if (a === '--help' || a === '-h') usage(0);
    else if (a === '--from') out.from = args.shift() ?? usage(2);
    else if (a === '--to') out.to = args.shift() ?? usage(2);
    else if (a === '--calendar') out.calendars.push(args.shift() ?? usage(2));
    else if (a === '--max') out.max = Number(args.shift() ?? usage(2));
    else if (a === '--direction') out.direction = (args.shift() ?? usage(2)).toUpperCase();
    else if (a === '--canceled') out.canceled = true;
    else if (a === '--include-canceled') out.includeCanceled = true;
    else if (a === '--exclude-forms') out.excludeForms = true; // compat
    else if (a === '--include-forms') out.excludeForms = false;
    else if (a === '--first-name') out.firstName = args.shift() ?? usage(2);
    else if (a === '--last-name') out.lastName = args.shift() ?? usage(2);
    else if (a === '--email') out.email = args.shift() ?? usage(2);
    else if (a === '--phone') out.phone = args.shift() ?? usage(2);
    else if (a === '--details') out.details = true;
    else if (a === '--csv') out.csvPath = args.shift() ?? usage(2);
    else {
      console.error(`Unknown arg: ${a}`);
      usage(2);
    }
  }

  if (out.direction !== 'ASC' && out.direction !== 'DESC') {
    console.error('Invalid --direction (must be ASC or DESC)');
    process.exit(2);
  }
  if (!Number.isFinite(out.max) || out.max <= 0) {
    console.error('Invalid --max (must be a positive number)');
    process.exit(2);
  }
  return out;
}

function localISODate(d = new Date()) {
  const tzOffsetMs = d.getTimezoneOffset() * 60_000;
  const local = new Date(d.getTime() - tzOffsetMs);
  return local.toISOString().slice(0, 10);
}

function addDaysISODate(isoDate, days) {
  const [y, m, dd] = isoDate.split('-').map(Number);
  const d = new Date(y, m - 1, dd);
  d.setDate(d.getDate() + days);
  return localISODate(d);
}

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing env var: ${name}`);
    process.exit(2);
  }
  return v;
}

function authHeader() {
  const userId = requireEnv('ACUITY_USER_ID');
  const apiKey = requireEnv('ACUITY_API_KEY');
  const token = Buffer.from(`${userId}:${apiKey}`, 'utf8').toString('base64');
  return `Basic ${token}`;
}

async function acuityGetJson(path, params) {
  const url = new URL(`${ACUITY_BASE_URL}${path}`);
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v === null || v === undefined || v === '') continue;
    url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: authHeader(),
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Acuity API ${res.status} ${res.statusText}: ${text.slice(0, 500)}`);
  }

  return res.json();
}

function csvEscape(value) {
  const s = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

function toCsv(rows, columns) {
  const header = columns.join(',');
  const lines = rows.map((r) => columns.map((c) => csvEscape(r[c])).join(','));
  return [header, ...lines].join('\n') + '\n';
}

function normalizeAppointment(a, extra = {}) {
  return {
    id: a.id ?? '',
    datetime: a.datetime ?? '',
    date: a.date ?? '',
    time: a.time ?? '',
    endTime: a.endTime ?? '',
    dateCreated: a.dateCreated ?? '',
    type: a.type ?? '',
    appointmentTypeID: a.appointmentTypeID ?? '',
    calendar: a.calendar ?? '',
    calendarID: a.calendarID ?? '',
    firstName: a.firstName ?? '',
    lastName: a.lastName ?? '',
    email: a.email ?? '',
    phone: a.phone ?? '',
    canceled: extra.canceled ?? '',
    scheduledBy: extra.scheduledBy ?? '',
  };
}

async function mapLimit(items, limit, fn) {
  const ret = new Array(items.length);
  let i = 0;

  async function worker() {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      ret[idx] = await fn(items[idx], idx);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return ret;
}

async function fetchAppointmentsOnce(query) {
  const json = await acuityGetJson('/appointments', query);
  if (!Array.isArray(json)) {
    throw new Error('Unexpected /appointments response (expected JSON array)');
  }
  return json;
}

async function fetchAppointments({ from, to, calendarIDs, max, direction, canceled, excludeForms, firstName, lastName, email, phone }) {
  const baseQuery = {
    max,
    minDate: from,
    maxDate: to,
    calendarID: null,
    appointmentTypeID: null,
    canceled: !!canceled,
    excludeForms: !!excludeForms,
    direction,
    firstName,
    lastName,
    email,
    phone,
  };

  if (!calendarIDs || calendarIDs.length === 0) {
    return fetchAppointmentsOnce(baseQuery);
  }

  // Acuity's API takes a single calendarID; fan out to keep it simple.
  const all = [];
  for (const cal of calendarIDs) {
    const list = await fetchAppointmentsOnce({ ...baseQuery, calendarID: cal });
    all.push(...list);
  }
  return all;
}

async function fetchAppointmentDetails(id) {
  const json = await acuityGetJson(`/appointments/${encodeURIComponent(id)}`, { pastFormAnswers: false });
  return json;
}

function printSummary(rows) {
  const total = rows.length;
  const missingContact = rows.filter((r) => !String(r.email).trim() && !String(r.phone).trim()).length;
  const byCalendar = new Map();
  for (const r of rows) {
    const key = `${r.calendarID}`;
    byCalendar.set(key, (byCalendar.get(key) ?? 0) + 1);
  }

  console.log(`Appointments: ${total}`);
  console.log(`Missing email+phone: ${missingContact}`);
  if (byCalendar.size) {
    const parts = Array.from(byCalendar.entries())
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([k, v]) => `${k}:${v}`);
    console.log(`By calendarID: ${parts.join(' ')}`);
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const from = opts.from ?? localISODate(new Date());
  const to = opts.to ?? addDaysISODate(from, 30);

  const calendarIDs = opts.calendars.map((s) => {
    const n = Number(s);
    if (!Number.isFinite(n)) {
      console.error(`Invalid --calendar id: ${s}`);
      process.exit(2);
    }
    return n;
  });

  let rows = [];

  if (opts.includeCanceled) {
    const active = await fetchAppointments({
      from,
      to,
      calendarIDs,
      max: opts.max,
      direction: opts.direction,
      canceled: false,
      excludeForms: opts.excludeForms,
      firstName: opts.firstName,
      lastName: opts.lastName,
      email: opts.email,
      phone: opts.phone,
    });

    const canceled = await fetchAppointments({
      from,
      to,
      calendarIDs,
      max: opts.max,
      direction: opts.direction,
      canceled: true,
      excludeForms: opts.excludeForms,
      firstName: opts.firstName,
      lastName: opts.lastName,
      email: opts.email,
      phone: opts.phone,
    });

    rows = [
      ...active.map((a) => normalizeAppointment(a, { canceled: false })),
      ...canceled.map((a) => normalizeAppointment(a, { canceled: true })),
    ];
  } else {
    const appts = await fetchAppointments({
      from,
      to,
      calendarIDs,
      max: opts.max,
      direction: opts.direction,
      canceled: opts.canceled,
      excludeForms: opts.excludeForms,
      firstName: opts.firstName,
      lastName: opts.lastName,
      email: opts.email,
      phone: opts.phone,
    });

    rows = appts.map((a) => normalizeAppointment(a, { canceled: opts.canceled }));
  }

  if (opts.details && rows.length) {
    const details = await mapLimit(rows, 5, async (r) => {
      try {
        const d = await fetchAppointmentDetails(r.id);
        return { id: r.id, scheduledBy: d?.scheduledBy ?? '' };
      } catch {
        return { id: r.id, scheduledBy: '' };
      }
    });

    const map = new Map(details.map((d) => [String(d.id), d.scheduledBy]));
    rows = rows.map((r) => ({ ...r, scheduledBy: map.get(String(r.id)) ?? '' }));
  }

  // Deterministic sort for human review.
  rows.sort((a, b) => String(a.datetime).localeCompare(String(b.datetime)) || Number(a.id) - Number(b.id));

  printSummary(rows);

  const cols = [
    'id',
    'datetime',
    'date',
    'time',
    'endTime',
    'dateCreated',
    'type',
    'appointmentTypeID',
    'calendar',
    'calendarID',
    'firstName',
    'lastName',
    'email',
    'phone',
    'canceled',
    'scheduledBy',
  ];

  if (opts.csvPath) {
    const csv = toCsv(rows, cols);
    writeFileSync(opts.csvPath, csv);
    console.log(`Wrote CSV: ${opts.csvPath}`);
  } else {
    // Print a compact TSV for quick scanning.
    const previewCols = ['datetime', 'calendarID', 'type', 'firstName', 'lastName', 'email', 'phone', 'dateCreated', 'id'];
    console.log(previewCols.join('\t'));
    for (const r of rows) {
      console.log(previewCols.map((c) => String(r[c] ?? '')).join('\t'));
    }
  }
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
