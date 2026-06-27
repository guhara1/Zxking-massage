import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// 배포 사이트 URL
// - 환경 변수 SITE_URL 이 있으면 그것을 사용 (Cloudflare Pages에서 설정 가능)
// - 없으면 기본값 사용 (실제 도메인 확정 후 아래 기본값을 변경하세요)
const SITE_URL = process.env.SITE_URL || 'https://zxking-massage.pages.dev';

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
