// 동 이름 → 로마자 슬러그 변환 엔진 v2
// 전략: 행정구분 접미사(동/읍/면/가)를 영문 키워드로 보존하고, 앞 지명만 변환
//   동 → dong, 읍 → eup, 면 → myeon, 가 → ga
// 지명 변환 시 초중종성 분리 + 끝 자음의 다음 음절 이월(연음) 미적용(단순결합, 슬러그 정확성 우선)
const fs = require('fs');
const path = require('path');

const CHOSUNG = ['g','kk','n','d','tt','r','m','b','pp','s','ss','','j','jj','ch','k','t','p','h'];
const JUNGSUNG = ['a','ae','ya','yae','eo','e','yeo','ye','o','wa','wae','oe','yo','u','weo','we','wi','yu','eu','ui','i'];
// 종성 배열 (index = 유니코드 종성 index, 가=0 기준)
// 정확 매핑: 16=ㅁ(m), 17=ㅂ(b), 18=ㅄ(bs), 19=ㅅ(s), 20=ㅆ(ss), 21=ㅇ(ng), 22=ㅈ(j)...
const JONGSUNG = [
  '',   // 0 (없음)
  'g',  // 1 ㄱ
  'kk', // 2 ㄲ
  'gs', // 3 ㄳ
  'n',  // 4 ㄴ
  'nj', // 5 ㄵ
  'nh', // 6 ㄶ
  'd',  // 7 ㄷ
  'r',  // 8 ㄹ
  'rg', // 9 ㄺ
  'rm', // 10 ㄻ
  'rb', // 11 ㄼ
  'rs', // 12 ㄽ
  'rt', // 13 ㄾ
  'rp', // 14 ㄿ
  'rh', // 15 ㅀ
  'm',  // 16 ㅁ
  'b',  // 17 ㅂ
  'bs', // 18 ㅄ
  's',  // 19 ㅅ
  'ss', // 20 ㅆ
  'ng', // 21 ㅇ
  'j',  // 22 ㅈ
  'c',  // 23 ㅊ
  'k',  // 24 ㅋ
  't',  // 25 ㅌ
  'p',  // 26 ㅍ
  'h',  // 27 ㅎ
];

// 종성 → 다음 음절 초성 앞에서의 발음 변화 (연음/대표음 규칙)
// 제5항: 파열음 종성(ㄱㄷㅂ)은 다음 ㅅ/ㅈ 앞에서 각각 k/t/p로, ㅎ 앞에서도 같음
//   ㄱ → ㅅ/ㅈ/ㅊ/ㅌ 앞: k, 그 외 g
//   ㄷ → ㅅ/ㅈ/ㅊ 앞: t, 그 외 d
//   ㅂ → ㅅ/ㅈ/ㅊ 앞: p, 그 외 b
// 종성 대표음(제12항): ㄲ/ㅋ/ㄲ/ㄳ/ㄺ→g, ㅅ/ㅆ/ㅈ/ㅊ/ㅌ→d, ㅂ/ㅍ/ㄼ/ㄿ→b 등
// 다음 음절 초성(자음)을 보고 종성 표기를 조정
function adjustJong(jongRoman, nextCho) {
  // nextCho: 다음 음절 초성 자소 번호(0-18) 또는 null
  if (!jongRoman) return jongRoman;
  const followSibilant = nextCho !== null && [9, 10, 12, 14, 15, 16].includes(nextCho);
  // 9=ㅅ 10=ㅆ 12=ㅈ... 초성 배열 index: ㅅ=9, ㅆ=10, ㅈ=12, ㅊ=14, ㅌ=16(?), 확인 필요
  // 안전하게 ㅅ/ㅆ/ㅈ/ㅊ 계열만 처리
  const sibilantSet = [9, 10, 12, 13, 14]; // ㅅㅆㅈㅉㅊ
  const isSib = nextCho !== null && sibilantSet.includes(nextCho);

  // 종성 대표음 정규화 (단일 자음으로)
  let rep = jongRoman;
  if (['g', 'kk', 'gs', 'rg', 'k'].includes(rep)) rep = 'g';
  else if (['d', 'rt', 's', 'ss', 'j', 'c', 't'].includes(rep)) rep = 'd';
  else if (['b', 'rb', 'rp', 'bs', 'p'].includes(rep)) rep = 'b';

  // ㅅ/ㅈ 계열 앞에서 파열음 종성은 각각 k/t/p
  if (isSib) {
    if (rep === 'g') return 'k';
    if (rep === 'd') return 't';
    if (rep === 'b') return 'p';
  }
  // 종성 ㄹ(n/r) + ㅎ 계열: 보통 그대로
  return rep;
}

function romanizeSyllable(ch) {
  const code = ch.charCodeAt(0);
  if (code < 0xAC00 || code > 0xD7A3) return { roman: ch, cho: null, jung: null, jong: null, jongRoman: '' };
  const idx = code - 0xAC00;
  const jong = idx % 28;
  const jung = ((idx - jong) / 28) % 21;
  const cho = Math.floor(((idx - jong) / 28) / 21);
  let roman = (CHOSUNG[cho] || '') + JUNGSUNG[jung];
  const jongRoman = jong > 0 ? JONGSUNG[jong] : '';
  if (jong > 0) roman += jongRoman;
  return { roman, cho, jung, jong, jongRoman };
}

// 행정구분 접미사 매핑
const SUFFIX_MAP = { '동': 'dong', '읍': 'eup', '면': 'myeon', '가': 'ga', '리': 'ri' };

// 전체 변환: 접미사 분리 후 지명만 변환
function romanize(str) {
  // 끝의 행정구분 접미사(동/읍/면/가/리) 추출
  const lastChar = str.charAt(str.length - 1);
  const suffix = SUFFIX_MAP[lastChar];
  let core = str;
  let suffixPart = '';
  if (suffix) {
    core = str.slice(0, -1);
    suffixPart = '-' + suffix;
  }

  // 지명 부분 변환 (종성 연음/대표음 규칙 적용)
  const syllables = [];
  for (const ch of core) syllables.push(romanizeSyllable(ch));

  let coreRoman = '';
  for (let i = 0; i < syllables.length; i++) {
    const cur = syllables[i];
    const nextCho = syllables[i + 1] ? syllables[i + 1].cho : null;
    let jong = cur.jongRoman;
    if (cur.jong > 0) jong = adjustJong(cur.jongRoman, nextCho);
    coreRoman += (CHOSUNG[cur.cho] || '') + JUNGSUNG[cur.jung] + jong;
  }

  // 특수: "본동", "제N동" 등 — 접미사 앞이 "본"이면 -bon, "제" 숫자면 제거
  // 이미 앞에서 처리됨 (그대로 변환)

  // 슬러그 정규화
  let out = (coreRoman + suffixPart).toLowerCase();
  out = out.replace(/[^a-z0-9-]/g, '');
  out = out.replace(/-+/g, '-');
  out = out.replace(/^-|-$/g, '');
  return out;
}

const allDongs = [];
const stats = { duplicates: [], totalDongs: 0, totalSlugs: 0 };

for (const prov of ['seoul', 'gyeonggi', 'incheon']) {
  const data = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'src', 'data', prov, 'districts.json'), 'utf8'
  ));
  for (const gu of data) {
    if (!gu.dongs || !Array.isArray(gu.dongs)) continue;
    const seen = new Set();
    for (const dong of gu.dongs) {
      const slug = romanize(dong);
      allDongs.push({ prov, district: gu.slug, dong, slug });
      stats.totalDongs++;
      if (seen.has(slug)) stats.duplicates.push({ prov, district: gu.slug, dong, slug });
      seen.add(slug);
    }
  }
}
stats.totalSlugs = new Set(allDongs.map(d => d.slug)).size;

console.log('=== 강남구 변환 결과 ===');
allDongs.filter(d => d.district === 'gangnam-gu').forEach(d => {
  console.log(`  ${d.dong.padEnd(6)} → ${d.slug}`);
});

console.log('\n=== 인천 중구 샘플 (섞인 동/읍/면) ===');
allDongs.filter(d => d.prov === 'incheon' && d.district === 'jung-gu').slice(0, 8).forEach(d => {
  console.log(`  ${d.dong.padEnd(6)} → ${d.slug}`);
});

console.log('\n=== 경기 가평군 (읍/면 위주) ===');
allDongs.filter(d => d.district === 'gapyeong').forEach(d => {
  console.log(`  ${d.dong.padEnd(6)} → ${d.slug}`);
});

console.log(`\n전체: ${stats.totalDongs}개 동 → ${stats.totalSlugs}개 고유 슬러그`);
console.log('중복:', stats.duplicates.length === 0 ? '✅ 없음' : stats.duplicates.length + '개');

if (stats.duplicates.length > 0) {
  console.log('\n=== 중복 상세 ===');
  stats.duplicates.forEach(d => console.log(`  ⚠️ ${d.prov}/${d.district}: ${d.dong} → ${d.slug}`));
}

fs.writeFileSync(path.join(__dirname, 'dong-slugs.json'), JSON.stringify(allDongs, null, 2), 'utf8');
console.log(`\n✅ dong-slugs.json 저장`);
