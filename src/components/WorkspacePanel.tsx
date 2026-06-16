'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { translations } from '@/lib/i18n';
import { typeColors, statusColors, formatTimer, statusCycle, INTEGRATIONS_KEY } from '@/lib/constants';
import type { Question, AcceptanceCriteria, Decision, Risk, Tail, Dependency, TaskStatus } from '@/lib/types';
import {
  ChevronDown, ChevronRight, Check, X, Plus, Copy, CopyPlus, Trash2,
  Play, Pause, RotateCcw, Sparkles, Bot, AlertTriangle, NotepadText,
  Bug, BookOpen, MessageSquare, Edit3, ChevronsUpDown, Loader2,
  MoreHorizontal, ExternalLink, Clock, Tag,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';

export function WorkspacePanel() {
  const { tasks, activeTaskId, updateTask, updateTaskStatus, duplicateTask, deleteTask, locale, setShowScratchpad, showScratchpad, aiLoading, setAiLoading, showConfirm } = useStore();
  const t = translations[locale];

  const task = tasks.find((t) => t.id === activeTaskId);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const tick = useCallback(() => {
    if (!task || !task.timerRunning) return;
    const startedAt = task.timerStartedAt ? new Date(task.timerStartedAt).getTime() : 0;
    if (!startedAt) return;
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    updateTask(task.id, { timerSeconds: elapsed });
  }, [task?.id, task?.timerRunning, task?.timerStartedAt, updateTask]);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (task?.timerRunning && task?.timerStartedAt) {
      tick();
      timerRef.current = setInterval(tick, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [task?.timerRunning, task?.id, task?.timerStartedAt, tick]);

  // Reset editing state when task changes
  useEffect(() => {
    setEditingName(false);
  }, [task?.id]);

  if (!task) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white/20 dark:bg-white/[0.02] backdrop-blur-xl">
        <div className="text-center text-muted-foreground max-w-sm animate-fade-in-up">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent flex items-center justify-center mx-auto mb-5 border border-orange-500/10">
            <NotepadText className="w-8 h-8 text-orange-500/30" />
          </div>
          <p className="text-sm font-semibold">{t.workspace.selectOrcreate}</p>
          <p className="text-xs mt-2 opacity-50 leading-relaxed max-w-[240px] mx-auto">{t.workspace.clickNew}</p>
          <button
            onClick={() => useStore.getState().setShowCreateModal(true)}
            className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 px-4 py-2 rounded-full transition-all shadow-lg shadow-orange-500/20 press-scale"
          >
            <Plus className="w-3.5 h-3.5" />
            {t.tasks.createFirst}
          </button>
          <div className="mt-6 flex items-center justify-center gap-3 text-[10px] text-muted-foreground/30">
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded border border-current font-mono">⌘N</kbd> {locale === 'ru' ? 'быстрое создание' : 'quick create'}</span>
          </div>
        </div>
      </div>
    );
  }

  const completedCount = task.questions.filter((q) => q.completed && !q.removed).length;
  const totalCount = task.questions.filter((q) => !q.removed).length;

  const toggleSection = (section: string) => {
    const current = task.collapsedSecs || {};
    updateTask(task.id, { collapsedSecs: { ...current, [section]: !current[section] } });
  };

  const isCollapsed = (section: string) => task.collapsedSecs?.[section] ?? false;
  const allCollapsed = Object.values(task.collapsedSecs || {}).filter(Boolean).length >= 6;
  const allExpanded = Object.values(task.collapsedSecs || {}).filter((v) => !v).length >= 6;

  const toggleAll = () => {
    const sections = ['questions', 'acceptance', 'decisions', 'risks', 'tails', 'dependencies', 'notes'];
    const newState: Record<string, boolean> = {};
    const target = !allCollapsed;
    sections.forEach((s) => { newState[s] = target; });
    updateTask(task.id, { collapsedSecs: newState });
  };

  const toggleQuestion = (qId: string) => {
    const updated = task.questions.map((q) =>
      q.id === qId ? { ...q, completed: !q.completed } : q
    );
    updateTask(task.id, { questions: updated });
  };

  const answerQuestion = (qId: string, answer: string) => {
    const updated = task.questions.map((q) =>
      q.id === qId ? { ...q, answer } : q
    );
    updateTask(task.id, { questions: updated });
  };

  const removeQuestion = (qId: string) => {
    const updated = task.questions.map((q) =>
      q.id === qId ? { ...q, removed: !q.removed } : q
    );
    updateTask(task.id, { questions: updated });
  };

  const addCustomQuestion = (text: string) => {
    if (!text.trim()) return;
    const newQ: Question = { id: `q-${Date.now()}`, text: text.trim(), answer: '', completed: false, removed: false };
    updateTask(task.id, { questions: [...task.questions, newQ] });
  };

  const addCriteria = (text: string) => {
    if (!text.trim()) return;
    const c: AcceptanceCriteria = { id: `ac-${Date.now()}`, text: text.trim(), done: false };
    updateTask(task.id, { acceptanceCrit: [...task.acceptanceCrit, c] });
  };

  const toggleCriteria = (cId: string) => {
    const updated = task.acceptanceCrit.map((c) =>
      c.id === cId ? { ...c, done: !c.done } : c
    );
    updateTask(task.id, { acceptanceCrit: updated });
  };

  const removeCriteria = (cId: string) => {
    updateTask(task.id, { acceptanceCrit: task.acceptanceCrit.filter((c) => c.id !== cId) });
  };

  const addDecision = (text: string) => {
    if (!text.trim()) return;
    const d: Decision = { id: `d-${Date.now()}`, text: text.trim() };
    updateTask(task.id, { decisions: [...task.decisions, d] });
  };

  const removeDecision = (dId: string) => {
    updateTask(task.id, { decisions: task.decisions.filter((d) => d.id !== dId) });
  };

  const addRisk = (text: string, severity: 'low' | 'medium' | 'high' = 'medium') => {
    if (!text.trim()) return;
    const r: Risk = { id: `r-${Date.now()}`, text: text.trim(), severity };
    updateTask(task.id, { risks: [...task.risks, r] });
  };

  const removeRisk = (rId: string) => {
    updateTask(task.id, { risks: task.risks.filter((r) => r.id !== rId) });
  };

  const addTail = (who: string, what: string, deadline: string) => {
    if (!who.trim() && !what.trim()) return;
    const tail: Tail = { id: `t-${Date.now()}`, who: who.trim(), what: what.trim(), deadline: deadline.trim() };
    updateTask(task.id, { tails: [...task.tails, tail] });
  };

  const removeTail = (tId: string) => {
    updateTask(task.id, { tails: task.tails.filter((tail) => tail.id !== tId) });
  };

  const addDependency = (text: string, blocks: boolean) => {
    if (!text.trim()) return;
    const dep: Dependency = { id: `dep-${Date.now()}`, text: text.trim(), blocks };
    updateTask(task.id, { dependencies: [...task.dependencies, dep] });
  };

  const removeDependency = (dId: string) => {
    updateTask(task.id, { dependencies: task.dependencies.filter((d) => d.id !== dId) });
  };

  const toggleTimer = () => {
    if (task.timerRunning) {
      updateTask(task.id, { timerRunning: false, timerStartedAt: null });
    } else {
      updateTask(task.id, { timerRunning: true, timerStartedAt: new Date().toISOString() });
    }
  };

  const resetTimer = () => {
    updateTask(task.id, { timerSeconds: 0, timerRunning: false, timerStartedAt: null });
  };

  const copyTask = () => {
    let text = `📋 ${task.name}\n`;
    text += `Type: ${task.type} | Status: ${task.status} | Priority: ${task.priority}\n\n`;
    const activeQs = task.questions.filter((q) => !q.removed);
    if (activeQs.length) {
      text += '💬 Questions:\n';
      activeQs.forEach((q) => {
        text += `${q.completed ? '✅' : '⬜'} ${q.text}\n`;
        if (q.answer) text += `   → ${q.answer}\n`;
      });
      text += '\n';
    }
    if (task.acceptanceCrit.length) {
      text += '🎯 Acceptance:\n';
      task.acceptanceCrit.forEach((c) => text += `${c.done ? '✅' : '⬜'} ${c.text}\n`);
      text += '\n';
    }
    if (task.decisions.length) {
      text += '✅ Decisions:\n';
      task.decisions.forEach((d) => text += `• ${d.text}\n`);
      text += '\n';
    }
    if (task.risks.length) {
      text += '⚠️ Risks:\n';
      task.risks.forEach((r) => text += `• [${r.severity}] ${r.text}\n`);
      text += '\n';
    }
    if (task.notes) text += `📝 Notes:\n${task.notes}\n`;
    navigator.clipboard.writeText(text);
    toast({ title: t.actions.copy, description: 'Copied!' });
  };

  const sendToJira = async () => {
    try {
      const raw = localStorage.getItem(INTEGRATIONS_KEY);
      if (!raw) { toast({ title: 'Error', description: 'Configure Jira in Settings first', variant: 'destructive' }); return; }
      const cfg = JSON.parse(raw);
      const res = await fetch('/api/jira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, config: cfg }),
      });
      const data = await res.json();
      toast({ title: res.ok ? 'Jira' : 'Error', description: data.message || data.error || 'Sent' });
    } catch { toast({ title: 'Error', description: 'Failed to send to Jira', variant: 'destructive' }); }
  };

  const sendToConfluence = async () => {
    try {
      const raw = localStorage.getItem(INTEGRATIONS_KEY);
      if (!raw) { toast({ title: 'Error', description: 'Configure Confluence in Settings first', variant: 'destructive' }); return; }
      const cfg = JSON.parse(raw);
      const res = await fetch('/api/confluence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, config: cfg }),
      });
      const data = await res.json();
      toast({ title: res.ok ? 'Confluence' : 'Error', description: data.message || data.error || 'Sent' });
    } catch { toast({ title: 'Error', description: 'Failed to send to Confluence', variant: 'destructive' }); }
  };

  const sendToTelegram = async () => {
    try {
      const raw = localStorage.getItem(INTEGRATIONS_KEY);
      if (!raw) { toast({ title: 'Error', description: 'Configure Telegram in Settings first', variant: 'destructive' }); return; }
      const cfg = JSON.parse(raw);
      const res = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, config: cfg }),
      });
      const data = await res.json();
      toast({ title: res.ok ? 'Telegram' : 'Error', description: data.message || data.error || 'Sent' });
    } catch { toast({ title: 'Error', description: 'Failed to send to Telegram', variant: 'destructive' }); }
  };

  const aiAction = async (action: string) => {
    setAiLoading(true);
    try {
      const answersSummary = task.questions
        .filter((q) => !q.removed && q.answer)
        .map((q) => `Q: ${q.text}\nA: ${q.answer}`)
        .join('\n\n');

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          taskName: task.name,
          taskType: task.type,
          answers: answersSummary || 'No answers yet',
          context: task.notes,
          locale,
        }),
      });

      const data = await res.json();
      if (data.content) {
        try {
          const parsed = JSON.parse(data.content);
          if (Array.isArray(parsed)) {
            if (action === 'suggest-questions') {
              const newQs: Question[] = parsed.map((text: string, idx: number) => ({
                id: `q-ai-${Date.now()}-${idx}`,
                text,
                answer: '',
                completed: false,
                removed: false,
              }));
              updateTask(task.id, { questions: [...task.questions, ...newQs] });
              toast({ title: 'AI', description: `Added ${newQs.length} questions` });
            } else if (action === 'suggest-criteria') {
              const newCrits: AcceptanceCriteria[] = parsed.map((text: string, idx: number) => ({
                id: `ac-ai-${Date.now()}-${idx}`,
                text,
                done: false,
              }));
              updateTask(task.id, { acceptanceCrit: [...task.acceptanceCrit, ...newCrits] });
              toast({ title: 'AI', description: `Added ${newCrits.length} criteria` });
            } else if (action === 'analyze-risks') {
              const newRisks: Risk[] = parsed.map((item: { text: string; severity: string }, idx: number) => ({
                id: `r-ai-${Date.now()}-${idx}`,
                text: item.text,
                severity: (item.severity || 'medium') as 'low' | 'medium' | 'high',
              }));
              updateTask(task.id, { risks: [...task.risks, ...newRisks] });
              toast({ title: 'AI', description: `Added ${newRisks.length} risks` });
            }
          } else {
            toast({ title: 'AI Response', description: data.content.substring(0, 200) });
          }
        } catch {
          toast({ title: 'AI Response', description: data.content.substring(0, 300) });
        }
      }
    } catch (err) {
      toast({ title: 'AI Error', description: 'Failed to get AI response', variant: 'destructive' });
    } finally {
      setAiLoading(false);
    }
  };

  const currentStatusIdx = statusCycle.indexOf(task.status as typeof statusCycle[number]);

  const timerDisplaySeconds = task.timerStartedAt && task.timerRunning
    ? Math.floor((Date.now() - new Date(task.timerStartedAt).getTime()) / 1000)
    : task.timerSeconds;

  const commitName = () => {
    if (nameDraft.trim() && nameDraft.trim() !== task.name) {
      updateTask(task.id, { name: nameDraft.trim() });
    }
    setEditingName(false);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white/20 dark:bg-white/[0.02] backdrop-blur-xl">
      {/* Task header */}
      <div className="px-4 py-3 border-b border-white/15 dark:border-white/5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {editingName ? (
              <Input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') setEditingName(false); }}
                className="h-8 text-base font-bold bg-white/50 dark:bg-white/5 border-orange-500/30 rounded-lg"
                autoFocus
              />
            ) : (
              <div className="flex items-center gap-2 group">
                <h2 className="font-bold text-base leading-tight truncate">{task.name}</h2>
                <button
                  onClick={() => { setNameDraft(task.name); setEditingName(true); }}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-orange-500 transition-all p-0.5"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge variant="outline" className="text-[10px] font-bold px-2">
                {task.type}
              </Badge>
              <button
                onClick={() => updateTaskStatus(task.id, statusCycle[(currentStatusIdx + 1) % statusCycle.length])}
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-all hover:scale-105 press-scale ${statusColors[task.status]}`}
              >
                {t.status[task.status as TaskStatus]}
              </button>
              <Badge variant="outline" className="text-[10px] font-bold px-2">
                {t.priority[task.priority]}
              </Badge>
              {task.tags.length > 0 && (
                <div className="flex items-center gap-1">
                  {task.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-black/4 dark:bg-white/4 text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Primary actions: Timer + More menu */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-black/3 dark:bg-white/3">
              <button
                onClick={toggleTimer}
                className={`p-1.5 rounded-md transition-all ${
                  task.timerRunning
                    ? 'bg-emerald-500/15 text-emerald-600'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {task.timerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>
              <span className={`font-mono text-xs font-bold min-w-[42px] text-center tabular-nums ${
                timerDisplaySeconds > 3600 ? 'text-red-500' :
                timerDisplaySeconds > 1800 ? 'text-amber-500' : 'text-foreground'
              }`}>
                {formatTimer(timerDisplaySeconds)}
              </span>
              <button onClick={resetTimer} className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-all">
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            <span className="text-[10px] text-muted-foreground/50 font-medium">
              {completedCount}/{totalCount}
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={sendToJira}>
                  <Bug className="w-3.5 h-3.5 mr-2 text-blue-600" />
                  {t.actions.sendJira}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={sendToConfluence}>
                  <BookOpen className="w-3.5 h-3.5 mr-2 text-blue-700" />
                  {t.actions.sendConfluence}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={sendToTelegram}>
                  <MessageSquare className="w-3.5 h-3.5 mr-2 text-sky-500" />
                  {t.actions.sendTelegram}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={copyTask}>
                  <Copy className="w-3.5 h-3.5 mr-2" />
                  {t.actions.copy}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => duplicateTask(task.id)}>
                  <CopyPlus className="w-3.5 h-3.5 mr-2" />
                  {t.actions.duplicate}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowScratchpad(!showScratchpad)}>
                  <NotepadText className="w-3.5 h-3.5 mr-2" />
                  {t.actions.scratchpad}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => showConfirm(t.actions.delete, `Delete "${task.name}"?`, () => deleteTask(task.id))} className="text-red-500 focus:text-red-500">
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  {t.actions.delete}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* AI Actions bar */}
      <div className="px-4 py-2 border-b border-white/10 dark:border-white/5 flex items-center gap-2 bg-gradient-to-r from-purple-500/5 via-blue-500/3 to-transparent">
        <div className="flex items-center gap-1.5 mr-1">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Sparkles className="w-2.5 h-2.5 text-white" />
          </div>
          <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">AI</span>
        </div>
        <button onClick={() => aiAction('suggest-questions')} disabled={aiLoading} className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-all disabled:opacity-50 press-scale">
          {aiLoading ? <Loader2 className="w-2.5 h-2.5 animate-spin inline mr-1" /> : null}
          {t.ai.suggestQuestions}
        </button>
        <button onClick={() => aiAction('summarize')} disabled={aiLoading} className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-all disabled:opacity-50 press-scale">
          {aiLoading ? <Loader2 className="w-2.5 h-2.5 animate-spin inline mr-1" /> : null}
          {t.ai.summarize}
        </button>
        <button onClick={() => aiAction('analyze-risks')} disabled={aiLoading} className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50 press-scale">
          {aiLoading ? <Loader2 className="w-2.5 h-2.5 animate-spin inline mr-1" /> : null}
          {t.ai.analyzeRisks}
        </button>
        <button onClick={() => aiAction('suggest-criteria')} disabled={aiLoading} className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-50 press-scale">
          {aiLoading ? <Loader2 className="w-2.5 h-2.5 animate-spin inline mr-1" /> : null}
          {t.ai.suggestCriteria}
        </button>
        <div className="ml-auto">
          <button onClick={toggleAll} className="text-[9px] text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-all font-medium">
            <ChevronsUpDown className="w-3 h-3" />
            {allCollapsed ? t.actions.expandAll || 'Expand all' : t.actions.collapseAll || 'Collapse all'}
          </button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 px-4 py-3">
        <div className="max-w-3xl mx-auto space-y-4">
          <Section title={t.sections.questions} icon="💬" collapsed={isCollapsed('questions')} onToggle={() => toggleSection('questions')} count={`${completedCount}/${totalCount}`}>
            {task.questions.filter((q) => !q.removed).map((q, idx) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03, duration: 0.2 }}
                className={`p-3 rounded-xl border transition-all duration-250 ${
                  q.completed 
                    ? 'bg-gradient-to-r from-emerald-500/8 to-emerald-500/3 border-emerald-500/25 shadow-sm' 
                    : 'bg-white/50 dark:bg-white/5 border-white/30 dark:border-white/5 hover:border-orange-500/20'
                }`}
              >
                <div className="flex items-start gap-2">
                  <button
                    onClick={() => toggleQuestion(q.id)}
                    className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                      q.completed 
                        ? 'bg-emerald-500 border-emerald-500 scale-105' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-orange-500 hover:scale-110'
                    }`}
                  >
                    {q.completed && (
                      <svg className="w-2.5 h-2.5 text-white checkmark-draw" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium transition-all ${
                      q.completed 
                        ? 'line-through text-muted-foreground' 
                        : 'text-foreground'
                    }`}>
                      {q.text}
                    </p>
                    <Textarea
                      value={q.answer}
                      onChange={(e) => answerQuestion(q.id, e.target.value)}
                      placeholder={t.actions.addQuestion}
                      className={`mt-1.5 min-h-[60px] text-xs bg-white/70 dark:bg-white/5 border-white/30 dark:border-white/5 rounded-lg resize-none transition-all focus:border-orange-500/40 ${
                        q.completed ? 'opacity-60' : ''
                      }`}
                    />
                  </div>
                  <button 
                    onClick={() => removeQuestion(q.id)} 
                    className="text-[10px] text-muted-foreground hover:text-red-500 flex-shrink-0 mt-0.5 whitespace-nowrap transition-colors"
                  >
                    {t.actions.notNeeded}
                  </button>
                </div>
              </motion.div>
            ))}
            {task.questions.filter((q) => q.removed).map((q) => (
              <div key={q.id} className="p-2 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 opacity-50 flex items-center justify-between">
                <span className="text-xs line-through text-muted-foreground">{q.text}</span>
                <button onClick={() => removeQuestion(q.id)} className="text-[10px] text-orange-500 hover:text-orange-600 font-semibold">
                  {t.actions.restore}
                </button>
              </div>
            ))}
            <InlineInput placeholder={t.actions.addQuestion} onSubmit={(val) => addCustomQuestion(val)} />
          </Section>

          <Section title={t.sections.acceptance} icon="🎯" collapsed={isCollapsed('acceptance')} onToggle={() => toggleSection('acceptance')} count={String(task.acceptanceCrit.length)}>
            {task.acceptanceCrit.map((c, idx) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03, duration: 0.2 }}
                className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all duration-200 group/criteria ${
                  c.done 
                    ? 'bg-emerald-500/5 border-emerald-500/20' 
                    : 'bg-white/40 dark:bg-white/5 border-white/30 dark:border-white/5 hover:border-orange-500/20'
                }`}
              >
                <button
                  onClick={() => toggleCriteria(c.id)}
                  className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                    c.done 
                      ? 'bg-emerald-500 border-emerald-500 scale-105' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-orange-500'
                  }`}
                >
                  {c.done && (
                    <svg className="w-2.5 h-2.5 text-white checkmark-draw" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <span className={`text-xs flex-1 transition-all ${c.done ? 'line-through text-muted-foreground' : ''}`}>{c.text}</span>
                <button onClick={() => removeCriteria(c.id)} className="opacity-0 group-hover/criteria:opacity-100 text-muted-foreground hover:text-red-500 transition-all p-1">
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
            <InlineInput placeholder={t.actions.addCriteria} onSubmit={(val) => addCriteria(val)} />
          </Section>

          <Section title={t.sections.decisions} icon="✅" collapsed={isCollapsed('decisions')} onToggle={() => toggleSection('decisions')} count={String(task.decisions.length)}>
            {task.decisions.map((d, idx) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03, duration: 0.2 }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/5 hover:border-blue-500/20 transition-all duration-200 group/decision"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 flex-shrink-0" />
                <span className="text-xs flex-1">{d.text}</span>
                <button onClick={() => removeDecision(d.id)} className="opacity-0 group-hover/decision:opacity-100 text-muted-foreground hover:text-red-500 transition-all p-1">
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
            <InlineInput placeholder={t.actions.addDecision} onSubmit={(val) => addDecision(val)} />
          </Section>

          <Section title={t.sections.risks} icon="⚠️" collapsed={isCollapsed('risks')} onToggle={() => toggleSection('risks')} count={String(task.risks.length)} defaultCollapsed>
            {task.risks.map((r, idx) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03, duration: 0.2 }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/5 hover:border-red-500/20 transition-all duration-200 group/risk"
              >
                <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 transition-all ${
                  r.severity === 'high' ? 'text-red-500 animate-pulse' : 
                  r.severity === 'medium' ? 'text-amber-500' : 
                  'text-yellow-500'
                }`} />
                <span className="text-xs flex-1">{r.text}</span>
                <Badge variant="outline" className={`text-[9px] px-1.5 font-bold ${
                  r.severity === 'high' ? 'border-red-500/30 text-red-600 bg-red-500/5' : 
                  r.severity === 'medium' ? 'border-amber-500/30 text-amber-600 bg-amber-500/5' : 
                  'border-yellow-500/30 text-yellow-700 bg-yellow-500/5'
                }`}>
                  {r.severity}
                </Badge>
                <button onClick={() => removeRisk(r.id)} className="opacity-0 group-hover/risk:opacity-100 text-muted-foreground hover:text-red-500 transition-all p-1">
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
            <InlineInput placeholder={t.actions.addRisk} onSubmit={(val) => addRisk(val)} />
          </Section>

          <Section title={t.sections.tails} icon="🔗" collapsed={isCollapsed('tails')} onToggle={() => toggleSection('tails')} count={String(task.tails.length)}>
            {task.tails.map((tail) => (
              <div key={tail.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/40 dark:bg-white/5 group text-xs">
                <span className="font-semibold min-w-[80px]">{tail.who}</span>
                <span className="flex-1 text-muted-foreground">{tail.what}</span>
                <span className="text-orange-500">{tail.deadline}</span>
                <button onClick={() => removeTail(tail.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <TailInput
              whoPlaceholder={t.actions.who}
              whatPlaceholder={t.actions.what}
              deadlinePlaceholder={t.actions.deadline}
              onSubmit={(who, what, deadline) => addTail(who, what, deadline)}
            />
          </Section>

          <Section title={t.sections.dependencies} icon="🔀" collapsed={isCollapsed('dependencies')} onToggle={() => toggleSection('dependencies')} count={String(task.dependencies.length)} defaultCollapsed>
            {task.dependencies.map((d) => (
              <div key={d.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/40 dark:bg-white/5 group text-xs">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${d.blocks ? 'bg-red-500/15 text-red-600' : 'bg-blue-500/15 text-blue-600'}`}>
                  {d.blocks ? 'Blocks' : 'Depends'}
                </span>
                <span className="flex-1">{d.text}</span>
                <button onClick={() => removeDependency(d.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <DependencyInput
              placeholder={t.actions.addDependency}
              onAddDep={(text) => addDependency(text, false)}
              onAddBlock={(text) => addDependency(text, true)}
            />
          </Section>

          <Section title={t.sections.notes} icon="📝" collapsed={isCollapsed('notes')} onToggle={() => toggleSection('notes')}>
            <Textarea
              value={task.notes}
              onChange={(e) => updateTask(task.id, { notes: e.target.value })}
              placeholder={t.actions.scratchpadPlaceholder}
              className="min-h-[120px] text-xs bg-white/50 dark:bg-white/5 border-white/30 dark:border-white/5 rounded-xl resize-none"
            />
            {task.notes.length > 0 && (
              <div className="flex justify-end gap-3 mt-1 px-1">
                <span className="text-[9px] text-muted-foreground/50">{task.notes.length} chars</span>
                <span className="text-[9px] text-muted-foreground/50">{task.notes.split(/\s+/).filter(Boolean).length} words</span>
              </div>
            )}
          </Section>
        </div>
      </ScrollArea>
    </div>
  );
}

const Section = React.memo(function Section({
  title, icon, collapsed, onToggle, count, children, defaultCollapsed = false,
}: {
  title: string;
  icon: string;
  collapsed: boolean;
  onToggle: () => void;
  count?: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}) {
  return (
    <div className={`rounded-xl border transition-all duration-300 overflow-hidden group/section ${
      collapsed 
        ? 'border-white/15 dark:border-white/3 bg-white/20 dark:bg-white/[0.02]' 
        : 'border-white/25 dark:border-white/5 bg-white/40 dark:bg-white/[0.03] hover:border-white/40 dark:hover:border-white/10'
    }`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-black/2 dark:hover:bg-white/2 transition-all duration-200"
      >
        <span className="text-sm flex-shrink-0 transform group-hover/section:scale-110 transition-transform">{icon}</span>
        <span className="font-bold text-xs flex-1 text-left">{title}</span>
        {count && (
          <span className="text-[10px] text-muted-foreground/60 bg-black/4 dark:bg-white/4 px-2 py-0.5 rounded-full font-semibold tabular-nums">
            {count}
          </span>
        )}
        <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground/50 transition-all duration-300 ${collapsed ? '' : 'rotate-90 text-orange-500/70'}`} />
      </button>
      {!collapsed && (
        <div className="px-3 pb-3 space-y-1.5 animate-fade-in section-content">
          {children}
        </div>
      )}
    </div>
  );
});

const InlineInput = React.memo(function InlineInput({ placeholder, onSubmit }: { placeholder: string; onSubmit: (val: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="h-7 text-[11px] bg-white/50 dark:bg-white/5 border-white/30 dark:border-white/5 rounded-lg"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && value.trim()) {
            onSubmit(value);
            setValue('');
          }
        }}
      />
      <Button
        size="sm"
        className="h-7 w-7 p-0 rounded-lg bg-orange-500 hover:bg-orange-600 text-white flex-shrink-0"
        onClick={() => {
          if (value.trim()) { onSubmit(value); setValue(''); }
        }}
      >
        <Plus className="w-3 h-3" />
      </Button>
    </div>
  );
});

const TailInput = React.memo(function TailInput({
  whoPlaceholder, whatPlaceholder, deadlinePlaceholder, onSubmit,
}: {
  whoPlaceholder: string; whatPlaceholder: string; deadlinePlaceholder: string;
  onSubmit: (who: string, what: string, deadline: string) => void;
}) {
  const [who, setWho] = useState('');
  const [what, setWhat] = useState('');
  const [deadline, setDeadline] = useState('');

  const handleSubmit = () => {
    if (!who.trim() && !what.trim()) return;
    onSubmit(who, what, deadline);
    setWho('');
    setWhat('');
    setDeadline('');
  };

  return (
    <div className="flex gap-1.5 mt-1">
      <Input value={who} onChange={(e) => setWho(e.target.value)} placeholder={whoPlaceholder} className="h-7 text-[11px] bg-white/50 dark:bg-white/5 border-white/30" />
      <Input value={what} onChange={(e) => setWhat(e.target.value)} placeholder={whatPlaceholder} className="h-7 text-[11px] bg-white/50 dark:bg-white/5 border-white/30" />
      <Input value={deadline} onChange={(e) => setDeadline(e.target.value)} placeholder={deadlinePlaceholder} className="h-7 text-[11px] bg-white/50 dark:bg-white/5 border-white/30 w-24" />
      <Button size="sm" className="h-7 px-2 bg-orange-500 hover:bg-orange-600 text-white" onClick={handleSubmit}>
        <Plus className="w-3 h-3" />
      </Button>
    </div>
  );
});

const DependencyInput = React.memo(function DependencyInput({
  placeholder, onAddDep, onAddBlock,
}: {
  placeholder: string; onAddDep: (text: string) => void; onAddBlock: (text: string) => void;
}) {
  const [value, setValue] = useState('');
  return (
    <div className="flex gap-1.5 mt-1">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="h-7 text-[11px] bg-white/50 dark:bg-white/5 border-white/30 flex-1"
        onKeyDown={(e) => { if (e.key === 'Enter' && value.trim()) { onAddDep(value); setValue(''); } }}
      />
      <Button size="sm" className="h-7 px-2 bg-orange-500 hover:bg-orange-600 text-white" onClick={() => { if (value.trim()) { onAddDep(value); setValue(''); } }}>
        <Plus className="w-3 h-3" />
      </Button>
      <Button size="sm" className="h-7 px-2 text-[10px]" variant="outline" onClick={() => { if (value.trim()) { onAddBlock(value); setValue(''); } }}>
        Blocks
      </Button>
    </div>
  );
});
