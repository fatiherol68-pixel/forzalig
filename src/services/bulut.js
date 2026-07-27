const Bulut = {
  async yukle(userId){
    if(!sb) return null;
    try{
      const {data,error}=await sb.from('kullanici_veri').select('veri,updated_at').eq('user_id',userId).maybeSingle();
      if(error){ console.warn('Bulut.yukle:',error.message); return null; }
      return data ? {veri:data.veri, zaman:data.updated_at} : {veri:null, zaman:null};
    }catch(e){ console.warn('Bulut.yukle:',e); return null; }
  },
  async buluttakiZaman(userId){
    if(!sb) return null;
    try{ const {data}=await sb.from('kullanici_veri').select('updated_at').eq('user_id',userId).maybeSingle(); return data?data.updated_at:null; }
    catch(e){ return null; }
  },
  // güvenli kaydet: beklenen zamanla bulut zamanı uyuşmuyorsa ÇAKIŞMA döner (üzerine yazma!)
  async kaydetGuvenli(userId, veri, beklenen){
    if(!sb) return {hata:"bağlantı yok"};
    try{
      const suanki = await this.buluttakiZaman(userId);
      if(beklenen && suanki && suanki !== beklenen) return {catisma:true, suankiZaman:suanki};
      const zaman = new Date().toISOString();
      const {error}=await sb.from('kullanici_veri').upsert({user_id:userId, veri, updated_at:zaman});
      if(error){ console.warn('Bulut.kaydet:',error.message); return {hata:error.message}; }
      return {ok:true, zaman};
    }catch(e){ return {hata:String(e)}; }
  },
  // koşulsuz kaydet ("benimkini yaz" seçilince)
  async kaydet(userId, veri){
    if(!sb) return false;
    try{
      const {error}=await sb.from('kullanici_veri').upsert({user_id:userId, veri, updated_at:new Date().toISOString()});
      if(error){ console.warn('Bulut.kaydet:',error.message); return false; }
      return true;
    }catch(e){ console.warn('Bulut.kaydet:',e); return false; }
  },
};
/* Paylaşım — herkese açık ligler + oyuncu sahiplenme (kariyer) */
function slugUret(ad){
  const tr={ç:'c',ğ:'g',ı:'i',ö:'o',ş:'s',ü:'u',Ç:'c',Ğ:'g',İ:'i',Ö:'o',Ş:'s',Ü:'u'};
  let s=(ad||'lig').split('').map(c=>tr[c]||c).join('').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40);
  return (s||'lig');
}
/* Paylaşımda kişisel/gizli alanları temizle (KVKK) — dışarıya sadece futbol verisi */
function paylasimIcinTemizle(turnuva){
  let k; try{ k=JSON.parse(JSON.stringify(turnuva)); }catch(e){ return turnuva; }
  (k.takimlar||[]).forEach(tk=>{
    delete tk.lisNo;
    (tk.oyuncular||[]).forEach(o=>{ delete o.dogum; delete o.lisNo; delete o.boy; delete o.kilo; delete o.uyruk; });
  });
  return k;
}
