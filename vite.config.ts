import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: mode !== 'production',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
        pure_funcs: mode === 'production' ? ['console.log', 'console.debug'] : [],
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          utils: ['./src/utils/calculations', './src/utils/ribGenerator'],
          components: [
            './src/components/Dashboard/AdminDashboard',
            './src/components/Dashboard/ClientDashboard',
            './src/components/Admin/ClientManagement',
            './src/components/Admin/LoanValidation',
            './src/components/Admin/TransferValidation',
            './src/components/Admin/PortfolioManagement'
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1500,
    assetsInlineLimit: 4096,
  },
  server: {
    port: 3000,
    host: true,
    strictPort: true,
  },
  preview: {
    port: 4173,
    host: true,
    strictPort: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js'],
    exclude: ['lucide-react'],
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __COMMIT_HASH__: JSON.stringify(process.env.COMMIT_HASH || 'unknown'),
  },
  esbuild: {
    legalComments: 'none',
  },
}));
