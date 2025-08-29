'use client';

import { useState, useEffect } from 'react';
import { X, Download, Smartphone, Monitor } from 'lucide-react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if app is already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Don't show if already installed
    if (standalone) {
      return;
    }

    // Handle the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Check if user has already dismissed the prompt
      const promptDismissed = localStorage.getItem('pwa-install-dismissed');
      const lastDismissed = localStorage.getItem('pwa-install-last-dismissed');
      
      // Show prompt again after 30 days if previously dismissed
      if (!promptDismissed || (lastDismissed && Date.now() - parseInt(lastDismissed) > 30 * 24 * 60 * 60 * 1000)) {
        // Delay showing prompt for better UX (10 seconds)
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 10000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show iOS install instructions if on iOS and not standalone
    if (iOS && !standalone) {
      const promptDismissed = localStorage.getItem('pwa-install-dismissed-ios');
      const lastDismissed = localStorage.getItem('pwa-install-last-dismissed-ios');
      
      if (!promptDismissed || (lastDismissed && Date.now() - parseInt(lastDismissed) > 30 * 24 * 60 * 60 * 1000)) {
        // Delay showing prompt for better UX (15 seconds on iOS)
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 15000);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    if (isIOS) {
      localStorage.setItem('pwa-install-dismissed-ios', 'true');
      localStorage.setItem('pwa-install-last-dismissed-ios', Date.now().toString());
    } else {
      localStorage.setItem('pwa-install-dismissed', 'true');
      localStorage.setItem('pwa-install-last-dismissed', Date.now().toString());
    }
  };

  // Don't show if already installed or dismissed recently
  if (isStandalone || !showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 pwa-prompt">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                {isIOS ? (
                  <Smartphone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Download className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Install Fixel App
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isIOS 
                  ? 'Add to your home screen for the best experience'
                  : 'Install our app for faster access and offline use'
                }
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isIOS ? (
          <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
            <p className="mb-2">To install this app:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Tap the share button</li>
              <li>Select "Add to Home Screen"</li>
              <li>Tap "Add"</li>
            </ol>
          </div>
        ) : (
          <div className="mt-3 flex space-x-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 px-3 rounded-md transition-colors duration-200"
            >
              Install App
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-400"
            >
              Not now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
