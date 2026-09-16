# Cognify — Page Specs

One section per dashboard route. Each gives: purpose · URL/state · wireframe · structure (in
render order) · data · states · interactions · source. The marketing page and `/login` are out
of scope (see `DESIGN.md §1`).

Legend for wireframes: `[Btn]` filled primary · `(Btn)` outline · `{chip}` · `▤` list card ·
`▦` grid · `░` skeleton/placeholder.

---

## 0. Shell (all routes) — `src/app/(main)/dashboard/layout.tsx`

```
┌──────────────┬──────────────────────────────────────────────────────────────────┐
│ ▣ Cognify    │ ☰ │ Dashboard › Section › Entity      [🔍 Search links… ⌘K]  ✨ 🔔 ☀ ◯ │
│ ◯ name/email │──────────────────────────────────────────────────────────────────│
│ ▸ Overview   │                                                                  │
│ ▸ Bookmarks  │                         <page>                                   │
│ ▸ Canvas     │                                                                  │
│ ▸ Docs       │                                                                  │
│ QUICK ACCESS │                                                                  │
│ [Docs|Boards]│                                                                  │
│  ░ list      │                                                                  │
│              │                                                                  │
│ ▸ Inbox •    │                                                                  │
│ ▸ Settings   │                                                                  │
│ ┌ AI card ┐  │                                                                  │
└──────────────┴──────────────────────────────────────────────────────────────────┘
```

- Providers (outer → inner): `WorkspaceProvider` → `LiveblocksProviders` → `ShellProvider`
  → `SidebarProvider`.
- Overlays mounted once: `SearchCommand` (⌘K / Ctrl+K), `AiChatPanel` (Sheet).
- Header: `sticky top-0 z-30 h-14 border-b bg-background/80 backdrop-blur`.
- Unauthenticated: `proxy.ts` redirects to `/login` server-side; `WorkspaceProvider` also
  redirects client-side if the session vanishes.

---

## 1. Overview — `/dashboard` — `modules/dashboard/DashboardPage.tsx`

Purpose: land the user, show counts, and surface the most recent items of each workspace.

```
Good morning
Welcome back, Sandeep                                        (✨ Ask AI) [＋ New page]
3 spaces · 42 links · 9 pages · 4 boards

▦ Links saved 42 🔖 │ Boards 4 ⧉ │ Pages 9 📄 │ Starred 6 ★          ← 4 stat cards, link to each section

⧉ Visual boards  Freeform canvases…                                  (View all →)
▦ [＋ New board] [tint card] [tint card] [tint card]

🔖 Recent links (3/5 cols)                     📄 Recent pages (2/5 cols)
▤ favicon · title · host · time · badge · ★     ▤ icon · title · edited · →
```

- Layout: `max-w-7xl space-y-10`. Stats `grid-cols-2 lg:grid-cols-4`. Bottom `grid lg:grid-cols-5`.
- Data: everything from `useWorkspace()`; recentPages sorted by `updated_at`, top 4;
  recentLinks top 6; boards top 3.
- States: greeting name → `Skeleton h-8 w-56`; stat numbers → `Skeleton h-8 w-12`; lists →
  5/4 skeleton rows; empty lists → `EmptyRow` with CTA.
- Interactions: "New page" creates and navigates; "New board" tile creates "Untitled board"
  and navigates; "Ask AI" opens the sheet.

---

## 2. Bookmarks — `/dashboard/bookmarks` — `modules/bookmarks/BookmarksPage.tsx`

Purpose: every saved link, organised by *spaces* (containers) with quick filters and search.

URL state: `?space=<id>` · `?filter=favorites|today|shortcuts` · `?new=1` (opens Save dialog).

```
🔖 Bookmarks (or "<Space name>")                          (⊞ New space) [＋ Save link]
Every link you've saved, organised into spaces.

{🔖 All 42} {📁 Design 12 ⋯} {📁 Research 7 ⋯} {＋…}           ← horizontal chip rail (no-scrollbar)

[All links | Favorites | Added today | Shortcuts]      [🔍 Search links…] [▦|☰]
──────────────────────────────────────────────────────────────────────────
▦ grid 1/2/3/4 cols of BookmarkCard          or        ▤ list rows
```

- Space chips: active = `border-brand/40 bg-brand/10`; count badge; kebab → "Delete space"
  (`AlertDialog`; links become unsorted).
- Filtering is pure/memoised over `bookmarks`; search matches title/url/description/category/tags.
- View toggle persists only for the session (no localStorage — avoids hydration mismatch).
- Dialogs: `SaveLinkDialog` (URL → `/api/analyze` → details), `EditLinkDialog`,
  `CreateSpaceDialog`, delete link `AlertDialog`, delete space `AlertDialog`.
- Loading: 8 skeletons `h-[300px] rounded-xl` (grid) / `h-14 rounded-lg` (list).
- Empty: differs for "no matches" (Clear search) vs "nothing here" (Save your first link).

### 2a. `BookmarkCard` grid anatomy

```
┌────────────────────────────┐
│ ▒ 16:9 preview   [★][⌘]    │ ← hover-revealed secondary icon buttons (bg-background/80)
│ {Category}                 │ ← Badge bottom-left
├────────────────────────────┤
│ ◻ favicon  Title       ⋯   │ ← title turns brand on hover; kebab menu
│            host.com        │
│ description (2 lines)      │
│ Space · 3h ago   {tag}{tag}│
└────────────────────────────┘
```

---

## 3. Canvas (boards) — `/dashboard/canvas` — `modules/canvas/CanvasBoardsPage.tsx`

```
⧉ Canvas                              [🔍 Search boards…] (⇅) [＋ New board]
Infinite boards for moodboards, plans and sketches.

Your boards (4)
▦ [＋ Create new board] [tint] [tint] [tint] [tint]        ← h-[180px], 1/2/3/4 cols
──────────────────────────────────────────────────────────────
Start from a template   Pre-built layouts…
▦ 4 template cards: icon chip + {Category} · name · description · (Use template →)
```

- Sort toggle flips `updated_at` order; search filters by name.
- Card kebab: Open / Delete (`AlertDialog`: "All cards and connectors… can't be undone").
- `CreateBoardDialog` (`sm:max-w-sm`, one field).
- `TemplateGallery` inserts a board with `tldraw_snapshot: { isNewTemplate, templateId }`;
  the canvas seeds it on first open. Templates live in `modules/canvas/templates.ts`.

## 3a. Board — `/dashboard/canvas/[boardId]` — `modules/canvas/BoardPage.tsx`

```
┌ p-3 md:p-4 ───────────────────────────────────────────────────────────┐
│ ┌ rounded-xl border bg-muted/30, h-[calc(100vh-5.5rem)] ─────────────┐ │
│ │  <MilanoteCanvas board userId theme setTheme onBackToBoards/>       │ │
│ └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

- Canvas is `dynamic(..., { ssr: false })` with a `CanvasSkeleton`.
- Theme is driven from `next-themes` `resolvedTheme`; the canvas' own toggle writes back.
- Not found → `Empty` with "Back to boards".
- The canvas itself (`MilanoteCanvas`, `CanvasCards`, `ConnectorLine`) keeps its own
  internal styling; it is a self-contained tool surface and is exempt from §5 token rules.

---

## 4. Docs — `/dashboard/docs` — `modules/docs/DocsPage.tsx`

```
📄 Docs                                         (🗃 New database) [＋ New page]
Block-based pages with nested subpages, realtime editing and comments.

[📄 All pages | ★ Favorites | 🕒 Recent | 👥 Shared with me (2)]        [🔍 Search pages…]
──────────────────────────────────────────────────────────────────────────
▤ icon · Title {Database} {Shared} ★ · "Edited 2h ago · 3 subpages"   ⋯  →
```

- `max-w-5xl`. Tabs derive lists: All = own top-level pages; Favorites; Recent = all by
  `updated_at` (20); Shared = `user_id !== me`. Search overrides tabs.
- Row kebab (owner only): Favorite / Open / Delete (`AlertDialog`).
- Empty copy varies by tab (Shared: "When someone invites you…").

## 4a. Page — `/dashboard/docs/[noteId]` — `modules/docs/NotePage.tsx`

```
📄  New idea                                             (👥 Share) ☆ 🗑
    Edited about 1 month ago · shared with you
┌ sticky toolbar top-14: H1 H2 H3 | B I S <> | • 1. ☑ " {} — | 💬 | ↶ ↷      Saved ✓ ◯◯ ┐
│                                                                                  │
│  .cognify-prose editor (min-h 40vh)                          ┃ anchored threads  │
│                                                              ┃ (≥xl, 300px col)  │
└──────────────────────────────────────────────────────────────┴───────────────────┘
SUBPAGES                                                          (＋ Add subpage)
▤ icon · title · →
```

- Width: `max-w-3xl`, plus `xl:pr-[324px]` to leave room for anchored comments.
- Icon = emoji button → `Popover` grid of `PAGE_ICONS` (owner only).
- Title = borderless input (`font-heading text-3xl sm:text-4xl font-bold`), commits on blur/Enter.
- Actions: Share (`ShareDialog`) for everyone; ★ and 🗑 owner only.
- Body: `NotionDatabase` when `content.kind === 'database'`, else `NoteRoom` → `NoteEditor`.
- Editor states: room loading spinner; `LiveblocksUnavailable` block if the key is missing or
  provisioning fails; "View only" pill for viewers (`useSelf(me => me.canWrite)`).
- Subpages section is owner-only (sharing doesn't cascade).
- Delete → `AlertDialog` → navigates to parent or `/dashboard/docs`.

### 4b. `ShareDialog`

```
Share "New idea"
Invite people by email. Editors can change the page; viewers can read and comment.
[✉ teammate@example.com     ] [✎ Can edit ▾] [👤＋ Invite]
PEOPLE WITH ACCESS
◯ Name / email ……………………………………………… {👑 Owner}
◯ Name / email …………………… [Can view ▾] 🗑
                                            (↩ Leave this page)   ← guests only
```

---

## 5. Inbox — `/dashboard/inbox` — `modules/inbox/NotificationsInbox.tsx`

```
🔔 Inbox                                                      (✓✓ Mark all read)
2 unread notifications  /  You're all caught up.
▤ Liveblocks InboxNotificationList (thread mentions/replies + custom $pageShared rows)
```

- `max-w-3xl`. Wrapped in `LiveblocksBoundary feature="Inbox"` + `ClientSideSuspense`
  with `InboxSkeleton`.
- `$pageShared` renders `InboxNotification.Custom` with "**Name** shared **Title** with you"
  and navigates to the page on click.
- Unread dot (`UnreadBadge`) is shared with header bell and sidebar.

---

## 6. Settings — `/dashboard/settings` — `modules/settings/SettingsPage.tsx`

```
⚙ Settings
Your account, appearance and workspace at a glance.
┌ Profile ──────────────────────────────┐  avatar 64 · name · email · uid; read-only inputs
┌ Appearance ───────────────────────────┐  [☀ Light] [☾ Dark] [🖥 System] 3-col selectable tiles
┌ Workspace ────────────────────────────┐  4 stat tiles (Links/Boards/Pages/Spaces) + tech badges
┌ Session ──────────────────────────────┐  [Sign out] destructive
```

- Stacked `Card`s with `CardHeader`(title+description) → `CardContent`/`CardFooter`.
- Theme tiles: `border-foreground bg-muted/60 font-medium` when selected.

---

## 7. Overlays

### 7a. ⌘K palette — `modules/main/SearchCommand.tsx`

```
┌ Type a command or search… ───────────────────────────┐
│ NAVIGATE   Overview · Bookmarks · Canvas · Docs · Inbox · Settings
│ ACTIONS    ✨ Ask Cognify AI · ＋ Save a link · ＋ New page · ＋ New board
│ PAGES      📄 title … (≤30)
│ BOARDS     ⧉ name … (≤20)
│ LINKS      🔖 title …………… host (≤40, opens in new tab)
└──────────────────────────────────────────────────────┘
```

### 7b. AI copilot — `modules/ai/AiChatPanel.tsx`

Right `Sheet` (`sm:max-w-md`): header (indigo icon chip, "Cognify AI", description) →
`AiChat` filling the rest. Empty state = icon chip + "How can I help?" + 3 outline
suggestion buttons. Knowledge registered: app description, current route, open page/board,
counts, recent page titles, recent bookmarks.

---

## 8. Page checklist (use when adding a route)

- [ ] `app/(main)/dashboard/<route>/page.tsx` is ≤10 lines and only renders the module.
- [ ] Module lives in `src/modules/<feature>/<Name>Page.tsx`, `'use client'`.
- [ ] Wrapper `mx-auto w-full max-w-* space-y-6 p-6 md:p-8`.
- [ ] `PageHeader` with icon in the workspace accent; one filled button.
- [ ] Skeleton, empty and error states present.
- [ ] Destructive actions use `AlertDialog`.
- [ ] Nav entry added to `lib/static.ts` (`NAV_ITEMS` or `SECONDARY_NAV_ITEMS`) so sidebar,
      breadcrumbs and ⌘K pick it up.
- [ ] Reads data through `useWorkspace()`; no direct Supabase calls in the module (canvas is
      the grandfathered exception).
