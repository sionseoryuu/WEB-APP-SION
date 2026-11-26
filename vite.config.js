import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    // './' = path relatif, jadi jalan di https://user.github.io/nama-repo/ maupun domain custom
    base: './',
    plugins: [react()],
    define: {
      // Firebase opsional: isi VITE_FIREBASE_CONFIG (JSON satu baris) bila ingin sinkron cloud
      __firebase_config: JSON.stringify(env.VITE_FIREBASE_CONFIG || ''),
    },
    build: { chunkSizeWarningLimit: 1500 },
  };
});
