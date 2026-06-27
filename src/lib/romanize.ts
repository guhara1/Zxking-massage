/**
 * 한국어 동/읍/면명 → 로마자 URL 슬러그 변환
 *
 * 규칙: 「국어의 로마자 표기법」(국립국어원, 2000) 준수
 *  - 행정구분 접미사 보존: 동→dong, 읍→eup, 면→myeon, 가→ga, 리→ri
 *  - 지명 부분은 초중종성 분해 후 표기법 적용
 *  - 종성 연음/대표음 규칙: 파열음 종성(ㄱㄷㅂ)은 다음 ㅅ/ㅈ/ㅊ 앞에서 k/t/p로 변환
 *
 * 예: 역삼동 → yeoksam-dong, 청담동 → cheongdam-dong, 가평읍 → gapyeong-eup
 */

// 초성 (19개)
const CHOSUNG = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];

// 중성 (21개)
const JUNGSUNG = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'weo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];

// 종성 (28개, index 0=없음)
const JONGSUNG = [
  '', 'g', 'kk', 'gs', 'n', 'nj', 'nh', 'd', 'r', 'rg', 'rm', 'rb', 'rs', 'rt', 'rp', 'rh',
  'm', 'b', 'bs', 's', 'ss', 'ng', 'j', 'c', 'k', 't', 'p', 'h',
];

// 행정구분 접미사 매핑
const SUFFIX_MAP: Record<string, string> = {
  동: 'dong', 읍: 'eup', 면: 'myeon', 가: 'ga', 리: 'ri',
};

// 초성 자소 번호 (자음 계열 판별용)
// 9=ㅅ 10=ㅆ 12=ㅈ 13=ㅉ 14=ㅊ
const SIBILANT_SET = new Set([9, 10, 12, 13, 14]);

interface Syllable {
  roman: string;
  cho: number;
  jung: number;
  jong: number;
  jongRoman: string;
}

function romanizeSyllable(ch: string): Syllable {
  const code = ch.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) {
    return { roman: ch, cho: -1, jung: -1, jong: -1, jongRoman: '' };
  }
  const idx = code - 0xac00;
  const jong = idx % 28;
  const jung = Math.floor((idx - jong) / 28) % 21;
  const cho = Math.floor(Math.floor((idx - jong) / 28) / 21);
  let roman = (CHOSUNG[cho] || '') + JUNGSUNG[jung];
  const jongRoman = jong > 0 ? JONGSUNG[jong] : '';
  if (jong > 0) roman += jongRoman;
  return { roman, cho, jung, jong, jongRoman };
}

/** 종성 대표음 + 연음 규칙 적용 */
function adjustJong(jongRoman: string, nextCho: number): string {
  if (!jongRoman) return jongRoman;
  // 종성 대표음 정규화 (제12항)
  let rep = jongRoman;
  if (['g', 'kk', 'gs', 'rg', 'k'].includes(rep)) rep = 'g';
  else if (['d', 'rt', 's', 'ss', 'j', 'c', 't'].includes(rep)) rep = 'd';
  else if (['b', 'rb', 'rp', 'bs', 'p'].includes(rep)) rep = 'b';

  // 다음 음절 초성이 ㅅ/ㅆ/ㅈ/ㅉ/ㅊ 계열이면 파열음 종성은 k/t/p로 (제5항)
  if (nextCho >= 0 && SIBILANT_SET.has(nextCho)) {
    if (rep === 'g') return 'k';
    if (rep === 'd') return 't';
    if (rep === 'b') return 'p';
  }
  return rep;
}

/** 한국어 지명 → 로마자 슬러그 */
export function romanize(str: string): string {
  if (!str) return '';
  // 행정구분 접미사(동/읍/면/가/리) 분리
  const lastChar = str.charAt(str.length - 1);
  const suffix = SUFFIX_MAP[lastChar];
  let core = str;
  let suffixPart = '';
  if (suffix) {
    core = str.slice(0, -1);
    suffixPart = '-' + suffix;
  }

  // 지명 부분 음절 분해
  const syllables: Syllable[] = [];
  for (const ch of core) syllables.push(romanizeSyllable(ch));

  // 종성 연음/대표음 규칙 적용하며 조립
  let coreRoman = '';
  for (let i = 0; i < syllables.length; i++) {
    const cur = syllables[i];
    const nextCho = syllables[i + 1] ? syllables[i + 1].cho : -1;
    let jong = cur.jongRoman;
    if (cur.jong > 0) jong = adjustJong(cur.jongRoman, nextCho);
    coreRoman += (CHOSUNG[cur.cho] || '') + JUNGSUNG[cur.jung] + jong;
  }

  // 슬러그 정규화
  let out = (coreRoman + suffixPart).toLowerCase();
  out = out.replace(/[^a-z0-9-]/g, '');
  out = out.replace(/-+/g, '-');
  out = out.replace(/^-|-$/g, '');
  return out;
}
