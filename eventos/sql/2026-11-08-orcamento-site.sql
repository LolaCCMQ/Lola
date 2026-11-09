-- Orçamento de eventos pelo site (08/11/2026)
-- Rodar UMA vez no SQL Editor do Supabase. Só cria/acrescenta: nada é apagado.
-- Inclui as colunas da Vitrine (2026-11-08-vitrine-itens.sql) — se já rodou aquele, não tem problema rodar de novo.

-- 1) Itens do catálogo de eventos: foto, ficha ligada, marcações e "aparece no site"
alter table public.lola_eventos_itens add column if not exists foto_url text;
alter table public.lola_eventos_itens add column if not exists ficha_id uuid;
alter table public.lola_eventos_itens add column if not exists tags text[];
alter table public.lola_eventos_itens add column if not exists publico boolean not null default false;

-- 2) Pedidos de orçamento que chegam pelo site (lolabar.com.br/orcamento-evento.html)
create table if not exists public.lola_eventos_pedidos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nome text not null check (char_length(nome) between 1 and 200),
  telefone text check (char_length(telefone) <= 60),
  email text check (char_length(email) <= 200),
  ocasiao text check (char_length(ocasiao) <= 120),
  data date,
  horario text check (char_length(horario) <= 40),
  pax int check (pax between 1 and 5000),
  local text check (char_length(local) <= 60),
  formato text check (char_length(formato) <= 60),
  duracao text check (char_length(duracao) <= 40),
  itens jsonb not null default '[]'::jsonb check (jsonb_typeof(itens) = 'array' and jsonb_array_length(itens) <= 200),
  subtotal numeric,
  servico numeric,
  estimativa numeric,
  obs text check (char_length(obs) <= 2000),
  origem text not null default 'site',
  status text not null default 'novo',            -- novo | convertido | arquivado
  evento_id uuid,                                  -- evento criado a partir do pedido
  atendido_por text,
  atendido_em timestamptz
);
alter table public.lola_eventos_pedidos enable row level security;

-- O site só consegue CRIAR pedido novo (não altera status nem liga a evento).
drop policy if exists "site cria pedido" on public.lola_eventos_pedidos;
create policy "site cria pedido" on public.lola_eventos_pedidos
  for insert to anon, authenticated
  with check (status = 'novo' and evento_id is null and atendido_por is null);

-- O portal (que usa a mesma chave pública, sem login) lê e atualiza.
-- ATENÇÃO: igual às outras tabelas do portal, quem tiver a chave pública consegue ler estes pedidos
-- (nome/telefone/e-mail de clientes). Isso entra na revisão de segurança (RLS) que já está pendente.
drop policy if exists "portal le pedidos" on public.lola_eventos_pedidos;
create policy "portal le pedidos" on public.lola_eventos_pedidos for select to anon, authenticated using (true);
drop policy if exists "portal atualiza pedidos" on public.lola_eventos_pedidos;
create policy "portal atualiza pedidos" on public.lola_eventos_pedidos for update to anon, authenticated using (true) with check (true);

grant select, insert, update on public.lola_eventos_pedidos to anon, authenticated;

notify pgrst, 'reload schema';
