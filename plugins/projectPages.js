import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { marked } from 'marked'

/**
 * Generates one page per project at src/projects/<slug>/index.html from
 * src/templates/project.html, the project entry in resume.json and an optional
 * write-up in src/content/projects/<slug>.md. The output folder is gitignored.
 */
const src = fileURLToPath(new URL('../src/', import.meta.url))
const dataPath = path.join(src, 'data', 'resume.json')
const templatePath = path.join(src, 'templates', 'project.html')
const contentDir = path.join(src, 'content', 'projects')
const outDir = path.join(src, 'projects')
const staticDir = fileURLToPath(new URL('../static/', import.meta.url))

const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const linkLabel = (url) => url.includes('itch.io') ? 'Play on itch.io' : 'Visit site'

const renderFacts = (project) =>
{
    const facts = [
        ['Role', project.role],
        ['Year', project.year],
        ['Team', project.team],
        ['Tools', project.tags?.join(', ')]
    ].filter(([, value]) => value)

    if (!facts.length) return ''
    return `<dl class="facts">${facts.map(([label, value]) => `<div><dt>${label}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>`
}

// The poster (from `npm run posters`) shows while the reel loads
const renderMedia = (project) =>
{
    if (!project.media) return ''

    const poster = `/posters/${project.slug}.webp`
    const posterAttribute = fs.existsSync(path.join(staticDir, poster)) ? ` poster="${poster}"` : ''
    return `<div class="project-media"><video src="${escape(project.media)}"${posterAttribute} autoplay muted loop playsinline controls preload="metadata" aria-label="${escape(project.name)} gameplay reel"></video></div>`
}

const renderLink = (project) => project.url
    ? `<a class="button" href="${escape(project.url)}" target="_blank" rel="noopener">${linkLabel(project.url)} →</a>`
    : ''

// HTML comments are stripped so the starter notes in each .md file never render
const renderBody = (project) =>
{
    const file = path.join(contentDir, `${project.slug}.md`)
    if (!fs.existsSync(file)) return ''

    const markdown = fs.readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '').trim()
    return markdown ? `<div class="prose">${marked.parse(markdown)}</div>` : ''
}

const renderPager = (previous, next) =>
{
    const link = (project, label, className) => project
        ? `<a class="${className}" href="/projects/${project.slug}/"><span>${label}</span>${escape(project.name)}</a>`
        : '<span></span>'

    return link(previous, '← Previous', 'pager-previous') + link(next, 'Next →', 'pager-next')
}

const generate = () =>
{
    const { projects } = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
    const template = fs.readFileSync(templatePath, 'utf8')

    // Same order as the landing page: most recent first
    const ordered = [...projects].reverse()
    const inputs = {}

    ordered.forEach((project, i) =>
    {
        const values = {
            name: escape(project.name),
            description: escape(project.description ?? ''),
            facts: renderFacts(project),
            media: renderMedia(project),
            link: renderLink(project),
            body: renderBody(project),
            pager: renderPager(ordered[i - 1], ordered[i + 1])
        }
        const html = template.replace(/{{(\w+)}}/g, (match, key) => values[key] ?? match)

        const file = path.join(outDir, project.slug, 'index.html')
        fs.mkdirSync(path.dirname(file), { recursive: true })
        if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== html) fs.writeFileSync(file, html)

        inputs[`project-${project.slug}`] = file
    })

    // Remove pages for projects that no longer exist
    const slugs = new Set(projects.map((project) => project.slug))
    for (const dir of fs.readdirSync(outDir))
        if (!slugs.has(dir)) fs.rmSync(path.join(outDir, dir), { recursive: true, force: true })

    return inputs
}

const isSource = (file) =>
{
    const resolved = path.resolve(file)
    return resolved === dataPath || resolved === templatePath || resolved.startsWith(contentDir)
}

export default function projectPages()
{
    return {
        name: 'project-pages',
        config()
        {
            return { build: { rollupOptions: { input: generate() } } }
        },
        configureServer(server)
        {
            server.watcher.add([templatePath, contentDir])
            server.watcher.on('all', (event, file) =>
            {
                if (isSource(file)) generate()
            })
        }
    }
}
