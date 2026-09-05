'use client';
import Image from 'next/image';
import { useState } from 'react';
import { MapPin } from 'lucide-react';

export function PlacePhoto({ src, name }: { src?: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  return <div className="relative mb-3 h-40 overflow-hidden rounded-lg bg-[#ece7de] sm:h-36">
    {src && !failed ? <><div aria-hidden="true" className={`absolute inset-0 bg-[#e4ded3] ${loaded ? 'hidden' : 'animate-pulse'}`} /><Image src={src} alt={name} fill unoptimized sizes="(max-width: 640px) 90vw, 480px" className={`object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`} onLoad={() => setLoaded(true)} onError={() => setFailed(true)} /></> : <div className="flex h-full items-center justify-center gap-2 text-xs text-muted-foreground"><MapPin size={16} /> Photo unavailable</div>}
  </div>;
}
