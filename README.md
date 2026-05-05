# Content Analyzer (Gemini Nano)

Content Analyzer is a lightweight Chrome extension that reads the page you’re on, summarizes the key points with Chrome’s on‑device Gemini Nano model, and—only when it makes sense—creates quick charts to visualize the data. It’s designed to be fast, private, and simple to use.

## What it does

- **Analyze the current page**: One click to capture headings, text, links, and metadata, then get a clean, useful summary.
- **Ask your own question**: Switch to Manual mode and chat with the built‑in model.
- **Smart visuals (only if needed)**: If the page includes numbers, you’ll see clear bar/pie charts. If it’s just text, no noisy graphs.
- **Remembers your session**: Conversation history is stored locally, so you can pick up where you left off.

## How to install (Dev Mode)

1. Open `chrome://extensions/`
2. Toggle on **Developer mode** (top‑right)
3. Click **Load unpacked** and select the `projectNano` folder
4. Pin the extension to your toolbar

## How to use

### Screen Capture mode (default)
1. Open a webpage you want summarized
2. Click the extension icon
3. Press **Analyze Page**
4. Read the summary; if numeric data is found, charts appear and can be downloaded

### Manual Input mode
1. Open the popup
2. Click **Manual Input**
3. Ask a question or paste text, then press **Send**

## Tech highlights

- Manifest V3 with a service worker (`background.js`) and content script (`content.js`)
- Gemini Nano availability checks and a small “ready to use” UX cue
- Robust JSON parsing with fallbacks to keep the UI stable even if the model responds unexpectedly
- Chart rendering via bundled Chart.js and simple download‑as‑PNG support

## Privacy

All analysis runs locally on your machine using Chrome’s built‑in AI. No data leaves your device.

## Requirements

- Chrome 120+ with Built‑in AI enabled
- Gemini Nano downloaded (the popup guides you if it’s still downloading)

## Troubleshooting

- If the popup says AI is unavailable, ensure Chrome’s AI features are turned on and wait for the model to finish downloading.
- If charts don’t appear, it’s likely the content doesn’t include numbers—or the model decided a chart wouldn’t help. That’s by design.

---


