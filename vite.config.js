import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    server: {
        port: process.env.PORT || 8361,
        open: '/playground/',
    },

    build: {
        lib: {
            entry: resolve(process.cwd(), 'src/index.js'),
            name: 'ScratchRender',
            formats: ['es', 'cjs', 'umd'],
            fileName: (format) => {
                if (format === 'es') return 'web/scratch-render.js';
                if (format === 'cjs') return 'node/scratch-render.js';
                if (format === 'umd') return 'umd/scratch-render.js';
                return `scratch-render.${format}.js`;
            }
        },
        rollupOptions: {
            external: [
                'events',
                'grapheme-breaker',
                'linebreak',
                'hull.js',
                'scratch-svg-renderer',
                'twgl.js',
                'xml-escape'
            ]
        },
        sourcemap: true,
        target: 'es2018',
        minify: false
    },

    resolve: {
        alias: {
            '@': resolve(process.cwd(), './src')
        }
    }
});
