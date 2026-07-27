/* ForzaLig — KAYNAK BİRLEŞTİRİCİ (modüler kaynak → index.html)
 *
 * Modülerleştirme sonrası KAYNAK GERÇEĞİ artık src/ altındaki parçalardır.
 * index.html bu parçaların SIRALI BİRLEŞİMİDİR (üretilen dosya — elle düzenleme).
 * Bu betik parçaları birleştirir, SHA-256 ile bütünlüğü doğrular, index.html'i yazar.
 *
 * Davranışsal eşdeğerlik garantisi: birleşim, modülerleştirme öncesi index.html ile
 * BAYT BAYT AYNI olmalıdır (src/manifest.json içindeki beklenenSha). Eşleşmezse HATA verir
 * ve index.html'e YAZMAZ — böylece bozuk bir çıktı asla oluşmaz.
 *
 * Kullanım:  node build/birlestir.js            → doğrula + index.html yaz
 *            node build/birlestir.js --kontrol  → sadece doğrula (dosyaya yazma)
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const KOK = path.join(__dirname, '..');
const MANIFEST = path.join(KOK, 'src', 'manifest.json');
const HEDEF = path.join(KOK, 'index.html');
const sadeceKontrol = process.argv.includes('--kontrol');

if (!fs.existsSync(MANIFEST)) {
  console.error('HATA: src/manifest.json bulunamadı. Önce dilimleme yapılmalı.');
  process.exit(1);
}
const man = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));

let birlesim = '';
for (const rel of man.parcalar) {
  const p = path.join(KOK, rel);
  if (!fs.existsSync(p)) { console.error('HATA: parça eksik:', rel); process.exit(1); }
  birlesim += fs.readFileSync(p, 'utf8'); // UTF-8 round-trip bayt-korumalı (BOM yok, geçerli UTF-8)
}

const sha = crypto.createHash('sha256').update(birlesim, 'utf8').digest('hex');
console.log('Parça sayısı :', man.parcalar.length);
console.log('Birleşim SHA :', sha);
console.log('Beklenen SHA :', man.beklenenSha);

if (man.beklenenSha && sha !== man.beklenenSha) {
  console.error('\n🔴 SHA UYUŞMUYOR — birleşim baseline ile bayt-bayt aynı DEĞİL. index.html YAZILMADI.');
  process.exit(2);
}

if (sadeceKontrol) {
  console.log('\n🟢 KONTROL PASS — birleşim baseline ile bayt-bayt aynı (dosyaya yazılmadı).');
  process.exit(0);
}

fs.writeFileSync(HEDEF, birlesim);
// Yazılan dosyayı geri oku + doğrula (paranoyak bütünlük kontrolü)
const geri = crypto.createHash('sha256').update(fs.readFileSync(HEDEF, 'utf8'), 'utf8').digest('hex');
if (geri !== sha) { console.error('🔴 YAZIM DOĞRULAMA HATASI'); process.exit(3); }
console.log('\n🟢 index.html yazıldı ve doğrulandı (bayt-bayt baseline ile aynı).');
