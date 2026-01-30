"""
FastAPI backend for SpeakWell - Portuguese pronunciation learning app.
Uses ElevenLabs Speech-to-Text API to transcribe audio and evaluate pronunciation.
"""

import os
from io import BytesIO
from typing import List
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from elevenlabs.client import ElevenLabs

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="SpeakWell API", description="Portuguese pronunciation learning backend")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ElevenLabs client
elevenlabs = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))


# Pydantic Models
class WordEvaluation(BaseModel):
    word: str
    correct: bool


class TranscriptionResponse(BaseModel):
    transcribed_text: str
    expected_phrase: str
    word_evaluations: List[WordEvaluation]
    overall_score: float  # Percentage of correct words
    all_correct: bool


class Phrase(BaseModel):
    id: int
    phrase: str
    translation: str


# Portuguese phrases data (matching frontend)
PORTUGUESE_PHRASES = [
    {"id": 1, "phrase": "Olá, como vai?", "translation": "Hello, how are you?"},
    {"id": 2, "phrase": "Bom dia", "translation": "Good morning"},
    {"id": 3, "phrase": "Obrigado", "translation": "Thank you"},
    {"id": 4, "phrase": "Por favor", "translation": "Please"},
    {"id": 5, "phrase": "Como se chama?", "translation": "What is your name?"},
    {"id": 6, "phrase": "Muito prazer", "translation": "Nice to meet you"},
    {"id": 7, "phrase": "Até logo", "translation": "See you later"},
    {"id": 8, "phrase": "Boa noite", "translation": "Good night"},
    {"id": 9, "phrase": "Eu não entendo", "translation": "I don't understand"},
    {"id": 10, "phrase": "Você fala inglês?", "translation": "Do you speak English?"},
]


def normalize_text(text: str) -> str:
    """Normalize text for comparison by lowercasing and removing punctuation."""
    import re
    # Convert to lowercase
    text = text.lower()
    # Remove punctuation except apostrophes
    text = re.sub(r"[^\w\s']", "", text)
    # Remove extra whitespace
    text = " ".join(text.split())
    return text


def evaluate_words(transcribed: str, expected: str) -> List[WordEvaluation]:
    """
    Compare transcribed words against expected words.
    Returns a list of word evaluations with correctness status.
    """
    # Normalize both texts
    transcribed_normalized = normalize_text(transcribed)
    expected_normalized = normalize_text(expected)
    
    # Split into words
    transcribed_words = transcribed_normalized.split()
    expected_words = expected_normalized.split()
    
    evaluations = []
    
    # For each expected word, check if it appears in transcription
    # This is a simple approach - we check if the expected word exists anywhere in transcription
    for expected_word in expected_words:
        # Check if this word appears in the transcribed words (exact match)
        is_correct = expected_word in transcribed_words
        evaluations.append(WordEvaluation(word=expected_word, correct=is_correct))
    
    return evaluations


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"message": "SpeakWell API is running", "status": "healthy"}


@app.get("/phrases", response_model=List[Phrase])
async def get_phrases():
    """Get all available Portuguese phrases."""
    return PORTUGUESE_PHRASES


@app.get("/phrases/{phrase_id}", response_model=Phrase)
async def get_phrase(phrase_id: int):
    """Get a specific phrase by ID."""
    for phrase in PORTUGUESE_PHRASES:
        if phrase["id"] == phrase_id:
            return phrase
    raise HTTPException(status_code=404, detail="Phrase not found")


@app.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    audio: UploadFile = File(..., description="Audio file containing Portuguese speech"),
    expected_phrase: str = Form(..., description="The expected Portuguese phrase to compare against")
):
    """
    Transcribe audio using ElevenLabs Speech-to-Text and evaluate pronunciation.
    
    - **audio**: Audio file (webm, mp3, wav, etc.)
    - **expected_phrase**: The expected Portuguese phrase for comparison
    
    Returns word-level evaluation showing which words were pronounced correctly.
    """
    try:
        # Read audio file content
        audio_content = await audio.read()
        audio_data = BytesIO(audio_content)
        
        # Transcribe using ElevenLabs
        # Using scribe_v1 model which supports Portuguese
        transcription = elevenlabs.speech_to_text.convert(
            file=audio_data,
            model_id="scribe_v1",  # Using scribe_v1 for Portuguese support
            tag_audio_events=False,
            language_code="por",  # Portuguese language code
        )
        
        transcribed_text = transcription.text if hasattr(transcription, 'text') else str(transcription)
        
        # Evaluate word-by-word
        word_evaluations = evaluate_words(transcribed_text, expected_phrase)
        
        # Calculate overall score
        correct_count = sum(1 for eval in word_evaluations if eval.correct)
        total_count = len(word_evaluations)
        overall_score = (correct_count / total_count * 100) if total_count > 0 else 0
        all_correct = correct_count == total_count
        
        return TranscriptionResponse(
            transcribed_text=transcribed_text,
            expected_phrase=expected_phrase,
            word_evaluations=word_evaluations,
            overall_score=round(overall_score, 1),
            all_correct=all_correct
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
