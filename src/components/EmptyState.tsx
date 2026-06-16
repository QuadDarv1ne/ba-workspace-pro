'use client';

import React from 'react';
import { motion } from 'framer-motion';

function TasksIllustration() {
  return (
    <svg width="120" height="90" viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-40 dark:opacity-30">
      <rect x="10" y="10" width="100" height="16" rx="4" className="fill-orange-200 dark:fill-orange-900/40" />
      <rect x="18" y="14" width="4" height="8" rx="1" className="fill-orange-400 dark:fill-orange-500" />
      <rect x="26" y="14" width="50" height="8" rx="1" className="fill-orange-300/60 dark:fill-orange-600/40" />
      <rect x="10" y="34" width="100" height="16" rx="4" className="fill-slate-200 dark:fill-slate-800/40" />
      <rect x="18" y="38" width="4" height="8" rx="1" className="fill-slate-400 dark:fill-slate-500" />
      <rect x="26" y="38" width="40" height="8" rx="1" className="fill-slate-300/60 dark:fill-slate-600/40" />
      <rect x="10" y="58" width="100" height="16" rx="4" className="fill-emerald-200 dark:fill-emerald-900/40" />
      <rect x="18" y="62" width="4" height="8" rx="1" className="fill-emerald-400 dark:fill-emerald-500" />
      <rect x="26" y="62" width="55" height="8" rx="1" className="fill-emerald-300/60 dark:fill-emerald-600/40" />
    </svg>
  );
}

function AnalyticsIllustration() {
  return (
    <svg width="120" height="90" viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-40 dark:opacity-30">
      <rect x="15" y="55" width="16" height="30" rx="3" className="fill-orange-300 dark:fill-orange-700/50" />
      <rect x="37" y="35" width="16" height="50" rx="3" className="fill-blue-300 dark:fill-blue-700/50" />
      <rect x="59" y="20" width="16" height="65" rx="3" className="fill-emerald-300 dark:fill-emerald-700/50" />
      <rect x="81" y="40" width="16" height="45" rx="3" className="fill-purple-300 dark:fill-purple-700/50" />
      <line x1="10" y1="80" x2="110" y2="80" className="stroke-slate-300 dark:stroke-slate-600" strokeWidth="2" strokeLinecap="round" />
      <circle cx="45" cy="40" r="2" className="fill-orange-400 dark:fill-orange-400" />
      <circle cx="67" cy="25" r="2" className="fill-orange-400 dark:fill-orange-400" />
      <circle cx="89" cy="45" r="2" className="fill-orange-400 dark:fill-orange-400" />
      <path d="M23 60 L45 40 L67 25 L89 45" className="stroke-orange-400/50 dark:stroke-orange-500/50" strokeWidth="1.5" strokeDasharray="3 2" fill="none" />
    </svg>
  );
}

function SearchIllustration() {
  return (
    <svg width="120" height="90" viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-40 dark:opacity-30">
      <circle cx="50" cy="40" r="20" className="stroke-slate-300 dark:stroke-slate-600" strokeWidth="2.5" />
      <circle cx="50" cy="40" r="8" className="fill-slate-200 dark:fill-slate-700/50" />
      <line x1="64" y1="54" x2="78" y2="68" className="stroke-slate-300 dark:stroke-slate-600" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="85" y="64" width="18" height="6" rx="2" className="fill-slate-200 dark:fill-slate-700/50" transform="rotate(-45 85 64)" />
    </svg>
  );
}

export function EmptyState({ type = 'tasks', searchQuery }: { type?: 'tasks' | 'analytics' | 'search'; searchQuery?: string }) {
  const illustration = type === 'analytics' ? <AnalyticsIllustration /> : type === 'search' ? <SearchIllustration /> : <TasksIllustration />;
  const title = type === 'analytics'
    ? 'No analytics data yet'
    : type === 'search'
      ? 'No results found'
      : 'No tasks yet';
  const description = type === 'analytics'
    ? 'Start creating tasks to see insights and trends'
    : type === 'search'
      ? `No tasks match "${searchQuery}"`
      : 'Create your first task to get started';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-12 px-4"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
      >
        {illustration}
      </motion.div>
      <p className="text-sm font-semibold text-foreground/70 mt-4">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 text-center max-w-[200px]">{description}</p>
    </motion.div>
  );
}
