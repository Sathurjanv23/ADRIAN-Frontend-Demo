'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { PermissionStatus } from '@/types';
import { toast } from 'sonner';

export interface CameraCaptureState {
  isOpen: boolean;
  isStreaming: boolean;
  facingMode: 'environment' | 'user';
  hasMultipleCameras: boolean;
  photoBlob: Blob | null;
  photoFile: File | null;
  photoUrl: string | null;
  permissionStatus: PermissionStatus;
  error: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  openCamera: () => Promise<void>;
  closeCamera: () => void;
  switchCamera: () => Promise<void>;
  capturePhoto: () => void;
  retakePhoto: () => void;
  removePhoto: () => void;
  handleFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function useCameraCapture(): CameraCaptureState {
  const [isOpen, setIsOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check available video devices
  const checkCameraDevices = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setHasMultipleCameras(videoInputs.length > 1);
    } catch {
      // ignore
    }
  }, []);

  // Stop video media tracks
  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  // Revoke previous photo URL
  const cleanupPhotoUrl = useCallback(() => {
    if (photoUrl) {
      URL.revokeObjectURL(photoUrl);
      setPhotoUrl(null);
    }
  }, [photoUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracks();
      if (photoUrl) {
        URL.revokeObjectURL(photoUrl);
      }
    };
  }, [stopTracks, photoUrl]);

  const startStream = async (mode: 'environment' | 'user') => {
    setError(null);
    if (typeof window === 'undefined') return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const err = 'Camera is not supported on this browser or requires HTTPS.';
      setError(err);
      setPermissionStatus('unavailable');
      toast.error('Camera unavailable', { description: err });
      return;
    }

    try {
      setPermissionStatus('requesting');
      stopTracks();

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setPermissionStatus('granted');
      setIsStreaming(true);
      await checkCameraDevices();

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      stopTracks();
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionStatus('denied');
        const msg = 'Camera permission was denied. Please allow camera access in your browser settings.';
        setError(msg);
        toast.error('Camera Permission Denied', { description: msg });
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermissionStatus('unavailable');
        const msg = 'No camera device found on this system.';
        setError(msg);
        toast.error('No Camera Found', { description: msg });
      } else {
        const msg = err.message || 'Failed to start camera preview.';
        setError(msg);
        toast.error('Camera Error', { description: msg });
      }
    }
  };

  const openCamera = async () => {
    setIsOpen(true);
    await startStream(facingMode);
  };

  const closeCamera = () => {
    stopTracks();
    setIsOpen(false);
  };

  const switchCamera = async () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    await startStream(nextMode);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !isStreaming) {
      toast.error('Camera stream not ready to capture photo.');
      return;
    }

    try {
      const video = videoRef.current;
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Handle front camera mirror effect if needed
      if (facingMode === 'user') {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            toast.error('Failed to generate image from camera.');
            return;
          }
          cleanupPhotoUrl();
          const file = new File([blob], `emergency-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          const url = URL.createObjectURL(blob);

          setPhotoBlob(blob);
          setPhotoFile(file);
          setPhotoUrl(url);
          closeCamera();

          toast.success('Photo captured successfully', {
            description: 'Emergency photo evidence attached.',
          });
        },
        'image/jpeg',
        0.92
      );
    } catch (err: any) {
      toast.error('Failed to capture photo frame', { description: err.message });
    }
  };

  const retakePhoto = async () => {
    cleanupPhotoUrl();
    setPhotoBlob(null);
    setPhotoFile(null);
    await openCamera();
  };

  const removePhoto = () => {
    cleanupPhotoUrl();
    setPhotoBlob(null);
    setPhotoFile(null);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPEG, PNG, WEBP).');
      return;
    }

    cleanupPhotoUrl();
    const url = URL.createObjectURL(file);
    setPhotoBlob(file);
    setPhotoFile(file);
    setPhotoUrl(url);

    toast.success('Photo uploaded successfully', {
      description: file.name,
    });
  };

  return {
    isOpen,
    isStreaming,
    facingMode,
    hasMultipleCameras,
    photoBlob,
    photoFile,
    photoUrl,
    permissionStatus,
    error,
    videoRef,
    openCamera,
    closeCamera,
    switchCamera,
    capturePhoto,
    retakePhoto,
    removePhoto,
    handleFileInput,
  };
}
