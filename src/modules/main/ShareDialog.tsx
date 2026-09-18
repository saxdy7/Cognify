'use client';

import React, { useEffect, useState } from 'react';
import { Crown, Eye, Loader2, LogOut, Mail, Pencil, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { initialsOf } from '@/lib/format';
import type { Collaborator } from '@/app/api/share/[type]/[id]/route';
import type { ResourceType } from '@/lib/share';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

type Role = 'view' | 'edit';

export interface ShareDialogProps {
  /** What is being shared: a doc page, a canvas board, or a bookmark space */
  resource: { type: ResourceType; id: string; title: string };
  isOwner: boolean;
  onClose: () => void;
  /** Fired when the current user removes themself from a shared resource */
  onLeft?: () => void;
}

const LABEL: Record<ResourceType, { noun: string; editorCan: string }> = {
  note: { noun: 'page', editorCan: 'change the page; viewers can read and comment' },
  board: { noun: 'board', editorCan: 'add and move cards; viewers can only look' },
  container: { noun: 'space', editorCan: 'add and edit links in it; viewers can only browse' },
};

/**
 * Invite / manage collaborators on any shareable resource. Talks to
 * /api/share/[type]/[id], which (for pages) also keeps Liveblocks permissions in sync.
 */
export function ShareDialog({ resource, isOwner, onClose, onLeft }: ShareDialogProps) {
  const endpoint = `/api/share/${resource.type}/${resource.id}`;
  const label = LABEL[resource.type];
  const [collaborators, setCollaborators] = useState<Collaborator[] | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('edit');
  const [busy, setBusy] = useState<string | null>(null); // 'invite' | userId | 'me'

  useEffect(() => {
    let cancelled = false;
    fetch(endpoint)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to load collaborators');
        return res.json() as Promise<{ collaborators: Collaborator[] }>;
      })
      .then(({ collaborators }) => { if (!cancelled) setCollaborators(collaborators); })
      .catch((e: Error) => { if (!cancelled) { toast.error(e.message); setCollaborators([]); } });
    return () => { cancelled = true; };
  }, [endpoint]);

  const post = async (body: { email: string; role: Role }) => {
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data.collaborator as Collaborator;
  };

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy('invite');
    try {
      const c = await post({ email: email.trim(), role });
      setCollaborators((prev) => [...(prev ?? []).filter((x) => x.userId !== c.userId), c]);
      setEmail('');
      toast.success(`${c.name} can now ${c.role === 'edit' ? 'edit' : 'view'} this ${label.noun}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const changeRole = async (c: Collaborator, next: Role) => {
    if (!c.email || c.role === next) return;
    setBusy(c.userId);
    try {
      const updated = await post({ email: c.email, role: next });
      setCollaborators((prev) => (prev ?? []).map((x) => (x.userId === c.userId ? updated : x)));
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  // Omit userId to remove yourself (the server resolves the caller).
  const remove = async (userId?: string) => {
    const key = userId ?? 'me';
    setBusy(key);
    try {
      const res = await fetch(endpoint, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userId ? { userId } : {}) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to remove');
      if (userId) setCollaborators((prev) => (prev ?? []).filter((x) => x.userId !== userId));
      else { toast.success(`You left this ${label.noun}`); onLeft?.(); onClose(); }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy((b) => (b === key ? null : b));
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share “{resource.title || 'Untitled'}”</DialogTitle>
          <DialogDescription>
            {isOwner ? `Invite people by email. Editors can ${label.editorCan}.` : `People who have access to this ${label.noun}.`}
          </DialogDescription>
        </DialogHeader>

        {isOwner && (
          <form onSubmit={invite} className="flex items-stretch gap-2">
            <div className="relative flex-1">
              <Mail className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@example.com" className="pl-8" />
            </div>
            <RoleSelect value={role} onChange={setRole} />
            <Button type="submit" disabled={busy === 'invite' || !email.trim()}>
              {busy === 'invite' ? <Loader2 className="animate-spin" /> : <UserPlus />}
              <span className="hidden sm:inline">Invite</span>
            </Button>
          </form>
        )}

        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">People with access</p>
          {collaborators === null ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2"><Skeleton className="size-9 rounded-full" /><div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-1/3" /><Skeleton className="h-3 w-1/2" /></div></div>
              ))}
            </div>
          ) : (
            <ScrollArea className="max-h-[40vh]">
              <ul className="space-y-1">
                {collaborators.map((c) => (
                  <li key={c.userId} className="flex items-center gap-3 rounded-md p-2 hover:bg-muted/50">
                    <Avatar className="size-9" style={{ outline: `2px solid ${c.color}`, outlineOffset: 1 }}>
                      <AvatarImage src={c.avatar || undefined} alt={c.name} />
                      <AvatarFallback className="text-xs font-semibold">{initialsOf(c.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      {c.email && <p className="truncate text-xs text-muted-foreground">{c.email}</p>}
                    </div>

                    {c.role === 'owner' ? (
                      <Badge variant="secondary" className="gap-1 text-amber-600 dark:text-amber-400"><Crown className="size-3" />Owner</Badge>
                    ) : isOwner ? (
                      <>
                        <RoleSelect value={c.role} onChange={(r) => changeRole(c, r)} disabled={busy === c.userId} compact />
                        <Button variant="ghost" size="icon-sm" onClick={() => remove(c.userId)} disabled={busy === c.userId} title="Remove access" className="hover:text-destructive">
                          {busy === c.userId ? <Loader2 className="animate-spin" /> : <Trash2 />}
                        </Button>
                      </>
                    ) : (
                      <Badge variant="outline" className={cn('gap-1', c.role === 'edit' && 'text-docs')}>
                        {c.role === 'edit' ? <Pencil className="size-3" /> : <Eye className="size-3" />}
                        {c.role === 'edit' ? 'Editor' : 'Viewer'}
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </div>

        {!isOwner && (
          <DialogFooter>
            <Button variant="outline" onClick={() => remove()} disabled={busy === 'me'} className="hover:text-destructive">
              {busy === 'me' ? <Loader2 className="animate-spin" /> : <LogOut />} Leave this {label.noun}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function RoleSelect({ value, onChange, disabled, compact }: { value: Role; onChange: (r: Role) => void; disabled?: boolean; compact?: boolean }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Role)} disabled={disabled}>
      <SelectTrigger size={compact ? 'sm' : 'default'} className={cn('shrink-0', compact ? 'w-[110px]' : 'w-[120px]')}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="edit"><Pencil />Can edit</SelectItem>
        <SelectItem value="view"><Eye />Can view</SelectItem>
      </SelectContent>
    </Select>
  );
}
