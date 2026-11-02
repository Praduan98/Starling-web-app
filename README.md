# Starling: social media command center (live prototype)

**Every channel, moving as one.** A starling murmuration is thousands of birds moving as a single shape. Starling does the same for a brand's social channels: plan, publish, engage, and measure in one place.

Built only with HTML, CSS, and JavaScript: no build step and no framework. The design language comes from [AllAI Suite](https://allaisuite.com): DM Sans, crimson `#E11D48`, the rose→orange signature gradient, slate ink, and an 8px radius.

## Open it

Double-click any page. It runs from `file://` with no server. Google Fonts loads DM Sans when you're online and falls back to system fonts offline.

| Page | What it is |
|---|---|
| `index.html` | **Start here.** Sign in, or create an account (`index.html#signup`), which leads into onboarding |
| `onboarding.html` | 4-step setup for new accounts: workspace, channels, goals, team |
| `app.html` | **The product**: Home, Planner, Streams, Inbox, Analytics, Listening, Library, Approvals, Settings |
| `brand.html` | Design system and brand guidelines: logo, color, type, components, data viz, voice |

## Try this in the app

- **Create** (or press `C`): compose once for many networks, with live previews, character limits, best-time slots, and Starling AI.
- **Planner**: drag a post to another day to reschedule it (Undo is in the toast).
- **Inbox**: open a conversation, choose *Suggest reply*, send it, then *Resolve*.
- `Ctrl/⌘ + K` opens search and commands. `G` then `P`/`I`/`A` jumps to Planner, Inbox, or Analytics. `?` lists every shortcut.
- The moon icon switches between light and dark themes.

Deep links: `app.html#/inbox/c2`, `app.html#/settings/channels`, `app.html?compose=1`, `app.html?compose=ai`, `app.html?theme=dark`.

Your changes (posts, replies, approvals) persist in `localStorage`. Use **Settings → Appearance → Reset demo data** to start over.

## Structure

```
assets/
  brand/   logo.svg, logo-white.svg, logo-mono.svg, logo-mark.svg, app-icon.svg, favicon.svg
  css/     tokens.css (design tokens, light + dark) · base.css · components.css · app.css
           marketing.css (sign-in and onboarding) · brand.css
  js/      icons.js (Lucide + Simple Icons, offline) · ui.js (theme, toasts, modals, menus) · data.js (seeded demo data)
           charts.js (SVG charts) · composer.js · app.js (router, palette) · views/*.js
           marketing.js (sign-in and onboarding) · brand.js
  media/   demo photography (Unsplash)
films/starling/
  brand/   brand.json (Starling's brand as the film enforces it) · DM Sans (OFL)
  demo/    the demo film's source: index.html + film.js + film.css, the motion-film runtime, score_v2.py (music)
  export/  the finished film (see below)
```

## Demo film

A 60-second, dark-theme product film that walks through the main areas of the app: Sign in, Home, Composer + AI, Planner, Inbox, Streams + Listening, Analytics, Library + Approvals. It is made in code with the motion-film-pro plugin, with an original synthesized score ("Murmuration") cut to the picture.

| File (`films/starling/export/`) | Use |
|---|---|
| `Starling_Demo_60s_1080p.mp4` | Master quality (1920×1080, 30 fps, AAC audio) |
| `Starling_Demo_60s_1080p_web.mp4` | Smaller copy for LinkedIn, YouTube and sharing |
| `Starling_Demo_60s_1080p_mp3-audio.mp4` | Same film with MP3 audio, for previewing inside VS Code (its player has no AAC) |
| `Starling_Demo_Score_v2.wav` | The music on its own |

The videos are stored with Git LFS: install it (`git lfs install`) before cloning to get the files. To preview or re-render the film, use the plugin's `mf preview` / `mf render` on `films/starling/demo/index.html` with `--score=films/starling/demo/score_v2.py`.

The demo workspace *Nexora* (an AI workflow SaaS company), its customers, competitors and people are all fictional. Before using the name "Starling" publicly, run a trademark check: other companies in unrelated industries use it.
