import react from '@vitejs/plugin-react'
import glsl from 'vite-plugin-glsl'

function restartOnStaticChange()
{
    return {
        name: 'restart-on-static-change',
        configureServer(server)
        {
            server.watcher.add('../static/**')

            server.watcher.on('change', (_path) =>
            {
                if(_path.includes('/static/') || _path.includes('\\static\\'))
                {
                    server.restart()
                }
            })
        }
    }
}

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
        chunkSizeWarningLimit: 700,
        rolldownOptions:
        {
            output:
            {
                manualChunks(id)
                {
                    if(!id.includes('node_modules'))
                    {
                        return
                    }

                    if(id.includes('/three/examples/'))
                    {
                        return 'vendor-three-examples'
                    }

                    if(id.includes('/three/'))
                    {
                        return 'vendor-three'
                    }

                    if(id.includes('/gsap/'))
                    {
                        return 'vendor-gsap'
                    }

                    if(id.includes('/cannon/'))
                    {
                        return 'vendor-cannon'
                    }

                    if(id.includes('/howler/'))
                    {
                        return 'vendor-howler'
                    }

                    if(id.includes('/dat.gui/'))
                    {
                        return 'vendor-datgui'
                    }

                    return 'vendor'
                }
            }
        }
    },
    plugins:
    [
        react(),
        glsl(), // Support GLSL files
        restartOnStaticChange() // Restart server on static file change
    ],
}