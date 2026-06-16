'use client';

import React from 'react';
import { useStore } from '@/lib/store';
import { translations } from '@/lib/i18n';
import { typeDotColors, chartColors, getTaskProgress } from '@/lib/constants';
import type { TaskStatus } from '@/lib/types';
import { BarChart3, Clock, CheckCircle2, AlertCircle, ListChecks, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

export function AnalyticsView() {
  const { tasks, locale } = useStore();
  const t = translations[locale];

  const totalTasks = tasks.length;
  const activeTasks = tasks.filter((t) => t.status === 'active').length;
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const avgTime = totalTasks > 0
    ? Math.round(tasks.reduce((acc, t) => acc + t.timerSeconds, 0) / totalTasks / 60)
    : 0;

  const typeCounts: Record<string, number> = {};
  tasks.forEach((task) => {
    typeCounts[task.type] = (typeCounts[task.type] || 0) + 1;
  });

  const statusCounts: Record<string, number> = {};
  tasks.forEach((task) => {
    statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
  });

  const priorityCounts: Record<string, number> = {};
  tasks.forEach((task) => {
    priorityCounts[task.priority] = (priorityCounts[task.priority] || 0) + 1;
  });

  if (totalTasks === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white/20 dark:bg-white/[0.02] backdrop-blur-xl">
        <div className="text-center text-muted-foreground animate-fade-in-up">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent flex items-center justify-center mx-auto mb-5 border border-blue-500/10">
            <BarChart3 className="w-8 h-8 text-blue-500/30" />
          </div>
          <p className="text-sm font-semibold">{t.analytics.noData}</p>
          <p className="text-xs mt-2 opacity-50 max-w-[200px] mx-auto">
            {locale === 'ru' ? 'Создай задачи, чтобы увидеть аналитику' : 'Create tasks to see analytics'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6 bg-white/20 dark:bg-white/[0.02] backdrop-blur-xl">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-orange-500" />
          {t.analytics.title}
          <span className="text-xs text-muted-foreground font-normal ml-auto">{tasks.length} {t.analytics.totalTasks.toLowerCase()}</span>
        </h1>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger-children">
          <StatCard icon={<ListChecks className="w-4 h-4" />} label={t.analytics.totalTasks} value={totalTasks} gradient="from-slate-500/10 to-slate-500/5" iconColor="text-slate-600 dark:text-slate-400" />
          <StatCard icon={<AlertCircle className="w-4 h-4" />} label={t.analytics.activeTasks} value={activeTasks} gradient="from-orange-500/10 to-orange-500/5" iconColor="text-orange-500" />
          <StatCard icon={<CheckCircle2 className="w-4 h-4" />} label={t.analytics.completedTasks} value={completedTasks} gradient="from-emerald-500/10 to-emerald-500/5" iconColor="text-emerald-500" />
          <StatCard icon={<Clock className="w-4 h-4" />} label={t.analytics.avgTime} value={`${avgTime} min`} gradient="from-blue-500/10 to-blue-500/5" iconColor="text-blue-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white/40 dark:bg-white/5 backdrop-blur-lg border-white/25 dark:border-white/5">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-bold">{t.analytics.tasksByType}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="space-y-2 mb-3">
                {Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                  <div key={type} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${typeDotColors[type] || 'bg-gray-400'}`} />
                    <span className="text-[11px] flex-1 truncate">{t.taskTypes[type as keyof typeof t.taskTypes]?.name || type}</span>
                    <div className="w-20 h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${typeDotColors[type] || 'bg-gray-400'}`} style={{ width: `${(count / totalTasks) * 100}%` }} />
                    </div>
                    <span className="text-[10px] font-bold w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([type, count]) => ({ name: (t.taskTypes[type as keyof typeof t.taskTypes]?.name || type).slice(0, 8), count }))}>
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}
                      formatter={(value: number) => [value, 'Tasks']}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={24}>
                      {Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([type], idx) => (
                        <Cell key={idx} fill={chartColors[type] || '#94a3b8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/40 dark:bg-white/5 backdrop-blur-lg border-white/25 dark:border-white/5">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-bold">{t.analytics.tasksByStatus}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="h-40 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(statusCounts).map(([status, count]) => ({
                        name: t.status[status as TaskStatus],
                        value: count,
                        fill: chartColors[status] || '#94a3b8',
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {Object.entries(statusCounts).map(([status], idx) => (
                        <Cell key={idx} fill={chartColors[status] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-3 mt-1">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <div key={status} className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: chartColors[status] || '#94a3b8' }} />
                    <span className="text-[9px] text-muted-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/40 dark:bg-white/5 backdrop-blur-lg border-white/25 dark:border-white/5">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-bold">{t.analytics.tasksByPriority}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={['critical', 'high', 'medium', 'low'].map((p) => ({
                    name: t.priority[p as keyof typeof t.priority].slice(0, 4),
                    count: priorityCounts[p] || 0,
                  }))}>
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={32}>
                      {['critical', 'high', 'medium', 'low'].map((p, idx) => (
                        <Cell key={idx} fill={chartColors[p] || '#94a3b8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-3 mt-1">
                {['critical', 'high', 'medium', 'low'].map((p) => (
                  <div key={p} className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: chartColors[p] || '#94a3b8' }} />
                    <span className="text-[9px] text-muted-foreground">{priorityCounts[p] || 0}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/40 dark:bg-white/5 backdrop-blur-lg border-white/25 dark:border-white/5">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-bold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              {t.analytics.timeTrend}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={tasks
                    .filter((task) => task.timerSeconds > 0)
                    .sort((a, b) => b.timerSeconds - a.timerSeconds)
                    .slice(0, 10)
                    .map((task) => ({
                      name: task.name.length > 16 ? task.name.slice(0, 16) + '...' : task.name,
                      minutes: Math.round(task.timerSeconds / 60),
                    }))}
                >
                  <XAxis dataKey="name" tick={{ fontSize: 8 }} axisLine={false} tickLine={false} interval={0} angle={-30} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}
                    formatter={(value: number) => [`${value} min`, locale === 'ru' ? 'Время' : 'Time']}
                  />
                  <Bar dataKey="minutes" radius={[4, 4, 0, 0]} maxBarSize={32} fill="url(#timeGradient)" />
                  <defs>
                    <linearGradient id="timeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {tasks.filter((t) => t.timerSeconds > 0).length === 0 && (
              <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
                {locale === 'ru' ? 'Запусти таймер, чтобы увидеть данные' : 'Start a timer to see data'}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/40 dark:bg-white/5 backdrop-blur-lg border-white/25 dark:border-white/5">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-bold flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
              {t.analytics.recentActivity}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-1.5">
              {tasks.slice(0, 8).map((task) => {
                const progress = getTaskProgress(task);
                return (
                  <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/30 dark:bg-white/3">
                    <span className="text-sm">{t.taskTypes[task.type as keyof typeof t.taskTypes]?.icon}</span>
                    <span className="text-xs font-semibold flex-1 truncate">{task.name}</span>
                    <span className="text-[10px] text-muted-foreground">{progress}%</span>
                    <div className="w-16 h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-orange-500'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      task.status === 'done' ? 'bg-emerald-500/15 text-emerald-600' :
                      task.status === 'blocked' ? 'bg-red-500/15 text-red-600' :
                      task.status === 'backlog' ? 'bg-amber-500/15 text-amber-600' :
                      'bg-orange-500/15 text-orange-600'
                    }`}>
                      {t.status[task.status as TaskStatus]}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, gradient, iconColor }: { icon: React.ReactNode; label: string; value: string | number; gradient: string; iconColor: string }) {
  return (
    <Card className="bg-white/40 dark:bg-white/5 backdrop-blur-lg border-white/25 dark:border-white/5 hover-lift overflow-hidden">
      <CardContent className="p-4">
        <div className={`mb-2.5 w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center ${iconColor}`}>
          {icon}
        </div>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        <div className="text-[10px] text-muted-foreground font-medium mt-0.5">{label}</div>
      </CardContent>
    </Card>
  );
}
