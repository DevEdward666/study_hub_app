import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { QueryProvider } from "./providers/QueryProvier";

// Early service worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    console.log('Attempting to register service worker...');
    navigator.serviceWorker.register('/studyhub-service-worker.js', {
      scope: '/',
      updateViaCache: 'none'
    })
    .then((registration) => {
      console.log('SW registered successfully: ', registration);
      console.log('SW scope: ', registration.scope);
      
      // Listen for service worker updates
      registration.addEventListener('updatefound', () => {
        console.log('New service worker found!');
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            console.log('New service worker state:', newWorker.state);
          });
        }
      });
    })
    .catch((registrationError) => {
      console.error('SW registration failed: ', registrationError);
      console.error('Error details:', {
        name: registrationError.name,
        message: registrationError.message,
        stack: registrationError.stack
      });
    });
  });
} else {
  console.warn('Service Workers are not supported in this browser');
}

createRoot(document.getElementById("root")!).render(
  <QueryProvider>
    <App />
  </QueryProvider>
);
