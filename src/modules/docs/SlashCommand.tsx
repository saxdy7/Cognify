'use client';

import React, { useImperativeHandle, useState, forwardRef } from 'react';
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
    const [prevItems, setPrevItems] = useState(items);
    if (items !== prevItems) {
      setPrevItems(items);
      setSelected(0);
    }

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
        <div className="w-72 rounded-lg border bg-popover p-2 text-popover-foreground shadow-md">
          <p className="px-2 py-1.5 text-xs text-muted-foreground">No matching blocks</p>
        </div>
      );
    }

    return (
      <div className="custom-scrollbar max-h-80 w-72 overflow-y-auto rounded-lg border bg-popover p-1.5 text-popover-foreground shadow-md">
        <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Basic blocks</p>
        {items.map((item, index) => (
          <button
            key={item.title}
            onMouseEnter={() => setSelected(index)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => select(index)}
            className={cn(
              'flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors',
              index === selected ? 'bg-accent text-accent-foreground' : 'hover:bg-muted',
            )}
          >
            <span className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-md border',
              index === selected ? 'border-docs/40 bg-docs/10 text-docs' : 'bg-background text-muted-foreground',
            )}>
              {item.icon}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{item.title}</span>
              <span className="block truncate text-[11px] text-muted-foreground">{item.subtitle}</span>
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
