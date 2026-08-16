# Gem Merchants — a personal-use Splendor-style game

A learning project: a real-time multiplayer gem-trading game with the same core
mechanics as the classic board game, built with Next.js + Supabase.

**Copyright note:** the game rules and numeric structure (token counts, turn
actions, 15-point win condition, noble mechanic, etc.) are not copyrightable —
only specific creative expression (artwork, exact card text/branding) is. This
project uses 100% original, procedurally generated card/token art
(see `public/assets/`) and **placeholder card costs** (see below) so there's no
copied creative content anywhere in the repo. For personal use, feel free to
research and enter the exact historical costs yourself if you want strict
parity — that's just data, not infringement.

## What's implemented

- Full turn engine: take 3 different tokens / take 2 same-color tokens (if ≥4
  in bank), reserve a card (face-up or top-of-deck, +1 gold), buy a card
  (from display or your reserved hand, gold as wildcard), noble visits,
  10-token discard rule, last-round-trigger at 15 points, tie-break by fewer
  cards.
- Real-time multiplayer via Supabase (Postgres + Realtime), 2-4 players,
  room-code based (create a room, share the 5-letter code).
- Original SVG-generated token and card art (no copied illustrations).

## What's placeholder / left for you

- **Card costs & point values** (`src/lib/cardData.ts`) are procedurally
  generated to match Splendor's *shape* (40/30/20 cards per tier, same rough
  point curve) but are not the real numbers. Swap in your own researched
  values — the engine only cares about the `{tier, bonus, points, cost}`
  shape, so you can hand-edit `cardData.ts` into a static list.
- **Noble requirements** are similarly placeholder-random.
- No card illustrations beyond the generated geometric tiles + cost pips.
- No animations, sound, or "return excess tokens" niceties beyond the basic
  discard flow.

## Setup

1. **Supabase project**
   - Create a free project at supabase.com.
   - In the SQL editor, run `supabase/schema.sql`.
   - In Database → Replication, confirm the `games` table has Realtime enabled
     (the script also does this via `alter publication`).
   - Copy your Project URL and anon public key.

2. **Env vars**
   ```
   cp .env.local.example .env.local
   # fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

3. **Run locally**
   ```
   npm install
   npm run dev
   ```
   Open http://localhost:3000, create a room, open a second tab (or send the
   room code to another device) to join.

4. **Deploy** (optional, for playing across real devices)
   - Push to GitHub, import into Vercel, add the same two env vars in Vercel's
     project settings, deploy.

## Notes on the RLS policy

`schema.sql` sets fully open read/write policies on the `games` table — fine
for an unlisted, personal-use room-code app, since guessing a random 5-char
code is the only "auth." If you ever make this public-facing, tighten this
(e.g. require Supabase Auth and scope rows to authenticated participants).

## Where to go next

- Replace `cardData.ts` with real costs.
- Add reconnect/rejoin handling (currently keyed off localStorage player name
  per room).
- Add proper handling/UX for taking fewer than 3 tokens and returning excess
  above 10 (engine enforces the rules; UI is minimal).
- Add richer card art.
