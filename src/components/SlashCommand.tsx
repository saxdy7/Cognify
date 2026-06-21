'use client';

import React, { useEffect, useImperativeHandle, useState, forwardRef } from 'react';
import { Editor, Extension, Range } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import {
  Type, Heading1, Heading2, Heading3, List, ListOrdered, ListChecks, Quote, Code2, Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandItem {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  keywords: string[];
  command: (props: { editor: Editor; range: Range }) => void;
}

const ITEMS: CommandItem[] = [
  { title: 'Text', subtitle: 'Plain paragraph', keywords: ['text', 'paragraph', 'p'], icon: <Type className="w-4 h-4" />,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setParagraph().run() },
  { title: 'Heading 1', subtitle: 'Big section heading', keywords: ['h1', 'title', 'heading', 'big'], icon: <Heading1 className="w-4 h-4" />,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleHeading({ level: 1 }).run() },
  { title: 'Heading 2', subtitle: 'Medium heading', keywords: ['h2', 'heading', 'subtitle'], icon: <Heading2 className="w-4 h-4" />,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run() },
  { title: 'Heading 3', subtitle: 'Small heading', keywords: ['h3', 'heading'], icon: <Heading3 className="w-4 h-4" />,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run() },
  { title: 'Bullet List', subtitle: 'Simple bulleted list', keywords: ['bullet', 'list', 'unordered', 'ul'], icon: <List className="w-4 h-4" />,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBulletList().run() },
  { title: 'Numbered List', subtitle: 'Ordered list', keywords: ['number', 'ordered', 'list', 'ol'], icon: <ListOrdered className="w-4 h-4" />,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleOrderedList().run() },
  { title: 'To-do List', subtitle: 'Checkbox task list', keywords: ['todo', 'task', 'checkbox', 'check'], icon: <ListChecks className="w-4 h-4" />,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleTaskList().run() },
  { title: 'Quote', subtitle: 'Capture a quote', keywords: ['quote', 'blockquote', 'cite'], icon: <Quote className="w-4 h-4" />,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBlockquote().run() },
  { title: 'Code Block', subtitle: 'Formatted code snippet', keywords: ['code', 'snippet', 'pre'], icon: <Code2 className="w-4 h-4" />,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run() },
  { title: 'Divider', subtitle: 'Horizontal rule', keywords: ['divider', 'hr', 'line', 'separator'], icon: <Minus className="w-4 h-4" />,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHorizontalRule().run() },
];

interface ListHandle { onKeyDown: (props: { event: KeyboardEvent }) => boolean; }

const SlashCommandList = forwardRef<ListHandle, { items: CommandItem[]; command: (item: CommandItem) => void }>(
  ({ items, command }, ref) => {
    const [selected, setSelected] = useState(0);
    useEffect(() => setSelected(0), [items]);

    const select = (index: number) => {
      const item = items[index];
      if (item) command(item);
    };

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === 'ArrowUp') { setSelected((s) => (s + items.length - 1) % items.length); return true; }
        if (event.key === 'ArrowDown') { setSelected((s) => (s + 1) % items.length); return true; }
        if (event.key === 'Enter') { select(selected); return true; }
        return false;
      },
    }));

    if (!items.length) {
      return (
        <div className="w-72 p-3 bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl">
          <p className="text-xs text-zinc-500 px-2 py-1.5 font-bold">No matching blocks</p>
        </div>
      );
    }

    return (
      <div className="w-72 max-h-80 overflow-y-auto p-2 bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl custom-scrollbar">
        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] px-2 py-2">Basic Blocks</p>
        {items.map((item, index) => (
          <button
            key={item.title}
            onMouseEnter={() => setSelected(index)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => select(index)}
            className={cn(
              'w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition-colors',
              index === selected ? 'bg-emerald-500/15' : 'hover:bg-white/5',
            )}
          >
            <span className={cn(
              'w-9 h-9 flex items-center justify-center rounded-lg border shrink-0',
              index === selected ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-zinc-400',
            )}>
              {item.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-white truncate">{item.title}</span>
              <span className="block text-[11px] text-zinc-500 truncate">{item.subtitle}</span>
            </span>
          </button>
        ))}
      </div>
    );
  },
);
SlashCommandList.displayName = 'SlashCommandList';

export const SlashCommand = Extension.create({
  name: 'slashCommand',
  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: false,
        command: ({ editor, range, props }: any) => props.command({ editor, range }),
      },
    };
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: ({ query }: { query: string }) => {
          const q = query.toLowerCase().trim();
          if (!q) return ITEMS;
          return ITEMS.filter((i) =>
            i.title.toLowerCase().includes(q) || i.keywords.some((k) => k.includes(q)),
          );
        },
        render: () => {
          let component: ReactRenderer<ListHandle> | null = null;
          let popup: HTMLDivElement | null = null;

          const position = (clientRect?: (() => DOMRect | null) | null) => {
            if (!popup || !clientRect) return;
            const rect = clientRect();
            if (!rect) return;
            popup.style.position = 'absolute';
            popup.style.top = `${rect.bottom + window.scrollY + 6}px`;
            popup.style.left = `${rect.left + window.scrollX}px`;
            popup.style.zIndex = '300';
          };

          return {
            onStart: (props: any) => {
              component = new ReactRenderer(SlashCommandList, { props, editor: props.editor });
              popup = document.createElement('div');
              popup.appendChild(component.element);
              document.body.appendChild(popup);
              position(props.clientRect);
            },
            onUpdate: (props: any) => {
              component?.updateProps(props);
              position(props.clientRect);
            },
            onKeyDown: (props: any) => {
              if (props.event.key === 'Escape') { popup?.remove(); component?.destroy(); return true; }
              return component?.ref?.onKeyDown(props) ?? false;
            },
            onExit: () => {
              popup?.remove();
              component?.destroy();
              popup = null;
              component = null;
            },
          };
        },
      }),
    ];
  },
});
