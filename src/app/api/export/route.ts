import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tasks, format } = body;

    if (format === 'markdown' || format === 'notion') {
      let md = '# BA Workspace Pro — Export\n\n';
      for (const task of tasks) {
        md += `## ${task.name}\n\n`;
        md += `**Type:** ${task.type} | **Status:** ${task.status} | **Priority:** ${task.priority}\n\n`;

        if (task.questions?.length) {
          md += `### Questions & Answers\n\n`;
          for (const q of task.questions) {
            if (q.removed) continue;
            md += `- [${q.completed ? 'x' : ' '}] **${q.text}**\n`;
            if (q.answer) md += `  - ${q.answer}\n`;
          }
          md += '\n';
        }

        if (task.acceptanceCrit?.length) {
          md += `### Acceptance Criteria\n\n`;
          for (const c of task.acceptanceCrit) {
            md += `- [${c.done ? 'x' : ' '}] ${c.text}\n`;
          }
          md += '\n';
        }

        if (task.decisions?.length) {
          md += `### Decisions\n\n`;
          for (const d of task.decisions) {
            md += `- ${d.text}\n`;
          }
          md += '\n';
        }

        if (task.risks?.length) {
          md += `### Risks\n\n`;
          for (const r of task.risks) {
            md += `- [${r.severity}] ${r.text}\n`;
          }
          md += '\n';
        }

        if (task.tails?.length) {
          md += `### Tails\n\n`;
          md += `| Who | What | Deadline |\n|-----|------|----------|\n`;
          for (const t of task.tails) {
            md += `| ${t.who} | ${t.what} | ${t.deadline} |\n`;
          }
          md += '\n';
        }

        if (task.dependencies?.length) {
          md += `### Dependencies\n\n`;
          for (const d of task.dependencies) {
            md += `- ${d.blocks ? 'Blocks' : 'Depends on'}: ${d.text}\n`;
          }
          md += '\n';
        }

        if (task.notes) {
          md += `### Notes\n\n${task.notes}\n\n`;
        }

        md += '---\n\n';
      }

      return NextResponse.json({ success: true, content: md, filename: 'ba-workspace-export.md' });
    }

    return NextResponse.json({ error: 'Unknown format' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
