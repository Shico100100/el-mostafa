import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'http://localhost:8765/api/chatbot/speech/synthesize';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;
    if (!text) {
      return NextResponse.json({ error: 'No text' }, { status: 400 });
    }
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'Synthesis failed' }, { status: res.status });
    }
    const audioBlob = await res.blob();
    return new NextResponse(audioBlob, {
      headers: { 'Content-Type': 'audio/wav' },
    });
  } catch {
    return NextResponse.json({ error: 'Speech service unavailable' }, { status: 503 });
  }
}
