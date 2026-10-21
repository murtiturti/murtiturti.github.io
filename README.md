# portfolio
New and improved portfolio


## Structure

- `/` is the main portfolio (`src/index.html`, `src/home/`)
- `/projects/<slug>/` is generated for every project by `plugins/projectPages.js`
- `/3d/` is the three.js portfolio (`src/3d/index.html`, `src/Experience/`)

## Adding or editing a project

1. Add an entry to `projects` in `src/data/resume.json` with a unique `slug`. Both the main site and the 3D site read this file.
   Optional fields shown on the project page: `role`, `year`, `team`, `tags` (e.g. `["Unity", "C#"]`).
2. Put the reel in `static/videos/` and reference it as `"media": "/videos/<file>.webm"`.
   Then run `npm run posters` (needs ffmpeg: `winget install Gyan.FFmpeg`) to make the card image in `static/posters/`.
   The frame is taken 25% into the reel; set `"posterTime": <seconds>` on the project to pick another, then `npm run posters -- --force`.
3. Write the project page in `src/content/projects/<slug>.md` (Markdown). Images go in `static/images/<slug>/`.

Deploys run from the `staging` branch via `.github/workflows/deploy.yml`.
