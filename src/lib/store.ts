import { create } from 'zustand';
import type { Task, ViewMode, FilterStatus, TaskStatus } from './types';

interface ConfirmDialogState {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

interface AppState {
  tasks: Task[];
  activeTaskId: string | null;
  viewMode: ViewMode;
  filterStatus: FilterStatus;
  scratchpadContent: string;
  darkMode: boolean;
  locale: 'ru' | 'en';
  showCreateModal: boolean;
  showScratchpad: boolean;
  aiLoading: boolean;
  isLoading: boolean;
  isSaving: boolean;
  lastSavedAt: string | null;
  zenMode: boolean;
  confirmDialog: ConfirmDialogState;
  canUndo: boolean;
  sidebarCollapsed: boolean;

  setTasks: (tasks: Task[]) => void;
  reorderTasks: (fromIndex: number, toIndex: number) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  setActiveTaskId: (id: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setFilterStatus: (status: FilterStatus) => void;
  setScratchpadContent: (content: string) => void;
  toggleDarkMode: () => void;
  setLocale: (locale: 'ru' | 'en') => void;
  setShowCreateModal: (show: boolean) => void;
  setShowScratchpad: (show: boolean) => void;
  setAiLoading: (loading: boolean) => void;
  toggleZenMode: () => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  duplicateTask: (id: string) => void;
  deleteClosedTasks: () => void;
  clearAllTasks: () => void;
  loadFromStorage: () => void;
  saveToStorage: () => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  hideConfirm: () => void;
  undo: () => void;
  toggleSidebar: () => void;
}

const STORAGE_KEY = 'ba-workspace-pro';
const PREFS_KEY = 'ba-workspace-prefs';

let saveTimer: ReturnType<typeof setTimeout> | null = null;
const undoStack: Task[][] = [];
const MAX_UNDO = 30;

function pushUndo(tasks: Task[]) {
  undoStack.push(tasks.map((t) => ({ ...t })));
  if (undoStack.length > MAX_UNDO) undoStack.shift();
}

async function apiPatch(tasks: Task[]) {
  try {
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks }),
    });
  } catch (e) {
    console.error('API patch failed:', e);
  }
}

async function apiPost(task: Task) {
  try {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task }),
    });
  } catch (e) {
    console.error('API post failed:', e);
  }
}

async function apiDelete(id: string) {
  try {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
  } catch (e) {
    console.error('API delete failed:', e);
  }
}

async function apiUpdate(id: string, updates: Partial<Task>) {
  try {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  } catch (e) {
    console.error('API update failed:', e);
  }
}

function savePrefs(prefs: { darkMode: boolean; locale: string; scratchpadContent: string }) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {}
}

function loadPrefs() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const useStore = create<AppState>((set, get) => ({
  tasks: [],
  activeTaskId: null,
  viewMode: 'workspace',
  filterStatus: 'all',
  scratchpadContent: '',
  darkMode: false,
  locale: 'ru',
  showCreateModal: false,
  showScratchpad: false,
  aiLoading: false,
  isLoading: true,
  isSaving: false,
  lastSavedAt: null,
  zenMode: false,
  canUndo: false,
  sidebarCollapsed: false,
  confirmDialog: { open: false, title: '', message: '', onConfirm: () => {} },

  reorderTasks: (fromIndex, toIndex) => {
    set((s) => {
      const updated = [...s.tasks];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return { tasks: updated };
    });
    get().saveToStorage();
  },

  setTasks: (tasks) => {
    set({ tasks });
    get().saveToStorage();
  },

  addTask: (task) => {
    pushUndo(get().tasks);
    set((s) => ({ tasks: [task, ...s.tasks], activeTaskId: task.id, showCreateModal: false, canUndo: true }));
    apiPost(task);
  },

  updateTask: (id, updates) => {
    pushUndo(get().tasks);
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)),
      canUndo: true,
    }));
    apiUpdate(id, updates);
  },

  deleteTask: (id) => {
    pushUndo(get().tasks);
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== id),
      activeTaskId: s.activeTaskId === id ? null : s.activeTaskId,
      canUndo: true,
    }));
    apiDelete(id);
  },

  setActiveTaskId: (id) => set({ activeTaskId: id }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setScratchpadContent: (content) => {
    set({ scratchpadContent: content });
    const { darkMode, locale } = get();
    savePrefs({ darkMode, locale, scratchpadContent: content });
  },

  toggleDarkMode: () => {
    set((s) => {
      const newDark = !s.darkMode;
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', newDark);
      }
      savePrefs({ darkMode: newDark, locale: s.locale, scratchpadContent: s.scratchpadContent });
      return { darkMode: newDark };
    });
  },

  setLocale: (locale) => {
    set({ locale });
    const { darkMode, scratchpadContent } = get();
    savePrefs({ darkMode, locale, scratchpadContent });
  },

  setShowCreateModal: (show) => set({ showCreateModal: show }),
  setShowScratchpad: (show) => set({ showScratchpad: show }),
  setAiLoading: (loading) => set({ aiLoading: loading }),
  toggleZenMode: () => set((s) => ({ zenMode: !s.zenMode })),

  updateTaskStatus: (id, status) => {
    pushUndo(get().tasks);
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t)),
      canUndo: true,
    }));
    apiUpdate(id, { status });
  },

  duplicateTask: (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      name: `${task.name} (${get().locale === 'ru' ? 'копия' : 'copy'})`,
      status: 'active' as TaskStatus,
      questions: task.questions.map((q) => ({ ...q, answer: '', completed: false })),
      acceptanceCrit: [],
      decisions: [],
      risks: [],
      tails: [],
      dependencies: [],
      notes: '',
      timerSeconds: 0,
      timerRunning: false,
      timerStartedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((s) => ({ tasks: [newTask, ...s.tasks], activeTaskId: newTask.id }));
    apiPost(newTask);
  },

  deleteClosedTasks: () => {
    pushUndo(get().tasks);
    const closed = get().tasks.filter((t) => t.status === 'done');
    set((s) => ({
      tasks: s.tasks.filter((t) => t.status !== 'done'),
      activeTaskId: s.tasks.find((t) => t.id === s.activeTaskId)?.status === 'done' ? null : s.activeTaskId,
      canUndo: true,
    }));
    closed.forEach((t) => apiDelete(t.id));
  },

  clearAllTasks: () => {
    pushUndo(get().tasks);
    const all = get().tasks;
    set({ tasks: [], activeTaskId: null, canUndo: true });
    all.forEach((t) => apiDelete(t.id));
  },

  showConfirm: (title, message, onConfirm) => set({ confirmDialog: { open: true, title, message, onConfirm } }),
  hideConfirm: () => set({ confirmDialog: { open: false, title: '', message: '', onConfirm: () => {} } }),

  undo: () => {
    if (undoStack.length === 0) return;
    const prev = undoStack.pop()!;
    set({ tasks: prev, canUndo: undoStack.length > 0 });
    apiPatch(prev);
  },

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  loadFromStorage: async () => {
    if (typeof window === 'undefined') return;

    const prefs = loadPrefs();
    if (prefs) {
      if (prefs.darkMode !== undefined) {
        set({ darkMode: prefs.darkMode });
        if (prefs.darkMode && typeof document !== 'undefined') {
          document.documentElement.classList.add('dark');
        }
      }
      if (prefs.locale) set({ locale: prefs.locale });
      if (prefs.scratchpadContent) set({ scratchpadContent: prefs.scratchpadContent });
    }

    try {
      const res = await fetch('/api/tasks');
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
      if (data.success && Array.isArray(data.tasks)) {
        set({ tasks: data.tasks, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (e) {
      console.error('Failed to load tasks from API:', e);
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          const legacy = JSON.parse(raw);
          if (legacy.tasks) set({ tasks: legacy.tasks });
          if (legacy.scratchpadContent) set({ scratchpadContent: legacy.scratchpadContent });
        } catch {}
      }
      set({ isLoading: false });
    }
  },

  saveToStorage: () => {
    if (typeof window === 'undefined') return;
    set({ isSaving: true });
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const { tasks } = get();
      apiPatch(tasks);
      set({ isSaving: false, lastSavedAt: new Date().toISOString() });
    }, 500);
  },
}));
