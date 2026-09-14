# Asterisk Courtesy & Telemetry Tone Builder

Built by Greg, M3COL.

A single-page, dependency-free web app for building multi-tone courtesy beeps and
telemetry tones for Asterisk `app_rpt` based repeater controllers (AllStar or
HamVOIP nodes). Build a tone segment-by-segment, preview it in the browser, and
copy a ready-to-paste `rpt.conf` stanza — no need to push a config to Asterisk
and restart just to hear how it sounds.

## Features

- **Tone segment table** — set Freq 1, Freq 2 (for dual-tone/DTMF-style beeps),
  Duration, and per-segment Gain, each with a paired slider + number input.
  Reorder, duplicate, or delete rows.
- **In-browser playback** via the Web Audio API, with the currently-playing
  segment highlighted in the table.
- **Two-way string editing** — hand-edit the generated `rpt.conf` telemetry
  string directly and play it immediately, or load it back into the row
  editor.
- **Presets** — built-in libraries of the official AllStarLink stock telemetry
  tones (`ct1`–`ct9`, `remotemon`, `remotetx`, etc.) and classic named
  courtesy tones (Tumbleweed, Bumble Bee, Yellow Jacket, and more), with a
  filter box to search them. Save, export, and import your own presets too.
- **Morse code tone generator** — type a message (e.g. a CW station ID) and
  generate correctly-timed Morse tone tuples at a given WPM speed, preview it,
  and append or merge it into the main tone sequence.
- **Shareable links** — the full sequence is encoded into the URL hash, so you
  can send a link instead of a stanza string.
- **Light/dark theme**, responsive down to phone width.

## Usage

This is plain HTML/CSS/JavaScript with no build step and no external
dependencies. To run it:

- Open [`index.html`](index.html) directly in a browser, **or**
- Serve the folder with any static file server, e.g.:

  ```bash
  python -m http.server 8934
  ```

  then visit `http://localhost:8934`.

Build your sequence, click **Play** to preview it, then **Copy stanza line**
and paste the result into the relevant `rpt.conf` telemetry entry.

## Files

| File          | Purpose                                                   |
| ------------- | ---------------------------------------------------------- |
| `index.html`  | Page structure and markup                                  |
| `style.css`   | Styling, including light/dark theme variables               |
| `app.js`      | Application logic — state, rendering, audio playback, UI wiring |
| `presets.js`  | Built-in stock and named courtesy tone preset libraries      |
| `morse.js`    | Morse code table and text-to-tone-tuple conversion            |

## Data sources

- Stock telemetry tone strings: [AllStarLink Telemetry Builder](https://www.allstarlink.org/telemetry-builder/)
- Named courtesy tones: [Repeater-Builder.com](https://www.repeater-builder.com/tech-info/courtesy-tones.html)

Inspired by Jon K5DVT's original courtesy tone builder.
