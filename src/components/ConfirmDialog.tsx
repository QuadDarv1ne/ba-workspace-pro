'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { translations } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';

export function ConfirmDialog() {
  const { confirmDialog, hideConfirm, locale } = useStore();
  const t = translations[locale];
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const handleConfirm = useCallback(() => {
    confirmDialog.onConfirm();
    hideConfirm();
  }, [confirmDialog, hideConfirm]);

  useEffect(() => {
    if (!confirmDialog.open) return;
    cancelRef.current?.focus();

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        hideConfirm();
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleConfirm();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [confirmDialog.open, hideConfirm, handleConfirm]);

  if (!confirmDialog.open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={hideConfirm}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-sm mx-4 bg-white/90 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-white/30 dark:border-white/5 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden="true">
            <AlertTriangle className="w-4.5 h-4.5 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="confirm-title" className="font-bold text-sm">{confirmDialog.title}</h3>
            <p id="confirm-message" className="text-xs text-muted-foreground mt-1">{confirmDialog.message}</p>
          </div>
          <button onClick={hideConfirm} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all" aria-label={t.create.cancel}>
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
        <div className="px-5 py-3 border-t border-black/5 dark:border-white/5 flex items-center justify-end gap-2">
          <Button ref={cancelRef} variant="ghost" size="sm" className="text-xs" onClick={hideConfirm}>
            {t.create.cancel}
          </Button>
          <Button
            size="sm"
            className="text-xs bg-red-500 hover:bg-red-600 text-white"
            onClick={handleConfirm}
          >
            {confirmDialog.title}
          </Button>
        </div>
      </div>
    </div>
  );
}
