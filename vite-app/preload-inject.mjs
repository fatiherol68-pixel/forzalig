// Kritik JS parçalarını (app-body + vendor) shell <head>'ine modulepreload olarak ekler.
// Neden: index giriş parçası app-body'yi DİNAMİK import ediyor → seri şelale (app-body ancak index çalışınca inmeye başlar).
// modulepreload ile paralel iner → uygulama ~350ms erken çalışır → LCP düşer. Görsel/işlev DEĞİŞMEZ (yalnız indirme ipucu).
import fs from 'fs';
const dist='dist';
// Kendi sunucumuzda barındırılan 3. taraf scriptleri (jsDelivr yerine) → dist/assets'e kopyala.
// Böylece /assets/supabase.min.js aynı kökenden gelir (hızlı + Cloudflare 1-yıl cache kuralı kapsar) ve
// Lighthouse "3. taraf / verimsiz cache" uyarısından çıkar. Sürüm sabit (npm pack ile alındı).
try {
  for (const f of ['supabase-2.74.0.min.js', 'qrcode-1.4.4.min.js']) {
    if (fs.existsSync('vendored/' + f)) fs.copyFileSync('vendored/' + f, dist + '/assets/' + f);
  }
  console.log('vendored (supabase/qrcode) dist/assets\'e kopyalandi');
} catch (e) { console.warn('vendored kopyalama atlandi:', e.message); }
const p=dist+'/index.html';
let html=fs.readFileSync(p,'utf8');
if(html.includes('rel="modulepreload"')){ console.log('modulepreload zaten var, atlandı'); process.exit(0); }
const assets=fs.readdirSync(dist+'/assets');
const ab=assets.find(f=>/^app-body-.*\.js$/.test(f));
const vn=assets.find(f=>/^vendor-.*\.js$/.test(f));
if(!ab||!vn){ console.log('parça bulunamadı, atlandı'); process.exit(0); }
const inj=`<link rel="modulepreload" crossorigin href="/assets/${ab}"><link rel="modulepreload" crossorigin href="/assets/${vn}">`;
html=html.replace('<script type="module" crossorigin src="/assets/', inj+'\n<script type="module" crossorigin src="/assets/');
fs.writeFileSync(p,html);
console.log('modulepreload eklendi:', ab, vn);
