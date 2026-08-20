-- ForzaLig — Supabase ortamı taklidi (restore testi için).
-- Boş bir Postgres 17'yi, canlı schema.sql'in uygulanabileceği hale getirir:
-- Supabase rolleri, şemaları, uzantıları ve auth.* stub fonksiyonları.
-- NOT: Bu dosya SADECE test ortamı içindir; production'a uygulanmaz.

-- Roller ------------------------------------------------------------
do $$ begin create role anon            nologin noinherit;            exception when duplicate_object then null; end $$;
do $$ begin create role authenticated   nologin noinherit;            exception when duplicate_object then null; end $$;
do $$ begin create role service_role    nologin noinherit bypassrls;  exception when duplicate_object then null; end $$;
do $$ begin create role authenticator   noinherit login password 'x'; exception when duplicate_object then null; end $$;
do $$ begin create role supabase_admin  superuser;                    exception when duplicate_object then null; end $$;
grant anon, authenticated, service_role to authenticator;

-- Şemalar -----------------------------------------------------------
create schema if not exists auth;
create schema if not exists storage;
create schema if not exists extensions;
create schema if not exists graphql_public;
create schema if not exists realtime;
create schema if not exists vault;

-- Uzantılar ---------------------------------------------------------
create extension if not exists pgcrypto   schema extensions;
create extension if not exists "uuid-ossp" schema extensions;

-- auth.* stub fonksiyonları (RLS policy'leri bunlara referans verir) --
create or replace function auth.uid()  returns uuid  language sql stable as
$$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
create or replace function auth.role() returns text  language sql stable as
$$ select coalesce(nullif(current_setting('request.jwt.claim.role', true),''),'anon') $$;
create or replace function auth.jwt()  returns jsonb language sql stable as
$$ select coalesce(nullif(current_setting('request.jwt.claims', true),'')::jsonb,'{}'::jsonb) $$;

-- auth.users stub
create table if not exists auth.users(id uuid primary key default gen_random_uuid(), email text, created_at timestamptz default now());

-- Gerçek Supabase'de anon/authenticated auth şemasını kullanabilir ve
-- auth.uid()/role()/jwt() çağırabilir. RLS policy testlerinin doğru
-- çalışması için aynı yetkileri ver.
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid(), auth.role(), auth.jwt() to anon, authenticated;

-- Supabase webhook/graphql/realtime stub
create schema if not exists supabase_functions;
create schema if not exists graphql;
create schema if not exists _realtime;
create or replace function supabase_functions.http_request() returns trigger language plpgsql as $$ begin return new; end $$;

-- storage yardımcıları (güvenlik amaçlı; şema public'e referans verirse) --
create table if not exists storage.buckets(id text primary key, name text, public boolean);
create table if not exists storage.objects(
  id uuid primary key default gen_random_uuid(),
  bucket_id text, name text, owner uuid, metadata jsonb,
  created_at timestamptz default now(), updated_at timestamptz default now());
create or replace function storage.foldername(name text) returns text[] language sql immutable as
$$ select string_to_array(name,'/') $$;
