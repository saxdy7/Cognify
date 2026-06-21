'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extensions';
import { TaskList, TaskItem } from '@tiptap/extension-list';
import { DragHandle } from '@tiptap/extension-drag-handle-react';
import { SlashCommand } from '@/components/SlashCommand';
import {
  Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, ListChecks, Quote, Code2, Minus, Undo2, Redo2, Check, Loader2,
  GripVertical, Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NoteEditorProps {
  noteId: string;
  content: any; // TipTap JSON (or {} for empty)
  onSave: (json: any) => void;
}

type SaveState = 'idle' | 'saving' | 'saved';

// Normalize stored content: JSONB defaults to {} which isn't a valid TipTap doc.
function initialContent(content: any) {
  if (content && typeof content === 'object' && content.type === 'doc') return content;
  return '';
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
        'w-9 h-9 flex items-center justify-center rounded-lg transition-all shrink-0',
        active ? 'bg-emerald-500/15 text-emerald-400' : 'text-zinc-400 hover:text-white hover:bg-white/5',
        disabled && 'opacity-30 cursor-not-allowed hover:bg-transparent hover:text-zinc-400',
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

  const scheduleSave = useCallback((editor: Editor) => {
    setSaveState('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      onSaveRef.current(editor.getJSON());
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 1500);
    }, 800);
  }, []);

  const editor = useEditor({
    immediatelyRender: false, // avoid SSR hydration mismatch in Next App Router
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: ({ node }) =>
          node.type.name === 'heading' ? 'Heading…' : "Write something, or press '/' for blocks…",
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      SlashCommand,
    ],
    content: initialContent(content),
    editorProps: {
      attributes: {
        class: 'cognify-prose focus:outline-none min-h-[300px] pl-1',
      },
    },
    onUpdate: ({ editor }) => scheduleSave(editor),
  }, [noteId]); // rebuild editor when switching pages

  // Flush a pending save on unmount / page switch so nothing is lost.
  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        if (editor) onSaveRef.current(editor.getJSON());
      }
    };
  }, [editor]);

  if (!editor) {
    return <div className="h-[300px] flex items-center justify-center text-zinc-600"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex items-center gap-1 flex-wrap mb-6 p-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl">
        <ToolbarButton title="Heading 1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="w-4 h-4" /></ToolbarButton>
        <div className="w-px h-6 bg-white/10 mx-1" />
        <ToolbarButton title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}><Code className="w-4 h-4" /></ToolbarButton>
        <div className="w-px h-6 bg-white/10 mx-1" />
        <ToolbarButton title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="To-do list" active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()}><ListChecks className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="Code block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code2 className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="w-4 h-4" /></ToolbarButton>
        <div className="w-px h-6 bg-white/10 mx-1" />
        <ToolbarButton title="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><Undo2 className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><Redo2 className="w-4 h-4" /></ToolbarButton>

        <div className="ml-auto flex items-center gap-1.5 px-3 text-[10px] font-bold uppercase tracking-widest">
          {saveState === 'saving' && <span className="text-zinc-500 flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Saving</span>}
          {saveState === 'saved' && <span className="text-emerald-500 flex items-center gap-1.5"><Check className="w-3 h-3" /> Saved</span>}
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
            className="w-6 h-6 flex items-center justify-center rounded-md text-zinc-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
          <span
            title="Drag to move"
            className="w-5 h-6 flex items-center justify-center rounded-md text-zinc-600 hover:text-white hover:bg-white/10 transition-colors cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4" />
          </span>
        </div>
      </DragHandle>

      {/* Inline bubble menu for quick formatting on selection */}
      <BubbleMenu editor={editor} className="flex items-center gap-1 p-1.5 bg-black border border-white/10 rounded-xl shadow-2xl">
        <ToolbarButton title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton title="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}><Code className="w-4 h-4" /></ToolbarButton>
      </BubbleMenu>

      <EditorContent editor={editor} />
    </div>
  );
}
