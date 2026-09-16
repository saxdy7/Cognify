import type { LucideIcon } from 'lucide-react';
import { Award, Columns, LayoutGrid, StickyNote } from 'lucide-react';

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface BoardTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: 'LayoutGrid' | 'Columns' | 'Award' | 'StickyNote';
  accent: string; // Tailwind text colour for the icon
  elements: any[];
  connectors?: { sourceIndex: number; targetIndex: number; color: string }[];
}

export const TEMPLATE_ICONS: Record<BoardTemplate['icon'], LucideIcon> = { LayoutGrid, Columns, Award, StickyNote };

export const BOARD_TEMPLATES: BoardTemplate[] = [
  {
    id: 'moodboard',
    name: 'Creative Moodboard',
    description: 'Collect visuals, links, color palettes and notes into a collage to capture a theme.',
    category: 'Design',
    icon: 'LayoutGrid', accent: 'text-rose-500',
    elements: [
      { type: 'note', x: 100, y: 100, width: 280, height: 180, color: '#FFEDD5', content: { title: 'Brand Theme', body: 'Modern typography, warm pastel colors, off-white background grids, glassmorphism UI overlay elements.' } },
      { type: 'image', x: 420, y: 100, width: 320, height: 240, color: '#FFFFFF', content: { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80', caption: 'Color palette inspiration' } },
      { type: 'link', x: 100, y: 320, width: 280, height: 200, color: '#FFFFFF', content: { url: 'https://milanote.com', title: 'Milanote inspiration', description: 'Infinite visual layouts for creative minds.' } }
    ]
  },
  {
    id: 'kanban',
    name: 'Project Kanban Board',
    description: 'Classic To-Do, In-Progress, and Done board configuration for visual project tracking.',
    category: 'Productivity',
    icon: 'Columns', accent: 'text-indigo-500',
    elements: [
      { type: 'column', x: 100, y: 100, width: 320, height: 500, color: '#FFFFFF', content: { title: 'To Do' } },
      { type: 'column', x: 460, y: 100, width: 320, height: 500, color: '#FFFFFF', content: { title: 'In Progress' } },
      { type: 'column', x: 820, y: 100, width: 320, height: 500, color: '#FFFFFF', content: { title: 'Completed' } },
      { type: 'todo', x: 120, y: 180, width: 280, height: 220, color: '#FFFFFF', content: { title: 'Product Launch Checklist', tasks: [{ id: '1', text: 'Define branding schemas', completed: true }, { id: '2', text: 'Configure Supabase SSG', completed: false }] } }
    ]
  },
  {
    id: 'retro',
    name: 'Sprint Retrospective',
    description: 'Review sprints with columns highlighting what worked, what failed, and upcoming fixes.',
    category: 'Productivity',
    icon: 'Award', accent: 'text-amber-500',
    elements: [
      { type: 'column', x: 100, y: 100, width: 320, height: 500, color: '#FFFFFF', content: { title: 'What Went Well' } },
      { type: 'column', x: 460, y: 100, width: 320, height: 500, color: '#FFFFFF', content: { title: 'What to Improve' } },
      { type: 'column', x: 820, y: 100, width: 320, height: 500, color: '#FFFFFF', content: { title: 'Action Items' } },
      { type: 'note', x: 120, y: 180, width: 280, height: 120, color: '#DCFCE7', content: { title: 'Great velocity', body: 'Features completed ahead of schedule' } },
      { type: 'note', x: 480, y: 180, width: 280, height: 120, color: '#FEE2E2', content: { title: 'Test coverage', body: 'Missing edge case validation units' } }
    ]
  },
  {
    id: 'brainstorm',
    name: 'Brainstorming Mind Map',
    description: 'Explore central ideas visually using note cards anchored by connector lines.',
    category: 'Design',
    icon: 'StickyNote', accent: 'text-teal-500',
    elements: [
      { id: 'core', type: 'note', x: 500, y: 300, width: 280, height: 140, color: '#F3E8FF', content: { title: 'Core Concept', body: 'Evolving Cognify into a God-Level visual hub workspace.' } },
      { id: 'idea1', type: 'note', x: 150, y: 150, width: 260, height: 120, color: '#DBEAFE', content: { title: 'Feature: Docs', body: 'Block-based editor for notes and pages.' } },
      { id: 'idea2', type: 'note', x: 850, y: 150, width: 260, height: 120, color: '#FEF9C3', content: { title: 'Feature: Canvas', body: 'Visual creative boards with connection lines.' } }
    ],
    connectors: [
      { sourceIndex: 0, targetIndex: 1, color: '#5B6CF9' }, // Core to Idea 1
      { sourceIndex: 0, targetIndex: 2, color: '#FF6B52' }  // Core to Idea 2
    ]
  }
];
