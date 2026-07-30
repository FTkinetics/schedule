# Plan: Weekly Schedule Web App
_Locked via grill by Codex + user_

## Goal
Build a lightweight mobile-first weekly schedule web app that opens in a phone browser, shows the current week from Monday to Sunday, and lets the user edit simple text notes for fixed daily time blocks. The first version should stay simple, fast, and free to run: pure static HTML, CSS, and JavaScript with local browser storage and basic PWA support.

## Approach
1. Create a static app with `index.html`, `styles.css`, `app.js`, `manifest.json`, and a small service worker.
2. Default to the week containing today's date, with Monday as the first day.
3. Render a weekly table with seven day columns and eight time rows:
   - 08:30-09:30
   - 09:30-10:30
   - 10:30-11:30
   - 11:30-14:30 lunch block
   - 14:30-15:30
   - 15:30-16:30
   - 16:30-17:30
   - 17:30 later evening block
4. Pre-fill each day's lunch block with "午饭" unless the user edits that specific day.
5. Store all edits in `localStorage`, keyed by date and time block.
6. Use a bottom editor panel when the user taps a cell, so editing stays comfortable on narrow phone screens.
7. Provide top controls for previous week, today, and next week.
8. Include a basic PWA manifest and service worker so the page can be added to the phone home screen.

## Key Decisions & Tradeoffs
- Static frontend only: no server, no account, no database, and no sync. This keeps the app simple and free, but data stays in the current browser.
- Weekly table view: preserves the user's "weekly schedule" mental model, but cells on phones are narrow, so editing happens in a bottom panel.
- One editable text per cell: avoids categories, reminders, drag-and-drop, and completion state in the first version.
- Lunch default is per-day and editable: changing one day's lunch text does not change other days.
- Basic PWA only: supports adding to home screen, but no push reminders or advanced offline behavior.

## Risks / Open Questions
- Local browser data can be lost if the user clears browser storage or switches phones.
- Seven columns on a small phone may require horizontal scrolling.
- PWA install behavior varies by mobile browser.

## Out Of Scope
- User accounts and cloud sync.
- WeChat mini program packaging.
- Notifications or reminders.
- Repeating events.
- Import, export, or backup.
- Multi-line task lists, colors, tags, and completion checkboxes.
