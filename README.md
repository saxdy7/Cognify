# Cognify - High-Res Knowledge Hub

Cognify is a "God-level" dashboard for organizing digital resources, built with **Next.js**, **Tailwind CSS**, and **Supabase**. It features a spatial organization system with a premium, dynamic interface..

## 🚀 Key Features

### 🌌 Spatial Dashboard
-   **Fixed Sidebar**: Collapsible navigation with smooth `Framer Motion` animations.
-   **Layout Options**: Switch between **Row-based Grid** (Left-to-Right) and **List View** (Horizontal Cards).
-   **Masonry Support**: option for dynamic height layouts.

### 🔔 Active Notification System
The application features a centralized alert system that captures all critical user actions:
-   **Space Creation**: Success alert when a new container is initialized.
-   **Resource Capture**: Success alert when a new bookmark is added.
-   **Resource Purged**: Warning alert when an item is permanently deleted.
-   **Interactive Inbox**: A dynamic notification tray where users can dismiss items or "Mark all read".

### ⚡ Power Features
-   **Micro-Interactions**: Hover effects, glassmorphism, and fluid transitions.
-   **Keyboard Shortcuts**: Command-click to toggle shortcut status.
-   **Favorites**: Star items to add them to your Curated Collection.

## 🛠 Tech Stack
-   **Framework**: Next.js 16 (App Router, React 19)
-   **UI**: shadcn/ui (Radix, Nova preset) + Tailwind CSS v4 + next-themes (light / dark / system)
-   **Motion**: Framer Motion (marketing only)
-   **Icons**: Lucide React
-   **Backend**: Supabase (Auth + Postgres + Realtime)
-   **Collaboration**: Liveblocks (Yjs text editing, comments, notifications, AI copilot)

## 🗂 Project structure

```
src/
├─ app/
│  ├─ (web)/            # marketing (dark-only): / 
│  ├─ (auth)/           # /login
│  ├─ (main)/dashboard/ # authenticated shell — layout.tsx mounts providers + sidebar + header
│  │  ├─ page.tsx                 → modules/dashboard/DashboardPage
│  │  ├─ bookmarks/page.tsx       → modules/bookmarks/BookmarksPage   (?space=&filter=)
│  │  ├─ canvas/page.tsx          → modules/canvas/CanvasBoardsPage
│  │  ├─ canvas/[boardId]/        → modules/canvas/BoardPage
│  │  ├─ docs/page.tsx            → modules/docs/DocsPage
│  │  ├─ docs/[noteId]/           → modules/docs/NotePage (Liveblocks room)
│  │  ├─ inbox/                   → modules/inbox
│  │  └─ settings/                → modules/settings
│  └─ api/              # liveblocks-auth · liveblocks-rooms · liveblocks-users · notes/[id]/share · analyze
├─ modules/             # feature UI, one folder per area (main = sidebar, breadcrumbs, ⌘K, user menu)
├─ components/ui/       # shadcn primitives only (generated — don't hand-edit)
├─ components/motion/   # decorative animation primitives used by the landing page
├─ lib/provider/        # ThemeProvider · WorkspaceProvider (Supabase data + realtime) · LiveblocksProvider
├─ lib/static.ts        # nav config, filters, palettes
├─ hooks/               # useWorkspace, use-mobile
└─ proxy.ts             # Next 16 proxy (session refresh + /dashboard guard)
```

Route pages are thin wrappers; all UI lives in `modules/`. Pages read data with
`useWorkspace()` (own + shared pages, optimistic CRUD, Supabase Realtime) and
open overlays via `useShell()` (⌘K palette, AI copilot).

Run the SQL files in `supabase-*.sql` once in the Supabase SQL editor (`supabase-shares-schema.sql` last — it enables sharing pages, boards and spaces), and set
`LIVEBLOCKS_SECRET_KEY` in `.env.local`.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.