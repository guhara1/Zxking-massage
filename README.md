# 서울·경기·인천 수도권 출장마사지 안내 사이트

행정구·시군·행정동·역세권·생활권 기반의 수도권 통합형 출장마사지 방문 가능 지역 안내 사이트입니다.
Astro 정적 사이트 생성기로 구축되었으며, JSON 데이터 기반으로 페이지를 자동 생성합니다.

## 🚀 빠른 시작 (Node.js 필요)

> **Astro 실행에는 Node.js 18.14.1 이상이 필요합니다.**

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 실행 (http://localhost:4321)
npm run dev

# 3. 정적 사이트 빌드 (dist/ 폴더 생성)
npm run build

# 4. 빌드 결과 미리보기
npm run preview
```

Node.js가 없다면 https://nodejs.org 에서 LTS 버전을 설치하세요.
설치 후 터미널을 완전히 껐다 다시 켜야 `node`, `npm` 명령어가 인식됩니다.

## 📁 프로젝트 구조

```
src/
├── data/                      # JSON 데이터 (스펙 13절 구조)
│   ├── common/                # 체크리스트, 이용장소(use-cases)
│   ├── seoul/life-areas.json  # 서울 핵심 생활권
│   ├── gyeonggi/life-areas.json # 경기 핵심 생활권
│   ├── incheon/life-areas.json  # 인천 핵심 생활권
│   └── site.ts                # 사이트 전역 설정 (SEO 타이틀, 키워드 등)
├── lib/
│   ├── types.ts               # 데이터 타입 정의 (필수 필드)
│   ├── data.ts                # 데이터 로드 + 단계적 색인 제어
│   └── schema.ts              # JSON-LD 스키마 생성 (5종)
├── components/                # 공통 UI 컴포넌트
├── layouts/BaseLayout.astro   # 기본 레이아웃
├── pages/                     # 라우트 (정적 + 동적 자동 생성)
└── styles/global.css          # 글로벌 스타일
```

## 🧩 단계적 색인 제어 시스템 (스펙 13절)

각 데이터 항목은 다음 필드로 색인 여부를 제어합니다:

| 필드 | 값 | 동작 |
|------|-----|------|
| `indexPriority` | `1` | 1차 색인 대상 (현재 공개) |
| `indexPriority` | `2` | 2차 색인 (1차-B) |
| `indexPriority` | `3` | 3차 색인 (1차-C) |
| `indexPriority` | `0` | DB 보관 (페이지 생성 안 함) |
| `contentStatus` | `ready` | 즉시 공개 |
| `contentStatus` | `draft` | 준비 중 |
| `contentStatus` | `noindex` | 페이지 생성 + noindex 메타 |
| `noindex` | `true` | 해당 페이지 검색엔진 노출 제외 |

**1차-A(현재)**: `indexPriority === 1 && contentStatus === 'ready'` 인 항목만 자동 생성됩니다.

## ➕ 새 페이지 추가하는 법

### 새 생활권 추가 (예: 서울 목동·양천)
`src/data/seoul/life-areas.json` 배열에 항목을 추가하면,
`indexPriority: 1` && `contentStatus: "ready"` 설정 시 자동으로 `/seoul/life/[slug]/` 페이지가 생성됩니다.

```json
{
  "name": "목동·양천",
  "slug": "mokdong-yangcheon",
  "type": "life-area",
  "province": "seoul",
  "district": "yangcheon-gu",
  "searchIntent": "...",
  "contentFocus": "...",
  "indexPriority": 1,
  "contentStatus": "ready",
  "canonicalUrl": "/seoul/life/mokdong-yangcheon/",
  "noindex": false,
  "lastUpdated": "2026-06-27",
  "description": "...",
  "includes": ["목동역", "양천구청"],
  "body": "1,500자 이상 본문...",
  "faq": [{ "question": "...", "answer": "..." }]
}
```

빌드하면 자동으로 새 페이지가 생성됩니다.

## 🔍 SEO / 스키마 (스펙 2절)

- **Focus Keyword**: 출장마사지
- **Schema 5종**: WebPage, BreadcrumbList, Organization, ImageObject, FAQPage
- **LocalBusiness Schema는 사용하지 않음** (오프라인 매장 없는 방문형)
- canonical URL 자동 생성, noindex 처리 지원
- sitemap 자동 생성 (`@astrojs/sitemap`)

## 📤 배포

정적 빌드 결과(`dist/`)를 GitHub Pages, Netlify, Vercel 등에 배포할 수 있습니다.

배포 전 `astro.config.mjs`의 `SITE_URL`을 실제 도메인으로 변경하고,
`src/data/site.ts`의 `url`도 같이 맞춰주세요.

## ⚖️ 운영 기준 (스펙 16절)

- 지역명만 바꾼 대량 페이지를 만들지 않습니다.
- 선정적 표현, 불법 암시, 허위 후기, 가짜 평점, 과장 할인 문구를 사용하지 않습니다.
- URL에 `-chuljangmassage`, `-hometai`, `-massage` 등의 접미사를 붙이지 않습니다.
- 환승역 노선별 분리, 출구별 페이지를 만들지 않습니다.
- 모든 주요 페이지에 예약 전 확인사항과 개인정보 처리 기준을 포함합니다.
