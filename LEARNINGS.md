# SpeakWell Project Learnings

## Backend Development with FastAPI and ElevenLabs

### Project Structure
- Backend code goes in `/backend` folder
- Virtual environment `.venv` is used for Python dependencies
- Environment variables loaded from `.env` file using `python-dotenv`

### ElevenLabs Speech-to-Text Integration

#### API Usage
```python
from elevenlabs.client import ElevenLabs
from io import BytesIO

# Initialize client with API key
elevenlabs = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))

# Transcribe audio
audio_data = BytesIO(audio_bytes)
transcription = elevenlabs.speech_to_text.convert(
    file=audio_data,
    model_id="scribe_v1",  # Use scribe_v1 for Portuguese
    tag_audio_events=False,
    language_code="por",  # Portuguese language code
    diarize=False,
)

transcribed_text = transcription.text
```

#### Key Points
- ElevenLabs SDK provides a simple Python client
- `scribe_v1` model supports Portuguese transcription
- Language code "por" specifies Portuguese
- Audio is passed as a file-like object (BytesIO)

### FastAPI File Upload Handling

```python
from fastapi import FastAPI, File, UploadFile, Form

@app.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    expected_phrase: str = Form(...)
):
    audio_content = await audio.read()
    # Process audio...
```

### CORS Configuration
Frontend (Vite) runs on port 5173, backend on 8000. CORS must be enabled:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Frontend Audio Recording

Using MediaRecorder API to capture microphone input:

```typescript
const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })

mediaRecorder.ondataavailable = (event) => {
  if (event.data.size > 0) {
    audioChunks.push(event.data)
  }
}

mediaRecorder.onstop = () => {
  const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
  // Send to backend...
}
```

### Word-Level Evaluation Logic

Simple word matching approach:
1. Normalize both texts (lowercase, remove punctuation)
2. Split into words
3. Check if each expected word exists in transcribed words
4. Return per-word correctness status

### Testing Strategy
- Created test script in `test_scripts/test_backend.py`
- Tests health endpoint, phrases endpoints
- Can test transcription with real audio file using `--with-audio` flag

### Running the Application

1. Start backend:
   ```bash
   cd backend
   source ../.venv/bin/activate
   uvicorn main:app --reload --port 8000
   ```

2. Start frontend (in another terminal):
   ```bash
   npm run dev
   ```

3. Run tests:
   ```bash
   source .venv/bin/activate
   python test_scripts/test_backend.py
   ```
