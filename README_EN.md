<div align="center">

# BA Workspace Pro v0.2.0

### Advanced Tool for Business and System Analysts

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-new--york-black)](https://ui.shadcn.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2d3748?logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](./LICENSE)

---

**Author:** Dupley Maxim Igorevich

**Intellectual Property:** Dupley Maxim Igorevich

</div>

---

## About the Project

**BA Workspace Pro** is a single-page web application designed for business and system analysts. It provides a structured workspace for managing analysis tasks using specialized question templates, time tracking, analytics, and integrations with Jira, Confluence, and Telegram.

## Features

- **10 task types** — each with tailored question templates (16–23 questions per type)
- **Structured sections** — questions & answers, acceptance criteria, decisions, risks, tails (who/what/deadline), dependencies, notes
- **Per-task timer** — elapsed time tracking with color indicators
- **AI assistant** — suggest questions, summarize, analyze risks, generate criteria
- **Analytics dashboard** — task summary, distribution by type/status/priority, recent activity
- **Markdown export** — export any task to Markdown
- **Dark mode** — full dark theme support
- **Integrations** — API routes ready for Jira, Confluence, and Telegram
- **Localization** — Russian and English
- **Local storage** — all data persisted in localStorage

## Task Types

| Type | Description |
|------|-------------|
| **Requirement** | Functional and non-functional requirements |
| **User Story** | User stories in As Is / To Be format |
| **Use Case** | Use cases with actors and flows |
| **Business Process** | Process steps, roles, and triggers |
| **Integration** | Integration specification |
| **Report / Dashboard** | Report, metric, and visualization requirements |
| **Bug / Defect** | Defect description, steps to reproduce, environment |
| **Task** | General task with custom description |
| **RFC / Proposal** | Change justification, alternative analysis |
| **API / Specification** | Endpoints, methods, data schemas |

## Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16 | React framework with App Router |
| **TypeScript** | 5 | Static typing |
| **Tailwind CSS** | 4 | Utility-first CSS |
| **shadcn/ui** | — | UI components (New York style) |
| **Zustand** | 5 | State management |
| **Prisma** | 6 | Database ORM |
| **Framer Motion** | 12 | Animations |
| **Radix UI** | — | Accessible UI primitives |
| **z-ai-web-dev-sdk** | — | AI assistant |

## Installation and Setup

### Prerequisites

- **Node.js** 18+ (20+ recommended)
- **bun** (recommended) or npm/yarn/pnpm

### Installation

```bash
git clone <repo-url>
cd ba-workspace-pro
bun install
bun run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
bun run build
bun run start
```

## Project Structure

```
ba-workspace-pro/
├── prisma/                         # DB schema and migrations
├── public/                         # Static files
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Main page (SPA)
│   │   ├── globals.css             # Global styles
│   │   └── api/                    # API routes (ai, export, jira, confluence, telegram)
│   ├── components/
│   │   ├── TaskListPanel.tsx       # Task list panel
│   │   ├── WorkspacePanel.tsx      # Task editor panel
│   │   ├── ScratchpadPanel.tsx     # Scratchpad panel
│   │   ├── CreateTaskModal.tsx     # Create task modal
│   │   ├── AnalyticsView.tsx       # Analytics dashboard
│   │   ├── SettingsView.tsx        # Integration settings
│   │   └── ui/                     # shadcn/ui components
│   ├── hooks/                      # Custom hooks
│   └── lib/                        # Utilities, store, i18n, types
├── Caddyfile                       # Reverse proxy config
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

## Configuration

### Database

SQLite is used by default (`prisma/dev.db`). Set via `DATABASE_URL` in `.env`:

```bash
bun run db:generate  # Generate Prisma client
bun run db:push      # Push schema to database
bun run db:migrate   # Create and apply migration
```

### Integrations

Configure Jira, Confluence, and Telegram via the Settings view in the application.

---

## Author

**Dupley Maxim Igorevich**

This project is the intellectual property of Dupley Maxim Igorevich. All rights to the source code, design, content, and materials belong to the author.

---

<div align="center">

**BA Workspace Pro v0.2.0** — (c) 2026 Dupley Maxim Igorevich

</div>
