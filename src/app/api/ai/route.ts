import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, taskName, taskType, questions, answers, context, locale } = body;

    const zai = await ZAI.create();

    const langInstruction = locale === 'ru'
      ? 'ВАЖНО: Отвечай ТОЛЬКО на русском языке. Все вопросы, резюме и риски должны быть на русском.'
      : 'IMPORTANT: Respond ONLY in English. All questions, summaries and risks must be in English.';

    let systemPrompt = '';
    let userPrompt = '';

    if (action === 'suggest-questions') {
      systemPrompt = `You are an expert Business Analyst assistant. Generate specific, actionable analysis questions. ${langInstruction} Return only a JSON array of strings, no explanation.`;
      userPrompt = `Task: "${taskName}" (type: ${taskType}). Generate 5-8 additional analysis questions that would be important to ask. Context: ${context || 'No additional context'}`;
    } else if (action === 'summarize') {
      systemPrompt = `You are an expert Business Analyst assistant. Create concise summaries. ${langInstruction}`;
      userPrompt = `Summarize the following task analysis in a structured format:\nTask: "${taskName}" (type: ${taskType})\nQuestions & Answers:\n${answers || 'No answers yet'}`;
    } else if (action === 'analyze-risks') {
      systemPrompt = `You are an expert Business Analyst assistant specializing in risk analysis. ${langInstruction} Return a JSON array of objects with "text" and "severity" (low/medium/high) fields.`;
      userPrompt = `Analyze potential risks for:\nTask: "${taskName}" (type: ${taskType})\nCurrent analysis: ${answers || 'No data yet'}\nIdentify 3-5 key risks.`;
    } else if (action === 'suggest-criteria') {
      systemPrompt = `You are an expert Business Analyst assistant. Generate acceptance criteria. ${langInstruction} Return only a JSON array of strings.`;
      userPrompt = `Suggest acceptance criteria for:\nTask: "${taskName}" (type: ${taskType})\nContext: ${answers || 'No additional context'}`;
    } else {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content || '';

    return NextResponse.json({ success: true, content });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('AI API error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
