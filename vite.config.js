import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    // './' = path relatif, jadi jalan di https://user.github.io/nama-repo/ maupun domain custom
    base: './',
    plugins: [react()],
    build: { chunkSizeWarningLimit: 1500 },
  };
});
