// src/polyfills.ts
// Vercel-compatible polyfills setup

import { Buffer } from "buffer";
import process from "process";

// Aggressive global setup for Vercel
if (typeof window !== "undefined") {
  (window as any).Buffer = Buffer;
  (window as any).process = process;
  (window as any).global = window;
}

// Set on globalThis
(globalThis as any).Buffer = Buffer;
(globalThis as any).process = process;
(globalThis as any).global = globalThis;

// Export to ensure module is loaded
export { Buffer, process };