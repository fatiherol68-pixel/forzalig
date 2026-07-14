// ForzaLig — Push Gönderme Edge Function
// Bir kullanıcıya (user_id) web-push bildirimi yollar: o kullanıcının
// push_abonelikleri tablosundaki tüm cihazlarına.
//
// KURULUM (kullanıcı bir kez yapar):
//  1) VAPID anahtar çifti üret:  npx web-push generate-vapid-keys
//  2) Supabase → Edge Functions → Secrets:
//       VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:...)
//     (SERVICE_ROLE_KEY ve SUPABASE_URL otomatik gelir)
//  3) Deploy:  supabase functions deploy push-gonder --no-verify-jwt
//     (verify-jwt kapalı: DB webhook JWT olmadan çağırabilsin. Kötüye
//      kullanımı önlemek için PUSH_SECRET kontrolü var — aşağıya bak.)
//  4) bildirimler tablosuna Database Webhook bağla (Supabase → Database →
//     Webhooks): INSERT olayında bu fonksiyonu çağırsın. Böylece her yeni
//     app-içi bildirim, otomatik telefon push'una da dönüşür.
//
// İKİ ÇAĞRI BİÇİMİ DE DESTEKLENİR:
//  A) Elle:   POST { "user_id": "...", "baslik": "...", "metin": "...", "link": "/" }
//  B) Webhook: POST { "type":"INSERT", "record": { user_id, baslik, metin, ... } }
//
// GÜVENLİK: PUSH_SECRET secret'ı ayarlıysa, gelen isteğin
//   x-push-secret header'ı bununla eşleşmek zorundadır (webhook header'ına ekle).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.7";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const SB_URL = Deno.env.get("SUPABASE_URL")!;
    const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const PUB = Deno.env.get("VAPID_PUBLIC_KEY");
    const PRIV = Deno.env.get("VAPID_PRIVATE_KEY");
    const SUBJ = Deno.env.get("VAPID_SUBJECT") || "mailto:info@forzalig.com";
    if (!PUB || !PRIV) {
      return new Response(JSON.stringify({ hata: "VAPID anahtarları ayarlı değil" }), {
        status: 500, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    webpush.setVapidDetails(SUBJ, PUB, PRIV);

    // Opsiyonel paylaşımlı sır: PUSH_SECRET ayarlıysa, gelen istek eşleşmeli.
    const SECRET = Deno.env.get("PUSH_SECRET");
    if (SECRET) {
      const gelen = req.headers.get("x-push-secret");
      if (gelen !== SECRET) {
        return new Response(JSON.stringify({ hata: "yetkisiz" }), {
          status: 401, headers: { ...cors, "Content-Type": "application/json" },
        });
      }
    }

    const govde = await req.json();
    // İki biçim: (A) elle {user_id,...}  (B) DB webhook {type,record:{...}}
    const kayit = govde && govde.record ? govde.record : govde;
    const user_id = kayit.user_id;
    const baslik = kayit.baslik;
    const metin = kayit.metin;
    // Webhook'ta düz "link" olmayabilir; link_tip/link_id'den kur, yoksa "/"
    const link = kayit.link || (kayit.link_tip ? "/?" + kayit.link_tip + "=" + (kayit.link_id || "") : "/");
    if (!user_id || !baslik) {
      return new Response(JSON.stringify({ hata: "user_id ve baslik zorunlu" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(SB_URL, SB_KEY);
    const { data: abonelikler, error: aboneErr } = await sb
      .from("push_abonelikleri")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", user_id);

    console.log("PUSH user_id:", user_id, "abonelik sayisi:", (abonelikler || []).length,
      "abone_hata:", aboneErr ? aboneErr.message : "yok");

    // Her bildirime BENZERSİZ etiket → iOS üst üste bindirmesin, ayrı ayrı görünsün.
    const etiket = kayit.id ? String(kayit.id) : ("fl-" + Date.now());
    const payload = JSON.stringify({ baslik, metin: metin || "", link: link || "/", tag: etiket });
    let gonderildi = 0, silindi = 0;
    const hatalar: any[] = [];

    for (const a of abonelikler || []) {
      try {
        await webpush.sendNotification(
          { endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } },
          payload
        );
        gonderildi++;
        console.log("  ✅ gonderildi endpoint:", (a.endpoint || "").slice(0, 50));
      } catch (e) {
        const code = (e as any)?.statusCode;
        const mesaj = (e as any)?.body || (e as any)?.message || String(e);
        hatalar.push({ code, mesaj: String(mesaj).slice(0, 200) });
        console.log("  ❌ HATA code:", code, "mesaj:", String(mesaj).slice(0, 200));
        // 404/410 → abonelik ölmüş, temizle
        if (code === 404 || code === 410) {
          await sb.from("push_abonelikleri").delete().eq("id", a.id);
          silindi++;
        }
      }
    }

    console.log("PUSH sonuc → gonderildi:", gonderildi, "silindi:", silindi, "hatalar:", JSON.stringify(hatalar));
    return new Response(JSON.stringify({ ok: true, gonderildi, silindi, hatalar }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ hata: String(e) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
