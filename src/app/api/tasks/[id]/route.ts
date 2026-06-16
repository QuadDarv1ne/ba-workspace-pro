import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const task = body;

    const data: Record<string, any> = {};
    if (task.name !== undefined) data.name = task.name;
    if (task.type !== undefined) data.type = task.type;
    if (task.status !== undefined) data.status = task.status;
    if (task.priority !== undefined) data.priority = task.priority;
    if (task.questions !== undefined) data.questions = JSON.stringify(task.questions);
    if (task.acceptanceCrit !== undefined) data.acceptanceCrit = JSON.stringify(task.acceptanceCrit);
    if (task.decisions !== undefined) data.decisions = JSON.stringify(task.decisions);
    if (task.risks !== undefined) data.risks = JSON.stringify(task.risks);
    if (task.tails !== undefined) data.tails = JSON.stringify(task.tails);
    if (task.dependencies !== undefined) data.dependencies = JSON.stringify(task.dependencies);
    if (task.notes !== undefined) data.notes = task.notes;
    if (task.timerSeconds !== undefined) data.timerSeconds = task.timerSeconds;
    if (task.timerRunning !== undefined) data.timerRunning = task.timerRunning;
    if (task.timerStartedAt !== undefined) data.timerStartedAt = task.timerStartedAt;
    if (task.collapsedSecs !== undefined) data.collapsedSecs = JSON.stringify(task.collapsedSecs);
    if (task.tags !== undefined) data.tags = JSON.stringify(task.tags);

    const updated = await db.task.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, task: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
