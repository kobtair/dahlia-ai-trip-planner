import type { HospitalityPlace } from '@/lib/hospitality';
import { PlacePhoto } from '@/components/place-photo';

export function HospitalityOptions({ options }: { options: { restaurants: HospitalityPlace[]; hotels: HospitalityPlace[]; note: string } }) {
  return <section className="mb-5 rounded-xl border p-4" aria-label="Restaurants and hotels">
    <h3 className="text-sm font-semibold">Where to eat & stay</h3>
    <p className="mt-2 text-xs leading-5 text-muted-foreground">{options.note}</p>
    {([['Restaurants nearby', options.restaurants], ['Hotels nearby', options.hotels]] as const).map(([label, venues]) => <details key={label} className="mt-4" open>
      <summary className="cursor-pointer text-sm font-medium">{label}</summary>
      {!venues.length && <p className="mt-2 text-xs text-muted-foreground">No sourced options were returned for this area.</p>}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">{venues.map((venue) => <article key={venue.id} className="min-w-0 rounded-xl bg-muted/30 p-3">
        {venue.imageUrl && <PlacePhoto src={venue.imageUrl} name={venue.name} />}
        <h4 className="text-sm font-semibold">{venue.name}</h4>
        <p className="mt-1 text-xs text-muted-foreground">{venue.cuisine || (venue.stars ? `${venue.stars} stars · published listing` : venue.kind)}</p>
        {venue.dietaryInfo && <p className="mt-1 text-xs">Listed dietary options: {venue.dietaryInfo}. Confirm directly.</p>}
        {venue.openingHours && <p className="mt-1 break-words text-xs text-muted-foreground">Published hours: {venue.openingHours}</p>}
        <div className="mt-2 flex flex-wrap gap-3 text-xs underline"><a href={venue.sourceUrl} target="_blank" rel="noreferrer">View on OpenStreetMap ↗</a>{venue.website && <a href={venue.website} target="_blank" rel="noreferrer">Website ↗</a>}</div>
      </article>)}</div>
    </details>)}
  </section>;
}
