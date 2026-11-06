# Theme and cursor improvements

- Tailwind CSS v4 class-based dark mode via `@custom-variant dark`.
- Light/dark toggle (sun/moon) in the authenticated dashboard header.
- Theme preference stored under `task-management-theme` in localStorage; system preference used initially.
- Early theme initialization in index.html to avoid light-mode flash.
- Dark styling for existing light-only Tailwind backgrounds, text, borders, inputs, tables, and hover states.
- Global semantic cursors for links, buttons, inputs, disabled controls, and draggable elements.
- Backend was not modified.

Run `npm install` then `npm run dev` from the frontend directory.
