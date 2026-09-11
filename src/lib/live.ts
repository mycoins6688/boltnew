/**
 * Vantage — real-time simulation engine (dummy data, no backend).
 * Deterministic seeds so charts look good on first paint, then drift live.
 */

/* ------------------------------ seeded PRNG ------------------------------ */

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Build a deterministic, good-looking random-walk series. */
export function seededSeries(seed: number, points: number, start: number, volatility: number, drift = 0): number[] {
  const rnd = mulberry32(seed);
  const out: number[] = [];
  let v = start;
  for (let i = 0; i < points; i++) {
    const wave = Math.sin(i / 6.5) * volatility * 0.6 + Math.sin(i / 2.3) * volatility * 0.25;
    v += (rnd() - 0.5) * volatility + drift;
    out.push(Math.max(0, v + wave));
  }
  return out;
}

/* ------------------------------- data pools ------------------------------ */

export const FIRST_NAMES = [
  'Maya', 'Liam', 'Sofia', 'Noah', 'Ines', 'Kai', 'Priya', 'Owen',
  'Lena', 'Mateo', 'Aisha', 'Felix', 'Nora', 'Dante', 'Yuki', 'Elif',
  'Oscar', 'Freya', 'Ravi', 'Clara', 'Jonas', 'Amara', 'Theo', 'Zola',
];

export const LAST_NAMES = [
  'Chen', 'Okafor', 'Novak', 'Garcia', 'Kimura', 'Haddad', 'Lindqvist', 'Moreau',
  'Petrov', 'Nguyen', 'Ali', 'Fischer', 'Costa', 'Reyes', 'Kowalski', 'Dubois',
];

export const COMPANIES = [
  'Nimbus Labs', 'Ferrostack', 'Bluepine Co.', 'Kite & Anchor', 'Helio Systems',
  'Marbleworks', 'Copperline', 'Driftwell', 'Statice', 'Arclight', 'Vermillion',
  'Quartzite', 'Lumen Field', 'Northgate', 'Palefire', 'Tidewater', 'Ironbark', 'Solstice',
];

export type LiveEventType = 'upgrade' | 'report' | 'invite' | 'apikey' | 'limit' | 'trial';

export interface LiveEventDef {
  type: LiveEventType;
  /** rich-text template: [0]=name [1]=company, bold segments marked */
  verb: string;
  object?: string;
}

export const EVENT_DEFS: LiveEventDef[] = [
  { type: 'upgrade', verb: 'upgraded to', object: 'Scale' },
  { type: 'report', verb: 'created report', object: 'Q3 Board Deck' },
  { type: 'invite', verb: 'invited a teammate to', object: '' },
  { type: 'apikey', verb: 'regenerated an API key', object: '' },
  { type: 'limit', verb: 'exceeded usage limit on', object: 'Events API' },
  { type: 'trial', verb: 'started a trial of', object: 'Vantage' },
];

export interface LiveEvent {
  id: number;
  name: string;
  company: string;
  type: LiveEventType;
  verb: string;
  object: string;
  at: number; // epoch ms
}

let eventId = 0;
const evtRnd = mulberry32(987654);

export function randomEvent(at = Date.now()): LiveEvent {
  const name = `${FIRST_NAMES[Math.floor(evtRnd() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(evtRnd() * LAST_NAMES.length)]}`;
  const company = COMPANIES[Math.floor(evtRnd() * COMPANIES.length)];
  const def = EVENT_DEFS[Math.floor(evtRnd() * EVENT_DEFS.length)];
  return { id: ++eventId, name, company, type: def.type, verb: def.verb, object: def.object ?? '', at };
}

/* ----------------------------- avatar gradients -------------------------- */

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#6366F1,#8B5CF6)',
  'linear-gradient(135deg,#22D3EE,#6366F1)',
  'linear-gradient(135deg,#A78BFA,#D946EF)',
  'linear-gradient(135deg,#34D399,#22D3EE)',
  'linear-gradient(135deg,#FBBF24,#FB7185)',
  'linear-gradient(135deg,#FB7185,#A78BFA)',
];

export function avatarGradient(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/* -------------------------------- formatting ------------------------------ */

export function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${Math.round(n)}`;
}

export function fmtCurrency(n: number, decimals = 0): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fmtNumber(n: number, decimals = 0): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function fmtClock(d: Date): string {
  return d.toLocaleTimeString('en-GB', { hour12: false });
}

/* ------------------------------ chart palette ---------------------------- */

export const CHART_COLORS = ['#6366F1', '#22D3EE', '#A78BFA', '#34D399', '#FBBF24', '#FB7185'];
