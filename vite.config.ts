import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { UserConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig((): UserConfig => {
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
  };
});