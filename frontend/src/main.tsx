import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

// Suppress browser translation / extension DOM removeChild & insertBefore glitches
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    const errName = event.error?.name || '';
    if (
      msg.includes('removeChild') ||
      msg.includes('insertBefore') ||
      errName === 'NotFoundError'
    ) {
      event.preventDefault();
      event.stopPropagation();
      console.warn('Suppressed browser DOM translation glitch:', msg);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
