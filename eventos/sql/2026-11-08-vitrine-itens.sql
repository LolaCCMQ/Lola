-- Vitrine de eventos (08/11/2026): foto própria, ficha ligada e marcações nos itens do catálogo de eventos.
-- Só acrescenta colunas (nada é apagado). Rodar uma vez no SQL Editor do Supabase.
alter table public.lola_eventos_itens add column if not exists foto_url text;
alter table public.lola_eventos_itens add column if not exists ficha_id uuid;
alter table public.lola_eventos_itens add column if not exists tags text[];
notify pgrst, 'reload schema';
