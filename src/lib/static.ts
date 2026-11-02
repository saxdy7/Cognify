import {
  Bookmark,
  Bell,
  FileText,
  LayoutDashboard,
  Layers,
  Settings,
  type LucideIcon,
} from 'lucide-react';

// ─── App navigation ────────────────────────────────────────────────────────────

export type Workspace = 'bookmarks' | 'canvas' | 'docs';

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  /** Tailwind colour token used for the active state (see globals.css brand tokens) */
  accent: 'brand' | 'canvas' | 'docs' | 'ai' | 'primary';
  /** Match sub-routes (e.g. /dashboard/docs/[id]) */
  nested?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { title: 'Overview', url: '/dashboard', icon: LayoutDashboard, accent: 'primary' },
  { title: 'Bookmarks', url: '/dashboard/bookmarks', icon: Bookmark, accent: 'brand', nested: true },
  { title: 'Canvas', url: '/dashboard/canvas', icon: Layers, accent: 'canvas', nested: true },
  { title: 'Docs', url: '/dashboard/docs', icon: FileText, accent: 'docs', nested: true },
];

export const SECONDARY_NAV_ITEMS: NavItem[] = [
  { title: 'Inbox', url: '/dashboard/inbox', icon: Bell, accent: 'ai' },
  { title: 'Settings', url: '/dashboard/settings', icon: Settings, accent: 'primary' },
];

/** Active-state classes per accent, mirroring the sidebar pattern (gradient wash + left rule). */
export const ACCENT_ACTIVE: Record<NavItem['accent'], string> = {
  primary: 'from-foreground/10 border-foreground',
  brand: 'from-brand/20 border-brand',
  canvas: 'from-canvas/20 border-canvas',
  docs: 'from-docs/20 border-docs',
  ai: 'from-ai/20 border-ai',
};

export const ACCENT_TEXT: Record<NavItem['accent'], string> = {
  primary: 'text-foreground',
  brand: 'text-brand',
  canvas: 'text-canvas',
  docs: 'text-docs',
  ai: 'text-ai',
};

export const ACCENT_BG: Record<NavItem['accent'], string> = {
  primary: 'bg-foreground text-background',
  brand: 'bg-brand text-brand-foreground',
  canvas: 'bg-canvas text-white',
  docs: 'bg-docs text-white',
  ai: 'bg-ai text-white',
};

// ─── Bookmark quick filters (sidebar + bookmarks page) ─────────────────────────

export type BookmarkFilter = 'all' | 'favorites' | 'today' | 'shortcuts';

export const BOOKMARK_FILTERS: { id: BookmarkFilter; label: string }[] = [
  { id: 'all', label: 'All links' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'today', label: 'Added today' },
  { id: 'shortcuts', label: 'Shortcuts' },
];

export const BOOKMARK_CATEGORIES = [
  'Development', 'Design', 'Productivity', 'Research', 'Reading', 'Video', 'Social', 'Shopping', 'Finance', 'Other',
] as const;

// ─── Visual palette helpers ────────────────────────────────────────────────────

/** Soft gradient tints for board / container cards (index-stable). */
export const CARD_GRADIENTS = [
  'from-orange-200/70 to-orange-50 dark:from-orange-500/25 dark:to-orange-500/5',
  'from-rose-200/70 to-rose-50 dark:from-rose-500/25 dark:to-rose-500/5',
  'from-emerald-200/70 to-emerald-50 dark:from-emerald-500/25 dark:to-emerald-500/5',
  'from-sky-200/70 to-sky-50 dark:from-sky-500/25 dark:to-sky-500/5',
  'from-violet-200/70 to-violet-50 dark:from-violet-500/25 dark:to-violet-500/5',
  'from-amber-200/70 to-amber-50 dark:from-amber-500/25 dark:to-amber-500/5',
  'from-teal-200/70 to-teal-50 dark:from-teal-500/25 dark:to-teal-500/5',
  'from-pink-200/70 to-pink-50 dark:from-pink-500/25 dark:to-pink-500/5',
];

export const gradientFor = (index: number) => CARD_GRADIENTS[index % CARD_GRADIENTS.length];

/** Solid tint surfaces (lime / coral / sky / ink) — tokens in globals.css, swap per theme. */
export const TINT_CARDS = [
  'bg-tint-lime text-tint-lime-foreground',
  'bg-tint-coral text-tint-coral-foreground',
  'bg-tint-sky text-tint-sky-foreground',
  'bg-tint-ink text-tint-ink-foreground',
] as const;

export const tintFor = (index: number) => TINT_CARDS[index % TINT_CARDS.length];

/** Emoji choices for doc page icons. */
export const PAGE_ICONS = [
  '📄', '📝', '📌', '💡', '🚀', '📊', '🎯', '🔖', '⭐', '🧠', '📚', '🗂️',
  '✅', '📅', '🗒️', '📋', '🧩', '🔧', '🔍', '💬', '📁', '🏷️', '🧭', '🔥',
  '🎨', '🎬', '🎧', '📷', '🗺️', '🌱', '💰', '📈', '🧪', '🧱', '🔒', '🌐',
  '☕', '🏆', '🎓', '🛠️', '📦', '🧾', '🗓️', '🧵', '🪄', '🧊', '🛰️', '🪐',
];
