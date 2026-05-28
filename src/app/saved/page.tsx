'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { loadSavedMoments, deleteMoment, type SavedMoment } from '@/lib/savedMoments';
import { MOON_PHASE_ICONS, PLANET_LABELS } from '@/lib/theme';

export default function SavedPage() {
  const [moments, setMoments] = useState<SavedMoment[]>([]);

  useEffect(() => {
    setMoments(loadSavedMoments());
  }, []);

  function handleDelete(id: string) {
    deleteMoment(id);
    setMoments((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <main className="min-h-screen px-5 pt-14 pb-20 max-w-xl mx-auto" style={{ background: '#0A0E14' }}>
      <div className="flex items-center justify-between mb-8 pt-4">
        <h1 className="text-xl font-semibold text-white" style={{ fontFamily: 'Gentium Plus, Georgia, serif' }}>
          Saved moments
        </h1>
        <Link href="/" className="text-xs text-[#2196D4] hover:text-white transition-colors">
          ← back
        </Link>
      </div>

      {moments.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-white/30 text-sm">No saved moments yet.</p>
          <p className="text-white/15 text-xs mt-2">Press &ldquo;save this moment&rdquo; on the main page.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {moments.map((m) => {
            const savedDate = new Date(m.savedAt);
            const chartDate = new Date(m.chartDate);
            const phaseIcon = MOON_PHASE_ICONS[m.snapshot.moonPhase.phaseName] ?? '';
            const topAspect = m.snapshot.aspects[0];
            const retros = m.snapshot.retrogrades;

            return (
              <li key={m.id}>
                <Link
                  href={`/moment/${m.id}`}
                  className="block rounded-xl px-4 py-4 transition-all hover:border-white/20"
                  style={{ background: '#ffffff06', border: '1px solid #ffffff0a' }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white font-medium text-sm">
                        {chartDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <p className="text-white/30 text-xs mt-0.5">
                        Saved {savedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} at {savedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {m.location.label ? ` · ${m.location.label}` : ''}
                      </p>
                    </div>
                    <span className="text-lg">{phaseIcon}</span>
                  </div>

                  {m.note && (
                    <p className="text-white/50 text-sm mb-2 italic"
                      style={{ fontFamily: 'Gentium Plus, Georgia, serif' }}>
                      &ldquo;{m.note}&rdquo;
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-white/25">
                    {topAspect && (
                      <span>{PLANET_LABELS[topAspect.from]} {topAspect.type} {PLANET_LABELS[topAspect.to]}</span>
                    )}
                    {retros.length > 0 && (
                      <span>℞ {retros.map((p) => PLANET_LABELS[p]).join(', ')}</span>
                    )}
                  </div>
                </Link>

                <button
                  onClick={() => handleDelete(m.id)}
                  className="w-full text-center text-[10px] text-white/10 hover:text-red-400/60 transition-colors py-1"
                >
                  delete
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
