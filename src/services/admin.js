const Admin = {
  async ligler(){ // tüm herkese açık ligler (detaylı)
    if(!sb) return [];
    try{ const {data,error}=await sb.from('paylasilan_ligler').select('slug,ad,sehir,sahip_id,guncelleme').order('guncelleme',{ascending:false}).limit(500);
      if(error){ console.warn('Admin.ligler:',error.message); return []; } return data||[]; }
    catch(e){ return []; }
  },
  async ligSil(slug){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.from('paylasilan_ligler').delete().eq('slug',slug); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  async yetkiListe(){ if(!sb) return []; try{ const {data,error}=await sb.from('yetkiler').select('*').order('created',{ascending:false}); return error?[]:(data||[]); }catch(e){ return []; } },
  async yetkiEkle(email, tip){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.from('yetkiler').upsert({email:(email||"").trim().toLowerCase(), tip:tip||"onayli", created:new Date().toISOString()},{onConflict:'email'}); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  async yetkiSil(email){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.from('yetkiler').delete().eq('email',email); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
};
/* ============================================================
   FAZ 14 (İLİŞKİSEL) — Db: yeni tablolarla konuşan veri katmanı
   supabase/01_sema.sql ... 04_ilk_admin.sql çalıştırılınca aktif olur.
   Tüm yetki SUNUCUDA (RLS) kontrol edilir; burası sadece çağırır.
   ============================================================ */
/* "GG.AA.YYYY" -> "YYYY-MM-DD" (SQL date) */
function tarihISO(d){ if(!d||typeof d!=="string") return null; const p=d.split("."); if(p.length!==3) return null; const [g,a,y]=p; if(!y||y.length<4) return null; return y+"-"+String(a).padStart(2,"0")+"-"+String(g).padStart(2,"0"); }
/* ISO/tarih -> yaş */
function yasHesap(d){ if(!d) return null; try{ const t=new Date(d); if(isNaN(t)) return null; const f=new Date(); let y=f.getFullYear()-t.getFullYear(); const m=f.getMonth()-t.getMonth(); if(m<0||(m===0&&f.getDate()<t.getDate())) y--; return y; }catch(e){ return null; } }
