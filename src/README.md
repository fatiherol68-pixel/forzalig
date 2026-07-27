# ForzaLig — modüler kaynak (src/)

**index.html ARTIK ÜRETİLEN DOSYADIR — elle düzenleme.** Kaynak gerçeği bu klasördeki parçalardır.

## Nasıl çalışır
- `src/manifest.json` parçaları SIRALI listeler.
- `node build/birlestir.js` → parçaları birleştirir, SHA-256 ile doğrular, `index.html` yazar.
- `node build/birlestir.js --kontrol` → sadece doğrular (yazmaz).
- Sonra mevcut akış aynen: `node build/derle.js` → `main` derli çıktı.

## Bayt-bayt garanti
Birleşim, modülerleştirme öncesi `index.html` ile **bayt-bayt aynı** olmalıdır
(`beklenenSha = 9f8b3f2bf6056f6a21061dd24d4f11d73a3836a5a5db3f51d7593cf1e208d727`). Eşleşmezse `birlestir.js` HATA verir ve dosyayı YAZMAZ.
Yani derleyicinin gördüğü girdi hiç değişmez → runtime davranışı birebir korunur.

## Düzenleme akışı
1. İlgili `src/**` parçasını düzenle.
2. `node build/birlestir.js` çalıştır (SHA artık DEĞİŞECEKTİR — beklenenSha'yı güncellemen gerekir;
   davranış değiştiren düzenleme kasıtlıysa bu normaldir).
3. `node build/derle.js` + duman testi.

FAZ: 1 · Adlandırılmış modül: 6 · Glue: 5 · Toplam parça: 11
