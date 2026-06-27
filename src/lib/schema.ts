/**
 * JSON-LD 구조화 데이터 생성 라이브러리
 *
 * 스펙 2절 기준 5종 스키마 생성:
 *   - WebPage         (모든 페이지)
 *   - BreadcrumbList  (모든 페이지)
 *   - Organization    (전역)
 *   - ImageObject     (대표 이미지)
 *   - FAQPage         (FAQ 포함 페이지)
 *
 * 주의: 오프라인 매장이 없는 방문형 사이트이므로 LocalBusiness Schema는 사용하지 않는다.
 */
import type { FAQItem, BreadcrumbItem } from './types';
import { siteConfig } from '../data/site';

/** 사이트 절대 URL 생성 */
export function absUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${siteConfig.url}${cleanPath}`;
}

/** WebPage 스키마 */
export function webPageSchema(
  path: string,
  title: string,
  description: string,
  breadcrumbs?: BreadcrumbItem[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': absUrl(path),
    url: absUrl(path),
    name: title,
    description,
    isPartOf: {
      '@type': 'WebSite',
      name: siteConfig.name,
      url: siteConfig.url,
    },
    breadcrumb: breadcrumbs
      ? {
          '@type': 'BreadcrumbList',
          itemListElement: breadcrumbs.map((item, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: item.name,
            item: absUrl(item.url),
          })),
        }
      : undefined,
  };
}

/** BreadcrumbList 스키마 */
export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: absUrl(item.url),
    })),
  };
}

/** Organization 스키마 (오프라인 매장 없음 → LocalBusiness 사용 안 함) */
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.organization.name,
    url: siteConfig.organization.url,
    description: siteConfig.organization.description,
  };
}

/** ImageObject 스키마 */
export function imageObjectSchema(imageUrl: string, caption?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    url: absUrl(imageUrl),
    contentUrl: absUrl(imageUrl),
    caption: caption || siteConfig.description,
  };
}

/** FAQPage 스키마 */
export function faqPageSchema(faqs: FAQItem[]) {
  if (!faqs || faqs.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/** 여러 스키마를 JSON-LD 그래프 배열로 결합 */
export function buildSchemaGraph(schemas: object[]): object[] {
  return schemas.filter(Boolean);
}

/**
 * WebSite 스키마 (SearchAction 포함)
 * Google 사이트링크 검색박스 지원. 메인 페이지에서 전역으로 한 번만 노출.
 */
export function webSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.organization.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}
