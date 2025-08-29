// Register service worker and handle PWA events
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available
              if (confirm('New version available! Click OK to update.')) {
                window.location.reload();
              }
            }
          });
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Handle app install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // Trigger our custom install UI
  window.dispatchEvent(new CustomEvent('pwa-install-available'));
});

// Track when PWA is installed
window.addEventListener('appinstalled', (evt) => {
  console.log('PWA was installed');
  // Track installation analytics
  if (typeof gtag !== 'undefined') {
    gtag('event', 'pwa_install', {
      event_category: 'engagement',
      event_label: 'PWA installed'
    });
  }
});

// Handle PWA display mode changes
const mqStandalone = '(display-mode: standalone)';
const listener = (e) => {
  if (e.matches) {
    console.log('App is running in standalone mode');
  } else {
    console.log('App is running in browser mode');
  }
};

if (typeof window !== 'undefined' && 'matchMedia' in window) {
  const mediaQuery = window.matchMedia(mqStandalone);
  mediaQuery.addEventListener('change', listener);
  listener(mediaQuery);
}

// Prevent zoom on iOS
document.addEventListener('gesturestart', function (e) {
  e.preventDefault();
});

// Handle keyboard events for better PWA experience
document.addEventListener('keydown', function(e) {
  // Prevent back navigation with backspace
  if (e.keyCode === 8 && !['input', 'textarea'].includes(e.target.tagName.toLowerCase())) {
    e.preventDefault();
  }
  
  // Handle refresh with Ctrl+R or Cmd+R
  if ((e.ctrlKey || e.metaKey) && e.keyCode === 82) {
    e.preventDefault();
    window.location.reload();
  }
});

export {};
