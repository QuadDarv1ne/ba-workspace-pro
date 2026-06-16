'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { translations } from '@/lib/i18n';
import { getQuestionsForType } from '@/lib/templates';
import { typeBorderColors, priorityColors, taskTypes } from '@/lib/constants';
import type { TaskType, TaskPriority, Task } from '@/lib/types';
import { X, Check, Plus, Tag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export function CreateTaskModal() {
  const { setShowCreateModal, addTask, locale } = useStore();
  const t = translations[locale];

  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<TaskType | null>(null);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [questions, setQuestions] = useState<ReturnType<typeof getQuestionsForType>>([]);
  const [customQ, setCustomQ] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowCreateModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setShowCreateModal]);

  const selectType = (type: TaskType) => {
    setSelectedType(type);
    setQuestions(getQuestionsForType(type));
  };

  const removeQuestion = (qId: string) => {
    setQuestions(questions.map((q) => q.id === qId ? { ...q, removed: !q.removed } : q));
  };

  const addCustomQuestion = () => {
    if (!customQ.trim()) return;
    setQuestions([...questions, { id: `q-custom-${Date.now()}`, text: customQ.trim(), answer: '', completed: false, removed: false }]);
    setCustomQ('');
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const createTask = () => {
    if (!name.trim() || !selectedType) return;

    const task: Task = {
      id: `task-${Date.now()}`,
      name: name.trim(),
      type: selectedType,
      status: 'active',
      priority,
      questions: questions.filter((q) => !q.removed),
      acceptanceCrit: [],
      decisions: [],
      risks: [],
      tails: [],
      dependencies: [],
      notes: '',
      timerSeconds: 0,
      timerRunning: false,
      timerStartedAt: null,
      collapsedSecs: { risks: true, dependencies: true },
      tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addTask(task);
  };

  const canCreate = name.trim() && selectedType;
  const stepProgress = (name.trim() ? 1 : 0) + (selectedType ? 1 : 0) + (tags.length > 0 ? 0.5 : 0);
  const maxProgress = 2.5;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md"
      onClick={() => setShowCreateModal(false)}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20, filter: 'blur(8px)' }}
        animate={{ scale: 1, opacity: 1, y: 0, filter: 'blur(0)' }}
        exit={{ scale: 0.95, opacity: 0, y: 20, filter: 'blur(8px)' }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl max-h-[85vh] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-white/30 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className="px-5 py-3 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-gradient-to-r from-orange-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Plus className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm">{t.create.title}</h2>
              <p className="text-[10px] text-muted-foreground">Заполните поля для создания</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-500"
                style={{ width: `${(stepProgress / maxProgress) * 100}%` }}
              />
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" onClick={() => setShowCreateModal(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-5 space-y-5">
          {/* Name input */}
          <div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.create.namePlaceholder}
              className="h-11 text-sm bg-white/50 dark:bg-white/5 border-white/30 rounded-xl focus-visible:ring-orange-500/30"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter' && canCreate) createTask(); }}
            />
          </div>

          {/* Type selection */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block flex items-center gap-2">
              {t.create.selectType}
              {selectedType && <Check className="w-3 h-3 text-emerald-500" />}
            </label>
            <div className="grid grid-cols-2 gap-2 stagger-children">
              {taskTypes.map((type) => {
                const tt = t.taskTypes[type as keyof typeof t.taskTypes];
                const isSelected = selectedType === type;
                return (
                  <button
                    key={type}
                    onClick={() => selectType(type as TaskType)}
                    className={`relative p-3 rounded-xl border-2 text-left transition-all duration-200 press-scale ${
                      isSelected
                        ? typeBorderColors[type] + ' border-current shadow-sm'
                        : 'border-transparent bg-white/30 dark:bg-white/5 hover:bg-white/50 hover:border-black/5 dark:hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{tt.icon}</span>
                      <span className="text-xs font-bold flex-1">{tt.name}</span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center animate-scale-in">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 ml-7">{tt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">{t.create.priority}</label>
            <div className="flex gap-1.5 p-1 bg-black/3 dark:bg-white/3 rounded-xl">
              {(['low', 'medium', 'high', 'critical'] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex-1 text-[11px] font-semibold px-3 py-2 rounded-lg transition-all duration-200 ${
                    priority === p
                      ? priorityColors[p] + ' shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.priority[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">{t.create.tags}</label>
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px] gap-1 px-2 py-0.5 animate-scale-in">
                  <Tag className="w-2.5 h-2.5" />
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder={t.create.tagsPlaceholder}
                className="h-8 text-[11px] bg-white/50 dark:bg-white/5 border-white/30 rounded-lg flex-1"
                onKeyDown={(e) => { if (e.key === 'Enter') addTag(); }}
              />
              <Button size="sm" className="h-8 px-2.5 bg-orange-500 hover:bg-orange-600 text-white press-scale" onClick={addTag}>
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Questions */}
          {selectedType && questions.length > 0 && (
            <div className="animate-fade-in">
              <label className="text-xs font-semibold text-muted-foreground mb-2 block">
                {t.create.questions}
                <span className="text-muted-foreground/40 ml-1.5">({questions.filter((q) => !q.removed).length})</span>
              </label>
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto stagger-children">
                {questions.map((q) => (
                  <div key={q.id} className={`flex items-center gap-2 p-2.5 rounded-lg text-xs transition-all ${
                    q.removed ? 'opacity-40 line-through bg-red-500/5' : 'bg-white/40 dark:bg-white/5'
                  }`}>
                    <span className="flex-1">{q.text}</span>
                    <button
                      onClick={() => removeQuestion(q.id)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-all ${
                        q.removed
                          ? 'text-orange-500 hover:text-orange-600 bg-orange-500/10'
                          : 'text-muted-foreground hover:text-red-500 hover:bg-red-500/10'
                      }`}
                    >
                      {q.removed ? t.create.restoreQuestion : t.create.removeQuestion}
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <Input
                  value={customQ}
                  onChange={(e) => setCustomQ(e.target.value)}
                  placeholder={t.create.customQuestion}
                  className="h-8 text-[11px] bg-white/50 dark:bg-white/5 border-white/30 rounded-lg flex-1"
                  onKeyDown={(e) => { if (e.key === 'Enter') addCustomQuestion(); }}
                />
                <Button size="sm" className="h-8 px-2.5 bg-orange-500 hover:bg-orange-600 text-white press-scale" onClick={addCustomQuestion}>
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-black/5 dark:border-white/5 flex items-center justify-end gap-2 bg-black/2 dark:bg-white/2">
          <div className="mr-auto flex items-center gap-2 text-[10px] text-muted-foreground/40">
            <kbd className="px-1.5 py-0.5 rounded border border-current font-mono text-[9px]">Enter</kbd>
            <span>{locale === 'ru' ? 'создать' : 'to create'}</span>
            <span className="mx-1">|</span>
            <kbd className="px-1.5 py-0.5 rounded border border-current font-mono text-[9px]">Esc</kbd>
            <span>{locale === 'ru' ? 'закрыть' : 'to close'}</span>
          </div>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowCreateModal(false)}>
            {t.create.cancel}
          </Button>
          <Button
            size="sm"
            className={`text-xs font-semibold gap-1.5 transition-all ${
              canCreate
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25'
                : 'bg-black/5 dark:bg-white/5 text-muted-foreground'
            }`}
            onClick={createTask}
            disabled={!canCreate}
          >
            {t.create.create}
            {canCreate && <ArrowRight className="w-3 h-3" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
