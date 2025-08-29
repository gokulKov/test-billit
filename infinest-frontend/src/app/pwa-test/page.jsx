'use client';

import { useState, useEffect } from 'react';

export default function PWATestPage() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState('checking...');

  useEffect(() => {
    // Check if running in standalone mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Check service worker status
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setServiceWorkerStatus('active');
      }).catch(() => {
        setServiceWorkerStatus('failed');
      });
    } else {
      setServiceWorkerStatus('not supported');
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setCanInstall(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Fixel PWA Demo
          </h1>
          <p className="text-xl text-blue-200">
            Progressive Web App Installation Test
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* PWA Status */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-semibold text-white mb-4">PWA Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-blue-200">Running as PWA:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isStandalone ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {isStandalone ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-200">Service Worker:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  serviceWorkerStatus === 'active' ? 'bg-green-500 text-white' : 
                  serviceWorkerStatus === 'failed' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'
                }`}>
                  {serviceWorkerStatus}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-200">Can Install:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  canInstall ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                }`}>
                  {canInstall ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Installation Instructions */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-semibold text-white mb-4">Installation</h2>
            {canInstall ? (
              <div>
                <p className="text-blue-200 mb-4">
                  Your browser supports PWA installation!
                </p>
                <button 
                  onClick={handleInstall}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  Install App
                </button>
              </div>
            ) : isStandalone ? (
              <div>
                <p className="text-green-200 mb-4">
                  ✅ App is already installed and running!
                </p>
              </div>
            ) : (
              <div>
                <p className="text-blue-200 mb-4">
                  To test PWA installation:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-200">
                  <li>Open this page in Chrome/Edge</li>
                  <li>Look for install icon in address bar</li>
                  <li>Or use "Install app" from browser menu</li>
                </ol>
              </div>
            )}
          </div>

          {/* PWA Features */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 md:col-span-2">
            <h2 className="text-2xl font-semibold text-white mb-4">PWA Features</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Mobile-First</h3>
                <p className="text-sm text-blue-200">Optimized for mobile devices with native app feel</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Offline Ready</h3>
                <p className="text-sm text-blue-200">Works without internet connection</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Fast Loading</h3>
                <p className="text-sm text-blue-200">Instant loading with service worker caching</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <a 
            href="/"
            className="inline-flex items-center px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
          >
            ← Back to Main App
          </a>
        </div>
      </div>
    </div>
  );
}
