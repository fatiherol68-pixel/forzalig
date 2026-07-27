const Db = {
  hazir(){ return !!sb; },
  // ---- Admin & Yetki ----
  async adminMi(userId){
    if(!sb||!userId) return false;
    try{ const {data}=await sb.from('adminler').select('user_id').eq('user_id',userId).maybeSingle(); return !!data; }
    catch(e){ return false; }
  },
  async adminListe(){ if(!sb) return []; try{ const {data}=await sb.from('adminler').select('user_id,eklenme'); return data||[]; }catch(e){ return []; } },
  // GLOBAL SİTE GÖRÜNÜMÜ — herkes okur, sadece süper admin yazar
  async siteGorunum(){ if(!sb) return null; try{ const {data}=await sb.from('site_ayar').select('stil_key,renk_key').eq('id',1).maybeSingle(); return data||null; }catch(e){ return null; } },
  async siteGorunumKaydet(stil, renk, userId){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.from('site_ayar').update({stil_key:stil, renk_key:renk||"", guncelleyen:userId||null, guncelleme:new Date().toISOString()}).eq('id',1); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  // FAZ 3 — Kullanıcı yasaklama
  async yasakla(userId, sebep, byId){ if(!sb||!userId) return {hata:"yok"}; try{ const {error}=await sb.from('yasaklilar').upsert({user_id:userId, sebep:sebep||null, yasaklayan:byId||null, tarih:new Date().toISOString()},{onConflict:'user_id'}); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  async yasakKaldir(userId){ if(!sb||!userId) return {hata:"yok"}; try{ const {error}=await sb.from('yasaklilar').delete().eq('user_id',userId); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  async yasakliListe(){ if(!sb) return []; try{ const {data}=await sb.from('yasaklilar').select('user_id,sebep,tarih'); return data||[]; }catch(e){ return []; } },
  async yasakliMi(userId){ if(!sb||!userId) return false; try{ const {data}=await sb.from('yasaklilar').select('user_id').eq('user_id',userId).maybeSingle(); return !!data; }catch(e){ return false; } },
  // FAZ 4 — Hata / çökme log
  async hataKaydet(mesaj, sayfa, userId){ if(!sb||!mesaj) return; try{ await sb.from('hata_log').insert({mesaj:String(mesaj).slice(0,2000), sayfa:sayfa||null, user_id:userId||null, cihaz:((navigator&&navigator.userAgent)||"").slice(0,200)}); }catch(e){} },
  async hataListe(){ if(!sb) return []; try{ const {data}=await sb.from('hata_log').select('id,mesaj,sayfa,user_id,cihaz,olusma').order('olusma',{ascending:false}).limit(50); return data||[]; }catch(e){ return []; } },
  async hataTemizle(){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.from('hata_log').delete().gte('olusma','1970-01-01'); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  // YARDIMCI (YEDEK) LİG YÖNETİCİSİ
  async yardimciLiglerim(userId){ if(!sb||!userId) return []; try{ const {data}=await sb.from('lig_yardimci').select('lig_id').eq('user_id',userId); return (data||[]).map(x=>x.lig_id); }catch(e){ return []; } },
  async yardimciListe(ligId){ if(!sb||!ligId) return []; try{ const {data}=await sb.from('lig_yardimci').select('user_id,tarih').eq('lig_id',ligId); const ids=(data||[]).map(x=>x.user_id); if(!ids.length) return []; const {data:pr}=await sb.from('profiller').select('user_id,email,ad').in('user_id',ids); const m={}; (pr||[]).forEach(p=>{ m[p.user_id]=p; }); return (data||[]).map(x=>({user_id:x.user_id, email:(m[x.user_id]&&m[x.user_id].email)||x.user_id, ad:(m[x.user_id]&&m[x.user_id].ad)||null, tarih:x.tarih})); }catch(e){ return []; } },
  async yardimciEkle(ligId, email){ if(!sb) return {hata:"yok"}; try{ const pr=await Db.profilBul((email||"").trim().toLowerCase()); if(!pr||!pr.user_id) return {hata:"Bu e-postayla üye bulunamadı — kişi önce uygulamaya üye olmalı."}; let ekleyen=null; try{ const u=(await sb.auth.getUser()).data.user; ekleyen=u?u.id:null; }catch(e){} const {error}=await sb.from('lig_yardimci').insert({lig_id:ligId, user_id:pr.user_id, ekleyen}); if(error){ if(/duplicate|unique/i.test(error.message)) return {hata:"Bu kişi zaten yardımcı yönetici."}; return {hata:error.message}; } return {ok:true, user_id:pr.user_id, ad:pr.ad, email:pr.email}; }catch(e){ return {hata:String(e)}; } },
  async yardimciKaldir(ligId, userId){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.from('lig_yardimci').delete().eq('lig_id',ligId).eq('user_id',userId); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  async tumYardimcilar(){ if(!sb) return []; try{ const {data}=await sb.from('lig_yardimci').select('lig_id,user_id,tarih'); if(!data||!data.length) return []; const ligIds=[...new Set(data.map(x=>x.lig_id))]; const userIds=[...new Set(data.map(x=>x.user_id))]; const [lr,pr]=await Promise.all([ sb.from('ligler').select('id,ad').in('id',ligIds), sb.from('profiller').select('user_id,email,ad').in('user_id',userIds) ]); const lm={}; ((lr&&lr.data)||[]).forEach(l=>{ lm[l.id]=l.ad; }); const pm={}; ((pr&&pr.data)||[]).forEach(p=>{ pm[p.user_id]=p; }); return data.map(x=>({ lig_id:x.lig_id, ligAd:lm[x.lig_id]||"(lig)", user_id:x.user_id, email:(pm[x.user_id]&&pm[x.user_id].email)||x.user_id, ad:(pm[x.user_id]&&pm[x.user_id].ad)||null, tarih:x.tarih })); }catch(e){ return []; } },
  // ---- Faz 4: Operasyon Merkezi (gerçek metrikler) + Bakım ----
  async benBuradayim(){ if(!sb) return; try{ await sb.rpc('ben_buradayim'); }catch(e){} },
  async panelMetrikler(){ if(!sb) return null; try{ const {data}=await sb.rpc('panel_metrikler'); return data||null; }catch(e){ return null; } },
  // Operasyon Merkezi ek veri: canlı akış + trafik + trendler (mevcut tablolardan, tek seferde). ÜCRETSİZ.
  async operasyonEk(){
    if(!sb) return null;
    try{
      const gun1=new Date(Date.now()-86400000).toISOString();
      const gun7=new Date(Date.now()-7*86400000).toISOString();
      const [akisR, pvR, yeniR, hataR] = await Promise.all([
        sb.from('olay_log').select('tip,deger,user_id,created').order('created',{ascending:false}).limit(18),
        sb.from('olay_log').select('*',{count:'exact',head:true}).eq('tip','sayfa').gte('created',gun1),
        sb.from('profiller').select('created').gte('created',gun7),
        sb.from('hata_log').select('olusma').gte('olusma',gun7)
      ]);
      const seri7=(rows,alan)=>{ const g={}; (rows||[]).forEach(x=>{ const gun=(x[alan]||'').slice(0,10); if(gun) g[gun]=(g[gun]||0)+1; }); const c=[]; const b=new Date(); for(let i=6;i>=0;i--){ const d=new Date(b.getTime()-i*86400000).toISOString().slice(0,10); c.push(g[d]||0); } return c; };
      const yeniListe=yeniR.data||[];
      return { akis:akisR.data||[], pageview24:pvR.count||0, yeniUye7:yeniListe.length, yeniTrend:seri7(yeniListe,'created'), hataTrend:seri7(hataR.data||[],'olusma') };
    }catch(e){ return null; }
  },
  async orphanBul(){ if(!sb) return []; try{ const {data}=await sb.rpc('depo_orphan_bul'); return data||[]; }catch(e){ return []; } },
  async orphanTemizle(yollar){ if(!sb||!yollar||!yollar.length) return {ok:true,adet:0}; try{ const {error}=await sb.storage.from('fotolar').remove(yollar); return error?{hata:error.message}:{ok:true,adet:yollar.length}; }catch(e){ return {hata:String(e)}; } },
  async sohbetArsivle(){ if(!sb) return {hata:"yok"}; try{ const {data,error}=await sb.rpc('sohbet_arsivle'); return error?{hata:error.message}:{ok:true,adet:data||0}; }catch(e){ return {hata:String(e)}; } },
  // Sohbetteki maç kartları: özet (adet/yer/en eski) + otomatik/manuel temizlik (14 gün+)
  async macKartOzet(){ if(!sb) return null; try{ const {data,error}=await sb.rpc('mac_kart_ozet'); return error?null:(data||null); }catch(e){ return null; } },
  async macKartTemizle(gun){ if(!sb) return {hata:"yok"}; try{ const {data,error}=await sb.rpc('mac_kart_temizle',{p_gun:gun||14}); return error?{hata:error.message}:{ok:true,adet:data||0}; }catch(e){ return {hata:String(e)}; } },
  // ---- KULÜP (kalıcı takım) katmanı — Aşama 4-6 ----
  async kuluplerim(userId){ if(!sb||!userId) return []; try{ const {data}=await sb.from('kulupler').select('id,ad,logo,renk,renk2,td,olusturma').eq('sahip_user_id',userId).is('evren',null).order('olusturma',{ascending:false}); return data||[]; }catch(e){ return []; } },
  // Takımlarım = SAHİP olduğun + oyuncu olarak KATILDIĞIN takımlar (davetle katılan da kendi takımını görür)
  async takimlarim(userId){ if(!sb||!userId) return [];
    try{
      const [sr, or_] = await Promise.all([
        sb.from('kulupler').select('id,ad,logo,renk,renk2,td,olusturma,sahip_user_id').eq('sahip_user_id',userId).is('evren',null).order('olusturma',{ascending:false}),
        sb.from('oyuncular').select('player_id').eq('sahip_user_id',userId)
      ]);
      const harita={};
      (sr.data||[]).forEach(c=>{ harita[c.id]={...c, benim:true, katildi:true}; });
      const pids=(or_.data||[]).map(x=>x.player_id);
      if(pids.length){
        const {data:ko}=await sb.from('kulup_oyuncu').select('kulupler(id,ad,logo,renk,renk2,td,olusturma,sahip_user_id,evren)').in('player_id',pids).eq('aktif',true);
        (ko||[]).forEach(x=>{ const c=x.kulupler; if(c && !c.evren && !harita[c.id]) harita[c.id]={...c, benim:c.sahip_user_id===userId, katildi:true}; });
      }
      return Object.values(harita);
    }catch(e){ return []; }
  },
  // Tüm takımlar (keşfet/vitrin) — herkese açık, üyeler sistemin takımlarını görsün
  async tumTakimlar(){ if(!sb) return []; try{ const {data}=await sb.from('kulupler').select('id,ad,logo,renk,renk2,td,olusturma,sahip_user_id').is('evren',null).order('olusturma',{ascending:false}).limit(300); return data||[]; }catch(e){ return []; } },
  async kulupKur(userId, obj){ if(!sb||!userId) return {hata:"yok"}; try{ const {data,error}=await sb.from('kulupler').insert({ad:(obj.ad||'').trim(), renk:obj.renk||null, renk2:obj.renk2||null, logo:obj.logo||null, sahip_user_id:userId}).select('id,ad,logo,renk,renk2').single(); if(error){ const m=(error.message||'')+ (error.code||''); if(error.code==='42501'||/row-level security|policy|permission|denied/i.test(m)) return {hata:'Yetkiniz bulunmuyor.'}; return {hata:error.message}; } return {ok:true,kulup:data}; }catch(e){ return {hata:String(e)}; } },
  async kulupKadro(kulupId){ if(!sb||!kulupId) return []; try{ const {data}=await sb.from('kulup_oyuncu').select('player_id,forma_no,mevki,aktif, oyuncular(ad_soyad,foto,poz,ovr)').eq('kulup_id',kulupId).eq('aktif',true); return (data||[]).map(x=>({player_id:x.player_id, forma_no:x.forma_no, mevki:x.mevki||(x.oyuncular&&x.oyuncular.poz)||null, ad:(x.oyuncular&&x.oyuncular.ad_soyad)||'Oyuncu', foto:(x.oyuncular&&x.oyuncular.foto)||null, ovr:(x.oyuncular&&x.oyuncular.ovr)||null})); }catch(e){ return []; } },
  async kulupOyuncuEkle(kulupId, ad, mevki, forma){ if(!sb) return {hata:"yok"}; try{ const {data,error}=await sb.rpc('kulup_oyuncu_ekle',{p_kulup:kulupId, p_ad:ad, p_mevki:mevki||null, p_forma:forma?parseInt(forma)||null:null}); return error?{hata:error.message}:{ok:true,player_id:data}; }catch(e){ return {hata:String(e)}; } },
  async kulupOyuncuCikar(kulupId, playerId){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.from('kulup_oyuncu').update({aktif:false}).eq('kulup_id',kulupId).eq('player_id',playerId); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  async kulupLigeKatil(kulupId, ligId, ad){ if(!sb) return {hata:"yok"}; try{ const {data,error}=await sb.rpc('kulup_lige_katil',{p_kulup:kulupId, p_lig:ligId, p_ad:ad||null}); return error?{hata:error.message}:{ok:true,takim_id:data}; }catch(e){ return {hata:String(e)}; } },
  async kulupSil(kulupId){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.rpc('kulup_kalici_sil',{p_kulup:kulupId}); if(error){ if(error.code==='42501'||/yetki|policy|permission|denied/i.test(error.message||'')) return {hata:'Yetkiniz bulunmuyor.'}; return {hata:error.message}; } return {ok:true}; }catch(e){ return {hata:String(e)}; } },
  async kulupTopluSil(ids){ if(!sb||!ids||!ids.length) return {hata:"yok"}; try{ const {data,error}=await sb.rpc('kulup_toplu_sil',{p_kulupler:ids}); if(error){ if(error.code==='42501'||/yetki|policy|permission|denied/i.test(error.message||'')) return {hata:'Yetkiniz bulunmuyor.'}; return {hata:error.message}; } return {ok:true,adet:data||0}; }catch(e){ return {hata:String(e)}; } },
  // ---- Faz 3: Sezon serisi (yeni sezon devri) + Faz 4: kariyer/tüm-zamanlar ----
  async yeniSezonBaslat(ligId){ if(!sb) return {hata:"yok"}; try{ const {data,error}=await sb.rpc('yeni_sezon_baslat',{p_eski:ligId}); return error?{hata:error.message}:{ok:true, yeniId:data}; }catch(e){ return {hata:String(e)}; } },
  async oyuncuKariyer(pid){ if(!sb||!pid) return null; try{ const {data}=await sb.from('oyuncu_kariyer').select('*').eq('player_id',pid).maybeSingle(); return data||null; }catch(e){ return null; } },
  // ---- OYUNCU KARTI (foto + rarity/konsept override) ----
  async kartVeri(pid){ if(!sb||!pid) return {rarity:null,konsept:null,fotolar:[]}; try{ const [a,f]=await Promise.all([ sb.from('oyuncular_acik').select('kart_rarity,kart_konsept').eq('player_id',pid).maybeSingle(), sb.from('oyuncu_kart_foto').select('*').eq('player_id',pid).order('sira',{ascending:true}) ]); return {rarity:(a.data&&a.data.kart_rarity)||null, konsept:(a.data&&a.data.kart_konsept)||null, fotolar:(f.data||[])}; }catch(e){ return {rarity:null,konsept:null,fotolar:[]}; } },
  async kartAyarKaydet(pid, ayar){ if(!sb||!pid) return {hata:"yok"}; try{ const {error}=await sb.from('oyuncular').update(ayar).eq('player_id',pid); if(error){ if(error.code==='42501'||/yetki|policy|permission|denied/i.test(error.message||'')) return {hata:'Yetkiniz bulunmuyor.'}; return {hata:error.message}; } return {ok:true}; }catch(e){ return {hata:String(e)}; } },
  async kartFotoEkle(pid, rec){ if(!sb||!pid) return {hata:"yok"}; try{ const {data,error}=await sb.from('oyuncu_kart_foto').insert({player_id:pid, url:rec.url, crop:rec.crop||null, arka_plan:rec.arka_plan||'orijinal', sira:rec.sira||0}).select('*').single(); if(error){ if(error.code==='42501'||/yetki|policy|permission|denied|5 kart/i.test(error.message||'')) return {hata:/5 kart/i.test(error.message||'')?'En fazla 5 kart fotoğrafı.':'Yetkiniz bulunmuyor.'}; return {hata:error.message}; } return {ok:true,foto:data}; }catch(e){ return {hata:String(e)}; } },
  async kartFotoGuncelle(id, rec){ if(!sb||!id) return {hata:"yok"}; try{ const {error}=await sb.from('oyuncu_kart_foto').update(rec).eq('id',id); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  async kartFotoSil(id){ if(!sb||!id) return {hata:"yok"}; try{ const {error}=await sb.from('oyuncu_kart_foto').delete().eq('id',id); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  async kulupTumZamanlar(kulupId){ if(!sb||!kulupId) return null; try{ const {data}=await sb.from('kulup_tum_zamanlar').select('*').eq('kulup_id',kulupId).maybeSingle(); return data||null; }catch(e){ return null; } },
  // ---- Takıma (kulüp) direkt davet + düzenle + serbest bırak ----
  async kulupGuncelle(id, alanlar){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.from('kulupler').update(alanlar).eq('id',id); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  async kulupDavetiUret(kulupId){ if(!sb) return {hata:"yok"}; try{ const {data,error}=await sb.from('davetler').insert({kulup_id:kulupId, tip:'kulup'}).select('token').single(); return error?{hata:error.message}:{ok:true, token:data.token}; }catch(e){ return {hata:String(e)}; } },
  async kulupDavetiKullan(token, bilgi){ if(!sb) return {hata:"yok"}; const b=bilgi||{}; try{ const {data,error}=await sb.rpc('kulup_daveti_kullan',{p_token:token, p_ad:b.ad, p_no:b.no||null, p_poz:b.poz||null, p_foto:b.foto||null, p_dogum:b.dogum||null, p_boy:b.boy||null, p_kilo:b.kilo||null, p_uyruk:b.uyruk||null, p_ayak:b.ayak||null}); return error?{hata:error.message}:{ok:true, player_id:data}; }catch(e){ return {hata:String(e)}; } },
  async kulupOyuncuSerbest(kulupId, playerId){ if(!sb) return {hata:"yok"}; try{ const {data,error}=await sb.rpc('kulup_oyuncu_serbest',{p_kulup:kulupId, p_player:playerId}); return error?{hata:error.message}:{ok:!!data}; }catch(e){ return {hata:String(e)}; } },
  // ---- Read-only kilidi (destek/paylaşım modu) + Sorun Bildir ----
  saltOkunurKilit(v){ FL_SALT_OKUNUR = !!v; },
  async sorunBildir(obj){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.from('destek_talep').insert(obj); if(error){ const {teshis, ...sade}=obj; const r2=await sb.from('destek_talep').insert(sade); return r2.error?{hata:r2.error.message}:{ok:true}; } return {ok:true}; }catch(e){ return {hata:String(e)}; } },
  async destekTalepListe(){ if(!sb) return []; try{ const {data}=await sb.from('destek_talep').select('*').order('olusma',{ascending:false}).limit(50); return data||[]; }catch(e){ return []; } },
  async destekTalepDurum(id, durum){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.from('destek_talep').update({durum}).eq('id',id); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  // ---- Faz 3: Lig soft-delete / çöp kutusu ----
  async ligSoftSil(id){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.rpc('lig_soft_sil',{p_lig:id}); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  async ligGeriAl(id){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.rpc('lig_geri_al',{p_lig:id}); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  async ligPurge(){ if(!sb) return {hata:"yok"}; try{ const {data,error}=await sb.rpc('lig_purge_eskiler'); return error?{hata:error.message}:{ok:true,adet:data||0}; }catch(e){ return {hata:String(e)}; } },
  async ligKaliciSil(id){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.rpc('lig_kalici_sil',{p_lig:id}); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  async ligCopListe(){ if(!sb) return []; try{ const {data}=await sb.from('ligler').select('id,ad,silinme_t').eq('silindi',true).order('silinme_t',{ascending:false}); return data||[]; }catch(e){ return []; } },
  // HAM lig listesi (admin): TÜM ligler — gizli/demo/yönetici farketmez. Fantom temizliği için.
  async tumLiglerHam(){ if(!sb) return []; try{ let q=await sb.from('ligler').select('id,ad,yonetici_id,evren,silindi,olusturma').order('olusturma',{ascending:false}).limit(500); if(q.error){ q=await sb.from('ligler').select('id,ad,yonetici_id,olusturma').order('olusturma',{ascending:false}).limit(500); } return q.data||[]; }catch(e){ return []; } },
  // ---- Lig hakları (K3/K4) ----
  async hakGetir(userId){
    if(!sb||!userId) return {toplam:0,kullanilan:0,kalan:0};
    try{ const {data}=await sb.from('lig_haklari').select('toplam,kullanilan').eq('user_id',userId).maybeSingle();
      const t=data?data.toplam:0, k=data?data.kullanilan:0; return {toplam:t,kullanilan:k,kalan:Math.max(0,t-k)}; }
    catch(e){ return {toplam:0,kullanilan:0,kalan:0}; }
  },
  async haklariListe(){ if(!sb) return []; try{ const {data}=await sb.from('lig_haklari').select('*').order('guncelleme',{ascending:false}); return data||[]; }catch(e){ return []; } },
  // ---- Profiller (email ↔ user_id köprüsü) ----
  async profilBul(email){ if(!sb||!email) return null; try{ const {data}=await sb.from('profiller').select('user_id,email,ad').ilike('email',(email||'').trim()).maybeSingle(); return data||null; }catch(e){ return null; } },
  async profillerHepsi(){ if(!sb) return []; try{ const {data}=await sb.from('profiller').select('user_id,email,ad,rol,roller'); return data||[]; }catch(e){ return []; } },
  // ---- Rol & profil (üyelik: futbolcu / hakem / izleyici) ----
  async profilGetir(userId){ if(!sb||!userId) return null; try{ const {data}=await sb.from('profiller').select('user_id,email,ad,rol,roller,sehir,foto,dogum,boy,kilo,mevki,ayak').eq('user_id',userId).maybeSingle(); return data||null; }catch(e){ return null; } },
  async profilKaydet(userId, obj){ if(!sb||!userId) return {hata:"yok"}; try{ const {error}=await sb.from('profiller').upsert({user_id:userId, ...obj},{onConflict:'user_id'}); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  async profilRollerYaz(userId, roller){ if(!sb||!userId) return {hata:"yok"}; try{ const {error}=await sb.from('profiller').update({roller}).eq('user_id',userId); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  async hakemHavuzu(){ if(!sb) return []; try{ const {data}=await sb.from('hakem_havuzu').select('user_id,ad,sehir,foto').limit(300); return data||[]; }catch(e){ return []; } },
  // ---- Lig kurma başvurusu (para/onay kapısı → süper admin paneline düşer) ----
  async basvuruEkle(obj){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.from('lig_basvurulari').insert(obj); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  async basvurumVar(userId){ if(!sb||!userId) return false; try{ const {data}=await sb.from('lig_basvurulari').select('id').eq('user_id',userId).in('durum',['bekliyor','arandi']).maybeSingle(); return !!data; }catch(e){ return false; } },
  async basvuruListe(){ if(!sb) return []; try{ const {data}=await sb.from('lig_basvurulari').select('*').order('olusturma',{ascending:false}).limit(100); return data||[]; }catch(e){ return []; } },
  async basvuruDurum(id, durum){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.from('lig_basvurulari').update({durum}).eq('id',id); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  // ---- Admin panel: özet sayımlar + ülke dağılımı + bekleyen işler ----
  async panelOzet(){
    if(!sb) return null;
    try{
      const c=(t)=>sb.from(t).select('*',{count:'exact',head:true});
      // Lig sayımı: çöp kutusundakileri (soft-delete) SAYMA → gerçek aktif lig sayısı
      const ligSay=async()=>{ let q=await sb.from('ligler').select('*',{count:'exact',head:true}).neq('silindi',true).is('evren',null); if(q.error){ q=await sb.from('ligler').select('*',{count:'exact',head:true}).neq('silindi',true); if(q.error){ q=await sb.from('ligler').select('*',{count:'exact',head:true}); } } return q; };
      const [lig,uye,oyuncu,mac,arsiv,transfer]=await Promise.all([
        ligSay(), c('profiller'), c('oyuncular'), c('maclar'),
        sb.from('ligler').select('*',{count:'exact',head:true}).eq('durum','arsiv'),
        sb.from('transferler').select('*',{count:'exact',head:true}).in('asama',['talep','oyuncu_kabul','yonetici_onay'])
      ]);
      return { lig:lig.count||0, uye:uye.count||0, oyuncu:oyuncu.count||0, mac:mac.count||0, arsivLig:arsiv.count||0, bekleyenTransfer:transfer.count||0 };
    }catch(e){ return null; }
  },
  async ulkeDagilim(){ if(!sb) return []; try{ const {data}=await sb.from('ligler').select('ulke'); const m={}; (data||[]).forEach(x=>{ const u=x.ulke||'TR'; m[u]=(m[u]||0)+1; }); return Object.entries(m).map(([ulke,adet])=>({ulke,adet})).sort((a,b)=>b.adet-a.adet); }catch(e){ return []; } },
  async bekleyenTransferler(){ if(!sb) return []; try{ const {data}=await sb.from('transferler').select('id,player_id,lig_id,eski_takim_id,yeni_takim_id,asama,talep_tarihi, oyuncular(ad_soyad), ligler(ad)').in('asama',['talep','oyuncu_kabul','yonetici_onay']).order('talep_tarihi',{ascending:false}).limit(30); return data||[]; }catch(e){ return []; } },
  async transferOnayla(id){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.from('transferler').update({asama:'tamam', yonetici_onay_t:new Date().toISOString()}).eq('id',id); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  async transferReddet(id){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.from('transferler').update({asama:'iptal'}).eq('id',id); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  async adminYap(userId, yap){ if(!sb) return {hata:"yok"}; try{ if(yap){ const {error}=await sb.from('adminler').upsert({user_id:userId}); return error?{hata:error.message}:{ok:true}; } else { const {error}=await sb.from('adminler').delete().eq('user_id',userId); return error?{hata:error.message}:{ok:true}; } }catch(e){ return {hata:String(e)}; } },
  // Toplu bildirim/duyuru (admin) — hedef: herkes|lig|takim|kisi
  async adminTopluBildirim(tip, id, baslik, metin){ if(!sb) return {hata:"yok"}; try{ const {data,error}=await sb.rpc('admin_toplu_bildirim',{p_tip:tip, p_id:id||null, p_baslik:baslik, p_metin:metin||null}); return error?{hata:error.message}:{ok:true,adet:data}; }catch(e){ return {hata:String(e)}; } },
  // ---- TEK BİLDİRİM MERKEZİ (fan-out) — bir olaydan çok kanal ----
  async ligBildirim(ligId, takimId, baslik, metin, linkId){ if(!sb) return {hata:"yok"}; try{ const {data,error}=await sb.rpc('lig_bildirim',{p_lig:ligId, p_takim:takimId||null, p_baslik:baslik, p_metin:metin||null, p_link_id:linkId||null}); return error?{hata:error.message}:{ok:true,adet:data}; }catch(e){ return {hata:String(e)}; } },
  async epostaKuyruk(satirlar){ if(!sb||!satirlar||!satirlar.length) return {ok:true,adet:0}; try{ let {error}=await sb.from('bildirim_kuyruk').insert(satirlar); if(error){ const sade=satirlar.map(r=>{ const {hedef_email, ...k}=r; return k; }); const r2=await sb.from('bildirim_kuyruk').insert(sade); error=r2.error; } return error?{hata:error.message}:{ok:true,adet:satirlar.length}; }catch(e){ return {hata:String(e)}; } },
  // Tek olay → in-app(+push webhook) · lig sohbeti · takım sohbeti · e-posta kuyruğu
  async bildirimDagit(o){
    if(!sb||!o||!o.ligId) return {hata:"yok"};
    const K=o.kanallar||{}, s={inapp:0,ligSohbet:false,takim:0,email:0,hata:[]};
    const sistemAd=o.ad||"⚽ ForzaLig", kart=o.kart||null, gonderen=o.senderId||null;
    // Sistem mesajı: gönderen = maçı kaydeden yönetici (RLS güvenli). Zengin kolon/RLS sorununda sade metne düş.
    const sistemMesaj=async(takimId)=>{
      let r=await this.mesajGonder(o.ligId, takimId, gonderen, sistemAd, {metin:o.metin, sistem:true, sistem_tip:o.sistemTip||'mac', kart});
      if(!r||!r.ok){ r=await this.mesajGonder(o.ligId, takimId, gonderen, sistemAd, {metin:"⚽ "+o.metin}); }
      return r;
    };
    try{
      if(K.inapp){ const r=await this.ligBildirim(o.ligId, null, o.baslik, o.metin, o.linkId); if(r.ok) s.inapp=r.adet||0; else s.hata.push("bildirim:"+(r.hata||"")); }
      if(K.ligSohbet){ const r=await sistemMesaj(null); if(r&&r.ok) s.ligSohbet=true; else s.hata.push("ligsohbet:"+((r&&r.hata)||"")); }
      if(K.takimSohbet && Array.isArray(o.takimIds)){ for(const tid of o.takimIds){ if(!tid) continue; const r=await sistemMesaj(tid); if(r&&r.ok) s.takim++; } }
      if(K.email){ await this.epostaKuyruk([{hedef_lig:o.ligId, konu:o.baslik, govde:o.metin, kanal:'email'},{hedef_email:'fatiherol68@gmail.com', konu:"[KOPYA] "+o.baslik, govde:o.metin, kanal:'email'}]); s.email=1; }
    }catch(e){ s.hata.push(String(e&&e.message||e)); }
    return {ok:true, sonuc:s};
  },
  async tumLiglerBasit(){ if(!sb) return []; try{ const {data}=await sb.from('ligler').select('id,ad').order('olusturma',{ascending:false}).limit(500); return data||[]; }catch(e){ return []; } },
  async ligTakimlariBasit(ligId){ if(!sb) return []; try{ const {data}=await sb.from('takimlar').select('id,ad').eq('lig_id',ligId).order('ad'); return data||[]; }catch(e){ return []; } },
  // ---- 14 Audit log ----
  async logla(oturum, islem, detay){ if(!sb||!oturum) return; try{ await sb.from('islem_log').insert({user_id:oturum.id, kim:(oturum.user_metadata&&oturum.user_metadata.ad)||oturum.email, islem, detay:detay||null}); }catch(e){} },
  async auditListe(n){ if(!sb) return []; try{ const {data}=await sb.from('islem_log').select('*').order('created',{ascending:false}).limit(n||60); return data||[]; }catch(e){ return []; } },
  // ---- 4/7/8 Analitik ----
  async olayYaz(oturum, tip, deger){ if(!sb) return; try{ await sb.from('olay_log').insert({tip, deger:(deger||'').slice(0,120), user_id:oturum?oturum.id:null}); }catch(e){} },
  async topOlay(tip, n){ if(!sb) return []; try{ const {data}=await sb.from('olay_log').select('deger').eq('tip',tip).order('created',{ascending:false}).limit(3000); const m={}; (data||[]).forEach(x=>{ if(x.deger){ m[x.deger]=(m[x.deger]||0)+1; } }); return Object.entries(m).map(([deger,adet])=>({deger,adet})).sort((a,b)=>b.adet-a.adet).slice(0,n||8); }catch(e){ return []; } },
  async onlineSayi(){ if(!sb) return 0; try{ const bes=new Date(Date.now()-5*60000).toISOString(); const {data}=await sb.from('olay_log').select('user_id,created').gte('created',bes).limit(2000); return new Set((data||[]).map(x=>x.user_id||'anon')).size; }catch(e){ return 0; } },
  async gunlukAktif(){ if(!sb) return []; try{ const bas=new Date(Date.now()-7*86400000).toISOString(); const {data}=await sb.from('olay_log').select('user_id,created').gte('created',bas).limit(20000); const g={}; (data||[]).forEach(x=>{ const gun=(x.created||'').slice(0,10); if(!gun) return; (g[gun]=g[gun]||new Set()).add(x.user_id||'anon'); }); const bugun=new Date(); const cikti=[]; for(let i=6;i>=0;i--){ const d=new Date(bugun.getTime()-i*86400000); const gun=d.toISOString().slice(0,10); cikti.push({gun, etiket:d.toLocaleDateString('tr-TR',{weekday:'short'}), kisi:(g[gun]?g[gun].size:0)}); } return cikti; }catch(e){ return []; } },
  // ---- 10 Takip / Popüler ----
  async takipYaz(oturum, tip, hedefId, hedefAd, ekle){ if(!sb||!oturum) return; try{ if(ekle) await sb.from('takipler').upsert({user_id:oturum.id, tip, hedef_id:String(hedefId), hedef_ad:hedefAd||null}); else await sb.from('takipler').delete().eq('user_id',oturum.id).eq('tip',tip).eq('hedef_id',String(hedefId)); }catch(e){} },
  async populer(tip, n){ if(!sb) return []; try{ const {data}=await sb.from('takipler').select('hedef_id,hedef_ad').eq('tip',tip).limit(4000); const m={}; (data||[]).forEach(x=>{ const k=x.hedef_id; if(!m[k]) m[k]={ad:x.hedef_ad||k,adet:0}; m[k].adet++; }); return Object.values(m).sort((a,b)=>b.adet-a.adet).slice(0,n||5); }catch(e){ return []; } },
  // ---- Davet sistemi (takım/oyuncu linki + kariyer sahiplenme) ----
  async davetOlustur(ligId, tip, takimId){ if(!sb) return {hata:"yok"}; try{ const {data,error}=await sb.from('davetler').insert({lig_id:ligId, tip, takim_id:takimId||null}).select('token').single(); return error?{hata:error.message}:{ok:true, token:data.token}; }catch(e){ return {hata:String(e)}; } },
  async davetGetir(token){ if(!sb||!token) return null;
    // Zengin sorgu (kulüp/lig/takım adları). Şema önbelleği/eksik kolon nedeniyle patlarsa temel alanlara düş.
    try{ const {data,error}=await sb.from('davetler').select('token,tip,aktif,lig_id,takim_id,kulup_id, ligler(ad,sehir), takimlar(ad), kulupler(ad)').eq('token',token).maybeSingle(); if(!error && data) return data; }catch(e){}
    try{ const {data,error}=await sb.from('davetler').select('token,tip,aktif,lig_id,takim_id,kulup_id').eq('token',token).maybeSingle(); if(!error && data) return data; }catch(e){}
    try{ const {data}=await sb.from('davetler').select('token,tip,aktif,lig_id,takim_id').eq('token',token).maybeSingle(); return data||null; }catch(e){ return null; }
  },
  async takimDavetiKullan(token, ad, renk, renk2, logo){ if(!sb) return {hata:"yok"}; try{ const {data,error}=await sb.rpc('takim_daveti_kullan',{p_token:token, p_ad:ad, p_renk:renk||null, p_renk2:renk2||null, p_logo:logo||null}); return error?{hata:error.message}:{ok:true, takimId:(data&&data.takim_id)||null, oyuncuToken:(data&&data.oyuncu_token)||null}; }catch(e){ return {hata:String(e)}; } },
  async oyuncuDavetiKullan(token, bilgi){ if(!sb) return {hata:"yok"}; const b=bilgi||{}; try{ const {data,error}=await sb.rpc('oyuncu_daveti_kullan',{p_token:token, p_ad:b.ad, p_no:b.no||null, p_poz:b.poz||null, p_foto:b.foto||null, p_dogum:b.dogum||null, p_boy:b.boy||null, p_kilo:b.kilo||null, p_uyruk:b.uyruk||null, p_ayak:b.ayak||null}); return error?{hata:error.message}:{ok:true, player_id:data}; }catch(e){ return {hata:String(e)}; } },
  async oyuncuSahiplenRel(playerId){ if(!sb) return {hata:"yok"}; try{ const {data,error}=await sb.rpc('oyuncu_sahiplen',{p_player_id:playerId}); return error?{hata:error.message}:{ok:!!data, zaten:!data}; }catch(e){ return {hata:String(e)}; } },
  // Davet onay akışı — bekleyen katılım istekleri
  async bekleyenKatilimlar(ligId){ if(!sb) return []; try{ const {data,error}=await sb.rpc('bekleyen_katilimlar',{p_lig:ligId}); return error?[]:(data||[]); }catch(e){ return []; } },
  async katilimOnayla(otId){ if(!sb) return {hata:"yok"}; try{ const {data,error}=await sb.rpc('katilim_onayla',{p_ot:otId}); return error?{hata:error.message}:{ok:!!data}; }catch(e){ return {hata:String(e)}; } },
  async katilimReddet(otId){ if(!sb) return {hata:"yok"}; try{ const {data,error}=await sb.rpc('katilim_reddet',{p_ot:otId}); return error?{hata:error.message}:{ok:!!data}; }catch(e){ return {hata:String(e)}; } },
  // ---- Faz 5: ayrılma talebi (Q16) + çıkarma & bildirim (Q17/Q18) ----
  async oyuncuCikar(playerId, takimId){ if(!sb) return {hata:"yok"}; try{ const {data,error}=await sb.rpc('oyuncu_cikar',{p_player:playerId, p_takim:takimId}); return error?{hata:error.message}:{ok:!!data}; }catch(e){ return {hata:String(e)}; } },
  async ayrilmaTalep(playerId, ligId){ if(!sb) return {hata:"yok"}; try{ const {data,error}=await sb.rpc('ayrilma_talep_olustur',{p_player:playerId, p_lig:ligId}); return error?{hata:error.message}:{ok:!!data}; }catch(e){ return {hata:String(e)}; } },
  async bekleyenAyrilmalar(ligId){ if(!sb) return []; try{ const {data,error}=await sb.rpc('bekleyen_ayrilmalar',{p_lig:ligId}); return error?[]:(data||[]); }catch(e){ return []; } },
  async ayrilmaOnayla(otId){ if(!sb) return {hata:"yok"}; try{ const {data,error}=await sb.rpc('ayrilma_onayla',{p_ot:otId}); return error?{hata:error.message}:{ok:!!data}; }catch(e){ return {hata:String(e)}; } },
  async ayrilmaReddet(otId){ if(!sb) return {hata:"yok"}; try{ const {data,error}=await sb.rpc('ayrilma_reddet',{p_ot:otId}); return error?{hata:error.message}:{ok:!!data}; }catch(e){ return {hata:String(e)}; } },
  // Tüm üyeler + yetki bilgisi (admin panel "Üyeler" sekmesi)
  async uyeler(){
    if(!sb) return [];
    try{
      const [p,h,a]=await Promise.all([
        sb.from('profiller').select('user_id,email,ad,created,rol,roller').order('created',{ascending:false}),
        sb.from('lig_haklari').select('user_id,toplam,kullanilan'),
        sb.from('adminler').select('user_id')
      ]);
      const hMap={}; (h.data||[]).forEach(x=>{ hMap[x.user_id]=x; });
      const aSet=new Set((a.data||[]).map(x=>x.user_id));
      return (p.data||[]).map(pr=>({...pr, hak:hMap[pr.user_id]||null, admin:aSet.has(pr.user_id)}));
    }catch(e){ return []; }
  },
  async hakVer(userId, toplam, not_){ // sadece admin (RLS korur)
    if(!sb) return {hata:"bağlantı yok"};
    try{ const {error}=await sb.from('lig_haklari').upsert({user_id:userId, toplam, not_:not_||null, guncelleme:new Date().toISOString()},{onConflict:'user_id'});
      return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; }
  },
  // ---- Ligler ----
  async ligOlustur(userId, lig){ // {ad,ulke,sehir,logo,puan_sistemi,averaj_tipi,fikstur_tipi,hedef_takim,bitis_tarihi}
    if(!sb) return {hata:"bağlantı yok"};
    try{ const {data,error}=await sb.from('ligler').insert({yonetici_id:userId, ...lig}).select('id').single();
      return error?{hata:error.message}:{ok:true, id:data.id}; }catch(e){ return {hata:String(e)}; }
  },
  async ligGuncelle(id, alanlar){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.from('ligler').update(alanlar).eq('id',id); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  async ligSil(id){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.from('ligler').delete().eq('id',id); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  async ligSilAdmin(id){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.rpc('lig_sil_admin',{p_lig:id}); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  async ligArsivle(id, arsiv){ return this.ligGuncelle(id, {durum: arsiv?'arsiv':'aktif'}); },
  async ligGetir(id){ if(!sb) return null; try{ const {data}=await sb.from('ligler').select('*').eq('id',id).maybeSingle(); return data||null; }catch(e){ return null; } },
  async liglerim(userId){ if(!sb) return []; try{ const {data}=await sb.from('ligler').select('*').eq('yonetici_id',userId).order('olusturma',{ascending:false}); return data||[]; }catch(e){ return []; } },
  async ligKesfet(ulke){ if(!sb) return []; try{ let q=sb.from('ligler').select('id,ad,ulke,sehir,logo,durum,olusturma').eq('durum','aktif').order('olusturma',{ascending:false}).limit(200); if(ulke) q=q.eq('ulke',ulke); const {data}=await q; return data||[]; }catch(e){ return []; } },
  // ---- Takımlar ----
  async takimEkle(ligId, ad){ if(!sb) return {hata:"yok"}; try{ const {data,error}=await sb.from('takimlar').insert({lig_id:ligId, ad}).select('id').single(); return error?{hata:error.message}:{ok:true,id:data.id}; }catch(e){ return {hata:String(e)}; } },
  async takimGuncelle(id, alanlar){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.from('takimlar').update(alanlar).eq('id',id); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  async takimSil(id){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.from('takimlar').update({durum:'arsiv'}).eq('id',id); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } }, // Q8: takım silinmez, arşivlenir
  async takimlar(ligId){ if(!sb) return []; try{ const {data}=await sb.from('takimlar').select('*').eq('lig_id',ligId).order('olusturma'); return data||[]; }catch(e){ return []; } },
  // ---- Oyuncular (hassas tablo) + açık görünüm ----
  async oyuncuOlustur(o){ // {ad_soyad,takma_ad,forma_no,dogum,ayak,boy,kilo,telefon,email,tc_pasaport,uyruk,sahip_user_id}
    if(!sb) return {hata:"yok"}; try{ const {data,error}=await sb.from('oyuncular').insert(o).select('player_id').single(); return error?{hata:error.message}:{ok:true, player_id:data.player_id}; }catch(e){ return {hata:String(e)}; }
  },
  async oyuncuGuncelle(pid, alanlar){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.from('oyuncular').update(alanlar).eq('player_id',pid); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  async oyuncuSahiplen(pid, userId){ return this.oyuncuGuncelle(pid, {sahip_user_id:userId}); },
  async oyunculariAcik(pidler){ // KVKK açık görünüm (yaş, ad, forma, boy, ayak) — ziyaretçi de görür
    if(!sb) return []; try{ let q=sb.from('oyuncular_acik').select('*'); if(pidler&&pidler.length) q=q.in('player_id',pidler); const {data}=await q; return data||[]; }catch(e){ return []; }
  },
  // ---- Oyuncu ↔ Takım (kadro) ----
  async kadroEkle(pid, takimId, ligId){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.from('oyuncu_takim').insert({player_id:pid, takim_id:takimId, lig_id:ligId, aktif:true}); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  async kadro(takimId){ if(!sb) return []; try{ const {data}=await sb.from('oyuncu_takim').select('*').eq('takim_id',takimId).eq('aktif',true); return data||[]; }catch(e){ return []; } },
  async kadrodanCikar(id){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.from('oyuncu_takim').update({aktif:false, ayrilma:new Date().toISOString()}).eq('id',id); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  async kadrodanCikarPid(playerId, takimId){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.from('oyuncu_takim').update({aktif:false, ayrilma:new Date().toISOString()}).eq('player_id',playerId).eq('takim_id',takimId).eq('aktif',true); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  // ---- Transfer (madde 13: 3 adımlı zincir) ----
  async transferTalep(pid, ligId, eskiTakim, yeniTakim, talepEden){ if(!sb) return {hata:"yok"}; try{ const {data,error}=await sb.from('transferler').insert({player_id:pid, lig_id:ligId, eski_takim_id:eskiTakim||null, yeni_takim_id:yeniTakim, talep_eden:talepEden, asama:'talep'}).select('id').single(); return error?{hata:error.message}:{ok:true,id:data.id}; }catch(e){ return {hata:String(e)}; } },
  async transferOyuncuKabul(id){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.from('transferler').update({asama:'oyuncu_kabul', oyuncu_kabul_t:new Date().toISOString()}).eq('id',id); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  async transferYoneticiOnay(id){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.from('transferler').update({asama:'tamam', yonetici_onay_t:new Date().toISOString()}).eq('id',id); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  async transferIptal(id){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.from('transferler').update({asama:'iptal'}).eq('id',id); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  async transferler(ligId){ if(!sb) return []; try{ const {data}=await sb.from('transferler').select('*').eq('lig_id',ligId).order('talep_tarihi',{ascending:false}); return data||[]; }catch(e){ return []; } },
  async ligBekleyenTransferler(ligId){ if(!sb) return []; try{ const {data}=await sb.from('transferler').select('id,player_id,lig_id,eski_takim_id,yeni_takim_id,asama,talep_tarihi,talep_eden, oyuncular(ad_soyad)').eq('lig_id',ligId).eq('asama','talep').order('talep_tarihi',{ascending:false}).limit(50); return data||[]; }catch(e){ return []; } },
  async oyuncuTransferGecmisi(playerId){ if(!sb) return []; try{ const {data}=await sb.from('transferler').select('id,eski_takim_id,yeni_takim_id,asama,talep_tarihi,yonetici_onay_t').eq('player_id',playerId).eq('asama','tamam').order('yonetici_onay_t',{ascending:false}); return data||[]; }catch(e){ return []; } },
  // ---- App-içi BİLDİRİM ----
  async bildirimlerim(){ if(!sb) return []; try{ const {data}=await sb.from('bildirimler').select('*').order('olusma',{ascending:false}).limit(50); return data||[]; }catch(e){ return []; } },
  async okunmamisSay(){ if(!sb) return 0; try{ const {count}=await sb.from('bildirimler').select('*',{count:'exact',head:true}).eq('okundu',false); return count||0; }catch(e){ return 0; } },
  async bildirimOku(id){ if(!sb) return; try{ await sb.from('bildirimler').update({okundu:true}).eq('id',id); }catch(e){} },
  async bildirimHepsiOku(){ if(!sb) return; try{ await sb.from('bildirimler').update({okundu:true}).eq('okundu',false); }catch(e){} },
  async bildirimSil(id){ if(!sb) return; try{ await sb.from('bildirimler').delete().eq('id',id); }catch(e){} },
  // ---- SOHBET (Realtime) ----
  // Son N mesajı çeker (sayfalama: ilk açılışta son 30). ravdan (öncesi) getirmek için oncesiTs verilir.
  async mesajlar(ligId, takimId, oncesiTs, kulupId){ if(!sb) return []; try{ let q=sb.from('sohbet_mesajlari').select('*').eq('silindi',false); if(kulupId){ q=q.eq('kulup_id',kulupId); } else { q=q.eq('lig_id',ligId); q = takimId ? q.eq('takim_id',takimId) : q.is('takim_id',null); } if(oncesiTs) q=q.lt('olusma',oncesiTs); const {data}=await q.order('olusma',{ascending:false}).limit(30); return (data||[]).reverse(); }catch(e){ return []; } },
  async mesajGonder(ligId, takimId, userId, ad, ek, kulupId){ if(!sb) return {hata:"yok"}; try{ const kayit=Object.assign(kulupId?{kulup_id:kulupId, user_id:userId, ad}:{lig_id:ligId, takim_id:takimId||null, user_id:userId, ad}, ek||{}); const {data,error}=await sb.from('sohbet_mesajlari').insert(kayit).select('*').single(); return error?{hata:error.message}:{ok:true, mesaj:data}; }catch(e){ return {hata:String(e)}; } },
  sohbetDinleKulup(kulupId, geldi){ if(!sb||!kulupId) return null; try{ const kanal=sb.channel('sohbet:kulup:'+kulupId).on('postgres_changes',{event:'INSERT',schema:'public',table:'sohbet_mesajlari',filter:'kulup_id=eq.'+kulupId},(p)=>{ const m=p.new; if(!m.silindi) geldi(m); }).subscribe(); return kanal; }catch(e){ return null; } },
  async mesajSil(id){ if(!sb) return; try{ await sb.from('sohbet_mesajlari').update({silindi:true}).eq('id',id); }catch(e){} },
  // Tepkiler (emoji)
  async tepkiler(mesajIdler){ if(!sb||!mesajIdler||!mesajIdler.length) return []; try{ const {data}=await sb.from('sohbet_tepkileri').select('mesaj_id,user_id,emoji').in('mesaj_id',mesajIdler); return data||[]; }catch(e){ return []; } },
  async tepkiEkle(mesajId, userId, emoji){ if(!sb) return; try{ await sb.from('sohbet_tepkileri').insert({mesaj_id:mesajId, user_id:userId, emoji}); }catch(e){} },
  async tepkiKaldir(mesajId, userId, emoji){ if(!sb) return; try{ await sb.from('sohbet_tepkileri').delete().eq('mesaj_id',mesajId).eq('user_id',userId).eq('emoji',emoji); }catch(e){} },
  // Okuma takibi (okunmamış badge)
  async okumaKaydet(userId, ligId, kanal){ if(!sb) return; try{ await sb.from('sohbet_okuma').upsert({user_id:userId, lig_id:ligId, kanal, last_read:new Date().toISOString()},{onConflict:'user_id,lig_id,kanal'}); }catch(e){} },
  async sonOkumalar(userId, ligId){ if(!sb) return {}; try{ const {data}=await sb.from('sohbet_okuma').select('kanal,last_read').eq('user_id',userId).eq('lig_id',ligId); const m={}; (data||[]).forEach(x=>m[x.kanal]=x.last_read); return m; }catch(e){ return {}; } },
  async okunmamisSay(ligId, takimId, sinceTs){ if(!sb) return 0; try{ let q=sb.from('sohbet_mesajlari').select('*',{count:'exact',head:true}).eq('lig_id',ligId).eq('silindi',false); q = takimId ? q.eq('takim_id',takimId) : q.is('takim_id',null); if(sinceTs) q=q.gt('olusma',sinceTs); const {count}=await q; return count||0; }catch(e){ return 0; } },
  // Şikâyet
  async sikayetEt(mesaj, userId, sebep){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.from('sohbet_sikayet').insert({mesaj_id:mesaj.id, lig_id:mesaj.lig_id, mesaj_metin:mesaj.metin, gonderen_ad:mesaj.ad, sikayet_eden:userId, sebep:sebep||null}); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  async sikayetler(){ if(!sb) return []; try{ const {data}=await sb.from('sohbet_sikayet').select('*').eq('durum','yeni').order('olusma',{ascending:false}).limit(50); return data||[]; }catch(e){ return []; } },
  async sikayetKapat(id){ if(!sb) return; try{ await sb.from('sohbet_sikayet').update({durum:'kapatildi'}).eq('id',id); }catch(e){} },
  sohbetDinle(ligId, takimId, geldi){ if(!sb) return null; try{ const kanal=sb.channel('sohbet:'+ligId+':'+(takimId||'genel')).on('postgres_changes',{event:'INSERT',schema:'public',table:'sohbet_mesajlari',filter:'lig_id=eq.'+ligId},(p)=>{ const m=p.new; const kEsit = takimId ? m.takim_id===takimId : !m.takim_id; if(kEsit && !m.silindi) geldi(m); }).subscribe(); return kanal; }catch(e){ return null; } },
  sohbetKapat(kanal){ try{ if(kanal&&sb) sb.removeChannel(kanal); }catch(e){} },
  // ---- OYUNCU PAZARI (müsait oyuncular) ----
  async oyuncuMusaitAyar(playerId, musait, sehir, not){ if(!sb) return {hata:"yok"}; try{ const {data,error}=await sb.rpc('oyuncu_musait_ayar',{p_player_id:playerId, p_musait:musait, p_sehir:sehir||null, p_not:not||null}); return error?{hata:error.message}:{ok:!!data}; }catch(e){ return {hata:String(e)}; } },
  async pazarOyuncular(sehir){ if(!sb) return []; try{ const {data,error}=await sb.rpc('pazar_oyuncular',{p_sehir:sehir||null}); return error?[]:(data||[]); }catch(e){ return []; } },
  // ---- PUSH abonelik ----
  async pushKaydet(userId, sub){ if(!sb) return {hata:"yok"}; try{ const j=sub.toJSON(); const {error}=await sb.from('push_abonelikleri').upsert({user_id:userId, endpoint:j.endpoint, p256dh:j.keys.p256dh, auth:j.keys.auth, cihaz:navigator.userAgent.slice(0,120)},{onConflict:'endpoint'}); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  async pushSil(endpoint){ if(!sb) return; try{ await sb.from('push_abonelikleri').delete().eq('endpoint',endpoint); }catch(e){} },
  // ---- PAZAR İLANLARI (rakip bul / eksik oyuncu) ----
  async ilanOlustur(il){ if(!sb) return {hata:"yok"}; try{ const {data,error}=await sb.from('pazar_ilanlari').insert(il).select('id').single(); return error?{hata:error.message}:{ok:true,id:data.id}; }catch(e){ return {hata:String(e)}; } },
  async ilanlar(tip, sehir){ if(!sb) return []; try{ let q=sb.from('pazar_ilanlari').select('*').eq('tip',tip).eq('durum','aktif').order('olusma',{ascending:false}).limit(100); if(sehir) q=q.eq('sehir',sehir); const {data,error}=await q; return error?[]:(data||[]); }catch(e){ return []; } },
  async ilanlarim(userId){ if(!sb) return []; try{ const {data}=await sb.from('pazar_ilanlari').select('*').eq('user_id',userId).order('olusma',{ascending:false}); return data||[]; }catch(e){ return []; } },
  async ilanYanitVer(ilanId, ad, mesaj){ if(!sb) return {hata:"yok"}; try{ const u=(await sb.auth.getUser()).data.user; const {error}=await sb.from('ilan_yanitlari').insert({ilan_id:ilanId, user_id:u.id, ad:ad||null, mesaj:mesaj||null}); if(error){ if(/duplicate|unique/i.test(error.message)) return {hata:"Bu ilana zaten yanıt verdin."}; return {hata:error.message}; } return {ok:true}; }catch(e){ return {hata:String(e)}; } },
  async ilanYanitlari(ilanId){ if(!sb) return []; try{ const {data}=await sb.from('ilan_yanitlari').select('*').eq('ilan_id',ilanId).order('olusma',{ascending:true}); return data||[]; }catch(e){ return []; } },
  async ilanKarar(yanitId, kabul){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.rpc('ilan_yanit_karar',{p_yanit:yanitId, p_kabul:!!kabul}); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  async ilanKapat(ilanId){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.from('pazar_ilanlari').update({durum:'kapandi'}).eq('id',ilanId); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  // ---- Maçlar + sonuç (madde 17/18: log otomatik) ----
  async macOlustur(m){ if(!sb) return {hata:"yok"}; try{ const {data,error}=await sb.from('maclar').insert(m).select('id').single(); return error?{hata:error.message}:{ok:true,id:data.id}; }catch(e){ return {hata:String(e)}; } },
  async macSonuc(id, evSkor, depSkor){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.from('maclar').update({ev_skor:evSkor, dep_skor:depSkor, oynandi:true}).eq('id',id); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  // Bir maçı tam kaydet (ekle veya güncelle) + olaylar/ödül yeniden yaz. nameToPid: {oyuncuAd: player_id}
  async macKaydet(ligId, mc, nameToPid){
    if(!sb) return {hata:"yok"};
    try{
      const satir={ lig_id:ligId, ev_takim_id:mc.takimAId, dep_takim_id:mc.takimBId, hafta:(mc.hafta??null),
        tur:(mc.tur??null), grup:(mc.grup??null), bye:!!mc.bye, pen_galip:mc.penGalip||null,
        ev_skor:(mc.skorA==null?null:mc.skorA), dep_skor:(mc.skorB==null?null:mc.skorB), oynandi:!!mc.oynandi,
        sure:mc.sure||60, dizilis_ev:mc.dizilisA||null, dizilis_dep:mc.dizilisB||null, kadro_ev:mc.kadroA||null,
        kadro_dep:mc.kadroB||null, istatistik:mc.istatistik||null, ratingler:mc.ratingler||null,
        olaylar:mc.olaylar||null, kaleciler:mc.kaleciler||null, medya:mc.medya||null,
        // Player ID omurgası: mvp/ödül id'lerini oduller jsonb'una göm (şema değişmeden reload'da korunur)
        oduller:((mc.oduller||mc.mvpId||mc.odullerId)?{...(mc.oduller||{}), ...(mc.mvpId?{_mvpId:mc.mvpId}:{}), ...(mc.odullerId?{_odullerId:mc.odullerId}:{})}:null),
        mvp:mc.mvp||null, mvp_takim:mc.mvpTakim||null, bildirildi:!!mc.bildirildi };
      let macId=(typeof mc.id==="string")?mc.id:null;
      if(macId){ const {error}=await sb.from('maclar').update(satir).eq('id',macId); if(error) return {hata:error.message}; }
      else { const {data,error}=await sb.from('maclar').insert(satir).select('id').single(); if(error) return {hata:error.message}; macId=data.id; }
      await sb.from('mac_olaylari').delete().eq('mac_id',macId);
      await sb.from('mac_odulleri').delete().eq('mac_id',macId);
      const olayK=[]; const P=nameToPid||{};
      // Player ID omurgası: önce id ile çöz (aynı isim karışmaz), yoksa isme düş
      (mc.olaylar||[]).forEach(ol=>{ const pid=P[ol.oyuncuId]||P[ol.oyuncu];
        if(ol.tip==='gol'){ if(pid) olayK.push({mac_id:macId,player_id:pid,tip:'gol',dakika:(ol.dk??null),adet:1}); const apid=P[ol.asistId]||P[ol.asist]; if(apid) olayK.push({mac_id:macId,player_id:apid,tip:'asist',dakika:(ol.dk??null),adet:1}); }
        else if((ol.tip==='sari'||ol.tip==='kirmizi')&&pid){ olayK.push({mac_id:macId,player_id:pid,tip:ol.tip,dakika:(ol.dk??null),adet:1}); }
      });
      (mc.kaleciler||[]).forEach(k=>{ const pid=P[k.id]||P[k.ad]; if(pid&&k.kurtaris) olayK.push({mac_id:macId,player_id:pid,tip:'kurtaris',adet:k.kurtaris}); });
      if(olayK.length) await sb.from('mac_olaylari').insert(olayK);
      const odulK=[]; const od=mc.oduller||{}; const odId=mc.odullerId||{};
      ['forvet','ortasaha','defans','kaleci','altin','gumus','centilmen','enerjik','macinGolu','mvp'].forEach(kk=>{ const nm=(kk==='mvp')?mc.mvp:od[kk]; const nid=(kk==='mvp')?mc.mvpId:odId[kk]; const ppid=P[nid]||P[nm]; if(ppid) odulK.push({mac_id:macId,player_id:ppid,odul_tip:kk}); });
      if(odulK.length) await sb.from('mac_odulleri').insert(odulK);
      return {ok:true, id:macId};
    }catch(e){ return {hata:String(e&&e.message||e)}; }
  },
  async macSil(id){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.from('maclar').delete().eq('id',id); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  async ligMaclariSil(ligId){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.from('maclar').delete().eq('lig_id',ligId); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  async maclar(ligId){ if(!sb) return []; try{ const {data}=await sb.from('maclar').select('*').eq('lig_id',ligId).order('hafta',{nullsFirst:true}); return data||[]; }catch(e){ return []; } },
  async macLog(macId){ if(!sb) return []; try{ const {data}=await sb.from('mac_sonuc_log').select('*').eq('mac_id',macId).order('zaman',{ascending:false}); return data||[]; }catch(e){ return []; } },
  // ---- Olaylar (gol/asist/kart) ----
  async olayEkle(macId, pid, takimId, tip, dakika){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.from('mac_olaylari').insert({mac_id:macId, player_id:pid, takim_id:takimId||null, tip, dakika:dakika||null}); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  async macOlaylari(macId){ if(!sb) return []; try{ const {data}=await sb.from('mac_olaylari').select('*').eq('mac_id',macId); return data||[]; }catch(e){ return []; } },
  // ---- Katılım (madde 20) ----
  async katilimIsaretle(macId, pid, durum){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.from('katilim').upsert({mac_id:macId, player_id:pid, durum, guncelleme:new Date().toISOString()},{onConflict:'mac_id,player_id'}); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  async katilim(macId){ if(!sb) return []; try{ const {data}=await sb.from('katilim').select('*').eq('mac_id',macId); return data||[]; }catch(e){ return []; } },
  // ================= KAYDEDİCİ: turnuva nesnesi -> ilişkisel tablolar =================
  async ligKaydet(turnuva, yoneticiId, evren){
    if(!sb) return {hata:"bağlantı yok"};
    const T=turnuva;
    try{
      const {data:ligRow,error:e1}=await sb.from('ligler').insert({
        yonetici_id:yoneticiId, ad:T.ad, ulke:'TR', sehir:T.sehir||'', ilce:T.ilce||null,
        renk:T.renk||null, format:T.format||'tek', grup_sayi:T.grupSayi||0, kisi:T.kisi||8,
        sponsor_ad:T.sponsorAd||null, sponsor_emoji:T.sponsorEmoji||null, fikstur_tipi:T.format||'tek',
        evren: evren||null   // demo evren marker (gerçek lig = null)
      }).select('id').single();
      if(e1) return {hata:e1.message};
      const ligId=ligRow.id;
      const takimIdMap={}, oyAdMap={}, oyAdGlobal={}, oyIdGlobal={};
      for(const tk of (T.takimlar||[])){
        const {data:tRow,error:e2}=await sb.from('takimlar').insert({
          lig_id:ligId, ad:tk.ad, renk:tk.renk||null, renk2:tk.renk2||null, logo:tk.logo||null, grup:tk.grup||0, lis_no:tk.lisNo||null, td:tk.td||null
        }).select('id').single();
        if(e2) return {hata:e2.message};
        takimIdMap[tk.id]=tRow.id;
        const oyKayit=(tk.oyuncular||[]).map(o=>({
          ad_soyad:o.ad, forma_no:(o.no??null), dogum:tarihISO(o.dogum), ayak:o.ayak||null, foto:o.foto||null,
          boy:(o.boy??null), kilo:(o.kilo??null), uyruk:o.uyruk||null, poz:o.poz||null, ovr:(o.ovr??null),
          nitelik:{pac:o.pac,sho:o.sho,pas:o.pas,dri:o.dri,def:o.def,phy:o.phy},
          deger:(o.deger??null), saglik:o.saglik||null, bolge:o.bolge||null, renk:o.renk||o.formaRenk||null
        }));
        let eklenen=[];
        if(oyKayit.length){ const {data:oRows,error:e3}=await sb.from('oyuncular').insert(oyKayit).select('player_id'); if(e3) return {hata:e3.message}; eklenen=oRows||[]; }
        const uyelik=[];
        (tk.oyuncular||[]).forEach((o,i)=>{ const pid=eklenen[i]?eklenen[i].player_id:null; if(pid){ oyAdMap[tRow.id+'|'+o.ad]=pid; oyAdGlobal[o.ad]=pid; oyIdGlobal[String(o.player_id||o.id)]=pid; uyelik.push({player_id:pid,takim_id:tRow.id,lig_id:ligId,aktif:true}); } });
        if(uyelik.length){ const {error:e4}=await sb.from('oyuncu_takim').insert(uyelik); if(e4) return {hata:e4.message}; }
      }
      const takimUuidByAd={}; (T.takimlar||[]).forEach(tk=>{ takimUuidByAd[tk.ad]=takimIdMap[tk.id]; });
      const cozPid=(takimAd,oyAd,oyId)=>{ if(oyId!=null && oyIdGlobal[String(oyId)]) return oyIdGlobal[String(oyId)]; const tu=takimUuidByAd[takimAd]; if(tu&&oyAdMap[tu+'|'+oyAd]) return oyAdMap[tu+'|'+oyAd]; return oyAdGlobal[oyAd]||null; };
      for(const mc of (T.maclar||[])){
        const evId=takimIdMap[mc.takimAId], depId=takimIdMap[mc.takimBId];
        if(!evId||!depId) continue;
        const mvpPid=(mc.mvp||mc.mvpId)?cozPid(mc.mvpTakim,mc.mvp,mc.mvpId):null;
        const {data:mRow,error:e5}=await sb.from('maclar').insert({
          lig_id:ligId, ev_takim_id:evId, dep_takim_id:depId, hafta:(mc.hafta??null), tur:(mc.tur??null),
          grup:(mc.grup??null), bye:!!mc.bye, pen_galip:mc.penGalip||null,
          ev_skor:(mc.skorA==null?null:mc.skorA), dep_skor:(mc.skorB==null?null:mc.skorB),
          oynandi:!!mc.oynandi, sure:mc.sure||60, dizilis_ev:mc.dizilisA||null, dizilis_dep:mc.dizilisB||null,
          kadro_ev:mc.kadroA||null, kadro_dep:mc.kadroB||null, istatistik:mc.istatistik||null,
          ratingler:mc.ratingler||null, olaylar:mc.olaylar||null, kaleciler:mc.kaleciler||null, medya:mc.medya||null,
          oduller:mc.oduller||null, mvp:mc.mvp||null, mvp_takim:mc.mvpTakim||null, mvp_player:mvpPid,
          stad:mc.stad||mc.stadyum||null, hakem:mc.hakem||null
        }).select('id').single();
        if(e5) return {hata:e5.message};
        const macId=mRow.id;
        const olayK=[];
        (mc.olaylar||[]).forEach(ol=>{ const tu=takimUuidByAd[ol.takim]||null;
          if(ol.tip==='gol'){ const p=cozPid(ol.takim,ol.oyuncu,ol.oyuncuId); if(p) olayK.push({mac_id:macId,player_id:p,takim_id:tu,tip:'gol',dakika:(ol.dk??null),adet:1});
            if(ol.asist||ol.asistId){ const a=cozPid(ol.takim,ol.asist,ol.asistId); if(a) olayK.push({mac_id:macId,player_id:a,takim_id:tu,tip:'asist',dakika:(ol.dk??null),adet:1}); } }
          else if(ol.tip==='sari'||ol.tip==='kirmizi'){ const p=cozPid(ol.takim,ol.oyuncu,ol.oyuncuId); if(p) olayK.push({mac_id:macId,player_id:p,takim_id:tu,tip:ol.tip,dakika:(ol.dk??null),adet:1}); }
          else if(ol.tip==='degisik'){ const p=cozPid(ol.takim,ol.giren,ol.girenId)||cozPid(ol.takim,ol.cikan,ol.cikanId); if(p) olayK.push({mac_id:macId,player_id:p,takim_id:tu,tip:'degisik',dakika:(ol.dk??null),adet:1,ekstra:{cikan:ol.cikan,giren:ol.giren}}); }
        });
        (mc.kaleciler||[]).forEach(k=>{ const p=(k.id!=null&&oyIdGlobal[String(k.id)])||oyAdGlobal[k.ad]; if(p&&k.kurtaris) olayK.push({mac_id:macId,player_id:p,takim_id:null,tip:'kurtaris',dakika:null,adet:k.kurtaris}); });
        if(olayK.length) await sb.from('mac_olaylari').insert(olayK);
        const odulK=[]; const od=mc.oduller||{};
        ['forvet','ortasaha','defans','kaleci','altin','gumus','centilmen','enerjik','macinGolu'].forEach(k=>{ const oid=mc.odullerId&&mc.odullerId[k]; if(od[k]||oid){ const p=(oid!=null&&oyIdGlobal[String(oid)])||oyAdGlobal[od[k]]; if(p) odulK.push({mac_id:macId,player_id:p,odul_tip:k}); } });
        if(mvpPid) odulK.push({mac_id:macId,player_id:mvpPid,odul_tip:'mvp'});
        if(odulK.length) await sb.from('mac_odulleri').insert(odulK);
      }
      return {ok:true, ligId};
    }catch(e){ return {hata:String(e&&e.message||e)}; }
  },
  // ================= YÜKLEYİCİ: ilişkisel tablolar -> turnuva nesnesi =================
  async ligYukle(ligId){
    if(!sb) return null;
    try{
      const {data:L}=await sb.from('ligler').select('*').eq('id',ligId).maybeSingle();
      if(!L || L.silindi) return null;   // çöpe atılmış (soft-delete) lig ana görünümde yüklenmesin
      const [tkR,otR,mcR]=await Promise.all([
        sb.from('takimlar').select('*').eq('lig_id',ligId).neq('durum','arsiv'),
        sb.from('oyuncu_takim').select('*').eq('lig_id',ligId).eq('aktif',true),
        sb.from('maclar').select('*').eq('lig_id',ligId)
      ]);
      const tk=tkR.data||[], ot=otR.data||[], mc=mcR.data||[];
      const pidler=[...new Set(ot.map(x=>x.player_id))];
      // AÇIK görünüm (herkes/ziyaretçi) + TAM görünüm (girişliyse RLS izin verdiği kadar)
      let acikById={}, tamById={};
      if(pidler.length){
        const {data:ac}=await sb.from('oyuncular_acik').select('*').in('player_id',pidler); (ac||[]).forEach(o=>{ acikById[o.player_id]=o; });
        try{ const {data:tm}=await sb.from('oyuncular').select('*').in('player_id',pidler); (tm||[]).forEach(o=>{ tamById[o.player_id]=o; }); }catch(e){}
      }
      const takimlar=tk.map(t=>{
        const oyuncular=ot.filter(x=>x.takim_id===t.id).map(u=>{ const tam=tamById[u.player_id]; const ac=acikById[u.player_id]||{}; const n=(tam&&tam.nitelik)||ac.nitelik||{};
          return { id:u.player_id, player_id:u.player_id, lisNo:(tam&&tam.lis_no)||null,
            ad:(tam&&tam.ad_soyad)||ac.gorunen_ad||"Oyuncu", poz:(tam&&tam.poz)||ac.poz||null, no:(tam?tam.forma_no:ac.forma_no),
            ovr:(tam?tam.ovr:ac.ovr), pac:n.pac,sho:n.sho,pas:n.pas,dri:n.dri,def:n.def,phy:n.phy,
            renk:(tam&&tam.renk)||ac.renk, formaRenk:(tam&&tam.renk)||ac.renk,
            yas:(tam?yasHesap(tam.dogum):ac.yas), boy:(tam?tam.boy:ac.boy), kilo:(tam?tam.kilo:null), ayak:(tam&&tam.ayak)||ac.ayak,
            dogum:(tam&&tam.dogum)||null, bolge:(tam&&tam.bolge)||ac.bolge, uyruk:(tam&&tam.uyruk)||null,
            saglik:(tam&&tam.saglik)||ac.saglik, deger:(tam?tam.deger:ac.deger), sahip_user_id:(tam&&tam.sahip_user_id)||null,
            foto:(tam&&tam.foto)||ac.foto||null,
            gol:0,asist:0,mac:0,kurtaris:0,sari:0,kirmizi:0,mvp:0,dk:0,
            altin:0,gumus:0,forvet:0,ortasaha:0,defans:0,kaleci:0,centilmen:0,enerjik:0,macinGolu:0 };
        });
        return { id:t.id, lisNo:t.lis_no, ad:t.ad, renk:t.renk, renk2:t.renk2||null, logo:t.logo||null, yonetici_id:t.yonetici_id||null, td:t.td||null, kulup_id:t.kulup_id||null, oyuncular, grup:t.grup||0, o:0,g:0,b:0,m:0,ag:0,yg:0,puan:0,form:[] };
      });
      const maclar=mc.map(m=>{ const evT=takimlar.find(x=>x.id===m.ev_takim_id), depT=takimlar.find(x=>x.id===m.dep_takim_id);
        return { id:m.id, hafta:m.hafta, tur:m.tur, grup:m.grup, bye:m.bye, penGalip:m.pen_galip,
          takimA:evT?evT.ad:'', takimB:depT?depT.ad:'', takimAId:m.ev_takim_id, takimBId:m.dep_takim_id,
          renkA:evT?evT.renk:null, renkB:depT?depT.renk:null, skorA:m.ev_skor, skorB:m.dep_skor,
          oynandi:m.oynandi, sure:m.sure, olaylar:m.olaylar||[], kaleciler:m.kaleciler||[],
          oduller:(()=>{ const o={...(m.oduller||{})}; delete o._mvpId; delete o._odullerId; return o; })(),
          mvpId:(m.oduller&&m.oduller._mvpId)||null, odullerId:(m.oduller&&m.oduller._odullerId)||null,
          mvp:m.mvp, mvpTakim:m.mvp_takim, istatistik:m.istatistik, ratingler:m.ratingler,
          dizilisA:m.dizilis_ev, dizilisB:m.dizilis_dep, kadroA:m.kadro_ev, kadroB:m.kadro_dep,
          stad:m.stad, hakem:m.hakem, tarih:m.tarih||'', medya:m.medya||null, bildirildi:!!m.bildirildi };
      });
      return { id:L.id, ad:L.ad, renk:L.renk||'#34D399', yonetici_id:L.yonetici_id, takimlar, maclar, format:L.format||'tek',
        grupSayi:L.grup_sayi||0, sehir:L.sehir, ilce:L.ilce, kisi:L.kisi||8,
        sponsorAd:L.sponsor_ad, sponsorEmoji:L.sponsor_emoji, durum:L.durum||'aktif',
        kurallarKilit:!!L.kurallar_kilit, kurallar:L.kurallar||"", iliskisel:true };
    }catch(e){ console.warn('ligYukle',e); return null; }
  },
  // Test verisini temizle: kullanıcının tüm ligleri + öksüz oyuncular (admin)
  async testVerisiSil(yoneticiId){
    if(!sb) return {hata:"bağlantı yok"};
    try{
      const {data}=await sb.from('ligler').select('id').eq('yonetici_id',yoneticiId);
      for(const l of (data||[])){ await sb.from('ligler').delete().eq('id',l.id); }
      // üyeliği kalmayan (öksüz) oyuncuları sil
      const [{data:oy},{data:ot}]=await Promise.all([ sb.from('oyuncular').select('player_id'), sb.from('oyuncu_takim').select('player_id') ]);
      const aktif=new Set((ot||[]).map(x=>x.player_id));
      const oksuz=(oy||[]).filter(o=>!aktif.has(o.player_id)).map(o=>o.player_id);
      for(let i=0;i<oksuz.length;i+=100){ await sb.from('oyuncular').delete().in('player_id',oksuz.slice(i,i+100)); }
      return {ok:true, lig:(data||[]).length, oyuncu:oksuz.length};
    }catch(e){ return {hata:String(e&&e.message||e)}; }
  },
  // Bir yöneticinin (veya admin ise herkesin) tüm liglerini turnuva dizisi olarak yükle
  async liglerYukle(yoneticiId, hepsi){
    if(!sb) return [];
    try{
      const idSet=new Set();
      if(hepsi){
        // GERÇEK ligler (demo evren HARİÇ — evren null). Kolon henüz yoksa filtresiz yükle (dayanıklılık).
        let q=await sb.from('ligler').select('id').is('evren',null).order('olusturma',{ascending:false}).limit(300);
        if(q.error){ q=await sb.from('ligler').select('id').order('olusturma',{ascending:false}).limit(300); }
        (q.data||[]).forEach(x=>idSet.add(x.id));
      } else if(yoneticiId){
        // 1) sahibi olduğun ligler (demo evren HARİÇ; kolon yoksa filtresiz)
        try{ let q=await sb.from('ligler').select('id').eq('yonetici_id',yoneticiId).is('evren',null).limit(300); if(q.error){ q=await sb.from('ligler').select('id').eq('yonetici_id',yoneticiId).limit(300); } (q.data||[]).forEach(x=>idSet.add(x.id)); }catch(e){}
        // 2) takım sorumlusu (kaptan) olduğun ligler
        try{ const {data}=await sb.from('takimlar').select('lig_id').eq('yonetici_id',yoneticiId).limit(300); (data||[]).forEach(x=>x.lig_id&&idSet.add(x.lig_id)); }catch(e){}
        // 3) oyuncu olarak katıldığın ligler
        try{ const {data:pl}=await sb.from('oyuncular').select('player_id').eq('sahip_user_id',yoneticiId).limit(500); const pids=(pl||[]).map(x=>x.player_id); if(pids.length){ const {data:ot}=await sb.from('oyuncu_takim').select('lig_id').in('player_id',pids).limit(1000); (ot||[]).forEach(x=>x.lig_id&&idSet.add(x.lig_id)); } }catch(e){}
      }
      const idler=[...idSet];
      const sonuc=(await Promise.all(idler.map(id=>this.ligYukle(id)))).filter(Boolean);
      return sonuc;
    }catch(e){ return []; }
  },
  // Ziyaretçi/herkes için: tüm AKTİF public ligleri yükle (KVKK açık görünümle) — paralel
  async liglerYukleAcik(limit){
    if(!sb) return [];
    try{
      let q=await sb.from('ligler').select('id').eq('durum','aktif').is('evren',null).order('olusturma',{ascending:false}).limit(limit||60);
      if(q.error){ q=await sb.from('ligler').select('id').eq('durum','aktif').order('olusturma',{ascending:false}).limit(limit||60); }
      const idler=(q.data||[]).map(x=>x.id);
      const sonuc=(await Promise.all(idler.map(id=>this.ligYukle(id)))).filter(Boolean);
      return sonuc;
    }catch(e){ return []; }
  },
  // DEMO EVREN — sadece verilen evren markerlı ligleri yükle (gerçekten AYRI)
  async liglerEvrenYukle(evren){
    if(!sb || !evren) return [];
    try{
      const {data}=await sb.from('ligler').select('id').eq('evren',evren).order('olusturma',{ascending:false}).limit(300);
      const idler=(data||[]).map(x=>x.id);
      const sonuc=(await Promise.all(idler.map(id=>this.ligYukle(id)))).filter(Boolean);
      return sonuc;
    }catch(e){ return []; }
  },
  // YAYINLANAN EVREN — evren adı ne olursa olsun tüm herkese-açık evren liglerini yükle
  // (her giriş yapmış kullanıcı + ziyaretçi görebilir; RLS zaten okumaya açık).
  async liglerEvrenHepsi(limit){
    if(!sb) return [];
    try{
      const {data,error}=await sb.from('ligler').select('id').not('evren','is',null).order('olusturma',{ascending:false}).limit(limit||300);
      if(error) return [];
      const idler=(data||[]).map(x=>x.id);
      const sonuc=(await Promise.all(idler.map(id=>this.ligYukle(id)))).filter(Boolean);
      return sonuc;
    }catch(e){ return []; }
  },
  // VERİ SAĞLIK TARAMASI (Süper Admin) — salt-okunur anomali sayımı. Yeni tablo/RPC yok.
  async veriSaglik(){
    if(!sb) return {hata:"bağlantı yok"};
    var s={takimsizLig:0, oksuzOyuncu:0, hayaletMac:0};
    try{
      var lgP=sb.from('ligler').select('id').or('silindi.is.null,silindi.eq.false');
      var tkP=sb.from('takimlar').select('lig_id');
      var oyP=sb.from('oyuncular').select('player_id');
      var otP=sb.from('oyuncu_takim').select('player_id');
      var hmP=sb.from('maclar').select('id',{count:'exact',head:true}).eq('oynandi',false).or('ev_skor.gt.0,dep_skor.gt.0');
      var [lg,tk,oy,ot,hm]=await Promise.all([lgP,tkP,oyP,otP,hmP]);
      var takimli=new Set(((tk.data)||[]).map(function(x){return x.lig_id;}));
      s.takimsizLig=((lg.data)||[]).filter(function(l){return !takimli.has(l.id);}).length;
      var aktif=new Set(((ot.data)||[]).map(function(x){return x.player_id;}));
      s.oksuzOyuncu=((oy.data)||[]).filter(function(o){return !aktif.has(o.player_id);}).length;
      s.hayaletMac=hm.count||0;
      s.zaman=new Date().toISOString();
      return s;
    }catch(e){ return {hata:String(e&&e.message||e)}; }
  },
  // SİSTEM ANAHTARLARI (Faz 3) — sistem_ayar kv tablosu. Tablo yoksa sessizce boş döner (güvenli).
  async ayarlarOku(){ if(!sb) return {}; try{ const {data,error}=await sb.from('sistem_ayar').select('anahtar,deger'); if(error) return {}; const o={}; (data||[]).forEach(x=>{o[x.anahtar]=x.deger;}); return o; }catch(e){ return {}; } },
  async ayarYaz(anahtar,deger){ if(!sb) return {hata:"yok"}; try{ const {error}=await sb.from('sistem_ayar').upsert({anahtar, deger:String(deger), guncelleme:new Date().toISOString()},{onConflict:'anahtar'}); return error?{hata:error.message}:{ok:true}; }catch(e){ return {hata:String(e)}; } },
  // DEMO EVREN — sadece bu evreni sil (gerçek liglere dokunmaz). evren=null → tüm demo.
  async evrenSil(evren){ if(!sb) return {hata:"yok"}; try{ const {data,error}=await sb.rpc('evren_sil',{p_evren:evren||null}); return error?{hata:error.message}:{ok:true,adet:data||0}; }catch(e){ return {hata:String(e)}; } },
};
/* Supabase hata mesajlarını Türkçeye çevir */
const authHata = (m)=>{ m=(m||"").toLowerCase();
  if(m.includes("invalid login")) return "E-posta veya şifre hatalı.";
  if(m.includes("already registered")||m.includes("already been registered")) return "Bu e-posta zaten kayıtlı. Giriş yapmayı dene.";
  if(m.includes("email not confirmed")) return "E-postanı onaylaman gerekiyor (gelen kutunu kontrol et).";
  if(m.includes("password should be")||m.includes("at least 6")) return "Şifre en az 6 karakter olmalı.";
  if(m.includes("rate limit")||m.includes("too many")) return "Çok fazla deneme. Biraz sonra tekrar dene.";
  if(m.includes("unable to validate email")||m.includes("invalid email")) return "Geçerli bir e-posta gir.";
  return "İşlem başarısız oldu. Tekrar dene.";
};

/* ============================================================
   TEMALAR — renk + font birlikte değişir
   ============================================================ */
