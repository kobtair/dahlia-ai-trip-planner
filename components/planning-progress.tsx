'use client';
import { useEffect, useState } from 'react';
import { Compass, MapPin, Route, CloudSun } from 'lucide-react';

export function PlanningProgress({ destination }: { destination: string }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => { const started = Date.now(); const timer = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000); return () => clearInterval(timer); }, []);
  return <section aria-label="Building your itinerary" aria-busy="true" className="px-7 py-14 sm:px-12">
    <div className="mx-auto max-w-lg">
      <div className="mb-8 grid size-16 place-items-center rounded-full bg-[#f5e7df] text-[#ab482f]"><Compass className="size-8 animate-[spin_12s_linear_infinite]" /></div>
      <p className="planner-eyebrow">YOUR TRIP IS TAKING SHAPE</p>
      <h2 className="mt-4 font-heading text-4xl leading-tight">A little closer to<br />{destination || 'your next adventure'}.</h2>
<output aria-live="polite" className="block mt-5 text-sm text-muted-foreground">{elapsed >= 45 ? 'This is taking longer than usual. You can keep waiting or cancel from chat.' : 'Your itinerary request is in progress. We’ll show the plan when it is ready.'}</output>
      <div className="mt-5 h-1 overflow-hidden rounded-full bg-[#e8e1d5]" aria-hidden="true"><div className="h-full w-1/3 animate-pulse rounded-full bg-[#ab482f]" /></div>
      <p className="mt-2 text-right text-xs text-muted-foreground" aria-hidden="true">{elapsed}s elapsed</p>
      <div className="mt-8 flex flex-wrap gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-2"><MapPin size={14} /> Places</span><span className="flex items-center gap-2"><Route size={14} /> Routes</span><span className="flex items-center gap-2"><CloudSun size={14} /> Forecasts</span></div>
      <div className="mt-8 space-y-3" aria-hidden="true">{[0, 1, 2].map((item) => <div key={item} className="flex gap-4 rounded-xl border p-4"><div className="h-16 w-20 shrink-0 animate-pulse rounded-lg bg-[#ece7de]" /><div className="flex-1 space-y-3 py-2"><div className="h-3 w-2/3 animate-pulse rounded bg-[#ece7de]" /><div className="h-2 w-full animate-pulse rounded bg-[#ece7de]" /><div className="h-2 w-4/5 animate-pulse rounded bg-[#ece7de]" /></div></div>)}</div>
      <p className="mt-6 text-xs leading-5 text-muted-foreground">We’re requesting travel data and building your itinerary. This can take a little while.</p>
    </div>
  </section>;
}
