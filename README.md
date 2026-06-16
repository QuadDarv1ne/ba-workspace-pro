<div align="center">

# BA Workspace Pro v0.2.0

### Продвинутый инструмент для бизнес- и системных аналитиков

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-new--york-black)](https://ui.shadcn.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2d3748?logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](./LICENSE)

---

**Автор:** Дуплей Максим Игоревич

**Интеллектуальная собственность:** Дуплей Максим Игоревич

</div>

---

## О проекте

**BA Workspace Pro** — одностраничное веб-приложение для бизнес- и системных аналитиков. Позволяет структурированно работать над задачами, используя специализированные шаблоны вопросов, отслеживать время, вести аналитику и интегрироваться с Jira, Confluence и Telegram.

## Возможности

- **10 типов задач** — каждый со своим набором вопросов-шаблонов
- **Структурированные секции** — Вопросы, Критерии приёмки, Решения, Риски, Хвосты, Зависимости, Заметки
- **Таймер** — учёт времени по каждой задаче
- **AI-ассистент** — предложение вопросов, суммаризация, анализ рисков
- **Аналитика** — сводка и распределение по типам/статусам/приоритетам
- **Экспорт в Markdown** — выгрузка любой задачи
- **Тёмная тема**
- **Локализация** — русский и английский

## Быстрый старт

```bash
git clone <repo-url>
cd ba-workspace-pro
bun install
bun run dev
```

Приложение запустится на [http://localhost:3000](http://localhost:3000).

## Технологии

| Технология | Назначение |
|------------|------------|
| **Next.js 16** | React-фреймворк с App Router |
| **TypeScript 5** | Статическая типизация |
| **Tailwind CSS 4** | Утилитарные CSS-стили |
| **shadcn/ui** | Компоненты интерфейса |
| **Zustand** | Управление состоянием |
| **Prisma** | ORM для базы данных |
| **Framer Motion** | Анимации |

## Структура проекта

```
ba-workspace-pro/
├── prisma/
├── public/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   └── api/
│   ├── components/
│   │   ├── TaskListPanel.tsx
│   │   ├── WorkspacePanel.tsx
│   │   ├── ScratchpadPanel.tsx
│   │   ├── CreateTaskModal.tsx
│   │   ├── AnalyticsView.tsx
│   │   ├── SettingsView.tsx
│   │   └── ui/
│   ├── hooks/
│   └── lib/
├── Caddyfile
├── next.config.ts
└── package.json
```

---

## Автор

**Дуплей Максим Игоревич**

Данный проект является интеллектуальной собственностью Дуплей Максима Игоревича.

---

<div align="center">

**BA Workspace Pro v0.2.0** — (c) 2026 Дуплей Максим Игоревич

</div>
