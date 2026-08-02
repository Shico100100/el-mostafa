import { NextRequest, NextResponse } from 'next/server';

const CHATBOT_BASE = process.env.CHATBOT_URL || 'http://localhost:8765';
const API_URL = `${CHATBOT_BASE}/api/chatbot/speech/transcribe`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('file');
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file' }, { status: 400 });
    }
    const body = new FormData();
    body.append('file', audioFile);
    const res = await fetch(API_URL, { method: 'POST', body });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Speech service unavailable' }, { status: 503 });
  }
}
