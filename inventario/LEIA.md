# Inventário — Equipamentos Lola

**Endereço:** https://equipelola.net/inventario/
**Arquivo:** `inventario/index.html` (56 KB)
**Abre pelo portal:** menu → Inventário (iframe apontando pra `/inventario/`)
**Também linkado de:** app da Central (`/central/`), card "Inventário"

## O que é
Louças, utensílios e equipamentos: contagens e ajustes. Substituiu o app "Louças e
Utensílios" em 04/07/2026 (o repo `LolaLoucas` ficou como backup, dados já migrados).

## Frase pra abrir conversa
> "Leia `retomar/REGRAS-GERAIS.md` e `inventario/LEIA.md`. Hoje quero mexer no Inventário."

## O que não pode mexer
- Nada de caminho relativo pra fora. Se precisar de algo de fora, caminho absoluto da
  raiz: `/_comum/auth.js`, `/reunioes/`.
- `/inventario.html` na raiz é **redirect** do endereço antigo — preserva `?query` e
  `#hash`. Não apagar e não virar cópia do app.
- O app é **autossuficiente**: não carrega nenhuma imagem, css ou js local. Se você
  adicionar algum, coloque dentro de `inventario/` ou em `/_comum/`.

## Onde paramos
- 14/08/2026 — movido de `/inventario.html` para `/inventario/index.html`. Nada mudou por dentro.
