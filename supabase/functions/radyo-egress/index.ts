// ============================================================================
// ForzaLig — radyo-egress (OPSİYONEL) : aylık trafik/egress
// ----------------------------------------------------------------------------
// Neden Edge Function: egress (trafik) bir FATURA metriğidir, veritabanında
//   yoktur → Supabase Management API'den okunur; bu da bir PAT (kişisel erişim
//   token'ı) ister. PAT gibi sırlar ASLA frontend'e konmaz → burada, server-side
//   secret olarak durur. Çağıranın süper admin olduğu ayrıca doğrulanır.
//
// KURULUM (opsiyonel — sadece egress rakamı istiyorsan):
//   1) Supabase CLI:  supabase functions deploy radyo-egress
//   2) Secret'lar:
//        supabase secrets set SB_MGMT_TOKEN=sbp_xxx   # Supabase Hesap → Access Tokens
//        supabase secrets set SB_PROJECT_REF=xxxx     # proje ref (URL'deki kısa kod)
//   (SUPABASE_URL / SUPABASE_ANON_KEY otomatik gelir.)
//   Kurmazsan sorun yok: Depolama kartı egress'i "—" gösterir, gerisi çalışır.
// ============================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    // 1) çağıranı doğrula (kendi JWT'siyle) + süper admin mi?
    const authz = req.headers.get("Authorization") || "";
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authz } } },
    );
    const { data: u } = await sb.auth.getUser();
    if (!u?.user) return json({ hata: "oturum yok" }, 401);
    const { data: adm } = await sb.from("adminler").select("user_id").eq("user_id", u.user.id).maybeSingle();
    if (!adm) return json({ hata: "yetki yok" }, 403);

    // 2) secret yoksa nazikçe null dön (UI '—' gösterir)
    const token = Deno.env.get("SB_MGMT_TOKEN");
    const ref = Deno.env.get("SB_PROJECT_REF");
    if (!token || !ref) return json({ egressBytes: null, not: "SB_MGMT_TOKEN/SB_PROJECT_REF secret yok" });

    // 3) Management API → proje kullanımı (egress alanı sürüme göre değişebilir → birkaç olası alanı dene)
    const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/usage`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return json({ egressBytes: null, not: "management api " + r.status });
    const j: any = await r.json();
    const egressBytes =
      j?.db_egress?.usage ?? j?.total_egress?.usage ?? j?.egress?.usage ??
      j?.db_egress ?? j?.total_egress ?? null;

    return json({ egressBytes, kaynak: "management-api" });
  } catch (e) {
    return json({ egressBytes: null, hata: String(e) }, 200);
  }
});
