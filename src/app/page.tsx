'use client';

import React, { useEffect } from 'react';
import { useStore } from '@/lib/store';
import { translations } from '@/lib/i18n';
import { TaskListPanel } from '@/components/TaskListPanel';
import { WorkspacePanel } from '@/components/WorkspacePanel';
import { ScratchpadPanel } from '@/components/ScratchpadPanel';
import { CreateTaskModal } from '@/components/CreateTaskModal';
import { AnalyticsView } from '@/components/AnalyticsView';
import { SettingsView } from '@/components/SettingsView';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { CommandPalette } from '@/components/CommandPalette';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ShortcutsModal } from '@/components/ShortcutsModal';
import { Toaster } from '@/components/ui/toaster';
import { Sun, Moon, Globe, BarChart3, Settings, LayoutDashboard, Loader2, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const viewVariants = {
  initial: { opacity: 0, y: 12, scale: 0.98, filter: 'blur(4px)' },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    filter: 'blur(0)',
    transition: { 
      duration: 0.35, 
      ease: [0.16, 1, 0.3, 1],
      opacity: { duration: 0.2 }
    } 
  },
  exit: { 
    opacity: 0, 
    y: -8, 
    scale: 0.99, 
    filter: 'blur(4px)',
    transition: { 
      duration: 0.18, 
      ease: [0.36, 0, 0.66, -0.56] 
    } 
  },
};

export default function Home() {
  const {
    darkMode, toggleDarkMode, locale, setLocale, loadFromStorage,
    viewMode, setViewMode, showScratchpad, showCreateModal,
    setShowCreateModal, tasks, isSaving, zenMode, toggleZenMode,
    activeTaskId, setActiveTaskId, filterStatus,
  } = useStore();
  const [showShortcuts, setShowShortcuts] = React.useState(false);

  const t = translations[locale];

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ? - show shortcuts
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowShortcuts(true);
        return;
      }

      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === 'n') {
        e.preventDefault();
        setShowCreateModal(true);
      }
      if (e.key === 'Escape') {
        if (showCreateModal) {
          setShowCreateModal(false);
        }
      }
      if (meta && e.key === '1') setViewMode('workspace');
      if (meta && e.key === '2') setViewMode('analytics');
      if (meta && e.key === '3') setViewMode('settings');
      if (meta && e.key === '.') {
        e.preventDefault();
        toggleZenMode();
      }

      // j/k navigation in workspace view
      if (viewMode === 'workspace' && !showCreateModal && !zenMode) {
        const filtered = filterStatus === 'all'
          ? tasks
          : tasks.filter((t) => t.status === filterStatus);
        const currentIdx = activeTaskId ? filtered.findIndex((t) => t.id === activeTaskId) : -1;

        if (e.key === 'j' && currentIdx < filtered.length - 1) {
          e.preventDefault();
          const next = filtered[currentIdx + 1];
          if (next) setActiveTaskId(next.id);
        }
        if (e.key === 'k' && currentIdx > 0) {
          e.preventDefault();
          const prev = filtered[currentIdx - 1];
          if (prev) setActiveTaskId(prev.id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setShowCreateModal, showCreateModal, setViewMode, viewMode, tasks, activeTaskId, filterStatus, setActiveTaskId, toggleZenMode, zenMode]);

  const activeTasks = tasks.filter((t) => t.status !== 'done').length;

  const navItems = [
    { key: 'workspace' as const, icon: LayoutDashboard, label: t.nav.workspace, shortcut: '1' },
    { key: 'analytics' as const, icon: BarChart3, label: t.nav.analytics, shortcut: '2' },
    { key: 'settings' as const, icon: Settings, label: t.nav.settings, shortcut: '3' },
  ];

  return (
    <ErrorBoundary name="Root">
      <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-orange-50/30 to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Background blobs - enhanced with more subtle animation */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute w-[600px] h-[600px] -top-48 -left-32 bg-gradient-to-br from-orange-300/15 via-orange-400/8 to-transparent dark:from-orange-500/12 dark:via-orange-600/6 dark:to-transparent rounded-full blur-[120px] animate-float" style={{ animationDuration: '8s' }} />
        <div className="absolute w-[500px] h-[500px] -bottom-48 -right-32 bg-gradient-to-tl from-blue-300/15 via-blue-400/8 to-transparent dark:from-blue-500/12 dark:via-blue-600/6 dark:to-transparent rounded-full blur-[120px] animate-float" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute w-[400px] h-[400px] top-1/3 right-1/4 bg-gradient-to-bl from-purple-300/10 via-purple-400/5 to-transparent dark:from-purple-500/8 dark:via-purple-600/4 dark:to-transparent rounded-full blur-[100px] animate-float" style={{ animationDuration: '12s', animationDelay: '4s' }} />
        <div className="absolute w-[350px] h-[350px] bottom-1/4 left-1/3 bg-gradient-to-r from-emerald-300/8 via-emerald-400/4 to-transparent dark:from-emerald-500/6 dark:via-emerald-600/3 dark:to-transparent rounded-full blur-[90px] animate-float" style={{ animationDuration: '9s', animationDelay: '1s' }} />
      </div>

      {/* Top bar */}
      <header className="relative z-20 flex items-center justify-between px-4 h-12 border-b border-white/20 dark:border-white/5 bg-white/40 dark:bg-white/5 backdrop-blur-2xl">
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-2.5 mr-4">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3L2 12h3v8h14v-8h3L12 3z" />
              </svg>
            </div>
            <span className="font-bold text-sm tracking-tight hidden sm:inline">{t.app.title}</span>
          </div>

          <nav className="flex items-center gap-0.5">
            {navItems.map(({ key, icon: Icon, label, shortcut }) => (
              <button
                key={key}
                onClick={() => setViewMode(key)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  viewMode === key
                    ? 'bg-orange-500/12 text-orange-600 dark:text-orange-400'
                    : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{label}</span>
                {key === 'workspace' && activeTasks > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center shadow-sm shadow-orange-500/30">
                    {activeTasks > 9 ? '9+' : activeTasks}
                  </span>
                )}
                {viewMode === key && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-2 right-2 h-[2px] bg-orange-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Auto-save indicator */}
          {isSaving ? (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground mr-1" title="Saving...">
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              <span className="hidden sm:inline">saving</span>
            </span>
          ) : (
            <span className="hidden sm:flex items-center text-[9px] text-muted-foreground/40 mr-1 px-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 mr-1" />
              saved
            </span>
          )}

          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 rounded-lg hidden md:flex ${zenMode ? 'bg-orange-500/10 text-orange-500' : ''}`}
            onClick={toggleZenMode}
            title={`Zen mode (⌘.) ${zenMode ? '- active' : ''}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h3M18 12h3M12 3v3M12 18v3" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg hidden md:flex"
            onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
            title="Command palette (⌘K)"
          >
            <Command className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg"
            onClick={() => setLocale(locale === 'ru' ? 'en' : 'ru')}
            title={t.actions.language}
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold ml-0.5">{locale.toUpperCase()}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg"
            onClick={toggleDarkMode}
            title={darkMode ? t.actions.lightTheme : t.actions.darkTheme}
          >
            {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg hidden md:flex"
            onClick={() => setShowShortcuts(true)}
            title="Keyboard shortcuts (?)"
          >
            <span className="text-xs font-bold text-muted-foreground/60">?</span>
          </Button>

          {/* New task shortcut hint */}
          <span className="hidden lg:flex text-[9px] text-muted-foreground/40 items-center gap-1 ml-1">
            <span className="px-1 py-0.5 rounded border border-muted-foreground/20 text-[8px] font-mono">⌘N</span>
            <span>{t.tasks.newTask.replace('+ ', '')}</span>
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex overflow-hidden">
        <AnimatePresence mode="wait">
          {viewMode === 'workspace' && (
            <motion.div key="workspace" className="flex-1 flex overflow-hidden" variants={viewVariants} initial="initial" animate="animate" exit="exit">
              {!zenMode && (
                <>
                  <ErrorBoundary name="TaskList">
                    <TaskListPanel />
                  </ErrorBoundary>
                  <ErrorBoundary name="Workspace">
                    <WorkspacePanel />
                  </ErrorBoundary>
                  {showScratchpad && (
                    <ErrorBoundary name="Scratchpad">
                      <ScratchpadPanel />
                    </ErrorBoundary>
                  )}
                </>
              )}
              {zenMode && (
                <ErrorBoundary name="WorkspaceZen">
                  <WorkspacePanel />
                </ErrorBoundary>
              )}
            </motion.div>
          )}
          {viewMode === 'analytics' && (
            <motion.div key="analytics" className="flex-1 flex overflow-hidden" variants={viewVariants} initial="initial" animate="animate" exit="exit">
              <ErrorBoundary name="Analytics">
                <AnalyticsView />
              </ErrorBoundary>
            </motion.div>
          )}
          {viewMode === 'settings' && (
            <motion.div key="settings" className="flex-1 flex overflow-hidden" variants={viewVariants} initial="initial" animate="animate" exit="exit">
              <ErrorBoundary name="Settings">
                <SettingsView />
              </ErrorBoundary>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}

      {/* Create task modal */}
      {showCreateModal && <CreateTaskModal />}

      <CommandPalette />
      <ShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <ConfirmDialog />
      <Toaster />
    </div>
  );
}
