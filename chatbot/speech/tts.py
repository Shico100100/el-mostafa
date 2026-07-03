"""
Offline Text-to-Speech using pyttsx3 (Windows SAPI5).
Lazy-loads the engine to keep baseline RAM low.

On Windows, uses SAPI5 — will try to find Arabic voices.
If none found, falls back to default voice.
"""

import io
import os
import tempfile
import wave
from typing import Optional

_TTS_ENGINE = None
_TTS_AVAILABLE = False

try:
    import pyttsx3
    _TTS_AVAILABLE = True
except ImportError:
    pyttsx3 = None


def _get_engine():
    global _TTS_ENGINE
    if _TTS_ENGINE is not None:
        return _TTS_ENGINE
    if not _TTS_AVAILABLE:
        raise RuntimeError(
            "pyttsx3 is not installed. Run: pip install pyttsx3"
        )
    _TTS_ENGINE = pyttsx3.init(driverName="sapi5")
    _TTS_ENGINE.setProperty("rate", 150)
    _TTS_ENGINE.setProperty("volume", 1.0)

    voices = _TTS_ENGINE.getProperty("voices")
    arabic_voice = None
    for v in voices:
        if "arabic" in v.name.lower() or "ar-" in v.id.lower() or "ar_" in v.id.lower():
            arabic_voice = v
            break

    if arabic_voice:
        _TTS_ENGINE.setProperty("voice", arabic_voice.id)
        print(f"[TTS] Using Arabic voice: {arabic_voice.name}", flush=True)
    else:
        print("[TTS] No Arabic voice found, using default voice. Install Arabic language pack for better results.", flush=True)

    return _TTS_ENGINE


def is_loaded() -> bool:
    return _TTS_ENGINE is not None


def unload_engine() -> None:
    global _TTS_ENGINE
    if _TTS_ENGINE is not None:
        _TTS_ENGINE.stop()
    _TTS_ENGINE = None
    import gc
    gc.collect()


def synthesize_to_wav(text: str) -> bytes:
    if not _TTS_AVAILABLE:
        raise RuntimeError("pyttsx3 is not installed")
    engine = _get_engine()

    tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    tmp_path = tmp.name
    tmp.close()

    try:
        engine.save_to_file(text, tmp_path)
        engine.runAndWait()

        with open(tmp_path, "rb") as f:
            data = f.read()
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass

    return data


def synthesize_to_bytes(text: str, format: str = "wav") -> bytes:
    return synthesize_to_wav(text)
