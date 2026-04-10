import { build } from 'vite';
import { resolve } from 'path';
import fg from 'fast-glob';
import fs from 'fs';

const htmlFiles = fg.globSync('**/*.html', { 
  ignore: ['dist/**', 'node_modules/**', 'src/assets/**'] 
});

async function runBuilds() {
  // Clean dist folder once at the start
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true });
  }

  for (const file of htmlFiles) {
    console.log(`Building ${file}...`);
    await build({
      build: {
        rollupOptions: {
          input: resolve(process.cwd(), file),
        },
        emptyOutDir: false,
      },
    });
  }
  console.log('All builds completed.');
}

runBuilds().catch(err => {
  console.error(err);
  process.exit(1);
});
