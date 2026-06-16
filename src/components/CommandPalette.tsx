'use client';

import React, { useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { translations } from '@/lib/i18n';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import {
  LayoutDashboard, BarChart3, Settings, Plus, Moon, Sun, Globe, Download, NotepadText,
} from 'lucide-react';
export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const {
    locale, setLocale, toggleDarkMode, darkMode, setViewMode,
    setShowCreateModal, setShowScratchpad, showScratchpad, tasks, setActiveTaskId,
  } = useStore();
  const t = translations[locale];

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onCustom = () => setOpen((o) => !o);
    document.addEventListener('keydown', down);
    window.addEventListener('open-command-palette', onCustom);
    return () => {
      document.removeEventListener('keydown', down);
      window.removeEventListener('open-command-palette', onCustom);
    };
  }, []);

  const run = useCallback((fn: () => void) => {
    setOpen(false);
    fn();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => run(() => setViewMode('workspace'))}>
            <LayoutDashboard className="w-4 h-4 mr-2" />
            {t.nav.workspace}
            <span className="ml-auto text-[10px] text-muted-foreground">⌘1</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => setViewMode('analytics'))}>
            <BarChart3 className="w-4 h-4 mr-2" />
            {t.nav.analytics}
            <span className="ml-auto text-[10px] text-muted-foreground">⌘2</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => setViewMode('settings'))}>
            <Settings className="w-4 h-4 mr-2" />
            {t.nav.settings}
            <span className="ml-auto text-[10px] text-muted-foreground">⌘3</span>
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => run(() => setShowCreateModal(true))}>
            <Plus className="w-4 h-4 mr-2" />
            {t.tasks.newTask}
            <span className="ml-auto text-[10px] text-muted-foreground">⌘N</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => setShowScratchpad(!showScratchpad))}>
            <NotepadText className="w-4 h-4 mr-2" />
            {t.actions.scratchpad}
          </CommandItem>
          <CommandItem onSelect={() => run(() => toggleDarkMode())}>
            {darkMode ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
            {darkMode ? t.actions.lightTheme : t.actions.darkTheme}
          </CommandItem>
          <CommandItem onSelect={() => run(() => setLocale(locale === 'ru' ? 'en' : 'ru'))}>
            <Globe className="w-4 h-4 mr-2" />
            Switch to {locale === 'ru' ? 'English' : 'Русский'}
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Export">
          <CommandItem onSelect={() => run(() => {
            const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ba-workspace-backup-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
          })}>
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </CommandItem>
        </CommandGroup>
        {tasks.length > 0 && (
          <CommandGroup heading="Quick switch">
            {tasks.filter((t) => t.status !== 'done').slice(0, 8).map((task) => (
              <CommandItem key={task.id} onSelect={() => run(() => {
                setActiveTaskId(task.id);
                setViewMode('workspace');
              })}>
                <div className={`w-2 h-2 rounded-full mr-3 ${task.status === 'blocked' ? 'bg-red-500' : task.status === 'active' ? 'bg-orange-500' : 'bg-amber-500'}`} />
                <span className="truncate">{task.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
