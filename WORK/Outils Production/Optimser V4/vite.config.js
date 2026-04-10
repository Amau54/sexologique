import { defineConfig } from 'vite';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import purgecss from 'vite-plugin-purgecss';
import { visualizer } from 'rollup-plugin-visualizer';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { ViteMinifyPlugin } from 'vite-plugin-minify';
import { compression } from 'vite-plugin-compression2';

const useHashing = process.env.ENABLE_HASHING !== 'false';

export default defineConfig({
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      targets: { chrome: 90, firefox: 80, safari: 14 }
    }
  },
  build: {
    outDir: 'dist',
    cssMinify: 'lightningcss',
    rollupOptions: {
      output: {
        entryFileNames: useHashing ? 'assets/[name]-[hash].js' : 'assets/[name].js',
        chunkFileNames: useHashing ? 'assets/[name]-[hash].js' : 'assets/[name].js',
        assetFileNames: useHashing ? 'assets/[name]-[hash].[ext]' : 'assets/[name].[ext]',
      },
    },
  },
  plugins: [
    ViteImageOptimizer({
      webp: { quality: 80 },
      avif: { quality: 70 },
    }),
    purgecss({
      content: ['./**/*.html'],
    }),
    viteSingleFile(),
    ViteMinifyPlugin({
      minifyCSS: true,
      minifyJS: true,
      removeComments: true,
      collapseWhitespace: true,
    }),
    compression({ algorithm: 'gzip' }),
    compression({ algorithm: 'brotliCompress', exclude: [/\.(br)$/, /\.(gz)$/] }),
    visualizer({
      filename: 'stats.html',
      gzipSize: true,
    }),
  ],
});
