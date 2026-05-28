export const metadata = {
  title: 'Method — Nazar',
  description: 'How Nazar computes the sky and generates its interpretations.',
};

export default function MethodPage() {
  return (
    <main className="min-h-screen bg-[#0A0E14] text-[#C8CDD4] px-6 py-16 max-w-2xl mx-auto">
      <h1
        className="text-3xl font-bold mb-2 text-white"
        style={{ fontFamily: 'Gentium Plus, Georgia, serif' }}
      >
        Method
      </h1>
      <p className="text-[#2196D4] mb-12 text-sm tracking-wide">How this works — no mysticism, just mechanics.</p>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-3">The sky</h2>
        <p className="mb-4 leading-relaxed">
          Planet positions are computed using the <strong>Swiss Ephemeris</strong> (Moshier analytical
          mode — no data files, ~1 arcsecond accuracy, invisible to astrology). The chart is geocentric:
          Earth is the centre. Positions are tropical — referenced to the vernal equinox, not the
          fixed stars.
        </p>
        <p className="leading-relaxed">
          The daily snapshot is computed once, at <strong>06:00 UTC</strong>, for the geocentric
          position at that moment. It covers the whole day.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-3">What we compute</h2>
        <ul className="space-y-2 leading-relaxed">
          <li>
            <span className="text-white font-medium">Planets:</span> The classical seven — Sun, Moon,
            Mercury, Venus, Mars, Jupiter, Saturn. No outer planets, no asteroids, no nodes.
            These are the bodies used by Hellenistic and classical Islamic astrologers for two
            thousand years.
          </li>
          <li>
            <span className="text-white font-medium">Zodiac:</span> Tropical (Western). The signs
            are defined by the seasons, not the stars.
          </li>
          <li>
            <span className="text-white font-medium">Houses:</span> Whole Sign. The sign rising on
            the horizon is the entire first house. The next sign is the entire second house. No
            interpolation, no house cusps. This is the original Hellenistic system.
          </li>
          <li>
            <span className="text-white font-medium">Aspects:</span> The five Ptolemaic aspects only
            — conjunction (0°), sextile (60°), square (90°), trine (120°), opposition (180°). Orbs
            are 8° for Sun and Moon, 6° for Mercury, Venus, and Mars, 5° for Jupiter and Saturn.
          </li>
          <li>
            <span className="text-white font-medium">Dignities:</span> Classical Hellenistic
            domicile, exaltation, detriment, and fall — from Abu Ma&apos;shar and Vettius Valens. A
            planet in its domicile or exaltation operates with more clarity. In detriment or fall,
            it works against the grain.
          </li>
          <li>
            <span className="text-white font-medium">Moon phase and void of course:</span> Phase is
            computed from the Sun-Moon elongation. Void of course means the Moon has made its last
            Ptolemaic aspect before leaving its current sign — a traditional caution against
            starting new things.
          </li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-3">The interpretations</h2>
        <p className="mb-4 leading-relaxed">
          After the chart is computed, a Claude AI model (Anthropic) generates the interpretation
          text — the part that says what today&apos;s sky means. The facts (planet, sign, degree, aspect,
          orb) are fixed and precise. The interpretation layer wraps those facts in language.
        </p>
        <p className="mb-4 leading-relaxed">
          The model is instructed to write in a specific register: direct, honest, rooted in the
          classical tradition. Hard transits are named as hard. Easy ones are named as easy. The
          voice draws on Hellenistic and classical Islamic astrological principles — Abu Ma&apos;shar,
          Al-Biruni, Sahl ibn Bishr, Vettius Valens — not modern pop astrology.
        </p>
        <p className="leading-relaxed">
          If the AI call fails for any reason, the site falls back to showing the raw positional
          data. The sky is always visible; only the words may be absent.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-3">What we don&apos;t do</h2>
        <ul className="space-y-1 leading-relaxed text-[#8A9099]">
          <li>No birth charts in V1 — this is today&apos;s sky, not your sky.</li>
          <li>No Vedic or sidereal zodiac.</li>
          <li>No outer planets (Uranus, Neptune, Pluto).</li>
          <li>No asteroids, nodes, or Chiron.</li>
          <li>No aspect patterns (grand trines, T-squares).</li>
          <li>No database, no accounts, no tracking.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-3">The tradition</h2>
        <p className="leading-relaxed">
          Hellenistic astrology (c. 1st century BCE–7th century CE) and its classical Islamic
          inheritors (8th–11th century CE) developed a rigorous technical system: whole-sign
          houses, sect, essential dignities, applying and separating aspects, void of course. This
          is what Nazar uses. Not because it&apos;s old — because it&apos;s coherent.
        </p>
      </section>
    </main>
  );
}
