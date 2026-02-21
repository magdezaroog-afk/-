
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      API_KEY: process.env.API_KEY
    }
  }
});
