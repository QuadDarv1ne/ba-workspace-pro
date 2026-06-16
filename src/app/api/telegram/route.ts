import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { config, task } = body;

    const botToken = config?.telegramBotToken;
    const chatId = config?.telegramChatId;

    if (!botToken || !chatId) {
      return NextResponse.json({ error: 'Bot token and Chat ID required' }, { status: 400 });
    }

    let message = '';
    if (task) {
      message = `*${task.name}*\nType: ${task.type} | Status: ${task.status} | Priority: ${task.priority}\n`;
      const activeQs = (task.questions || []).filter((q: { removed: boolean }) => !q.removed);
      const answered = activeQs.filter((q: { answer: string }) => q.answer);
      if (answered.length) {
        message += `\nQuestions answered: ${answered.length}/${activeQs.length}\n`;
        answered.slice(0, 5).forEach((q: { text: string; answer: string }) => {
          message += `• ${q.text}\n  → ${q.answer}\n`;
        });
      }
      if (task.risks?.length) {
        message += `\nRisks: ${task.risks.length}\n`;
      }
      if (task.notes) {
        message += `\nNotes: ${task.notes.substring(0, 200)}\n`;
      }
    } else {
      return NextResponse.json({ error: 'Task data required' }, { status: 400 });
    }

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ success: true, messageId: data.result?.message_id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
