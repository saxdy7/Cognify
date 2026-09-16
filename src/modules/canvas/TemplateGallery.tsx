'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/hooks/use-workspace';
import { BOARD_TEMPLATES, TEMPLATE_ICONS, type BoardTemplate } from '@/modules/canvas/templates';
import { SectionHeader } from '@/modules/main/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/** Starter boards. The canvas seeds elements from `tldraw_snapshot.templateId` on first open. */
export function TemplateGallery() {
  const router = useRouter();
  const { user, refresh } = useWorkspace();
  const [busy, setBusy] = useState<string | null>(null);

  const createFromTemplate = async (t: BoardTemplate) => {
    if (!user) return;
    setBusy(t.id);
    try {
      const { data, error } = await supabase
        .from('canvas_boards')
        .insert([{ user_id: user.id, name: t.name, background_color: '#F4F4F0', tldraw_snapshot: { isNewTemplate: true, templateId: t.id } }])
        .select()
        .single();
      if (error) throw error;
      toast.success(`"${t.name}" is ready`);
      await refresh();
      router.push(`/dashboard/canvas/${data.id}`);
    } catch (e) {
      toast.error('Failed to create board from template: ' + (e instanceof Error ? e.message : ''));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="space-y-4">
      <SectionHeader title="Start from a template" description="Pre-built layouts you can reshape in seconds." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {BOARD_TEMPLATES.map((t) => {
          const Icon = TEMPLATE_ICONS[t.icon];
          return (
            <Card key={t.id} className="group flex flex-col transition-shadow hover:shadow-md">
              <CardHeader className="flex-row items-start justify-between gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg border bg-muted/40 transition-transform group-hover:scale-105">
                  <Icon className={cn('size-5', t.accent)} />
                </span>
                <Badge variant="outline">{t.category}</Badge>
              </CardHeader>
              <CardContent className="flex-1">
                <h3 className="text-sm font-semibold">{t.name}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t.description}</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" disabled={!!busy} onClick={() => createFromTemplate(t)}>
                  {busy === t.id ? <Loader2 className="animate-spin" /> : null}
                  Use template <ArrowRight />
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
