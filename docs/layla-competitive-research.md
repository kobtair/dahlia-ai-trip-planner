# Layla competitive research and Dahlia MVP recommendation

Research snapshot: 4 September 2026. Sources are first-party product pages, policies, developer documentation, and developer-supplied app listings. No third-party product reviews were used as evidence.

## Executive recommendation

Layla's strongest product idea is not the chatbot alone. It is a **durable trip object** that a conversation creates and keeps editing: one place for the brief, route, day-by-day plan, map, hotels, transport, activities, prices, and sharing.

Dahlia should reproduce that core loop, but make **trust and feasibility** its differentiation:

1. Capture the trip's hard constraints before generating.
2. Build a structured, editable itinerary from real place, route, and weather sources.
3. Show the source and retrieval time for every live or changeable fact.
4. Validate date math, opening hours, travel time, schedule overlap, and the budget after every AI edit.
5. Clearly separate `live`, `recent`, and `estimated` values; never let the language model invent inventory or prices.

The recommended POC deliberately stops before checkout. Live flight, hotel, and activity prices depend on commercial partner approval; a working planner with sourced places, routes, weather, and honest outbound booking links is both feasible and useful before those partnerships exist.

## Product identity

The product the user means is **Layla / Layla.ai**, the AI travel agent and trip planner at [layla.ai](https://layla.ai/), operated by Layla AI GmbH in Berlin according to its [privacy policy](https://layla.ai/privacypolicy). It is distinct from the unrelated offline assistant at `layla-network.ai`.

Layla is available on the web and as the current [Google Play app](https://play.google.com/store/apps/details?id=ai.layla.android.app) and [iOS app](https://apps.apple.com/us/app/layla-ai-trip-planner/id6758730467). Its itinerary lineage includes Roam Around: Layla's own [Roam Around page](https://layla.ai/roamaround) says Roam Around is now part of Layla and that its day-by-day itinerary capability was extended with flights, hotels, and activity booking.

The current positioning has shifted from a pure AI planner to **AI planning plus a human travel expert**. The AI drafts and revises; an expert can refine, book, manage changes, and provide trip support. This hybrid handoff is now prominent on the [home page](https://layla.ai/) and in the [FAQ](https://layla.ai/faq).

## What Layla currently does

| Capability | Current behavior | Evidence |
| --- | --- | --- |
| Conversational intake | Accepts a free-text trip request and extracts destination, origin, travelers, dates, budget, interests, and travel style. It asks follow-up questions for missing details. | [Live planner](https://layla.ai/), [FAQ](https://layla.ai/faq) |
| Personalized trip generation | Produces a structured, day-by-day itinerary using dates, budget, interests, and party type. | [About Layla](https://layla.ai/about), [FAQ](https://layla.ai/faq) |
| Conversational revision | Lets the user swap activities, add days, or change the budget; Layla says it recalculates the schedule, route, and costs. | [About Layla](https://layla.ai/about) |
| Destination inspiration | Offers browsable destination/occasion collections and personalized creator-video discovery. Videos can become itinerary items. | [Home page](https://layla.ai/), [About Layla](https://layla.ai/about), [Google Play listing](https://play.google.com/store/apps/details?id=ai.layla.android.app) |
| Real travel inventory | Claims real-time comparison for flights, hotels, trains, rentals, transfers, and activities, with current prices and availability. | [About Layla](https://layla.ai/about), [FAQ](https://layla.ai/faq) |
| Hotels | Natural-language hotel search by budget, amenities, rating, and qualitative requests such as a sea view or rooftop pool. | [About Layla](https://layla.ai/about) |
| Flights | Live search plus a claimed flight-price prediction engine. | [About Layla](https://layla.ai/about) |
| Activities | Search/browse bookable museum tickets, tours, food experiences, and outdoor activities with current prices. | [About Layla](https://layla.ai/about) |
| Maps and routing | Interactive map, multi-destination route map, road-trip routing, scenic stops, drive times, and overnight suggestions. | [About Layla](https://layla.ai/about), [FAQ](https://layla.ai/faq) |
| Multi-city and road trips | Optimizes destination order and connects legs with flights, trains, or cars. | [FAQ](https://layla.ai/faq) |
| Organization | Combines arrivals, transfers, stays, daily activities, and departures into one itinerary/timeline. | [About Layla](https://layla.ai/about) and hands-on product observation below |
| Collaboration and export | Offers share links and PDF export. The privacy policy says a shared link exposes the itinerary but not the account, chat, or payment details. | [Privacy policy](https://layla.ai/privacypolicy), [About Layla](https://layla.ai/about) |
| Multimodal input | The current iOS app accepts PDF, JPEG, and PNG inputs to enrich a trip. | [iOS version history](https://apps.apple.com/us/app/layla-ai-trip-planner/id6758730467) |
| Localization | Conversational planning in 16 languages, with currency and temperature controls visible in the web product. | [About Layla](https://layla.ai/about) and live product observation |
| Human completion layer | A travel expert can review, improve, book, manage changes, and support the trip. | [Home page](https://layla.ai/), [FAQ](https://layla.ai/faq) |
| Monetization | Free planning tools with premium usage. The web FAQ says $49/year; the US App Store lists $9.99/month and $49.99/year. | [FAQ](https://layla.ai/faq), [App Store](https://apps.apple.com/us/app/layla-ai-trip-planner/id6758730467) |

### Observed web flow

A hands-on check of the live web product on 4 September 2026 produced this flow:

1. The home page starts with a single natural-language prompt.
2. The planner converts the prompt into a five-part checklist: **where to, where from, who's coming, when, and what you're after**.
3. A conversational confirmation summarizes the route, duration, party, and intended vibe; quick replies make common corrections easy.
4. Generation shows named progress steps rather than an indefinite spinner.
5. The resulting trip artifact contains a route summary, trip dates, city/experience/hotel/transport counts, a map, an arrival-transfer-stay-itinerary-departure timeline, day summaries, hotel details and reviews, weather attribution, and an updating total.
6. The chat remains available beside the artifact, with contextual actions such as “Book hotels,” “Show restaurants,” and “Plan itinerary.”
7. Sharing, PDF download, and an expert-review handoff are part of the same artifact.
8. An anonymous visitor can generate a high-level trip, but opening deeper trip details triggers account creation.

Representative generic test artifacts: [Rome trip session](https://layla.ai/en/chat/01M1P32Y1WR98RC10AVVR52JAZ/trip/01M1P33EY1E4EG8HQRTJW1P2HW) and [Lisbon trip session](https://layla.ai/en/chat/01M1P334728H63WS6B15N4J5JP/trip/01M1P35D0DSGXQ8HXJXV1PDHR9). These session URLs may be ephemeral.

## Differentiators worth learning from

### 1. Conversation and artifact are equal citizens

The conversation is a control surface, not the final output. A usable itinerary persists beside it and has its own map, totals, cards, and editing controls. This is much more useful than returning a wall of AI text.

### 2. Progressive commitment

Users can see a real trip before signing up. Layla's current App Store release notes describe onboarding as a “test drive” that plans a real trip before commitment, and the live web product follows this pattern. This makes the product's value legible early. See the [iOS version history](https://apps.apple.com/us/app/layla-ai-trip-planner/id6758730467).

### 3. Inspiration converts directly into planning

Destination galleries and creator media are not a separate editorial dead end; they are inputs into the itinerary. The [About page](https://layla.ai/about) describes travel videos that can be added directly to a trip.

### 4. Breadth plus a human trust layer

Layla covers discovery, planning, live inventory, and organization, then explicitly puts a human behind the expensive or irreversible booking step. That is a stronger trust story than calling a chatbot an autonomous agent.

### 5. The five-item checklist makes fuzzy chat visible

The checklist turns the AI's understanding into an inspectable state. A user can see what is known and what is missing before generation. Dahlia should copy the pattern and strengthen it with hard validation.

## Data claims, integrations, and trust limits

### Providers named by Layla

- The official site names [Booking.com](https://www.booking.com/), [Skyscanner](https://www.skyscanner.com/), and [GetYourGuide](https://www.getyourguide.com/) as travel partners; Layla's [terms](https://layla.ai/terms) also name Skyscanner and Booking.com as third-party integrations.
- The live itinerary credits [Open-Meteo](https://open-meteo.com/) for weather. Layla's privacy policy names Mapbox and Google Maps for maps/content, and CheckMyBus as an example transport-search partner. See [Who Receives Your Data](https://layla.ai/privacypolicy).
- Layla's privacy policy says its AI layer uses OpenAI, Google/Gemini, Anthropic, and Pinecone. Infrastructure and supporting services include Firebase/Google Cloud, Vercel, Stripe, Browserless, Sentry, Intercom, Braze, Aircall, and Calendly. See [AI Processing and service providers](https://layla.ai/privacypolicy).
- Layla collects trip constraints and conversations, can derive a travel-preference profile, and derives approximate city/country from the user's IP. The policy says personal data is not used to train Layla's models or its AI providers' models. See [Data We Process](https://layla.ai/privacypolicy).

### Important qualification

“Live data” does not make an AI-composed plan automatically correct. Layla's own privacy policy warns that generated recommendations and travel details may be incomplete, outdated, or inaccurate and tells users to verify price, availability, opening hours, and visa/entry/health requirements. See [Accuracy](https://layla.ai/privacypolicy).

The live test exposed the practical consequence: the plan could infer a missing origin from approximate location, choose dates that were not explicitly supplied, change totals while inventory resolved, and produce inconsistent date/duration or budget relationships. These are not arguments against AI planning; they are a case for treating the AI as a planner over validated data, not as the source of truth.

## Recommended Dahlia MVP

### Product promise

> Describe a trip once. Dahlia builds a realistic, editable day-by-day plan from sourced places, travel times, and weather, checks that it fits your dates and budget, and shows exactly what is live versus estimated.

### P0: the functioning MVP

#### 1. Natural-language trip brief with visible structure

The initial prompt should populate an editable `TripSpec`:

- origin and one destination;
- start and end dates;
- number of adults/children;
- total or per-person budget and currency;
- interests and avoidances;
- preferred pace;
- mobility, dietary, or other constraints only when volunteered.

Show a checklist immediately and ask only for missing **hard** constraints. Do not silently invent dates, party size, or budget.

#### 2. One real, persistent trip artifact

Use a responsive two-pane workspace on desktop and tabbed view on mobile:

- left: chat and revision history;
- main: overview, day-by-day itinerary, budget, and map;
- compact trip header: dates, travelers, destination, current total, and validation state.

The artifact should survive reloads through local or database persistence. Every chat edit should create a new itinerary revision, not overwrite the only known-good plan.

#### 3. Sourced POIs, restaurants, and map data

Use Google Places for text/nearby search, stable place IDs, details, location, operating hours, ratings/reviews, and photos. The official [Places API overview](https://developers.google.com/maps/documentation/places/web-service/overview) documents these capabilities. Keep the provider place ID and required attribution with every item.

Generate 2–4 candidate activities per time block, then let the model rank the candidates for the user's interests. The model may explain or rank real candidates; it may not create venue names, coordinates, ratings, hours, or prices.

#### 4. Feasible routes and schedules

Use a routing API for distance and travel time between itinerary items. Google's [Routes API](https://developers.google.com/maps/documentation/routes/reference/rest) supports primary/alternate routes and route matrices; `computeRoutes` returns distance, duration, legs, and polylines.

Before presenting a day, validate:

- the venue is open during the proposed visit;
- travel time plus a buffer fits between items;
- items do not overlap;
- arrival/departure constraints are respected;
- the day's walking/travel load matches the selected pace.

#### 5. Real weather with an honest horizon

Use Open-Meteo for destinations within its forecast window. Its official [forecast documentation](https://open-meteo.com/en/docs) provides hourly forecasts for 7 days and up to 16 days with `forecast_days=16`. For dates outside that horizon, show “forecast not available yet” or separately labeled seasonal/climate guidance—not a fabricated daily forecast.

#### 6. Transparent budget ledger

Track separate categories for stays, transport, activities, food allowance, and contingency. Every line must have:

- amount and currency;
- `live`, `recent`, `user-entered`, or `estimated` status;
- provider and fetched-at time when sourced;
- included/not-included taxes and fees when known;
- booking/deep link when available.

Recalculate after every edit and visibly fail the budget constraint when the total is over the cap. “Estimated” must never be styled like a live quote.

#### 7. Useful conversational edits

Support a narrow, reliable set first:

- “make this cheaper”;
- “slow down day 2”;
- “swap this for food/history/nature”;
- “avoid long walks”;
- “move this to another day”;
- “show two alternatives.”

Each edit should update the artifact, rerun validators, and provide a short change summary.

#### 8. Shareable read-only trip

Create a read-only share link with an explicit privacy warning and no account/chat metadata. PDF export can follow once the core artifact is stable.

### Real inventory strategy

Real-time commercial inventory is valuable but should not be allowed to turn the POC into a fake booking site.

| Domain | MVP approach | Later production path |
| --- | --- | --- |
| Places/restaurants | Google Places details, hours, ratings, photos, and coordinates | Add a second place source and venue-direct confirmation for critical facts |
| Routes | Google Routes route matrix and polylines | Multi-modal/public-transit provider where coverage requires it |
| Weather | Open-Meteo with forecast-horizon labeling | Weather alerts and re-planning near departure |
| Hotels | If Booking.com credentials already exist, use availability search; otherwise show real properties without a live price and offer an outbound search link | Booking.com's [Demand API](https://developers.booking.com/demand/docs/accommodations/about-accommodation) returns matching availability and best available prices; search/look/redirect is the simplest approved flow |
| Flights | Do not synthesize flight numbers or fares. Show an outbound search until partner credentials exist | Skyscanner's [Flights Live Prices API](https://developers.skyscanner.net/docs/category/flights-live-prices-api) supports live search, multi-city queries, and price refresh |
| Tours/activities | Use real POIs and official venue URLs; label price as unavailable unless sourced | GetYourGuide's [Partner API](https://code.getyourguide.com/partner-api-spec/) exposes tours/activities, but its current [access requirements](https://partner.getyourguide.support/hc/en-us/articles/13981133907613-API-integration-and-requirements) make it unrealistic for a brand-new MVP without an existing audience |

Booking.com's official documentation says its accommodation search can return availability, best price, policies, photos/details, and deep links. It also warns that its API inventory does not exactly mirror the consumer site. See [search behavior and coverage](https://developers.booking.com/demand/docs/accommodations/search-for-available-properties). That caveat is a good model for Dahlia's data honesty.

### Minimal data contract

```ts
type FactStatus = "live" | "recent" | "user-entered" | "estimated";

type SourceRef = {
  provider: string;
  providerId?: string;
  url?: string;
  fetchedAt: string;
  status: FactStatus;
};

type TripSpec = {
  origin: string | null;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  adults: number | null;
  children: number;
  budgetAmount: number | null;
  currency: string;
  interests: string[];
  avoidances: string[];
  pace: "slow" | "balanced" | "full";
};

type ItineraryItem = {
  id: string;
  placeId: string;
  day: number;
  startAt: string;
  endAt: string;
  travelMinutesFromPrevious: number;
  sources: SourceRef[];
};

type PriceQuote = {
  provider: string;
  amount: number;
  currency: string;
  fetchedAt: string;
  expiresAt?: string;
  bookingUrl?: string;
  status: FactStatus;
};
```

The language model should produce and edit IDs, intent, explanations, and ordering. Provider adapters should own facts and quotes. A deterministic validator should own feasibility and totals.

## Additions that can make Dahlia better than Layla

### P0 differentiators

1. **Source and freshness badges.** Show “Google Places · checked 2 min ago,” “Open-Meteo forecast,” or “estimate” directly on the relevant item.
2. **Constraint checker.** Display a small health panel for date math, budget, opening hours, transfers, overlaps, and pace. Block “ready” status when a hard constraint fails.
3. **Why this fits.** Give every recommended item a one-sentence reason tied to the user's stated preferences, plus one viable alternative.
4. **Change preview.** Before applying a broad edit, summarize its effects: “removes 2 activities, saves $84, adds 35 minutes of travel.”
5. **Provider-failure states.** A failed hotel or route search should degrade to a clearly labeled partial plan, never placeholder “live” data.

### P1 after the MVP proves the loop

1. **Live revalidation.** Recheck hours, route times, and quotes before export and again near departure; highlight what changed.
2. **Budget trade-off mode.** Let the user lock essentials and ask Dahlia to optimize the remaining budget across stay, food, and activities.
3. **Map-first swapping.** Select an itinerary item on the map and compare nearby alternatives by fit, travel-time impact, and price.
4. **Collaborative decisions.** Shared travelers can vote or comment on alternatives; the owner accepts the final change.
5. **Import existing bookings.** Parse confirmation email/PDF/image into proposed trip items, but require the user to verify extracted dates and names before saving.
6. **Day-of-trip mode.** A compact mobile view with today's schedule, offline address/notes, next transfer, and disruption warnings.

### P2 / business expansion

- partner-backed live hotel/flight/activity quotes;
- price-drop alerts and quote expiration;
- multi-city/road-trip optimization;
- calendar and wallet export;
- human expert or concierge handoff;
- affiliate booking and, only after operational/legal readiness, in-product checkout.

## Explicitly out of scope for the first POC

- autonomous purchases or booking changes;
- passport/identity-document collection;
- payment storage;
- human travel-agent operations;
- PriceLock or price guarantees;
- exhaustive multi-city optimization;
- visa, safety, or health advice presented as authoritative;
- creator-video ingestion and a social inspiration feed;
- claims that every quote or itinerary fact is live.

These items add legal, support, partnership, or data-liability work without proving the core planning loop.

## MVP acceptance criteria

A build should not be called a functioning MVP until it can demonstrate all of the following with a fresh trip:

1. A free-text request becomes an editable `TripSpec`; missing hard fields are requested rather than invented.
2. The system returns at least 6–12 real, provider-identified places for a destination, with coordinates and source metadata.
3. A multi-day plan has no overlapping items and includes calculated travel time between consecutive places.
4. Venue hours are checked for the proposed visit time or marked unknown.
5. Weather is real and labeled with its forecast horizon.
6. The budget total is deterministic and flags over-budget plans.
7. “Make day 2 cheaper” changes the stored artifact, recomputes routes/totals, and retains a prior revision.
8. Every variable fact exposes its status, source, and checked time.
9. A provider outage produces a clear partial-result state with retry—not invented fallback facts.
10. The trip survives reload and has a read-only share link.

## Bottom line

Copy Layla's **conversation → checklist → persistent itinerary/map → conversational revision** loop. Do not try to copy its entire inventory and booking surface at once. Dahlia can be a credible POC with three real data pillars—places, routes, and weather—plus a deterministic validation layer and honest outbound booking paths. The most defensible addition is not another AI feature; it is making every plan visibly **sourced, feasible, and within constraints**.
