import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const settings = await db.integrationSettings.findFirst();
    if (!settings) {
      return NextResponse.json({
        success: true,
        settings: {
          jiraHost: '', jiraEmail: '', jiraToken: '', jiraProjectKey: '', jiraCorsProxy: '',
          confluenceHost: '', confluenceEmail: '', confluenceToken: '', confluenceSpaceId: '', confluenceCorsProxy: '',
          telegramBotToken: '', telegramChatId: '',
        },
      });
    }
    return NextResponse.json({ success: true, settings });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings } = body;

    const existing = await db.integrationSettings.findFirst();

    if (existing) {
      await db.integrationSettings.update({
        where: { id: existing.id },
        data: settings,
      });
    } else {
      await db.integrationSettings.create({ data: settings });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
