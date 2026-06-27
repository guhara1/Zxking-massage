import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// 배포 사이트 URL - 실제 도메인 사용 시 아래 값을 변경하세요.
// GitHub Pages: https://본인ID.github.io/저장소이름/
const SITE_URL = 'https://sudogwon-massage.example.com';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  output: 'static',
  integrations: [sitemap()],
  build: {
    // URL 끝에 trailing slash 유지 (스펙 URL 규칙 준수: /seoul/)
    format: 'directory',
  },
  trailingSlash: 'always',
});
