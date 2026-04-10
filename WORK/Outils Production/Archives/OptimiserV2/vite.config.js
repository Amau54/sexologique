import { defineConfig } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';
import { resolve } from 'path';
import { readdirSync } from 'fs';
import purgeCss from 'vite-plugin-purgecss';
import imagemin from 'vite-plugin-imagemin';
import { visualizer } from 'rollup-plugin-visualizer';

const input = Object.fromEntries(
  readdirSync(resolve(__dirname, 'src'))
    .filter(file => file.endsWith('.html'))
    .map(file => [
      file.replace('.html', ''),
      resolve(__dirname, 'src', file)
    ])
);

export default defineConfig({
  root: 'src', // On redéfinit la racine ici
  plugins: [
    createHtmlPlugin({
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        minifyJS: true,
        minifyCSS: true,
      },
    }),
    purgeCss(),
    imagemin({
      gifsicle: { optimizationLevel: 7, interlaced: false },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 65 },
      pngquant: { quality: [0.65, 0.9], speed: 4 },
      svgo: {
        plugins: [
          { name: 'removeViewBox' },
          { name: 'removeEmptyAttrs', active: false },
        ],
      },
      webp: { quality: 65 },
    }),
    visualizer({
      filename: 'stats.html',
      open: true,
    }),
  ],
  css: {
    transformer: 'lightningcss',
  },
  build: {
    outDir: '../production-build', // Le dossier de sortie est relatif à la racine
    emptyOutDir: true,
    minify: 'esbuild',
    target: 'esnext',
    rollupOptions: {
      input,
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  }
});
