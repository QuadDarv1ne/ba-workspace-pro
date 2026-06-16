'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { translations } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings as SettingsIcon, Save, Download, Upload, Check, Database } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { INTEGRATIONS_KEY } from '@/lib/constants';

interface IntegrationData {
  jiraHost: string;
  jiraEmail: string;
  jiraToken: string;
  jiraProjectKey: string;
  jiraCorsProxy: string;
  confluenceHost: string;
  confluenceEmail: string;
  confluenceToken: string;
  confluenceSpaceId: string;
  confluenceCorsProxy: string;
  telegramBotToken: string;
  telegramChatId: string;
}

export function SettingsView() {
  const { locale, tasks, setTasks } = useStore();
  const t = translations[locale];

  const [saved, setSaved] = useState(false);
  const [integrations, setIntegrations] = useState<IntegrationData>(() => {
    if (typeof window === 'undefined') {
      return {
        jiraHost: '', jiraEmail: '', jiraToken: '', jiraProjectKey: '', jiraCorsProxy: '',
        confluenceHost: '', confluenceEmail: '', confluenceToken: '', confluenceSpaceId: '', confluenceCorsProxy: '',
        telegramBotToken: '', telegramChatId: '',
      };
    }
    try {
      const raw = localStorage.getItem(INTEGRATIONS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      jiraHost: '', jiraEmail: '', jiraToken: '', jiraProjectKey: '', jiraCorsProxy: '',
      confluenceHost: '', confluenceEmail: '', confluenceToken: '', confluenceSpaceId: '', confluenceCorsProxy: '',
      telegramBotToken: '', telegramChatId: '',
    };
  });

  const jiraConnected = !!(integrations.jiraHost && integrations.jiraEmail && integrations.jiraToken);
  const confluenceConnected = !!(integrations.confluenceHost && integrations.confluenceEmail && integrations.confluenceToken);
  const telegramConnected = !!(integrations.telegramBotToken && integrations.telegramChatId);

  const save = () => {
    localStorage.setItem(INTEGRATIONS_KEY, JSON.stringify(integrations));
    setSaved(true);
    toast({ title: t.actions.save, description: locale === 'ru' ? 'Настройки сохранены' : 'Settings saved' });
    setTimeout(() => setSaved(false), 2000);
  };

  const update = (key: keyof IntegrationData, value: string) => {
    setIntegrations((prev) => ({ ...prev, [key]: value }));
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ba-workspace-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: t.actions.save, description: `Exported ${tasks.length} tasks` });
  };

  const importJson = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (Array.isArray(data)) {
            const existingIds = new Set(tasks.map((t) => t.id));
            const newTasks = data.filter((t: any) => t.id && !existingIds.has(t.id));
            if (newTasks.length > 0) {
              setTasks([...newTasks, ...tasks]);
              toast({ title: t.actions.save, description: `Imported ${newTasks.length} tasks` });
            } else {
              toast({ title: t.actions.save, description: 'No new tasks to import' });
            }
          }
        } catch {
          toast({ title: 'Error', description: 'Invalid JSON file', variant: 'destructive' });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="flex-1 overflow-auto p-6 bg-white/20 dark:bg-white/[0.02] backdrop-blur-xl">
      <div className="max-w-3xl mx-auto space-y-5 stagger-children">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-orange-500" />
          {t.settings.title}
        </h1>

        {/* Backup section */}
        <Card className="bg-white/40 dark:bg-white/5 backdrop-blur-lg border-white/25 dark:border-white/5 hover-lift">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-bold flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500/15 to-orange-500/5 flex items-center justify-center">
                <Database className="w-3.5 h-3.5 text-orange-500" />
              </div>
              Backup & Restore
              <span className="ml-auto text-[10px] text-muted-foreground font-normal">
                {tasks.length} {locale === 'ru' ? 'задач' : 'tasks'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={exportJson}>
                <Download className="w-3 h-3" /> Export JSON
              </Button>
              <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={importJson}>
                <Upload className="w-3 h-3" /> Import JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Jira */}
        <Card className="bg-white/40 dark:bg-white/5 backdrop-blur-lg border-white/25 dark:border-white/5 hover-lift">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-bold flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white text-[10px] font-black shadow-sm">J</span>
              {t.settings.jiraTitle}
              {jiraConnected && (
                <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-500 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {locale === 'ru' ? 'Подключено' : 'Connected'}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2.5">
            <SettingInput label={t.settings.host} placeholder="your-company.atlassian.net" value={integrations.jiraHost} onChange={(v) => update('jiraHost', v)} />
            <SettingInput label={t.settings.email} placeholder="you@company.com" value={integrations.jiraEmail} onChange={(v) => update('jiraEmail', v)} />
            <SettingInput label={t.settings.apiToken} placeholder="API token" value={integrations.jiraToken} onChange={(v) => update('jiraToken', v)} type="password" />
            <SettingInput label={t.settings.projectKey} placeholder="PROJ" value={integrations.jiraProjectKey} onChange={(v) => update('jiraProjectKey', v)} />
            <SettingInput label={t.settings.corsProxy} placeholder="https://your-proxy.vercel.app" value={integrations.jiraCorsProxy} onChange={(v) => update('jiraCorsProxy', v)} />
            <p className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-500/50" />
              {t.settings.tokenNote}
            </p>
          </CardContent>
        </Card>

        {/* Confluence */}
        <Card className="bg-white/40 dark:bg-white/5 backdrop-blur-lg border-white/25 dark:border-white/5 hover-lift">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-bold flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-700 flex items-center justify-center text-white text-[10px] font-black shadow-sm">C</span>
              {t.settings.confluenceTitle}
              {confluenceConnected && (
                <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-500 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {locale === 'ru' ? 'Подключено' : 'Connected'}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2.5">
            <SettingInput label={t.settings.host} placeholder="your-company.atlassian.net" value={integrations.confluenceHost} onChange={(v) => update('confluenceHost', v)} />
            <SettingInput label={t.settings.email} placeholder="you@company.com" value={integrations.confluenceEmail} onChange={(v) => update('confluenceEmail', v)} />
            <SettingInput label={t.settings.apiToken} placeholder="API token" value={integrations.confluenceToken} onChange={(v) => update('confluenceToken', v)} type="password" />
            <SettingInput label={t.settings.spaceId} placeholder="123456" value={integrations.confluenceSpaceId} onChange={(v) => update('confluenceSpaceId', v)} />
            <SettingInput label={t.settings.corsProxy} placeholder="https://your-proxy.vercel.app" value={integrations.confluenceCorsProxy} onChange={(v) => update('confluenceCorsProxy', v)} />
            <p className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-500/50" />
              {t.settings.tokenNote}
            </p>
          </CardContent>
        </Card>

        {/* Telegram */}
        <Card className="bg-white/40 dark:bg-white/5 backdrop-blur-lg border-white/25 dark:border-white/5 hover-lift">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-bold flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-sky-500 flex items-center justify-center text-white text-[10px] font-black shadow-sm">T</span>
              {t.settings.telegramTitle}
              {telegramConnected && (
                <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-500 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {locale === 'ru' ? 'Подключено' : 'Connected'}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2.5">
            <SettingInput label={t.settings.botToken} placeholder="123456:ABC-DEF..." value={integrations.telegramBotToken} onChange={(v) => update('telegramBotToken', v)} type="password" />
            <SettingInput label={t.settings.chatId} placeholder="-100123456789" value={integrations.telegramChatId} onChange={(v) => update('telegramChatId', v)} />
          </CardContent>
        </Card>

        <div className="flex justify-end pt-2">
          <Button
            onClick={save}
            className={`gap-2 transition-all ${
              saved
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25'
            }`}
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? (locale === 'ru' ? 'Сохранено!' : 'Saved!') : t.settings.save}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SettingInput({ label, placeholder, value, onChange, type = 'text' }: {
  label: string; placeholder: string; value: string; onChange: (val: string) => void; type?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-[11px] font-semibold text-muted-foreground w-28 flex-shrink-0">{label}</label>
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-xs bg-white/50 dark:bg-white/5 border-white/30 dark:border-white/5 rounded-lg focus-visible:ring-orange-500/20"
      />
    </div>
  );
}
