'use client';

import React from 'react';
import { addDays, addMonths, addWeeks, endOfMonth, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from 'date-fns';
import { CalendarCheck2, Check, ChevronLeft, ChevronRight, CircleCheck, Clock3, Copy, Ellipsis, Eye, GripVertical, ListFilter, Plus, Search, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { TASK_TONES } from '../data';
import { autoScheduleEvents } from '../analytics';
import { NewTaskDialog } from '../StudioDialogs';
import { useStudio } from '../StudioProvider';
import { PersonBadge } from '../StudioUi';
import type { StudioTask, TaskType } from '../types';

const START_HOUR = 8;
const END_HOUR = 18;
const HOUR_HEIGHT = 66;
const TYPES: TaskType[] = ['Call', 'Meeting', 'Task', 'Email', 'Payment', 'Delivery', 'Deal'];
const TODAY = (() => { const date = new Date(); date.setHours(12, 0, 0, 0); return date; })();
type CalendarView = 'month' | 'week';

export function ScheduleBoard() {
  const { tasks: manualTasks, deals, projects, invoices, team, addTask, updateTask } = useStudio();
  // Hand-entered tasks plus payments, deliveries and closing dates generated from Finance, Projects and Pipeline.
  const tasks = React.useMemo(() => [...manualTasks, ...autoScheduleEvents(deals, projects, invoices, team[0]?.id ?? 'ME')], [manualTasks, deals, projects, invoices, team]);
  const [cursorDate, setCursorDate] = React.useState(TODAY);
  const [selectedDate, setSelectedDate] = React.useState(TODAY);
  const [view, setView] = React.useState<CalendarView>('month');
  const [newOpen, setNewOpen] = React.useState(false);
  const [owner, setOwner] = React.useState('all');
  const [type, setType] = React.useState<'all' | TaskType>('all');
  const [showWeekends, setShowWeekends] = React.useState(true);
  const [compactCards, setCompactCards] = React.useState(false);
  const pointerStart = React.useRef<number | null>(null);

  const dateId = format(selectedDate, 'yyyy-MM-dd');
  const weekStart = startOfWeek(cursorDate, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);
  const allWeekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const weekDays = showWeekends ? allWeekDays : allWeekDays.slice(0, 5);
  const monthStart = startOfWeek(startOfMonth(cursorDate), { weekStartsOn: 1 });
  const monthEnd = addDays(startOfWeek(endOfMonth(cursorDate), { weekStartsOn: 1 }), 6);
  const monthDays: Date[] = [];
  for (let date = monthStart; date <= monthEnd; date = addDays(date, 1)) {
    if (showWeekends || (date.getDay() !== 0 && date.getDay() !== 6)) monthDays.push(date);
  }

  const visible = tasks.filter((task) => (owner === 'all' || task.owner === owner) && (type === 'all' || task.type === type));
  const todayTasks = tasks.filter((task) => task.date === format(TODAY, 'yyyy-MM-dd'));
  const selectedTasks = visible.filter((task) => task.date === dateId).sort((a, b) => a.startMinutes - b.startMinutes);
  const overdue = visible.filter((task) => !task.completed && task.date < format(TODAY, 'yyyy-MM-dd')).sort((a, b) => b.date.localeCompare(a.date));
  const weekTasks = tasks.filter((task) => task.date >= format(weekStart, 'yyyy-MM-dd') && task.date <= format(weekEnd, 'yyyy-MM-dd'));

  const stepCalendar = React.useCallback((direction: -1 | 1) => {
    setCursorDate((date) => view === 'month' ? addMonths(date, direction) : addWeeks(date, direction));
  }, [view]);

  const swipeEnd = (x: number) => {
    if (pointerStart.current === null) return;
    const delta = x - pointerStart.current;
    if (Math.abs(delta) > 80) stepCalendar(delta < 0 ? 1 : -1);
    pointerStart.current = null;
  };

  const selectDay = (day: Date) => {
    setSelectedDate(day);
    if (!isSameMonth(day, cursorDate)) setCursorDate(day);
  };

  const moveTask = (taskId: string, targetDate: Date) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;
    const nextDate = format(targetDate, 'yyyy-MM-dd');
    if (task.date === nextDate) return;
    updateTask(taskId, { date: nextDate });
    setSelectedDate(targetDate);
    toast.success(`Moved “${task.title}” to ${format(targetDate, 'EEE, MMM d')}`);
  };

  const duplicateTask = (task: StudioTask) => {
    addTask({ title: `${task.title} copy`, client: task.client, date: task.date, startMinutes: task.startMinutes + task.duration, duration: task.duration, type: task.type, owner: task.owner });
  };

  const resetFilters = () => { setOwner('all'); setType('all'); };

  return (
    <div className="space-y-4 studio-page-enter">
      <section className="flex flex-col gap-5 pt-1 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-8">
          <div>
            <p className="mb-1.5 text-[10px] font-bold tracking-[0.18em] text-muted-foreground uppercase">Delivery calendar</p>
            <h1 className="text-4xl leading-[0.95] font-bold tracking-[-0.05em] sm:text-5xl">Team<br className="hidden xl:block" /> schedule</h1>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pb-0.5">
            <InlineMetric icon={CalendarCheck2} value={todayTasks.filter((task) => !task.completed).length} label="Tasks today" />
            <InlineMetric icon={Clock3} value={weekTasks.filter((task) => !task.completed).length} label="This week" />
            <InlineMetric icon={Zap} value={overdue.length} label="Overdue, unfinished" danger />
          </div>
        </div>
        <Button className="w-fit rounded-full px-5 shadow-[0_12px_30px_-16px_var(--brand)]" onClick={() => setNewOpen(true)}><Plus />New task</Button>
      </section>

      <section className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <FilterChip active={owner === 'all'} onClick={() => setOwner('all')}>Everyone</FilterChip>
          {team.map((person) => <FilterChip key={person.id} active={owner === person.id} onClick={() => setOwner(person.id)}><PersonBadge id={person.id} size="sm" />{person.name.split(' ')[0]}</FilterChip>)}
          <span className="mx-1 h-6 w-px shrink-0 bg-foreground/[0.08]" />
          {TYPES.map((item) => <FilterChip key={item} active={type === item} onClick={() => setType((current) => current === item ? 'all' : item)}><span className={cn('size-2 rounded-full', typeDot(item))} />{item}s</FilterChip>)}
        </div>
        {(owner !== 'all' || type !== 'all') && <button onClick={resetFilters} className="flex w-fit items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"><ListFilter className="size-3.5" />Clear filters</button>}
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px] 2xl:grid-cols-[minmax(0,1fr)_330px]">
        <section className="min-w-0 overflow-hidden rounded-[1.6rem] bg-card/92 ring-1 ring-foreground/[0.09] backdrop-blur-xl">
          <CalendarToolbar
            view={view}
            title={view === 'month' ? format(cursorDate, 'MMMM yyyy') : `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`}
            showWeekends={showWeekends}
            compactCards={compactCards}
            onViewChange={setView}
            onPrevious={() => stepCalendar(-1)}
            onNext={() => stepCalendar(1)}
            onToday={() => { setCursorDate(TODAY); setSelectedDate(TODAY); }}
            onShowWeekendsChange={setShowWeekends}
            onCompactChange={setCompactCards}
            onResetFilters={resetFilters}
          />
          <div className="overflow-x-auto custom-scrollbar" onPointerDown={(event) => { pointerStart.current = event.clientX; }} onPointerUp={(event) => swipeEnd(event.clientX)} onPointerCancel={() => { pointerStart.current = null; }}>
            {view === 'month' ? (
              <MonthCalendar key={`${format(cursorDate, 'yyyy-MM')}-${showWeekends}-${compactCards}`} days={monthDays} columnCount={showWeekends ? 7 : 5} cursorDate={cursorDate} selectedDate={selectedDate} tasks={visible} compact={compactCards} onSelect={selectDay} onDropTask={moveTask} />
            ) : (
              <WeekCalendar key={`${format(weekStart, 'yyyy-MM-dd')}-${showWeekends}`} days={weekDays} selectedDate={selectedDate} tasks={visible} onSelect={setSelectedDate} onToggle={(id, completed) => updateTask(id, { completed })} />
            )}
          </div>
        </section>

        <AgendaPanel
          selectedDate={selectedDate}
          tasks={selectedTasks}
          overdue={overdue}
          onAdd={() => setNewOpen(true)}
          onToggle={(task) => updateTask(task.id, { completed: !task.completed })}
          onMoveTomorrow={(task) => updateTask(task.id, { date: format(addDays(new Date(`${task.date}T12:00:00`), 1), 'yyyy-MM-dd') })}
          onDuplicate={duplicateTask}
        />
      </div>
      <NewTaskDialog open={newOpen} onOpenChange={setNewOpen} initialDate={dateId} />
    </div>
  );
}

function CalendarToolbar({ view, title, showWeekends, compactCards, onViewChange, onPrevious, onNext, onToday, onShowWeekendsChange, onCompactChange, onResetFilters }: {
  view: CalendarView; title: string; showWeekends: boolean; compactCards: boolean; onViewChange: (view: CalendarView) => void; onPrevious: () => void; onNext: () => void; onToday: () => void; onShowWeekendsChange: (checked: boolean) => void; onCompactChange: (checked: boolean) => void; onResetFilters: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-foreground/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-sm font-bold sm:text-base">{title}</h2>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button aria-label="Previous period" variant="outline" size="icon-sm" className="rounded-full" onClick={onPrevious}><ChevronLeft /></Button>
        <Button variant="outline" size="sm" className="rounded-full" onClick={onToday}>Today</Button>
        <Button aria-label="Next period" variant="outline" size="icon-sm" className="rounded-full" onClick={onNext}><ChevronRight /></Button>
        <div className="ml-1 flex rounded-full bg-foreground/[0.055] p-1 ring-1 ring-foreground/[0.06]">
          {(['month', 'week'] as CalendarView[]).map((item) => <button key={item} onClick={() => onViewChange(item)} className={cn('rounded-full px-3 py-1.5 text-[11px] font-bold capitalize transition-all', view === item ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{item}</button>)}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button aria-label="Calendar options" variant="outline" size="icon-sm" className="ml-1 rounded-full"><Ellipsis /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5">
            <DropdownMenuLabel>Calendar options</DropdownMenuLabel>
            <DropdownMenuCheckboxItem checked={showWeekends} onCheckedChange={onShowWeekendsChange} className="py-2"><Eye className="size-4" />Show weekends</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={compactCards} onCheckedChange={onCompactChange} className="py-2"><Sparkles className="size-4" />Compact task cards</DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onResetFilters} className="py-2"><ListFilter className="size-4" />Reset filters</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function MonthCalendar({ days, columnCount, cursorDate, selectedDate, tasks, compact, onSelect, onDropTask }: {
  days: Date[]; columnCount: number; cursorDate: Date; selectedDate: Date; tasks: StudioTask[]; compact: boolean; onSelect: (day: Date) => void; onDropTask: (taskId: string, day: Date) => void;
}) {
  const weekdayLabels = columnCount === 7 ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  return (
    <div className={cn('studio-page-enter', columnCount === 7 ? 'sm:min-w-[840px]' : 'sm:min-w-[660px]')}>
      <div className="grid border-b border-foreground/[0.07]" style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}>{weekdayLabels.map((label) => <div key={label} className="px-1 py-2.5 text-center text-[9px] font-bold tracking-[0.04em] text-muted-foreground uppercase sm:px-3 sm:text-left sm:text-[10px] sm:tracking-[0.08em]">{label}</div>)}</div>
      <div className="grid" style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}>
        {days.map((day) => {
          const dayTasks = tasks.filter((task) => task.date === format(day, 'yyyy-MM-dd')).sort((a, b) => a.startMinutes - b.startMinutes);
          const visibleCount = compact ? 2 : 3;
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelect(day)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => { event.preventDefault(); const taskId = event.dataTransfer.getData('text/cognify-task'); if (taskId) onDropTask(taskId, day); }}
              className={cn('group relative min-h-[60px] overflow-hidden border-r border-b border-foreground/[0.07] p-1 text-left sm:min-h-[105px] sm:p-2 transition-colors hover:bg-foreground/[0.035]', compact && 'sm:min-h-[88px]', !isSameMonth(day, cursorDate) && 'bg-foreground/[0.012] text-muted-foreground/55', isSameDay(day, selectedDate) && 'bg-foreground/[0.055] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--foreground)_20%,transparent)]')}
            >
              <div className="mb-1 flex items-center justify-center gap-2 sm:mb-1.5 sm:justify-between">
                <span className={cn('flex size-6 items-center justify-center rounded-full text-xs font-bold tabular-nums', isSameDay(day, TODAY) && 'bg-foreground text-background')}>{format(day, 'd')}</span>
                <div className="hidden -space-x-1.5 sm:flex">{Array.from(new Set(dayTasks.map((task) => task.owner))).slice(0, 3).map((id) => <PersonBadge key={id} id={id} size="sm" />)}</div>
              </div>
              <div className="flex justify-center gap-0.5 sm:hidden">{dayTasks.slice(0, 3).map((task) => <span key={task.id} className={cn('size-1.5 rounded-full', typeDot(task.type), task.completed && 'opacity-40')} />)}</div>
              <div className="hidden space-y-1 sm:block">
                {dayTasks.slice(0, visibleCount).map((task) => <MonthTask key={task.id} task={task} />)}
                {dayTasks.length > visibleCount && <span className="block px-1 text-[10px] font-semibold text-muted-foreground">+{dayTasks.length - visibleCount} more</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MonthTask({ task }: { task: StudioTask }) {
  return (
    <span
      draggable={!task.auto}
      onDragStart={(event) => { event.stopPropagation(); event.dataTransfer.setData('text/cognify-task', task.id); event.dataTransfer.effectAllowed = 'move'; }}
      onClick={(event) => event.stopPropagation()}
      title={`${task.title} · ${task.client}`}
      className={cn('flex h-6 cursor-grab items-center gap-1 rounded-lg bg-foreground/[0.055] px-1.5 text-[10px] font-semibold active:cursor-grabbing', task.auto && 'cursor-default border border-dashed border-foreground/25 active:cursor-default', task.completed && 'opacity-45 line-through')}
    >
      <GripVertical className="hidden size-3 shrink-0 opacity-0 transition-opacity group-hover:inline group-hover:opacity-50 xl:inline" />
      <span className={cn('size-1.5 shrink-0 rounded-full', typeDot(task.type))} />
      <span className="shrink-0 font-medium opacity-65">{minutesToTime(task.startMinutes, true)}</span>
      <span className="truncate">{task.title}</span>
    </span>
  );
}

function WeekCalendar({ days, selectedDate, tasks, onSelect, onToggle }: { days: Date[]; selectedDate: Date; tasks: StudioTask[]; onSelect: (day: Date) => void; onToggle: (id: string, completed: boolean) => void; }) {
  // Default working hours, stretched to include any task that falls outside them.
  const inWeek = tasks.filter((task) => days.some((day) => task.date === format(day, 'yyyy-MM-dd')));
  const startHour = Math.max(0, Math.min(START_HOUR, ...inWeek.map((task) => Math.floor(task.startMinutes / 60))));
  const endHour = Math.min(24, Math.max(END_HOUR, ...inWeek.map((task) => Math.ceil((task.startMinutes + Math.max(task.duration, 40)) / 60))));
  const hours = endHour - startHour;
  return (
    <div className="min-w-[860px] studio-page-enter">
      <div className="grid border-b border-foreground/[0.07]" style={{ gridTemplateColumns: `64px repeat(${days.length}, minmax(130px, 1fr))` }}>
        <div />
        {days.map((day) => <button key={day.toISOString()} onClick={() => onSelect(day)} className={cn('flex flex-col items-center gap-1 border-l border-foreground/[0.07] py-2.5 text-xs transition-colors hover:bg-foreground/[0.03]', isSameDay(day, selectedDate) && 'bg-foreground/[0.05]')}><span className="text-[10px] font-bold text-muted-foreground uppercase">{format(day, 'EEE')}</span><span className={cn('flex size-7 items-center justify-center rounded-full text-xs font-bold', isSameDay(day, TODAY) && 'bg-foreground text-background')}>{format(day, 'd')}</span></button>)}
      </div>
      <div className="relative grid" style={{ height: hours * HOUR_HEIGHT, gridTemplateColumns: `64px repeat(${days.length}, minmax(130px, 1fr))` }}>
        <div className="relative">{Array.from({ length: hours + 1 }, (_, index) => <span key={index} className="absolute right-3 -translate-y-1/2 text-[9px] font-semibold text-muted-foreground" style={{ top: index * HOUR_HEIGHT }}>{formatHour(startHour + index)}</span>)}</div>
        {days.map((day) => <DayColumn key={day.toISOString()} startHour={startHour} tasks={tasks.filter((task) => task.date === format(day, 'yyyy-MM-dd'))} selected={isSameDay(day, selectedDate)} onSelect={() => onSelect(day)} onToggle={onToggle} />)}
        {Array.from({ length: hours + 1 }, (_, index) => <div key={index} className="pointer-events-none absolute right-0 left-16 border-t border-dashed border-foreground/[0.08]" style={{ top: index * HOUR_HEIGHT }} />)}
      </div>
    </div>
  );
}

function AgendaPanel({ selectedDate, tasks, overdue, onAdd, onToggle, onMoveTomorrow, onDuplicate }: { selectedDate: Date; tasks: StudioTask[]; overdue: StudioTask[]; onAdd: () => void; onToggle: (task: StudioTask) => void; onMoveTomorrow: (task: StudioTask) => void; onDuplicate: (task: StudioTask) => void; }) {
  return (
    <aside className="rounded-[1.6rem] bg-card/92 p-4 ring-1 ring-foreground/[0.09] backdrop-blur-xl lg:sticky lg:top-4">
      <div className="flex items-start justify-between gap-3">
        <div><h2 className="text-base font-bold">{isSameDay(selectedDate, TODAY) ? 'Today' : format(selectedDate, 'EEE, MMM d')}</h2><p className="mt-0.5 text-[10px] text-muted-foreground">{format(selectedDate, 'EEEE, MMM d')} · {tasks.filter((task) => task.completed).length}/{tasks.length} done</p></div>
        <Button aria-label="Add task for selected day" variant="outline" size="icon-sm" className="rounded-full" onClick={onAdd}><Plus /></Button>
      </div>
      <div className="mt-4 space-y-2">
        {tasks.length ? tasks.map((task) => <AgendaTask key={task.id} task={task} onToggle={() => onToggle(task)} onMoveTomorrow={() => onMoveTomorrow(task)} onDuplicate={() => onDuplicate(task)} />) : <div className="rounded-2xl border border-dashed border-foreground/[0.12] px-5 py-8 text-center"><Search className="mx-auto size-5 text-muted-foreground" /><p className="mt-2 text-xs font-bold">No tasks scheduled</p><button onClick={onAdd} className="mt-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground">Add work to this day</button></div>}
      </div>
      {overdue.length > 0 && <div className="mt-5 border-t border-foreground/[0.07] pt-4"><div className="mb-3 flex items-center gap-2 text-xs font-bold"><Zap className="size-3.5 text-[#ff8f78]" />Overdue <span className="rounded-full bg-[#ff9a83] px-1.5 py-0.5 text-[9px] text-[#35140d]">{overdue.length}</span></div><div className="space-y-2">{overdue.slice(0, 4).map((task) => <AgendaTask key={task.id} task={task} onToggle={() => onToggle(task)} onMoveTomorrow={() => onMoveTomorrow(task)} onDuplicate={() => onDuplicate(task)} compact />)}</div>{overdue.length > 4 && <p className="mt-3 text-[10px] text-muted-foreground">+{overdue.length - 4} more — filter by teammate to focus the list</p>}</div>}
    </aside>
  );
}

function InlineMetric({ icon: Icon, value, label, danger }: { icon: React.ComponentType<{ className?: string }>; value: number; label: string; danger?: boolean }) {
  return <article className="flex items-center gap-2.5"><span className={cn('flex size-9 items-center justify-center rounded-full bg-foreground/[0.055] ring-1 ring-foreground/[0.08]', danger && 'text-[#ff8f78]')}><Icon className="size-4" /></span><div><p className="text-lg leading-none font-bold tabular-nums">{value}</p><p className="mt-1 text-[10px] text-muted-foreground">{label}</p></div></article>;
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={cn('flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold ring-1 transition-all', active ? 'bg-foreground text-background ring-foreground shadow-sm' : 'bg-card/80 text-muted-foreground ring-foreground/[0.08] hover:text-foreground')}>{children}</button>;
}

function DayColumn({ tasks, selected, startHour, onSelect, onToggle }: { tasks: StudioTask[]; selected: boolean; startHour: number; onSelect: () => void; onToggle: (id: string, complete: boolean) => void }) {
  // Overlapping tasks share the column side by side instead of hiding each other.
  const sorted = [...tasks].sort((a, b) => a.startMinutes - b.startMinutes);
  const lanes: number[] = [];
  const placed = sorted.map((task) => {
    const end = task.startMinutes + Math.max(task.duration, 40);
    let lane = lanes.findIndex((laneEnd) => laneEnd <= task.startMinutes);
    if (lane === -1) { lane = lanes.length; lanes.push(end); } else lanes[lane] = end;
    return { task, lane };
  });
  const groupSize = (task: StudioTask) => Math.max(1, ...placed.filter((p) => p.task.startMinutes < task.startMinutes + Math.max(task.duration, 40) && p.task.startMinutes + Math.max(p.task.duration, 40) > task.startMinutes).map((p) => p.lane + 1));
  return (
    <div onClick={onSelect} className={cn('relative border-l border-foreground/[0.07]', selected && 'bg-foreground/[0.025]')}>
      {placed.map(({ task, lane }) => {
        const top = (task.startMinutes - startHour * 60) / 60 * HOUR_HEIGHT;
        const height = Math.max(40, task.duration / 60 * HOUR_HEIGHT - 4);
        const width = 100 / groupSize(task);
        return (
          <button key={task.id} onClick={(event) => { event.stopPropagation(); onToggle(task.id, !task.completed); }} className={cn('absolute z-10 overflow-hidden rounded-xl px-2.5 py-2 text-left shadow-sm ring-1 ring-black/5 transition-transform hover:z-20 hover:scale-[1.02]', TASK_TONES[task.type], task.auto && 'border border-dashed border-foreground/40', task.completed && 'opacity-45 line-through')} style={{ top, height, left: `calc(${lane * width}% + 4px)`, width: `calc(${width}% - 8px)` }} title={`${task.title} — ${task.client}`}>
            <span className="block truncate text-[9px] font-medium opacity-70">{minutesToTime(task.startMinutes)} · {task.client}</span>
            <span className="mt-0.5 block truncate text-[10px] font-bold">{task.title}</span>
            <span className="absolute top-1.5 right-1.5"><PersonBadge id={task.owner} size="sm" /></span>
          </button>
        );
      })}
    </div>
  );
}

const SOURCE_LINK = (task: StudioTask) => task.id.startsWith('auto-invoice') ? { href: '/dashboard/studio/finance', label: 'Open in Finance' } : task.id.startsWith('auto-project') ? { href: '/dashboard/studio/projects', label: 'Open in Projects' } : { href: '/dashboard/studio/pipeline', label: 'Open in Pipeline' };

function AgendaTask({ task, onToggle, onMoveTomorrow, onDuplicate, compact }: { task: StudioTask; onToggle: () => void; onMoveTomorrow: () => void; onDuplicate: () => void; compact?: boolean; }) {
  if (task.auto) {
    const link = SOURCE_LINK(task);
    return (
      <article className={cn('rounded-2xl border border-dashed border-foreground/20 bg-foreground/[0.03] p-3 transition-colors hover:bg-foreground/[0.05]', task.completed && 'opacity-60')}>
        <div className="flex items-start gap-2.5">
          <span className={cn('mt-1 flex size-5 shrink-0 items-center justify-center rounded-full', TASK_TONES[task.type].split(' ').slice(0, 2).join(' '))}>{task.completed ? <Check className="size-3" /> : <span className="size-1.5 rounded-full bg-current" />}</span>
          <div className="min-w-0 flex-1"><p className={cn('text-[11px] font-bold', task.completed && 'line-through')}>{task.title}</p><p className="mt-1 truncate text-[9px] text-muted-foreground">{task.type} · {task.client}</p>{!compact && task.notes && <p className="mt-1 text-[9px] text-muted-foreground">{task.notes}</p>}<Link href={link.href} className="mt-1.5 inline-block text-[9px] font-semibold text-foreground/70 underline-offset-2 hover:underline">{link.label} →</Link></div>
          <PersonBadge id={task.owner} size="sm" />
        </div>
      </article>
    );
  }
  return (
    <article className={cn('rounded-2xl bg-foreground/[0.035] p-3 ring-1 ring-foreground/[0.09] transition-colors hover:bg-foreground/[0.055]', task.completed && 'opacity-55')}>
      <div className="flex items-start gap-2.5">
        <button aria-label={task.completed ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`} onClick={onToggle} className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border border-foreground/20 transition-colors hover:border-foreground/50">{task.completed && <Check className="size-3.5" />}</button>
        <div className="min-w-0 flex-1"><p className={cn('truncate text-[11px] font-bold', task.completed && 'line-through')}>{task.title}</p><p className="mt-1 truncate text-[9px] text-muted-foreground">{compact ? 'Yesterday' : minutesToTime(task.startMinutes)} · <span className="inline-flex items-center gap-1"><span className={cn('inline-block size-1.5 rounded-full', typeDot(task.type))} />{task.type}</span>{!compact && ` · ${task.client}`}</p></div>
        <PersonBadge id={task.owner} size="sm" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild><button aria-label={`Options for ${task.title}`} className="flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground"><Ellipsis className="size-3.5" /></button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5"><DropdownMenuItem onSelect={onToggle} className="py-2"><CircleCheck />{task.completed ? 'Mark incomplete' : 'Mark complete'}</DropdownMenuItem><DropdownMenuItem onSelect={onMoveTomorrow} className="py-2"><CalendarCheck2 />Move to tomorrow</DropdownMenuItem><DropdownMenuItem onSelect={onDuplicate} className="py-2"><Copy />Duplicate task</DropdownMenuItem></DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  );
}

function typeDot(type: TaskType) { return { Call: 'bg-lime-400', Meeting: 'bg-[#ff8f78]', Task: 'bg-stone-300', Email: 'bg-sky-400', Payment: 'bg-emerald-400', Delivery: 'bg-violet-400', Deal: 'bg-amber-400' }[type]; }
function minutesToTime(minutes: number, compact = false) { const hour = Math.floor(minutes / 60); const minute = minutes % 60; const suffix = hour >= 12 ? 'PM' : 'AM'; const minuteText = minute ? `:${String(minute).padStart(2, '0')}` : ''; return compact ? `${hour % 12 || 12}${minuteText}${suffix.toLowerCase()}` : `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${suffix}`; }
function formatHour(hour: number) { return `${hour % 12 || 12} ${hour >= 12 ? 'PM' : 'AM'}`; }
