import { useState, useRef, useCallback } from 'preact/hooks'
import { Link } from 'react-router-dom'
import './Exercise.css'

const API_BASE_URL = 'http://localhost:8000'

const portuguesePhrases = [
  { id: 1, phrase: 'Olá, como vai?', translation: 'Hello, how are you?' },
  { id: 2, phrase: 'Bom dia', translation: 'Good morning' },
  { id: 3, phrase: 'Obrigado', translation: 'Thank you' },
  { id: 4, phrase: 'Por favor', translation: 'Please' },
  { id: 5, phrase: 'Como se chama?', translation: 'What is your name?' },
  { id: 6, phrase: 'Muito prazer', translation: 'Nice to meet you' },
  { id: 7, phrase: 'Até logo', translation: 'See you later' },
  { id: 8, phrase: 'Boa noite', translation: 'Good night' },
  { id: 9, phrase: 'Eu não entendo', translation: 'I don\'t understand' },
  { id: 10, phrase: 'Você fala inglês?', translation: 'Do you speak English?' },
]

interface WordEvaluation {
  word: string
  correct: boolean
}

interface EvaluationResult {
  transcribed_text: string
  expected_phrase: string
  word_evaluations: WordEvaluation[]
  overall_score: number
  all_correct: boolean
}

export function Exercise() {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const currentPhrase = portuguesePhrases[currentPhraseIndex]

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      
      audioChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await sendAudioForEvaluation(audioBlob)
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
      setError(null)
    } catch (err) {
      setError('Could not access microphone. Please allow microphone permissions.')
      console.error('Error accessing microphone:', err)
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsEvaluating(true)
    }
  }, [isRecording])

  const sendAudioForEvaluation = async (audioBlob: Blob) => {
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      formData.append('expected_phrase', currentPhrase.phrase)

      const response = await fetch(`${API_BASE_URL}/transcribe`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: EvaluationResult = await response.json()
      setEvaluation(result)
    } catch (err) {
      setError('Failed to evaluate pronunciation. Please try again.')
      console.error('Error sending audio:', err)
    } finally {
      setIsEvaluating(false)
    }
  }

  const handleRecord = () => {
    if (isRecording) {
      stopRecording()
    } else {
      setEvaluation(null)
      startRecording()
    }
  }

  const handleRetry = () => {
    setEvaluation(null)
    setError(null)
  }

  const handleNext = () => {
    if (currentPhraseIndex < portuguesePhrases.length - 1) {
      setCurrentPhraseIndex(currentPhraseIndex + 1)
      setEvaluation(null)
      setError(null)
      setIsRecording(false)
    }
  }

  const handlePrevious = () => {
    if (currentPhraseIndex > 0) {
      setCurrentPhraseIndex(currentPhraseIndex - 1)
      setEvaluation(null)
      setError(null)
      setIsRecording(false)
    }
  }

  return (
    <div className="exercise-container">
      <header className="exercise-header">
        <Link to="/" className="back-link">← Back to Home</Link>
        <div className="progress">
          Phrase {currentPhraseIndex + 1} of {portuguesePhrases.length}
        </div>
      </header>

      <main className="exercise-main">
        <div className="phrase-card">
          <div className="phrase-section">
            <span className="language-label">Portuguese</span>
            <h2 className="phrase-text">{currentPhrase.phrase}</h2>
          </div>
          
          <div className="translation-section">
            <span className="language-label">English</span>
            <p className="translation-text">{currentPhrase.translation}</p>
          </div>
        </div>

        <div className="recording-section">
          <button
            className={`record-button ${isRecording ? 'recording' : ''}`}
            onClick={handleRecord}
            disabled={isEvaluating}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="microphone-icon"
            >
              <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
            <span className="record-label">
              {isRecording ? 'Stop' : 'Record'}
            </span>
          </button>

          {isRecording && (
            <div className="recording-indicator">
              <span className="recording-dot"></span>
              Recording...
            </div>
          )}

          {isEvaluating && (
            <div className="evaluating-indicator">
              Evaluating your pronunciation...
            </div>
          )}

          {error && (
            <div className="evaluation-result error">
              {error}
            </div>
          )}

          {evaluation && (
            <div className={`evaluation-result ${evaluation.all_correct ? 'success' : 'partial'}`}>
              <div className="evaluation-header">
                {evaluation.all_correct 
                  ? '✓ Great job! Your pronunciation is correct.' 
                  : `⚠ You got ${evaluation.overall_score}% correct. Try again!`}
              </div>
              
              <div className="word-evaluation">
                <p className="evaluation-label">Your pronunciation:</p>
                <div className="words-container">
                  {evaluation.word_evaluations.map((wordEval, index) => (
                    <span 
                      key={index} 
                      className={`word ${wordEval.correct ? 'correct' : 'incorrect'}`}
                    >
                      {wordEval.word}
                    </span>
                  ))}
                </div>
              </div>

              <div className="transcribed-text">
                <p className="evaluation-label">We heard:</p>
                <p className="transcribed">"{evaluation.transcribed_text}"</p>
              </div>

              {!evaluation.all_correct && (
                <button className="retry-button" onClick={handleRetry}>
                  Try Again
                </button>
              )}
            </div>
          )}
        </div>

        <div className="navigation-buttons">
          <button
            className="nav-button"
            onClick={handlePrevious}
            disabled={currentPhraseIndex === 0}
          >
            ← Previous
          </button>
          <button
            className="nav-button"
            onClick={handleNext}
            disabled={currentPhraseIndex === portuguesePhrases.length - 1}
          >
            Next →
          </button>
        </div>
      </main>
    </div>
  )
}
