import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { task, config } = body;

    const host = config?.confluenceHost;
    const email = config?.confluenceEmail;
    const token = config?.confluenceToken;
    const spaceId = config?.confluenceSpaceId;
    const corsProxy = config?.confluenceCorsProxy;

    if (!host || !email || !token) {
      return NextResponse.json({ error: 'Confluence not configured. Set host, email and token in Settings.' }, { status: 400 });
    }

    const baseUrl = corsProxy ? `${corsProxy}/` : `https://${host}`;
    const auth = Buffer.from(`${email}:${token}`).toString('base64');

    const res = await fetch(`${baseUrl}/wiki/api/v2/pages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        spaceId: spaceId,
        status: 'current',
        title: task.name,
        body: {
          representation: 'wiki',
          value: formatTaskForConfluence(task),
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ success: true, pageId: data.id, url: data._links?.base + data._links?.webui });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function formatTaskForConfluence(task: Record<string, unknown>): string {
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
  if (task.notes) text += `h3. Notes\n\n${task.notes}\n`;
  return text;
}
