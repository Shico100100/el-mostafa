"""
FastAPI router for speech endpoints:
  POST /api/chatbot/speech/transcribe   (audio → text)
  POST /api/chatbot/speech/synthesize   (text → audio)
  GET  /api/chatbot/speech/status       (STT/TTS availability)
"""

import asyncio
import io
import wave
import struct
from typing import Optional

from pydantic import BaseModel

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import Response


class SynthesizeRequest(BaseModel):
    text: str

router = APIRouter(prefix="/api/chatbot/speech", tags=["speech"])

_STT_LOADED = False
_TTS_LOADED = False


@router.on_event("startup")
async def _prewarm():
    global _STT_LOADED, _TTS_LOADED
    pass  # lazy load on first use


def _run_in_thread(fn, *args, **kwargs):
    loop = asyncio.get_event_loop()
    return loop.run_in_executor(None, fn, *args, **kwargs)


@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    contents = await file.read()
    if not contents:
        raise HTTPException(400, "Empty audio file")

    from speech.stt import transcribe_wav, load_model
    try:
        text = await _run_in_thread(transcribe_wav, contents)
    except Exception as e:
        raise HTTPException(500, f"Transcription failed: {str(e)}")

    return {"text": text}


@router.post("/transcribe-raw")
async def transcribe_raw(
    pcm: bytes = File(...),
    sample_rate: int = Form(16000),
):
    """Transcribe raw PCM 16-bit mono audio bytes."""
    if not pcm:
        raise HTTPException(400, "Empty audio data")

    from speech.stt import transcribe_raw_pcm
    try:
        text = await _run_in_thread(transcribe_raw_pcm, pcm, sample_rate)
    except Exception as e:
        raise HTTPException(500, f"Transcription failed: {str(e)}")

    return {"text": text}


@router.post("/synthesize")
async def synthesize_text(req: SynthesizeRequest):
    if not req.text.strip():
        raise HTTPException(400, "Text cannot be empty")

    from speech.tts import synthesize_to_wav
    try:
        wav_bytes = await _run_in_thread(synthesize_to_wav, req.text)
    except Exception as e:
        raise HTTPException(500, f"Synthesis failed: {str(e)}")

    return Response(
        content=wav_bytes,
        media_type="audio/wav",
        headers={
            "Content-Disposition": "inline; filename=speech.wav",
        },
    )


@router.get("/status")
async def speech_status():
    global _STT_LOADED, _TTS_LOADED
    stt_ok = False
    tts_ok = False
    try:
        from speech.stt import is_loaded as stt_loaded, load_model
        stt_ok = stt_loaded()
        if not stt_ok:
            load_model()
            stt_ok = True
    except Exception:
        pass
    try:
        from speech.tts import is_loaded as tts_loaded
        tts_ok = tts_loaded()
        if not tts_ok:
            from speech.tts import _get_engine
            _get_engine()
            tts_ok = True
    except Exception:
        pass
    _STT_LOADED = stt_ok
    _TTS_LOADED = tts_ok
    return {
        "stt_available": stt_ok,
        "tts_available": tts_ok,
        "stt_engine": "faster-whisper tiny (multilingual)",
        "tts_engine": "pyttsx3 (sapi5)",
    }
