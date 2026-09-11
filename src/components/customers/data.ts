import { mulberry32 } from '@/lib/live';

/**
 * Customers page — dummy CRM dataset (design/customers.md §3).
 * First 10 rows match the design sample; 38 more are deterministically
 * generated. All data is fictional.
 */

export type Plan = 'Enterprise' | 'Scale' | 'Starter';
export type Status = 'Active' | 'Trialing' | 'Past due' | 'Churned';

export interface Customer {
  id: number;
  name: string;
  domain: string;
  plan: Plan;
  mrr: number;
  health: number;
  /** minutes since last activity */
  lastActiveMin: number;
  status: Status;
  seats: number;
  activeSeats: number;
  since: string;
  apiCalls: string;
  annual: number;
  renews: string;
}

const SEED_ROWS: Array<[string, string, Plan, number, number, number, Status]> = [
  ['Nimbus Labs', 'nimbus.io', 'Enterprise', 4200, 92, 12, 'Active'],
  ['Ferrostack', 'ferrostack.com', 'Scale', 1180, 74, 120, 'Active'],
  ['Bluepine Co.', 'bluepine.co', 'Scale', 940, 38, 4320, 'Past due'],
  ['Kite & Anchor', 'kiteanchor.com', 'Starter', 49, 81, 26, 'Trialing'],
  ['Helio Systems', 'helio.systems', 'Enterprise', 3650, 88, 60, 'Active'],
  ['Marbleworks', 'marbleworks.io', 'Starter', 49, 22, 17280, 'Churned'],
  ['Copperline', 'copperline.dev', 'Scale', 1420, 67, 300, 'Active'],
  ['Driftwell', 'driftwell.app', 'Starter', 98, 55, 480, 'Trialing'],
  ['Statice', 'statice.ai', 'Scale', 2050, 90, 44, 'Active'],
  ['Arclight', 'arclight.co', 'Starter', 49, 61, 1440, 'Active'],
];

const EXTRA_NAMES = [
  'Vermillion', 'Quartzite', 'Lumen Field', 'Northgate', 'Palefire', 'Tidewater', 'Ironbark', 'Solstice',
  'Cinderpath', 'Foxglove', 'Hollowbrook', 'Jetstream', 'Kilnworks', 'Larkspur', 'Mistral', 'Nettlebee',
  'Obsidian Arc', 'Peregrine', 'Quillpoint', 'Rosethorn', 'Saltmarsh', 'Thistledown', 'Umberline', 'Vesper Labs',
  'Wildgrass', 'Yellowbrick', 'Zenith Row', 'Amberfleet', 'Briarcliff', 'Cloudmantle', 'Duskline', 'Emberly',
  'Fernhollow', 'Galeforce', 'Harborlight', 'Inkwright', 'Juniper Bay', 'Kestrel',
];

const TLDS = ['.io', '.com', '.co', '.dev', '.app', '.ai', '.systems', '.cloud'];
const SINCES = ['Jan 2023', 'Mar 2023', 'Jun 2023', 'Sep 2023', 'Nov 2023', 'Feb 2024', 'May 2024', 'Aug 2024', 'Oct 2024', 'Jan 2025'];
const RENEWS = ['Apr 1', 'May 15', 'Jun 1', 'Jul 22', 'Aug 9', 'Sep 30', 'Oct 12', 'Nov 5', 'Dec 18'];

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function planMrr(plan: Plan, rnd: () => number): number {
  if (plan === 'Enterprise') return Math.round((2800 + rnd() * 2400) / 10) * 10;
  if (plan === 'Scale') return Math.round((480 + rnd() * 1900) / 10) * 10;
  return [49, 49, 98, 98, 149][Math.floor(rnd() * 5)];
}

function buildCustomers(): Customer[] {
  const rnd = mulberry32(424242);
  const out: Customer[] = SEED_ROWS.map(([name, domain, plan, mrr, health, lastActiveMin, status], i) => {
    const seats = plan === 'Enterprise' ? 34 + Math.floor(rnd() * 30) : plan === 'Scale' ? 8 + Math.floor(rnd() * 18) : 1 + Math.floor(rnd() * 5);
    return {
      id: i + 1,
      name,
      domain,
      plan,
      mrr,
      health,
      lastActiveMin,
      status,
      seats,
      activeSeats: Math.max(1, Math.round(seats * (0.55 + rnd() * 0.4))),
      since: SINCES[i % SINCES.length],
      apiCalls: `${(0.1 + rnd() * 2.8).toFixed(1)}M/mo`,
      annual: mrr * 12,
      renews: RENEWS[i % RENEWS.length],
    };
  });

  EXTRA_NAMES.forEach((name, k) => {
    const r = rnd();
    const plan: Plan = r < 0.12 ? 'Enterprise' : r < 0.42 ? 'Scale' : 'Starter';
    const health = Math.round(12 + rnd() * 86);
    const status: Status =
      health < 28 ? (rnd() < 0.5 ? 'Churned' : 'Past due') : rnd() < 0.18 ? 'Trialing' : rnd() < 0.1 ? 'Past due' : 'Active';
    const mrr = status === 'Churned' && plan === 'Starter' ? 0 : planMrr(plan, rnd);
    const seats = plan === 'Enterprise' ? 30 + Math.floor(rnd() * 40) : plan === 'Scale' ? 6 + Math.floor(rnd() * 20) : 1 + Math.floor(rnd() * 5);
    const tld = TLDS[Math.floor(rnd() * TLDS.length)];
    out.push({
      id: SEED_ROWS.length + k + 1,
      name,
      domain: `${slugify(name)}${tld}`,
      plan,
      mrr,
      health,
      lastActiveMin: Math.round(rnd() * 20000),
      status,
      seats,
      activeSeats: Math.max(1, Math.round(seats * (0.5 + rnd() * 0.45))),
      since: SINCES[Math.floor(rnd() * SINCES.length)],
      apiCalls: `${(0.05 + rnd() * 3.4).toFixed(1)}M/mo`,
      annual: mrr * 12,
      renews: RENEWS[Math.floor(rnd() * RENEWS.length)],
    });
  });
  return out;
}

export const CUSTOMERS: Customer[] = buildCustomers();

/** fictional top-line counts from the design doc */
export const SEGMENT_COUNTS = {
  All: 1284,
  Enterprise: 86,
  Scale: 312,
  Starter: 886,
  'At-risk': 47,
} as const;

export type Segment = keyof typeof SEGMENT_COUNTS;
export const SEGMENTS: Segment[] = ['All', 'Enterprise', 'Scale', 'Starter', 'At-risk'];

export function matchesSegment(c: Customer, seg: Segment): boolean {
  if (seg === 'All') return true;
  if (seg === 'At-risk') return c.health < 45 || c.status === 'Past due';
  return c.plan === seg;
}

export function fmtRelative(min: number): string {
  if (min < 1) return 'just now';
  if (min < 60) return `${Math.round(min)}m ago`;
  if (min < 1440) return `${Math.round(min / 60)}h ago`;
  return `${Math.round(min / 1440)}d ago`;
}

export const healthTone = (h: number): 'success' | 'warning' | 'danger' =>
  h >= 70 ? 'success' : h >= 40 ? 'warning' : 'danger';
