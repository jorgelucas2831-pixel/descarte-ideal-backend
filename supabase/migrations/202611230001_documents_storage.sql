-- Descarte Ideal — Central Documental / Fase 1
-- Execute somente no projeto Supabase do Descarte Ideal.
-- Armazena os arquivos em bucket privado; os metadados ficam em public.app_records
-- com record_type = 'documents'. Nenhum arquivo é armazenado como base64.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'descarte-documentos',
  'descarte-documentos',
  false,
  15728640,
  array['application/pdf', 'image/jpeg', 'image/png']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Acesso restrito a usuários autenticados cujo perfil seja administrador.
-- Os arquivos são gravados em caminhos iniciados pelo UUID do usuário.
drop policy if exists "di_documents_admin_read" on storage.objects;
create policy "di_documents_admin_read"
on storage.objects for select
to authenticated
using (
  bucket_id = 'descarte-documentos'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'administrador'
  )
);

drop policy if exists "di_documents_admin_insert" on storage.objects;
create policy "di_documents_admin_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'descarte-documentos'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'administrador'
  )
);

-- Não há política de exclusão: a aplicação arquiva os metadados e preserva o arquivo.
