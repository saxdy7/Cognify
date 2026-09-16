'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, Trash2, Type, CheckSquare, Link2, Hash, ChevronDown, Tag, X, Check, GripVertical, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─────────────────────────── Types ───────────────────────────
type ColType = 'text' | 'checkbox' | 'url' | 'number' | 'select';
type OptColor = 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'pink' | 'orange';

interface SelectOption { id: string; name: string; color: OptColor; }
interface Column { id: string; name: string; type: ColType; options?: SelectOption[]; }
interface Row { id: string; cells: Record<string, any>; }
interface DatabaseContent { kind: 'database'; columns: Column[]; rows: Row[]; }

interface NotionDatabaseProps {
  content: any;
  onChange: (content: DatabaseContent) => void;
}

const COLORS: Record<OptColor, string> = {
  gray: 'bg-zinc-500/20 text-zinc-300 border border-zinc-500/30',
  blue: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  green: 'bg-green-500/20 text-green-300 border border-green-500/30',
  yellow: 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30',
  red: 'bg-red-500/20 text-red-300 border border-red-500/30',
  purple: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  pink: 'bg-pink-500/20 text-pink-300 border border-pink-500/30',
  orange: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
};
const COLOR_LIST: OptColor[] = ['gray', 'blue', 'green', 'yellow', 'red', 'purple', 'pink', 'orange'];

const TYPE_META: Record<ColType, { label: string; icon: React.ReactNode }> = {
  text: { label: 'Text', icon: <Type className="w-3.5 h-3.5" /> },
  checkbox: { label: 'Checkbox', icon: <CheckSquare className="w-3.5 h-3.5" /> },
  url: { label: 'URL', icon: <Link2 className="w-3.5 h-3.5" /> },
  number: { label: 'Number', icon: <Hash className="w-3.5 h-3.5" /> },
  select: { label: 'Select', icon: <Tag className="w-3.5 h-3.5" /> },
};

const uid = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

function normalize(content: any): DatabaseContent {
  if (content && content.kind === 'database' && Array.isArray(content.columns)) return content;
  return {
    kind: 'database',
    columns: [{ id: 'c_name', name: 'Name', type: 'text' }],
    rows: [{ id: uid(), cells: {} }],
  };
}

export function NotionDatabase({ content, onChange }: NotionDatabaseProps) {
  const [db, setDb] = useState<DatabaseContent>(() => normalize(content));
  const [saving, setSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // UI state
  const [colMenu, setColMenu] = useState<string | null>(null);
  // Popover is portaled to <body> (see render below) — it lives inside an
  // overflow-x-auto table wrapper otherwise, which clips it for columns near
  // the table's edge (the same class of bug the canvas "More tools" popover had).
  const [colMenuPos, setColMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [openSelect, setOpenSelect] = useState<string | null>(null); // `${rowId}:${colId}`

  const commit = useCallback((next: DatabaseContent) => {
    setDb(next);
    setSaving(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      onChangeRef.current(next);
      setSaving(false);
    }, 600);
  }, []);

  useEffect(() => () => { if (timer.current) { clearTimeout(timer.current); onChangeRef.current(db); } }, [db]);

  // ─────────── Mutations ───────────
  const setCell = (rowId: string, colId: string, value: any) =>
    commit({ ...db, rows: db.rows.map(r => r.id === rowId ? { ...r, cells: { ...r.cells, [colId]: value } } : r) });

  const addRow = () => commit({ ...db, rows: [...db.rows, { id: uid(), cells: {} }] });
  const deleteRow = (rowId: string) => commit({ ...db, rows: db.rows.filter(r => r.id !== rowId) });

  const addColumn = () => {
    const col: Column = { id: uid(), name: 'New', type: 'text' };
    commit({ ...db, columns: [...db.columns, col] });
    setColMenu(col.id);
  };
  const updateColumn = (colId: string, patch: Partial<Column>) =>
    commit({ ...db, columns: db.columns.map(c => c.id === colId ? { ...c, ...patch } : c) });
  const deleteColumn = (colId: string) => {
    commit({
      ...db,
      columns: db.columns.filter(c => c.id !== colId),
      rows: db.rows.map(r => { const { [colId]: _, ...rest } = r.cells; return { ...r, cells: rest }; }),
    });
    setColMenu(null);
  };
  const changeColType = (colId: string, type: ColType) => {
    const patch: Partial<Column> = { type };
    if (type === 'select') {
      const col = db.columns.find(c => c.id === colId);
      if (!col?.options) patch.options = [];
    }
    updateColumn(colId, patch);
  };
  const addOption = (colId: string, name: string): SelectOption => {
    const col = db.columns.find(c => c.id === colId)!;
    const opt: SelectOption = { id: uid(), name, color: COLOR_LIST[(col.options?.length || 0) % COLOR_LIST.length] };
    updateColumn(colId, { options: [...(col.options || []), opt] });
    return opt;
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.25em]">{db.rows.length} rows · {db.columns.length} properties</span>
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest h-4">
          {saving && <span className="text-zinc-500 flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Saving</span>}
        </span>
      </div>

      <div className="overflow-x-auto custom-scrollbar border border-white/10 rounded-2xl bg-white/[0.015]">
        <table className="w-full border-collapse text-sm min-w-[720px]">
          <thead>
            <tr className="border-b border-white/10">
              {db.columns.map((col) => (
                <th key={col.id} className="relative text-left font-bold text-zinc-400 border-r border-white/5 last:border-r-0 min-w-[160px]">
                  <button
                    onClick={(e) => {
                      if (colMenu === col.id) { setColMenu(null); return; }
                      const rect = e.currentTarget.getBoundingClientRect();
                      setColMenuPos({ top: rect.bottom + 4, left: rect.left });
                      setColMenu(col.id);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 hover:bg-white/5 transition-colors"
                  >
                    <span className="text-zinc-600">{TYPE_META[col.type].icon}</span>
                    <span className="truncate text-zinc-300">{col.name}</span>
                    <ChevronDown className="w-3.5 h-3.5 ml-auto text-zinc-600 shrink-0" />
                  </button>

                  {colMenu === col.id && colMenuPos && createPortal(
                    <ColumnMenu
                      col={col}
                      pos={colMenuPos}
                      onRename={(name) => updateColumn(col.id, { name })}
                      onType={(t) => changeColType(col.id, t)}
                      onDelete={() => deleteColumn(col.id)}
                      onClose={() => setColMenu(null)}
                    />,
                    document.body
                  )}
                </th>
              ))}
              <th className="w-12 px-2">
                <button onClick={addColumn} title="Add property" className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-emerald-400 hover:bg-white/5 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {db.rows.map((row) => (
              <tr key={row.id} className="group border-b border-white/5 last:border-b-0 hover:bg-white/[0.02]">
                {db.columns.map((col) => (
                  <td key={col.id} className="relative border-r border-white/5 last:border-r-0 align-top">
                    <Cell
                      col={col}
                      value={row.cells[col.id]}
                      onChange={(v) => setCell(row.id, col.id, v)}
                      selectOpen={openSelect === `${row.id}:${col.id}`}
                      onToggleSelect={() => setOpenSelect(openSelect === `${row.id}:${col.id}` ? null : `${row.id}:${col.id}`)}
                      onCloseSelect={() => setOpenSelect(null)}
                      onAddOption={(name) => addOption(col.id, name)}
                    />
                  </td>
                ))}
                <td className="w-12 px-2 text-center align-middle">
                  <button
                    onClick={() => deleteRow(row.id)}
                    className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-zinc-700 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete row"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          onClick={addRow}
          className="w-full flex items-center gap-2 px-4 py-3 text-zinc-500 hover:text-white hover:bg-white/5 transition-colors text-sm font-bold border-t border-white/5"
        >
          <Plus className="w-4 h-4" /> New row
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────── Cell ───────────────────────────
function Cell({
  col, value, onChange, selectOpen, onToggleSelect, onCloseSelect, onAddOption,
}: {
  col: Column;
  value: any;
  onChange: (v: any) => void;
  selectOpen: boolean;
  onToggleSelect: () => void;
  onCloseSelect: () => void;
  onAddOption: (name: string) => SelectOption;
}) {
  if (col.type === 'checkbox') {
    return (
      <div className="px-4 py-2.5 flex items-center">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 accent-emerald-500 cursor-pointer"
        />
      </div>
    );
  }

  if (col.type === 'url') {
    return <UrlCell value={value} onChange={onChange} />;
  }

  if (col.type === 'select') {
    return (
      <SelectCell
        col={col} value={value} onChange={onChange}
        open={selectOpen} onToggle={onToggleSelect} onClose={onCloseSelect} onAddOption={onAddOption}
      />
    );
  }

  // text / number
  return (
    <input
      type={col.type === 'number' ? 'text' : 'text'}
      inputMode={col.type === 'number' ? 'numeric' : undefined}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Empty"
      className="w-full px-4 py-2.5 bg-transparent text-zinc-200 placeholder:text-zinc-700 outline-none focus:bg-white/5 transition-colors"
    />
  );
}

function UrlCell({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  const [editing, setEditing] = useState(false);
  if (editing || !value) {
    return (
      <input
        autoFocus={editing}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setEditing(false)}
        placeholder="Empty"
        className="w-full px-4 py-2.5 bg-transparent text-emerald-400 placeholder:text-zinc-700 outline-none focus:bg-white/5 transition-colors"
      />
    );
  }
  return (
    <div className="px-4 py-2.5 flex items-center gap-2 group/url">
      <a
        href={/^https?:\/\//.test(value) ? value : `https://${value}`}
        target="_blank" rel="noreferrer"
        className="text-emerald-400 hover:underline truncate"
        onClick={(e) => e.stopPropagation()}
      >
        {value}
      </a>
      <button onClick={() => setEditing(true)} className="opacity-0 group-hover/url:opacity-100 text-zinc-600 hover:text-white text-xs">edit</button>
    </div>
  );
}

function SelectCell({
  col, value, onChange, open, onToggle, onClose, onAddOption,
}: {
  col: Column;
  value: any;
  onChange: (v: any) => void;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onAddOption: (name: string) => SelectOption;
}) {
  const [query, setQuery] = useState('');
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const options = col.options || [];
  const current = options.find(o => o.id === value);
  const filtered = options.filter(o => o.name.toLowerCase().includes(query.toLowerCase()));
  const exact = options.find(o => o.name.toLowerCase() === query.toLowerCase().trim());

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setPos({ top: rect.bottom + 4, left: rect.left });
          onToggle();
        }}
        className="w-full px-4 py-2.5 flex items-center min-h-[42px] hover:bg-white/5 transition-colors"
      >
        {current ? (
          <span className={cn('px-2.5 py-0.5 rounded-md text-xs font-bold', COLORS[current.color])}>{current.name}</span>
        ) : (
          <span className="text-zinc-700 text-xs">Empty</span>
        )}
      </button>

      {open && pos && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={() => { onClose(); setQuery(''); }} />
          <div className="fixed z-50 w-60 bg-zinc-950 border border-white/10 rounded-xl shadow-2xl p-2" style={{ top: pos.top, left: pos.left }}>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search or create…"
              className="w-full px-2.5 py-1.5 mb-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder:text-zinc-600 outline-none"
            />
            <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-0.5">
              {value && (
                <button onClick={() => { onChange(null); onClose(); setQuery(''); }} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-500 hover:bg-white/5">
                  <X className="w-3.5 h-3.5" /> Clear
                </button>
              )}
              {filtered.map(o => (
                <button
                  key={o.id}
                  onClick={() => { onChange(o.id); onClose(); setQuery(''); }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5"
                >
                  <span className={cn('px-2 py-0.5 rounded-md text-xs font-bold', COLORS[o.color])}>{o.name}</span>
                  {value === o.id && <Check className="w-3.5 h-3.5 text-emerald-400 ml-auto" />}
                </button>
              ))}
              {query.trim() && !exact && (
                <button
                  onClick={() => { const opt = onAddOption(query.trim()); onChange(opt.id); onClose(); setQuery(''); }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 text-xs text-zinc-400"
                >
                  <Plus className="w-3.5 h-3.5" /> Create <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-zinc-500/20 text-zinc-300 border border-zinc-500/30">{query.trim()}</span>
                </button>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

// ─────────────────────────── Column header menu ───────────────────────────
function ColumnMenu({
  col, pos, onRename, onType, onDelete, onClose,
}: {
  col: Column;
  pos: { top: number; left: number };
  onRename: (name: string) => void;
  onType: (t: ColType) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(col.name);
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => { onRename(name.trim() || 'Untitled'); onClose(); }} />
      <div
        className="fixed z-50 w-60 bg-zinc-950 border border-white/10 rounded-xl shadow-2xl p-2"
        style={{ top: pos.top, left: pos.left }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => onRename(name.trim() || 'Untitled')}
          onKeyDown={(e) => { if (e.key === 'Enter') { onRename(name.trim() || 'Untitled'); onClose(); } }}
          className="w-full px-2.5 py-1.5 mb-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white outline-none"
        />
        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-2 py-1">Property type</p>
        <div className="grid grid-cols-1 gap-0.5">
          {(Object.keys(TYPE_META) as ColType[]).map((t) => (
            <button
              key={t}
              onClick={() => onType(t)}
              className={cn('w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-left hover:bg-white/5', col.type === t ? 'text-emerald-400' : 'text-zinc-300')}
            >
              <span className="text-zinc-500">{TYPE_META[t].icon}</span>
              {TYPE_META[t].label}
              {col.type === t && <Check className="w-3.5 h-3.5 ml-auto" />}
            </button>
          ))}
        </div>
        <div className="border-t border-white/5 mt-2 pt-2">
          <button onClick={onDelete} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10">
            <Trash2 className="w-3.5 h-3.5" /> Delete property
          </button>
        </div>
      </div>
    </>
  );
}
