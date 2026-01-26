/**
 * VoiceInput Component
 *
 * A microphone button that records speech and converts it to text.
 *
 * States:
 * - idle: Not recording, showing mic button
 * - listening: Actively recording, showing pulsing animation
 * - processing: Got final result, stopping
 *
 * User flow:
 * 1. User clicks mic button
 * 2. Browser asks for permission
 * 3. Mic button turns red and pulses (visual feedback)
 * 4. User speaks ("Chicken sandwich with lettuce")
 * 5. Text appears in real-time
 * 6. User clicks stop or pauses speaking
 * 7. Recording stops, text stays in field
 */

import { useState } from 'react'
import {
  isSpeechRecognitionSupported,
  startSpeechRecognition,
} from '../../services/speech'

interface VoiceInputProps {
  /** Callback when transcript is received */
  onTranscript: (text: string, isFinal: boolean) => void
  /** Optional CSS class */
  className?: string
}

export default function VoiceInput({ onTranscript, className = '' }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [stopRecognition, setStopRecognition] = useState<(() => void) | null>(null)

  // Check browser support
  const isSupported = isSpeechRecognitionSupported()

  /**
   * Start voice recording
   */
  const handleStart = () => {
    const stop = startSpeechRecognition({
      onResult: (transcript, isFinal) => {
        onTranscript(transcript, isFinal)
      },
      onEnd: () => {
        setIsListening(false)
        setStopRecognition(null)
      },
      onError: (error) => {
        alert(error)
        setIsListening(false)
        setStopRecognition(null)
      },
    })

    setIsListening(true)
    setStopRecognition(() => stop)
  }

  /**
   * Stop voice recording
   */
  const handleStop = () => {
    if (stopRecognition) {
      stopRecognition()
    }
  }

  // If not supported, show nothing (we'll show message in AddMealPage)
  if (!isSupported) {
    return null
  }

  return (
    <button
      type="button"
      onClick={isListening ? handleStop : handleStart}
      className={`voice-button ${isListening ? 'listening' : ''} ${className}`}
      aria-label={isListening ? 'Stop recording' : 'Start recording'}
    >
      {isListening ? '⏹' : '🎤'}
      {isListening && <span className="listening-text">Listening...</span>}

      <style>{`
        .voice-button {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-md);
          background-color: var(--color-primary);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-size: 24px;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
          justify-content: center;
        }

        .voice-button:hover {
          background-color: var(--color-primary-dark);
          transform: translateY(-1px);
        }

        .voice-button.listening {
          background-color: var(--color-danger);
          animation: pulse 1.5s ease-in-out infinite;
        }

        .voice-button.listening:hover {
          background-color: var(--color-danger-dark);
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
          }
        }

        .listening-text {
          font-size: 14px;
          font-weight: 600;
        }
      `}</style>
    </button>
  )
}
