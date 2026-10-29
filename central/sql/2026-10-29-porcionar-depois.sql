-- 29/10/2026 — Cronograma da Central: "porcionar depois"
-- Rodar uma vez no SQL Editor do Supabase (projeto mvjbsdpfjhywhaonvpfl).
-- Só acrescenta colunas (todas opcionais); nada existente muda.

alter table public.lola_central_cronograma
  add column if not exists etapa       text,     -- null = produção normal · 'porcionar' = cartão de porcionamento
  add column if not exists origem_id   uuid references public.lola_central_cronograma(id), -- cartão de porcionar → produção de origem
  add column if not exists granel_qtd  numeric,  -- quanto rendeu a granel (ex.: 12)
  add column if not exists granel_un   text;     -- unidade do granel (kg, L, g, ml, un)

create index if not exists lola_central_cronograma_origem_idx on public.lola_central_cronograma(origem_id);

-- o app (PostgREST) precisa enxergar as colunas novas na hora
notify pgrst, 'reload schema';
