# Cognify — Design System

> Scope: the authenticated app (`/dashboard/**`). The marketing page (`/`) and `/login` are
> intentionally a separate, dark-only brand surface and are **not** governed by this document.
>
> This file is written to be read by people *and* by AI coding agents. Rules are phrased as
> constraints. When in doubt: **quieter, smaller, fewer.**

> **v2 skin (Nov 2026, local only — not deployed).** The dashboard now follows the Solvik /
> Murmura references and **supersedes** these rules where they conflict: floating pill nav
> (`TopNav`) + dark tool dock (`FloatingDock`) replace the sidebar/header; the page ground is a
> pastel mesh (`.app-ui` in `globals.css`); cards are frosted (`--card` is translucent under
> `.app-ui`); tint tiles (`bg-tint-lime|coral|sky|ink`) are allowed for stat/board cards; UI face
> is Urbanist (set in `(main)/layout.tsx`); motion is allowed in the dashboard via
> `components/motion/reveal.tsx` (`Stagger`, `CountUp`, `Magnetic`, `Lift`) and `lib/motion.ts`
> (house ease `cubic-bezier(.2,.8,.2,1)`, pop ease `back.out`-style) plus the CSS `.page-enter`
> blur-focus route transition. Token names are unchanged. Rules below about colour restraint,
> skeleton/empty states, page anatomy and accessibility still apply.

---

## 1. Philosophy

Cognify is a personal knowledge hub: links (Bookmarks), infinite boards (Canvas), and
collaborative pages (Docs). The UI is a **calm, neutral workspace** in the tradition of
Linear / Notion / Vercel dashboards, with one restrained accent colour per workspace so the
user always knows *where* they are.

Principles, in priority order:

1. **Content first.** Chrome is neutral grey; colour is reserved for workspace identity,
   state, and the one primary action on a page.
2. **One system, two themes.** Every colour is a token. Light is the default; dark is a token
   swap, never a re-design. Nothing is hard-coded to `zinc-*`, `white/10`, or `#hex`.
3. **Structure over decoration.** Hierarchy comes from type scale, spacing and borders — not
   from glows, blurs, gradients or drop shadows. Gradients appear only as a *soft tint* on
   board/stat cards (see §7).
4. **Same skeleton everywhere.** Every page = `PageHeader` → toolbar → content. Every list =
   bordered card with `divide-y` rows. Every create = `Dialog`. Every destructive act =
   `AlertDialog`. Users should never have to learn a new layout.
5. **State is visible.** Loading → `Skeleton` in the exact shape of the content. Empty →
   `Empty` with one CTA. Error → boundary with a plain-English fix. Never a blank area.

Lineage: the shell, route-per-feature structure, `modules/` folder, breadcrumbs, sidebar
active-state and card-grid patterns are adapted from
[looma](https://github.com/ronitrai27/looma-sketch_collaborate_deploy),
[aria](https://github.com/ronitrai27/aria-hackathon) and
[wekraft](https://github.com/Wekraft-collaboration-platform/wekraft-saas). See
`REFERENCES.md` for exactly what came from where.

---

## 2. Tokens

All tokens live in `src/app/globals.css` (canonical) and are mirrored in `design/tokens.css`
and `design/tokens.json`. They are exposed to Tailwind via `@theme inline`, so use utility
classes (`bg-card`, `text-muted-foreground`, `border-docs/40`) — never `var(--x)` in JSX.

### 2.1 Colour — neutral base (shadcn/ui "neutral")

| Token | Light | Dark | Use |
|---|---|---|---|
| `background` | `oklch(0.99 0 0)` | `oklch(0.13 0 0)` | page ground |
| `foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` | body text |
| `card` | `oklch(1 0 0)` | `oklch(0.17 0 0)` | surfaces, list containers |
| `popover` | `oklch(1 0 0)` | `oklch(0.18 0 0)` | menus, dialogs, palette |
| `muted` | `oklch(0.97 0 0)` | `oklch(0.22 0 0)` | subtle fills, toolbars, skeletons |
| `muted-foreground` | `oklch(0.5 0 0)` | `oklch(0.708 0 0)` | secondary text, icons at rest |
| `accent` | `oklch(0.96 0 0)` | `oklch(0.26 0 0)` | hover/selected rows and menu items |
| `primary` | `oklch(0.205 0 0)` | `oklch(0.922 0 0)` | the single filled button on a page |
| `border` / `input` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` / `15%` | hairlines |
| `ring` | `oklch(0.708 0 0)` | `oklch(0.556 0 0)` | focus |
| `destructive` | `oklch(0.577 0.245 27)` | `oklch(0.704 0.191 22)` | delete, leave, revoke |
| `sidebar*` | slightly off-`background` | `oklch(0.16 0 0)` | sidebar surface + its own accent/border |

### 2.2 Colour — workspace accents (Cognify-specific)

Each workspace owns exactly one accent. It is used for: the sidebar active rule + icon, the
`PageHeader` icon, hover colour on row titles, the "primary tint" on empty-state CTAs, and
selection highlights inside that workspace. **Never as a button fill and never as body text.**

| Token | Hue | Light | Dark | Workspace |
|---|---|---|---|---|
| `brand` | orange | `oklch(0.7 0.19 47)` | `oklch(0.75 0.18 50)` | Bookmarks |
| `canvas` | rose | `oklch(0.65 0.2 20)` | `oklch(0.7 0.19 18)` | Canvas |
| `docs` | emerald | `oklch(0.7 0.15 162)` | `oklch(0.75 0.15 160)` | Docs (also Liveblocks `--lb-accent`) |
| `ai` | indigo | `oklch(0.6 0.2 275)` | `oklch(0.7 0.16 280)` | AI copilot, inbox/unread |
| amber-400 | — | tailwind | tailwind | favourites/stars only |

Opacity steps that are allowed on accents: `/5` (hover wash), `/10` (selected fill),
`/15` (icon chip fill), `/20` (sidebar active gradient start), `/40` (selected border).

### 2.3 Typography

| Role | Family | Token | Where |
|---|---|---|---|
| UI / body | Geist | `font-sans` (`--font-sans`) | everything by default |
| Headings | Space Grotesk | `font-heading` (`--font-heading`) | `h1–h6` automatically; page titles, doc titles |
| Code | Geist Mono | `font-mono` | inline code, IDs, kbd |

Scale (Tailwind classes; do not invent sizes):

| Element | Classes |
|---|---|
| Page title (`PageHeader`) | `text-2xl sm:text-3xl font-semibold tracking-tight` |
| Doc page title (editable) | `text-3xl sm:text-4xl font-heading font-bold tracking-tight` |
| Section title | `text-lg font-semibold tracking-tight` |
| Card title | `text-sm` or `text-base font-semibold` |
| Body | `text-sm` |
| Meta / description | `text-xs text-muted-foreground` (page descriptions: `text-sm`) |
| Eyebrow / group label | `text-[10px] font-semibold uppercase tracking-wider text-muted-foreground` |
| Stat number | `text-3xl font-semibold tracking-tight` |

Weights: `font-medium` for row titles and labels, `font-semibold` for headings. **`font-black`,
`uppercase tracking-[0.3em]` display text, and 9px labels are banned** (they were the old
"neon" style).

### 2.4 Spacing & layout

- Page padding: `p-6 md:p-8`. Page max-width: `max-w-7xl` (grids), `max-w-5xl` (lists),
  `max-w-3xl` (reading: docs, inbox, settings).
- Vertical rhythm between page blocks: `space-y-6` (dense pages) or `space-y-10` (overview
  with sections).
- Grid gap: `gap-4` (cards ≤150px), `gap-5` (bookmark/board cards).
- Row padding in list cards: `px-4 py-3` (docs), `px-3 py-2.5` (bookmark list rows),
  `p-3.5` (overview lists).
- Header height: `h-14`. Sidebar width: shadcn default (`16rem`, icon mode `3rem`).

### 2.5 Radius, borders, elevation

- `--radius: 0.625rem`. Cards/dialogs `rounded-xl`, inputs/buttons `rounded-lg` (shadcn
  default), chips `rounded-full`, icon chips `rounded-md`.
- Borders are 1px `border` everywhere. Dashed borders (`border-dashed`, `border-2` for
  create-tiles) mean "nothing here yet / create".
- Shadows: **none at rest**. `hover:shadow-md` is allowed on interactive cards only.
  Popovers/dialogs use shadcn's built-in `shadow-md`.
- Glass/blur only on the sticky header and editor toolbar (`bg-background/80 backdrop-blur`).

### 2.6 Iconography

Lucide only. Sizes: `size-4` in buttons/rows, `size-3.5` in chips/badges, `size-5` in stat
cards, `size-6` next to page titles, `size-8` in empty states. Icons in rows are
`text-muted-foreground` unless they carry workspace identity (`text-canvas` for board rows).

### 2.7 Motion

- Prefer CSS transitions: `transition-colors`, `transition-transform`, `duration-200`.
- Allowed micro-motions: card `hover:scale-[1.02]`, preview image `group-hover:scale-105`
  over `duration-700`, chevron `group-hover:translate-x-0.5`.
- Framer/`motion` is **not** used inside the dashboard (only on the marketing page and
  inside the canvas). Radix/shadcn primitives already animate open/close.
- Respect `prefers-reduced-motion` for any keyframe you add (see `tokens.css`).

---

## 3. App shell

```
┌ Sidebar (collapsible → icon rail) ┬ Header h-14 sticky: [☰] | Breadcrumbs …… [Search ⌘K] …… [✨AI] [🔔] [☀] [avatar] ┐
│  Logo + wordmark                  │                                                                                     │
│  User card (avatar, name, email)  │  <main class="flex-1 overflow-auto">                                                │
│  ─ Overview                       │      <page>  p-6 md:p-8, max-w-*, mx-auto                                           │
│  ─ Bookmarks   (brand)            │                                                                                     │
│  ─ Canvas      (canvas)           │                                                                                     │
│  ─ Docs        (docs)             │                                                                                     │
│  QUICK ACCESS  [Docs|Boards|Star] │                                                                                     │
│    scrollable 184px list          │                                                                                     │
│  … (mt-auto)                      │                                                                                     │
│  ─ Inbox  •unread                 │                                                                                     │
│  ─ Settings                       │                                                                                     │
│  ┌ AI card (indigo tint) ┐        │                                                                                     │
└───────────────────────────────────┴─────────────────────────────────────────────────────────────────────────────────────┘
Overlays mounted once in the layout: <SearchCommand/> (⌘K palette) and <AiChatPanel/> (right Sheet).
```

Rules:
- The sidebar **active** item = left `3px` rule in the workspace accent + horizontal
  gradient wash `from-{accent}/20 to-transparent` + `font-semibold text-foreground`. Inactive
  items are `text-muted-foreground`.
- Breadcrumbs are derived from the route (`Dashboard › Docs › 📄 Page › 📄 Subpage`); entity
  names come from the store, with a `Skeleton` while loading.
- Header actions are all `variant="ghost" size="icon"`. Exactly one accent icon (✨ in `ai`).
- Everything under `/dashboard` reads data with `useWorkspace()` and opens overlays with
  `useShell()`. Pages never fetch on their own.

Files: `src/app/(main)/dashboard/layout.tsx`, `src/modules/main/*`.

---

## 4. Page anatomy

Every page follows this order. Omit a layer only if it truly has nothing in it.

```
<div class="mx-auto w-full max-w-7xl space-y-6 p-6 md:p-8">
  <PageHeader icon title description actions />      ← one primary button (filled), rest outline
  <Rail | Tabs>                                       ← optional: spaces chips / All·Favorites·Recent
  <Toolbar: [segmented filters]  [search] [view]>     ← border-b pb-3, wraps on mobile
  <Content: grid | list-card | canvas>
  <Dialogs / AlertDialogs>                            ← rendered last, controlled by state
</div>
```

- **Primary action**: exactly one `<Button size="sm">` (filled) per page, placed in
  `PageHeader.actions`, right-most. Secondary actions are `variant="outline" size="sm"`.
- **Toolbars** use the segmented control pattern: `rounded-md border bg-muted p-1`, buttons
  `rounded-sm px-3 py-1.5 text-xs font-medium`, active = `bg-background shadow-sm`.
- **Search inputs** are `h-8 pl-8` with a `size-4` Lucide `Search` icon absolutely placed at
  `left-2.5`.

---

## 5. Component vocabulary

Only these building blocks (see `COMPONENTS.md` for code):

| Need | Use |
|---|---|
| Page heading | `PageHeader` / `SectionHeader` (`modules/main/PageHeader.tsx`) |
| Card grid item | `Card` (shadcn) with `p-0` + explicit padding; tint via `gradientFor(i)` |
| List | `div.divide-y.rounded-lg.border.bg-card` + rows `group flex items-center gap-3/4` |
| Filter chips | `SpaceChip` pattern (`rounded-full border px-3 h-8 text-xs`) |
| Row actions | `DropdownMenu` behind `MoreHorizontal` icon button; appears on hover (`opacity-0 group-hover:opacity-100`) |
| Create / edit | `Dialog` (`sm:max-w-lg` forms, `sm:max-w-sm` single field) |
| Confirm destructive | `AlertDialog` with `AlertDialogAction variant="destructive"` |
| Side panel | `Sheet side="right"` (AI copilot) |
| Menu on avatar | `DropdownMenu` (`UserMenu`) |
| Global search | `CommandDialog` + `Command` (`SearchCommand`) |
| Loading | `Skeleton` shaped like the final content (same height/rows) |
| Empty | `Empty` + `EmptyMedia variant="icon"` + one CTA, wrapped in `border border-dashed` |
| Status | `Badge` `secondary` (category), `outline` (space/role), accent-tinted for owner/editor |
| Toast | `sonner` via `toast.success/error` — short, sentence case, no emoji |

Banned: custom modals, custom dropdowns, `confirm()`, `alert()`, inline `style` colours,
`zinc-*` classes, `font-black`, glassmorphism cards, neon glows.

---

## 6. States

| State | Rule |
|---|---|
| Loading | Skeletons, never spinners for page content. Spinners only inside buttons (`Loader2 animate-spin`) and for the editor room. |
| Empty | `Empty` block, dashed border, ≤2 sentences, 1 CTA. Different copy for "filtered to nothing" vs "nothing exists". |
| Hover | Rows: `hover:bg-muted/40`; row title takes the workspace accent (`group-hover:text-docs`). Cards: `hover:shadow-md` or `hover:scale-[1.02]`, never both. |
| Selected | `bg-{accent}/10 border-{accent}/40` (chips) or `bg-background shadow-sm` (segmented). |
| Disabled | shadcn default (`opacity-50`, `cursor-not-allowed`). |
| Destructive | red text/icon only in menus; filled red only on the `AlertDialogAction`. |
| Read-only | "View only" pill (`bg-muted text-[10px] uppercase`) in the editor toolbar. |
| Realtime unavailable | `LiveblocksUnavailable` block — names the env var to set. Never a crash. |

---

## 7. Where colour is allowed (checklist)

- ✅ Sidebar active rule/icon, `PageHeader` icon, section-title icon
- ✅ Row-title hover colour
- ✅ Stat card icon
- ✅ Board / stat card *tint* (`bg-linear-to-br` from `CARD_GRADIENTS`, ≤ 25% alpha in dark)
- ✅ Star (amber), unread dot (`ai`), owner crown (amber)
- ✅ Comment highlights in the editor (`docs/18`)
- ❌ Button fills (only `primary` neutral)
- ❌ Backgrounds of pages/sections
- ❌ Body or meta text
- ❌ More than one accent on the same component

---

## 8. Responsive

- Sidebar collapses to an icon rail (`collapsible="icon"`); on `<md` it becomes a sheet.
- Header search trigger hides below `md`; ⌘K still works.
- Toolbars stack (`flex-col sm:flex-row`). Chips rails scroll horizontally (`overflow-x-auto no-scrollbar`).
- Grids: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`.
- Doc editor: anchored comment column only `≥xl`; below that, floating threads.
- The canvas board reserves `h-[calc(100vh-5.5rem)]`.

---

## 9. Accessibility

- Every icon-only button has `aria-label`. Every tooltip has a real label.
- Focus rings are shadcn's (`ring-ring/50`); never `outline-none` without a replacement
  (the only exception is the doc title input, which has a visible caret and placeholder).
- Contrast: `muted-foreground` is `oklch 0.5` on light / `0.708` on dark — meets AA on
  `background`. Don't use `muted-foreground/50` for text, only for decorative icons.
- Dialogs always have `DialogTitle` + `DialogDescription`; palette uses `title`/`description` props.
- Row click targets: whole row is a `<Link>`/button; kebab menus stop propagation.

---

## 10. Copy

Sentence case everywhere ("Save link", not "SAVE LINK"). Descriptions are one sentence,
end with a period. Empty states say what the thing is and how to create it. Buttons are
verb + noun ("New page", "Save link", "Invite"). No exclamation marks, no "God-level".

---

## 11. Do / Don't (for agents)

```
DO   <Button size="sm"><Plus />New page</Button>
DON'T <button className="px-6 py-3 bg-gradient-to-r from-emerald-500 ... uppercase tracking-widest">

DO   <p className="text-xs text-muted-foreground">Edited {timeAgo(n.updated_at)}</p>
DON'T <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]">

DO   <div className="divide-y rounded-lg border bg-card"> …rows… </div>
DON'T <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem]">

DO   confirm with <AlertDialog>; DON'T use window.confirm()
DO   read data with useWorkspace(); DON'T call supabase from a page component
DO   put the page body in src/modules/<feature>/; DON'T put JSX in app/**/page.tsx
```

---

## 12. Style code

Everything below is the actual, copy-paste-able styling that produces the UI. 12.1 is
verbatim from `src/app/globals.css` (canonical). If you change one, change the other:
`node design/scripts/new-module.mjs --sync-tokens` copies globals.css into `design/tokens.css`.

### 12.1 Global stylesheet (tokens, base, editor prose, Liveblocks)

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

/* ─────────────────────────────────────────────────────────────────────────────
   Design tokens (shadcn/ui, neutral base) + Cognify brand accents.
   Light is the default; `.dark` is toggled on <html> by next-themes.
   ───────────────────────────────────────────────────────────────────────────── */
:root {
  --background: oklch(0.99 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.5 0 0);
  --accent: oklch(0.96 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.7 0.19 47);
  --chart-2: oklch(0.7 0.15 162);
  --chart-3: oklch(0.65 0.2 20);
  --chart-4: oklch(0.6 0.2 275);
  --chart-5: oklch(0.556 0 0);
  --radius: 0.625rem;
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.955 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);

  /* Brand accents — one per workspace */
  --brand: oklch(0.7 0.19 47);          /* orange  → bookmarks */
  --brand-foreground: oklch(0.985 0 0);
  --canvas: oklch(0.65 0.2 20);         /* rose    → canvas */
  --docs: oklch(0.7 0.15 162);          /* emerald → docs */
  --ai: oklch(0.6 0.2 275);             /* indigo  → AI */
}

.dark {
  --background: oklch(0.13 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.17 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.18 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.24 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.22 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.26 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --sidebar: oklch(0.16 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.7 0.19 47);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.24 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);

  --brand: oklch(0.75 0.18 50);
  --brand-foreground: oklch(0.145 0 0);
  --canvas: oklch(0.7 0.19 18);
  --docs: oklch(0.75 0.15 160);
  --ai: oklch(0.7 0.16 280);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-brand: var(--brand);
  --color-brand-foreground: var(--brand-foreground);
  --color-canvas: var(--canvas);
  --color-docs: var(--docs);
  --color-ai: var(--ai);

  --font-sans: var(--font-sans), ui-sans-serif, system-ui, sans-serif;
  --font-heading: var(--font-heading), var(--font-sans), sans-serif;
  --font-mono: var(--font-mono), ui-monospace, monospace;

  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  html {
    scroll-behavior: smooth;
  }
  body {
    @apply bg-background text-foreground font-sans antialiased;
  }
  h1, h2, h3, h4, h5, h6 {
    @apply font-heading tracking-tight;
  }
}

/* ─── Scrollbars ─── */
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: color-mix(in oklch, var(--foreground) 15%, transparent); border-radius: 20px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: color-mix(in oklch, var(--foreground) 30%, transparent); }
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

/* ─── Motion ─── */
@keyframes gradient-x { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
.animate-gradient-x { background-size: 200% 200%; animation: gradient-x 3s ease infinite; }
.animate-shimmer { animation: shimmer 2s ease-in-out infinite; }

/* Canvas: trigger-anchored popover entrance */
@keyframes popover-in {
  from { opacity: 0; transform: scale(0.94) translateY(-4px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.animate-popover-in { animation: popover-in 160ms cubic-bezier(0.23, 1, 0.32, 1); transform-origin: left center; }

/* Canvas: card mount entrance. Opacity-only — the card's own `transform` is
   live position data (translate3d), so animating transform would fight it. */
@keyframes card-in { from { opacity: 0; } to { opacity: 1; } }
.animate-card-in { animation: card-in 160ms cubic-bezier(0.23, 1, 0.32, 1); }

@media (prefers-reduced-motion: reduce) {
  .animate-popover-in, .animate-card-in { animation: none; }
}

/* ─── Doc editor prose (theme-aware) ─── */
.cognify-prose { color: var(--foreground); font-size: 1rem; line-height: 1.75; }
.cognify-prose > * + * { margin-top: 0.85rem; }
.cognify-prose h1 { font-size: 1.875rem; font-weight: 700; line-height: 1.2; margin-top: 1.75rem; letter-spacing: -0.02em; }
.cognify-prose h2 { font-size: 1.5rem; font-weight: 700; line-height: 1.25; margin-top: 1.5rem; letter-spacing: -0.02em; }
.cognify-prose h3 { font-size: 1.25rem; font-weight: 600; line-height: 1.3; margin-top: 1.25rem; }
.cognify-prose p { color: color-mix(in oklch, var(--foreground) 85%, transparent); }
.cognify-prose strong { color: var(--foreground); font-weight: 600; }
.cognify-prose a { color: var(--docs); text-decoration: underline; }
.cognify-prose ul { list-style: disc; padding-left: 1.5rem; }
.cognify-prose ol { list-style: decimal; padding-left: 1.5rem; }
.cognify-prose li + li { margin-top: 0.25rem; }
.cognify-prose blockquote { border-left: 3px solid var(--docs); padding-left: 1rem; color: var(--muted-foreground); font-style: italic; }
.cognify-prose code { background: var(--muted); padding: 0.15rem 0.4rem; border-radius: 0.375rem; font-family: var(--font-mono); font-size: 0.875em; }
.cognify-prose pre { background: var(--muted); border: 1px solid var(--border); padding: 1rem; border-radius: 0.75rem; overflow-x: auto; }
.cognify-prose pre code { background: transparent; padding: 0; }
.cognify-prose hr { border-color: var(--border); margin: 1.5rem 0; }
.cognify-prose ul[data-type="taskList"] { list-style: none; padding-left: 0.25rem; }
.cognify-prose ul[data-type="taskList"] li { display: flex; gap: 0.6rem; align-items: flex-start; }
.cognify-prose ul[data-type="taskList"] li > label { margin-top: 0.3rem; }
.cognify-prose ul[data-type="taskList"] li[data-checked="true"] > div { text-decoration: line-through; color: var(--muted-foreground); }
.cognify-prose input[type="checkbox"] { accent-color: var(--docs); width: 1rem; height: 1rem; }
.cognify-prose .is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: var(--muted-foreground);
  pointer-events: none;
  height: 0;
}

/* ─── Liveblocks (comments / threads / AI chat) ─── */
:root {
  --lb-accent: var(--docs);
  --lb-radius: var(--radius);
}
.anchored-threads {
  display: block;
  position: absolute;
  top: 0;
  left: 100%;
  width: 300px;
  max-width: 300px;
  margin-left: 24px;
}
.floating-threads { display: none; }
.floating-composer { width: 350px; }
@media (max-width: 1279px) {
  .anchored-threads { display: none; }
  .floating-threads { display: block; width: min(350px, calc(100vw - 2rem)); }
}
.cognify-prose .lb-tiptap-thread-mark { background: color-mix(in oklch, var(--docs) 18%, transparent); border-bottom: 2px solid var(--docs); }
.cognify-prose .lb-tiptap-thread-mark-selected { background: color-mix(in oklch, var(--docs) 32%, transparent); }
```

### 12.2 Fonts and providers (root layout)

```tsx
// src/app/layout.tsx
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
const geist        = Geist({ subsets: ["latin"], variable: "--font-sans" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-heading" });
const geistMono    = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

<html lang="en" suppressHydrationWarning>
  <body className={cn(geist.variable, spaceGrotesk.variable, geistMono.variable, "min-h-screen antialiased")}>
    <ThemeProvider>                      {/* next-themes, attribute="class", system default */}
      <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
      <Toaster position="top-right" richColors closeButton />
    </ThemeProvider>
  </body>
</html>
```

### 12.3 Class recipes (the "style code" of each element, Tailwind v4)

```txt
# Page wrapper
mx-auto w-full max-w-7xl space-y-6 p-6 md:p-8            (grid pages)
mx-auto w-full max-w-5xl space-y-6 p-6 md:p-8            (list pages)
mx-auto w-full max-w-3xl space-y-8 p-6 md:p-8            (reading pages)

# Header (shell)
sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60

# Page title / description
text-2xl font-semibold tracking-tight sm:text-3xl        + icon: size-6 shrink-0 text-{accent}
mt-1 text-sm text-muted-foreground

# Section title
flex items-center gap-2 text-lg font-semibold tracking-tight   + icon: size-4 text-{accent}

# Eyebrow label
text-[10px] font-semibold uppercase tracking-wider text-muted-foreground

# Sidebar nav item (inactive -> active)
h-10 px-3 text-muted-foreground transition-all duration-200
-> bg-transparent! bg-linear-to-r to-transparent text-foreground! font-semibold rounded-md border-l-[3px] pl-[9px] from-{accent}/20 border-{accent}
   group-data-[collapsible=icon]:border-l-0 group-data-[collapsible=icon]:pl-2

# Segmented control
container: flex items-center gap-1 rounded-md border bg-muted p-1
item:      rounded-sm px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground
active:    bg-background text-foreground shadow-sm

# Search input
wrapper: relative w-full sm:w-64
icon:    absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground
input:   h-8 pl-8

# Chip (filter rail)
group flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors
inactive: bg-card text-muted-foreground hover:bg-muted hover:text-foreground
active:   border-brand/40 bg-brand/10 text-foreground
count:    Badge h-4 min-w-4 px-1 text-[10px]  (active: bg-brand text-brand-foreground)

# List card + row
container: divide-y overflow-hidden rounded-lg border bg-card
row:       group relative flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/40
row title: truncate text-sm font-medium group-hover:text-{accent}
row meta:  text-xs text-muted-foreground
row link:  absolute inset-0 (Link)  / kebab: relative z-10 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100
chevron:   size-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5

# Tinted card (boards / stats)
group relative h-[180px] overflow-hidden bg-linear-to-br p-0 transition-transform hover:scale-[1.02] + gradientFor(i)
footer: absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-white/20 bg-black/5 px-4 py-2.5 text-[11px] font-medium text-foreground/70 backdrop-blur-xs dark:bg-white/5

# Create tile
flex h-[180px] items-center justify-center rounded-xl border-2 border-dashed text-sm font-medium text-muted-foreground transition-colors hover:border-{accent}/60 hover:bg-{accent}/5 hover:text-foreground

# Stat card
Card: h-full transition-colors hover:bg-muted/40 / CardContent: flex items-center justify-between p-5
label: text-xs font-medium text-muted-foreground / number: mt-1 text-3xl font-semibold tracking-tight / icon: size-5 text-{accent}

# Bookmark grid card
Card: group flex h-full flex-col overflow-hidden p-0 transition-shadow hover:shadow-md
preview: relative block aspect-[16/9] overflow-hidden bg-muted / img: size-full object-cover transition-transform duration-700 group-hover:scale-105
overlay buttons: absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 / Button size=icon-sm variant=secondary bg-background/80 backdrop-blur
category badge: absolute bottom-2 left-2 bg-background/80 text-foreground backdrop-blur
favicon chip: flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-background
body: flex flex-1 flex-col gap-3 p-4

# Icon chip (dialog headers, empty states, templates)
flex size-9 items-center justify-center rounded-md bg-{accent}/15 text-{accent}
flex size-10 items-center justify-center rounded-lg border bg-muted/40

# Empty state
Empty: border border-dashed / EmptyMedia variant=icon / one Button size=sm

# Editor toolbar (docs)
sticky top-14 z-10 mb-6 flex flex-wrap items-center gap-0.5 rounded-lg border bg-background/90 p-1.5 backdrop-blur supports-[backdrop-filter]:bg-background/70
button: flex size-8 shrink-0 items-center justify-center rounded-md transition-colors
active: bg-docs/15 text-docs / rest: text-muted-foreground hover:bg-muted hover:text-foreground / divider: mx-1 h-5 w-px bg-border
view-only pill: mr-1 rounded-md bg-muted px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground

# Doc title input
min-w-0 flex-1 bg-transparent font-heading text-3xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/50 sm:text-4xl

# Theme tile (settings)
flex flex-col items-center gap-2 rounded-lg border p-4 text-sm transition-colors hover:bg-muted/50 / selected: border-foreground bg-muted/60 font-medium

# Unread dot
size-2 rounded-full bg-ai  (header: absolute top-1.5 right-1.5 ring-2 ring-background)

# AI sheet
SheetContent side=right: flex w-full flex-col gap-0 p-0 sm:max-w-md / header: border-b px-5 py-4

# Slash menu (editor)
custom-scrollbar max-h-80 w-72 overflow-y-auto rounded-lg border bg-popover p-1.5 text-popover-foreground shadow-md
item: flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left / selected: bg-accent text-accent-foreground
icon: flex size-8 shrink-0 items-center justify-center rounded-md border / selected: border-docs/40 bg-docs/10 text-docs
```

### 12.4 shadcn configuration

```json
// components.json
{ "style": "radix-nova", "rsc": true, "tsx": true,
  "tailwind": { "css": "src/app/globals.css", "baseColor": "neutral", "cssVariables": true },
  "iconLibrary": "lucide",
  "aliases": { "components": "@/components", "ui": "@/components/ui", "utils": "@/lib/utils", "lib": "@/lib", "hooks": "@/hooks" } }
```

Install / refresh primitives with:

```bash
npx shadcn@latest add -y -o button card dialog alert-dialog input label badge skeleton separator sidebar breadcrumb dropdown-menu popover tabs avatar scroll-area select switch textarea sonner kbd command tooltip progress spinner empty toggle-group sheet
```
