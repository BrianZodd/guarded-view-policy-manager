-- Guarded View Policy Manager database schema.
-- Run this once in the Supabase SQL editor of a new project.

create table public.shared_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  recipient text not null check (char_length(recipient) between 1 and 120),
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.item_restrictions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.shared_items(id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  restriction_type text not null check (restriction_type in (
    'NUM_VIEWERS','MAX_VIEWERS','ALLOW_PEOPLE','DENY_PEOPLE','VIEW_TOGETHER',
    'ALLOWED_LOCATION','NO_EXT_RECORDING','NO_EXT_DISPLAY','RECORD_SA')),
  value text not null default '',
  created_at timestamptz not null default now(),
  unique (item_id, restriction_type)
);

create index item_restrictions_item_id_idx on public.item_restrictions(item_id);
create index shared_items_owner_id_idx on public.shared_items(owner_id);
create index item_restrictions_owner_id_idx on public.item_restrictions(owner_id);

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;

create trigger shared_items_touch before update on public.shared_items
for each row execute function public.touch_updated_at();

-- Row level security: a signed in user can only ever see or change their own rows.
alter table public.shared_items enable row level security;
alter table public.item_restrictions enable row level security;

create policy "owners read items" on public.shared_items for select to authenticated using ((select auth.uid()) = owner_id);
create policy "owners insert items" on public.shared_items for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "owners update items" on public.shared_items for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "owners delete items" on public.shared_items for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "owners read restrictions" on public.item_restrictions for select to authenticated using ((select auth.uid()) = owner_id);
create policy "owners insert restrictions" on public.item_restrictions for insert to authenticated with check (
  (select auth.uid()) = owner_id and exists (select 1 from public.shared_items i where i.id = item_id and i.owner_id = (select auth.uid())));
create policy "owners update restrictions" on public.item_restrictions for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "owners delete restrictions" on public.item_restrictions for delete to authenticated using ((select auth.uid()) = owner_id);
