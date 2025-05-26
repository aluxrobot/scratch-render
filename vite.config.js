import { defineConfig } from 'vite';
import { resolve } from 'path';
import rawPlugin from 'vite-raw-plugin';

export default defineConfig(({ mode }) => ({
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
                'hull.js',
                'scratch-svg-renderer',
                'twgl.js',
                'xml-escape'
            ],
            output: {
                // 더 작은 번들
                compact: mode === 'production'
            }
        },
        // 환경별 설정
        sourcemap: mode === 'development',
        minify: mode === 'production' ? 'esbuild' : false, // terser 대신 esbuild 사용
        target: 'es2018',

        // 프로덕션 전용 최적화 (esbuild용)
        ...(mode === 'production' && {
            esbuild: {
                drop: ['console', 'debugger'], // console.log와 debugger 제거
                legalComments: 'none' // 주석 제거
            }
        }),

        // 커먼JS 종속성 미리 번들링
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

    // Vite 플러그인
    plugins: [
        rawPlugin({
            fileRegex: /\.(txt|md|vert|frag|glsl)$/,
        })
    ],

    // 최적화 설정
    optimizeDeps: {
        include: [
            'twgl.js',
            'scratch-svg-renderer'
        ],
        exclude: ['raw-loader']
    }
}));

