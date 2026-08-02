import { NextRequest, NextResponse } from 'next/server';

const CHATBOT_BASE = process.env.CHATBOT_URL || 'http://localhost:8765';
const CHATBOT_URL = `${CHATBOT_BASE}/api/chatbot/message`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetch(CHATBOT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { reply: 'عذراً، تعذر الاتصال بمساعد المصنع. يرجى المحاولة لاحقاً.', error: true },
      { status: 200 }
    );
  }
}
