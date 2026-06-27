/**
 * 데이터 로드 및 단계적 색인 제어 라이브러리
 *
 * 스펙 13절의 contentStatus / indexPriority / noindex 필드를 기준으로
 * 어떤 항목을 페이지로 생성할지(1차-A)를 결정한다.
 *
 * 1차-A(indexPriority === 1 && contentStatus === 'ready') 항목만 getStaticPaths 대상이 된다.
 * draft / noindex 항목은 페이지를 만들되 robots noindex 메타를 삽입한다.
 */
import type { LifeArea, DistrictData, UseCaseData, ChecklistItem, Province } from './types';
import { romanize } from './romanize';
import seoulLifeAreas from '../data/seoul/life-areas.json';
import gyeonggiLifeAreas from '../data/gyeonggi/life-areas.json';
import incheonLifeAreas from '../data/incheon/life-areas.json';
import seoulDistricts from '../data/seoul/districts.json';
import gyeonggiDistricts from '../data/gyeonggi/districts.json';
import incheonDistricts from '../data/incheon/districts.json';
import gyeonggiCityDistricts from '../data/gyeonggi/city-districts.json';
import useCasesData from '../data/common/use-cases.json';
import checklistData from '../data/common/checklists.json';

type LifeAreaMap = Record<Province, LifeArea[]>;

const lifeAreasByProvince: LifeAreaMap = {
  seoul: seoulLifeAreas as LifeArea[],
  gyeonggi: gyeonggiLifeAreas as LifeArea[],
  incheon: incheonLifeAreas as LifeArea[],
};

/** 모든 생활권 데이터 (3개 광역단체 통합) */
export function getAllLifeAreas(): LifeArea[] {
  return [
    ...lifeAreasByProvince.seoul,
    ...lifeAreasByProvince.gyeonggi,
    ...lifeAreasByProvince.incheon,
  ];
}

/** 특정 광역단체의 생활권 데이터 */
export function getLifeAreasByProvince(province: Province): LifeArea[] {
  return lifeAreasByProvince[province];
}

/**
 * 1차 색인 대상 생활권 (indexPriority === 1 && contentStatus === 'ready')
 * → 이 항목들만 페이지 생성 + 색인 허용
 */
export function getReadyLifeAreas(province?: Province): LifeArea[] {
  const source = province ? lifeAreasByProvince[province] : getAllLifeAreas();
  return source.filter(
    (area) => area.indexPriority === 1 && area.contentStatus === 'ready'
  );
}

/** slug로 단일 생활권 조회 (province + slug로 정확히 매칭) */
export function getLifeArea(province: Province, slug: string): LifeArea | undefined {
  return lifeAreasByProvince[province].find((area) => area.slug === slug);
}

/** 슬러그로 생활권 조회 (전체 검색, 관련 링크용) */
export function findLifeAreaBySlug(slug: string): LifeArea | undefined {
  return getAllLifeAreas().find((area) => area.slug === slug);
}

/** 모든 이용 장소 데이터 */
export function getAllUseCases(): UseCaseData[] {
  return useCasesData as UseCaseData[];
}

/** slug로 이용 장소 조회 */
export function getUseCase(slug: string): UseCaseData | undefined {
  return (useCasesData as UseCaseData[]).find((item) => item.slug === slug);
}

/** 예약 전 체크리스트 전체 */
export function getChecklist(): ChecklistItem[] {
  return checklistData as ChecklistItem[];
}

/** 광역단체 한글명 매핑 */
export const PROVINCE_LABEL: Record<Province, string> = {
  seoul: '서울',
  gyeonggi: '경기',
  incheon: '인천',
};

/** 광역단체별 핵심 생활권 개수 (메인 페이지 통계용) */
export function getLifeAreaCount(province: Province): number {
  return getReadyLifeAreas(province).length;
}

/* ==========================================================================
   행정구·시군 (District) 데이터
   ========================================================================== */

/** 수도권 행정구·시군 전체 (서울 25 + 경기 31 + 인천 10) */
const districtsByProvince: Record<Province, DistrictData[]> = {
  seoul: seoulDistricts as DistrictData[],
  gyeonggi: gyeonggiDistricts as DistrictData[],
  incheon: incheonDistricts as DistrictData[],
};

/** 특정 광역단체의 행정구 목록 */
export function getDistricts(province: Province): DistrictData[] {
  return districtsByProvince[province].filter(
    (d) => d.contentStatus === 'ready'
  );
}

/** slug로 행정구 조회 */
export function getDistrict(province: Province, slug: string): DistrictData | undefined {
  return districtsByProvince[province].find((d) => d.slug === slug);
}

/** 특정 행정구의 행정동 목록 반환 (dongs 필드) */
export function getDongsByDistrict(province: Province, districtSlug: string): string[] {
  const district = getDistrict(province, districtSlug);
  return district?.dongs ?? [];
}

/**
 * 행정구(gu) 계층 — 경기도 일반구 보유 7개 시 (수원/성남/고양/용인/안산/안양)
 * 시 → 행정구(gu) → 행정동 3단계 구조 지원
 */
export interface CityDistrict {
  slug: string;
  name: string;
  dongs: string[];
}

interface CityDistrictsData {
  name: string;
  districts: CityDistrict[];
}

/** 특정 경기 시가 일반구를 보유하고 있는지 */
export function hasGuDistricts(citySlug: string): boolean {
  const data = (gyeonggiCityDistricts as Record<string, CityDistrictsData>)[citySlug];
  return !!(data && data.districts && data.districts.length > 0);
}

/** 특정 경기 시의 행정구(gu) 목록 반환 */
export function getGuDistricts(citySlug: string): CityDistrict[] {
  const data = (gyeonggiCityDistricts as Record<string, CityDistrictsData>)[citySlug];
  return data?.districts ?? [];
}

/** 특정 행정구(gu) 단일 조회 */
export function getGuDistrict(citySlug: string, guSlug: string): CityDistrict | undefined {
  return getGuDistricts(citySlug).find((g) => g.slug === guSlug);
}

/**
 * 행정동 슬러그 처리
 * 동명(한글) → 로마자 슬러그 변환 (「국어의 로마자 표기법」 준수)
 * SEO를 위해 영문 슬러그 사용: 역삼동 → yeoksam-dong, 청담동 → cheongdam-dong
 */

/**
 * 특정 구의 모든 행정동을 {name, slug} 형태로 반환 (페이지 생성용)
 * 로마자 슬러그 사용 (예: 역삼동 → yeoksam-dong)
 * 동일 구/시군 내 슬러그 충돌 시 접미사 -2, -3 부여
 */
export function getDongList(
  province: Province,
  districtSlug: string
): { name: string; slug: string }[] {
  const dongs = getDongsByDistrict(province, districtSlug);
  const seen = new Map<string, number>();
  const result: { name: string; slug: string }[] = [];
  for (const name of dongs) {
    let slug = romanize(name);
    // 동일 구 내 슬러그 충돌 처리
    if (seen.has(slug)) {
      const count = (seen.get(slug) || 1) + 1;
      seen.set(slug, count);
      slug = `${slug}-${count}`;
    } else {
      seen.set(slug, 1);
    }
    result.push({ name, slug });
  }
  return result;
}

/** 특정 동 슬러그로 단일 동 조회 */
export function getDong(
  province: Province,
  districtSlug: string,
  dongSlug: string
): { name: string; slug: string } | undefined {
  return getDongList(province, districtSlug).find((d) => d.slug === dongSlug);
}

/**
 * 행정구(gu) 내 행정동 리스트 반환 (경기도 일반구 보유 시 전용)
 * 슬러그 충돌 시 -2, -3 부여
 */
export function getDongListByGu(
  citySlug: string,
  guSlug: string
): { name: string; slug: string }[] {
  const gu = getGuDistrict(citySlug, guSlug);
  if (!gu) return [];
  const seen = new Map<string, number>();
  const result: { name: string; slug: string }[] = [];
  for (const name of gu.dongs) {
    let slug = romanize(name);
    if (seen.has(slug)) {
      const count = (seen.get(slug) || 1) + 1;
      seen.set(slug, count);
      slug = `${slug}-${count}`;
    } else {
      seen.set(slug, 1);
    }
    result.push({ name, slug });
  }
  return result;
}

/** 행정구(gu) 내 특정 동 슬러그로 단일 동 조회 */
export function getDongByGu(
  citySlug: string,
  guSlug: string,
  dongSlug: string
): { name: string; slug: string } | undefined {
  return getDongListByGu(citySlug, guSlug).find((d) => d.slug === dongSlug);
}

/** 동 슬러그 → 동명 변환 (특정 구 내에서 역추적) */
export function dongSlugToName(
  slug: string,
  province?: Province,
  districtSlug?: string
): string {
  if (province && districtSlug) {
    const dong = getDong(province, districtSlug, slug);
    if (dong) return dong.name;
  }
  return slug.replace(/-/g, ' ');
}

/**
 * 한국어 조사 자동 처리
 * @param word 단어 (예: '역삼동')
 * @param pp 페어 조사 (예: '은는' → 받침 O '은', 받침 X '는')
 *           지원: '은는','이가','을를','과와','로으로'
 * @returns 단어 + 알맞은 조사 (예: '역삼동은')
 */
export function postposition(word: string, pp: string): string {
  if (!word) return pp;
  const last = word.charCodeAt(word.length - 1) - 0xac00;
  const hasBatchim = last % 28 !== 0;
  // '로으로' 특수: 받침이 ㄹ이면 '로'
  if (pp === '로으로') {
    const jong = last % 28;
    if (jong === 8) return word + '로'; // ㄹ 받침
    return hasBatchim ? word + '으로' : word + '로';
  }
  return hasBatchim ? word + pp[0] : word + pp[1];
}

/** 역세권 슬러그를 한국어 역명으로 변환 */
const STATION_LABELS: Record<string, string> = {
  'gangnam-station': '강남역',
  'yeoksam-station': '역삼역',
  'seocho-station': '서초역',
  'yangjae-station': '양재역',
  'jamsil-station': '잠실역',
  'seokchon-station': '석촌역',
  'hongik-univ-station': '홍대입구역',
  'hapjeong-station': '합정역',
  'yeouido-station': '여의도역',
  'yeongdeungpo-station': '영등포역',
  'seongsu-station': '성수역',
  'wangsimni-station': '왕십리역',
  'yongsan-station': '용산역',
  'seoul-station': '서울역',
  'konkuk-univ-station': '건대입구역',
  'achasan-station': '아차산역',
  'magok-station': '마곡역',
  'balsan-station': '발산역',
  'guro-digital-complex-station': '구로디지털단지역',
  'gasan-digital-complex-station': '가산디지털단지역',
  'geumcheon-gu-office-station': '금천구청역',
  'sillim-station': '신림역',
  'seoul-national-univ-station': '서울대입구역',
  'sadang-station': '사당역',
  'noryangjin-station': '노량진역',
  'mokdong-station': '목동역',
  'sinjeong-negeori-station': '신정네거리역',
  'yeonsinnae-station': '연신내역',
  'bulgwang-station': '불광역',
  'nowon-station': '노원역',
  'sanggye-station': '상계역',
  'sangbong-station': '상봉역',
  'myeonmok-station': '면목역',
  'jongno-3-sam-ga-station': '종로3가역',
  'gwanghwamun-station': '광화문역',
  'myeongdong-station': '명동역',
  'euljiro-ipeg-station': '을지로입구역',
  'cheonho-station': '천호역',
  'gildong-station': '길동역',
  'suyu-station': '수유역',
  'dobong-station': '도봉역',
  'cheongnyangni-station': '청량리역',
  'sinseol-dong-station': '신설동역',
  'sinchon-station': '신촌역',
  'hongje-station': '홍제역',
  'seongbuk-station': '성북역',
  'anseong-station': '안성역',
  'mangwusu-station': '망우역',
  'suwon-station': '수원역',
  'maetan-gogae-station': '매교역',
  'pangyo-station': '판교역',
  'jeongja-station': '정자역',
  'jukjeon-station': '죽전역',
  'giheung-station': '기흥역',
  'dongtan-station': '동탄역',
  'byeongjeom-station': '병점역',
  'bucheon-station': '부천역',
  'jung-dong-station': '중동역',
  'beomgye-station': '범계역',
  'anyang-station': '안양역',
  'jeongbalsan-station': '정발산역',
  'daehwa-station': '대화역',
  'uijeongbu-station': '의정부역',
  'minrak-station': '민락역',
  'misa-station': '미사역',
  'hanam-geonsan-station': '하남검산역',
  'cheolsan-station': '철산역',
  'gwangmyeong-station': '광명역',
  'central-station': '중앙역',
  'choji-station': '초지역',
  'pyeongtaek-station': '평택역',
  'songtan-station': '송탄역',
  'jeongwang-station': '정왕역',
  'ochang-station': '오창역',
  'osan-station': '오산역',
  'oji-station': '오지역',
  'uiwang-station': '의왕역',
  'naeson-station': '내손역',
  'gwacheon-station': '과천역',
  'government-complex-gwacheon-station': '정부과천청사역',
  'taejeon-station': '태전역',
  'gdhgyo-station': '경복대역',
  'icheon-station': '이천역',
  'bubal-station': '부발역',
  'yeoju-station': '여주역',
  'silleung-station': '신능역',
  'yangpyeong-station': '양평역',
  'yongmun-station': '용문역',
  'yangju-station': '양주역',
  'deokgye-station': '덕계역',
  'pocheon-station': '포천역',
  'soheul-station': '소흘역',
  'dongducheon-station': '동두천역',
  'bosan-station': '보산역',
  'gapyeong-station': '가평역',
  'cheongpyeong-station': '청평역',
  'yeoncheon-station': '연천역',
  'jeongok-station': '전곡역',
  'geumchon-station': '금촌역',
  'guri-station': '구리역',
  'topyeong-station': '토평역',
  'sanbon-station': '산본역',
  'dangjeong-station': '당정역',
  'incheon-national-univ-station': '인천대입구역',
  'songdo-moonlight-festival-park-station': '송도달빛축제공원역',
  'incheon-cityhall-station': '인천시청역',
  'arts-center-station': '예술회관역',
  'bupyeong-station': '부평역',
  'bupyeong-market-station': '부평시장역',
  'juan-station': '주안역',
  'dohwa-station': '도화역',
  'dongincheon-station': '동인천역',
  'cheongna-international-city-station': '청라국제도시역',
  'geomdan-sageori-station': '검단사거리역',
  'unseo-station': '운서역',
  'incheon-airport-station': '인천공항역',
  'gyeyang-station': '계양역',
  'gyesan-station': '계산역',
};

export function stationLabel(slug: string): string {
  return STATION_LABELS[slug] ?? slug.replace(/-/g, ' ');
}

