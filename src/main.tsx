// Defensive global fetch redefinition to allow safe write-access in case external libraries assign to window.fetch or globalThis.fetch
try {
  if (typeof window !== "undefined" && window.fetch) {
    const originalFetch = window.fetch;
    let customFetch = originalFetch;
    try {
      const desc = Object.getOwnPropertyDescriptor(window, "fetch");
      if (!desc || desc.configurable) {
        Object.defineProperty(window, "fetch", {
          get() {
            return customFetch;
          },
          set(val) {
            customFetch = val;
          },
          configurable: true,
          enumerable: true,
        });
      }
    } catch (e) {
      // safe fallback
    }
  }
} catch (e) {
  // silent fallback
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
