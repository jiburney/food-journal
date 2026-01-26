/**
 * speech.ts - Web Speech API Service
 *
 * This service wraps the browser's Web Speech API for voice transcription.
 * The Web Speech API allows us to convert speech to text directly in the browser
 * without sending audio to a server - perfect for our local-first approach!
 *
 * Browser Support:
 * - Chrome/Edge: Full support (SpeechRecognition)
 * - Safari: Full support (requires webkit prefix: webkitSpeechRecognition)
 * - Firefox: Not supported (we'll show a fallback message)
 *
 * How it works:
 * 1. User clicks mic button
 * 2. Browser requests microphone permission
 * 3. User speaks into mic
 * 4. Browser sends audio to speech recognition service
 * 5. We get back transcribed text in real-time
 * 6. Text appears in the description field
 *
 * Technical notes:
 * - Results come in two forms: "interim" (partial, may change) and "final" (locked in)
 * - We use "continuous" mode to keep listening until user clicks stop
 * - Language is set to en-US but could be configurable
 */

/**
 * Check if the browser supports speech recognition
 *
 * Why we need this:
 * - Firefox doesn't support the API at all
 * - We need to check for both standard (SpeechRecognition) and
 *   webkit-prefixed (webkitSpeechRecognition) versions
 *
 * @returns true if speech recognition is available
 */
export function isSpeechRecognitionSupported(): boolean {
  return (
    'SpeechRecognition' in window ||
    'webkitSpeechRecognition' in window
  )
}

/**
 * Get the SpeechRecognition constructor
 *
 * Safari uses webkitSpeechRecognition instead of the standard SpeechRecognition.
 * This function handles both cases.
 *
 * TypeScript note: We need to cast to 'any' because TypeScript's lib.dom.d.ts
 * doesn't include webkitSpeechRecognition by default.
 *
 * @returns SpeechRecognition constructor or null if not supported
 */
function getSpeechRecognition() {
  if ('SpeechRecognition' in window) {
    return window.SpeechRecognition
  }
  if ('webkitSpeechRecognition' in window) {
    return (window as any).webkitSpeechRecognition
  }
  return null
}

/**
 * Callback types for speech recognition events
 */
export interface SpeechRecognitionCallbacks {
  /** Called when we get transcribed text (may be called multiple times) */
  onResult: (transcript: string, isFinal: boolean) => void
  /** Called when recognition stops (success or error) */
  onEnd: () => void
  /** Called if there's an error (permission denied, no speech, etc.) */
  onError: (error: string) => void
}

/**
 * Start speech recognition
 *
 * This function:
 * 1. Creates a new SpeechRecognition instance
 * 2. Configures it for continuous listening in English
 * 3. Sets up event handlers for results, errors, and ending
 * 4. Starts listening
 *
 * Usage example:
 * ```typescript
 * const stop = startSpeechRecognition({
 *   onResult: (text, isFinal) => {
 *     console.log(`Got text: ${text}, final: ${isFinal}`)
 *   },
 *   onEnd: () => console.log('Stopped'),
 *   onError: (err) => console.error(err)
 * })
 *
 * // Later, when user clicks stop button:
 * stop()
 * ```
 *
 * @param callbacks - Event handlers for recognition events
 * @returns Function to stop recognition
 */
export function startSpeechRecognition(
  callbacks: SpeechRecognitionCallbacks
): () => void {
  const SpeechRecognitionConstructor = getSpeechRecognition()

  if (!SpeechRecognitionConstructor) {
    callbacks.onError('Speech recognition not supported in this browser')
    return () => {} // Return no-op function
  }

  // Create recognition instance
  const recognition = new SpeechRecognitionConstructor()

  // Configuration
  recognition.continuous = true // Keep listening until we call stop()
  recognition.interimResults = true // Give us partial results as user speaks
  recognition.lang = 'en-US' // Language for recognition

  /**
   * Handle speech recognition results
   *
   * Results come as a list of alternatives, ordered by confidence.
   * We take the first (most confident) result.
   *
   * Each result can be "interim" (still processing) or "final" (done).
   * - Interim: User is still speaking, text may change
   * - Final: This segment is complete and won't change
   *
   * We concatenate all results to build the full transcript.
   */
  recognition.onresult = (event: any) => {
    let interimTranscript = ''
    let finalTranscript = ''

    // Loop through all results (there may be multiple)
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i]
      const transcript = result[0].transcript

      if (result.isFinal) {
        finalTranscript += transcript + ' '
      } else {
        interimTranscript += transcript
      }
    }

    // Call the callback with whichever transcript we have
    if (finalTranscript) {
      callbacks.onResult(finalTranscript.trim(), true)
    } else if (interimTranscript) {
      callbacks.onResult(interimTranscript.trim(), false)
    }
  }

  /**
   * Handle recognition ending
   *
   * This fires when:
   * - User clicks stop button (we called recognition.stop())
   * - Browser decides to stop (e.g., long silence)
   * - An error occurred
   */
  recognition.onend = () => {
    callbacks.onEnd()
  }

  /**
   * Handle errors
   *
   * Common errors:
   * - "not-allowed": User denied microphone permission
   * - "no-speech": Browser didn't hear anything
   * - "network": Network error (if using cloud service)
   * - "aborted": Recognition was aborted
   */
  recognition.onerror = (event: any) => {
    let errorMessage = 'Speech recognition error'

    switch (event.error) {
      case 'not-allowed':
        errorMessage = 'Microphone permission denied. Please allow microphone access.'
        break
      case 'no-speech':
        errorMessage = 'No speech detected. Please try again.'
        break
      case 'network':
        errorMessage = 'Network error. Please check your connection.'
        break
      case 'aborted':
        errorMessage = 'Speech recognition aborted.'
        break
      default:
        errorMessage = `Speech recognition error: ${event.error}`
    }

    callbacks.onError(errorMessage)
  }

  // Start listening!
  try {
    recognition.start()
  } catch (error) {
    callbacks.onError('Failed to start speech recognition')
    return () => {}
  }

  // Return a function to stop recognition
  return () => {
    try {
      recognition.stop()
    } catch (error) {
      // Ignore errors when stopping (may already be stopped)
    }
  }
}
