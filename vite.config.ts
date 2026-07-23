import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 프로젝트 배포: base 누락 시 에셋 404 → 흰 화면 (02_GAMEDEV_STUDY §4)
export default defineConfig({
  plugins: [react()],
  base: '/history-fantasy-league/',
})
