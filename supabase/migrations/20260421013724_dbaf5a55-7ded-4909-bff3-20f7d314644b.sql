
-- 1) Create a SECURITY DEFINER helper to check roles without recursing into profiles RLS
create or replace function public.has_role(_user_id uuid, _role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = _user_id and role = _role
  )
$$;

-- 2) Drop the recursive / overly-permissive policies on profiles
drop policy if exists "Admins and cajeros can view all profiles" on public.profiles;
drop policy if exists "Admins can update all profiles" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can update own profile points on welcome" on public.profiles;

-- 3) Recreate SELECT policy for staff using has_role (no recursion)
create policy "Staff can view all profiles"
on public.profiles
for select
to authenticated
using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'cajero'));

-- 4) Admins can update any profile (including role)
create policy "Admins can update all profiles"
on public.profiles
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- 5) Users can update their own profile but cannot change protected columns
--    (role, puntos, puntos_totales, activo, id, email).
--    The OLD row values must equal the NEW row values for these columns.
create policy "Users can update own profile (safe columns)"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (
  auth.uid() = id
  and role = (select p.role from public.profiles p where p.id = auth.uid())
  and puntos = (select p.puntos from public.profiles p where p.id = auth.uid())
  and puntos_totales = (select p.puntos_totales from public.profiles p where p.id = auth.uid())
  and activo = (select p.activo from public.profiles p where p.id = auth.uid())
  and email = (select p.email from public.profiles p where p.id = auth.uid())
);

-- 6) Cajeros need to add points to a customer's profile (suma + canje flows).
--    Allow cajero/admin to update puntos and puntos_totales but NOT role.
create policy "Cajeros can update customer points"
on public.profiles
for update
to authenticated
using (public.has_role(auth.uid(), 'cajero') or public.has_role(auth.uid(), 'admin'))
with check (
  (public.has_role(auth.uid(), 'cajero') or public.has_role(auth.uid(), 'admin'))
  and role = (select p.role from public.profiles p where p.id = profiles.id)
);

-- 7) Welcome bonus: allow a brand new user to set their own puntos to 10 once
--    (only when current puntos = 0 and new puntos <= 10, role unchanged).
create policy "Users can claim welcome bonus"
on public.profiles
for update
to authenticated
using (auth.uid() = id and puntos = 0)
with check (
  auth.uid() = id
  and puntos <= 10
  and puntos_totales <= 10
  and role = 'cliente'
);

-- 8) Fix mutable search_path on existing functions
create or replace function public.update_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nombre, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', 'Usuario'),
    new.email
  );
  return new;
end;
$$;
