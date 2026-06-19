-- Ejecuta este archivo en Supabase SQL Editor.
-- Asegura que el menu publico solo pueda leer productos/categorias activos
-- y que solo usuarios con perfil rol='admin' puedan administrar datos.

alter table public.perfiles enable row level security;
alter table public.categorias enable row level security;
alter table public.productos enable row level security;

drop policy if exists "perfiles_select_own" on public.perfiles;
drop policy if exists "categorias_public_read_active" on public.categorias;
drop policy if exists "categorias_admin_all" on public.categorias;
drop policy if exists "productos_public_read_active" on public.productos;
drop policy if exists "productos_admin_all" on public.productos;

create policy "perfiles_select_own"
on public.perfiles
for select
to authenticated
using (id = auth.uid());

create policy "categorias_public_read_active"
on public.categorias
for select
to anon, authenticated
using (activo = true);

create policy "categorias_admin_all"
on public.categorias
for all
to authenticated
using (
  exists (
    select 1
    from public.perfiles p
    where p.id = auth.uid()
      and p.rol = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.perfiles p
    where p.id = auth.uid()
      and p.rol = 'admin'
  )
);

create policy "productos_public_read_active"
on public.productos
for select
to anon, authenticated
using (activo = true);

create policy "productos_admin_all"
on public.productos
for all
to authenticated
using (
  exists (
    select 1
    from public.perfiles p
    where p.id = auth.uid()
      and p.rol = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.perfiles p
    where p.id = auth.uid()
      and p.rol = 'admin'
  )
);
