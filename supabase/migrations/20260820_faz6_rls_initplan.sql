-- Faz 6 — RLS initplan perf: auth.uid()/role()/jwt() → (select ...) sarma.
-- Anlamsal BİREBİR AYNI; satır-başı yerine sorgu-başı 1 kez değerlenir.
do $$
declare r record; nq text; nw text; stmt text;
begin
  for r in select tablename,policyname,qual,with_check from pg_policies where schemaname='public'
      and (coalesce(qual,'')~'auth\.(uid|role|jwt)\(\)' or coalesce(with_check,'')~'auth\.(uid|role|jwt)\(\)')
  loop
    stmt := format('alter policy %I on public.%I', r.policyname, r.tablename);
    if r.qual is not null then
      stmt := stmt || format(' using (%s)', regexp_replace(r.qual,'auth\.(uid|role|jwt)\(\)','(select auth.\1())','g'));
    end if;
    if r.with_check is not null then
      stmt := stmt || format(' with check (%s)', regexp_replace(r.with_check,'auth\.(uid|role|jwt)\(\)','(select auth.\1())','g'));
    end if;
    execute stmt;
  end loop;
end $$;
