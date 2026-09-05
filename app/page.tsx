'use client';

import { SyntheticEvent, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ItineraryMap } from '@/components/itinerary-map';
import {
  ArrowRight, CalendarDays, Check, ChevronDown, CircleAlert, CloudSun, Compass, DollarSign,
  ExternalLink, Footprints, History, Link2, LoaderCircle, Map, MapPin, RotateCcw, Sparkles,
  Users, Utensils, WandSparkles, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type TripForm = {
  prompt: string;
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: number;
  pace: 'slow' | 'balanced' | 'full';
  interests: string[];
};

type PlaceItem = {
  latitude?: number; longitude?: number;
  id: string; name: string; category: string; description: string; imageUrl?: string; website?: string;
  openingHours?: string; sourceUrl: string; source: string; startTime: string; endTime: string;
  travelMinutesFromPrevious: number; why: string; freshness: { status: string; provider: string; fetchedAt: string };
};

type TripPlan = {
  tripId: string;
  spec: TripForm & { days: number };
  destination: { name: string; country?: string; latitude: number; longitude: number; timezone?: string; summary?: string; imageUrl?: string; sourceUrl?: string };
  itinerary: Array<{ day: number; date: string; title: string; items: PlaceItem[]; route: { distanceKm: number; durationMinutes: number; source: string; status: string; geometry?: { coordinates: [number, number][] } } }>;
  weather: { available: boolean; status: string; note?: string; timezone?: string; daily?: Array<{ date: string; high: number; low: number; precipitation: number; description: string }> };
  budget: { currency: string; budget: number; total: number; status: string; lines: Array<{ label: string; amount: number; status: string }> };
  validation: { dates: string; overlap: string; pace: string; openingHours: string; budget: string; note: string };
  meta: { fetchedAt: string; providers: string[]; engine: string; warnings: string[] };
};

const INTERESTS = [
  { id: 'food', label: 'Local food', icon: Utensils },
  { id: 'history', label: 'History', icon: History },
  { id: 'art', label: 'Art & design', icon: Sparkles },
  { id: 'nature', label: 'Nature', icon: Footprints },
  { id: 'architecture', label: 'Architecture', icon: MapPin },
];

function isoDate(offset: number) {
  const value = new Date();
  value.setDate(value.getDate() + offset);
  return value.toISOString().slice(0, 10);
}

const DEFAULT_FORM: TripForm = {
  prompt: 'A long weekend with local food, design, and time to wander',
  origin: 'London',
  destination: 'Lisbon',
  startDate: isoDate(7),
  endDate: isoDate(10),
  travelers: 2,
  budget: 1400,
  pace: 'balanced',
  interests: ['food', 'art', 'history'],
};

async function requestTrip(form: TripForm) {
  const response = await fetch('/api/plan', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(form),
  });
  const data = await response.json() as TripPlan | { error?: string };
  if (!response.ok) throw new Error('error' in data ? data.error || 'Could not build this trip.' : 'Could not build this trip.');
  return data as TripPlan;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));
}

function StatusDot({ status }: { status: string }) {
  const color = status === 'pass' || status === 'live' ? 'bg-emerald-500' : status === 'fail' || status === 'over' ? 'bg-red-500' : 'bg-amber-400';
  return <span className={`inline-block size-2 rounded-full ${color}`} />;
}

export default function Home() {
  const [form, setForm] = useState<TripForm>(DEFAULT_FORM);
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [revisionText, setRevisionText] = useState('');
  const [revisions, setRevisions] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const formRef = useRef(form);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  async function buildTrip(nextForm = form, revision?: string) {
    setLoading(true);
    setError('');
    try {
      const nextPlan = await requestTrip(nextForm);
      setPlan(nextPlan);
      setSaved(false);
      if (revision) setRevisions((current) => [revision, ...current].slice(0, 8));
      localStorage.setItem('dahlia-last-trip', JSON.stringify({ form: nextForm, plan: nextPlan, revisions: revision ? [revision, ...revisions] : revisions }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not build this trip.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('share') === '1') {
        const shared: TripForm = {
          ...DEFAULT_FORM,
          destination: params.get('destination') || DEFAULT_FORM.destination,
          origin: params.get('origin') || '',
          startDate: params.get('start') || DEFAULT_FORM.startDate,
          endDate: params.get('end') || DEFAULT_FORM.endDate,
          travelers: Number(params.get('travelers') || 1),
          budget: Number(params.get('budget') || 0),
          pace: (params.get('pace') as TripForm['pace']) || 'balanced',
          interests: (params.get('interests') || 'food,history').split(',').filter(Boolean),
          prompt: params.get('prompt') || 'Shared Dahlia trip',
        };
        setForm(shared);
        setReadOnly(true);
        setLoading(true);
        void requestTrip(shared)
          .then((nextPlan) => {
            setPlan(nextPlan);
            localStorage.setItem('dahlia-last-trip', JSON.stringify({ form: shared, plan: nextPlan, revisions: [] }));
          })
          .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Could not build this shared trip.'))
          .finally(() => setLoading(false));
        return;
      }
      const stored = localStorage.getItem('dahlia-last-trip');
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as { form?: TripForm; plan?: TripPlan; revisions?: string[] };
          if (parsed.form) setForm(parsed.form);
          if (parsed.plan) setPlan(parsed.plan);
          if (parsed.revisions) setRevisions(parsed.revisions);
        } catch { localStorage.removeItem('dahlia-last-trip'); }
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const context = (document as unknown as { modelContext?: { registerTool: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const tool = {
      name: 'create_trip_plan',
      title: 'Create a Dahlia trip plan',
      description: 'Build a sourced day-by-day itinerary and update the visible Dahlia workspace.',
      inputSchema: {
        type: 'object',
        properties: {
          destination: { type: 'string' }, origin: { type: 'string' }, startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' }, travelers: { type: 'integer', minimum: 1, maximum: 12 },
          budget: { type: 'number', minimum: 0 }, pace: { type: 'string', enum: ['slow', 'balanced', 'full'] },
          interests: { type: 'array', items: { type: 'string' }, maxItems: 8 }, prompt: { type: 'string' },
        },
        required: ['destination', 'startDate', 'endDate'], additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute: async (input: unknown) => {
        if (!input || typeof input !== 'object') throw new Error('Trip input must be an object.');
        const values = input as Partial<TripForm>;
        if (!values.destination || !values.startDate || !values.endDate) throw new Error('Destination, start date and end date are required.');
        const next = { ...formRef.current, ...values } as TripForm;
        setForm(next);
        setLoading(true);
        try {
          const result = await requestTrip(next);
          setPlan(result);
          localStorage.setItem('dahlia-last-trip', JSON.stringify({ form: next, plan: result, revisions: [] }));
          return { tripId: result.tripId, destination: result.destination.name, days: result.spec.days, validation: result.validation };
        } finally { setLoading(false); }
      },
    };
    try { void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => undefined); } catch { /* Unsupported preview context. */ }
    return () => lifecycle.abort();
  }, []);

  function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!readOnly) void buildTrip();
  }

  function toggleInterest(id: string) {
    if (readOnly) return;
    setForm((current) => ({ ...current, interests: current.interests.includes(id) ? current.interests.filter((item) => item !== id) : [...current.interests, id] }));
  }

  function revise(kind?: 'cheaper' | 'slower' | 'food') {
    if (!plan || readOnly) return;
    const instruction = kind || (revisionText.toLowerCase().includes('cheap') ? 'cheaper' : revisionText.toLowerCase().includes('slow') ? 'slower' : revisionText.toLowerCase().includes('food') ? 'food' : undefined);
    if (!instruction) {
      setError('Try “make it cheaper”, “slow it down”, or “add more food”.');
      return;
    }
    setRevisionText('');
    if (instruction === 'food') {
      const next = { ...form, interests: Array.from(new Set(['food', ...form.interests])), prompt: `${form.prompt}. Prioritize local food.` };
      setForm(next);
      void buildTrip(next, 'Added more local food and re-ranked the real places.');
      return;
    }
    const nextPlan = structuredClone(plan);
    if (instruction === 'slower') {
      nextPlan.itinerary = nextPlan.itinerary.map((day) => ({ ...day, items: day.items.slice(0, 2), route: { ...day.route, geometry: undefined } }));
      nextPlan.spec.pace = 'slow';
      nextPlan.validation.pace = 'pass';
      setForm((current) => ({ ...current, pace: 'slow' }));
      setRevisions((current) => ['Slowed the plan to two places per day.', ...current]);
    } else {
      nextPlan.budget.lines = nextPlan.budget.lines.map((line) => line.label === 'Activities' || line.label === 'Food allowance' ? { ...line, amount: Math.round(line.amount * 0.78) } : line);
      nextPlan.budget.total = nextPlan.budget.lines.reduce((sum, line) => sum + line.amount, 0);
      nextPlan.budget.status = nextPlan.budget.budget > 0 && nextPlan.budget.total > nextPlan.budget.budget ? 'over' : 'on-track';
      nextPlan.validation.budget = nextPlan.budget.status === 'over' ? 'fail' : 'pass';
      setRevisions((current) => [`Trimmed estimated food and activity spend by $${plan.budget.total - nextPlan.budget.total}.`, ...current]);
    }
    setPlan(nextPlan);
    localStorage.setItem('dahlia-last-trip', JSON.stringify({ form: formRef.current, plan: nextPlan, revisions }));
  }

  function saveTrip() {
    if (!plan) return;
    localStorage.setItem('dahlia-last-trip', JSON.stringify({ form, plan, revisions }));
    setSaved(true);
  }

  async function shareTrip() {
    const params = new URLSearchParams({
      share: '1', destination: form.destination, origin: form.origin, start: form.startDate, end: form.endDate,
      travelers: String(form.travelers), budget: String(form.budget), pace: form.pace,
      interests: form.interests.join(','), prompt: form.prompt,
    });
    const url = `${window.location.origin}${window.location.pathname}?${params}`;
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2200); }
    catch { window.prompt('Copy this read-only trip link:', url); }
  }

  function resetTrip() {
    const next = { ...DEFAULT_FORM, startDate: isoDate(7), endDate: isoDate(10) };
    setForm(next); setPlan(null); setRevisions([]); setError(''); setReadOnly(false); localStorage.removeItem('dahlia-last-trip');
    window.history.replaceState({}, '', window.location.pathname);
  }

  const featured = plan?.itinerary.flatMap((day) => day.items).find((item) => item.imageUrl);

  return (
    <main className="dahlia-studio min-h-screen bg-background text-foreground">
      <header className="mx-auto flex h-20 max-w-[1540px] items-center justify-between px-5 sm:px-8">
        <button onClick={resetTrip} className="flex items-center gap-2.5" aria-label="Start a new Dahlia trip">
          <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground"><Compass className="size-[18px]" /></span>
          <span className="font-heading text-xl font-semibold tracking-[-0.04em]">dahlia</span>
          <span className="brand-caption hidden sm:inline">A little further from ordinary.</span>
        </button>
        <div className="flex items-center gap-2">
          {readOnly && <span className="mr-2 hidden text-xs text-muted-foreground sm:inline">Read-only shared trip</span>}
          <Button variant="ghost" size="sm" className="rounded-full" onClick={resetTrip}><RotateCcw className="size-4" /> New trip</Button>
          {plan && !readOnly && <Button variant="outline" size="sm" className="rounded-full bg-white" onClick={saveTrip}><Check className="size-4" /> {saved ? 'Saved' : 'Save'}</Button>}
        </div>
      </header>

      <section className="mx-auto grid max-w-[1540px] gap-5 px-5 pb-8 sm:px-8 lg:grid-cols-[400px_minmax(0,1fr)] xl:grid-cols-[440px_minmax(0,1fr)]">
        <aside className="planner-panel relative overflow-hidden rounded-[2rem] bg-[#173c35] text-white lg:sticky lg:top-4 lg:h-[calc(100vh-32px)]">
          <div className="pointer-events-none absolute inset-0 opacity-35 [background:radial-gradient(circle_at_90%_0%,#8ce2ad,transparent_27%),radial-gradient(circle_at_5%_100%,#507d69,transparent_34%)]" />
          <div className="relative flex h-full flex-col overflow-y-auto p-5 sm:p-7">
            <div>
              <span className="planner-eyebrow"><Sparkles className="size-3.5" /> YOUR NEXT CHAPTER</span>
              <h1 className="mt-6 max-w-sm font-heading text-4xl font-medium leading-[0.96] tracking-[-0.055em] sm:text-5xl">Somewhere<br /><em>worth going.</em></h1>
              <p className="planner-intro">A few details. A little daydreaming. A trip that feels like you.</p>
            </div>

            <form onSubmit={submit} className="mt-7 space-y-4">
              <div className="rounded-[1.5rem] bg-[#f8f3e8] p-3 text-[#18372f] shadow-[0_22px_70px_rgba(0,0,0,.22)]">
                <label htmlFor="trip-idea" className="px-2 text-[11px] font-bold uppercase tracking-[0.13em] text-[#18372f]/55">Tell Dahlia the vibe</label>
                <textarea id="trip-idea" value={form.prompt} onChange={(event) => setForm({ ...form, prompt: event.target.value })} disabled={readOnly} rows={3} className="mt-1 w-full resize-none bg-transparent px-2 text-[15px] leading-6 outline-none disabled:opacity-70" />
              </div>

              <div className="rounded-[1.5rem] border border-white/12 bg-white/7 p-4 backdrop-blur-sm">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.13em] text-white/55">The essentials</p>
                  <span className="text-xs text-muted-foreground">01 / 02</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="field-shell" htmlFor="origin"><span>From</span><Input id="origin" value={form.origin} onChange={(event) => setForm({ ...form, origin: event.target.value })} disabled={readOnly} aria-label="Origin" /></label>
                  <label className="field-shell" htmlFor="destination"><span>Where to</span><Input id="destination" value={form.destination} onChange={(event) => setForm({ ...form, destination: event.target.value })} disabled={readOnly} required aria-label="Destination" /></label>
                  <label className="field-shell" htmlFor="start-date"><span>Start</span><Input id="start-date" type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} disabled={readOnly} required aria-label="Start date" /></label>
                  <label className="field-shell" htmlFor="end-date"><span>End</span><Input id="end-date" type="date" value={form.endDate} min={form.startDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} disabled={readOnly} required aria-label="End date" /></label>
                  <label className="field-shell" htmlFor="travelers"><span>Travelers</span><Input id="travelers" type="number" min={1} max={12} value={form.travelers} onChange={(event) => setForm({ ...form, travelers: Number(event.target.value) })} disabled={readOnly} aria-label="Travelers" /></label>
                  <label className="field-shell" htmlFor="budget"><span>Budget · USD</span><Input id="budget" type="number" min={0} step={50} value={form.budget} onChange={(event) => setForm({ ...form, budget: Number(event.target.value) })} disabled={readOnly} aria-label="Budget in US dollars" /></label>
                </div>
                <div className="mt-2 grid grid-cols-[1fr_0.9fr] gap-2">
                  <div className="field-shell">
                    <span>Pace</span>
                    <Select value={form.pace} onValueChange={(value) => setForm({ ...form, pace: value as TripForm['pace'] })} disabled={readOnly}>
                      <SelectTrigger className="h-7 w-full border-0 p-0 text-white shadow-none"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="slow">Slow</SelectItem><SelectItem value="balanced">Balanced</SelectItem><SelectItem value="full">Full days</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="field-shell"><span>Planner</span><strong className="mt-1 block text-xs font-medium text-white/90">Real data</strong></div>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-white/55">What are you after?</p>
                <div className="flex flex-wrap gap-1.5">
                  {INTERESTS.map(({ id, label, icon: Icon }) => {
                    const active = form.interests.includes(id);
                    return <button type="button" key={id} onClick={() => toggleInterest(id)} disabled={readOnly} aria-pressed={active} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${active ? 'border-[#a8e7b9]/35 bg-[#a8e7b9] text-[#173c35]' : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10'}`}><Icon className="size-3.5" /> {label}</button>;
                  })}
                </div>
              </div>

              {!readOnly && <Button type="submit" disabled={loading} className="h-12 w-full rounded-full bg-[#f36943] text-white hover:bg-[#dd5733]">
                {loading ? <><LoaderCircle className="size-4 animate-spin" /> Finding real places & routes</> : <><WandSparkles className="size-4" /> Build my trip <ArrowRight className="ml-auto size-4" /></>}
              </Button>}
              {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-300/20 bg-red-300/10 p-3 text-xs leading-5 text-red-100"><CircleAlert className="mt-0.5 size-4 shrink-0" />{error}<button type="button" onClick={() => setError('')} className="ml-auto"><X className="size-4" /></button></div>}
            </form>
          </div>
        </aside>

        <section className="trip-canvas min-w-0 overflow-hidden rounded-[2rem] border border-border bg-card">
          {!plan ? (
            <div className="flex min-h-[calc(100vh-112px)] flex-col">
              <div className="travel-cover">
                <div className="cover-kicker"><span>THE ART OF GETTING AWAY</span><Compass size={20} /></div>
                <div className="cover-art" aria-hidden="true"><div className="cover-sun" /><div className="cover-arch" /><div className="cover-horizon" /><span>38°43′ N · 9°08′ W</span></div>
                <div className="cover-copy"><p>Less planning. More possibility.</p><h2>Leave room<br />for <em>wonder.</em></h2><p className="cover-description">Slow mornings, unexpected corners, and days<br className="hidden sm:block" /> that fall beautifully into place.</p></div>
                <div className="cover-footer"><span><Map size={14} /> YOUR JOURNEY STARTS HERE</span><span>Made for your kind of travel ↗</span></div>
              </div>
              <div className="grid flex-1 gap-4 p-6 sm:grid-cols-3 sm:p-8">
                {[['01', 'Real places', 'Named, mapped places from OpenStreetMap and Wikipedia.'], ['02', 'Feasible days', 'Non-overlapping times, walking routes and a pace check.'], ['03', 'Facts with labels', 'Forecasts are live. Budgets stay clearly estimated.']].map(([number, title, copy]) => (
                  <div key={number} className="rounded-2xl border border-border p-5"><span className="font-mono text-xs text-[#d85d3e]">{number}</span><h3 className="mt-8 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p></div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="relative min-h-[300px] overflow-hidden bg-[#d8dfd5] p-7 sm:p-9">
                {plan.destination.imageUrl || featured?.imageUrl ? <Image src={plan.destination.imageUrl || featured?.imageUrl || ''} alt={`View of ${plan.destination.name}`} fill unoptimized className="object-cover" /> : null}
                <div className="absolute inset-0 bg-gradient-to-r from-[#142f2a]/95 via-[#142f2a]/65 to-transparent" />
                <div className="relative flex min-h-[230px] max-w-xl flex-col justify-between text-white">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/65">
                    <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/10 px-3 py-1.5"><StatusDot status="live" /> Sourced just now</span>
                    <span>{plan.meta.engine}</span>
                  </div>
                  <div>
                    <p className="text-sm text-white/65">{plan.spec.days} days from {plan.spec.origin || 'home'}</p>
                    <h2 className="mt-1 font-heading text-5xl font-medium tracking-[-0.055em] sm:text-6xl">{plan.destination.name}</h2>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      <span className="glass-chip"><CalendarDays className="size-3.5" /> {formatDate(form.startDate)} – {formatDate(form.endDate)}</span>
                      <span className="glass-chip"><Users className="size-3.5" /> {form.travelers} {form.travelers === 1 ? 'traveler' : 'travelers'}</span>
                      {plan.weather.available && plan.weather.daily?.[0] && <span className="glass-chip"><CloudSun className="size-3.5" /> {plan.weather.daily[0].high}°C · {plan.weather.daily[0].description}</span>}
                    </div>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="plan" className="p-5 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                  <TabsList variant="line" className="gap-4">
                    <TabsTrigger value="plan" className="px-1">Day by day</TabsTrigger>
                    <TabsTrigger value="map" className="px-1">Map</TabsTrigger>
                    <TabsTrigger value="budget" className="px-1">Budget</TabsTrigger>
                    <TabsTrigger value="sources" className="px-1">Sources</TabsTrigger>
                  </TabsList>
                  <div className="flex gap-2">
                    {!readOnly && <Button size="sm" variant="outline" className="rounded-full" onClick={shareTrip}><Link2 className="size-3.5" /> {copied ? 'Link copied' : 'Share'}</Button>}
                  </div>
                </div>

                <TabsContent value="plan" className="pt-6">
                  <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_260px]">
                    <div className="space-y-8">
                      {plan.itinerary.map((day) => (
                        <article key={day.day}>
                          <div className="mb-3 flex items-end justify-between gap-4">
                            <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#173c35] font-mono text-xs text-white">{String(day.day).padStart(2, '0')}</span><div><h3 className="font-heading text-lg font-semibold tracking-tight">{day.title}</h3><p className="text-xs text-muted-foreground">{formatDate(day.date)}</p></div></div>
                            <span className="hidden text-xs text-muted-foreground sm:inline">{day.route.distanceKm} km · {day.route.durationMinutes} min between stops</span>
                          </div>
                          <div className="space-y-2 border-l border-[#173c35]/15 pl-5 sm:ml-5 sm:pl-7">
                            {day.items.map((item) => (
                              <div key={item.id} className="group relative grid gap-3 rounded-2xl border border-border bg-white p-4 transition hover:border-[#173c35]/25 hover:shadow-[0_12px_36px_rgba(23,60,53,.07)] sm:grid-cols-[74px_minmax(0,1fr)_auto]">
                                <span className="absolute -left-[29px] top-6 size-2 rounded-full bg-[#f36943] ring-4 ring-[#f9f7f0] sm:-left-[33px]" />
                                <div className="font-mono text-xs text-[#365b4f]"><p>{item.startTime}</p><p className="mt-1 text-muted-foreground">{item.endTime}</p>{item.travelMinutesFromPrevious > 0 && <p className="mt-2 text-[10px] text-muted-foreground">+{item.travelMinutesFromPrevious} min</p>}</div>
                                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h4 className="font-semibold">{item.name}</h4><span className="rounded-full bg-[#f3efe5] px-2 py-0.5 text-[10px] text-[#365b4f]">{item.category.replaceAll('_', ' ')}</span></div><p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">{item.description}</p><p className="mt-2 text-xs text-[#365b4f]"><Sparkles className="mr-1 inline size-3" />{item.why}</p></div>
                                <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 self-start text-xs font-medium text-[#d85d3e]">{item.source}<ExternalLink className="size-3" /></a>
                              </div>
                            ))}
                          </div>
                        </article>
                      ))}
                    </div>

                    <aside className="space-y-3">
                      <div className="rounded-2xl bg-[#f7f2e7] p-5">
                        <h3 className="flex items-center gap-2 text-sm font-semibold"><Check className="size-4" /> Feasibility check</h3>
                        <ul className="mt-4 space-y-3 text-xs">
                          {[['Date math', plan.validation.dates], ['No overlaps', plan.validation.overlap], ['Your pace', plan.validation.pace], ['Opening hours', plan.validation.openingHours], ['Budget', plan.validation.budget]].map(([label, status]) => <li key={label} className="flex items-center justify-between"><span className="text-muted-foreground">{label}</span><span className="flex items-center gap-1.5 font-medium capitalize"><StatusDot status={status} />{status}</span></li>)}
                        </ul>
                        <p className="mt-4 border-t border-[#173c35]/10 pt-4 text-[11px] leading-4 text-muted-foreground">{plan.validation.note}</p>
                      </div>
                      {plan.weather.available ? <div className="rounded-2xl border border-border p-5"><h3 className="flex items-center gap-2 text-sm font-semibold"><CloudSun className="size-4" /> Live forecast</h3><div className="mt-4 space-y-2">{plan.weather.daily?.slice(0, 5).map((day) => <div key={day.date} className="flex items-center justify-between text-xs"><span className="text-muted-foreground">{formatDate(day.date)}</span><span>{day.high}° / {day.low}° · {day.precipitation}% rain</span></div>)}</div>{plan.weather.note && <p className="mt-3 rounded-lg bg-amber-50 p-2 text-[10px] leading-4 text-amber-900">{plan.weather.note}</p>}<p className="mt-4 text-[10px] text-muted-foreground">Open-Meteo · fetched {new Date(plan.meta.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div> : <div className="rounded-2xl border border-border p-5"><h3 className="text-sm font-semibold">Forecast timing</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{plan.weather.note}</p></div>}
                    </aside>
                  </div>

                  {!readOnly && <div className="sticky bottom-4 z-10 mx-auto mt-9 max-w-2xl rounded-[1.4rem] border border-[#173c35]/12 bg-[#173c35] p-2.5 text-white shadow-[0_20px_60px_rgba(23,60,53,.28)]">
                    <form onSubmit={(event) => { event.preventDefault(); revise(); }} className="flex items-center gap-2"><Sparkles className="ml-2 size-4 shrink-0 text-[#a8e7b9]" /><Input value={revisionText} onChange={(event) => setRevisionText(event.target.value)} placeholder="Ask Dahlia to change the plan…" className="h-10 border-0 bg-transparent text-sm text-white shadow-none placeholder:text-white/45 focus-visible:ring-0" /><Button type="submit" size="sm" className="rounded-full bg-white text-[#173c35] hover:bg-[#f5f0e5]">Apply</Button></form>
                    <div className="flex flex-wrap gap-1.5 px-2 pb-1 pt-2"><button onClick={() => revise('cheaper')} className="revision-chip"><DollarSign className="size-3" /> Make it cheaper</button><button onClick={() => revise('slower')} className="revision-chip"><Footprints className="size-3" /> Slow it down</button><button onClick={() => revise('food')} className="revision-chip"><Utensils className="size-3" /> More local food</button></div>
                  </div>}
                  {revisions.length > 0 && <details className="mt-4 rounded-2xl border border-border p-4"><summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium"><History className="size-4" /> Revision history <ChevronDown className="ml-auto size-4" /></summary><ul className="mt-3 space-y-2 text-xs text-muted-foreground">{revisions.map((revision, index) => <li key={`${revision}-${index}`} className="border-l border-[#f36943]/35 pl-3">{revision}</li>)}</ul></details>}
                </TabsContent>

                <TabsContent value="map" className="pt-6"><ItineraryMap itinerary={plan.itinerary} destination={plan.destination} /></TabsContent>

                <TabsContent value="budget" className="pt-6"><div className="mx-auto max-w-2xl"><div className="flex items-end justify-between"><div><p className="text-xs text-muted-foreground">Deterministic trip estimate</p><h3 className="mt-1 font-heading text-4xl font-medium tracking-tight">${plan.budget.total.toLocaleString()}</h3></div><span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${plan.budget.status === 'over' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}><StatusDot status={plan.budget.status} /> <span className="ml-1">{plan.budget.status === 'over' ? `$${plan.budget.total - plan.budget.budget} over budget` : 'Within your budget'}</span></span></div><div className="mt-7 divide-y divide-border rounded-2xl border border-border">{plan.budget.lines.map((line) => <div key={line.label} className="flex items-center justify-between p-4 text-sm"><div><p className="font-medium">{line.label}</p><p className="mt-1 text-[11px] text-muted-foreground">Estimated · not a live quote</p></div><strong>${line.amount.toLocaleString()}</strong></div>)}</div><p className="mt-4 text-xs leading-5 text-muted-foreground">Dahlia never styles an estimate like a live fare. Hotel, flight, and activity checkout stay out of this POC until commercial inventory partners are connected.</p></div></TabsContent>

                <TabsContent value="sources" className="pt-6"><div className="grid gap-3 sm:grid-cols-2">{plan.meta.providers.map((provider) => <div key={provider} className="rounded-2xl border border-border p-4"><div className="flex items-center gap-2 text-sm font-semibold"><StatusDot status={provider.includes('forecast') || provider.includes('OSRM') ? 'live' : 'recent'} />{provider}</div><p className="mt-2 text-xs text-muted-foreground">Checked {new Date(plan.meta.fetchedAt).toLocaleString()}</p></div>)}</div>{plan.meta.warnings.length > 0 && <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-xs leading-5 text-amber-900">{plan.meta.warnings.join(' ')}</div>}{plan.destination.sourceUrl && <a href={plan.destination.sourceUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[#d85d3e]">Destination background on Wikipedia <ExternalLink className="size-3.5" /></a>}</TabsContent>
              </Tabs>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
