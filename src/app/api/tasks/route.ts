import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const tasks = await db.task.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const parsed = tasks.map((t) => ({
      id: t.id,
      name: t.name,
      type: t.type,
      status: t.status,
      priority: t.priority,
      questions: JSON.parse(t.questions),
      acceptanceCrit: JSON.parse(t.acceptanceCrit),
      decisions: JSON.parse(t.decisions),
      risks: JSON.parse(t.risks),
      tails: JSON.parse(t.tails),
      dependencies: JSON.parse(t.dependencies),
      notes: t.notes,
      timerSeconds: t.timerSeconds,
      timerRunning: t.timerRunning,
      timerStartedAt: t.timerStartedAt,
      collapsedSecs: JSON.parse(t.collapsedSecs),
      tags: JSON.parse(t.tags),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));

    return NextResponse.json({ success: true, tasks: parsed });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { task } = body;

    if (!task || !task.id || !task.name) {
      return NextResponse.json({ error: 'Invalid task data' }, { status: 400 });
    }

    const created = await db.task.create({
      data: {
        id: task.id,
        name: task.name,
        type: task.type || 'general',
        status: task.status || 'active',
        priority: task.priority || 'medium',
        questions: JSON.stringify(task.questions || []),
        acceptanceCrit: JSON.stringify(task.acceptanceCrit || []),
        decisions: JSON.stringify(task.decisions || []),
        risks: JSON.stringify(task.risks || []),
        tails: JSON.stringify(task.tails || []),
        dependencies: JSON.stringify(task.dependencies || []),
        notes: task.notes || '',
        timerSeconds: task.timerSeconds || 0,
        timerRunning: task.timerRunning || false,
        timerStartedAt: task.timerStartedAt || null,
        collapsedSecs: JSON.stringify(task.collapsedSecs || {}),
        tags: JSON.stringify(task.tags || []),
      },
    });

    return NextResponse.json({ success: true, task: created });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { task } = body;

    if (!task || !task.id) {
      return NextResponse.json({ error: 'Invalid task data' }, { status: 400 });
    }

    const updated = await db.task.upsert({
      where: { id: task.id },
      create: {
        id: task.id,
        name: task.name,
        type: task.type || 'general',
        status: task.status || 'active',
        priority: task.priority || 'medium',
        questions: JSON.stringify(task.questions || []),
        acceptanceCrit: JSON.stringify(task.acceptanceCrit || []),
        decisions: JSON.stringify(task.decisions || []),
        risks: JSON.stringify(task.risks || []),
        tails: JSON.stringify(task.tails || []),
        dependencies: JSON.stringify(task.dependencies || []),
        notes: task.notes || '',
        timerSeconds: task.timerSeconds || 0,
        timerRunning: task.timerRunning || false,
        timerStartedAt: task.timerStartedAt || null,
        collapsedSecs: JSON.stringify(task.collapsedSecs || {}),
        tags: JSON.stringify(task.tags || []),
      },
      update: {
        name: task.name,
        type: task.type,
        status: task.status,
        priority: task.priority,
        questions: JSON.stringify(task.questions || []),
        acceptanceCrit: JSON.stringify(task.acceptanceCrit || []),
        decisions: JSON.stringify(task.decisions || []),
        risks: JSON.stringify(task.risks || []),
        tails: JSON.stringify(task.tails || []),
        dependencies: JSON.stringify(task.dependencies || []),
        notes: task.notes,
        timerSeconds: task.timerSeconds,
        timerRunning: task.timerRunning,
        timerStartedAt: task.timerStartedAt,
        collapsedSecs: JSON.stringify(task.collapsedSecs || {}),
        tags: JSON.stringify(task.tags || []),
      },
    });

    return NextResponse.json({ success: true, task: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { tasks } = body;

    if (!Array.isArray(tasks)) {
      return NextResponse.json({ error: 'Expected tasks array' }, { status: 400 });
    }

    const upserts = tasks.map((task: any) =>
      db.task.upsert({
        where: { id: task.id },
        create: {
          id: task.id,
          name: task.name,
          type: task.type || 'general',
          status: task.status || 'active',
          priority: task.priority || 'medium',
          questions: JSON.stringify(task.questions || []),
          acceptanceCrit: JSON.stringify(task.acceptanceCrit || []),
          decisions: JSON.stringify(task.decisions || []),
          risks: JSON.stringify(task.risks || []),
          tails: JSON.stringify(task.tails || []),
          dependencies: JSON.stringify(task.dependencies || []),
          notes: task.notes || '',
          timerSeconds: task.timerSeconds || 0,
          timerRunning: task.timerRunning || false,
          timerStartedAt: task.timerStartedAt || null,
          collapsedSecs: JSON.stringify(task.collapsedSecs || {}),
          tags: JSON.stringify(task.tags || []),
        },
        update: {
          name: task.name,
          type: task.type,
          status: task.status,
          priority: task.priority,
          questions: JSON.stringify(task.questions || []),
          acceptanceCrit: JSON.stringify(task.acceptanceCrit || []),
          decisions: JSON.stringify(task.decisions || []),
          risks: JSON.stringify(task.risks || []),
          tails: JSON.stringify(task.tails || []),
          dependencies: JSON.stringify(task.dependencies || []),
          notes: task.notes,
          timerSeconds: task.timerSeconds,
          timerRunning: task.timerRunning,
          timerStartedAt: task.timerStartedAt,
          collapsedSecs: JSON.stringify(task.collapsedSecs || {}),
          tags: JSON.stringify(task.tags || []),
        },
      })
    );

    await Promise.all(upserts);

    return NextResponse.json({ success: true, count: tasks.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
