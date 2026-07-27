const Paylas = {
  // ligi herkese aç (yayınla) — slug döner
  async yayinla(userId, turnuva){
    if(!sb) return {hata:"Bağlantı yok"};
    const slug = (turnuva.paylasimSlug) || (slugUret(turnuva.ad)+'-'+String(turnuva.id||0));
    try{
      const {error}=await sb.from('paylasilan_ligler').upsert({
        slug, sahip_id:userId, ad:turnuva.ad, sehir:turnuva.sehir||'', veri:paylasimIcinTemizle(turnuva), guncelleme:new Date().toISOString()
      });
      if(error){ console.warn('Paylas.yayinla:',error.message); return {hata:error.message}; }
      return {slug};
    }catch(e){ console.warn('Paylas.yayinla:',e); return {hata:String(e&&e.message||e)}; }
  },
  async kaldir(slug){
    if(!sb||!slug) return false;
    try{ const {error}=await sb.from('paylasilan_ligler').delete().eq('slug',slug); return !error; }
    catch(e){ return false; }
  },
  async getir(slug){ // herkese açık: girişsiz okunur
    if(!sb||!slug) return null;
    try{ const {data,error}=await sb.from('paylasilan_ligler').select('veri').eq('slug',slug).maybeSingle();
      if(error){ console.warn('Paylas.getir:',error.message); return null; } return data?data.veri:null; }
    catch(e){ console.warn('Paylas.getir:',e); return null; }
  },
  async liste(){ // keşfet: tüm açık ligler
    if(!sb) return [];
    try{ const {data,error}=await sb.from('paylasilan_ligler').select('slug,ad,sehir,guncelleme').order('guncelleme',{ascending:false}).limit(100);
      if(error){ console.warn('Paylas.liste:',error.message); return []; } return data||[]; }
    catch(e){ return []; }
  },
  // oyuncu sahiplenme (kariyer)
  async sahiplen(userId, kayit){ // kayit: {oyuncu_ad, oyuncu_id, lig_slug, lig_ad}
    if(!sb) return false;
    try{ const {error}=await sb.from('sahiplenmeler').upsert({user_id:userId, ...kayit, created:new Date().toISOString()});
      return !error; }catch(e){ return false; }
  },
  async sahiplenmem(userId){
    if(!sb||!userId) return null;
    try{ const {data,error}=await sb.from('sahiplenmeler').select('*').eq('user_id',userId).maybeSingle();
      if(error) return null; return data||null; }catch(e){ return null; }
  },
  async sahiplenmeKaldir(userId){
    if(!sb||!userId) return false;
    try{ const {error}=await sb.from('sahiplenmeler').delete().eq('user_id',userId); return !error; }catch(e){ return false; }
  },
};
/* FAZ 10 — Maçın Adamı (MVP) oylaması */
