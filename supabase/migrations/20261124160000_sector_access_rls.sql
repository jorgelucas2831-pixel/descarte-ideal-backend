-- Descarte Ideal | Segurança por setor (RLS)
-- Corrige as políticas permissivas dos módulos comerciais e app_records.
-- Preserva tabelas, dados, funções de autorização e vínculos existentes.
-- Mapeamento:
--   Comercial: clientes, segmentos, prospecção e propostas
--   Financeiro: invoices em app_records
--   Frota: fleet_* em app_records e serviços terceirizados categoria fleet
--   Operacional: serviços terceirizados categoria operations
--   Administrativo: serviços terceirizados categoria other

begin;

-- Helpers pequenos e determinísticos para manter o mapeamento explícito.
create or replace function public.app_record_sector_code(p_record_type text)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when p_record_type = 'invoices' then 'financeiro'
    when p_record_type in ('fleet_drivers','fleet_freights','fleet_partners','fleet_vehicles') then 'frota'
    else null
  end;
$$;

create or replace function public.outsourced_order_sector_code(p_category text)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select case p_category
    when 'fleet' then 'frota'
    when 'operations' then 'operacional'
    when 'other' then 'administrativo'
    else null
  end;
$$;

-- CLIENTES: leitura compartilhada apenas com setores que precisam consultar
-- a carteira; criação/edição/exclusão permanecem sob responsabilidade comercial.
alter table public.clients enable row level security;
drop policy if exists clients_authenticated_select on public.clients;
drop policy if exists clients_authenticated_insert on public.clients;
drop policy if exists clients_authenticated_update on public.clients;
drop policy if exists clients_authenticated_delete on public.clients;

create policy clients_sector_select
on public.clients for select to authenticated
using (
  public.has_sector_permission('comercial','view')
  or public.has_sector_permission('financeiro','view')
  or public.has_sector_permission('frota','view')
  or public.has_sector_permission('operacional','view')
  or public.has_sector_permission('administrativo','view')
);

create policy clients_commercial_insert
on public.clients for insert to authenticated
with check (
  public.has_sector_permission('comercial','create')
  and created_by = auth.uid()
);

create policy clients_commercial_update
on public.clients for update to authenticated
using (public.has_sector_permission('comercial','edit'))
with check (public.has_sector_permission('comercial','edit'));

create policy clients_commercial_delete
on public.clients for delete to authenticated
using (public.has_sector_permission('comercial','delete'));

-- SEGMENTOS DA CARTEIRA: gestão pelo Comercial.
alter table public.client_business_segments enable row level security;
drop policy if exists "Authenticated users manage client business segments" on public.client_business_segments;

create policy client_business_segments_select
on public.client_business_segments for select to authenticated
using (public.has_sector_permission('comercial','view'));

create policy client_business_segments_insert
on public.client_business_segments for insert to authenticated
with check (
  public.has_sector_permission('comercial','create')
  and (created_by is null or created_by = auth.uid())
);

create policy client_business_segments_update
on public.client_business_segments for update to authenticated
using (public.has_sector_permission('comercial','edit'))
with check (public.has_sector_permission('comercial','edit'));

create policy client_business_segments_delete
on public.client_business_segments for delete to authenticated
using (public.has_sector_permission('comercial','delete'));

-- PROSPECÇÃO: gestão pelo Comercial.
alter table public.sales_prospects enable row level security;
drop policy if exists "Authenticated users manage sales prospects" on public.sales_prospects;

create policy sales_prospects_select
on public.sales_prospects for select to authenticated
using (public.has_sector_permission('comercial','view'));

create policy sales_prospects_insert
on public.sales_prospects for insert to authenticated
with check (
  public.has_sector_permission('comercial','create')
  and (created_by is null or created_by = auth.uid())
);

create policy sales_prospects_update
on public.sales_prospects for update to authenticated
using (public.has_sector_permission('comercial','edit'))
with check (public.has_sector_permission('comercial','edit'));

create policy sales_prospects_delete
on public.sales_prospects for delete to authenticated
using (public.has_sector_permission('comercial','delete'));

-- PROPOSTAS: edição comercial; mudança para aprovada/recusada exige approve.
alter table public.service_proposals enable row level security;
drop policy if exists "Authenticated users manage service proposals" on public.service_proposals;

create policy service_proposals_select
on public.service_proposals for select to authenticated
using (public.has_sector_permission('comercial','view'));

create policy service_proposals_insert
on public.service_proposals for insert to authenticated
with check (
  public.has_sector_permission('comercial','create')
  and (created_by is null or created_by = auth.uid())
);

create policy service_proposals_update
on public.service_proposals for update to authenticated
using (
  public.has_sector_permission('comercial','edit')
  or public.has_sector_permission('comercial','approve')
)
with check (
  public.has_sector_permission('comercial','edit')
  or public.has_sector_permission('comercial','approve')
);

create policy service_proposals_delete
on public.service_proposals for delete to authenticated
using (public.has_sector_permission('comercial','delete'));

create or replace function public.enforce_service_proposal_approval_permission()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if new.status is distinct from old.status
     and new.status in ('approved','rejected')
     and not public.has_sector_permission('comercial','approve') then
    raise exception 'Permissão de aprovação comercial necessária para alterar o status para %', new.status
      using errcode = '42501';
  end if;

  if (to_jsonb(new) - 'status') is distinct from (to_jsonb(old) - 'status')
     and not public.has_sector_permission('comercial','edit') then
    raise exception 'Permissão de edição comercial necessária para alterar os dados da proposta'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists service_proposals_approval_permission on public.service_proposals;
create trigger service_proposals_approval_permission
before update on public.service_proposals
for each row execute function public.enforce_service_proposal_approval_permission();

-- SERVIÇOS TERCEIRIZADOS: setor definido pela categoria da ordem.
alter table public.outsourced_service_orders enable row level security;
drop policy if exists "Authenticated users manage outsourced service orders" on public.outsourced_service_orders;

create policy outsourced_orders_select
on public.outsourced_service_orders for select to authenticated
using (
  public.has_sector_permission(
    public.outsourced_order_sector_code(service_category), 'view'
  )
);

create policy outsourced_orders_insert
on public.outsourced_service_orders for insert to authenticated
with check (
  public.has_sector_permission(
    public.outsourced_order_sector_code(service_category), 'create'
  )
  and (created_by is null or created_by = auth.uid())
);

create policy outsourced_orders_update
on public.outsourced_service_orders for update to authenticated
using (
  public.has_sector_permission(
    public.outsourced_order_sector_code(service_category), 'edit'
  )
)
with check (
  public.has_sector_permission(
    public.outsourced_order_sector_code(service_category), 'edit'
  )
);

create policy outsourced_orders_delete
on public.outsourced_service_orders for delete to authenticated
using (
  public.has_sector_permission(
    public.outsourced_order_sector_code(service_category), 'delete'
  )
);

-- APP_RECORDS: cada tipo conhecido é protegido pelo setor correspondente.
-- Tipos não mapeados ficam negados a usuários comuns até serem classificados.
alter table public.app_records enable row level security;
drop policy if exists app_records_authenticated_select on public.app_records;
drop policy if exists app_records_authenticated_insert on public.app_records;
drop policy if exists app_records_authenticated_update on public.app_records;
drop policy if exists app_records_authenticated_delete on public.app_records;

create policy app_records_sector_select
on public.app_records for select to authenticated
using (
  public.has_sector_permission(
    public.app_record_sector_code(record_type), 'view'
  )
);

create policy app_records_sector_insert
on public.app_records for insert to authenticated
with check (
  created_by = auth.uid()
  and public.has_sector_permission(
    public.app_record_sector_code(record_type), 'create'
  )
);

create policy app_records_sector_update
on public.app_records for update to authenticated
using (
  public.has_sector_permission(
    public.app_record_sector_code(record_type), 'edit'
  )
)
with check (
  public.has_sector_permission(
    public.app_record_sector_code(record_type), 'edit'
  )
);

create policy app_records_sector_delete
on public.app_records for delete to authenticated
using (
  public.has_sector_permission(
    public.app_record_sector_code(record_type), 'delete'
  )
);

comment on function public.app_record_sector_code(text) is
  'Mapeia tipos de app_records para setores: invoices=financeiro; fleet_*=frota. Tipos não mapeados retornam NULL e ficam negados a usuários comuns.';
comment on function public.outsourced_order_sector_code(text) is
  'Mapeia categorias de serviços terceirizados: fleet=frota; operations=operacional; other=administrativo.';

commit;
