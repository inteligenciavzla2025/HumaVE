-- Bucket privado para fotos de personas registradas (RF-01: comprimidas a
-- <200KB en el cliente antes de subir). Acceso via URL firmada con
-- expiracion, no publico.

insert into storage.buckets (id, name, public)
values ('fotos-personas', 'fotos-personas', false)
on conflict (id) do nothing;

create policy "fotos_personas_insert" on storage.objects for insert with check (
  bucket_id = 'fotos-personas' and (select auth.uid()) is not null
);

create policy "fotos_personas_select" on storage.objects for select using (
  bucket_id = 'fotos-personas' and (select auth.uid()) is not null
);
