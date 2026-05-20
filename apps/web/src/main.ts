// main.ts — boots the auth gate, then initializes Hydra on the canvas.
// Everything else (UI, copilot wiring, visuals, etc.) is yours to build.

import { showLoginGate } from './auth.js';
import { initHydra } from './hydra.js';
import { mountPromptBox } from './prompt-box.js';

async function main(): Promise<void> {
  // 1. Block until the user is signed in to Copilot.
  await showLoginGate();

  // 2. Attach Hydra to the canvas. After this, Hydra's globals (`osc`,
  //    `noise`, `shape`, etc.) are available on `window`.
  const canvas = document.getElementById('hydra') as HTMLCanvasElement | null;
  if (canvas) initHydra(canvas);

  // 3. Mount the demo prompt box so the landing page proves the
  //    Copilot SDK pipeline (auth + WebSocket + streaming) is working.
  const app = document.getElementById('app');
  if (app) mountPromptBox(app);
}

void main();
