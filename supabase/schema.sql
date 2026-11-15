-- =====================================================================
-- Solo Contest — banco de dados no Supabase
-- Cole este arquivo inteiro em: Supabase > SQL Editor > New query > Run
-- Pode rodar mais de uma vez sem problema.
-- =====================================================================

-- 1) Tabela única de registros (planos, matérias, sessões, revisões etc.)
--    "entity" diz o tipo (StudyPlan, Subject, Topic...) e "data" guarda os campos.
create table if not exists public.records (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entity       text not null,
  data         jsonb not null default '{}'::jsonb,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create index if not exists records_user_entity_idx on public.records (user_id, entity, created_date desc);
create index if not exists records_data_gin on public.records using gin (data jsonb_path_ops);

-- 2) Segurança: cada pessoa só enxerga e altera os PRÓPRIOS registros
alter table public.records enable row level security;

drop policy if exists "records_select_own" on public.records;
drop policy if exists "records_insert_own" on public.records;
drop policy if exists "records_update_own" on public.records;
drop policy if exists "records_delete_own" on public.records;

create policy "records_select_own" on public.records
  for select to authenticated using (user_id = (select auth.uid()));
create policy "records_insert_own" on public.records
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "records_update_own" on public.records
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "records_delete_own" on public.records
  for delete to authenticated using (user_id = (select auth.uid()));

-- 3) Atualiza "updated_date" automaticamente
create or replace function public.touch_updated_date()
returns trigger language plpgsql as $$
begin
  new.updated_date = now();
  return new;
end $$;

drop trigger if exists records_touch on public.records;
create trigger records_touch before update on public.records
  for each row execute function public.touch_updated_date();

-- 4) Excluir a própria conta (exigido pela Google Play)
--    Apaga o usuário; os registros dele somem junto (on delete cascade).
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end $$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- 5) Imagens do "Onde Parei" (fotos dos materiais)
insert into storage.buckets (id, name, public)
values ('study-images', 'study-images', true)
on conflict (id) do nothing;

drop policy if exists "study_images_select_own" on storage.objects;
drop policy if exists "study_images_insert_own" on storage.objects;
drop policy if exists "study_images_delete_own" on storage.objects;

create policy "study_images_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'study-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "study_images_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'study-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "study_images_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'study-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
