# Plan: Salud Integral Enterprise V3 Pro (Clinical Engine) Dashboard

## Context
The user wants a from-scratch, single-screen clinical healthtech dashboard with a premium obsidian dark aesthetic, neon accents, glassmorphism cards, and an asymmetric bento-box grid. The project currently has a blank `src/app/App.tsx`. This is a **PureFrontend** build — no backend/Supabase needed. All data is static/mock. The project is standard shadcn/ui + Tailwind v4 with `recharts`, `lucide-react`, and `motion` already installed, so no new dependencies are required.

## Visual System (custom, applied via inline Tailwind + arbitrary values)
- **Background:** `#0B0F19` base, cards on `#121824` translucent glass.
- **Card style:** `bg-white/[0.03]` + `backdrop-blur-xl` + `border border-[#1E293B]` + `rounded-2xl` + `p-6`, subtle inner glow.
- **Grid:** 4-column bento grid (`grid-cols-4 gap-6`), widgets span columns/rows via `col-span-*` / `row-span-*`; collapses to single column on mobile.
- **Palette tokens** (define once as CSS variables in `src/styles/theme.css` `.dark` scope or a small `:root` block, then reference):
  - `--neon-green: #39FF14` (optimal/protein)
  - `--electric-cyan: #00F0FF` (data/hydration/carbs)
  - `--fat-purple: #A855F7` (fats)
  - `--warning-coral: #FF4D4D` (safety clamp)
- **Typography:** Inter via `src/styles/fonts.css` (`@import` at top of file). Per project rules, avoid Tailwind font-size/weight utilities unless needed for hierarchy — here the spec demands strict hierarchy, so targeted sizing is acceptable.

## Files to create/modify
- `src/styles/fonts.css` — add Inter `@import` at top.
- `src/styles/theme.css` — add the neon palette CSS variables (append; do not disturb existing tokens).
- `src/app/App.tsx` — root: force dark obsidian background, render `<DashboardLayout />`. Ensure default export.
- `src/app/components/dashboard-layout.tsx` — sidebar + main bento grid shell.
- `src/app/components/sidebar-nav.tsx` — fixed minimalist left sidebar, lucide line-art icons (LayoutDashboard, Apple/Salad, Dumbbell, Activity/HeartPulse, Pill), active/hover states with neon accent.
- `src/app/components/widgets/telemetry-header.tsx` — Widget 1 (col-span-3): avatar with glowing cyan halo (`drop-shadow`), "Marcos M.", "Week 3: MAV-2 Phase", "Clinical Engine V3.0 Pro Active" badge.
- `src/app/components/widgets/macro-rings.tsx` — Widget 2 (col-span-2 row-span-2): 3 concentric SVG progress rings (green protein / cyan carbs / purple fats), centered "2,450 / 2,800 kcal" readout. Custom SVG `<circle>` with `stroke-dasharray`/`stroke-dashoffset`.
- `src/app/components/widgets/weight-trend.tsx` — Widget 3 (col-span-2 row-span-2): recharts `AreaChart`/`LineChart`, white line + soft neon glow (SVG filter/gradient fill), simulated hover: cyan dot, dotted vertical reference line, floating tooltip "82.4 kg - Smoothed EMA Real Trend".
- `src/app/components/widgets/endothelial-monitor.tsx` — Widget 4 (col-span-1 row-span-2): top circular gauge "NOx Index: 88% Optimal"; bottom coral alert banner with the Hormonal Hard Clamp warning text.
- `src/app/components/widgets/nutrient-timeline.tsx` — Widget 5 (col-span-3 row-span-2): 4 side-by-side meal sub-cards (Breakfast 35% w/ "0-30 min post-waking" icon, Lunch 30%, Post-Workout 15%, Dinner 20%) with mock food portions.
- `src/app/components/widgets/pelvic-floor.tsx` — Widget 6 (col-span-1 row-span-1): circular dial (Dorey protocol), "3 / 4 Weekly Sessions Completed", glowing neon toggle in active state (shadcn `Switch` styled, or custom).

## Implementation notes
- Reuse shadcn primitives where they fit the dark aesthetic: `Badge`, `Switch`, `Avatar`, `Progress`. Custom-style the rings/gauges as SVG since shadcn has no concentric-ring component.
- Charts use `recharts` (installed). Rings/gauges use hand-written SVG for precise stroke control.
- Icons from `lucide-react` (installed).
- Optional subtle entrance animations via `motion/react` (installed) — keep restrained.
- Grid is defined on the main container; each widget passes its span as a wrapper class. Responsive: `grid-cols-1 md:grid-cols-2 xl:grid-cols-4`.
- All numbers/labels are hardcoded mock data matching the spec exactly.

## Verification
- The Vite dev server is already running — do NOT start it. After edits, open the preview surface (not localhost) and confirm:
  1. Obsidian background, all 6 widgets render in the correct bento spans with no overflow.
  2. Rings show three distinct colored arcs with centered kcal text; weight chart shows glowing white line + simulated cyan hover tooltip.
  3. Coral warning banner and NOx gauge render in Widget 4; nutrient timeline shows 4 meal cards; pelvic-floor toggle is in active/glowing state.
  4. Layout collapses cleanly to a single column at mobile width.
