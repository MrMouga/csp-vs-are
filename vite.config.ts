/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  // Base relative : marche sur GitHub Pages (sous-chemin) comme sur Netlify (racine).
  base: './',
  test: {
    globals: true,
    include: ['src/**/*.test.ts'],
  },
});
