'use client';
import { useState, useRef, useEffect } from 'react';
import { saveMoment } from '@/lib/savedMoments';
import type { TodayJson, PlanetName, ZodiacSign } from '@/types/astrology';

interface Props {
  today: TodayJson;
  houses: Partial<Record<PlanetName, number>>;
  ascendantSign?: ZodiacSign;
  location: { lat: number; lon: number; label: string };
}

type State = 'idle' | 'writing' | 'saved';

export function SaveButton({ today, houses, ascendantSign, location }: Props) {
  const [state, setState] = useState<State>('idle');
  const [note, setNote] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (state === 'writing') inputRef.current?.focus();
  }, [state]);

  function handleSave() {
    saveMoment({
      chartDate: today.generatedAt,
      location,
      note: note.trim() || undefined,
      snapshot: today,
      houses,
      ascendantSign,
    });
    setState('saved');
    setNote('');
    setTimeout(() => setState('idle'), 2500);
  }

  if (state === 'saved') {
    return (
      <span className="text-xs text-[#2196D4] animate-pulse">moment saved ✓</span>
    );
  }

  if (state === 'writing') {
    return (
      <div className="flex items-center gap-2">
        <textarea
          ref={inputRef}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="add a note… (optional)"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); }
            if (e.key === 'Escape') setState('idle');
          }}
          className="text-xs bg-transparent border-b border-white/20 focus:border-[#2196D4] outline-none text-white/70 placeholder-white/25 resize-none w-40"
        />
        <button onClick={handleSave} className="text-xs text-[#2196D4] hover:text-white transition-colors">
          save
        </button>
        <button onClick={() => setState('idle')} className="text-xs text-white/20 hover:text-white/50 transition-colors">
          ×
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setState('writing')}
      className="text-xs text-white/30 hover:text-white/60 transition-colors"
    >
      save this moment
    </button>
  );
}
