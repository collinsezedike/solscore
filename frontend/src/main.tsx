// main.tsx
// CRITICAL: Buffer polyfill MUST be the very first import
import { Buffer } from "buffer";
import process from "process";

// Set globals immediately
window.Buffer = Buffer;
globalThis.Buffer = Buffer;
window.process = process;
globalThis.process = process;

// Now import everything else AFTER Buffer is set
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { Providers } from './contexts/Providers.tsx'
import App from './App.tsx'
import { ThemeProvider } from './components/theme-provider.tsx'
import { Toaster } from './components/ui/sonner.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Providers>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <App />
          <Toaster />
        </ThemeProvider>
      </Providers>
    </BrowserRouter>
  </StrictMode>
)