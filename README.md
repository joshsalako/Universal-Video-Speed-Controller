# Universal Video Speed Controller

Chrome extension that sets and enforces a default playback speed for HTML5 videos across websites, including social media and major video platforms.

## Features

- Saves a preferred playback speed in `chrome.storage.sync`
- Applies that speed to existing and newly loaded videos on supported pages
- Updates open tabs immediately after saving a new speed
- Supports quarter-step speeds from `0.25x` to `4x`
- Uses a lightweight detection model with one shared observer and no polling loops

## Project Structure

- Single-extension codebase with no platform-specific sidecar folders
- `manifest.json`: Manifest V3 definition, permissions, popup, and content script registration
- `popup.html`: Popup markup
- `popup.css`: Popup styling
- `popup.js`: Popup behavior, validation, persistence, and tab messaging
- `content.js`: Playback-rate enforcement for HTML5 videos across websites

## Requirements

- Google Chrome or another Chromium browser with Manifest V3 support

## Local Installation

1. Open Chrome and go to `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select the folder that contains this repository's extension files:
   - `manifest.json`
   - `popup.html`
   - `popup.js`
   - `popup.css`
   - `content.js`

## Usage

1. Click the extension icon in Chrome.
2. Enter one of the supported speed values.
3. Click `Save`.
4. Open a site with HTML5 video and play a video.

Open tabs with detected videos should update immediately after saving. If a site aggressively reinitializes its player, reloading that tab forces a fresh application.

## How It Works

The extension does not try to drive site-specific playback-speed menus. Instead, it sets `HTMLVideoElement.playbackRate` directly, which is less fragile than relying on internal CSS classes or private player markup.

The content script:

- reads the saved speed from `chrome.storage.sync`
- applies it to all current `video` elements
- watches the page for newly inserted videos
- reapplies the speed if a site changes it during playback
- avoids platform-specific code paths, polling loops, and heavy observers

## Permissions

- `storage`: Persist the selected default speed
- `tabs`: Notify open tabs after a speed change
- host permissions for `<all_urls>`: Run the content script on webpages where HTML5 videos may appear

## Validation Rules

The popup accepts numeric values from `0.25` to `4` in `0.25` increments. Invalid values are rejected and not saved.

## Manual Test Checklist

- Load the extension unpacked with no manifest errors
- Save `1.5` and confirm the popup shows the stored value when reopened
- Play a video on `youtube.com`, `x.com`, and another HTML5 video site and confirm it starts at `1.5x`
- Scroll or navigate until new videos load and confirm they also use `1.5x`
- Change the setting to `1`, `2`, or `4` while a video tab is open and confirm visible videos update
- Try an unsupported value such as `1.1` or `4.25` and confirm the popup blocks the save

## Notes for Production Use

- Different sites may wrap or reinitialize players differently; this implementation stays intentionally DOM-light and targets native video elements to reduce breakage risk and memory use.
- Some protected or highly custom players may not expose behavior identical to standard HTML5 video controls.
- If you want Chrome Web Store publication, the next likely additions are:
  - extension icons
  - a privacy policy
  - store listing copy and screenshots

## License

MIT. See [LICENSE](LICENSE).
