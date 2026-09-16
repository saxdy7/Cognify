# Cognify — Component Catalog

Two layers:

1. **Primitives** — generated shadcn/ui (Radix, "Nova" preset) in `src/components/ui/`.
   Never hand-edit; re-add with `npx shadcn@latest add <name>`.
2. **Composites** — Cognify-specific building blocks in `src/modules/**`. These are the
   things you reuse when building a new page. Copy-paste-ready versions live in
   `design/snippets/`.

---

## 1. Primitives in use

| Component | File | Cognify usage notes |
|---|---|---|
| `Button` | `ui/button.tsx` | sizes `sm` (page actions), `icon` (header), `icon-sm` (row kebabs). Variants: `default` = the one primary action; `outline` = secondary; `ghost` = icon buttons; `destructive` = AlertDialog confirm only. |
| `Card` | `ui/card.tsx` | Always `p-0` when the card has an image/preview area; use `CardHeader/Content/Footer` otherwise. |
| `Badge` | `ui/badge.tsx` | `secondary` = category; `outline` = space / role / template category; accent-tinted for owner/editor. |
| `Input`, `Textarea`, `Label` | `ui/*.tsx` | Search inputs: `h-8 pl-8` + absolute icon. Forms: `grid gap-2` per field, `grid gap-4` per form. |
| `Select` | `ui/select.tsx` | Role picker, category, space. `size="sm"` inside rows. Use a `__none__` sentinel for "no value". |
| `Dialog` | `ui/dialog.tsx` | Create/edit/share. `sm:max-w-lg` (forms), `sm:max-w-sm` (single field). Always `DialogTitle` + `DialogDescription`. |
| `AlertDialog` | `ui/alert-dialog.tsx` | Every delete/revoke/leave. Title = question with the entity name in quotes. |
| `Sheet` | `ui/sheet.tsx` | AI copilot (`side="right"`, `sm:max-w-md`). |
| `DropdownMenu` | `ui/dropdown-menu.tsx` | Row kebab menus, user menu, theme picker (`RadioGroup`). `variant="destructive"` on delete items. |
| `Popover` | `ui/popover.tsx` | Doc icon picker. |
| `Tabs` | `ui/tabs.tsx` | Sidebar quick-access, Docs list filters. |
| `ToggleGroup` | `ui/toggle-group.tsx` | Grid / list view switch (`variant="outline" size="sm"`). |
| `Command` / `CommandDialog` | `ui/command.tsx` | ⌘K palette. **Wrap contents in `<Command>`** — this shadcn variant doesn't. |
| `Sidebar*` | `ui/sidebar.tsx` | `collapsible="icon"`, `SidebarRail`, `SidebarInset`. |
| `Breadcrumb*` | `ui/breadcrumb.tsx` | Route-derived, see `BreadCrumbs`. |
| `Avatar` | `ui/avatar.tsx` | Always with `AvatarFallback` = initials (`initialsOf()`). |
| `Skeleton` | `ui/skeleton.tsx` | Same shape as the final content. |
| `Empty*` | `ui/empty.tsx` | `EmptyMedia variant="icon"`, wrapped in `border border-dashed`. |
| `Tooltip` | `ui/tooltip.tsx` | Every icon-only header button. Provider is in root layout. |
| `Separator`, `ScrollArea`, `Kbd`, `Progress`, `Spinner`, `Switch` | | as needed |
| `Toaster` (sonner) | `ui/sonner.tsx` | Mounted once in root layout: `position="top-right" richColors closeButton`. |

---

## 2. Composites

### 2.1 `PageHeader` — `src/modules/main/PageHeader.tsx`

Icon + title + one-line description; actions right-aligned and wrapping on mobile.

```tsx
<PageHeader
  icon={FileText}
  iconClassName="text-docs"
  title="Docs"
  description="Block-based pages with nested subpages, realtime editing and comments."
  actions={
    <>
      <Button variant="outline" size="sm" onClick={…}><Database />New database</Button>
      <Button size="sm" onClick={…}><Plus />New page</Button>
    </>
  }
/>
```

`SectionHeader` (same file) is the in-page equivalent: `title` may include an icon,
`action` is usually `<Button variant="outline" size="sm" asChild><Link>View all <ArrowRight/></Link></Button>`.

### 2.2 List card — pattern (no component; see `snippets/list-row.tsx`)

```tsx
<div className="divide-y overflow-hidden rounded-lg border bg-card">
  {items.map((n) => (
    <div key={n.id} className="group relative flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/40">
      <Link href={…} className="absolute inset-0" aria-label={n.title} />      {/* whole-row target */}
      <span className="w-6 text-center text-lg leading-none">{n.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium group-hover:text-docs">{n.title}</p>
        <p className="text-xs text-muted-foreground">Edited {timeAgo(n.updated_at)}</p>
      </div>
      <DropdownMenu>…kebab, relative z-10, opacity-0 group-hover:opacity-100…</DropdownMenu>
      <ArrowRight className="size-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
    </div>
  ))}
</div>
```

Used by: Docs list, Overview "Recent pages" / "Recent links", subpages, inbox (via Liveblocks list).

### 2.3 Tinted card — `snippets/gradient-card.tsx`

Board cards and overview board tiles. `gradientFor(index)` from `lib/static.ts`.

```tsx
<Card className={cn('group relative h-[180px] overflow-hidden bg-linear-to-br p-0 transition-transform hover:scale-[1.02]', gradientFor(i))}>
  <Link href={…} className="absolute inset-0" aria-label={…} />
  <CardHeader className="flex-row items-start justify-between p-4">
    <h3 className="truncate text-base font-semibold">{b.name}</h3>
    <DropdownMenu>…</DropdownMenu>
  </CardHeader>
  <CardFooter className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-white/20 bg-black/5 px-4 py-2.5 text-[11px] font-medium text-foreground/70 backdrop-blur-xs dark:bg-white/5">
    <span>Edited {timeAgo(b.updated_at)}</span><Layers className="size-3.5" />
  </CardFooter>
</Card>
```

The "create" tile that precedes the grid:

```tsx
<button className="flex h-[180px] items-center justify-center rounded-xl border-2 border-dashed text-sm font-medium text-muted-foreground transition-colors hover:border-canvas/60 hover:bg-canvas/5 hover:text-foreground">
  <Plus className="mr-2 size-4" /> Create new board
</button>
```

### 2.4 `BookmarkCard` — `src/modules/bookmarks/BookmarkCard.tsx`

Two renders from one component via `view="grid" | "list"`.
- Grid: `aspect-[16/9]` preview (`microlink` screenshot → OG image → placeholder fallback chain),
  category `Badge` bottom-left, hover-revealed star/shortcut buttons top-right, body with
  favicon chip + title + domain + description + meta row.
- List: favicon chip · title/domain · badges (md+) · relative time (lg+) · open · kebab.

### 2.5 Chip rail — `SpaceChip` in `BookmarksPage.tsx` (`snippets/chip-rail.tsx`)

```tsx
<div role="button" className={cn(
  'group flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors',
  active ? 'border-brand/40 bg-brand/10 text-foreground' : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
)}>
  {icon}<span className="max-w-[140px] truncate">{label}</span>
  <Badge variant={active ? 'default' : 'secondary'} className={cn('h-4 min-w-4 px-1 text-[10px]', active && 'bg-brand text-brand-foreground')}>{count}</Badge>
  {menu}
</div>
```

### 2.6 Segmented filter toolbar — `snippets/toolbar.tsx`

```tsx
<div className="flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
  <div className="flex items-center gap-1 rounded-md border bg-muted p-1">
    {FILTERS.map(f => (
      <button className={cn('rounded-sm px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground',
        active === f.id && 'bg-background text-foreground shadow-sm')}>{f.label}</button>
    ))}
  </div>
  <div className="flex items-center gap-2">
    <div className="relative w-full sm:w-64">
      <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input placeholder="Search…" className="h-8 pl-8" />
    </div>
    <ToggleGroup type="single" variant="outline" size="sm">…grid/list…</ToggleGroup>
  </div>
</div>
```

### 2.7 Stat card — `DashboardPage.tsx`

```tsx
<Card className="h-full transition-colors hover:bg-muted/40">
  <CardContent className="flex items-center justify-between p-5">
    <div>
      <p className="text-xs font-medium text-muted-foreground">Links saved</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight">{n}</p>
    </div>
    <Bookmark className="size-5 text-brand" />
  </CardContent>
</Card>
```

### 2.8 Empty state — `snippets/empty-state.tsx`

```tsx
<Empty className="border border-dashed">
  <EmptyHeader>
    <EmptyMedia variant="icon"><FileText /></EmptyMedia>
    <EmptyTitle>No pages yet</EmptyTitle>
    <EmptyDescription>Create a page to start writing. Press “/” inside a page for blocks.</EmptyDescription>
  </EmptyHeader>
  <EmptyContent><Button size="sm"><Plus />Create a page</Button></EmptyContent>
</Empty>
```

### 2.9 Dialog forms — `BookmarkDialogs.tsx`, `CanvasBoardsPage.tsx`, `ShareDialog.tsx`

- Form = `<form className="grid gap-4">`, fields = `<div className="grid gap-2"><Label/><Input/></div>`.
- Two-column fields: `grid gap-4 sm:grid-cols-2`.
- Footer: `<DialogFooter>` with the submit `disabled={!valid || busy}` showing `<Loader2 className="animate-spin" />` while busy.
- Multi-step (Save link): step 1 URL → analyse; step 2 details with a `Back` ghost button on the left (`DialogFooter className="sm:justify-between"`).

### 2.10 Confirm — pattern

```tsx
<AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete “{deleting?.name}”?</AlertDialogTitle>
      <AlertDialogDescription>…what is lost… This can’t be undone.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction variant="destructive" onClick={…}>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 2.11 Shell pieces — `src/modules/main/`

| Component | Purpose |
|---|---|
| `AppSidebar` | logo, `SidebarUserCard`, primary nav (accent active), quick-access tabs, secondary nav (`mt-auto`), AI footer card, `SidebarRail`. |
| `BreadCrumbs` | route → crumbs; resolves board/page titles; walks doc parents. |
| `SearchTrigger` / `SearchCommand` | header button + ⌘K palette (navigate, actions, pages, boards, links). |
| `UserMenu` | avatar → name/email, AI, Inbox, Settings, Sign out (destructive). |
| `ThemeToggle` | sun/moon icon → radio group light/dark/system. |
| `ShellProvider` (`useShell`) | `aiOpen`, `commandOpen` overlay state. |
| `CognifyLogo` | 28px tile mark. |
| `PageHeader` / `SectionHeader` | see 2.1. |

### 2.12 Liveblocks-aware pieces

| Component | File | Notes |
|---|---|---|
| `LiveblocksBoundary` | `components/LiveblocksBoundary.tsx` | Wrap anything using Liveblocks hooks. `fallback={null}` for decorative bits; otherwise renders `LiveblocksUnavailable` with the env-var hint. Probes `/api/liveblocks-auth` to short-circuit when unconfigured. |
| `UnreadBadge` | `modules/inbox/NotificationsInbox.tsx` | tiny `size-2 rounded-full bg-ai` dot; used in header bell and sidebar Inbox item. |
| `NoteRoom` | `modules/docs/NoteRoom.tsx` | provisions room via `/api/liveblocks-rooms`, then `RoomProvider` + `ClientSideSuspense`. |
| `NoteEditor` | `modules/docs/NoteEditor.tsx` | Tiptap + `useLiveblocksExtension`; sticky toolbar (`top-14`), `AvatarStack`, comment button, bubble menu, drag handle. Read-only when `!canWrite`. |
| `Threads` | `modules/docs/Threads.tsx` | `AnchoredThreads` (≥xl, absolute column right of the editor) / `FloatingThreads` + `FloatingComposer`. |
| `ShareDialog` | `modules/docs/ShareDialog.tsx` | invite form (email + role `Select` + Invite), people list with avatar ring in user colour, role select / remove for owner, "Leave this page" for guests. |
| `AiChatPanel` | `modules/ai/AiChatPanel.tsx` | `Sheet` with `AiChat` + `RegisterAiKnowledge`; custom `Empty` with 3 suggestion buttons. |

---

## 3. Helper APIs used by UI

| Helper | File | Use |
|---|---|---|
| `useWorkspace()` | `hooks/use-workspace.ts` | `{ user, loading, containers, bookmarks, boards, notes, add*/update*/delete*, toggleFavorite, toggleShortcut, refresh, signOut }` |
| `useShell()` | `modules/main/ShellProvider.tsx` | `{ aiOpen, openAi, closeAi, toggleAi, commandOpen, setCommandOpen }` |
| `timeAgo`, `isToday`, `hostnameOf`, `initialsOf`, `greeting` | `lib/format.ts` | text helpers |
| `NAV_ITEMS`, `SECONDARY_NAV_ITEMS`, `ACCENT_*`, `BOOKMARK_FILTERS`, `BOOKMARK_CATEGORIES`, `CARD_GRADIENTS`, `gradientFor`, `PAGE_ICONS` | `lib/static.ts` | config |
| `cn` | `lib/utils.ts` | class merge |
