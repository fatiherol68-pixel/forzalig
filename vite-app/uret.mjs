/* Faz 5 — Vite/ESM entry ÜRETİCİ (paralel; mevcut sisteme DOKUNMAZ).
 * Kaynak gerçeği hâlâ ../index.html + ../src/. Bu betik ondan türetir:
 *   src/main.jsx      → minik giriş: splash + dinamik import (lazy)
 *   src/app-body.jsx  → React ESM + rarity + tüm uygulama kodu (ayrı chunk)
 *   src/styles.css    → core.css + flkart.css
 * Kullanım: node uret.mjs   (sonra: npm i && npm run build)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const VITE = path.dirname(fileURLToPath(import.meta.url));
const KOK = path.join(VITE, '..');
const h = fs.readFileSync(path.join(KOK, 'index.html'), 'utf8');

const startTag = '<script type="text/babel">';
const i = h.indexOf(startTag);
const codeStart = i + startTag.length;
const j = h.indexOf('</script>', codeStart);
const appKod = h.slice(codeStart, j);

const core = fs.readFileSync(path.join(KOK, 'src/styles/core.css'), 'utf8');
const flk  = fs.readFileSync(path.join(KOK, 'src/styles/flkart.css'), 'utf8');
const rarity = fs.readFileSync(path.join(KOK, 'src/lib/rarity.js'), 'utf8');

fs.mkdirSync(path.join(VITE, 'src'), { recursive: true });
fs.writeFileSync(path.join(VITE, 'src/styles.css'), core + '\n' + flk);

fs.writeFileSync(path.join(VITE, 'src/main.jsx'),
`import './styles.css';
const _el = document.getElementById('root');
if (_el) _el.innerHTML = '<div style="position:fixed;inset:0;display:grid;place-items:center;background:#070B12;color:#00E5FF;font-family:system-ui;font-weight:800">ForzaLig yükleniyor…</div>';
import('./app-body.jsx');   // dinamik import → ayrı async chunk (lazy)
`);

fs.writeFileSync(path.join(VITE, 'src/app-body.jsx'),
`import React from 'react';
import * as ReactDOMClient from 'react-dom/client';
const ReactDOM = ReactDOMClient;
if (typeof window !== 'undefined') { window.React = React; window.ReactDOM = ReactDOM; }

// ---- flkart-js (rarity) global yardımcıları ----
${rarity}

// ==================== ForzaLig uygulama kodu (index.html babel bloğu) ====================
${appKod}
`);

console.log('vite-app/src üretildi · appKod:', appKod.length, '· css:', (core + flk).length);
