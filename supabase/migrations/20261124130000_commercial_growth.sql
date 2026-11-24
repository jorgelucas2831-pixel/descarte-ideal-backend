-- Descarte Ideal | Expansão comercial e serviços
-- Migration incremental: não altera nem remove os dados existentes.

create table if not exists public.client_business_segments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  segment text not null check (segment in ('materials','services','transport')),
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  unique (client_id, segment)
);

create table if not exists public.sales_prospects (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  document text,
  industry text,
  contact_name text,
  phone text,
  email text,
  source text,
  status text not null default 'new' check (status in ('new','contacted','qualified','proposal','won','lost')),
  next_action_at date,
  notes text,
  converted_client_id uuid references public.clients(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid()
);

create table if not exists public.service_proposals (
  id uuid primary key default gen_random_uuid(),
  proposal_number text not null unique,
  client_id uuid references public.clients(id) on delete set null,
  prospect_id uuid references public.sales_prospects(id) on delete set null,
  business_unit text not null default 'services' check (business_unit in ('materials','services','transport')),
  service_type text not null,
  scope text,
  proposed_value numeric(14,2) not null default 0 check (proposed_value >= 0),
  estimated_cost numeric(14,2) not null default 0 check (estimated_cost >= 0),
  status text not null default 'draft' check (status in ('draft','sent','negotiation','approved','rejected','expired')),
  sent_at date,
  valid_until date,
  responsible text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  constraint service_proposals_party_check check (client_id is not null or prospect_id is not null)
);

create table if not exists public.outsourced_service_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  client_id uuid references public.clients(id) on delete set null,
  provider_name text not null,
  service_category text not null default 'fleet' check (service_category in ('fleet','operations','other')),
  description text not null,
  service_date date not null default current_date,
  cost_amount numeric(14,2) not null default 0 check (cost_amount >= 0),
  billed_amount numeric(14,2) not null default 0 check (billed_amount >= 0),
  status text not null default 'scheduled' check (status in ('scheduled','in_progress','completed','paid','cancelled')),
  reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid()
);

alter table public.client_business_segments enable row level security;
alter table public.sales_prospects enable row level security;
alter table public.service_proposals enable row level security;
alter table public.outsourced_service_orders enable row level security;

drop policy if exists "Authenticated users manage client business segments" on public.client_business_segments;
create policy "Authenticated users manage client business segments"
on public.client_business_segments for all to authenticated
using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "Authenticated users manage sales prospects" on public.sales_prospects;
create policy "Authenticated users manage sales prospects"
on public.sales_prospects for all to authenticated
using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "Authenticated users manage service proposals" on public.service_proposals;
create policy "Authenticated users manage service proposals"
on public.service_proposals for all to authenticated
using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "Authenticated users manage outsourced service orders" on public.outsourced_service_orders;
create policy "Authenticated users manage outsourced service orders"
on public.outsourced_service_orders for all to authenticated
using (auth.uid() is not null) with check (auth.uid() is not null);

grant select, insert, update, delete on public.client_business_segments to authenticated;
grant select, insert, update, delete on public.sales_prospects to authenticated;
grant select, insert, update, delete on public.service_proposals to authenticated;
grant select, insert, update, delete on public.outsourced_service_orders to authenticated;

create index if not exists idx_client_business_segments_client on public.client_business_segments(client_id);
create index if not exists idx_sales_prospects_status on public.sales_prospects(status);
create index if not exists idx_sales_prospects_next_action on public.sales_prospects(next_action_at);
create index if not exists idx_service_proposals_status on public.service_proposals(status);
create index if not exists idx_service_proposals_client on public.service_proposals(client_id);
create index if not exists idx_outsourced_service_orders_date on public.outsourced_service_orders(service_date);
create index if not exists idx_outsourced_service_orders_client on public.outsourced_service_orders(client_id);
