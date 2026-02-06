import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/app/index.ts',
    'src/pages/index.ts',
    'src/pages/products/index.ts',
    'src/components/index.ts',
    'src/hooks/index.ts',
  ],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    'react-router-dom',
    '@medusajs/ui',
    '@tanstack/react-query',
  ],
})
