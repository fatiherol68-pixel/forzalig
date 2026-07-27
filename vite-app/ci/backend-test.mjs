/* ForzaLig — GERÇEK Supabase backend testi (GitHub Actions networked runner).
 * Kimlik bilgisi (FL_TEST_EMAIL/FL_TEST_PASSWORD secret) VARSA: gerçek login + RLS
 * yazma/okuma/silme (kendini temizler). YOKSA: auth adımı 'atlandı' işaretlenir
 * (prod auth tablosunu kirletmemek için throwaway kullanıcı AÇMAYIZ).
 * Çıkış kodu: 0 = geçti; 2 = başarısız. authTested/authOk sonuçları JSON'a yazılır.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';

const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const g = (re) => (html.match(re) || [])[1];
const SB_URL = g(/const SB_URL\s*=\s*"([^"]+)"/);
const SB_KEY = g(/const SB_ANAHTAR\s*=\s*"([^"]+)"/);
if (!SB_URL || !SB_KEY) { console.error('🔴 SB_URL/SB_ANAHTAR index.html\'de bulunamadı'); process.exit(2); }
console.log('Supabase URL:', SB_URL);

const sb = createClient(SB_URL, SB_KEY);
const sonuc = { publicRead: false, auth: 'skipped', rlsWrite: 'skipped', authTested: false };
let fail = false;
const ok = (n) => console.log('  ✔', n);
const no = (n, e) => { console.log('  ✘', n, '→', e); fail = true; };

// 1) PUBLIC READ (RLS SELECT using(true)) — bağlantı + okuma, mutasyon YOK
try {
  const r1 = await sb.from('sistem_ayar').select('*').limit(1);
  if (r1.error) throw new Error('sistem_ayar: ' + r1.error.message);
  const r2 = await sb.from('ligler').select('id,ad,ulke,durum').limit(5);
  if (r2.error) throw new Error('ligler: ' + r2.error.message);
  sonuc.publicRead = true;
  ok(`public read OK (ligler: ${r2.data.length} satır, sistem_ayar erişildi)`);
} catch (e) { no('public read', e.message); }

// 2) AUTH + RLS WRITE (yalnız secret varsa) — pazar_ilanlari insert→select→delete (kendini temizler)
const EMAIL = process.env.FL_TEST_EMAIL, PASS = process.env.FL_TEST_PASSWORD;
if (EMAIL && PASS) {
  sonuc.authTested = true;
  try {
    const a = await sb.auth.signInWithPassword({ email: EMAIL, password: PASS });
    if (a.error) throw new Error('login: ' + a.error.message);
    const uid = a.data.user?.id;
    if (!uid) throw new Error('login: session yok');
    sonuc.auth = 'ok'; ok(`login OK (uid ${uid.slice(0, 8)}…)`);
    // RLS write: kendi user_id'siyle ilan → RLS insert with check(user_id=auth.uid())
    const ins = await sb.from('pazar_ilanlari').insert({ tip: 'eksik', user_id: uid, aciklama: 'CI-TEST', durum: 'aktif', pozisyon: 'Kaleci', adet: 1 }).select('id').single();
    if (ins.error) throw new Error('RLS insert: ' + ins.error.message);
    const id = ins.data.id; ok('RLS insert OK (id ' + String(id).slice(0, 8) + '…)');
    const sel = await sb.from('pazar_ilanlari').select('id,aciklama').eq('id', id).single();
    if (sel.error || sel.data.aciklama !== 'CI-TEST') throw new Error('RLS read-back: ' + (sel.error?.message || 'mismatch'));
    ok('RLS read-back OK');
    const del = await sb.from('pazar_ilanlari').delete().eq('id', id);
    if (del.error) throw new Error('RLS delete/cleanup: ' + del.error.message);
    ok('RLS delete/cleanup OK (test verisi silindi)');
    sonuc.rlsWrite = 'ok';
  } catch (e) { sonuc.auth = 'fail'; no('auth/RLS-write', e.message); }
} else {
  console.log('  ⚠ AUTH TESTİ ATLANDI — FL_TEST_EMAIL/FL_TEST_PASSWORD secret yok (prod auth kirletilmedi).');
}

writeFileSync(new URL('./backend-result.json', import.meta.url), JSON.stringify(sonuc, null, 2));
console.log('\nSonuç:', JSON.stringify(sonuc));
console.log(fail ? 'BACKEND-TEST: FAIL' : 'BACKEND-TEST: PASS');
process.exit(fail ? 2 : 0);
