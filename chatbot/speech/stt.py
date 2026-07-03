"""
Offline Speech-to-Text using faster-whisper with the multilingual tiny model.
Lazy-loads the model to keep baseline RAM low (~75 MB on demand).
Model: faster-whisper tiny (multilingual) — ~75 MB disk, ~75 MB RAM at runtime.
"""

import io
import wave
import numpy as np
from typing import Optional

_WHISPER_MODEL = None
_WHISPER_AVAILABLE = False

try:
    from faster_whisper import WhisperModel
    _WHISPER_AVAILABLE = True
except ImportError:
    WhisperModel = None


def load_model(device: str = "cpu", compute_type: str = "int8") -> None:
    global _WHISPER_MODEL
    if _WHISPER_MODEL is not None:
        return
    if not _WHISPER_AVAILABLE:
        raise RuntimeError(
            "faster-whisper is not installed. Run: pip install faster-whisper"
        )
    _WHISPER_MODEL = WhisperModel("tiny", device=device, compute_type=compute_type)
    print(f"[STT] faster-whisper tiny model loaded (device={device}, compute={compute_type})", flush=True)


def unload_model() -> None:
    global _WHISPER_MODEL
    _WHISPER_MODEL = None
    import gc
    gc.collect()


def is_loaded() -> bool:
    return _WHISPER_MODEL is not None


def _wav_bytes_to_float32(wav_bytes: bytes) -> np.ndarray:
    with io.BytesIO(wav_bytes) as buf:
        with wave.open(buf, "rb") as wf:
            frames = wf.readframes(wf.getnframes())
            dtype = np.int16 if wf.getsampwidth() == 2 else np.int32
            samples = np.frombuffer(frames, dtype=dtype).astype(np.float32) / 32768.0
            if wf.getnchannels() > 1:
                samples = samples.reshape(-1, wf.getnchannels()).mean(axis=1)
            return samples


def transcribe_wav(wav_bytes: bytes, language: str = "ar") -> str:
    if not _WHISPER_AVAILABLE:
        raise RuntimeError("faster-whisper is not installed")
    load_model()

    audio = _wav_bytes_to_float32(wav_bytes)

    segments, _ = _WHISPER_MODEL.transcribe(audio, language=language, beam_size=3)
    text = " ".join(seg.text.strip() for seg in segments)
    return text


def transcribe_raw_pcm(pcm_bytes: bytes, sample_rate: int = 16000, language: str = "ar") -> str:
    if not _WHISPER_AVAILABLE:
        raise RuntimeError("faster-whisper is not installed")
    load_model()

    samples = np.frombuffer(pcm_bytes, dtype=np.int16).astype(np.float32) / 32768.0

    segments, _ = _WHISPER_MODEL.transcribe(samples, language=language, beam_size=3)
    text = " ".join(seg.text.strip() for seg in segments)
    return text
