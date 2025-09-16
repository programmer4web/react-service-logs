import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  css: {
    postcss: './postcss.config.js',
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // For library builds, you can uncomment this:
    // lib: {
    //   entry: 'src/index.js',
    //   name: 'ReactServiceLogs',
    //   fileName: (format) => `react-service-logs.${format}.js`
    // },
    rollupOptions: {
      // For library builds, you can uncomment this:
      // external: ['react', 'react-dom'],
      // output: {
      //   globals: {
      //     react: 'React',
      //     'react-dom': 'ReactDOM'
      //   }
      // }
    }
  }
})