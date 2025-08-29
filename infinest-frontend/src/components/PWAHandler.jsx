'use client';

import { useEffect } from 'react';

const PWAHandler = () => {
  useEffect(() => {
    try {
      // Register service worker with better error handling
      if ('serviceWorker' in navigator) {
        // Use different service workers for dev vs production
        const swPath = process.env.NODE_ENV === 'development' ? '/sw-dev.js' : '/sw.js';
      
      navigator.serviceWorker.register(swPath)
        .then((registration) => {
          console.log('SW registered: ', registration);
          
          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available
                  if (confirm('New version available! Click OK to update.')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
          // Don't throw error, just log it - app should still work without SW
        });
    } else {
      console.log('Service Worker not supported');
    }

    // Track when PWA is installed
    const handleAppInstalled = (evt) => {
      console.log('PWA was installed');
      // Remove install prompt if shown
      localStorage.setItem('pwa-installed', 'true');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Handle PWA display mode changes
    const mqStandalone = '(display-mode: standalone)';
    const handleDisplayModeChange = (e) => {
      if (e.matches) {
        console.log('App is running in standalone mode');
        document.body.classList.add('standalone-mode');
      } else {
        console.log('App is running in browser mode');
        document.body.classList.remove('standalone-mode');
      }
    };

    if (typeof window !== 'undefined' && 'matchMedia' in window) {
      const mediaQuery = window.matchMedia(mqStandalone);
      mediaQuery.addEventListener('change', handleDisplayModeChange);
      handleDisplayModeChange(mediaQuery);
      
      // Cleanup
      return () => {
        window.removeEventListener('appinstalled', handleAppInstalled);
        mediaQuery.removeEventListener('change', handleDisplayModeChange);
      };
    }

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
    } catch (error) {
      console.error('PWA Handler error:', error);
      // Silently fail - app should still work without PWA features
    }
  }, []);

  return null;
};

export default PWAHandler;
