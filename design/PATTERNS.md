# Cognify — Architecture & Interaction Patterns

How the UI is *wired*, so new work lands in the same shape.

---

## 1. Folder contract

```
src/
├─ app/                      # routing only
│  ├─ (web)/                 # marketing, dark-only layout
│  ├─ (auth)/                # /login, dark-only layout
│  ├─ (main)/dashboard/      # app shell layout + thin page.tsx files
│  └─ api/                   # route handlers (Liveblocks auth/rooms/users, share, analyze)
├─ modules/<feature>/        # ALL feature UI. One folder per nav item + main/ai/inbox
├─ components/ui/            # shadcn only (generated)
├─ components/motion/        # decorative primitives for the marketing page
├─ components/*.tsx          # cross-cutting non-shadcn (LiveblocksBoundary)
├─ lib/provider/             # ThemeProvider · WorkspaceProvider · LiveblocksProvider
├─ lib/static.ts             # nav + config constants
├─ lib/format.ts             # text helpers
├─ hooks/                    # useWorkspace re-export, use-mobile
└─ proxy.ts                  # Next 16 proxy (auth gate)
```

Rule of thumb: **`app/` decides *where*, `modules/` decides *what*, `lib/provider` decides
*data*, `components/ui` decides *how it looks at the primitive level*.**

---

## 2. Data flow

```
Supabase (Postgres + RLS + Realtime)
        │  load once per table · postgres_changes → refetch that table
        ▼
WorkspaceProvider  ── useWorkspace() ──▶  pages / sidebar / breadcrumbs / palette
        │  optimistic CRUD (setState first, revert on error, toast on error)
        ▼
Supabase
```

- Pages **never** import `supabase` (exception: `TemplateGallery`, `MilanoteCanvas` — the
  canvas is a self-contained tool).
- Realtime keeps multiple tabs / collaborators' lists in sync without polling.
- Shared docs arrive through RLS (`notes` SELECT policy includes `has_note_share`), so the
  same `notes` array contains own + shared pages; UI distinguishes with `n.user_id !== user.id`.

Liveblocks is a second, parallel data plane for **in-document** state:

```
LiveblocksProviders (authEndpoint=/api/liveblocks-auth, resolveUsers, resolveMentionSuggestions)
   └─ NoteRoom → POST /api/liveblocks-rooms (ensures room + permissions from note_shares)
        └─ RoomProvider(note:<id>) → NoteEditor (Yjs) · Threads (comments) · AvatarStack
```

Permissions are derived from the DB on every room open (`lib/note-access.ts`), so the DB
is the single source of truth and Liveblocks is never edited by hand.

---

## 3. URL as state

| Page | Param | Meaning |
|---|---|---|
| Bookmarks | `space` | selected container id |
| Bookmarks | `filter` | `favorites` · `today` · `shortcuts` |
| Bookmarks | `new=1` | open the Save-link dialog (used by ⌘K + overview) |
| Docs page | path `[noteId]` | the open page; breadcrumbs walk `parent_id` |
| Board | path `[boardId]` | the open board |

Use `router.replace(..., { scroll: false })` for filter changes; `router.push` for navigation.
Pages that read `useSearchParams` are wrapped in `<Suspense>` in their `page.tsx`.

---

## 4. Overlay state

Shell-level overlays (⌘K palette, AI sheet) are mounted once in the layout and toggled via
`useShell()`. Page-level overlays (dialogs, alert dialogs) are local `useState` in the page
module, rendered at the bottom of the page JSX. Pattern for "editing X":

```ts
const [editing, setEditing] = useState<Bookmark | null>(null);
<EditLinkDialog bookmark={editing} onOpenChange={(o) => !o && setEditing(null)} … />
```

---

## 5. Loading / empty / error contract

```
if (loading)      → skeleton in the exact shape (same container classes, Skeleton children)
else if (!items)  → <Empty> with 1 CTA; different copy when a search/filter produced 0
else              → content
```

Errors from actions surface as `toast.error('Failed to …: ' + message)` and revert the
optimistic change. Errors from Liveblocks surface as `LiveblocksUnavailable` inside a
`LiveblocksBoundary`; the app never shows a Next error page for a missing key.

---

## 6. Navigation config drives three surfaces

`lib/static.ts` → `NAV_ITEMS` / `SECONDARY_NAV_ITEMS` (`title, url, icon, accent, nested`).

- `AppSidebar` renders them and computes active state (`nested` matches sub-routes).
- `BreadCrumbs` picks the longest matching item as the section crumb.
- `SearchCommand` lists them under "Navigate".

Adding a feature = one entry there + one route + one module (see `scripts/new-module.mjs`).

---

## 7. Theming mechanics

- `ThemeProvider` (`next-themes`, `attribute="class"`) toggles `.dark` on `<html>`.
- shadcn tokens, Liveblocks (`styles/dark/attributes.css`), tldraw and the canvas all key
  off that one class.
- Marketing/auth route groups hard-wrap their content in `<div class="dark …">` so they stay
  dark regardless of the user's choice.
- Never read `theme` to branch JSX; use `dark:` utilities. Exception: the canvas, which takes
  `resolvedTheme` as a prop because it paints with raw colours.

---

## 8. Auth gate

`proxy.ts` (Next 16) refreshes the Supabase cookie session on `/dashboard/*`, `/login`,
`/register`; redirects logged-out users to `/login` and logged-in users away from `/login`.
`WorkspaceProvider` repeats the check client-side and listens to `onAuthStateChange`.

---

## 9. API route conventions

- `createSupabaseServerClient()` (cookie-bound) for "who is calling"; `createSupabaseAdminClient()`
  (service role) only for cross-user reads (`auth.admin.*`, share rows) after the caller is verified.
- Return `NextResponse.json({ error })` with the right status; the client shows `error` in a toast.
- Liveblocks server client is lazy (`getLiveblocks()`) so a missing key is a request-time 500
  with a readable message, not an import crash.

---

## 10. Adding a new workspace (worked example: "Snippets")

1. `lib/static.ts` → add `{ title: 'Snippets', url: '/dashboard/snippets', icon: Code2, accent: 'ai', nested: true }`.
2. `lib/provider/WorkspaceProvider.tsx` → add `snippets` state, `loadSnippets`, realtime
   subscription, `addSnippet/updateSnippet/deleteSnippet`.
3. `modules/snippets/SnippetsPage.tsx` → `PageHeader` + toolbar + list/grid + dialogs,
   following `DocsPage.tsx`.
4. `app/(main)/dashboard/snippets/page.tsx` → `export default () => <SnippetsPage />`.
5. Optional: `SearchCommand` group, overview section, quick-access tab.

Or run: `node design/scripts/new-module.mjs snippets --title Snippets --icon Code2 --accent ai`.
