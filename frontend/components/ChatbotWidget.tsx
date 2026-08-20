'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Mic, MicOff, Volume2 } from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataLength = samples.length * blockAlign;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  const writeStr = (off: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, 'data');
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

async function transcribeAudio(blob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('file', blob, 'audio.wav');
  const res = await fetch('/api/chatbot/transcribe', { method: 'POST', body: formData });
  const data = await res.json();
  return data.text || '';
}

async function synthesizeSpeech(text: string): Promise<HTMLAudioElement | null> {
  try {
    const res = await fetch('/api/chatbot/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => URL.revokeObjectURL(url);
    return audio;
  } catch {
    return null;
  }
}

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: 'bot', text: 'مرحباً بك في مساعد المصنع الذكي! كيف يمكنني مساعدتك؟' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [, setSpeaking] = useState(false);
  const [autoTts, setAutoTts] = useState(true);
  const [micAvailable, setMicAvailable] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const recorderRef = useRef<{
    stream: MediaStream;
    context: AudioContext;
    source: MediaStreamAudioSourceNode;
    processor: ScriptProcessorNode;
    chunks: Float32Array[];
  } | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const handler = () => setOpen((v) => !v);
    window.addEventListener('toggle-chatbot', handler);
    return () => window.removeEventListener('toggle-chatbot', handler);
  }, []);

  useEffect(() => {
    try {
      const hasMediaDevices = !!(navigator?.mediaDevices?.getUserMedia);
      if (!hasMediaDevices) {
        setMicAvailable(false);
        return;
      }
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isHTTP = location.protocol !== 'https:';
      if (isIOS && isHTTP) {
        setMicAvailable(false);
      }
    } catch {
      setMicAvailable(false);
    }
  }, []);

  const speakReply = useCallback(async (text: string) => {
    if (!autoTts) return;
    setSpeaking(true);
    try {
      const audio = await synthesizeSpeech(text);
      if (audio) {
        await audio.play();
      }
    } catch {
    } finally {
      setSpeaking(false);
    }
  }, [autoTts]);

  const send = async (textOverride?: string) => {
    const text = textOverride ?? input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text }]);
    setLoading(true);

    try {
      const userId = parseInt(localStorage.getItem('userId') || '1', 10);
      const res = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, message: text }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { sender: 'bot', text: data.reply }]);
      speakReply(data.reply);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'عذراً، حدث خطأ في الاتصال. حاول مرة أخرى.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const context = new AudioContext({ sampleRate: 16000 });
      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(4096, 1, 1);
      const chunks: Float32Array[] = [];

      source.connect(processor);
      processor.connect(context.destination);

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        chunks.push(new Float32Array(inputData));
      };

      recorderRef.current = { stream, context, source, processor, chunks };
      setRecording(true);
    } catch (err) {
      console.error('Mic access denied:', err);
    }
  };

  const stopRecording = async () => {
    const rec = recorderRef.current;
    if (!rec) return;
    setRecording(false);

    const { stream, context, source, processor, chunks } = rec;

    processor.disconnect();
    source.disconnect();
    await context.close();
    stream.getTracks().forEach((t) => t.stop());
    recorderRef.current = null;

    if (chunks.length === 0) return;

    const totalLen = chunks.reduce((s, c) => s + c.length, 0);
    const all = new Float32Array(totalLen);
    let offset = 0;
    for (const c of chunks) {
      all.set(c, offset);
      offset += c.length;
    }

    const wav = encodeWav(all, 16000);
    if (wav.size < 256) return;

    setLoading(true);
    try {
      const text = await transcribeAudio(wav);
      if (text) {
        await send(text);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'عذراً، لم أتمكن من فهم الصوت. حاول مرة أخرى.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleRecording = () => {
    if (recording) stopRecording();
    else startRecording();
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-[150px] left-4 z-50 w-80 sm:w-96 h-[450px] glass border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-bold text-white">مساعد المصنع</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setAutoTts((v) => !v)}
                className={`p-1.5 rounded-lg transition ${
                  autoTts ? 'text-blue-400 hover:bg-white/10' : 'text-[#ecfdf5]0 hover:text-slate-300'
                }`}
                title={autoTts ? 'إيقاف القراءة الصوتية' : 'تشغيل القراءة الصوتية'}
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1 text-slate-400 hover:text-white transition rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-blue-400" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600/40 text-white rounded-br-md'
                      : 'bg-white/5 text-slate-200 rounded-bl-md'
                  }`}
                >
                  {msg.text}
                </div>
                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4 text-indigo-400" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 justify-end">
                <div className="max-w-[80%] px-3 py-2 rounded-2xl bg-white/5 rounded-bl-md">
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                </div>
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-blue-400" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="px-4 py-3 border-t border-white/5 bg-white/5">
            <div className="flex gap-2">
              {micAvailable && (
                <button
                  onClick={toggleRecording}
                  disabled={loading}
                  className={`p-2 rounded-xl transition ${
                    recording
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                  title={recording ? 'إيقاف التسجيل' : 'تسجيل صوتي'}
                >
                  {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اكتب رسالتك هنا..."
                className="flex-1 bg-white/10 text-white placeholder-slate-400 rounded-xl px-3 py-2 text-sm outline-none border border-white/5 focus:border-emerald-500/50 transition"
                dir="rtl"
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="p-2 bg-blue-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            {recording && (
              <div className="mt-2 flex items-center gap-2 text-xs text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                جاري التسجيل... اضغط مرة أخرى للإرسال
              </div>
            )}
            {!micAvailable && (
              <div className="mt-2 flex items-center gap-2 text-xs text-yellow-400">
                التسجيل الصوتي مش متاح على iPhone عبر HTTP. افتح عبر HTTPS.
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-[86px] left-4 z-50 p-3 rounded-2xl shadow-lg transition-all duration-200 ${
          open ? 'bg-red-500/80 hover:bg-red-500' : 'bg-blue-600 hover:bg-emerald-500'
        } text-white`}
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </button>
    </>
  );
}
