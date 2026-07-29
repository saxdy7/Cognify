'use client';

import React from 'react';
import { LayoutGrid, Columns, StickyNote, Award, ArrowRight, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  elements: any[];
  connectors?: any[];
}

interface TemplateGalleryProps {
  userId: string;
  onBoardCreated: (boardId: string) => void;
}

export function TemplateGallery({ userId, onBoardCreated }: TemplateGalleryProps) {
  const templates: Template[] = [
    {
      id: 'moodboard',
      name: 'Creative Moodboard',
      description: 'Collect visuals, links, color palettes and notes into a collage to capture a theme.',
      category: 'Design',
      icon: <LayoutGrid className="w-8 h-8 text-rose-500" />,
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
      icon: <Columns className="w-8 h-8 text-indigo-500" />,
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
      icon: <Award className="w-8 h-8 text-amber-500" />,
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
      icon: <StickyNote className="w-8 h-8 text-teal-500" />,
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

  const handleUseTemplate = async (template: Template) => {
    toast.info(`Initializing "${template.name}" template...`);
    try {
      // Create the Board with a special tldraw template bootstrap payload
      const { data: boardData, error: boardError } = await supabase
        .from('canvas_boards')
        .insert([{
          user_id: userId,
          name: template.name,
          background_color: '#F4F4F0',
          tldraw_snapshot: {
            isNewTemplate: true,
            templateId: template.id
          }
        }])
        .select();

      if (boardError) throw boardError;
      const boardId = boardData[0].id;

      toast.success('Visual workspace populated!');
      onBoardCreated(boardId);
    } catch (err) {
      console.error(err);
      toast.error('Failed to instantiate template');
    }
  };

  return (
    <div className="py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h3 className="text-xl font-bold font-space-grotesk text-zinc-900 dark:text-white">Workspace Templates</h3>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1">Select a visual template map to bootstrap workspace</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {templates.map(template => (
          <div
            key={template.id}
            className="group flex flex-col p-6 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 hover:border-rose-500 dark:hover:border-rose-500/50 rounded-3xl shadow-md hover:shadow-xl transition-all duration-300"
          >
            <div className="w-14 h-14 bg-zinc-50 dark:bg-black/40 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              {template.icon}
            </div>
            
            <h4 className="text-sm font-black font-space-grotesk text-zinc-900 dark:text-white group-hover:text-rose-500 transition-colors mb-2">
              {template.name}
            </h4>
            
            <p className="text-xs text-zinc-500 leading-relaxed font-medium mb-6 flex-1">
              {template.description}
            </p>
            
            <button
              onClick={() => handleUseTemplate(template)}
              className="w-full py-3 bg-zinc-50 dark:bg-black/30 hover:bg-rose-500 hover:text-white border border-zinc-200/50 dark:border-zinc-800/50 hover:border-transparent text-zinc-700 dark:text-zinc-300 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              Use Template
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
