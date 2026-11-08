# Eventos Lola

**Endereço:** https://equipelola.net/eventos/
**Arquivo:** `eventos/index.html` (140 KB)
**Abre pelo portal:** menu → Eventos (iframe apontando pra `/eventos/`)

## Frase pra abrir conversa
> "Leia `_comum/REGRAS.md` e `eventos/LEIA.md`. Hoje quero mexer no Eventos."

## O que não pode mexer
- Não apontar pra fora com caminho relativo. Se precisar de algo de fora, usar caminho
  absoluto da raiz: `/_comum/auth.js`, `/reunioes/`.
- O arquivo `/eventos.html` na raiz é **redirect** do endereço antigo. Não apagar e não
  transformar em cópia do app — tem link salvo e mensagem de WhatsApp apontando pra lá.

## Onde paramos
- 14/08/2026 — app movido de `/eventos.html` para `/eventos/index.html`. Nada mudou por dentro.
- 08/11/2026 — **📸 Vitrine** (botão no topo; código em `eventos/vitrine.js`, carregado no fim do index.html): fotos e descrições dos itens do catálogo (`lola_eventos_itens`), aba "Do cardápio do Lola" (fichas com foto que ainda não estão no catálogo) e "Material pro cliente" (impressão/PDF com fotos). Foto vem da foto própria do item ou da 1ª foto da ficha técnica (`lola_fichas_fotos`, ligada por `ficha_id` ou achada pelo nome). Foto própria vai pro bucket `anexos/eventos-itens/`. Precisa das colunas de `eventos/sql/2026-11-08-vitrine-itens.sql` (foto_url, ficha_id, tags); sem elas, só descrição e foto achada pelo nome. O formulário do catálogo ganhou os campos Descrição e Louça (o salvar já lia, mas o campo tinha sumido).
