'use client';

import { useEffect } from 'react';

const PWAInstaller = () => {
  useEffect(() => {
    // Only register service worker in production
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    }
    
    // In development, unregister any existing service workers to prevent conflicts
    if (process.env.NODE_ENV === 'development' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
        });
      });
    }
  }, []);

  return null;
};

export default PWAInstaller;
