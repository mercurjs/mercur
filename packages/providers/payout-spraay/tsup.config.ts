import { defineConfig } from 'tsup';

export default defineConfig({
    clean: true,
    dts: true,
    entry: ['src/index.ts', 'src/amounts.ts', 'src/chain/*.ts', 'src/gateway/*.ts'],
    format: ['esm', 'cjs'],
    sourcemap: true,
    target: 'esnext',
    outDir: 'dist',
    treeshake: true,
    external: ['@medusajs/framework', '@mercurjs/types'],
});
