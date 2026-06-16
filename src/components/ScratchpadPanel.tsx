'use client';

import React from 'react';
import { useStore } from '@/lib/store';
import { translations } from '@/lib/i18n';
import { Textarea } from '@/components/ui/textarea';
import { X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ScratchpadPanel() {
  const { scratchpadContent, setScratchpadContent, setShowScratchpad, locale } = useStore();
  const t = translations[locale];

  return (
    <div className="w-64 flex-shrink-0 flex flex-col border-l border-white/20 dark:border-white/5 bg-white/30 dark:bg-white/[0.03] backdrop-blur-2xl scratchpad-panel animate-slide-in-right">
      <div className="px-3 py-2.5 border-b border-white/15 dark:border-white/5 flex items-center justify-between">
        <span className="font-bold text-xs tracking-tight">📝 {t.actions.scratchpad}</span>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-lg"
            onClick={() => setScratchpadContent('')}
            title="Clear"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-lg"
            onClick={() => setShowScratchpad(false)}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
      <div className="flex-1 p-3">
        <Textarea
          value={scratchpadContent}
          onChange={(e) => setScratchpadContent(e.target.value)}
          placeholder={t.actions.scratchpadPlaceholder}
          className="h-full min-h-[200px] text-xs bg-white/40 dark:bg-white/5 border-white/30 dark:border-white/5 rounded-xl resize-none"
        />
      </div>
    </div>
  );
}
