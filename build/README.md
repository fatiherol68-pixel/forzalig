# ForzaLig — Derleme (build)

`index.html` içindeki `<script type="text/babel">` kaynağı, yayına çıkmadan önce
Babel ile derlenir + küçültülür (minify) + CDN kütüphaneleri `defer` yapılır +
uygulama `DOMContentLoaded`'da başlatılır. Bu, açılış hızını artırır.

## Kullanım
```
node build/derle.js cikti.html
```
Çıktı (varsayılan `compiled.html`) `main` dalına `index.html` olarak kopyalanır.
`main` = GitHub Pages'in yayınladığı derlenmiş sürüm. Kaynak (okunabilir) bu daldadır.

Gereken paket: `@babel/core` + `@babel/preset-react`.
