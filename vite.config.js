import restart from 'vite-plugin-restart'
import glsl from 'vite-plugin-glsl'
import { fileURLToPath } from 'node:url'
import projectPages from './plugins/projectPages.js'

export default {
    root: 'src/', // Sources files (typically where index.html is)
    publicDir: '../static/', // Path from "root" to static assets (files that are served as they are)
    server:
    {
        host: true, // Open to local network and display URL
        open: !('SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env) // Open if it's not a CodeSandbox
    },
    build:
    {
        outDir: '../dist', // Output in the dist/ folder
        emptyOutDir: true, // Empty the folder first
        sourcemap: true, // Add sourcemap
        rollupOptions:
        {
            input:
            {
                main: fileURLToPath(new URL('./src/index.html', import.meta.url)), // Simple portfolio (landing page)
                experience: fileURLToPath(new URL('./src/3d/index.html', import.meta.url)) // three.js portfolio at /3d/
            }
        }
    },
    plugins:
    [
        restart({ restart: [ '../static/**', ] }), // Restart server on static file change
        glsl(),
        projectPages() // Adds a page per project at /projects/<slug>/
    ],
}