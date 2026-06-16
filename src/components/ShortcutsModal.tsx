'use client';

import React, { useEffect } from 'react';
import { X, Command, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const shortcuts = [
  { keys: '⌘N', label: 'New task' },
  { keys: '⌘K', label: 'Command palette' },
  { keys: '⌘Z', label: 'Undo last action' },
  { keys: '⌘1-3', label: 'Switch views' },
  { keys: '⌘.', label: 'Toggle Zen mode' },
  { keys: 'j / k', label: 'Navigate tasks' },
  { keys: '/', label: 'Focus search' },
  { keys: '?', label: 'Show shortcuts' },
  { keys: 'Esc', label: 'Close modals' },
];

export function ShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-sm mx-4 bg-white/90 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-white/30 dark:border-white/5 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
          <h2 className="font-bold text-sm flex items-center gap-2">
            <Command className="w-3.5 h-3.5 text-orange-500" />
            Keyboard Shortcuts
          </h2>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="px-5 py-4 space-y-2">
          {shortcuts.map((s) => (
            <div key={s.keys} className="flex items-center justify-between py-1.5">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <kbd className="text-[10px] font-mono font-semibold bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded border border-black/10 dark:border-white/10">
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-black/5 dark:border-white/5">
          <p className="text-[9px] text-muted-foreground/40 text-center">Press ? to toggle this panel</p>
        </div>
      </div>
    </div>
  );
}
