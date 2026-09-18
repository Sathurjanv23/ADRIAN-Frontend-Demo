'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Camera, XCircle, SwitchCamera, Upload } from 'lucide-react';
import type { CameraCaptureState } from '@/hooks/useCameraCapture';

interface LazyCameraModalProps {
  camera: CameraCaptureState;
}

export default function LazyCameraModal({ camera }: LazyCameraModalProps) {
  if (!camera.isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="em-card border border-em-border w-full max-w-lg rounded-3xl p-5 shadow-2xl space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-nova-text">Live Camera Evidence Capture</h3>
            </div>
            <button
              type="button"
              onClick={camera.closeCamera}
              className="p-1.5 rounded-lg text-em-text-muted hover:text-nova-text hover:bg-em-subtle"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {/* Live Video Feed with Grid Overlay */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-em-border flex items-center justify-center">
            <video
              ref={camera.videoRef as any}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Viewfinder crosshairs */}
            <div className="absolute inset-0 pointer-events-none border border-white/10 grid grid-cols-3 grid-rows-3" />
            <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/60 backdrop-blur-md text-[10px] font-mono text-white/80">
              MODE: {camera.facingMode.toUpperCase()}
            </div>
          </div>

          {/* Camera Controls */}
          <div className="flex items-center justify-between gap-3 pt-2">
            {camera.hasMultipleCameras ? (
              <button
                type="button"
                onClick={camera.switchCamera}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-em-border text-xs font-semibold text-nova-text hover:bg-em-subtle"
              >
                <SwitchCamera className="w-4 h-4 text-purple-400" /> Switch
              </button>
            ) : (
              <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-em-border text-xs font-semibold text-nova-text hover:bg-em-subtle cursor-pointer">
                <Upload className="w-4 h-4 text-er-blue" /> Upload File
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    camera.handleFileInput(e);
                    camera.closeCamera();
                  }}
                  className="hidden"
                />
              </label>
            )}

            <motion.button
              type="button"
              onClick={camera.capturePhoto}
              className="flex-1 py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg text-sm"
              whileTap={{ scale: 0.96 }}
            >
              <Camera className="w-4 h-4" /> Capture Photo
            </motion.button>

            <button
              type="button"
              onClick={camera.closeCamera}
              className="px-4 py-3 rounded-xl border border-em-border text-em-text-dim text-xs font-semibold hover:text-nova-text"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
