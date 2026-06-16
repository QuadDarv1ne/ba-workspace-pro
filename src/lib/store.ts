import { create } from 'zustand';
import type { Task, ViewMode, FilterStatus, TaskStatus, TaskPriority, TaskType } from './types';

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
  isSaving: boolean;
  lastSavedAt: string | null;
  zenMode: boolean;
  confirmDialog: ConfirmDialogState;

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
}

const STORAGE_KEY = 'ba-workspace-pro';

let saveTimer: ReturnType<typeof setTimeout> | null = null;

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
  isSaving: false,
  lastSavedAt: null,
  zenMode: false,
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
    set((s) => ({ tasks: [task, ...s.tasks], activeTaskId: task.id, showCreateModal: false }));
    get().saveToStorage();
  },

  updateTask: (id, updates) => {
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)),
    }));
    get().saveToStorage();
  },

  deleteTask: (id) => {
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== id),
      activeTaskId: s.activeTaskId === id ? null : s.activeTaskId,
    }));
    get().saveToStorage();
  },

  setActiveTaskId: (id) => set({ activeTaskId: id }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setScratchpadContent: (content) => {
    set({ scratchpadContent: content });
    get().saveToStorage();
  },

  toggleDarkMode: () => {
    set((s) => {
      const newDark = !s.darkMode;
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', newDark);
      }
      return { darkMode: newDark };
    });
    get().saveToStorage();
  },

  setLocale: (locale) => {
    set({ locale });
    get().saveToStorage();
  },

  setShowCreateModal: (show) => set({ showCreateModal: show }),
  setShowScratchpad: (show) => set({ showScratchpad: show }),
  setAiLoading: (loading) => set({ aiLoading: loading }),
  toggleZenMode: () => set((s) => ({ zenMode: !s.zenMode })),

  updateTaskStatus: (id, status) => {
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t)),
    }));
    get().saveToStorage();
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
    get().saveToStorage();
  },

  deleteClosedTasks: () => {
    set((s) => ({
      tasks: s.tasks.filter((t) => t.status !== 'done'),
      activeTaskId: s.tasks.find((t) => t.id === s.activeTaskId)?.status === 'done' ? null : s.activeTaskId,
    }));
    get().saveToStorage();
  },

  clearAllTasks: () => {
    set({ tasks: [], activeTaskId: null });
    get().saveToStorage();
  },

  showConfirm: (title, message, onConfirm) => set({ confirmDialog: { open: true, title, message, onConfirm } }),
  hideConfirm: () => set({ confirmDialog: { open: false, title: '', message: '', onConfirm: () => {} } }),

  loadFromStorage: () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.tasks) set({ tasks: data.tasks });
      if (data.scratchpadContent) set({ scratchpadContent: data.scratchpadContent });
      if (data.darkMode !== undefined) {
        set({ darkMode: data.darkMode });
        if (data.darkMode && typeof document !== 'undefined') {
          document.documentElement.classList.add('dark');
        }
      }
      if (data.locale) set({ locale: data.locale });
    } catch (e) {
      console.error('Failed to load from storage:', e);
    }
  },

  saveToStorage: () => {
    if (typeof window === 'undefined') return;
    set({ isSaving: true });
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        const { tasks, scratchpadContent, darkMode, locale } = get();
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks, scratchpadContent, darkMode, locale }));
      } catch (e) {
        console.error('Failed to save to storage:', e);
      }
      set({ isSaving: false, lastSavedAt: new Date().toISOString() });
    }, 300);
  },
}));
