/* Faz — navigasyon-only SAYFA kümesini lazy chunk'a çıkarır (bol.mjs ile aynı AST tekniği).
 * Bu sayfalar ilk açılışta render EDİLMEZ; yalnız git() ile gidilince gerekir → ilk paket küçülür.
 * Serbest-değişken analiziyle enjekte edilecek üst-düzey bağımlılıklar KESİN hesaplanır.
 * Bağımlılık nesnesi RENDER anında (lazy resolver içinde) kurulur → TDZ/ileri-referans riski yok.
 */
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse = _traverse.default;

// Aday sayfalar (render switch'inde tek <Sayfa/> kullanımı olanlar). Bulunmayan atlanır.
export const ADAY = ['SohbetSayfa','MacSayfa','OyuncuSayfa','TakimSayfa','TurnuvaSayfa','MacSihirbaz','MacKurulum','SkorGir','ProfilSayfa','TakipSayfa','PazarSayfa','Kuluplerim','Kesfet','TumEnler','DavetKatil','Ayarlar','KadroEkrani','LigGenel'];

function analiz(appKod, cluster) {
  const ast = parse(appKod, { sourceType: 'script', plugins: ['jsx'] });
  let programScope = null;
  const nodes = {};
  traverse(ast, {
    Program(p) { programScope = p.scope; },
    FunctionDeclaration(p) {
      if (p.node.id && cluster.includes(p.node.id.name) && p.parent.type === 'Program') nodes[p.node.id.name] = p;
    },
  });
  const found = Object.keys(nodes);
  const clusterSet = new Set(found);
  const ranges = found.map(n => ({ n, start: nodes[n].node.start, end: nodes[n].node.end }));
  const inCluster = (pos) => ranges.some(r => pos >= r.start && pos < r.end);

  // deps (üst-düzey, küme-dışı)
  const deps = new Set();
  for (const name of found) {
    nodes[name].traverse({
      ReferencedIdentifier(path) {
        const nm = path.node.name;
        if (clusterSet.has(nm)) return;
        const b = path.scope.getBinding(nm);
        if (b && b.scope === programScope) deps.add(nm);
      },
    });
  }

  // kullanım yerleri: JSX ve JSX-DIŞI referanslar
  const jsxDis = [];   // küme sayfasına JSX olmayan referans (TEHLİKE)
  const disKullanim = [];  // küme DIŞINDA <Sayfa/> kullanımı (Suspense sarılacak)
  traverse(ast, {
    JSXOpeningElement(p) {
      const nm = p.node.name && p.node.name.type === 'JSXIdentifier' && p.node.name.name;
      if (nm && clusterSet.has(nm)) {
        const el = p.parentPath.node;
        if (!inCluster(el.start)) disKullanim.push({ n: nm, start: el.start, end: el.end });
      }
    },
    ReferencedIdentifier(path) {
      const nm = path.node.name;
      if (!clusterSet.has(nm)) return;
      // JSX adı mı? (JSXIdentifier ReferencedIdentifier'a düşmez ama garanti olsun)
      if (path.parent.type === 'JSXOpeningElement' || path.parent.type === 'JSXClosingElement') return;
      const b = path.scope.getBinding(nm);
      if (b && b.scope === programScope && !inCluster(path.node.start)) jsxDis.push({ n: nm, pos: path.node.start });
    },
  });

  return { found, ranges, depList: [...deps].sort(), jsxDis, disKullanim, programScope, nodes };
}

export function rapor(appKod) {
  const a = analiz(appKod, ADAY);
  return {
    bulunan: a.found,
    bulunamayan: ADAY.filter(x => !a.found.includes(x)),
    depSayi: a.depList.length,
    depList: a.depList,
    jsxDisRef: a.jsxDis,          // boş olmalı (aksi halde riskli)
    disKullanimSayi: a.disKullanim.length,
    disKullanimlar: a.disKullanim.map(x => x.n),
  };
}

export function sayfalariCikar(appKod) {
  const a = analiz(appKod, ADAY);
  if (a.jsxDis.length) throw new Error('JSX-dışı sayfa referansı var (riskli), split atlanıyor: ' + a.jsxDis.map(x => x.n).join(','));
  const cluster = a.found;
  const depList = a.depList;
  const slices = a.ranges;
  const bodies = [...slices].sort((x, y) => x.start - y.start).map(s => appKod.slice(s.start, s.end));

  const chunk =
`import React from 'react';
// ForzaLig sayfa kümesi — talep-üzerine (git ile gidilince). Bağımlılıklar main'den enjekte.
export function make(D){
  const { ${depList.join(', ')} } = D;

${bodies.join('\n\n')}

  return { ${cluster.join(', ')} };
}
`;

  const loader =
`const __sayfaDeps = () => ({ ${depList.join(', ')}, React });
let __sayfaP = null;
const __sayfalar = () => (__sayfaP || (__sayfaP = import('./pages-chunk.jsx').then(m => m.make(__sayfaDeps()))));
`;
  const wrapperFor = (n) => `const ${n} = React.lazy(() => __sayfalar().then(p => ({ default: p.${n} })));`;

  const edits = [];
  const firstStart = Math.min(...slices.map(s => s.start));
  edits.push({ start: firstStart, end: firstStart, text: loader });
  for (const s of slices) edits.push({ start: s.start, end: s.end, text: wrapperFor(s.n) });
  // Fallback: kısa yükleme (ilk gidişte pages-chunk inerken) — marka yeşili dönen halka (flkHolo kabukta tanımlı)
  const FB = `<div style={{minHeight:"60vh",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:34,height:34,border:"3px solid rgba(255,255,255,.14)",borderTopColor:"#34D399",borderRadius:"50%",animation:"flkHolo .8s linear infinite"}}/></div>`;
  for (const u of a.disKullanim) {
    edits.push({ start: u.start, end: u.start, text: `<React.Suspense fallback={${FB}}>` });
    edits.push({ start: u.end, end: u.end, text: '</React.Suspense>' });
  }
  edits.sort((x, y) => y.start - x.start || y.end - x.end);
  let govde = appKod;
  for (const e of edits) govde = govde.slice(0, e.start) + e.text + govde.slice(e.end);

  return { govde, chunk, depList, cluster, cikarilan: bodies.reduce((s, b) => s + b.length, 0) };
}
