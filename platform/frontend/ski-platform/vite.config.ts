import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api/user-core': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/user-core/, ''),
      },
      '/api/resort': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/resort/, ''),
      },
    },
  },
  build: {
    // 优化配置
    target: 'es2015',
    minify: 'esbuild', // 使用esbuild更快
    // 或者使用terser (但需要安装terser依赖)
    // minify: 'terser',
    // 代码分割优化
    rollupOptions: {
      output: {
        manualChunks: {
          // 将React相关库打包到一起
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Redux相关
          'redux-vendor': ['@reduxjs/toolkit', 'react-redux'],
          // 工具库
          'utils-vendor': ['axios'],
        },
        // 静态资源分类输出
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // 启用CSS代码分割
    cssCodeSplit: true,
    // 设置chunk大小警告限制
    chunkSizeWarningLimit: 1000,
    // 生成sourcemap（生产环境可选择false以减小体积）
    sourcemap: false,
  },
  // 性能优化
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@reduxjs/toolkit', 'axios'],
  },
})
