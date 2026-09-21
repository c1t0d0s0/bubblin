import { defineConfig, Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

function copyConfigPlugin(): Plugin {
  return {
    name: 'copy-config-js',
    closeBundle() {
      const configPath = path.resolve(__dirname, 'config.js');
      const distConfigPath = path.resolve(__dirname, 'dist/config.js');
      if (fs.existsSync(configPath)) {
        fs.copyFileSync(configPath, distConfigPath);
        console.log('Copied config.js to dist/config.js');
      }
    }
  };
}

export default defineConfig({
  base: './',
  server: {
    port: 5173,
    host: true
  },
  build: {
    target: 'esnext'
  },
  plugins: [copyConfigPlugin()]
});
