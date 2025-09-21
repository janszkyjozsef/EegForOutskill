# EEG Tutor — Pro (No Backend)

A comprehensive **pure‑frontend** EEG tutoring app. No backend, no API keys. Uses only the free Wikipedia REST Summary for lookups.

**Live locally:** open `index.html` in a browser.  
**Deploy:** upload to GitHub Pages or Netlify Drop.

## Features
- Band classifier + sine wave sandbox
- Interactive 10–20 map (clickable notes)
- Signal synth (alpha/beta/noise/blink) + CSV export
- CSV import (one column or `time,µV`) and **simple DFT spectrum**
- Artifact reference
- 15‑item quiz with explanations
- Wikipedia summary fetch (no key): `https://en.wikipedia.org/api/rest_v1/page/summary/<title>`
- Basic offline caching via service worker

## Educational disclaimer
For education only. **Not** for diagnosis or treatment.

— 2025
