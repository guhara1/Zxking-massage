// 기존 dong-N URL → 새 로마자 슬러그 URL 301 리다이렉트 규칙 생성
// Cloudflare Pages _redirects 파일용
// (이전 배포에서 /seoul/gangnam-gu/dong-1/ 형태가 색인되었을 가능성 대응)
const fs = require('fs');
const path = require('path');

// data.ts와 동일한 romanize 로직 (복사)
const CHOSUNG = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
const JUNGSUNG = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'weo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
const JONGSUNG = ['', 'g', 'kk', 'gs', 'n', 'nj', 'nh', 'd', 'r', 'rg', 'rm', 'rb', 'rs', 'rt', 'rp', 'rh', 'm', 'b', 'bs', 's', 'ss', 'ng', 'j', 'c', 'k', 't', 'p', 'h'];
const SUFFIX_MAP = { 동: 'dong', 읍: 'eup', 면: 'myeon', 가: 'ga', 리: 'ri' };
const SIBILANT_SET = new Set([9, 10, 12, 13, 14]);

function romanizeSyllable(ch) {
  const code = ch.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return { cho: -1, jung: -1, jong: -1, jongRoman: '' };
  const idx = code - 0xac00;
  const jong = idx % 28;
  const jung = Math.floor((idx - jong) / 28) % 21;
  const cho = Math.floor(Math.floor((idx - jong) / 28) / 21);
  return { cho, jung, jong, jongRoman: jong > 0 ? JONGSUNG[jong] : '' };
}
function adjustJong(jongRoman, nextCho) {
  if (!jongRoman) return jongRoman;
  let rep = jongRoman;
  if (['g', 'kk', 'gs', 'rg', 'k'].includes(rep)) rep = 'g';
  else if (['d', 'rt', 's', 'ss', 'j', 'c', 't'].includes(rep)) rep = 'd';
  else if (['b', 'rb', 'rp', 'bs', 'p'].includes(rep)) rep = 'b';
  if (nextCho >= 0 && SIBILANT_SET.has(nextCho)) {
    if (rep === 'g') return 'k';
    if (rep === 'd') return 't';
    if (rep === 'b') return 'p';
  }
  return rep;
}
function romanize(str) {
  if (!str) return '';
  const lastChar = str.charAt(str.length - 1);
  const suffix = SUFFIX_MAP[lastChar];
  let core = str, suffixPart = '';
  if (suffix) { core = str.slice(0, -1); suffixPart = '-' + suffix; }
  const syllables = [];
  for (const ch of core) syllables.push(romanizeSyllable(ch));
  let coreRoman = '';
  for (let i = 0; i < syllables.length; i++) {
    const cur = syllables[i];
    const nextCho = syllables[i + 1] ? syllables[i + 1].cho : -1;
    let jong = cur.jongRoman;
    if (cur.jong > 0) jong = adjustJong(cur.jongRoman, nextCho);
    coreRoman += (CHOSUNG[cur.cho] || '') + JUNGSUNG[cur.jung] + jong;
  }
  let out = (coreRoman + suffixPart).toLowerCase();
  out = out.replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return out;
}

const lines = [];
lines.push('# 행정동 URL 로마자 슬러그 변경에 따른 301 리다이렉트');
lines.push('# 기존 dong-N 형식 → 로마자 슬러그 (SEO 링크 주스 보존)');
lines.push('');

for (const prov of ['seoul', 'gyeonggi', 'incheon']) {
  const data = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'src', 'data', prov, 'districts.json'), 'utf8'
  ));
  for (const gu of data) {
    if (!gu.dongs) continue;
    const seen = new Map();
    gu.dongs.forEach((dong, idx) => {
      const oldSlug = `dong-${idx + 1}`;
      let newSlug = romanize(dong);
      if (seen.has(newSlug)) {
        const count = (seen.get(newSlug) || 1) + 1;
        seen.set(newSlug, count);
        newSlug = `${newSlug}-${count}`;
      } else {
        seen.set(newSlug, 1);
      }
      lines.push(`/${prov}/${gu.slug}/${oldSlug}/ /${prov}/${gu.slug}/${newSlug}/ 301`);
    });
  }
}

const outPath = path.join(__dirname, '..', 'public', '_redirects');
fs.writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');
console.log(`✅ ${outPath} 생성 (${lines.length - 2}개 리다이렉트 규칙)`);
console.log('샘플:');
const content = fs.readFileSync(outPath, 'utf8').split('\n');
content.slice(2, 6).forEach(l => console.log('  ' + l));
