import { useState, useRef, useCallback, useEffect } from 'preact/hooks'
import { Link, useSearchParams } from 'react-router-dom'
import './Exercise.css'

const API_BASE_URL = 'http://localhost:8000'

interface Phrase {
  id: number
  phrase: string
  translation: string
}

interface Category {
  id: string
  name: string
  description: string
  icon?: string
}

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
  const [searchParams] = useSearchParams()
  const categoryId = searchParams.get('category') || 'greetings'

  const [phrases, setPhrases] = useState<Phrase[]>([])
  const [categoryName, setCategoryName] = useState('')
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingPhraseRef = useRef<string>('')

  useEffect(() => {
    const fetchCategoryAndPhrases = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [categoriesResponse, phrasesResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/categories`),
          fetch(`${API_BASE_URL}/categories/${categoryId}/phrases`),
        ])

        if (!categoriesResponse.ok) {
          throw new Error('Failed to load categories')
        }

        if (!phrasesResponse.ok) {
          throw new Error('Failed to load phrases')
        }

        const categories: Category[] = await categoriesResponse.json()
        const phrasesData: Phrase[] = await phrasesResponse.json()

        const selectedCategory = categories.find((category) => category.id === categoryId)
        setCategoryName(selectedCategory?.name ?? '')
        setPhrases(phrasesData)
        setCurrentPhraseIndex(0)
        setEvaluation(null)
      } catch (err) {
        setError('Failed to load phrases. Please try again.')
        setPhrases([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategoryAndPhrases()
  }, [categoryId])

  const currentPhrase = phrases[currentPhraseIndex]

  const sendAudioForEvaluation = async (audioBlob: Blob, expectedPhrase: string) => {
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      formData.append('expected_phrase', expectedPhrase)
      formData.append('category', categoryId)

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

  const startRecording = useCallback(async () => {
    try {
      // Store the current phrase at the moment recording starts
      recordingPhraseRef.current = currentPhrase?.phrase ?? ''

      if (!recordingPhraseRef.current) {
        setError('No phrase available to record.')
        return
      }
      
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
        // Use the phrase that was recorded, not the current one
        await sendAudioForEvaluation(audioBlob, recordingPhraseRef.current)
        
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
  }, [currentPhrase?.phrase, categoryId])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsEvaluating(true)
    }
  }, [isRecording])

  const handleRecord = () => {
    if (!currentPhrase) return
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
    if (currentPhraseIndex < phrases.length - 1) {
      setCurrentPhraseIndex(currentPhraseIndex + 1)
      setEvaluation(null)
      setError(null)
      setIsRecording(false)
      // Stop any ongoing recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
  }

  const handlePrevious = () => {
    if (currentPhraseIndex > 0) {
      setCurrentPhraseIndex(currentPhraseIndex - 1)
      setEvaluation(null)
      setError(null)
      setIsRecording(false)
      // Stop any ongoing recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
  }

  if (isLoading) {
    return (
      <div className="exercise-container">
        <div className="loading">Loading phrases...</div>
      </div>
    )
  }

  if (error && phrases.length === 0) {
    return (
      <div className="exercise-container">
        <div className="evaluation-result error">{error}</div>
        <Link to="/" className="back-link">← Back to Home</Link>
      </div>
    )
  }

  return (
    <div className="exercise-container">
      <header className="exercise-header">
        <Link to="/" className="back-link">← Back to Home</Link>
        {categoryName && (
          <div className="category-badge">{categoryName}</div>
        )}
        <div className="progress">
          Phrase {currentPhraseIndex + 1} of {phrases.length}
        </div>
      </header>

      <main className="exercise-main">
        <div className="phrase-card">
          <div className="phrase-section">
            <span className="language-label">Portuguese</span>
            <h2 className="phrase-text">{currentPhrase?.phrase}</h2>
          </div>
          
          <div className="translation-section">
            <span className="language-label">English</span>
            <p className="translation-text">{currentPhrase?.translation}</p>
          </div>
        </div>

        <div className="recording-section">
          <button
            className={`record-button ${isRecording ? 'recording' : ''}`}
            onClick={handleRecord}
            disabled={isEvaluating || !currentPhrase}
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
            disabled={currentPhraseIndex === phrases.length - 1}
          >
            Next →
          </button>
        </div>
      </main>
    </div>
  )
}
