import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

/**
 * Generates a poster image for every project reel:
 * static/posters/<slug>.webp, taken from the project's `media` video.
 *
 * The frame is taken at the project's `posterTime` (seconds) in resume.json,
 * or 25% of the way into the reel if it has none.
 *
 * Usage: npm run posters             (only creates missing posters)
 *        npm run posters -- --force  (regenerates all of them)
 *
 * Requires ffmpeg and ffprobe on PATH (winget install Gyan.FFmpeg).
 */
const root = fileURLToPath(new URL('../', import.meta.url))
const staticDir = path.join(root, 'static')
const outDir = path.join(staticDir, 'posters')
const force = process.argv.includes('--force')

const { projects } = JSON.parse(fs.readFileSync(path.join(root, 'src', 'data', 'resume.json'), 'utf8'))

const duration = (file) => Number(execFileSync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'csv=p=0',
    file
]).toString())

fs.mkdirSync(outDir, { recursive: true })

for (const project of projects)
{
    if (!project.media) continue

    const video = path.join(staticDir, project.media)
    const poster = path.join(outDir, `${project.slug}.webp`)

    if (!fs.existsSync(video))
    {
        console.warn(`skip  ${project.slug}: ${project.media} not found`)
        continue
    }
    if (fs.existsSync(poster) && !force)
    {
        console.log(`keep  ${project.slug}`)
        continue
    }

    const time = project.posterTime ?? duration(video) * 0.25
    execFileSync('ffmpeg', [
        '-v', 'error', '-y',
        '-ss', String(time),
        '-i', video,
        '-frames:v', '1',
        '-vf', 'scale=min(960\\,iw):-2', // 960px covers the grid card on high-DPI screens; never upscale
        '-c:v', 'libwebp', '-quality', '80',
        poster
    ])
    console.log(`made  ${project.slug} (${time.toFixed(1)}s, ${Math.round(fs.statSync(poster).size / 1024)} KB)`)
}
