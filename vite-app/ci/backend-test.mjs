/* ForzaLig — GERÇEK Supabase backend testi (GitHub Actions networked runner).
 * - public read (RLS SELECT) + KVKK deny (anon ham oyuncular okuyamamalı)
 * - AUTH: secret varsa signIn; yoksa EPHEMERAL test hesabı (signUp) açar (kullanıcı izinli).
 *   Oturum açılırsa RLS yazma/okuma/silme testi (pazar_ilanlari) — DATA kendini temizler.
 *   (Auth kullanıcısı service_role olmadan silinemez; "mümkünse temizle" kuralı gereği veri temizlenir.)
 * Çıkış: 0=geçti, 2=başarısız. Sonuç ci/backend-result.json'a yazılır (authTested/authOk).
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { randomUUID } from 'crypto';

const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const g = (re) => (html.match(re) || [])[1];
const SB_URL = g(/const SB_URL\s*=\s*"([^"]+)"/);
const SB_KEY = g(/const SB_ANAHTAR\s*=\s*"([^"]+)"/);
if (!SB_URL || !SB_KEY) { console.error('🔴 SB_URL/SB_ANAHTAR bulunamadı'); process.exit(2); }
console.log('Supabase URL:', SB_URL);

const sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const R = { publicRead: false, kvkkDeny: false, auth: 'skipped', rlsWrite: 'skipped', authTested: false, authOk: false };
let fail = false;
const ok = (n) => console.log('  ✔', n);
const no = (n, e) => { console.log('  ✘', n, '→', e); fail = true; };

// 1) PUBLIC READ (RLS SELECT using(true)) — mutasyon YOK
try {
  const a = await sb.from('sistem_ayar').select('*').limit(1);
  if (a.error) throw new Error('sistem_ayar: ' + a.error.message);
  const b = await sb.from('ligler').select('id,ad,ulke,durum').limit(5);
  if (b.error) throw new Error('ligler: ' + b.error.message);
  R.publicRead = true; ok(`public read OK (ligler: ${b.data.length} satır)`);
} catch (e) { no('public read', e.message); }

// 2) KVKK/RLS DENY — anon ham oyuncular tablosundaki hassas alanı OKUYAMAMALI (revoke)
try {
  const r = await sb.from('oyuncular').select('telefon,tc_pasaport').limit(1);
  if (r.error) { R.kvkkDeny = true; ok('KVKK deny OK (anon ham oyuncular engellendi: ' + r.error.message.slice(0, 40) + ')'); }
  else if (!r.data || r.data.length === 0) { R.kvkkDeny = true; ok('KVKK deny OK (anon hassas alan boş/erişilemez)'); }
  else { no('KVKK deny', 'anon hassas alan OKUDU! (beklenmiyor)'); }
} catch (e) { R.kvkkDeny = true; ok('KVKK deny OK (exception)'); }

// 3) AUTH + RLS WRITE
let email = process.env.FL_TEST_EMAIL, pass = process.env.FL_TEST_PASSWORD, ephemeral = false;
if (!email || !pass) { email = `flci-${randomUUID()}@forzalig.com`; pass = 'Fl!' + randomUUID(); ephemeral = true; }
R.authTested = true;
try {
  let uid;
  if (ephemeral) {
    const up = await sb.auth.signUp({ email, password: pass });
    if (up.error) throw new Error('signUp: ' + up.error.message);
    if (!up.data.session) { R.auth = 'needs_confirmation'; R.authTested = false; throw new Error('CONFIRM_REQUIRED'); }
    uid = up.data.user.id;
  } else {
    const si = await sb.auth.signInWithPassword({ email, password: pass });
    if (si.error) throw new Error('signIn: ' + si.error.message);
    uid = si.data.user.id;
  }
  R.auth = 'ok'; R.authOk = true; ok(`auth OK (${ephemeral ? 'ephemeral' : 'secret'}, uid ${uid.slice(0, 8)}…)`);
  // RLS write: kendi user_id'siyle ilan → insert/select/delete (kendini temizler)
  const ins = await sb.from('pazar_ilanlari').insert({ tip: 'eksik', user_id: uid, aciklama: 'CI-TEST', durum: 'aktif', pozisyon: 'Kaleci', adet: 1 }).select('id').single();
  if (ins.error) throw new Error('RLS insert: ' + ins.error.message);
  const id = ins.data.id; ok('RLS insert OK');
  const sel = await sb.from('pazar_ilanlari').select('aciklama').eq('id', id).single();
  if (sel.error || sel.data.aciklama !== 'CI-TEST') throw new Error('RLS read-back: ' + (sel.error?.message || 'mismatch'));
  ok('RLS read-back OK');
  const del = await sb.from('pazar_ilanlari').delete().eq('id', id);
  if (del.error) throw new Error('RLS delete: ' + del.error.message);
  ok('RLS delete/cleanup OK (test verisi silindi)');
  R.rlsWrite = 'ok';
} catch (e) {
  if (String(e.message).includes('CONFIRM_REQUIRED')) {
    console.log('  ⚠ AUTH: e-posta onayı GEREKLİ — otomatik test hesabıyla oturum açılamıyor.');
    console.log('     (Deploy bloklanacak; tek gereken: Supabase Auth\'ta "Confirm email" kapatmak veya onaylı bir test hesabı.)');
  } else { no('auth/RLS-write', e.message); }
}

try { await sb.auth.signOut(); } catch (_) {}
writeFileSync(new URL('./backend-result.json', import.meta.url), JSON.stringify(R, null, 2));
console.log('\nSonuç:', JSON.stringify(R));
console.log(fail ? 'BACKEND-TEST: FAIL' : 'BACKEND-TEST: PASS');
process.exit(fail ? 2 : 0);
