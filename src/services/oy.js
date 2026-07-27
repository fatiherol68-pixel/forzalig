const Oy = {
  async oyla(ligSlug, macId, oyverenId, secilen){
    if(!sb) return {hata:"Bağlantı yok"};
    try{
      const {error}=await sb.from('mac_oylari').upsert(
        {lig_slug:ligSlug, mac_id:macId, oyveren_id:oyverenId, secilen_id:secilen.id, secilen_ad:secilen.ad, created:new Date().toISOString()},
        {onConflict:'lig_slug,mac_id,oyveren_id'});
      if(error){ console.warn('Oy.oyla:',error.message); return {hata:error.message}; }
      return {ok:true};
    }catch(e){ return {hata:String(e&&e.message||e)}; }
  },
  async oylar(ligSlug, macId){
    if(!sb) return [];
    try{ const {data,error}=await sb.from('mac_oylari').select('secilen_id,secilen_ad,oyveren_id').eq('lig_slug',ligSlug).eq('mac_id',macId);
      if(error){ console.warn('Oy.oylar:',error.message); return []; } return data||[]; }
    catch(e){ return []; }
  },
};
/* FAZ 13 — Süper Admin (sadece IZINLI_MAILLER) */
