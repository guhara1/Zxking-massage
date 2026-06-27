/**
 * 데이터 타입 정의 (스펙 13절 필수 필드 기준)
 *
 * 모든 데이터는 이 타입을 따라야 하며, 색인 제어(contentStatus, indexPriority, noindex)를 통해
 * 단계적 배포(1차-A → B → C)를 지원한다.
 */

/** 광역자치단체 (서울·경기·인천) */
export type Province = 'seoul' | 'gyeonggi' | 'incheon';

/** 콘텐츠 상태 — 단계적 색인/배포 제어용 */
export type ContentStatus = 'ready' | 'draft' | 'noindex' | 'blocked';

/** 색인 우선순위
 *  1 = 1차 색인 (1차-A 즉시 공개)
 *  2 = 2차 색인 (1차-B)
 *  3 = 3차 색인 (1차-C)
 *  0 = DB 보관 (페이지 생성 안 함, 향후 확장용)
 */
export type IndexPriority = 0 | 1 | 2 | 3;

/** 페이지 유형 (스펙 11절 템플릿 분류) */
export type PageType =
  | 'home' // 수도권 메인
  | 'hub' // 지역 허브 (서울/경기/인천 메인)
  | 'district' // 행정구·시군
  | 'admin-dong' // 행정동·읍면동
  | 'station' // 역세권
  | 'life-area' // 생활권
  | 'use-case' // 이용 장소별 안내
  | 'check' // 예약 전 확인
  | 'legal' // 개인정보 처리방침 등 법적 페이지
  | 'guide'; // 운영 기준 등

/** 이용 장소 (스펙 9절) */
export type UseCaseSlug =
  | 'home' // 자택
  | 'hotel' // 호텔·숙소
  | 'officetel' // 오피스텔
  | 'business-district' // 업무지구
  | 'station-area' // 역세권
  | 'night' // 야간 예약
  | 'outer-area'; // 외곽 지역

/** FAQ 항목 */
export interface FAQItem {
  question: string;
  answer: string;
}

/** 모든 지역/콘텐츠 데이터의 공통 필수 필드 (스펙 13절) */
export interface BaseRegionData {
  name: string; // 표기명 (예: "강남역·역삼")
  slug: string; // URL 슬러그 (예: "gangnam-yeoksam")
  type: PageType;
  province: Province;
  city?: string; // 시·군 (경기/인천)
  district?: string; // 행정구·일반구 (예: "gangnam-gu")
  adminDong?: string; // 행정동·읍면동
  nearbyStations?: string[]; // 가까운 역 (슬러그)
  nearbyAreas?: string[]; // 인접 생활권
  nearbyRegions?: string[]; // 인접 행정구역
  lifeArea?: string; // 소속 생활권
  useCases?: UseCaseSlug[]; // 적용 가능 이용 장소
  checklist?: string[]; // 예약 전 확인사항
  searchIntent: string; // 검색 의도 (SEO용)
  contentFocus: string; // 콘텐츠 방향 (차별화 포인트)
  indexPriority: IndexPriority;
  contentStatus: ContentStatus;
  canonicalUrl: string; // 정규 URL (절대 경로)
  noindex: boolean;
  lastUpdated: string; // ISO 날짜
}

/** 생활권 데이터 — life-areas.json 한 항목 */
export interface LifeArea extends BaseRegionData {
  type: 'life-area';
  description: string; // 생활권 설명
  includes: string[]; // 포함 지역 (예: ["강남역", "역삼역"])
  relatedDistricts?: string[]; // 관련 행정구역
  relatedStations?: string[]; // 관련 역세권
  faq?: FAQItem[]; // 생활권 FAQ
  body?: string; // 본문(1,500자 이상 권장) - 미입력 시 자동 생성
}

/** 행정구·시군 데이터 */
export interface DistrictData extends BaseRegionData {
  type: 'district';
  parent?: string; // 상위 시 (경기 일반구의 경우)
  representativeLifeAreas?: string[]; // 대표 생활권
  representativeDongs?: string[]; // 대표 행정동/읍면동
  nearbyStationsData?: string[]; // 대표 역세권
  faq?: FAQItem[];
}

/** 역세권 데이터 */
export interface StationData extends BaseRegionData {
  type: 'station';
  stationName: string; // 역명 (예: "강남역")
  adjacentDongs?: string[]; // 인접 행정동
  relatedLifeArea?: string; // 관련 생활권
  isTransfer?: boolean; // 환승역 여부
  lines?: string[]; // 노선 (참고용, 노선별 분리 안 함)
  faq?: FAQItem[];
}

/** 이용 장소별 안내 데이터 */
export interface UseCaseData {
  name: string;
  slug: UseCaseSlug;
  label: string; // 메뉴 표기 (예: "자택 이용")
  summary: string; // 한 줄 요약
  body: string; // 본문
  points: string[]; // 확인 포인트
  faq?: FAQItem[];
}

/** 예약 전 확인 체크리스트 항목 */
export interface ChecklistItem {
  id: string;
  question: string; // 확인 질문
  detail?: string; // 보충 설명
}

/** 사이트 전역 설정 */
export interface SiteConfig {
  name: string;
  url: string;
  title: string;
  description: string;
  focusKeyword: string;
  subKeywords: string[];
  phone?: string;          // 표시용 (예: 0508-202-4719)
  phoneDisplay?: string;   // UI 표시용
  phoneTel?: string;       // tel: 링크용 (하이픈 제거)
  organization: {
    name: string;
    url: string;
    logo?: string;
    description: string;
  };
}

/** 브레드크럼 항목 */
export interface BreadcrumbItem {
  name: string;
  url: string;
}
