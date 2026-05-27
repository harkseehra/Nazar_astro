# Nazar (نظر) — Build Spec

A contemplative astrology web app. The current sky as a living 3D solar system. Click a planet, read what it's doing today in the voice of someone who has read Rumi rather than someone selling moon water.

This document is the single source of truth for Claude Code. Read it fully before writing anything.

---

## 1. Identity & Voice

**Name:** Nazar (نظر) — "gaze, sight, perspective" in Arabic/Persian/Urdu.

**Tagline (working):** *The sky, today.*

**Voice principles — non-negotiable:**

- Literary, not mystical-marketing. No "manifest your highest self." No "the universe wants you to know."
- Specific over general. Never "you may feel emotional" — instead "the Moon enters Cancer at 4:12pm; the second half of the day favours rest at home over decisions."
- Draws on the **Hellenistic and classical Islamic astrological tradition** (Abu Ma'shar, Al-Biruni, Sahl ibn Bishr, Vettius Valens), not modern pop astrology.
- Occasional quotation from Rumi, Hafez, or the Masnavi is welcome when it fits — never forced.
- Tone register: motivating and sympathetic. Honest about hard transits (does not flatten difficulty) and warm about supportive ones (does not gush).
- Voice samples will be provided by the author in `/voice-samples/`. The system prompt for Claude API calls must reference these.

**What we are not:**
- Not Co-Star (cold/dry).
- Not Sanctuary (commercial-mystical).
- Not a Vedic app. We use the **tropical zodiac** and **Whole Sign houses** — the classical Hellenistic/Islamic system.

---

## 2. Astrological Foundations (Lock These In)

These are technical decisions already made. Do not change them without asking.

- **Zodiac:** Tropical (Western).
- **House system:** Whole Sign. (The rising sign = entire 1st house. Each subsequent sign = entire next house. No house cusp interpolation.)
- **Bodies computed:** The classical 7 — Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn. **No** outer planets (Uranus, Neptune, Pluto). **No** nodes, asteroids, or Chiron in V1.
- **Aspects computed:** The five Ptolemaic aspects only — conjunction (0°), sextile (60°), square (90°), trine (120°), opposition (180°).
- **Orbs:** 8° for Sun/Moon, 6° for personal planets (Mercury, Venus, Mars), 5° for Jupiter/Saturn. Tighter orbs make for cleaner daily readings.
- **Reference frame:** Geocentric (Earth-centred), apparent positions. This is what astrology uses — *not* heliocentric.
- **Coordinate epoch:** True equator and equinox of date.

---

## 3. Ephemeris Engine

**Library:** `swisseph` npm package, configured to use the **Moshier ephemeris** (free, public domain, no AGPL contamination, ~1 arcsecond accuracy — invisible to astrology).

```bash
npm install swisseph
```

In code, force Moshier mode:

```js
import swisseph from 'swisseph';
const FLAGS = swisseph.SEFLG_MOSEPH | swisseph.SEFLG_SPEED;
```

**No data files needed.** Moshier is computed analytically.

**Wrapper module:** Build `lib/ephemeris.js` exposing only these functions. Everything else in the app uses this interface — no raw `swisseph` calls elsewhere.

```js
// lib/ephemeris.js — public surface
computeChart({ datetime, latitude, longitude }) → ChartSnapshot
computeAspects(chartSnapshot) → Aspect[]
moonPhase(datetime) → { phaseName, illumination, nextPhase }
isVoidOfCourse(datetime) → { isVoid, untilDatetime }
```

**ChartSnapshot shape (TypeScript-ish):**

```ts
type ChartSnapshot = {
  datetime: string;        // ISO 8601, UTC
  location: { lat, lon, label };
  ascendant: { sign, degree };       // for Whole Sign house calc
  midheaven: { sign, degree };       // informational only in V1
  planets: {
    [name: 'sun'|'moon'|'mercury'|'venus'|'mars'|'jupiter'|'saturn']: {
      sign: string;                  // 'cancer'
      signDegree: number;            // 0–29.999
      absoluteLongitude: number;     // 0–359.999
      house: number;                 // 1–12, computed via Whole Sign
      isRetrograde: boolean;
      speed: number;                 // deg/day
    }
  };
};
```

**Whole Sign house computation:**
1. Compute the Ascendant sign.
2. That sign = house 1. The next sign in zodiacal order = house 2. And so on.
3. A planet's house = (its sign's index − Ascendant sign's index) mod 12, then +1.

---

## 4. Daily Chart Generation (the "today" snapshot)

**When:** Once per day, at **06:00 UTC** (close enough to global sunrise that the chart feels like "today's sky"). Triggered by a Vercel cron job.

**Where the snapshot is computed for:** The chart is computed for **06:00 UTC at coordinates (0°, 0°)** — i.e., a geocentric snapshot. House placements are recomputed per-user-location on the fly (since whole-sign houses just need the Ascendant sign, which is fast).

Wait — small correction. To keep V1 simple: the daily snapshot is **planet positions only** (signs, degrees, aspects, retrogrades, moon phase, void-of-course). House placement happens client-side once we know the user's location (which we'll geo-IP detect with a manual override).

**Output:** `public/data/today.json`. A static file. Served from CDN. No database in V1.

**Shape:**

```json
{
  "generatedAt": "2026-05-27T06:00:00Z",
  "validUntil": "2026-05-28T06:00:00Z",
  "planets": { /* same as ChartSnapshot.planets but without 'house' field */ },
  "aspects": [
    {
      "from": "venus",
      "to": "jupiter",
      "type": "trine",
      "orb": 1.2,
      "isApplying": true,
      "exactAt": "2026-05-27T15:42:00Z"
    }
  ],
  "moonPhase": {
    "phaseName": "waxing_gibbous",
    "illumination": 0.78,
    "nextPhase": { "name": "full_moon", "at": "2026-05-30T13:14:00Z" }
  },
  "voidOfCourse": {
    "isVoidNow": false,
    "nextVoidStart": "2026-05-28T03:22:00Z",
    "nextVoidEnd": "2026-05-28T09:11:00Z"
  },
  "retrogrades": ["mercury"],
  "interpretations": {
    "overall": "...",            // Claude-generated, see §6
    "sun": "...",
    "moon": "...",
    /* ... per planet ... */
    "topAspect": "..."
  }
}
```

**Cron setup:** `vercel.json` — schedule `0 6 * * *` calling `/api/cron/generate-today`.

---

## 5. The 3D Solar System (the front door)

**Library:** Three.js via `@react-three/fiber` and `@react-three/drei`.

**View modes (user toggle, persisted in localStorage):**
- **`cosmos`** (default desktop): full 3D solar system, planets orbiting at stylised distances, sun at centre, camera orbits freely. Planets visually sized for *recognizability* not realism (otherwise Mercury is invisible).
- **`wheel`**: classical astrological chart wheel — circle divided into 12 houses, planets placed by sign position. 2D, flat, calm.
- **`compact`** (default mobile): vertical scrolling list of planets, each as a card with its current sign/house/aspects. No 3D.

**Mobile detection:** `window.matchMedia('(max-width: 768px)')` → default to `compact`. User can still toggle to `cosmos` if they want.

**Visual language:**
- Background: deep ink (not pure black — use Iroshizuku **Take-sumi** `#404B57` or pure `#0A0E14`).
- Planet colours: each planet gets one Iroshizuku ink:
  - Sun → Yama-budo `#7D4452` (a deep wine — sun as sovereign, not gold)
  - Moon → Tsuki-yo `#506D8B` (literally "moonlit night")
  - Mercury → Kiri-same `#788E96` (mist grey, mercurial)
  - Venus → Murasaki-shikibu `#825D8E` (a literary purple)
  - Mars → Yama-guri `#6F4734` (chestnut, earthen heat)
  - Jupiter → Shin-kai `#205171` (deep sea — Jupiter's vastness)
  - Saturn → Take-sumi `#404B57` (bamboo charcoal — Saturn's gravitas)
- Accent: Kon-peki `#2196D4` (River Blue) — for UI chrome, hover states, the "today" indicator.
- Typography: Inter for UI, **Gentium Plus** for interpretation copy, **Vazirmatn** for any Persian/Arabic text. Same stack as existing projects.
- Retrograde planets: subtle reverse-direction shimmer or backwards-orbit indicator.

**Interaction:**
- Hover planet → show its current sign and a single-line position ("Mercury 12° Cancer").
- Click planet → side panel slides in (desktop) or full-screen modal (mobile) with full interpretation.
- Click empty space → return to overview.

**Performance:**
- Use low-poly spheres (32 segments max).
- No textures in V1 — solid Iroshizuku colours only. (Textures can come V2 if the aesthetic calls for it.)
- Pause render loop when tab is hidden.
- On mobile `cosmos` mode: reduce planet count visible at once, simplify orbits, cap pixel ratio at 1.5.

---

## 6. Claude API Integration (the voice layer)

**Model:** `claude-sonnet-4-5` (latest Sonnet). Cheap, fast, plenty good for prose generation.

**When called:** Once per day, inside the cron job, *after* the chart is computed. Never on the client. Generated interpretations are baked into `today.json`.

**Interpretation types generated each day:**
1. **`overall`** — 2–3 sentences. The day's headline weather.
2. **One per planet** (7 total) — 2–4 sentences each. What this planet is doing today.
3. **`topAspect`** — 2–3 sentences on the most exact/important aspect of the day.

**System prompt template** (in `lib/interpret/systemPrompt.js`):

```
You write daily astrological interpretations for Nazar, a literary astrology app
rooted in the Hellenistic and classical Islamic astrological tradition (Abu Ma'shar,
Al-Biruni, Sahl ibn Bishr, Vettius Valens).

Voice rules (these are absolute):
- Specific, never generic. Reference the actual sign, house, and aspect by name.
- Literary register. You may quote Rumi, Hafez, or the Masnavi when it genuinely fits;
  never force it. At most one quotation across all interpretations for a given day.
- Honest about difficulty. Squares and oppositions are not "growth opportunities" —
  they are tension, and you say so. Trines and sextiles are ease, and you say so.
- Warm but not gushing. Motivating but not coaching-speak.
- No modern pop-astrology vocabulary. Banned phrases: "manifest", "high vibe",
  "the universe wants", "your highest self", "shadow work", "energy".
- Use traditional terminology when natural: domicile, exaltation, detriment, fall,
  benefic, malefic, sect, applying, separating, void of course.
- Use the classical 7 planets only. Do not mention Uranus, Neptune, Pluto, or any
  asteroid or node.

Voice samples below show the register you are matching. Match the rhythm, the
sentence length variation, and the specificity. Do not imitate phrases verbatim.

[VOICE_SAMPLES_HERE]
```

**Per-call user prompt template** (for each planet):

```
Today is {date}. Generate the interpretation for {planet} only.

Position:
- {planet} is at {degree}° {sign}, in its {dignityStatus}
  ({dignity: domicile/exaltation/peregrine/detriment/fall})
- {retrograde status}
- Speed: {fast/average/slow}

Active aspects involving {planet} today (with orb):
{list of aspects}

Write 2–4 sentences. Begin with the position, end with a concrete observation
about the day's quality. Do not use the word "energy".
```

**Important:** Compute planetary dignities (domicile, exaltation, etc.) before calling — these are static lookups (e.g., Mars in Aries = domicile, Mars in Cancer = fall). Build `lib/dignities.js` with the classical rulership table.

**Cost guard:** ~8 short calls/day = trivial cost. Still: wrap in try/catch and fall back to a stored default interpretation if the API fails. Never break the site because of an API error.

---

## 7. UI / Page Structure

V1 has exactly **one page**: `/`.

Layout (desktop):
- Top bar: Nazar wordmark (left), today's date in user's timezone (centre), view toggle + settings (right).
- Centre: 3D canvas (or wheel, or list, depending on mode).
- Always-visible chrome elements (overlay, top-right of canvas):
  - Current moon phase (icon + name).
  - Void-of-course indicator (only shown when active or starting within 6 hours).
  - Retrograde list (one-line: "℞ Mercury").
- Side panel (slides in from right when a planet is clicked):
  - Planet name + glyph.
  - Position line: "Mercury 12° Cancer · House 4 · Retrograde"
  - Dignity status.
  - The Claude-generated interpretation.
  - Active aspects involving this planet, each with a one-line plain-language description.
- Bottom: minimal footer with "about", "method" (explains the system honestly), and a "save this moment" button.

Layout (mobile):
- Same chrome, condensed.
- Default view is `compact` — vertical scrolling card list.
- Tapping a card expands inline rather than opening a side panel.

---

## 8. Save This Moment

When user clicks "save":
- Capture: timestamp, location, full `today.json` snapshot, optional user note.
- Store in `localStorage` under `nazar.savedMoments` (V1 — no accounts).
- Show a saved-moments view at `/saved` — simple chronological list.
- Each saved moment has a permalink: `/moment/[id]` that re-renders that exact chart.

---

## 9. Project Structure

```
nazar/
├── CLAUDE.md                          # This file
├── package.json
├── next.config.js
├── vercel.json                        # Cron config
├── public/
│   ├── data/
│   │   └── today.json                 # Generated daily
│   └── fonts/
├── voice-samples/                     # User-provided voice samples (markdown)
│   ├── README.md
│   └── sample-*.md
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                   # The one page
│   │   ├── saved/
│   │   │   └── page.tsx
│   │   ├── moment/
│   │   │   └── [id]/page.tsx
│   │   ├── about/
│   │   │   └── page.tsx
│   │   ├── method/
│   │   │   └── page.tsx
│   │   └── api/
│   │       └── cron/
│   │           └── generate-today/
│   │               └── route.ts
│   ├── components/
│   │   ├── chrome/
│   │   │   ├── TopBar.tsx
│   │   │   ├── MoonPhaseIndicator.tsx
│   │   │   ├── VoidIndicator.tsx
│   │   │   └── RetrogradeList.tsx
│   │   ├── views/
│   │   │   ├── CosmosView.tsx         # Three.js solar system
│   │   │   ├── WheelView.tsx          # 2D chart wheel
│   │   │   └── CompactView.tsx        # Mobile cards
│   │   ├── PlanetPanel.tsx            # The side panel / modal
│   │   └── ViewToggle.tsx
│   └── lib/
│       ├── ephemeris.ts               # swisseph wrapper
│       ├── dignities.ts               # classical rulership table
│       ├── houses.ts                  # Whole Sign calculation
│       ├── aspects.ts                 # aspect detection
│       ├── moon.ts                    # phase + void-of-course
│       ├── interpret/
│       │   ├── systemPrompt.ts
│       │   ├── userPrompts.ts
│       │   └── claudeClient.ts
│       └── theme.ts                   # Iroshizuku colour map
└── tests/
    └── ephemeris.test.ts              # Verify against known charts
```

---

## 10. Build Order (Four Phases)

**Phase 1 — Ephemeris foundation. No UI yet.**
1. Set up Next.js 14 (App Router), TypeScript, Tailwind.
2. Install `swisseph`, write `lib/ephemeris.ts` with Moshier flag.
3. Write `lib/dignities.ts` (static lookup table — I'll provide the classical version on request).
4. Write `lib/houses.ts` (Whole Sign — straightforward modular arithmetic).
5. Write `lib/aspects.ts` (orb-based aspect detection).
6. Write `lib/moon.ts` (phase + void-of-course).
7. Write tests verifying output against a known reference chart (e.g., 2000-01-01 00:00 UTC).
8. Build the `/api/cron/generate-today` endpoint that produces `public/data/today.json` (without Claude interpretations yet — just the raw data).

**Phase 2 — Claude voice layer.**
1. Set up Anthropic SDK.
2. Build `lib/interpret/` modules.
3. Wire interpretation generation into the cron route.
4. Build the `/method` page that explains exactly what the app computes and how (transparency).

**Phase 3 — UI.**
1. Build `CompactView` first (simplest, also the mobile default).
2. Build `WheelView` (classical 2D chart — uses SVG, no Three.js needed).
3. Build `CosmosView` (Three.js — the showpiece, but last because it's the heaviest).
4. Build `PlanetPanel` and chrome elements.
5. View toggle + localStorage persistence.

**Phase 4 — Save Moment + polish.**
1. Save-moment functionality.
2. `/saved` and `/moment/[id]` pages.
3. About page.
4. Loading states, error boundaries, SEO meta tags.
5. Deploy to Vercel, configure cron, verify daily generation.

---

## 11. Out of Scope for V1

Explicitly **do not** build any of these in V1, no matter how tempting:

- ❌ User accounts / authentication
- ❌ Birth charts / natal interpretation
- ❌ Time chooser (custom datetime selection)
- ❌ Compatibility / synastry
- ❌ Notifications
- ❌ Educational mode / glossary
- ❌ Vedic / sidereal toggle
- ❌ Outer planets (Uranus/Neptune/Pluto)
- ❌ Nodes, asteroids, Chiron
- ❌ Aspect patterns (grand trines, T-squares, etc.)
- ❌ Database of any kind

**Planned V2:** time chooser, birth chart with personal interpretation, solar/lunar return charts, aspects-of-the-day full list.

**Planned V3:** synastry, educational mode (paywalled), retrograde dashboard.

**Planned V4/V5:** push notifications, iOS app (React Native port).

---

## 12. Operating Principles for Claude Code

- **Phase discipline.** Finish a phase fully before moving to the next. No half-built UI before the ephemeris is solid.
- **No silent dependencies.** Every new npm package gets mentioned and justified.
- **Honest fallbacks.** If a Claude API call fails, show the raw position data with a small note — never a generic horoscope.
- **Test the math.** Phase 1 is not done until the ephemeris output matches at least three known reference charts (I'll provide them).
- **Type safety.** Use TypeScript strictly. Define types for all astrological data in `src/types/astrology.ts`.
- **No theming drift.** Iroshizuku palette is the only palette. Don't introduce new colours without asking.

---

## 13. Open Questions to Resolve Before Phase 1

- Domain name?
- Vercel deployment account ready?
- Will voice samples be ready before Phase 2 starts? (If not, Phase 2 waits.)
- Geo-IP service for default location detection — Vercel provides this in headers, prefer that over a third-party API.
