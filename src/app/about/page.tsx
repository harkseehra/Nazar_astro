import Link from 'next/link';

export const metadata = {
  title: 'About — Nazar',
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#0A0E14] text-[#C8CDD4] px-6 py-16 max-w-2xl mx-auto">
      <Link href="/" className="text-[#2196D4] text-sm hover:text-white transition-colors mb-10 inline-block">
        ← back
      </Link>

      <h1 className="text-3xl font-bold mb-2 text-white" style={{ fontFamily: 'Gentium Plus, Georgia, serif' }}>
        About Nazar
      </h1>
      <p className="text-[#2196D4] mb-10 text-sm">نظر — gaze, sight, perspective.</p>

      <section className="mb-8 leading-relaxed">
        <p className="mb-4">
          Nazar is a daily astrology app built on classical principles, not modern pop astrology.
          The sky above you right now, computed precisely, interpreted honestly.
        </p>
        <p className="mb-4">
          The name is Arabic, Persian, and Urdu for gaze — the act of seeing clearly, of looking at
          something without the distortion of wishful thinking. That's the project.
        </p>
        <p>
          We use the classical seven planets, the Hellenistic house tradition, and the
          interpretive principles of Abu Ma'shar, Al-Biruni, and Vettius Valens.
          Not because it's old — because it's coherent.
        </p>
      </section>

      <section className="mb-8 leading-relaxed">
        <h2 className="text-lg font-semibold text-white mb-3">What this is</h2>
        <p>
          A daily snapshot of the sky. Not your personal chart — that's V2. This is today's sky,
          common to everyone, interpreted in a voice that tells you what's actually happening
          rather than what you want to hear.
        </p>
      </section>

      <div className="mt-10 flex gap-4 text-sm text-white/30">
        <Link href="/method" className="hover:text-white/60 transition-colors">method</Link>
        <Link href="/" className="hover:text-white/60 transition-colors">back to the sky</Link>
      </div>
    </main>
  );
}
