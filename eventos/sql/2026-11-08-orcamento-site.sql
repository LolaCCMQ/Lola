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
  formato text check (char_length(formato) <= 60),        -- nome do pacote (tipo de evento)
  pacote_id uuid,
  duracao text check (char_length(duracao) <= 40),
  horas numeric,
  preco_pp numeric,                                      -- preço por pessoa do pacote na hora do pedido
  detalhes jsonb not null default '{}'::jsonb,            -- ocasião, espaço exclusivo, nota fiscal, som, decoração…
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

-- 3) Pacotes (tipos de evento) que aparecem no funil do site — editados no app de Eventos (📦 Pacotes do site)
create table if not exists public.lola_eventos_pacotes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  nome text not null,
  descricao text,
  inclui text,                                  -- o que já está incluso (texto livre, aparece pro cliente)
  foto_url text,
  ordem int not null default 0,
  ativo boolean not null default true,
  locais text[] not null default array['ccmq','mac','outro'],
  duracoes jsonb not null default '[]'::jsonb,  -- [{"horas":2,"preco_pp":45}]
  grupos jsonb not null default '[]'::jsonb,    -- [{"titulo":"Salgados","secoes":["Comidinhas"],"itens":[],"escolher":3,"qtd_pp_h":1.5}]
  min_pax int not null default 10,
  servico_pct numeric not null default 10,
  estilo_servico text                           -- vai pro campo "Estilo de serviço" do evento (volante, ilhas, brunch, coquetel, buffet_quente…)
);
alter table public.lola_eventos_pacotes enable row level security;
drop policy if exists "todos leem pacotes" on public.lola_eventos_pacotes;
create policy "todos leem pacotes" on public.lola_eventos_pacotes for select to anon, authenticated using (true);
drop policy if exists "portal edita pacotes" on public.lola_eventos_pacotes;
create policy "portal edita pacotes" on public.lola_eventos_pacotes for all to anon, authenticated using (true) with check (true);
grant select, insert, update, delete on public.lola_eventos_pacotes to anon, authenticated;

-- Pacotes iniciais (preços em branco: preencher no app). Só insere se a tabela estiver vazia.
insert into public.lola_eventos_pacotes (nome, descricao, inclui, ordem, locais, duracoes, grupos, min_pax, estilo_servico)
select * from (values
  ('Coffee break', 'Pra reunião, workshop ou encontro de trabalho: salgado, doce e café que não acaba.', 'Café passado, chás, água com e sem gás e suco. Louça, montagem e reposição.', 1,
    array['ccmq','mac','outro'], '[{"horas":1,"preco_pp":null},{"horas":2,"preco_pp":null},{"horas":4,"preco_pp":null}]'::jsonb,
    '[{"titulo":"Salgados","secoes":["Comidinhas"],"itens":[],"escolher":3,"qtd_pp_h":1.5},{"titulo":"Doces","secoes":["Sobremesa"],"itens":[],"escolher":2,"qtd_pp_h":0.75}]'::jsonb, 10, 'ilhas'),
  ('Brunch', 'Manhã ou começo de tarde sem pressa, com coisas boas pra beliscar.', 'Café, chás, sucos e água. Louça e serviço.', 2,
    array['ccmq','mac','outro'], '[{"horas":2,"preco_pp":null},{"horas":3,"preco_pp":null}]'::jsonb,
    '[{"titulo":"Salgados","secoes":["Comidinhas"],"itens":[],"escolher":4,"qtd_pp_h":2},{"titulo":"Mini porções","secoes":["Mini porção"],"itens":[],"escolher":1,"qtd_pp_h":0.4},{"titulo":"Doces","secoes":["Sobremesa"],"itens":[],"escolher":2,"qtd_pp_h":0.75}]'::jsonb, 15, 'brunch'),
  ('Feijoada', 'A feijoada do Lola, com tudo o que acompanha, pra reunir a turma.', 'Feijoada completa com acompanhamentos, água e serviço.', 3,
    array['ccmq','mac','outro'], '[{"horas":3,"preco_pp":null},{"horas":4,"preco_pp":null}]'::jsonb,
    '[{"titulo":"Pra começar","secoes":["Comidinhas"],"itens":[],"escolher":2,"qtd_pp_h":0.7},{"titulo":"Sobremesa","secoes":["Sobremesa"],"itens":[],"escolher":1,"qtd_pp_h":0.35},{"titulo":"Bebidas","secoes":["Bebidas"],"itens":[],"escolher":2,"qtd_pp_h":0.7}]'::jsonb, 20, 'buffet_quente'),
  ('Coquetel + jantar', 'Comidinhas passando, mini porções quentes e doces no fim: festa de pé sem ninguém ir pra casa com fome.', 'Equipe de serviço, louça e montagem.', 4,
    array['ccmq','mac','outro'], '[{"horas":3,"preco_pp":null},{"horas":4,"preco_pp":null}]'::jsonb,
    '[{"titulo":"Comidinhas","secoes":["Comidinhas"],"itens":[],"escolher":5,"qtd_pp_h":4},{"titulo":"Mini porções","secoes":["Mini porção"],"itens":[],"escolher":2,"qtd_pp_h":0.35},{"titulo":"Doces","secoes":["Sobremesa"],"itens":[],"escolher":2,"qtd_pp_h":0.5},{"titulo":"Bebidas","secoes":["Bebidas"],"itens":[],"escolher":3,"qtd_pp_h":1}]'::jsonb, 20, 'coquetel'),
  ('Premium completo', 'O Lola inteiro no seu evento: mais opções, estações e bebida liberada.', 'Equipe completa, louça, montagem, estação de destaque e bebidas.', 5,
    array['ccmq','mac','outro'], '[{"horas":4,"preco_pp":null},{"horas":5,"preco_pp":null}]'::jsonb,
    '[{"titulo":"Comidinhas","secoes":["Comidinhas"],"itens":[],"escolher":7,"qtd_pp_h":4.5},{"titulo":"Mini porções","secoes":["Mini porção"],"itens":[],"escolher":3,"qtd_pp_h":0.4},{"titulo":"Doces","secoes":["Sobremesa"],"itens":[],"escolher":3,"qtd_pp_h":0.6},{"titulo":"Bebidas","secoes":["Bebidas"],"itens":[],"escolher":4,"qtd_pp_h":1.2}]'::jsonb, 30, 'coquetel')
) as v(nome, descricao, inclui, ordem, locais, duracoes, grupos, min_pax, estilo_servico)
where not exists (select 1 from public.lola_eventos_pacotes);

-- 4) Todo pedido do site vira, na hora, um evento "Pré-reserva" na aba Eventos do Portal.
--    O menu é montado a partir do catálogo de eventos (preço, unidade, louça, descrição) e da
--    ficha técnica ligada ao item (nome atual da ficha), lidos NO MOMENTO do pedido.
--    Quantidades: as que o site calculou pelo pacote (tipo × tempo × convidados), com teto de segurança.
create or replace function public.lola_pedido_site_cria_evento() returns trigger
language plpgsql security definer set search_path = public as $fn$
declare
  v_menu jsonb := '[]'::jsonb; v_it jsonb; v_ci record; v_ficha text; v_ev uuid;
  v_local text; v_cupula text; v_estilo text; v_obs text; v_det jsonb := coalesce(new.detalhes,'{}'::jsonb);
  v_qtd numeric; v_pax int := greatest(coalesce(new.pax,1),1);
begin
  for v_it in select * from jsonb_array_elements(coalesce(new.itens,'[]'::jsonb)) loop
    begin
      select * into v_ci from lola_eventos_itens where id = (v_it->>'id')::uuid;
    exception when others then continue; end;
    if not found then continue; end if;
    v_ficha := null;
    if v_ci.ficha_id is not null then select nome into v_ficha from lola_fichas_tecnicas where id = v_ci.ficha_id; end if;
    v_qtd := least(greatest(coalesce(nullif(v_it->>'qtd','')::numeric,0),0), v_pax*30);
    v_menu := v_menu || jsonb_build_array(jsonb_build_object(
      'nome', v_ci.nome,
      'qtd', case when coalesce(v_ci.per_pax,true) then 1 else v_qtd end,
      'preco', coalesce(v_ci.preco,0), 'un', coalesce(v_ci.unidade,''),
      'perPax', coalesce(v_ci.per_pax,true), 'ficha', v_ficha,
      'cat', case when v_ci.secao = 'Bebidas' then 'B' else 'C' end,
      'secao', coalesce(v_ci.secao,''), 'desc', coalesce(v_ci.descricao,''), 'louca', coalesce(v_ci.louca,''),
      'unCompra','', 'tamCompra','', 'grupoSite', v_it->>'grupo'));
  end loop;

  v_local := case new.local when 'ccmq' then 'ccmq' when 'mac' then 'mac' when 'outro' then 'catering' else '' end;
  v_cupula := case when new.local = 'ccmq' then coalesce(nullif(v_det->>'espaco_ccmq',''),'')
                   when new.local = 'mac' then 'jardim_mac' when new.local = 'outro' then 'externo' else '' end;
  if new.pacote_id is not null then select estilo_servico into v_estilo from lola_eventos_pacotes where id = new.pacote_id; end if;

  v_obs := 'PEDIDO PELO SITE em ' || to_char(new.created_at at time zone 'America/Sao_Paulo','DD/MM/YYYY HH24:MI')
    || E'\nPacote: ' || coalesce(new.formato,'—') || coalesce(' · ' || new.duracao,'')
    || coalesce(' · R$ ' || replace(to_char(new.preco_pp,'FM999990.00'),'.',',') || ' por pessoa','')
    || coalesce(' · estimativa mostrada ao cliente: R$ ' || replace(to_char(new.estimativa,'FM9999990.00'),'.',','),'')
    || E'\nContato: ' || coalesce(new.telefone,'') || coalesce(' · ' || new.email,'')
    || coalesce(E'\nEndereço/local: ' || nullif(v_det->>'endereco',''),'')
    || coalesce(E'\nSom/DJ/banda: ' || nullif(v_det->>'som',''),'')
    || coalesce(E'\nDecoração: ' || nullif(v_det->>'decoracao',''),'')
    || coalesce(E'\nRestrições alimentares: ' || nullif(v_det->>'restricoes',''),'')
    || coalesce(E'\nCliente escreveu: ' || nullif(new.obs,''),'')
    || E'\n(Data e horário sujeitos à disponibilidade — conferir agenda.)';

  insert into lola_eventos (nome, cliente, contato, tipo, local, cupula, status, pax, pax_in, data, horario, duracao, ocasiao,
                            servico, exclusividade, nota, obs, menu, checks, editado_por, updated_at)
  values (left(coalesce(nullif(new.ocasiao,''), new.formato, 'Evento') || ' — ' || new.nome, 200), new.nome,
          concat_ws(' · ', new.telefone, new.email), 'personalizado', v_local, v_cupula, 'pre', new.pax, new.pax,
          new.data, new.horario, new.duracao, new.ocasiao,
          coalesce(v_estilo,''), coalesce(nullif(v_det->>'exclusividade',''),''),
          case when (v_det->>'nota') = 'sim' then 'sim' else 'nao' end,
          v_obs, v_menu, '{}'::jsonb, 'site', now())
  returning id into v_ev;

  update lola_eventos_pedidos set evento_id = v_ev, status = 'convertido', atendido_por = 'site (automático)', atendido_em = now()
   where id = new.id;
  return null;
exception when others then
  -- se algo der errado, o pedido fica salvo como "novo" e aparece em 📥 Pedidos do site pra criar à mão
  raise warning 'lola_pedido_site_cria_evento: %', sqlerrm;
  return null;
end $fn$;

drop trigger if exists trg_pedido_site_cria_evento on public.lola_eventos_pedidos;
create trigger trg_pedido_site_cria_evento after insert on public.lola_eventos_pedidos
  for each row execute function public.lola_pedido_site_cria_evento();

notify pgrst, 'reload schema';
