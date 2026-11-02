'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extensions';
import { TaskList, TaskItem } from '@tiptap/extension-list';
import { DragHandle } from '@tiptap/extension-drag-handle-react';
import { SlashCommand } from '@/modules/docs/SlashCommand';
import { useLiveblocksExtension, useIsEditorReady } from '@liveblocks/react-tiptap';
import { useSelf } from '@liveblocks/react/suspense';
import { AvatarStack } from '@liveblocks/react-ui';
import { Threads } from '@/modules/docs/Threads';
import {
  Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, ListChecks, Quote, Code2, Minus, Undo2, Redo2, Check, Loader2,
  GripVertical, Plus, MessageSquarePlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NoteEditorProps {
  noteId: string;
  content: any; // TipTap JSON (or {} for empty) — seeds the Liveblocks doc on first open
  onSave: (json: any) => void;
}

// Must be rendered inside <NoteRoom> — the document itself lives in Liveblocks
// (Yjs); `onSave` only mirrors a JSON snapshot back to Supabase for search/backup.

type SaveState = 'idle' | 'saving' | 'saved';

// Normalize stored content: JSONB defaults to {} which isn't a valid TipTap doc.
// Used as Liveblocks `initialContent`, applied only if the room doc is still empty.
function initialContent(content: any) {
  if (content && typeof content === 'object' && content.type === 'doc') return content;
  return undefined;
}

function ToolbarButton({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void; active?: boolean; disabled?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-md transition-colors',
        active ? 'bg-docs/15 text-docs' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        disabled && 'cursor-not-allowed opacity-30 hover:bg-transparent hover:text-muted-foreground',
      )}
    >
      {children}
    </button>
  );
}

export function NoteEditor({ noteId, content, onSave }: NoteEditorProps) {
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Hold the latest onSave without re-creating the editor when the parent re-renders.
  const onSaveRef = useRef(onSave);
  useEffect(() => { onSaveRef.current = onSave; }, [onSave]);
  const canWriteRef = useRef(true);

  const scheduleSave = useCallback((editor: Editor) => {
    if (!canWriteRef.current) return;
    setSaveState('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      onSaveRef.current(editor.getJSON());
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 1500);
    }, 800);
  }, []);

  const liveblocks = useLiveblocksExtension({ initialContent: initialContent(content) });
  const ready = useIsEditorReady();
  // Viewers (room:read) get a read-only editor and don't mirror saves to Supabase.
  const canWrite = useSelf((me) => me.canWrite);
  useEffect(() => { canWriteRef.current = canWrite; }, [canWrite]);

  const editor = useEditor({
    immediatelyRender: false, // avoid SSR hydration mismatch in Next App Router
    editable: canWrite,
    extensions: [
      liveblocks,
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        // Liveblocks provides collaborative undo/redo
        undoRedo: false,
      }),
      Placeholder.configure({
        placeholder: ({ node }) =>
          node.type.name === 'heading' ? 'Heading…' : "Write something, or press '/' for blocks…",
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      SlashCommand,
    ],
    editorProps: {
      attributes: {
        class: 'cognify-prose min-h-[40vh] pl-1 focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => scheduleSave(editor),
  }, [noteId]); // rebuild editor when switching pages

  // Keep editability in sync if the user's role changes while the doc is open.
  useEffect(() => { editor?.setEditable(canWrite); }, [editor, canWrite]);

  // Flush a pending save on unmount / page switch so nothing is lost.
  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        if (editor && canWriteRef.current) onSaveRef.current(editor.getJSON());
      }
    };
  }, [editor]);

  if (!editor || !ready) {
    return <div className="flex h-[300px] items-center justify-center text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div>;
  }

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="sticky top-2 z-10 mb-6 flex flex-wrap items-center gap-0.5 rounded-2xl border bg-background/90 p-1.5 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        {!canWrite && (
          <span className="mr-1 rounded-md bg-muted px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">View only</span>
        )}
        <ToolbarButton title="Heading 1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="w-4 h-4" /></ToolbarButton>
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}><Code className="w-4 h-4" /></ToolbarButton>
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="To-do list" active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()}><ListChecks className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="Code block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code2 className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="w-4 h-4" /></ToolbarButton>
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton title="Add comment" disabled={editor.state.selection.empty} onClick={() => editor.chain().focus().addPendingComment().run()}><MessageSquarePlus className="w-4 h-4" /></ToolbarButton>
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton title="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><Undo2 className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><Redo2 className="w-4 h-4" /></ToolbarButton>

        <div className="ml-auto flex items-center gap-3 px-2 text-xs text-muted-foreground">
          {saveState === 'saving' && <span className="flex items-center gap-1.5"><Loader2 className="size-3 animate-spin" /> Saving</span>}
          {saveState === 'saved' && <span className="flex items-center gap-1.5 text-docs"><Check className="size-3" /> Saved</span>}
          {/* Who else is in this doc right now */}
          <AvatarStack size={24} max={4} />
        </div>
      </div>

      {/* Notion-style drag handle: grip to drag/reorder + plus to insert a block */}
      <DragHandle editor={editor}>
        <div className="flex items-center gap-0.5 pr-1">
          <button
            type="button"
            title="Insert block below"
            onClick={() => {
              const pos = editor.state.selection.$from.after();
              editor.chain().focus().insertContentAt(pos, { type: 'paragraph' }).setTextSelection(pos + 1).run();
              // open the slash menu on the fresh empty block
              editor.chain().focus().insertContent('/').run();
            }}
            className="flex size-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Plus className="w-4 h-4" />
          </button>
          <span
            title="Drag to move"
            className="flex h-6 w-5 cursor-grab items-center justify-center rounded-md text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4" />
          </span>
        </div>
      </DragHandle>

      {/* Inline bubble menu for quick formatting on selection */}
      <BubbleMenu editor={editor} className="flex items-center gap-0.5 rounded-lg border bg-popover p-1 shadow-md">
        <ToolbarButton title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}><Code className="w-4 h-4" /></ToolbarButton>
      </BubbleMenu>

      <EditorContent editor={editor} />

      {/* Liveblocks comment threads + composer */}
      <Threads editor={editor} />
    </div>
  );
}
