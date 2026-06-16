import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { task, config } = body;

    const host = config?.jiraHost;
    const email = config?.jiraEmail;
    const token = config?.jiraToken;
    const projectKey = config?.jiraProjectKey;
    const corsProxy = config?.jiraCorsProxy;

    if (!host || !email || !token) {
      return NextResponse.json({ error: 'Jira not configured. Set host, email and token in Settings.' }, { status: 400 });
    }

    const baseUrl = corsProxy ? `${corsProxy}/` : `https://${host}`;
    const auth = Buffer.from(`${email}:${token}`).toString('base64');

    const res = await fetch(`${baseUrl}/rest/api/2/issue`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          project: { key: projectKey },
          summary: task.name,
          description: formatTaskForJira(task),
          issuetype: { name: mapTypeToIssueType(task.type) },
          priority: { name: mapPriority(task.priority) },
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ success: true, key: data.key, url: `https://${host}/browse/${data.key}` });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function formatTaskForJira(task: Record<string, unknown>): string {
  let text = '';
  if (task.questions) {
    const qs = task.questions as Array<{ text: string; answer: string; completed: boolean; removed: boolean }>;
    const active = qs.filter((q: { removed: boolean }) => !q.removed);
    if (active.length) {
      text += 'h3. Questions & Answers\n\n';
      for (const q of active) {
        text += `* [${q.completed ? 'x' : ' '}] ${q.text}\n`;
        if (q.answer) text += `** ${q.answer}\n`;
      }
      text += '\n';
    }
  }
  if (task.acceptanceCrit) {
    const ac = task.acceptanceCrit as Array<{ text: string; done: boolean }>;
    if (ac.length) {
      text += 'h3. Acceptance Criteria\n\n';
      for (const c of ac) text += `* [${c.done ? 'x' : ' '}] ${c.text}\n`;
      text += '\n';
    }
  }
  if (task.decisions) {
    const ds = task.decisions as Array<{ text: string }>;
    if (ds.length) {
      text += 'h3. Decisions\n\n';
      for (const d of ds) text += `* ${d.text}\n`;
      text += '\n';
    }
  }
  if (task.risks) {
    const rs = task.risks as Array<{ text: string; severity: string }>;
    if (rs.length) {
      text += 'h3. Risks\n\n';
      for (const r of rs) text += `* [${r.severity}] ${r.text}\n`;
      text += '\n';
    }
  }
  if (task.notes) text += `h3. Notes\n\n${task.notes}\n`;
  return text;
}

function mapTypeToIssueType(type: string): string {
  const map: Record<string, string> = {
    bug: 'Bug',
    feature: 'Story',
    integration: 'Story',
    migration: 'Task',
    uiux: 'Story',
    general: 'Task',
    'api-design': 'Story',
    performance: 'Task',
    security: 'Task',
    compliance: 'Task',
  };
  return map[type] || 'Task';
}

function mapPriority(priority: string): string {
  const map: Record<string, string> = {
    critical: 'Highest',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };
  return map[priority] || 'Medium';
}
