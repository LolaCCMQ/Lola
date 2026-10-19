-- ═══════════════════════════════════════════════════════════════════════
-- Lola MAC — cardápio, vendas (PDV) e estoque próprio            18/10/2026
-- Rodar UMA vez no SQL Editor do Supabase (projeto mvjbsdpfjhywhaonvpfl).
-- É idempotente: rodar de novo não duplica nada.
--
-- Mesmo padrão das tabelas lola_mac_* que já existem: acesso pela chave
-- publicável do portal (RLS desligada), igual lola_mac_dias/lola_mac_produtos.
-- ═══════════════════════════════════════════════════════════════════════

-- 1) CARDÁPIO DO MAC ----------------------------------------------------
create table if not exists public.lola_mac_catalogo (
  id            bigserial primary key,
  nome          text not null,
  categoria     text not null default 'Outros',      -- Cafés, Comidas, Doces, Sorvetes, Bebidas, Cervejas, Vinhos, Lojinha
  setor         text not null default 'cafe' check (setor in ('cafe','lojinha')), -- como entra no fechamento (Café x Lojinha)
  preco         numeric(10,2),                         -- null = preço a definir
  preco_confirmado boolean not null default false,     -- false = sugerido (vindo do Lola CCMQ), falta confirmar
  controla_estoque boolean not null default true,
  -- de onde sai o estoque quando vende (escolher UM; nenhum = o próprio produto é o item de estoque):
  insumo_id     uuid,                                   -- produto de revenda = um insumo (ex.: Coca-Cola)
  ficha_id      uuid,                                   -- produto preparado = ficha técnica (baixa os ingredientes)
  fator         numeric(12,4) not null default 1,       -- quanto do insumo sai por unidade vendida
  unidade       text not null default 'un',
  aliases       text[] not null default '{}',           -- como já foi escrito nos fechamentos (pra casar o histórico)
  ordem         int not null default 0,
  ativo         boolean not null default true,
  criado_por    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create unique index if not exists lola_mac_catalogo_nome_uk on public.lola_mac_catalogo (lower(nome));

-- 2) VENDAS (uma "conta" por cliente/mesa) -----------------------------
create table if not exists public.lola_mac_vendas (
  id            bigserial primary key,
  data          date not null default (now() at time zone 'America/Sao_Paulo')::date,
  identificacao text,                                   -- mesa / nome do cliente (opcional)
  status        text not null default 'aberta' check (status in ('aberta','paga','cancelada')),
  total         numeric(10,2) not null default 0,
  desconto      numeric(10,2) not null default 0,
  obs           text,
  aberta_em     timestamptz not null default now(),
  fechada_em    timestamptz,
  criado_por    text,
  fechado_por   text
);
create index if not exists lola_mac_vendas_data_idx on public.lola_mac_vendas (data);

create table if not exists public.lola_mac_venda_itens (
  id            bigserial primary key,
  venda_id      bigint not null references public.lola_mac_vendas(id) on delete cascade,
  catalogo_id   bigint references public.lola_mac_catalogo(id),
  nome          text not null,                          -- cópia do nome na hora da venda
  setor         text not null default 'cafe',
  qtd           numeric(10,3) not null default 1,
  preco_unit    numeric(10,2) not null default 0,
  subtotal      numeric(10,2) not null default 0,
  pagamento_id  bigint,                                 -- preenchido quando o item foi pago separado (divisão por itens)
  obs           text,
  created_at    timestamptz not null default now()
);
create index if not exists lola_mac_venda_itens_venda_idx on public.lola_mac_venda_itens (venda_id);

create table if not exists public.lola_mac_venda_pagamentos (
  id            bigserial primary key,
  venda_id      bigint not null references public.lola_mac_vendas(id) on delete cascade,
  forma         text not null check (forma in ('pix','debito','credito','dinheiro','voucher','cortesia')),
  valor         numeric(10,2) not null,
  pessoa        text,                                   -- "Pessoa 1", nome... (divisão da conta)
  tipo_divisao  text,                                   -- null | 'igual' | 'itens'
  criado_por    text,
  created_at    timestamptz not null default now()
);
create index if not exists lola_mac_venda_pag_venda_idx on public.lola_mac_venda_pagamentos (venda_id);

-- 3) ESTOQUE DO MAC (movimentos; saldo = soma) -------------------------
-- Cada linha mexe OU num insumo do cadastro geral (insumo_id) OU num produto do cardápio
-- que é o próprio item de estoque (catalogo_id). qtd positiva = entra, negativa = sai.
create table if not exists public.lola_mac_estoque_mov (
  id            bigserial primary key,
  data          date not null default (now() at time zone 'America/Sao_Paulo')::date,
  insumo_id     uuid,
  catalogo_id   bigint references public.lola_mac_catalogo(id),
  qtd           numeric(14,4) not null,
  unidade       text,
  origem_tipo   text not null check (origem_tipo in ('pedido_central','compra','transferencia','venda','descarte','contagem','ajuste')),
  origem_ref    text,                                   -- 'pedido:<id>', 'venda:<id>', fornecedor, motivo...
  custo_unit    numeric(12,4),
  custo_total   numeric(12,2),
  obs           text,
  criado_por    text,
  created_at    timestamptz not null default now(),
  constraint lola_mac_estoque_mov_alvo check (insumo_id is not null or catalogo_id is not null)
);
create index if not exists lola_mac_estoque_mov_ins_idx on public.lola_mac_estoque_mov (insumo_id);
create index if not exists lola_mac_estoque_mov_cat_idx on public.lola_mac_estoque_mov (catalogo_id);
create index if not exists lola_mac_estoque_mov_ref_idx on public.lola_mac_estoque_mov (origem_tipo, origem_ref);

-- 4) acesso pela chave do portal (mesmo padrão das lola_mac_* existentes)
alter table public.lola_mac_catalogo         disable row level security;
alter table public.lola_mac_vendas           disable row level security;
alter table public.lola_mac_venda_itens      disable row level security;
alter table public.lola_mac_venda_pagamentos disable row level security;
alter table public.lola_mac_estoque_mov      disable row level security;
grant select, insert, update, delete on public.lola_mac_catalogo, public.lola_mac_vendas,
  public.lola_mac_venda_itens, public.lola_mac_venda_pagamentos, public.lola_mac_estoque_mov to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

-- 5) CARDÁPIO INICIAL — montado dos 138 nomes já anotados nos fechamentos do MAC.
-- Preço: sugerido pelo preço médio de venda do mesmo item no Lola CCMQ (Bitbar, ago–set/2026)
-- ou pela ficha técnica; preco_confirmado=false até alguém conferir na tela de Cardápio.
insert into public.lola_mac_catalogo (nome,categoria,setor,preco,aliases,ordem) values
 ('Café espresso','Cafés','cafe',8.00,'{café expresso,café espresso,espresso,café espresso simples,espresso simples,cafe espresso,café espresso curto,espresso s.,espresso silmples}',1),
 ('Café espresso duplo','Cafés','cafe',11.00,'{café espresso duplo,espresso duplo,café espresso dublo,café duplo,espresso d.}',2),
 ('Café espresso longo','Cafés','cafe',8.00,'{espresso longo,café espresso longo}',3),
 ('Café passado','Cafés','cafe',9.00,'{café passado,passado,cafe passado,café passsado}',4),
 ('Cappuccino','Cafés','cafe',11.00,'{cappuccino,café cappuccino,café capu,capu,cappu,café cappuccio,cappucino,café cappu}',5),
 ('Café com leite','Cafés','cafe',11.00,'{café com leite}',6),
 ('Chocolate quente','Cafés','cafe',11.00,'{chocolate quente}',7),
 ('Chá quente','Cafés','cafe',10.00,'{chás quentes,chás}',8),
 ('Espresso tônica','Cafés','cafe',18.00,'{espresso tônica,espresso tonica}',9),
 ('Mochashake','Cafés','cafe',null,'{mocashake,mochashake}',10),
 ('Affogato','Doces','cafe',26.00,'{afogatto,afogato,affogato,afogtto}',11),
 ('Pão de queijo','Comidas','cafe',10.00,'{pão de queijo}',20),
 ('Bolo de laranja','Doces','cafe',18.00,'{bolo de laranja}',21),
 ('Sanduíche','Comidas','cafe',null,'{sanduíche}',22),
 ('Panino','Comidas','cafe',28.00,'{panino}',23),
 ('Tostex','Comidas','cafe',null,'{tostex,toxtes}',24),
 ('Quiche de milho','Comidas','cafe',18.00,'{quiche,quiche de milho}',25),
 ('Risotinho','Comidas','cafe',49.00,'{risoto,risotinho crocante,risotinho}',26),
 ('Polpetina','Comidas','cafe',51.00,'{polpetina}',27),
 ('Lasanha','Comidas','cafe',62.00,'{lasanha}',28),
 ('Chips e pastinhas','Comidas','cafe',44.00,'{chips e pastinhas}',29),
 ('Tortinha de chocolate','Doces','cafe',null,'{tortinha de chocolate,tortinha de cacau,tortinhas de chocolate,tortinha,tortinha chocolate,torta de chocolate}',30),
 ('Brownie','Doces','cafe',20.00,'{brownie}',31),
 ('Brownie com sorvete','Doces','cafe',null,'{brownie com sorvete}',32),
 ('Mini pudim','Doces','cafe',16.50,'{mini pudim,pudin,mini pudin}',33),
 ('Torta de brigadeiro','Doces','cafe',26.00,'{torta de brigadeiro,torta brigadeiro}',34),
 ('Torta red velvet','Doces','cafe',26.00,'{torta red velt,torta red veld}',35),
 ('Banana waffle split','Doces','cafe',24.00,'{banana waffle split,wafle de banana e caramelo,waffle de banana}',36),
 ('Açaí','Doces','cafe',null,'{açaí}',37),
 ('Picolé pistache','Sorvetes','cafe',null,'{picolé pistache,picole pistache}',40),
 ('Picolé chocolate','Sorvetes','cafe',null,'{picolé chocolate,picolé de chocolate,picole de chocolate}',41),
 ('Picolé avelã','Sorvetes','cafe',null,'{picolé avelã,picolé de avelã,picole de avelã}',42),
 ('Picolé doce de leite','Sorvetes','cafe',null,'{picolé doce de leite,picole doce de leite,picolé de doce de leite,picolé doce leite}',43),
 ('Picolé coco','Sorvetes','cafe',null,'{picolé coco,picolé de coco,picole de coco,pícole coco}',44),
 ('Picolé limão','Sorvetes','cafe',null,'{picolé limão,picole limão,picolé de limão}',45),
 ('Picolé uva','Sorvetes','cafe',null,'{picolé uva,picolé de uva}',46),
 ('Picolé espresso','Sorvetes','cafe',null,'{picolé espresso}',47),
 ('Sorvete de chocolate','Sorvetes','cafe',null,'{sorvete chocolate,sorvete de chocolate}',48),
 ('Água sem gás','Bebidas','cafe',8.00,'{água sem gás,agua sem gás,agua sem gas,água sem,agua sem}',50),
 ('Água com gás','Bebidas','cafe',8.00,'{água com gás,agua com,agua com gás,água com}',51),
 ('Coca-Cola','Bebidas','cafe',8.00,'{coca cola normal,coca normal,coca cola,coca cola nomal}',52),
 ('Coca-Cola Zero','Bebidas','cafe',8.00,'{coca cola zero,coca zero,coca coca zero}',53),
 ('Guaraná','Bebidas','cafe',8.00,'{guaraná normal,guaraná,guarana,guarana normal}',54),
 ('Suco natural','Bebidas','cafe',13.50,'{suco natural}',55),
 ('Cuya tônica','Bebidas','cafe',null,'{cuya tônica,cuya tonica}',56),
 ('Baer-Mate','Bebidas','cafe',14.00,'{baer mate}',57),
 ('Heineken long neck','Cervejas','cafe',16.00,'{long heineken,long de heineken,heineken long}',60),
 ('Heineken long neck zero','Cervejas','cafe',16.00,'{long heineken zero}',61),
 ('Heineken 600 ml','Cervejas','cafe',22.00,'{heineken 600,600 de heineken}',62),
 ('Espumante brut rosé','Vinhos','cafe',null,'{espumante brut rosé,espumante brut rose}',70),
 ('Espumante Suspeito','Vinhos','cafe',92.00,'{espumante suspeito}',71),
 ('Vinho rosé Ana Grazi','Vinhos','cafe',null,'{ana grazi vinho rosé}',72),
 ('Vinho Unus Tannat','Vinhos','cafe',92.00,'{unus tannat}',73),
 ('Vinho branco Miolo','Vinhos','cafe',null,'{vinho miolo branco,vinho branco miolo}',74),
 ('Chaveiro','Lojinha','lojinha',18.00,'{chaveiro,chaveiro bomde}',90),
 ('Ímã de geladeira','Lojinha','lojinha',18.00,'{imã geladeira}',91)
on conflict ((lower(nome))) do nothing;

notify pgrst, 'reload schema';
