/* Faz 5 — admin KÜMESİNİ lazy chunk'a çıkarır (AST ile kesin, eksiksiz).
 * Yalnızca admin-özel 7 bileşen (yalnız AdminPanel içinden kullanılıyor) taşınır.
 * Serbest-değişken (free variable) analiziyle enjekte edilecek üst-düzey
 * bağımlılıklar KESİN hesaplanır → çalışma-anı ReferenceError riski yok.
 * main gövdesinin geri kalanı BYTE-BYTE korunur (yalnız 7 dilim çıkarılır,
 * AdminPanel yerine lazy sarmalayıcı + kullanım yeri Suspense'e alınır).
 */
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse = _traverse.default;

const CLUSTER = ['AdminPanel', 'AnketMerkezi', 'ModMerkezi', 'DuyuruOkunma', 'IcerikYonetim', 'FidanAyar', 'RadyoYonetim'];

export function adminKumesiCikar(appKod) {
  const ast = parse(appKod, { sourceType: 'script', plugins: ['jsx'] });
  let programScope = null;
  const nodes = {};
  let kullanim = null;   // <AdminPanel .../> JSXElement
  traverse(ast, {
    Program(p) { programScope = p.scope; },
    FunctionDeclaration(p) {
      if (p.node.id && CLUSTER.includes(p.node.id.name) && p.parent.type === 'Program') nodes[p.node.id.name] = p;
    },
    JSXOpeningElement(p) {
      if (p.node.name && p.node.name.type === 'JSXIdentifier' && p.node.name.name === 'AdminPanel') {
        kullanim = p.parentPath.node;   // JSXElement
      }
    },
  });
  const found = Object.keys(nodes);
  if (found.length !== CLUSTER.length) throw new Error('admin kümesi eksik bulundu: ' + found.join(',') + ' (7 bekleniyor)');
  if (!kullanim) throw new Error('<AdminPanel/> kullanım yeri bulunamadı');

  const clusterSet = new Set(CLUSTER);
  const deps = new Set();
  for (const name of found) {
    nodes[name].traverse({
      ReferencedIdentifier(path) {
        const nm = path.node.name;
        if (clusterSet.has(nm)) return;                       // küme-içi → yerel kalır
        const b = path.scope.getBinding(nm);
        if (b && b.scope === programScope) deps.add(nm);       // üst-düzey → enjekte
      },
    });
  }
  const depList = [...deps].sort();

  const slices = found.map(n => ({ n, start: nodes[n].node.start, end: nodes[n].node.end }));
  const bodies = [...slices].sort((a, b) => a.start - b.start).map(s => appKod.slice(s.start, s.end));

  const chunk =
`import React from 'react';
// Faz 5 — ForzaLig admin kümesi lazy chunk (talep-üzerine). Bağımlılıklar main'den enjekte edilir.
export function make(D){
  const { ${depList.join(', ')} } = D;

${bodies.join('\n\n')}

  return AdminPanel;
}
`;

  // Düzenlemeler: 7 dilim (AdminPanel→wrapper, diğer 6→sil) + kullanım yerini Suspense'e al.
  const wrapper = `const AdminPanel = React.lazy(() => import('./admin-chunk.jsx').then(m => ({ default: m.make({ ${depList.join(', ')}, React }) })));`;
  const edits = [];
  for (const s of slices) {
    if (s.n === 'AdminPanel') edits.push({ start: s.start, end: s.end, text: wrapper });
    else edits.push({ start: s.start, end: s.end, text: '' });
  }
  // Suspense sarma (iki ekleme: başa aç, sona kapat)
  edits.push({ start: kullanim.start, end: kullanim.start, text: '<React.Suspense fallback={null}>' });
  edits.push({ start: kullanim.end, end: kullanim.end, text: '</React.Suspense>' });

  edits.sort((a, b) => b.start - a.start || b.end - a.end);
  let govde = appKod;
  for (const e of edits) govde = govde.slice(0, e.start) + e.text + govde.slice(e.end);

  return { govde, chunk, depList, cikarilan: bodies.reduce((a, b) => a + b.length, 0) };
}
