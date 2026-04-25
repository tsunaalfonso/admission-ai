import { useEffect, useState, useRef, useCallback } from "react";

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList {
  length: number;
  [i: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  [i: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: Event) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export const useSpeechRecognition = (lang = "en-US") => {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionInstance | null>(null);
  const finalRef = useRef("");

  useEffect(() => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) {
      setSupported(false);
      return;
    }
    setSupported(true);
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const text = res[0].transcript;
        if (res.isFinal) {
          finalRef.current += text + " ";
        } else {
          interimText += text;
        }
      }
      setTranscript(finalRef.current);
      setInterim(interimText);
    };
    rec.onerror = (e) => {
      const err = (e as unknown as { error?: string }).error || "speech_error";
      setError(err);
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
    };
    recRef.current = rec;
    return () => {
      try { rec.abort(); } catch { /* ignore */ }
    };
  }, [lang]);

  const start = useCallback(() => {
    setError(null);
    if (!recRef.current) return;
    try {
      recRef.current.start();
      setListening(true);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const stop = useCallback(() => {
    if (!recRef.current) return;
    try { recRef.current.stop(); } catch { /* ignore */ }
    setListening(false);
  }, []);

  const reset = useCallback(() => {
    finalRef.current = "";
    setTranscript("");
    setInterim("");
    setError(null);
  }, []);

  return { supported, listening, transcript, interim, error, start, stop, reset };
};
