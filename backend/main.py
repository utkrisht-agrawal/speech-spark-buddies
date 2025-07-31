from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from difflib import SequenceMatcher
import whisper
import tempfile
import os
import ffmpeg
import torch
import nltk
import soundfile as sf
import librosa
import numpy as np
from transformers import Wav2Vec2Processor, Wav2Vec2ForCTC
from g2p_en import G2p
import warnings
warnings.filterwarnings("ignore")

# Downloads (once)
nltk.download('averaged_perceptron_tagger')
nltk.download('averaged_perceptron_tagger_eng')

# ---- Config ----
ffmpeg_path = "C:/Users/m3n1ak/Downloads/Softwares/ffmpeg-7.1.1-essentials_build/ffmpeg/bin/ffmpeg.exe"
os.environ["PATH"] += os.pathsep + os.path.dirname(ffmpeg_path)

# ---- App Setup ----
app = FastAPI()
whisper_model = whisper.load_model("base")
wav2vec_processor = Wav2Vec2Processor.from_pretrained("facebook/wav2vec2-large-960h-lv60-self")
wav2vec_model = Wav2Vec2ForCTC.from_pretrained("facebook/wav2vec2-large-960h-lv60-self")
g2p = G2p()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8025", "http://127.0.0.1:8025", "https://preview--speech-spark-buddies.lovable.app/", "https://preview--speech-spark-buddies.lovable.app", "http://localhost:3000", "https://lovable.dev/projects/167b285d-7cb5-42d5-b852-85dce51e6b49"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Multimodal backend (Whisper + Wav2Vec2 + G2P) is running."}

def convert_audio(input_path):
    wav_path = input_path.replace(".webm", ".wav")
    ffmpeg.input(input_path).output(wav_path, ar=16000, ac=1).overwrite_output().run()
    return wav_path

def text_to_phonemes(text: str) -> str:
    return ' '.join(g2p(text))

def transcribe_with_whisper(wav_path, target):
    result = whisper_model.transcribe(wav_path, language="en")
    transcript = result["text"].strip().lower()

    print(f"🗣️ Whisper Transcript: {transcript}")
    ratio = SequenceMatcher(None, target.lower(), transcript).ratio()
    return int(ratio * 100), transcript, transcript, target

def transcribe_with_wav2vec(wav_path, target):
    waveform, sample_rate = sf.read(wav_path)
    if waveform.ndim > 1:
        waveform = waveform.mean(axis=1)  # Convert stereo to mono

    if sample_rate != 16000:
        waveform = librosa.resample(waveform, orig_sr=sample_rate, target_sr=16000)

    waveform_tensor = torch.tensor(waveform).float()
    input_values = wav2vec_processor(waveform_tensor, return_tensors="pt", sampling_rate=16000).input_values
    logits = wav2vec_model(input_values).logits
    predicted_ids = torch.argmax(logits, dim=-1)

    transcript = wav2vec_processor.batch_decode(predicted_ids)[0].lower().strip()
    print(f"🗣️ Wav2Vec2 Transcript: {transcript}")

    spoken_phonemes = text_to_phonemes(transcript)
    target_phonemes = text_to_phonemes(target)

    print(f"✅ Target Phonemes: {target_phonemes}")
    print(f"🗣️ Spoken Phonemes: {spoken_phonemes}")

    ratio = SequenceMatcher(None, target_phonemes, spoken_phonemes).ratio()
    return int(ratio * 100), transcript, spoken_phonemes, target_phonemes

@app.post("/score")
async def score(
    audio: UploadFile = File(...),
    target_phoneme: str = Form(...),
    mode: str = Form("phoneme")
):
    print(f"\n🎯 Mode: {mode}, Target: {target_phoneme}")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
        tmp.write(await audio.read())
        tmp_path = tmp.name

    wav_path = convert_audio(tmp_path)

    try:
        if mode == "sentence":
            score, transcript, spoken, target_proc = transcribe_with_whisper(wav_path, target_phoneme)
        else:
            score, transcript, spoken, target_proc = transcribe_with_wav2vec(wav_path, target_phoneme)
    finally:
        os.remove(tmp_path)
        os.remove(wav_path)

    print(f"✅ Score: {score}%")

    return {
        "score": score,
        "transcript": transcript,
        "spoken_phoneme": spoken,
        "target_phoneme": target_proc
    }

@app.post("/phonemeSequence")
async def phoneme_sequence(text: str = Form(...)):
    print(f"🔤 Generating phoneme sequence for: {text}")
    phoneme_seq = g2p(text)
    print(f"✅ Phoneme Sequence: {' '.join(phoneme_seq)}")
    return {
        "input_text": text,
        "phoneme_sequence": phoneme_seq
    }