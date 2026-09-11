import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { mulberry32, randomEvent, seededSeries } from '@/lib/live';
import type { LiveEvent } from '@/lib/live';

/**
 * Real-time simulation engine — design.md §7.
 * Central 2000ms tick random-walks the headline metrics and pushes into
 * rolling series for charts/sparklines. A randomized 1.5–4s stream emits
 * fake activity events. `live === false` freezes all mutation.
 */

export interface LiveState {
  live: boolean;
  setLive: (v: boolean) => void;
  toggleLive: () => void;
  /** increments on every tick — use to key flash animations */
  tick: number;
  /* headline metrics */
  mrr: number;
  activeUsers: number;
  eventsPerSec: number;
  signupsToday: number;
  conversionRate: number; // percent
  sessionSeconds: number;
  presence: number; // active right now
  apiCalls: number; // millions
  /* rolling series */
  revenueSeries: number[]; // 60 points
  revenuePrevSeries: number[]; // 60 points
  sparkMrr: number[]; // 30
  sparkUsers: number[]; // 30
  sparkConv: number[]; // 30
  sparkSession: number[]; // 30
  minuteBars: number[]; // 12 — active users per minute
  events: LiveEvent[]; // capped at 30
}

const LiveContext = createContext<LiveState | null>(null);

const walk = (v: number, pct: number, rnd: () => number) => v * (1 + (rnd() - 0.5) * 2 * pct);

function buildInitialState(): Omit<LiveState, 'live' | 'setLive' | 'toggleLive'> {
  const revenueSeries = seededSeries(11, 60, 4300, 260, 6);
  const revenuePrevSeries = seededSeries(23, 60, 3900, 240, 4);
  const sparkMrr = seededSeries(31, 30, 120, 8, 0.4);
  const sparkUsers = seededSeries(47, 30, 22, 2.4, 0.08);
  const sparkConv = seededSeries(59, 30, 3.7, 0.3, -0.004);
  const sparkSession = seededSeries(71, 30, 262, 14, 0.3);
  const minuteBars = seededSeries(83, 12, 320, 60, 2).map((v) => Math.round(v));

  const now = Date.now();
  const events: LiveEvent[] = [];
  for (let i = 0; i < 9; i++) {
    const e = randomEvent(now - (i + 1) * 47000 - i * 13000);
    events.push(e);
  }

  return {
    tick: 0,
    mrr: 128430,
    activeUsers: 24847,
    eventsPerSec: 312,
    signupsToday: 1204,
    conversionRate: 3.42,
    sessionSeconds: 278,
    presence: 342,
    apiCalls: 8.4,
    revenueSeries,
    revenuePrevSeries,
    sparkMrr,
    sparkUsers,
    sparkConv,
    sparkSession,
    minuteBars,
    events,
  };
}

export function LiveProvider({ children }: { children: ReactNode }) {
  const [live, setLive] = useState(true);
  const [state, setState] = useState(buildInitialState);
  const liveRef = useRef(live);
  liveRef.current = live;

  /* central 2s tick */
  useEffect(() => {
    const id = window.setInterval(() => {
      if (!liveRef.current) return;
      setState((s) => {
        const rnd = mulberry32((s.tick + 1) * 7919 + 13);
        const mrr = Math.round(walk(s.mrr, 0.0016, rnd));
        const activeUsers = Math.max(1000, Math.round(walk(s.activeUsers, 0.004, rnd)));
        const eventsPerSec = Math.max(40, Math.round(walk(s.eventsPerSec, 0.05, rnd)));
        const signupsToday = s.signupsToday + Math.floor(rnd() * 3);
        const conversionRate = Math.min(6, Math.max(1.5, s.conversionRate + (rnd() - 0.5) * 0.06));
        const sessionSeconds = Math.min(600, Math.max(120, Math.round(s.sessionSeconds + (rnd() - 0.5) * 6)));
        const presence = Math.max(60, Math.round(walk(s.presence, 0.03, rnd)));
        const apiCalls = Math.round((s.apiCalls + (rnd() - 0.42) * 0.02) * 100) / 100;

        const push = (arr: number[], v: number, max: number) => [...arr.slice(-(max - 1)), v];
        const nextTick = s.tick + 1;
        // shift minute bars every 5 ticks (10s)
        const minuteBars =
          nextTick % 5 === 0 ? [...s.minuteBars.slice(1), Math.max(80, Math.round(walk(presence, 0.12, rnd)))] : s.minuteBars;

        return {
          ...s,
          tick: nextTick,
          mrr,
          activeUsers,
          eventsPerSec,
          signupsToday,
          conversionRate,
          sessionSeconds,
          presence,
          apiCalls,
          revenueSeries: push(s.revenueSeries, Math.max(500, walk(s.revenueSeries[s.revenueSeries.length - 1], 0.035, rnd)), 60),
          sparkMrr: push(s.sparkMrr, mrr / 1000, 30),
          sparkUsers: push(s.sparkUsers, activeUsers / 1000, 30),
          sparkConv: push(s.sparkConv, conversionRate, 30),
          sparkSession: push(s.sparkSession, sessionSeconds, 30),
          minuteBars,
        };
      });
    }, 2000);
    return () => window.clearInterval(id);
  }, []);

  /* randomized 1.5–4s live event stream */
  useEffect(() => {
    let timeout: number;
    let cancelled = false;
    const schedule = () => {
      timeout = window.setTimeout(() => {
        if (!cancelled && liveRef.current) {
          setState((s) => ({ ...s, events: [randomEvent(), ...s.events].slice(0, 30) }));
        }
        if (!cancelled) schedule();
      }, 1500 + Math.random() * 2500);
    };
    schedule();
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, []);

  const value = useMemo<LiveState>(
    () => ({
      ...state,
      live,
      setLive,
      toggleLive: () => setLive((v) => !v),
    }),
    [state, live],
  );

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

export function useLiveMetrics(): LiveState {
  const ctx = useContext(LiveContext);
  if (!ctx) throw new Error('useLiveMetrics must be used inside <LiveProvider>');
  return ctx;
}

/** prefers-reduced-motion */
export function useReducedMotionPref(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}
