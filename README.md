# Speak Well

Speak Well is a Portuguese pronunciation learning app. Learners listen, speak, and receive feedback by comparing their spoken phrase to the expected phrase. The app uses the ElevenLabs Speech-to-Text API to transcribe microphone input in Portuguese and highlights which words were spoken correctly.

## Features

- Category-based Portuguese practice phrases (10+ categories)
- Audio recording in the browser
- Word-by-word feedback and retry flow
- FastAPI backend with ElevenLabs Speech-to-Text integration

## Tech Stack

- Frontend: Preact + Vite
- Backend: FastAPI (Python)
- Speech-to-Text: ElevenLabs API

## Setup

### 1) Backend

1. Ensure the ElevenLabs API key is set in backend/.env:

   ELEVENLABS_API_KEY=your_key_here

2. Create the Python virtual environment (already configured as .venv):

   python3 -m venv .venv

3. Install dependencies:

   source .venv/bin/activate
   pip install -r backend/requirements.txt

4. Start the API server:

   cd backend
   source ../.venv/bin/activate
   uvicorn main:app --reload --port 8000

The API will be available at http://localhost:8000.

### 2) Frontend

Install Node dependencies and run the development server:

- Install: npm install
- Run: npm run dev

The frontend will be available at http://localhost:5173.

## How it works

1. The frontend records audio and sends it to the backend.
2. The backend calls ElevenLabs Speech-to-Text to transcribe the Portuguese speech.
3. The backend compares the transcription to the expected phrase and returns word-level correctness.
4. The frontend highlights correct and incorrect words and allows retrying.

## Project Structure

- backend/ — FastAPI server, ElevenLabs integration, phrase JSON files
- src/ — Preact frontend
- test_scripts/ — backend test scripts

## Notes

- The backend reads phrases from JSON files in backend/data.
- CORS is enabled for local frontend development.
