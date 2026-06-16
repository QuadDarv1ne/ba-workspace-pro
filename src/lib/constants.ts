export const typeColors: Record<string, string> = {
  integration: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  migration: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  uiux: 'bg-pink-500/15 text-pink-600 dark:text-pink-400',
  feature: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  bug: 'bg-red-500/15 text-red-600 dark:text-red-400',
  general: 'bg-slate-500/15 text-slate-600 dark:text-slate-400',
  'api-design': 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
  performance: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
  security: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
  compliance: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
};

export const typeDotColors: Record<string, string> = {
  integration: 'bg-orange-500',
  migration: 'bg-purple-500',
  uiux: 'bg-pink-500',
  feature: 'bg-emerald-500',
  bug: 'bg-red-500',
  general: 'bg-slate-500',
  'api-design': 'bg-cyan-500',
  performance: 'bg-yellow-500',
  security: 'bg-indigo-500',
  compliance: 'bg-amber-500',
};

export const typeBorderColors: Record<string, string> = {
  integration: 'border-orange-500/40 bg-orange-500/8',
  migration: 'border-purple-500/40 bg-purple-500/8',
  uiux: 'border-pink-500/40 bg-pink-500/8',
  feature: 'border-emerald-500/40 bg-emerald-500/8',
  bug: 'border-red-500/40 bg-red-500/8',
  general: 'border-slate-500/40 bg-slate-500/8',
  'api-design': 'border-cyan-500/40 bg-cyan-500/8',
  performance: 'border-yellow-500/40 bg-yellow-500/8',
  security: 'border-indigo-500/40 bg-indigo-500/8',
  compliance: 'border-amber-500/40 bg-amber-500/8',
};

export const statusColors: Record<string, string> = {
  active: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  done: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  blocked: 'bg-red-500/15 text-red-600 dark:text-red-400',
  backlog: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
};

export const statusDotColors: Record<string, string> = {
  active: 'bg-orange-500',
  done: 'bg-emerald-500',
  blocked: 'bg-red-500',
  backlog: 'bg-amber-500',
};

export const statusChartColors: Record<string, string> = {
  active: 'bg-orange-500',
  done: 'bg-emerald-500',
  blocked: 'bg-red-500',
  backlog: 'bg-amber-500',
};

export const priorityColors: Record<string, string> = {
  low: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  medium: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  high: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  critical: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

export const priorityChartColors: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-blue-500',
  low: 'bg-slate-400',
};

export const priorityCycle = ['low', 'medium', 'high', 'critical'] as const;

export const statusCycle = ['active', 'done', 'blocked', 'backlog'] as const;

export const taskTypes = [
  'integration',
  'migration',
  'uiux',
  'feature',
  'bug',
  'general',
  'api-design',
  'performance',
  'security',
  'compliance',
] as const;

export const progressRanges = [
  { label: '0-25%', min: 0, max: 25, color: 'bg-red-500' },
  { label: '26-50%', min: 26, max: 50, color: 'bg-amber-500' },
  { label: '51-75%', min: 51, max: 75, color: 'bg-blue-500' },
  { label: '76-100%', min: 76, max: 100, color: 'bg-emerald-500' },
];

export const chartColors: Record<string, string> = {
  integration: '#f97316',
  migration: '#a855f7',
  uiux: '#ec4899',
  feature: '#10b981',
  bug: '#ef4444',
  general: '#64748b',
  'api-design': '#06b6d4',
  performance: '#eab308',
  security: '#6366f1',
  compliance: '#f59e0b',
  active: '#f97316',
  done: '#10b981',
  blocked: '#ef4444',
  backlog: '#f59e0b',
  critical: '#ef4444',
  high: '#f97316',
  medium: '#3b82f6',
  low: '#94a3b8',
};

export function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function getTaskProgress(task: { questions: Array<{ completed: boolean; removed: boolean }> }): number {
  const active = task.questions.filter((q) => !q.removed);
  if (active.length === 0) return 0;
  return Math.round((active.filter((q) => q.completed).length / active.length) * 100);
}

export const INTEGRATIONS_KEY = 'ba-workspace-integrations';
