const babel=require('@babel/core');
const fs=require('fs');
const SRC='/home/user/forzalig/index.html';
const OUT=process.argv[2]||__dirname+'/compiled.html';
let src=fs.readFileSync(SRC,'utf8');
const startTag='<script type="text/babel">';
const i=src.indexOf(startTag);
if(i<0){ console.error('babel script bulunamadı'); process.exit(1); }
const codeStart=i+startTag.length;
const j=src.indexOf('</script>',codeStart);
const jsx=src.slice(codeStart,j);
console.log('JSX boyutu:', jsx.length);
// compact:true → boşlukları/satırları siler (minify). Anlamı değiştirmez.
const res=babel.transformSync(jsx,{presets:[['@babel/preset-react',{runtime:'classic'}]],compact:true,comments:false});
console.log('Derlenmiş boyut:', res.code.length);
// Uygulamayı DOMContentLoaded'da başlat → CDN kütüphaneleri (defer) yüklendikten SONRA çalışır.
const bootKod = '(function(){function __boot(){' + res.code + '}if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",__boot);}else{__boot();}})();';
let html = src.slice(0,i) + '<script>\n' + bootKod + '\n</script>' + src.slice(j+'</script>'.length);
// babel-standalone gerekmez (önceden derlendi)
html = html.replace(/<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/babel-standalone\/[^"]+"><\/script>\n?/,'');
html = html.replace(/<script src="https:\/\/unpkg\.com\/@babel\/standalone[^"]*"><\/script>\n?/,'');
// Kalan CDN kütüphanelerine defer ekle (React/ReactDOM/Chart/Supabase/qrcode) → render'ı bloklamaz.
// Uygulama DOMContentLoaded'da başladığı için defer'liler ondan ÖNCE çalışır, sıra garanti.
html = html.replace(/<script src="(https:\/\/(?:cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net)\/[^"]+)"><\/script>/g, '<script defer src="$1"></script>');
fs.writeFileSync(OUT,html);
// Service worker sürüm damgası: her derlemede değişir → istemciler "yeni sürüm" toast'ı görür
try{
  const surum=require('child_process').execSync('git -C /home/user/forzalig rev-parse --short HEAD').toString().trim()+'-'+Math.floor(Date.now()/1000);
  const swSrc=fs.readFileSync('/home/user/forzalig/sw.js','utf8').split('FL_SW_SURUM').join(surum); // TÜM geçişleri değiştir (yorumdaki dahil)
  fs.writeFileSync(__dirname+'/sw.compiled.js',swSrc);
  console.log('SW sürümü:',surum);
}catch(e){ console.error('SW damgalanamadı:',e.message); }
const deferSay=(html.match(/<script defer src="https:\/\/(?:cdnjs|cdn\.jsdelivr)/g)||[]).length;
console.log('Yazıldı:', OUT, '| html:', html.length, '| defer eklenen CDN:', deferSay, '| babel kaldı mı:', html.includes('babel-standalone')||html.includes('@babel/standalone'));
