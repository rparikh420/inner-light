import { useCallback, useRef, useState } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

interface StartOptions {
  continuous?: boolean;
  interimResults?: boolean;
  /** Vocabulary-bias hints (e.g. names) that the recognizer should listen for. */
  contextualStrings?: string[];
}

export function useSpeechToText() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  // increments on every final result, even if the spoken text repeats —
  // lets consumers detect "a new utterance arrived" without relying on
  // the text itself changing (React bails on identical-string state updates)
  const [resultSeq, setResultSeq] = useState(0);

  // Browsers sometimes swallow the mic-permission prompt (or block it
  // entirely) without ever emitting a 'start' or 'error' event — the
  // recognizer just sits there silently. This watchdog catches that case
  // and surfaces something actionable instead of a dead button.
  const startWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Same idea in reverse: some browsers leave the recognizer hanging after
  // stop() is called (e.g. mid-request to the cloud recognition service) and
  // never emit 'end' — without this, the button would stay stuck on
  // "listening…" forever. abort() is a harder kill than stop().
  const stopWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearStartWatchdog = useCallback(() => {
    if (startWatchdogRef.current != null) {
      clearTimeout(startWatchdogRef.current);
      startWatchdogRef.current = null;
    }
  }, []);

  const clearStopWatchdog = useCallback(() => {
    if (stopWatchdogRef.current != null) {
      clearTimeout(stopWatchdogRef.current);
      stopWatchdogRef.current = null;
    }
  }, []);

  useSpeechRecognitionEvent('start', () => {
    clearStartWatchdog();
    setIsListening(true);
    setError(null);
  });

  useSpeechRecognitionEvent('end', () => {
    clearStartWatchdog();
    clearStopWatchdog();
    setIsListening(false);
    setInterimTranscript('');
  });

  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript ?? '';
    if (event.isFinal) {
      setTranscript(text);
      setInterimTranscript('');
      setResultSeq((seq) => seq + 1);
    } else {
      setInterimTranscript(text);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    clearStartWatchdog();
    clearStopWatchdog();
    if (event.error === 'no-speech' || event.error === 'aborted') {
      setIsListening(false);
      return;
    }
    setError(event.message || event.error);
    setIsListening(false);
  });

  const start = useCallback(async (options?: StartOptions) => {
    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
      setError('speech recognition is not available in this browser. try Chrome or Safari.');
      return false;
    }

    const granted = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted.granted) {
      setError('microphone access was not granted');
      return false;
    }

    setTranscript('');
    setInterimTranscript('');
    setError(null);

    try {
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        continuous: false,
        ...options,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'could not start speech recognition');
      return false;
    }

    clearStartWatchdog();
    startWatchdogRef.current = setTimeout(() => {
      startWatchdogRef.current = null;
      setIsListening((listening) => {
        if (!listening) {
          ExpoSpeechRecognitionModule.stop();
          setError('the browser never started listening — check that this site has microphone permission (look for a mic icon in the address bar) and try again.');
        }
        return listening;
      });
    }, 6000);

    return true;
  }, [clearStartWatchdog]);

  const stop = useCallback(() => {
    clearStartWatchdog();
    ExpoSpeechRecognitionModule.stop();

    clearStopWatchdog();
    stopWatchdogRef.current = setTimeout(() => {
      stopWatchdogRef.current = null;
      setIsListening((listening) => {
        if (listening) {
          ExpoSpeechRecognitionModule.abort();
          setInterimTranscript('');
        }
        return false;
      });
    }, 3000);
  }, [clearStartWatchdog, clearStopWatchdog]);

  const reset = useCallback(() => {
    clearStartWatchdog();
    clearStopWatchdog();
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    setResultSeq(0);
  }, [clearStartWatchdog, clearStopWatchdog]);

  return {
    isListening,
    transcript,
    interimTranscript,
    resultSeq,
    error,
    start,
    stop,
    reset,
  };
}
