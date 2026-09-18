'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { PermissionStatus } from '@/types';
import { toast } from 'sonner';

export interface AudioRecorderState {
  isRecording: boolean;
  recordingTime: number;
  formattedTime: string;
  audioBlob: Blob | null;
  audioFile: File | null;
  audioUrl: string | null;
  permissionStatus: PermissionStatus;
  transcript: string;
  isTranscribing: boolean;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetRecording: () => void;
}

export function useAudioRecorder(): AudioRecorderState {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  // Format elapsed time as mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Cleanup active audio tracks
  const stopMediaTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Revoke object URL to prevent memory leaks
  const cleanupAudioUrl = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  }, [audioUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMediaTracks();
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [stopMediaTracks, audioUrl]);

  // Determine best supported MIME type
  const getSupportedMimeType = (): string => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/aac',
    ];
    for (const type of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return '';
  };

  const startRecording = async () => {
    setError(null);
    cleanupAudioUrl();
    setAudioBlob(null);
    setAudioFile(null);
    setTranscript('');

    if (typeof window === 'undefined') return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const err = 'Audio recording is not supported in this browser or requires HTTPS.';
      setError(err);
      setPermissionStatus('unavailable');
      toast.error('Microphone unavailable', { description: err });
      return;
    }

    try {
      setPermissionStatus('requesting');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setPermissionStatus('granted');

      const mimeType = getSupportedMimeType();
      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalType = mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: finalType });
        const ext = finalType.includes('mp4') ? 'mp4' : finalType.includes('ogg') ? 'ogg' : 'webm';
        const file = new File([blob], `emergency-audio-${Date.now()}.${ext}`, { type: finalType });
        const url = URL.createObjectURL(blob);

        setAudioBlob(blob);
        setAudioFile(file);
        setAudioUrl(url);
        setIsRecording(false);
        stopMediaTracks();

        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        toast.success('Audio recorded successfully', {
          description: `${formatTime(recordingTime)} audio evidence attached.`,
        });
      };

      // Optional browser speech recognition for instant live transcription
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        try {
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event: any) => {
            let currentText = '';
            for (let i = 0; i < event.results.length; ++i) {
              currentText += event.results[i][0].transcript;
            }
            if (currentText.trim()) {
              setTranscript(currentText.trim());
            }
          };

          recognition.onerror = () => {
            // non-fatal, fallback to raw audio
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch {
          // speech recognition optional
        }
      }

      mediaRecorder.start(200); // 200ms slice for responsive chunks
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (err: any) {
      stopMediaTracks();
      setIsRecording(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionStatus('denied');
        const msg = 'Microphone permission was denied. Please allow microphone access in your browser site settings.';
        setError(msg);
        toast.error('Microphone Permission Denied', { description: msg });
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermissionStatus('unavailable');
        const msg = 'No microphone device found on this system.';
        setError(msg);
        toast.error('No Microphone Found', { description: msg });
      } else {
        const msg = err.message || 'Failed to start microphone recording.';
        setError(msg);
        toast.error('Recording Failed', { description: msg });
      }
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const resetRecording = () => {
    stopRecording();
    stopMediaTracks();
    cleanupAudioUrl();
    setAudioBlob(null);
    setAudioFile(null);
    setRecordingTime(0);
    setTranscript('');
    setError(null);
  };

  return {
    isRecording,
    recordingTime,
    formattedTime: formatTime(recordingTime),
    audioBlob,
    audioFile,
    audioUrl,
    permissionStatus,
    transcript,
    isTranscribing,
    error,
    startRecording,
    stopRecording,
    resetRecording,
  };
}
