// public/polyfills.js
// This file loads BEFORE Vite bundles

import { Buffer } from 'buffer';
import process from 'process';

// Set Buffer globally
window.Buffer = Buffer;
globalThis.Buffer = Buffer;

// Set process globally
window.process = process;
globalThis.process = process;

// Set global
window.global = window;
globalThis.global = globalThis;

console.log('✅ Polyfills loaded successfully');