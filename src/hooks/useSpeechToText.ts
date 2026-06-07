import { useCallback, useState } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

interface StartOptions {
  continuous?: boolean;
  interimResults?: boolean;
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

  useSpeechRecognitionEvent('start', () => {
    setIsListening(true);
    setError(null);
  });

  useSpeechRecognitionEvent('end', () => {
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
    if (event.error === 'no-speech' || event.error === 'aborted') {
      setIsListening(false);
      return;
    }
    setError(event.message || event.error);
    setIsListening(false);
  });

  const start = useCallback(async (options?: StartOptions) => {
    const granted = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted.granted) {
      setError('microphone access was not granted');
      return false;
    }

    setTranscript('');
    setInterimTranscript('');
    setError(null);

    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: false,
      ...options,
    });
    return true;
  }, []);

  const stop = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    setResultSeq(0);
  }, []);

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
