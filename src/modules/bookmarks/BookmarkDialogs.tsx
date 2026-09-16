'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ArrowLeft, FolderPlus, Link as LinkIcon, Loader2, Sparkles } from 'lucide-react';
import type { Bookmark, Container } from '@/types';
import { BOOKMARK_CATEGORIES } from '@/lib/static';
import { hostnameOf } from '@/lib/format';
import type { BookmarkPatch, NewBookmarkInput } from '@/hooks/use-workspace';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const NONE = '__none__';

// ─── Shared details form (used by save + edit) ────────────────────────────────

interface DetailsFormValue {
  title: string;
  description: string;
  category: string;
  container_id: string | null;
  tags: string[];
}

function DetailsForm({ value, onChange, containers, url, logo }: {
  value: DetailsFormValue;
  onChange: (v: DetailsFormValue) => void;
  containers: Container[];
  url: string;
  logo?: string;
}) {
  const domain = hostnameOf(url);
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-background">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo || `https://www.google.com/s2/favicons?domain=${domain}&sz=64`} alt="" className="size-6 object-contain" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{value.title || domain}</p>
          <p className="truncate text-xs text-muted-foreground">{url}</p>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="bm-title">Title</Label>
        <Input id="bm-title" value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} placeholder="Give it a name" />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="bm-desc">Description</Label>
        <Textarea id="bm-desc" rows={3} value={value.description} onChange={(e) => onChange({ ...value, description: e.target.value })} placeholder="What is this link about?" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Category</Label>
          <Select value={value.category || NONE} onValueChange={(v) => onChange({ ...value, category: v === NONE ? '' : v })}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Pick a category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>No category</SelectItem>
              {BOOKMARK_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              {value.category && !(BOOKMARK_CATEGORIES as readonly string[]).includes(value.category) && (
                <SelectItem value={value.category}>{value.category}</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Space</Label>
          <Select value={value.container_id ?? NONE} onValueChange={(v) => onChange({ ...value, container_id: v === NONE ? null : v })}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Unsorted" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Unsorted</SelectItem>
              {containers.map((c) => <SelectItem key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ''}{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {value.tags.filter((t) => t !== 'shortcut').length > 0 && (
        <div className="grid gap-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-1.5">
            {value.tags.filter((t) => t !== 'shortcut').map((t) => (
              <Badge key={t} variant="secondary" className="cursor-pointer" onClick={() => onChange({ ...value, tags: value.tags.filter((x) => x !== t) })} title="Remove tag">
                {t} ×
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Save link (URL → analyse → details) ──────────────────────────────────────

interface AnalyzeResult {
  title?: string; description?: string; logo_url?: string; preview_image_url?: string;
  category?: string; tags?: string[]; metadata_json?: unknown; ai_summary?: string;
}

export function SaveLinkDialog({ open, onOpenChange, containers, defaultContainerId, onSave }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  containers: Container[];
  defaultContainerId?: string | null;
  onSave: (input: NewBookmarkInput) => Promise<unknown>;
}) {
  const [url, setUrl] = useState('');
  const [step, setStep] = useState<'url' | 'details'>('url');
  const [busy, setBusy] = useState(false);
  const [meta, setMeta] = useState<AnalyzeResult>({});
  const [form, setForm] = useState<DetailsFormValue>({ title: '', description: '', category: '', container_id: defaultContainerId ?? null, tags: [] });

  useEffect(() => {
    if (!open) { setUrl(''); setStep('url'); setMeta({}); setForm({ title: '', description: '', category: '', container_id: defaultContainerId ?? null, tags: [] }); }
  }, [open, defaultContainerId]);

  const normalizedUrl = () => (/^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`);

  const analyze = async () => {
    if (!url.trim()) return;
    setBusy(true);
    const target = normalizedUrl();
    try {
      const { data } = await axios.post<AnalyzeResult>('/api/analyze', { url: target });
      setMeta(data);
      setForm((f) => ({ ...f, title: data.title ?? '', description: data.description ?? '', category: data.category ?? '', tags: data.tags ?? [] }));
    } catch {
      setMeta({});
      setForm((f) => ({ ...f, title: hostnameOf(target), description: '', category: '', tags: [] }));
    } finally {
      setUrl(target);
      setStep('details');
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      await onSave({ url, ...meta, ...form, container_id: form.container_id });
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Save a link</DialogTitle>
          <DialogDescription>
            {step === 'url' ? 'Paste a URL and we’ll pull the title, icon and a summary.' : 'Review the details before saving.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'url' ? (
          <form onSubmit={(e) => { e.preventDefault(); analyze(); }} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="bm-url">URL</Label>
              <div className="relative">
                <LinkIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="bm-url" autoFocus type="text" inputMode="url" placeholder="https://example.com/article" value={url} onChange={(e) => setUrl(e.target.value)} className="pl-9" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!url.trim() || busy}>
                {busy ? <Loader2 className="animate-spin" /> : <Sparkles />} Analyse link
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); save(); }} className="grid gap-4">
            <DetailsForm value={form} onChange={setForm} containers={containers} url={url} logo={meta.logo_url} />
            <DialogFooter className="sm:justify-between">
              <Button type="button" variant="ghost" onClick={() => setStep('url')} disabled={busy}><ArrowLeft />Back</Button>
              <Button type="submit" disabled={busy}>{busy && <Loader2 className="animate-spin" />} Save link</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit link ────────────────────────────────────────────────────────────────

export function EditLinkDialog({ bookmark, containers, onOpenChange, onSave }: {
  bookmark: Bookmark | null;
  containers: Container[];
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, patch: BookmarkPatch) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<DetailsFormValue>({ title: '', description: '', category: '', container_id: null, tags: [] });

  useEffect(() => {
    if (bookmark) {
      setForm({
        title: bookmark.title ?? '',
        description: bookmark.description ?? '',
        category: bookmark.category ?? '',
        container_id: bookmark.container_id ?? null,
        tags: bookmark.tags ?? [],
      });
    }
  }, [bookmark]);

  const save = async () => {
    if (!bookmark) return;
    setBusy(true);
    try {
      await onSave(bookmark.id, { ...form, container_id: form.container_id ?? undefined });
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!bookmark} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit link</DialogTitle>
          <DialogDescription>Update how this link appears in your hub.</DialogDescription>
        </DialogHeader>
        {bookmark && (
          <form onSubmit={(e) => { e.preventDefault(); save(); }} className="grid gap-4">
            <DetailsForm value={form} onChange={setForm} containers={containers} url={bookmark.url} logo={bookmark.logo_url} />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
              <Button type="submit" disabled={busy}>{busy && <Loader2 className="animate-spin" />} Save changes</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Create space ─────────────────────────────────────────────────────────────

export function CreateSpaceDialog({ open, onOpenChange, onCreate }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => Promise<unknown>;
}) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!open) setName(''); }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try { await onCreate(name.trim()); onOpenChange(false); } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New space</DialogTitle>
          <DialogDescription>Spaces group related links — a project, a topic, a client.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="space-name">Name</Label>
            <div className="relative">
              <FolderPlus className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="space-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Design inspiration" className="pl-9" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!name.trim() || busy}>{busy && <Loader2 className="animate-spin" />} Create space</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
