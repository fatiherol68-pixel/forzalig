// ForzaLig — Push Gönderme Edge Function
// Bir kullanıcıya (user_id) web-push bildirimi yollar: o kullanıcının
// push_abonelikleri tablosundaki tüm cihazlarına.
//
// KURULUM (kullanıcı bir kez yapar):
//  1) VAPID anahtar çifti üret:  npx web-push generate-vapid-keys
//  2) Supabase → Edge Functions → Secrets:
//       VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:...)
//     (SERVICE_ROLE_KEY ve SUPABASE_URL otomatik gelir)
//  3) Deploy:  supabase functions deploy push-gonder
//  4) İstersen: bildirimler tablosuna bir DB webhook / trigger bağla →
//     yeni bildirim eklenince bu fonksiyonu çağırsın. (Opsiyonel;
//     app-içi bildirim zaten çalışır, bu sadece telefon push'u içindir.)
//
// Çağrı örneği (server-to-server, Authorization: Bearer <service_role>):
//   POST { "user_id": "...", "baslik": "...", "metin": "...", "link": "/" }

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

    const { user_id, baslik, metin, link } = await req.json();
    if (!user_id || !baslik) {
      return new Response(JSON.stringify({ hata: "user_id ve baslik zorunlu" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(SB_URL, SB_KEY);
    const { data: abonelikler } = await sb
      .from("push_abonelikleri")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", user_id);

    const payload = JSON.stringify({ baslik, metin: metin || "", link: link || "/" });
    let gonderildi = 0, silindi = 0;

    for (const a of abonelikler || []) {
      try {
        await webpush.sendNotification(
          { endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } },
          payload
        );
        gonderildi++;
      } catch (e) {
        // 404/410 → abonelik ölmüş, temizle
        const code = (e as any)?.statusCode;
        if (code === 404 || code === 410) {
          await sb.from("push_abonelikleri").delete().eq("id", a.id);
          silindi++;
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, gonderildi, silindi }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ hata: String(e) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
