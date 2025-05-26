import { defineConfig } from 'vite';
import { resolve } from 'path';
import rawPlugin from 'vite-raw-plugin';
import nodePolyfills from 'rollup-plugin-polyfill-node';

export default defineConfig(({ mode }) => ({
    server: {
        port: process.env.PORT || 8361,
        open: '/playground/',
    },

    // 브라우저 호환성을 위한 define 설정
    define: {
        global: 'globalThis',
        'process.env.NODE_ENV': JSON.stringify(mode),
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
            external: (id) => {
                // Node.js 내장 모듈들을 external로 처리
                const nodeBuiltins = ['fs', 'path', 'os', 'util', 'url', 'buffer', 'stream', 'events'];
                if (nodeBuiltins.includes(id)) return true;

                // 다른 external 모듈들
                const externals = [
                    'events',
                    'grapheme-breaker',
                    'linebreak',
                    'hull.js',
                    'scratch-svg-renderer',
                    'twgl.js',
                    'xml-escape'
                ];
                return externals.includes(id);
            },
            output: {
                compact: mode === 'production'
            },
            plugins: [
                // Node.js polyfills 추가
                nodePolyfills()
            ]
        },
        sourcemap: mode === 'development',
        minify: mode === 'production' ? 'esbuild' : false,
        target: 'es2018',

        ...(mode === 'production' && {
            esbuild: {
                drop: ['console', 'debugger'],
                legalComments: 'none'
            }
        }),

        commonjsOptions: {
            include: [/node_modules/],
            transformMixedEsModules: true
        }
    },

    resolve: {
        alias: {
            '@': resolve(process.cwd(), './src')
        }
    },

    plugins: [
        rawPlugin({
            fileRegex: /\.(txt|md|vert|frag|glsl)$/,
        })
    ],

    optimizeDeps: {
        include: [
            'twgl.js',
            'scratch-svg-renderer'
        ],
        exclude: ['raw-loader']
    }
}));
