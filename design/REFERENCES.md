# Cognify — Reference Repos & What Was Borrowed

Cognify's app UI is modelled on three Next.js + shadcn dashboards. This file records, per
repo, the patterns that were adopted (with the file that implements them there and here),
and the things that were deliberately **not** adopted.

| Repo | Stack | Role in Cognify |
|---|---|---|
| [looma-sketch_collaborate_deploy](https://github.com/ronitrai27/looma-sketch_collaborate_deploy) | Next 16 · Convex · Clerk · Liveblocks · tldraw · shadcn (radix) | Structure + sidebar + card grids + dialogs |
| [aria-hackathon](https://github.com/ronitrai27/aria-hackathon) (`client/`) | Next 16 · Convex · Clerk · shadcn · motion | Sidebar active state · tasks-page toolbar · home greeting |
| [wekraft-saas](https://github.com/Wekraft-collaboration-platform/wekraft-saas) | Next 16 · Convex · Clerk · shadcn · zustand · framer-motion | Header composition · project cards · page transitions · module folder depth |

---

## 1. looma

| Pattern | There | Here |
|---|---|---|
| Route groups `(auth)` / `(main)` and a client `dashboard/layout.tsx` that mounts `SidebarProvider` + `AppSidebar` + a header of `SidebarTrigger · Separator · Breadcrumbs · search · UserButton` | `src/app/(main)/dashboard/layout.tsx` | `src/app/(main)/dashboard/layout.tsx` |
| Thin `page.tsx` → `modules/dashboard/DashboardPage.tsx` | `src/app/(main)/dashboard/page.tsx` | every `page.tsx` under `dashboard/` |
| `modules/<feature>/` for feature UI; `components/ui` reserved for shadcn | `src/modules/*` | same |
| Sidebar: logo + wordmark, user card with skeleton, nav items with a gradient active wash, "My Projects" **Tabs** (My Creations / Team) in a fixed-height scroll box, footer promo card, theme button | `src/modules/dashboard/appsidebar.tsx` | `src/modules/main/AppSidebar.tsx` (Quick access tabs Docs/Boards/Starred; AI footer card) |
| Route-derived breadcrumbs from a `navigationItems` list | `src/modules/dashboard/BreadCrumbs.tsx` | `src/modules/main/BreadCrumbs.tsx` (+ entity names, nested doc chain) |
| Header search bar with mode select | `src/modules/dashboard/search-bar.tsx` | `SearchTrigger` → ⌘K palette (replaces the select with command groups) |
| Dashboard: "Welcome to Looma, {name}", section header + "View all →", **dashed "Create New Project" card** first in the grid, pastel **gradient cards** (`PROJECT_GRADIENTS[i % n]`) with a blurred blob and a translucent footer bar showing updated time + member avatars, skeleton cards while loading | `src/modules/dashboard/DashboardPage.tsx` | `DashboardPage.tsx` (boards row), `CanvasBoardsPage.tsx`, `lib/static.ts#CARD_GRADIENTS` |
| Create dialog: `Dialog` + `Label/Input` + tag combobox + `Switch` + footer button with "Creating…" | same file | `CreateBoardDialog`, `CreateSpaceDialog`, `SaveLinkDialog` |
| Projects page: title + description, search `Input` with icon, sort asc/desc icon button, "Owned (n)" section | `src/app/(main)/dashboard/projects/page.tsx` | `CanvasBoardsPage.tsx` |
| `lib/Static-items.ts` for constants | | `lib/static.ts` |
| shadcn oklch neutral tokens, `--radius: 0.5rem`, `next-themes` class strategy | `globals.css`, `lib/provider/themeProvider.tsx` | `globals.css` (radius 0.625), `lib/provider/ThemeProvider.tsx` |
| Liveblocks + Yjs for the collaborative canvas; `api/liveblocks-auth` route | `src/app/api/liveblocks-auth/route.ts`, `canvas/*` | Liveblocks used for **docs** (Tiptap) rather than the canvas; auth via Supabase session |

Not adopted: Convex/Clerk (Cognify uses Supabase), Poppins headings (`font-pop`),
`text-black!` forced colours on active items (we use tokens), the `ai-elements/` suite.

## 2. aria

| Pattern | There | Here |
|---|---|---|
| Sidebar active item = **left border rule + horizontal gradient** (`border-l-4 … bg-linear-to-r from-purple-500/20 to-transparent`), icon-collapsible variant removes the rule | `client/src/modules/main/AppSidebar.tsx` | `AppSidebar.tsx` with `ACCENT_ACTIVE[accent]` (`border-l-[3px]` + `from-{accent}/20`) |
| `mainMenuItems` array → `SidebarMenuButton isActive tooltip` map | same | `NAV_ITEMS` map |
| Header: trigger · `h-4 w-px` divider · breadcrumbs left; connector/extension dropdowns + help right; `Suspense` fallback for the sidebar | `client/src/app/(main)/home/layout.tsx` | header composition (AI / bell / theme / user) |
| Page header: icon + `text-3xl font-semibold tracking-tight` + `text-sm text-muted-foreground` sub-line, primary button right | `client/src/modules/tasks/TasksPage.tsx` | `PageHeader` |
| **Segmented tab switcher** (`bg-muted p-1 rounded border`, icon + label) beside search/filter dropdowns on one `border-b pb-2` row | same | Bookmarks toolbar (`BOOKMARK_FILTERS`), Docs `Tabs` row |
| `AlertDialog` for bulk delete, `DropdownMenu` for filters, sonner toasts with loading ids | same | delete flows, kebab menus |
| Home greeting helper (`getGreeting()`), sync status line | `client/src/app/(main)/home/page.tsx` | `lib/format.ts#greeting`, overview header |
| Per-feature `modules/tasks/{TasksPage, CreateTaskDialog, TableTab, KanbanTab, analytics/*}` depth | | `modules/bookmarks/{BookmarksPage, BookmarkCard, BookmarkDialogs}` etc. |
| Custom hooks folder for stores (`useUserStore`, `useAgentChat`) | `client/src/hooks/*` | `hooks/use-workspace.ts`, `ShellProvider` |

Not adopted: hard-coded `text-neutral-800`/`text-black!` colours, the Python agent
backend, tour/onboarding dialogs.

## 3. wekraft

| Pattern | There | Here |
|---|---|---|
| `(web)` / `(auth)` / `(main)` / `(admin)` route groups; `dashboard/@sidebar` parallel route | `src/app/*` | `(web)` / `(auth)` / `(main)` (parallel route not needed — one sidebar) |
| Header: `bg-sidebar/60 backdrop-blur-xl`, sticky, `SidebarTrigger` + crumbs left; right cluster of `size="icon-sm" variant="outline"` buttons each wrapped in `Tooltip`; `UserMenu` last | `src/app/(main)/dashboard/layout.tsx` | header (`ghost` icon buttons + tooltips; `bg-background/80 backdrop-blur`) |
| Main content in a scroll container with hidden scrollbars | same (`ScrollArea … scrollbar-hide`) | `main.overflow-auto` + `.custom-scrollbar/.no-scrollbar` utilities |
| Project cards: `aspect-video` preview area with placeholder icon, visibility badge overlay top-left, `p-4` body with truncated bold title + `text-[11px] text-muted-foreground` meta row | `src/app/(main)/dashboard/ProjectCards.tsx` | `BookmarkCard` grid (`aspect-[16/9]` preview, category badge overlay, favicon+title, meta) |
| `PageTitle` component that sets `document.title` | `src/components/PageTitle.tsx` | Next `metadata` export per `page.tsx` (`title.template: "%s · Cognify"`) |
| `PageTransition` (Vercel-style ease `[0.16,1,0.3,1]`) | `src/components/PageTransition.tsx` | not adopted for pages (CSS transitions only); the easing is reused for canvas popovers |
| `modules/<feature>/components/*` and `modules/ai/*Sheet.tsx` (assistant in a right sheet) | `src/modules/ai/AiAssistantSheet.tsx` | `modules/ai/AiChatPanel.tsx` (Sheet) |
| Notification center as a header popover with unread state | `src/modules/dashboard/components/NotificationCenter.tsx` | bell → `/dashboard/inbox` with `UnreadBadge` dot |
| `Docs/` folder with TRD / audits alongside code | `Docs/*.md` | `design/*.md` |
| zustand stores for UI state (`useMyWorkStore`) | `src/store/*` | `ShellProvider` context (small enough not to need zustand) |

Not adopted: Sentry, Clerk, Convex, payments, `DesktopOnlyGuard`, framer-motion header
tool reveal (Cognify keeps header static), `!important` colour overrides.

---

## 4. Shared DNA (all three)

- shadcn/ui new-york/nova style on Radix, Tailwind v4, oklch tokens, `next-themes`.
- Lucide icons, sonner toasts, `cn()` merge.
- Sidebar from shadcn `sidebar.tsx` with `collapsible="icon"`.
- `Skeleton` loading, `Card` grids, `Dialog` creates, `AlertDialog` deletes.
- Neutral grey chrome; colour used sparingly for active state and identity.

Cognify adds on top: per-workspace accent tokens (`brand/canvas/docs/ai`), a `PageHeader`
primitive so every page opens the same way, URL-as-state filters, a single
`WorkspaceProvider` data store with Supabase Realtime, and `LiveblocksBoundary` so
collaboration features fail soft.
