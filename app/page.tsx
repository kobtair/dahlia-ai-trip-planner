'use client';

import { SyntheticEvent, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { HospitalityOptions } from '@/components/hospitality-options';
import type { HospitalityPlace } from '@/lib/hospitality';
import { encodeTrip, decodeTrip } from '@/lib/share-trip';
import { GrowingTextarea } from '@/components/growing-textarea';
import { ItineraryMap } from '@/components/itinerary-map';
import { CURRENCIES } from '@/lib/currencies';
import { PlanningProgress } from '@/components/planning-progress';
import { PlacePhoto } from '@/components/place-photo';
import {
  ArrowRight, CalendarDays, Check, ChevronDown, CircleAlert, CloudSun, Compass, DollarSign,
  ExternalLink, Footprints, History, Link2, LoaderCircle, Map, MapPin, RotateCcw, Sparkles,
  Users, Utensils, WandSparkles, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type TripForm = {
  travelersConfirmed?: boolean;
  durationDays?: number;
  destinationScope?: 'city' | 'country' | 'region' | 'unknown';
  prompt: string;
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: number;
  currency?: string;
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
  itinerary: Array<{ day: number; date: string; title: string; hospitality?: { restaurants: HospitalityPlace[]; hotels: HospitalityPlace[]; note: string }; logistics?: Array<{ time: string; title: string; detail: string }>; items: PlaceItem[]; route: { distanceKm: number; durationMinutes: number; source: string; status: string; geometry?: { coordinates: [number, number][] } } }>;
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

const DEFAULT_FORM: TripForm = {
  prompt: '',
  origin: '',
  destination: '',
  startDate: '',
  endDate: '',
  travelers: 0,
  budget: 0,
  pace: 'balanced',
  interests: [],
};

async function requestTrip(form: TripForm, signal?: AbortSignal) {
  const response = await fetch('/api/plan', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(form), signal,
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
  const [interpreting, setInterpreting] = useState(false);
  const [assistantMessage, setAssistantMessage] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answer, setAnswer] = useState('');
  const [activeDay, setActiveDay] = useState(1);
  const [chatOpen, setChatOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  async function suggestLocation() {
    if (!navigator.geolocation) { setError('Location is unavailable. Please type your starting city.'); return; }
    setLocating(true);
    setError('');
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }));
      const response = await fetch('/api/location', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ latitude: Number(position.coords.latitude.toFixed(2)), longitude: Number(position.coords.longitude.toFixed(2)) }) });
      const data = await response.json() as { city?: string; error?: string };
      if (!response.ok || !data.city) throw new Error(data.error);
      setAnswer((text) => `${text}${text ? '\n' : ''}I am starting from ${data.city}.`);
    } catch {
      try {
        const response = await fetch('/api/location', { method: 'POST' });
        const data = await response.json() as { city?: string };
        if (!response.ok || !data.city) throw new Error();
        setAnswer((text) => `${text}${text ? '\n' : ''}I am starting from ${data.city} (approximate IP location).`);
      } catch { setError('Location was denied or unavailable. Please type your starting city.'); }
    }
    finally { setLocating(false); }
  }
  const [messages, setMessages] = useState<Array<{role: string; text: string}>>([]);
  const activeRequest = useRef<AbortController | null>(null);
  const historyEnd = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const panel = historyEnd.current?.parentElement;
    if (panel) panel.scrollTop = panel.scrollHeight;
  }, [messages, questions, chatOpen]);
  const [buildFailed, setBuildFailed] = useState(false);
  const requestBusy = useRef(false);

  async function interpret(message = form.prompt) {
    if (requestBusy.current || interpreting || loading || readOnly) return;
    requestBusy.current = true;
    const controller = new AbortController();
    activeRequest.current = controller;
    setInterpreting(true);
    setError('');
    try {
      const response = await fetch('/api/brief', {
        method: 'POST', headers: { 'content-type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ message, current: form, previousQuestions: questions }),
      });
      const data = await response.json() as { error?: string; updates: Partial<TripForm>; message: string; questions: string[]; ready: boolean };
      if (!response.ok) throw new Error(data.error || 'Could not interpret your trip.');
      const nextForm = { ...form, ...data.updates, prompt: message === form.prompt ? form.prompt : form.prompt + '\n' + message };
      setForm(nextForm);
      setMessages((items) => [...items, {role: 'You', text: message}, {role: 'Dahlia', text: data.message}].slice(-20));
      setAssistantMessage(data.message);
      setChatOpen(data.questions.length > 0);
      setQuestions(data.questions);
      setAnswer('');
      if (data.ready) {
        setInterpreting(false);
        await buildTrip(nextForm);
      }
    } catch (caught) { if (!controller.signal.aborted) setError(caught instanceof Error && !/fetch|network/i.test(caught.message) ? caught.message : 'Could not reach the planner. Your message is saved here—please try sending it again.'); }
    finally { setInterpreting(false); requestBusy.current = false; }
  }

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  async function buildTrip(nextForm = form, revision?: string) {
    const controller = new AbortController();
    activeRequest.current = controller;
    setLoading(true);
    setBuildFailed(false);
    setError('');
    try {
      const nextPlan = await requestTrip(nextForm, controller.signal);
      if (controller.signal.aborted) return;
      setActiveDay(1);
      setChatOpen(false);
      setPlan(nextPlan);
      setSaved(false);
      if (revision) setRevisions((current) => [revision, ...current].slice(0, 8));
      localStorage.setItem('dahlia-last-trip', JSON.stringify({ form: nextForm, plan: nextPlan, revisions: revision ? [revision, ...revisions] : revisions }));
    } catch (caught) {
      if (controller.signal.aborted) return;
      setBuildFailed(true);
      setError(caught instanceof Error ? caught.message : 'Could not build this trip.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const snapshot = new URLSearchParams(window.location.hash.slice(1)).get('trip');
      if (snapshot) {
        setReadOnly(true);
        void decodeTrip(snapshot).then((shared) => {
          if (shared.version !== 1 || !shared.plan?.spec || !Array.isArray(shared.plan.itinerary) || shared.plan.itinerary.length < 1 || shared.plan.itinerary.length > 7) throw new Error('Invalid trip');
          setPlan(shared.plan); setForm(shared.plan.spec); setActiveDay(shared.plan.itinerary[0].day);
        }).catch(() => setError('This shared trip link is invalid or incomplete. Ask the sender for a fresh link.'));
        return;
      }
      const params = new URLSearchParams(window.location.search);
      if (params.get('share') === '1') {
        const shared: TripForm = {
          ...DEFAULT_FORM,
          destination: params.get('destination') || DEFAULT_FORM.destination,
          origin: params.get('origin') || '',
          startDate: params.get('start') || DEFAULT_FORM.startDate,
          endDate: params.get('end') || DEFAULT_FORM.endDate,
          travelers: Number(params.get('travelers') || 1),
          budget: Number(params.get('budget') || 0), currency: params.get('currency') || 'USD',
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
          budget: { type: 'number', minimum: 0 }, currency: { type: 'string', enum: CURRENCIES }, pace: { type: 'string', enum: ['slow', 'balanced', 'full'] },
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
    if (!readOnly && answer.trim()) void interpret(answer);
  }

  function toggleInterest(id: string) {
    if (readOnly) return;
    setForm((current) => ({ ...current, interests: current.interests.includes(id) ? current.interests.filter((item) => item !== id) : [...current.interests, id] }));
  }

  function revise(kind?: 'cheaper' | 'slower' | 'food') {
    if (!plan || readOnly) return;
    const message = kind === 'slower' ? 'Make this trip slower paced.' : kind === 'food' ? 'Prioritize local food.' : kind === 'cheaper' ? 'Prioritize affordable places. Do not invent lower prices.' : revisionText;
    if (!message.trim()) return;
    void interpret(message);
    setRevisionText('');
  }

  function saveTrip() {
    if (!plan) return;
    localStorage.setItem('dahlia-last-trip', JSON.stringify({ form, plan, revisions }));
    setSaved(true);
  }

  async function shareTrip() {
    if (!plan) return;
    try {
      const payload = structuredClone(plan);
      // Route geometry is large; maps retain sourced markers and estimated connections.
      payload.itinerary.forEach((day) => { delete day.route.geometry; });
      const url = window.location.origin + window.location.pathname + '#trip=' + await encodeTrip({ version: 1, plan: payload });
      try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2200); }
      catch { window.prompt('Copy this trip link:', url); }
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not create a share link.'); }
  }

  function resetTrip() {
    if (loading || interpreting) return;
    setAssistantMessage(''); setQuestions([]); setAnswer(''); setBuildFailed(false); setMessages([]); setChatOpen(false); setActiveDay(1);
    window.history.replaceState(null, '', window.location.pathname);
    const next = { ...DEFAULT_FORM };
    setForm(next); setPlan(null); setRevisions([]); setError(''); setReadOnly(false); localStorage.removeItem('dahlia-last-trip');
    window.history.replaceState({}, '', window.location.pathname);
  }

  const featured = plan?.itinerary.flatMap((day) => day.items).find((item) => item.imageUrl);

  return (
    <main className={`dahlia-studio workspace ${plan ? 'has-plan' : 'no-plan'} ${chatOpen ? 'chat-open' : ''} min-h-screen bg-background text-foreground`}>
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
        <aside className="planner-panel chat-panel" aria-label="Chat with Dahlia">
          <div className="chat-heading"><div><span className="planner-eyebrow">YOUR TRAVEL COMPANION</span><h1 className="font-heading">Where shall we go?</h1></div><button className="chat-toggle" aria-expanded={chatOpen} aria-controls="conversation" onClick={() => setChatOpen(!chatOpen)}>{chatOpen ? 'Close chat' : 'Conversation'}</button></div>
          <div id="conversation" className="chat-history" role="log" aria-live="polite">
            {!messages.length && <p>Tell me where you’re dreaming of. I’ll work out the details with you.</p>}
            {messages.map((message, index) => <div key={index} className={message.role === 'You' ? 'chat-message from-user' : 'chat-message'}><strong>{message.role}</strong><p>{message.text}</p></div>)}
            {questions.length > 0 && <div className="chat-message"><strong>A few details</strong><ul>{questions.map((question) => <li key={question}>{question}</li>)}</ul></div>}
            <div ref={historyEnd} />
          </div>
          <form onSubmit={submit} className="chat-composer">
            {!form.origin && !readOnly && <div className="mb-2 text-xs"><button type="button" disabled={locating || loading || interpreting} onClick={() => void suggestLocation()} className="min-h-11 underline">{locating ? 'Finding your city…' : 'Use my location for starting city'}</button><p className="text-muted-foreground">With permission, approximate coordinates go to OpenStreetMap to suggest a city. Review it before sending, or type your departure city.</p></div>}
            {(interpreting || loading) && <div role="status" className="chat-status"><LoaderCircle size={16} className="animate-spin" /><span>{interpreting ? 'Reading your request…' : plan ? 'Updating your trip. Your current plan is still available.' : 'Building your trip…'}</span><button type="button" onClick={() => { activeRequest.current?.abort(); setError('Stopped waiting. You can send another message. Server work may still finish.'); }}>Cancel</button></div>}
            {error && <p role="alert" className="chat-error">{error}</p>}
            {buildFailed && <Button type="button" disabled={loading || interpreting} onClick={() => void buildTrip(form)} variant="outline">Retry building</Button>}
            {!readOnly && <><label htmlFor="chat-message" className="ai-answer-label">{plan ? 'Ask Dahlia to change your trip' : 'Tell Dahlia about your trip'}</label><GrowingTextarea id="chat-message" value={answer} onChange={(event) => setAnswer(event.target.value)} rows={2} className="ai-answer-input" placeholder={plan ? 'More local food, a slower day…' : 'Five days in Baku, just me, budget in PKR…'} disabled={loading || interpreting} /><Button type="submit" disabled={!answer.trim() || loading || interpreting} className="ai-update-button">{interpreting || loading ? 'Working…' : 'Send'}<ArrowRight size={16} /></Button></>}
            <p className="exchange-attribution">Estimated costs · <a href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer">ExchangeRate-API rates</a></p>
          </form>
        </aside>

        <section className="trip-canvas min-w-0 overflow-hidden rounded-[2rem] border border-border bg-card">
          {!plan && loading ? <PlanningProgress destination={form.destination} /> : !plan ? (
            <div className="workspace-welcome"><Compass size={32} /><h2 className="font-heading">A trip shaped around you.</h2><p>Describe your plans in chat. Your itinerary, map and budget will appear here.</p><p className="text-xs">Real places. Clear estimates. Room to explore.</p></div>
          ) : (
            <div>
              <div className="trip-summary relative overflow-hidden bg-[#d8dfd5] p-5">
                {plan.destination.imageUrl || featured?.imageUrl ? <Image src={plan.destination.imageUrl || featured?.imageUrl || ''} alt={`View of ${plan.destination.name}`} fill unoptimized className="object-cover" /> : null}
                <div className="absolute inset-0 bg-gradient-to-r from-[#142f2a]/95 via-[#142f2a]/65 to-transparent" />
                <div className="relative flex max-w-xl flex-col gap-3 text-white">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/65">
                    <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/10 px-3 py-1.5"><StatusDot status="live" /> Sourced just now</span>
                    <span>{plan.meta.engine}</span>
                  </div>
                  <div>
                    <p className="text-sm text-white/65">{plan.spec.days} days from {plan.spec.origin || 'home'}</p>
                    <h2 className="mt-1 font-heading text-3xl font-medium tracking-[-0.055em] sm:text-4xl">{plan.destination.name}</h2>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      <span className="glass-chip"><CalendarDays className="size-3.5" /> {formatDate(plan.spec.startDate)} – {formatDate(plan.spec.endDate)}</span>
                      <span className="glass-chip"><Users className="size-3.5" /> {plan.spec.travelers} {plan.spec.travelers === 1 ? 'traveler' : 'travelers'}</span>
                      {plan.weather.available && plan.weather.daily?.[0] && <span className="glass-chip"><CloudSun className="size-3.5" /> {plan.weather.daily[0].high}°C · {plan.weather.daily[0].description}</span>}
                    </div>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="plan" className="p-5 sm:p-8">
                <div className="trip-navigation flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
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
                  <nav className="day-navigation" aria-label="Itinerary day">{plan.itinerary.map((day) => <button key={day.day} aria-pressed={day.day === activeDay} onClick={() => setActiveDay(day.day)}>Day {day.day}</button>)}</nav>
                  <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_260px]">
                    <div className="space-y-8">
                      {plan.itinerary.filter((day) => day.day === activeDay).map((day) => (
                        <article key={day.day}>
                          {day.hospitality && <HospitalityOptions options={day.hospitality} />}
                          {day.logistics && <details className="mb-4 rounded-xl border p-4" open><summary className="cursor-pointer text-sm font-semibold">Meals, stays & travel · {day.date}</summary><div className="mt-3 space-y-3">{day.logistics.map((block) => <div key={block.title} className="text-sm"><span className="text-xs text-muted-foreground">{block.time}</span><p className="font-medium">{block.title}</p><p className="text-xs leading-5 text-muted-foreground">{block.detail}</p></div>)}</div></details>}
                          <div className="mb-3 flex items-end justify-between gap-4">
                            <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#173c35] font-mono text-xs text-white">{String(day.day).padStart(2, '0')}</span><div><h3 className="font-heading text-lg font-semibold tracking-tight">{day.title}</h3><p className="text-xs text-muted-foreground">{formatDate(day.date)}</p></div></div>
                            <span className="hidden text-xs text-muted-foreground sm:inline">{day.route.distanceKm} km · {day.route.durationMinutes} min between stops</span>
                          </div>
                          <div className="space-y-2 border-l border-[#173c35]/15 pl-5 sm:ml-5 sm:pl-7">
                            {day.items.map((item) => (
                              <div key={item.id} className="group relative grid gap-3 rounded-2xl border border-border bg-white p-4 transition hover:border-[#173c35]/25 hover:shadow-[0_12px_36px_rgba(23,60,53,.07)] sm:grid-cols-[74px_minmax(0,1fr)_auto]">
                                <span className="absolute -left-[29px] top-6 size-2 rounded-full bg-[#f36943] ring-4 ring-[#f9f7f0] sm:-left-[33px]" />
                                <div className="font-mono text-xs text-[#365b4f]"><p>{item.startTime}</p><p className="mt-1 text-muted-foreground">{item.endTime}</p>{item.travelMinutesFromPrevious > 0 && <p className="mt-2 text-[10px] text-muted-foreground">+{item.travelMinutesFromPrevious} min</p>}</div>
<div className="min-w-0"><PlacePhoto key={item.imageUrl || item.id} src={item.imageUrl} name={item.name} /><div className="flex flex-wrap items-center gap-2"><h4 className="font-semibold">{item.name}</h4><span className="rounded-full bg-[#f3efe5] px-2 py-0.5 text-[10px] text-[#365b4f]">{item.category.replaceAll('_', ' ')}</span></div><p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">{item.description}</p><p className="mt-2 text-xs text-[#365b4f]"><Sparkles className="mr-1 inline size-3" />{item.why}</p></div>
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

                  {revisions.length > 0 && <details className="mt-4 rounded-2xl border border-border p-4"><summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium"><History className="size-4" /> Revision history <ChevronDown className="ml-auto size-4" /></summary><ul className="mt-3 space-y-2 text-xs text-muted-foreground">{revisions.map((revision, index) => <li key={`${revision}-${index}`} className="border-l border-[#f36943]/35 pl-3">{revision}</li>)}</ul></details>}
                </TabsContent>

                <TabsContent value="map" className="pt-6"><ItineraryMap itinerary={plan.itinerary} destination={plan.destination} /></TabsContent>

                <TabsContent value="budget" className="pt-6"><div className="mx-auto max-w-2xl"><div className="flex items-end justify-between"><div><p className="text-xs text-muted-foreground">Deterministic trip estimate</p><h3 className="mt-1 font-heading text-4xl font-medium tracking-tight">{plan.budget.currency} {plan.budget.total.toLocaleString()}</h3></div><span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${plan.budget.status === 'over' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}><StatusDot status={plan.budget.status} /> <span className="ml-1">{plan.budget.status === 'over' ? `${plan.budget.currency} ${plan.budget.total - plan.budget.budget} over budget` : 'Within your budget'}</span></span></div><div className="mt-7 divide-y divide-border rounded-2xl border border-border">{plan.budget.lines.map((line) => <div key={line.label} className="flex items-center justify-between p-4 text-sm"><div><p className="font-medium">{line.label}</p><p className="mt-1 text-[11px] text-muted-foreground">Estimated · not a live quote</p></div><strong>{plan.budget.currency} {line.amount.toLocaleString()}</strong></div>)}</div><p className="mt-4 text-xs leading-5 text-muted-foreground">Dahlia never styles an estimate like a live fare. Hotel, flight, and activity checkout stay out of this POC until commercial inventory partners are connected.</p></div></TabsContent>

                <TabsContent value="sources" className="pt-6"><div className="grid gap-3 sm:grid-cols-2">{plan.meta.providers.map((provider) => <div key={provider} className="rounded-2xl border border-border p-4"><div className="flex items-center gap-2 text-sm font-semibold"><StatusDot status={provider.includes('forecast') || provider.includes('OSRM') ? 'live' : 'recent'} />{provider}</div><p className="mt-2 text-xs text-muted-foreground">Checked {new Date(plan.meta.fetchedAt).toLocaleString()}</p></div>)}</div>{plan.meta.warnings.length > 0 && <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-xs leading-5 text-amber-900">{plan.meta.warnings.join(' ')}</div>}{plan.destination.sourceUrl && <a href={plan.destination.sourceUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[#d85d3e]">Destination background on Wikipedia <ExternalLink className="size-3.5" /></a>}</TabsContent>
              </Tabs>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
