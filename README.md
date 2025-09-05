# Twitch Auto-Quality Enforcer

> Automatically sets Twitch player quality to your preferred quality with smart fallbacks.  
> A lightweight userscript for Tampermonkey / Greasemonkey / Violentmonkey.

**Script inspected:** `twitch-auto-quality-enforcer.user.js` 

---

## Features
- Automatically clicks player settings and sets your preferred quality.
- Falls back to the next available high-quality option if the preferred quality isn't available.
- Detects stream changes and reapplies quality.
- Runs at document-end; no extra permissions required.

---

## Installation

### Option A — Install manually via Tampermonkey
1. Save the script file in your repo with extension `.user.js` (e.g. `twitch-auto-quality-enforcer.user.js`).
2. Open GitHub raw file URL in the browser (or host `.user.js` somewhere that serves `text/javascript`).
3. Click **Install** in Tampermonkey when it opens the script page.

> Tip: GitHub raw URLs generally work for Tampermonkey; if it opens as text, use the “Raw” button to get the raw file URL.

### Option B — Using the file locally
1. Save the script as `twitch-auto-quality-enforcer.user.js` on your computer.
2. In Tampermonkey, click the extension icon → *Create a new script* → *File* → *Open local file* (or open the file in an editor and paste into a new Tampermonkey script).
3. Save.

---

## Quick configuration
Open the script and change the `PreferedQuality` constant near the top:

```js
const PreferedQuality = "1080p60"; // Change this to your Preferred Quality
