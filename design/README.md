# Cognify `design/`

Everything about how the app (`/dashboard/**`) looks and is built, in one folder. Read in
this order:

| File | What it is |
|---|---|
| [`DESIGN.md`](./DESIGN.md) | The design system: philosophy, tokens, type, spacing, shell, page anatomy, states, colour rules, a11y, copy, do/don't — **and §12 "Style code"** with the full stylesheet, fonts, class recipes and shadcn config. |
| [`tokens.css`](./tokens.css) | Verbatim copy of the app stylesheet (`src/app/globals.css`, minus landing-only rules). |
| [`tokens.json`](./tokens.json) | Same tokens as data (light/dark colours, fonts, type scale, layout, gradients, motion) for tooling and agents. |
| [`COMPONENTS.md`](./COMPONENTS.md) | Catalog: which shadcn primitives are used and how, plus every Cognify composite with code. |
| [`PAGES.md`](./PAGES.md) | Wireframe + structure + states + source file for every dashboard route (Overview, Bookmarks, Canvas, Board, Docs, Page, Inbox, Settings, ⌘K, AI). |
| [`PATTERNS.md`](./PATTERNS.md) | Architecture: folder contract, data flow (Supabase + Liveblocks), URL state, overlays, loading/empty/error contract, theming, auth, API conventions, "add a workspace" walkthrough. |
| [`REFERENCES.md`](./REFERENCES.md) | What was borrowed from looma / aria / wekraft (file → file), and what was deliberately not. |
| [`snippets/`](./snippets) | Copy-paste-ready TSX: `page-header`, `page-template`, `list-row`, `gradient-card`, `chip-rail`, `toolbar`, `empty-state`, `confirm-dialog`, `stat-card`. |
| [`scripts/new-module.mjs`](./scripts/new-module.mjs) | Scaffolds a new page the right way (module + route + nav entry). `--sync-tokens` refreshes `tokens.css`. |

## Quick start for a new page

```bash
node design/scripts/new-module.mjs snippets --title Snippets --icon Code2 --accent ai
```

Then wire data in `src/lib/provider/WorkspaceProvider.tsx` and follow the checklist at the
end of `PAGES.md`.

## For AI agents

Load `DESIGN.md` first. It is written as constraints (banned classes, allowed accent
opacities, one primary button per page, etc.). Use `snippets/page-template.tsx` as the
starting shape for any new page and `COMPONENTS.md` to pick primitives. Never edit
`src/components/ui/*` by hand.
