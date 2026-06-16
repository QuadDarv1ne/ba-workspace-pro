'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { translations } from '@/lib/i18n';
import { typeColors, statusDotColors, formatTimer, statusCycle } from '@/lib/constants';
import type { FilterStatus, TaskStatus, Task } from '@/lib/types';
import { Plus, Download, Upload, Trash2, XCircle, Search, X, ArrowUpDown, GripVertical, CopyPlus, ChevronDown, FileJson, FileText, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { useVirtualizer } from '@tanstack/react-virtual';

type SortKey = 'createdAt' | 'priority' | 'status' | 'name';
const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const statusOrder: Record<string, number> = { active: 0, blocked: 1, backlog: 2, done: 3 };

const priorityBarColors: Record<string, string> = {
  critical: 'bg-gradient-to-b from-red-500 to-red-600',
  high: 'bg-gradient-to-b from-orange-500 to-orange-600',
  medium: 'bg-gradient-to-b from-blue-500 to-blue-600',
  low: 'bg-gradient-to-b from-slate-400 to-slate-500',
};

export function TaskListPanel() {
  const {
    tasks, activeTaskId, setActiveTaskId, filterStatus, setFilterStatus,
    setShowCreateModal, deleteClosedTasks, clearAllTasks, locale, showConfirm,
    updateTaskStatus, reorderTasks,
  } = useStore();
  const t = translations[locale];

  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortAsc, setSortAsc] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [showFooterActions, setShowFooterActions] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const lastClickedIdx = useRef<number>(-1);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && e.target === document.body) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filters: { key: FilterStatus; label: string; count: number }[] = useMemo(() => [
    { key: 'all', label: t.tasks.all, count: tasks.length },
    { key: 'active', label: t.tasks.active, count: tasks.filter((t) => t.status === 'active').length },
    { key: 'blocked', label: t.tasks.blocked, count: tasks.filter((t) => t.status === 'blocked').length },
    { key: 'backlog', label: t.tasks.backlog, count: tasks.filter((t) => t.status === 'backlog').length },
    { key: 'done', label: t.tasks.done, count: tasks.filter((t) => t.status === 'done').length },
  ], [tasks, t]);

  const filteredTasks = useMemo(() => {
    let result = filterStatus === 'all'
      ? tasks
      : tasks.filter((task) => task.status === filterStatus);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((task) => {
        if (task.name.toLowerCase().includes(q)) return true;
        if (task.tags.some((tag) => tag.toLowerCase().includes(q))) return true;
        if (task.type.toLowerCase().includes(q)) return true;
        if (task.notes.toLowerCase().includes(q)) return true;
        if (task.questions.some((question) =>
          question.text.toLowerCase().includes(q) || question.answer.toLowerCase().includes(q)
        )) return true;
        if (task.decisions.some((d) => d.text.toLowerCase().includes(q))) return true;
        if (task.risks.some((r) => r.text.toLowerCase().includes(q))) return true;
        if (task.acceptanceCrit.some((c) => c.text.toLowerCase().includes(q))) return true;
        return false;
      });
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'priority':
          cmp = (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
          break;
        case 'status':
          cmp = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
          break;
        case 'createdAt':
        default:
          cmp = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
      }
      return sortAsc ? -cmp : cmp;
    });

    return result;
  }, [tasks, filterStatus, searchQuery, sortKey, sortAsc]);

  const taskIdOrder = useMemo(() => filteredTasks.map((t) => t.id), [filteredTasks]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = taskIdOrder.indexOf(active.id as string);
    const newIndex = taskIdOrder.indexOf(over.id as string);
    if (oldIndex !== -1 && newIndex !== -1) {
      const globalOldIndex = tasks.findIndex((t) => t.id === active.id);
      const globalNewIndex = tasks.findIndex((t) => t.id === over.id);
      if (globalOldIndex !== -1 && globalNewIndex !== -1) {
        reorderTasks(globalOldIndex, globalNewIndex);
      }
    }
  }, [taskIdOrder, tasks, reorderTasks]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sortLabels: Record<SortKey, string> = {
    createdAt: locale === 'ru' ? 'Дата' : 'Date',
    priority: locale === 'ru' ? 'Приор.' : 'Priority',
    status: locale === 'ru' ? 'Статус' : 'Status',
    name: 'A-Z',
  };

  const exportMd = async () => {
    const res = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks, format: 'markdown' }),
    });
    const data = await res.json();
    if (data.content) {
      const blob = new Blob([data.content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ba-workspace-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (Array.isArray(data)) {
            importTasks(data);
          }
        } catch { }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const importTasks = (importedTasks: any[]) => {
    const { tasks: currentTasks, setTasks } = useStore.getState();
    const existingIds = new Set(currentTasks.map((t) => t.id));
    const newTasks = importedTasks.filter((t) => t.id && !existingIds.has(t.id));
    if (newTasks.length === 0) return;
    setTasks([...newTasks, ...currentTasks]);
  };

  const toggleSelect = useCallback((taskId: string, shiftKey: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const filtered = filteredTasks;
      const clickedIdx = filtered.findIndex((t) => t.id === taskId);

      if (shiftKey && lastClickedIdx.current >= 0) {
        const start = Math.min(lastClickedIdx.current, clickedIdx);
        const end = Math.max(lastClickedIdx.current, clickedIdx);
        for (let i = start; i <= end; i++) {
          next.add(filtered[i].id);
        }
      } else {
        if (next.has(taskId)) {
          next.delete(taskId);
        } else {
          next.add(taskId);
        }
      }
      lastClickedIdx.current = clickedIdx;
      return next;
    });
  }, [filteredTasks]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    lastClickedIdx.current = -1;
  }, []);

  const bulkSetStatus = useCallback((status: TaskStatus) => {
    selectedIds.forEach((id) => updateTaskStatus(id, status));
    clearSelection();
  }, [selectedIds, updateTaskStatus, clearSelection]);

  const bulkDelete = useCallback(() => {
    const names = tasks.filter((t) => selectedIds.has(t.id)).map((t) => t.name).join(', ');
    showConfirm(
      locale === 'ru' ? 'Удалить задачи' : 'Delete tasks',
      `${locale === 'ru' ? 'Удалить' : 'Delete'} ${selectedIds.size} ${locale === 'ru' ? 'задач' : 'tasks'}?`,
      () => {
        selectedIds.forEach((id) => useStore.getState().deleteTask(id));
        clearSelection();
      }
    );
  }, [selectedIds, tasks, showConfirm, locale, clearSelection]);

  const activeDragTask = activeDragId ? tasks.find((t) => t.id === activeDragId) : null;
  const activeCount = tasks.filter((t) => t.status !== 'done').length;

  return (
    <div className="w-72 flex-shrink-0 flex flex-col border-r border-white/20 dark:border-white/5 bg-white/40 dark:bg-white/[0.04] backdrop-blur-2xl task-list-panel animate-slide-in-left shadow-r-lg">
      {/* Header with gradient accent */}
      <div className="px-3 py-2.5 border-b border-white/15 dark:border-white/5 flex items-center justify-between bg-gradient-to-r from-orange-500/5 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-orange-500 to-orange-600 shadow-sm shadow-orange-500/30" />
          <span className="font-bold text-xs tracking-tight">{t.tasks.title}</span>
          <span className="text-[10px] text-muted-foreground font-semibold bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded-full tabular-nums">
            {activeCount}<span className="text-muted-foreground/40">/{tasks.length}</span>
          </span>
        </div>
        <Button
          size="sm"
          className="h-7 px-2.5 text-[11px] font-bold rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md shadow-orange-500/20 text-white press-scale ripple"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Search */}
      <div className="px-2.5 pt-2.5 pb-1">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
          <Input
            ref={searchRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={locale === 'ru' ? 'Поиск задач... (нажми /)' : 'Search tasks... (press /)'}
            className="h-8 pl-7 pr-7 text-[11px] bg-white/50 dark:bg-white/5 border-white/30 dark:border-white/5 rounded-lg"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-all"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="px-2.5 pt-1.5 pb-1">
        <div className="flex items-center gap-0.5 p-0.5 bg-black/3 dark:bg-white/3 rounded-lg">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`relative flex-1 px-1.5 py-1 rounded-md text-[10px] font-semibold transition-all duration-200 ${
                filterStatus === f.key
                  ? 'bg-white/80 dark:bg-white/10 text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
              {f.count > 0 && (
                <span className={`ml-0.5 text-[8px] ${filterStatus === f.key ? 'text-orange-500 font-bold' : 'text-muted-foreground/50'}`}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Sort toggle */}
      <div className="px-2.5 pb-1">
        <button
          onClick={() => setShowSort(!showSort)}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-all w-full px-1.5 py-1 rounded-md hover:bg-black/3 dark:hover:bg-white/3"
        >
          <ArrowUpDown className="w-2.5 h-2.5" />
          <span className="font-medium">{sortLabels[sortKey]}{sortAsc ? ' ↑' : ' ↓'}</span>
          <ChevronDown className={`w-2.5 h-2.5 ml-auto transition-transform duration-200 ${showSort ? 'rotate-180' : ''}`} />
        </button>
        {showSort && (
          <div className="flex items-center gap-1 mt-1 animate-fade-in">
            {(['createdAt', 'priority', 'status', 'name'] as SortKey[]).map((key) => (
              <button
                key={key}
                onClick={() => toggleSort(key)}
                className={`text-[9px] font-semibold px-2 py-1 rounded-md transition-all ${
                  sortKey === key
                    ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400'
                    : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {sortLabels[key]}
                {sortKey === key && (sortAsc ? ' ↑' : ' ↓')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Task list */}
      <ScrollArea className="flex-1 px-2">
        {filteredTasks.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {searchQuery ? (
              <div className="animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-black/3 dark:bg-white/3 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-5 h-5 text-muted-foreground/40" />
                </div>
                <p className="text-xs font-medium">{locale === 'ru' ? 'Ничего не найдено' : 'No results found'}</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-[10px] text-orange-500 hover:text-orange-600 font-semibold"
                >
                  {locale === 'ru' ? 'Сбросить поиск' : 'Clear search'}
                </button>
              </div>
            ) : (
              <div className="animate-fade-in-up">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 flex items-center justify-center mx-auto mb-4 border border-orange-500/10">
                  <Plus className="w-7 h-7 text-orange-500/40" />
                </div>
                <p className="text-xs font-medium text-muted-foreground mb-1">{t.tasks.empty}</p>
                <p className="text-[10px] text-muted-foreground/50 mb-3">
                  {locale === 'ru' ? 'Начни с создания первой задачи' : 'Start by creating your first task'}
                </p>
                <button
                  className="inline-flex items-center gap-1.5 text-orange-500 hover:text-orange-600 font-semibold text-[11px] bg-orange-500/10 px-3 py-1.5 rounded-full transition-all hover:bg-orange-500/20 press-scale"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="w-3 h-3" />
                  {t.tasks.createFirst}
                </button>
              </div>
            )}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext items={taskIdOrder} strategy={verticalListSortingStrategy}>
              <TaskVirtualList
                tasks={filteredTasks}
                activeTaskId={activeTaskId}
                selectedIds={selectedIds}
                searchQuery={searchQuery}
                onToggleSelect={toggleSelect}
                onCycleStatus={(id) => {
                  const task = filteredTasks.find((t) => t.id === id);
                  if (!task) return;
                  const idx = statusCycle.indexOf(task.status as typeof statusCycle[number]);
                  const nextStatus = statusCycle[(idx + 1) % statusCycle.length];
                  updateTaskStatus(id, nextStatus);
                }}
                onDuplicate={(id) => useStore.getState().duplicateTask(id)}
                onDelete={(id, name) => {
                  const store = useStore.getState();
                  store.showConfirm(t.actions.delete, `Delete "${name}"?`, () => store.deleteTask(id));
                }}
                statusLabels={t.status}
                typeLabels={t.taskTypes}
                locale={locale}
              />
            </SortableContext>
            <DragOverlay dropAnimation={null}>
              {activeDragTask && (
                <div className="w-[264px] p-3 rounded-xl bg-white/95 dark:bg-slate-800/95 border border-orange-500/30 shadow-2xl shadow-orange-500/10 backdrop-blur-xl">
                  <div className="flex items-center gap-2">
                    <div className={`w-1 h-8 rounded-full ${priorityBarColors[activeDragTask.priority]}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[12.5px] leading-tight truncate">{activeDragTask.name}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-full ${typeColors[activeDragTask.type]}`}>
                          {activeDragTask.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </ScrollArea>

      {/* Bulk selection action bar */}
      {selectedIds.size > 0 && (
        <div className="px-2.5 py-2 border-t border-orange-500/20 bg-orange-500/8 dark:bg-orange-500/5 animate-fade-in">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
              {selectedIds.size} {locale === 'ru' ? 'выбрано' : 'selected'}
            </span>
            <button onClick={clearSelection} className="text-[9px] text-muted-foreground hover:text-foreground transition-colors">
              {locale === 'ru' ? 'Сбросить' : 'Clear'}
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {(['active', 'done', 'blocked', 'backlog'] as TaskStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => bulkSetStatus(status)}
                className={`text-[9px] font-semibold px-2 py-1 rounded-md transition-all press-scale ${
                  status === 'done' ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25' :
                  status === 'blocked' ? 'bg-red-500/15 text-red-600 hover:bg-red-500/25' :
                  status === 'backlog' ? 'bg-amber-500/15 text-amber-600 hover:bg-amber-500/25' :
                  'bg-orange-500/15 text-orange-600 hover:bg-orange-500/25'
                }`}
              >
                {t.status[status]}
              </button>
            ))}
            <button
              onClick={bulkDelete}
              className="text-[9px] font-semibold px-2 py-1 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all press-scale"
            >
              {t.actions.delete}
            </button>
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div className="px-2.5 py-2 border-t border-white/15 dark:border-white/5">
        <button
          onClick={() => setShowFooterActions(!showFooterActions)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] text-muted-foreground hover:bg-black/3 dark:hover:bg-white/3 transition-all font-medium"
        >
          <FileText className="w-3 h-3" />
          {locale === 'ru' ? 'Действия' : 'Actions'}
          <ChevronDown className={`w-2.5 h-2.5 ml-auto transition-transform duration-200 ${showFooterActions ? 'rotate-180' : ''}`} />
        </button>
        {showFooterActions && (
          <div className="mt-1 space-y-0.5 animate-fade-in stagger-children">
            <button onClick={exportMd} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground transition-all group">
              <FileText className="w-3 h-3 group-hover:text-emerald-500" />
              {t.tasks.exportMd}
            </button>
            <button onClick={exportJson} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground transition-all group">
              <FileJson className="w-3 h-3 group-hover:text-blue-500" />
              Export JSON
            </button>
            <button onClick={importJson} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground transition-all group">
              <Upload className="w-3 h-3 group-hover:text-purple-500" />
              Import JSON
            </button>
            <div className="h-px bg-black/5 dark:bg-white/5 my-1" />
            <button onClick={deleteClosedTasks} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground transition-all group">
              <Trash2 className="w-3 h-3 group-hover:text-amber-500" />
              {t.tasks.deleteClosed}
            </button>
            <button onClick={() => showConfirm(t.tasks.clearAll, t.tasks.clearAll + '?', clearAllTasks)} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] text-red-400/70 hover:bg-red-500/8 hover:text-red-500 transition-all group">
              <XCircle className="w-3 h-3" />
              {t.tasks.clearAll}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-orange-500/20 text-orange-700 dark:text-orange-300 rounded-sm px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function SortableTaskItem({
  task, isActive, isSelected, onSelect, onToggleSelect, onCycleStatus, statusLabel, typeLabel, searchQuery = '',
  onDuplicate, onDelete,
}: {
  task: Task; isActive: boolean; isSelected: boolean; onSelect: () => void; onToggleSelect: (shiftKey: boolean) => void;
  onCycleStatus: () => void;
  statusLabel: string; typeLabel: string; searchQuery?: string;
  onDuplicate?: () => void; onDelete?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : 'auto',
  };

  const completedCounts = task.questions.filter((q) => q.completed && !q.removed).length;
  const totalCounts = task.questions.filter((q) => !q.removed).length;
  const progress = totalCounts > 0 ? (completedCounts / totalCounts) * 100 : 0;

  const [showActions, setShowActions] = React.useState(false);

  const statusGlowClass = {
    active: 'status-glow-active',
    done: 'status-glow-done',
    blocked: 'status-glow-blocked',
    backlog: 'status-glow-backlog',
  }[task.status] || '';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative flex items-stretch gap-0 rounded-xl transition-all duration-250 group overflow-hidden ${
        isSelected
          ? 'bg-blue-500/10 border border-blue-500/30 shadow-sm shadow-blue-500/10'
          : isActive
            ? 'bg-gradient-to-r from-orange-500/12 to-orange-500/6 border border-orange-500/25 shadow-sm shadow-orange-500/10'
            : 'hover:bg-white/60 dark:hover:bg-white/[0.05] border border-transparent hover:border-white/30 dark:hover:border-white/8'
      } ${isDragging ? 'shadow-xl ring-2 ring-orange-500/30' : ''} ${statusGlowClass}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Priority bar with gradient */}
      <div className={`w-[3px] flex-shrink-0 my-1.5 rounded-full bg-gradient-to-b ${
        task.priority === 'critical' ? 'from-red-500 to-red-600' :
        task.priority === 'high' ? 'from-orange-500 to-orange-600' :
        task.priority === 'medium' ? 'from-blue-500 to-blue-600' :
        'from-slate-400 to-slate-500'
      }`} />

      <div className="flex-1 min-w-0 p-2 pl-2">
        <div className="flex items-start justify-between gap-1">
          <button
            onClick={(e) => { onToggleSelect(e.shiftKey); }}
            className={`mt-0.5 w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center transition-all duration-150 ${
              isSelected
                ? 'bg-blue-500 border-blue-500 text-white scale-110'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:scale-110'
            }`}
            title={isSelected ? (locale === 'ru' ? 'Снять выделение' : 'Deselect') : (locale === 'ru' ? 'Выбрать (Shift для диапазона)' : 'Select (Shift for range)')}
          >
            {isSelected && <CheckSquare className="w-2.5 h-2.5" />}
          </button>
          <button onClick={onSelect} className="flex-1 text-left min-w-0 group/task pl-1.5">
            <div className="font-semibold text-[12.5px] leading-tight truncate group-hover/task:text-orange-600 dark:group-hover/task:text-orange-400 transition-colors">
              <Highlight text={task.name} query={searchQuery} />
            </div>
          </button>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {showActions && (
              <span className="flex items-center gap-0.5 animate-fade-in">
                <button
                  {...attributes}
                  {...listeners}
                  className="p-0.5 rounded text-muted-foreground/30 hover:text-orange-500 transition-all hover:bg-orange-500/10 cursor-grab active:cursor-grabbing"
                  title="Drag to reorder"
                >
                  <GripVertical className="w-2.5 h-2.5 grip-pattern" />
                </button>
                {onDuplicate && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
                    className="p-0.5 rounded text-muted-foreground/40 hover:text-blue-500 hover:bg-blue-500/10 transition-all"
                    title="Duplicate"
                  >
                    <CopyPlus className="w-2.5 h-2.5" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="p-0.5 rounded text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                )}
              </span>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onCycleStatus(); }}
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all hover:scale-125 ${
                task.status === 'done' ? 'bg-emerald-500' :
                task.status === 'blocked' ? 'bg-red-500' :
                task.status === 'backlog' ? 'bg-amber-500' :
                'bg-orange-500'
              } ${isActive ? 'ring-2 ring-offset-1 ring-offset-transparent' : ''}`}
              style={isActive ? { ringColor: task.status === 'done' ? '#10b981' : task.status === 'blocked' ? '#ef4444' : task.status === 'backlog' ? '#f59e0b' : '#f97316' } : {}}
              title={statusLabel}
            />
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full transition-all ${typeColors[task.type]}`}>
            {typeLabel}
          </span>
          {task.timerRunning && (
            <span className="text-[9px] text-emerald-500 font-mono font-semibold animate-pulse flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              {formatTimer(task.timerSeconds)}
            </span>
          )}
          {totalCounts > 0 && (
            <span className="text-[9px] text-muted-foreground/50 font-medium ml-auto tabular-nums">
              {completedCounts}/{totalCounts}
            </span>
          )}
        </div>
        {totalCounts > 0 && (
          <div className="h-[2px] bg-black/5 dark:bg-white/5 rounded-full overflow-hidden mt-1.5">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                progress === 100 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 
                progress >= 75 ? 'bg-gradient-to-r from-blue-500 to-blue-400' :
                progress >= 50 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                'bg-gradient-to-r from-orange-500 to-orange-400'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

const ITEM_HEIGHT = 72;

function TaskVirtualList({
  tasks, activeTaskId, selectedIds, searchQuery,
  onToggleSelect, onCycleStatus, onDuplicate, onDelete,
  statusLabels, locale,
}: {
  tasks: Task[];
  activeTaskId: string | null;
  selectedIds: Set<string>;
  searchQuery: string;
  onToggleSelect: (taskId: string, shiftKey: boolean) => void;
  onCycleStatus: (taskId: string) => void;
  onDuplicate: (taskId: string) => void;
  onDelete: (taskId: string, name: string) => void;
  statusLabels: Record<string, string>;
  locale: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 5,
  });

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-auto px-1"
    >
      <div
        style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const task = tasks[virtualRow.index];
          return (
            <div
              key={task.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <SortableTaskItem
                task={task}
                isActive={activeTaskId === task.id}
                isSelected={selectedIds.has(task.id)}
                searchQuery={searchQuery}
                onSelect={() => {}}
                onToggleSelect={(shiftKey) => onToggleSelect(task.id, shiftKey)}
                onCycleStatus={() => onCycleStatus(task.id)}
                onDuplicate={() => onDuplicate(task.id)}
                onDelete={() => onDelete(task.id, task.name)}
                statusLabel={statusLabels[task.status] || task.status}
                typeLabel={task.type}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
