-- 03/11/2026 — Recuperar as receitas/produções criadas pelo botão "Nova receita" do app da Central
-- Até hoje esse botão gravava a receita SEM cozinha='central'. O app da Central só lista
-- cozinha='central', então a receita sumia ao recarregar (e as produções dela ficavam sem nome).
-- Só esse botão usa categoria='central', então o filtro abaixo pega exatamente essas.
-- Rodar no SQL Editor do Supabase.

-- 1) VER o que vai voltar (rodar primeiro e conferir)
select p.id, p.nome, p.rendimento_qtd, p.rendimento_un, p.porcao_qtd, p.editado_por, p.editado_em,
       (select count(*) from lola_preproducoes_itens i where i.preproducao_id = p.id) as ingredientes,
       (select count(*) from lola_central_prod_hist h where h.preproducao_id = p.id and h.ativo is not false) as producoes
from lola_preproducoes p
where p.categoria = 'central' and p.cozinha is null
order by p.editado_em desc nulls last;

-- 2) CORRIGIR (devolve todas pra Central)
update lola_preproducoes
set cozinha = 'central'
where categoria = 'central' and cozinha is null;
