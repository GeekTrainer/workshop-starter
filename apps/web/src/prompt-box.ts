// prompt-box.ts — minimal demo UI proving the Copilot SDK pipeline works.
// Renders a textarea + Send button into the given container, opens a
// CopilotConnection, and streams the assistant's reply into a response area.

import { CopilotConnection } from './copilot.js';

export function mountPromptBox(container: HTMLElement): void {
  container.innerHTML = `
    <section class="prompt-box">
      <header class="prompt-box__header">
        <h1>Copilot SDK demo</h1>
        <span class="prompt-box__status" data-role="status">connecting…</span>
      </header>
      <textarea
        class="prompt-box__input"
        data-role="input"
        rows="3"
        placeholder="Ask Copilot something…"
        disabled
      ></textarea>
      <div class="prompt-box__actions">
        <button class="prompt-box__send" data-role="send" disabled>Send</button>
      </div>
      <pre class="prompt-box__response" data-role="response" aria-live="polite"></pre>
    </section>
  `;

  const statusEl = container.querySelector<HTMLElement>('[data-role="status"]')!;
  const inputEl = container.querySelector<HTMLTextAreaElement>('[data-role="input"]')!;
  const sendEl = container.querySelector<HTMLButtonElement>('[data-role="send"]')!;
  const responseEl = container.querySelector<HTMLElement>('[data-role="response"]')!;

  const setStatus = (text: string): void => {
    statusEl.textContent = text;
  };

  const setBusy = (busy: boolean): void => {
    inputEl.disabled = busy;
    sendEl.disabled = busy || inputEl.value.trim().length === 0;
  };

  const copilot = new CopilotConnection({
    onReady: ({ model }) => {
      setStatus(model ? `ready · ${model}` : 'ready');
      inputEl.disabled = false;
      sendEl.disabled = inputEl.value.trim().length === 0;
    },
    onStatus: (phase, label) => setStatus(label ? `${phase} · ${label}` : phase),
    onIntent: (text) => setStatus(`intent: ${text}`),
    onToken: (text) => {
      responseEl.textContent += text;
    },
    onReasoning: () => {},
    onToolCall: (name) => setStatus(`tool: ${name}`),
    onToolProgress: (name, message) =>
      setStatus(message ? `tool: ${name} · ${message}` : `tool: ${name}`),
    onToolDone: (name, ok) => setStatus(`tool: ${name} ${ok ? '✓' : '✗'}`),
    onDone: () => {
      setStatus('done');
      setBusy(false);
    },
    onError: (msg) => {
      setStatus(`error: ${msg}`);
      setBusy(false);
    },
  });
  copilot.connect();

  inputEl.addEventListener('input', () => {
    sendEl.disabled = inputEl.disabled || inputEl.value.trim().length === 0;
  });

  const submit = (): void => {
    const prompt = inputEl.value.trim();
    if (!prompt) return;
    responseEl.textContent = '';
    setStatus('sending…');
    setBusy(true);
    copilot.prompt(prompt);
  };

  sendEl.addEventListener('click', submit);
  inputEl.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey)) {
      ev.preventDefault();
      submit();
    }
  });
}
