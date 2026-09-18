'use client';

import { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'adrian_install_prompt_dismissed';

/**
 * InstallPrompt — Listens for the browser's `beforeinstallprompt` event
 * and shows a small branded banner inviting the user to install ADRIAN
 * as a home-screen app. Mounted once in the root layout.
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (isStandalone || dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, '1');
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[60] mx-auto max-w-md rounded-2xl border border-em-border bg-em-white shadow-lg px-4 py-3.5 flex items-center gap-3 sm:left-auto sm:right-4">
      <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-er-red-light flex items-center justify-center">
        <Download className="h-5 w-5 text-er-red" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-em-text leading-tight">Install ADRIAN</p>
        <p className="text-xs text-em-text-muted leading-tight mt-0.5">
          Add to your home screen for quick, offline-ready access.
        </p>
      </div>
      <button
        onClick={install}
        className="flex-shrink-0 rounded-lg bg-er-red px-3 py-1.5 text-xs font-semibold text-white hover:bg-er-red-dark transition-colors"
      >
        Install
      </button>
      <button
        onClick={dismiss}
        aria-label="Dismiss install prompt"
        className="flex-shrink-0 text-em-text-muted hover:text-em-text transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
