create table if not exists public.import_versions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  published_at timestamptz,
  status text not null check (status in ('pending', 'published', 'superseded')),
  original_file_path text,
  original_file_name text,
  record_count integer not null check (record_count >= 0),
  warning_count integer not null check (warning_count >= 0),
  summary jsonb not null default '{}'::jsonb,
  source_version_id uuid references public.import_versions(id)
);

create table if not exists public.session_results (
  id bigint generated always as identity primary key,
  import_version_id uuid not null references public.import_versions(id) on delete cascade,
  game_date date not null,
  session_number integer not null check (session_number > 0),
  player_name text not null,
  pnl numeric not null,
  participated boolean not null,
  source_sheet text,
  source_row integer check (source_row > 0),
  session_status text check (session_status in ('VALID', 'WARNING')),
  source_player_name text,
  unique (import_version_id, game_date, session_number, player_name)
);

create index if not exists session_results_version_idx on public.session_results(import_version_id, game_date, session_number);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.import_versions enable row level security;
alter table public.session_results enable row level security;
alter table public.app_settings enable row level security;

insert into storage.buckets (id, name, public)
values ('session-imports', 'session-imports', false)
on conflict (id) do update set public = false;

create or replace function public.publish_import_version(target_version_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.import_versions where id = target_version_id and status = 'pending') then
    raise exception 'Import version is not available for publishing.';
  end if;

  update public.import_versions set status = 'superseded' where status = 'published';
  update public.import_versions set status = 'published', published_at = now() where id = target_version_id;
  insert into public.app_settings as settings (key, value, updated_at)
  values ('active_import_version_id', jsonb_build_object('version_id', target_version_id), now())
  on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at;
end;
$$;

create or replace function public.restore_import_version(source_version_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  restored_version_id uuid := gen_random_uuid();
  source_import public.import_versions%rowtype;
begin
  select * into source_import from public.import_versions where id = source_version_id;
  if not found then
    raise exception 'Import version not found.';
  end if;

  insert into public.import_versions (
    id, status, original_file_path, original_file_name, record_count, warning_count, summary, source_version_id
  ) values (
    restored_version_id, 'pending', source_import.original_file_path, source_import.original_file_name,
    source_import.record_count, source_import.warning_count, source_import.summary, source_version_id
  );

  insert into public.session_results (
    import_version_id, game_date, session_number, player_name, pnl, participated,
    source_sheet, source_row, session_status, source_player_name
  )
  select restored_version_id, game_date, session_number, player_name, pnl, participated,
    source_sheet, source_row, session_status, source_player_name
  from public.session_results
  where import_version_id = source_version_id;

  perform public.publish_import_version(restored_version_id);
end;
$$;

revoke all on function public.publish_import_version(uuid) from public;
revoke all on function public.restore_import_version(uuid) from public;
grant execute on function public.publish_import_version(uuid) to service_role;
grant execute on function public.restore_import_version(uuid) to service_role;
