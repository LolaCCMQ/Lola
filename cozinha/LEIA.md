# Cozinha Lola

**Endereço:** https://equipelola.net/cozinha/
**Arquivo:** `cozinha/index.html` (~599 KB)
**Abre pelo portal:** menu → Estoque & Cozinha (iframe apontando pra `/cozinha/?embed=1&page=<x>`)
**Abre pela Central:** `central/index.html` embute a mesma tela com `?embed=1&unidade=central&page=<x>`

## Frase pra abrir conversa
> "Leia `retomar/REGRAS-GERAIS.md`, `retomar/estoque-fichas.md` e `cozinha/LEIA.md`. Hoje quero mexer na Cozinha."

## O que tem dentro (por enquanto, tudo num arquivo só)
Estoque · Fichas Técnicas · Pré-produções · Compras/CMV · Pedidos à Central · Envios ·
Fornecedores · Conferência de preços · Descartes · Produção do dia.
São **abas do mesmo arquivo**. Quebrar em `cozinha/fichas/`, `cozinha/compras/` e
`cozinha/pedidos/` é Nível 3 — só quando for mexer naquela aba de qualquer jeito.

## O que não pode mexer
- **`estoque/lolaestoque.html` é REDIRECT.** Não apagar e **nunca** transformar de volta
  numa cópia do app — dois arquivos iguais é o erro nº 4 do REGRAS-GERAIS.
- **Nunca republicar em `lolaccmq.github.io/LolaEstoque/`.** Fora do `equipelola.net` o app
  fica cego pro login e volta a acreditar no `?u=` da URL. A tela fica igualzinha — ninguém percebe.
- **O portão é por domínio, não por pasta** (`location.hostname==='equipelola.net'`).
  Mudar de `/estoque/` pra `/cozinha/` não mexeu nele.
- Não apontar pra fora com caminho relativo. Se precisar de algo de fora, caminho absoluto
  da raiz: `/_comum/`, `/central/`.
- **RLS está DESLIGADA** em `lola_preproducoes`, `lola_fichas_tecnicas`, `lola_insumos` e
  `lola_preproducoes_itens`, e a chave anônima tem UPDATE e DELETE. Quem edita receita é
  cortina (`portal_cozinhas_edit`), não tranca. Não escrever em lugar nenhum que está protegido.

## Tabelas que usa
`lola_insumos` · `lola_fichas_tecnicas` · `lola_preproducoes` · `lola_preproducoes_itens` ·
`lola_central_estoque_mov` · `portal_users` (via `portal_cozinhas_edit`)

## Onde paramos
- **20/08/2026** — app movido de `estoque/lolaestoque.html` para `cozinha/index.html`.
  Cópia **byte a byte** (sha256 conferido). **Nada mudou por dentro** — o arquivo não tinha
  nenhum caminho relativo pra corrigir. Mudaram só os 3 pontos que apontavam pra ele:
  `index.html` (`openEstoque`), `central/index.html` (`_EST_URL`) e `eventos/index.html`
  (que ainda mandava pro `lolaccmq.github.io/LolaEstoque/`).
  Com isso o **Nível 2 fechou**: 9 apps com pasta própria.
