'use client';

import { useTheme } from 'next-themes';
import { Bookmark, FileText, Layers, LogOut, Monitor, Moon, Settings, Sun } from 'lucide-react';
import { useWorkspace } from '@/hooks/use-workspace';
import { initialsOf } from '@/lib/format';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/modules/main/PageHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

const THEMES = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
] as const;

export function SettingsPage() {
  const { user, signOut, bookmarks, boards, notes, containers } = useWorkspace();
  const { theme, setTheme } = useTheme();
  const meta = (user?.user_metadata ?? {}) as Record<string, string | undefined>;
  const name = meta.full_name || meta.name || user?.email?.split('@')[0] || '';
  const provider = user?.app_metadata?.provider as string | undefined;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 p-6 md:p-8">
      <PageHeader icon={Settings} title="Settings" description="Your account, appearance and workspace at a glance." />

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Managed by your sign-in provider{provider ? ` (${provider})` : ''}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarImage src={meta.avatar_url || meta.picture} alt={name} />
              <AvatarFallback className="text-lg font-semibold">{initialsOf(name || user?.email)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-base font-medium">{name || 'Unnamed'}</p>
              <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">uid · {user?.id.slice(0, 8)}…</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Display name</Label>
              <Input value={name} readOnly className="bg-muted/40" />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input value={user?.email ?? ''} readOnly className="bg-muted/40" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose how Cognify looks on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-lg border p-4 text-sm transition-colors hover:bg-muted/50',
                  theme === t.id && 'border-foreground bg-muted/60 font-medium',
                )}
              >
                <t.icon className="size-5" />
                {t.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workspace */}
      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>What you have stored in Cognify.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat icon={Bookmark} label="Links" value={bookmarks.length} className="text-brand" />
            <Stat icon={Layers} label="Boards" value={boards.length} className="text-canvas" />
            <Stat icon={FileText} label="Pages" value={notes.length} className="text-docs" />
            <Stat icon={Settings} label="Spaces" value={containers.length} />
          </div>
          <Separator className="my-5" />
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Realtime collaboration</span><Badge variant="secondary">Liveblocks</Badge>
            <span>·</span><span>Storage & auth</span><Badge variant="secondary">Supabase</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Session */}
      <Card>
        <CardHeader>
          <CardTitle>Session</CardTitle>
          <CardDescription>Sign out of Cognify on this device.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="destructive" onClick={() => signOut()}><LogOut />Sign out</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, label, value, className }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; className?: string }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Icon className={cn('size-4 text-muted-foreground', className)} />
      </div>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
