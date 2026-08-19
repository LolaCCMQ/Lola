# Escala

**Endereço:** https://equipelola.net/escala/
**Arquivo:** `escala/index.html` (446 KB)
**Abre pelo portal:** menu → Escala (iframe `/escala/`, carregado sob demanda)
**Banco:** Supabase — `lola_escala` e `lola_escala_pessoas`

## ⚠️ NÃO CONFUNDIR com a Escala da Central
Existem **dois apps de escala diferentes**, com bancos diferentes:

| Arquivo | Título | Quem usa |
|---|---|---|
| `escala/index.html` | *Escala — Lola* | portal (este aqui) |
| `central/escala.html` | *Escala · Cozinha Central* | app da Central |

O botão "Escala" dentro da Central usa link **relativo** (`escala.html`), que resolve pra
`/central/escala.html` — o dela. **Não mexer nesse link achando que aponta pra cá.**

## 🚨 COMPONENTE FECHADO — não redesenhar
É um **bundle React**, e o app mora dentro de uma **string JSON escapada** dentro do
arquivo. Tem método próprio de edição. **Antes de mexer, ler `retomar/escala.md`.**

Desde 06/07/2026 é **compartilhado via Supabase**: todos veem a mesma escala; edição e
o botão "+ Nova semana" só para admin/gerente.

## Frase pra abrir conversa
> "Leia `retomar/REGRAS-GERAIS.md`, `retomar/escala.md` e `escala/LEIA.md`. Hoje quero mexer na Escala."

## O que não pode mexer
- `/escala.html` na raiz é **redirect** do endereço antigo. Não apagar, não virar cópia.
- Nada de caminho relativo pra fora. Caminho absoluto da raiz: `/_comum/...`.
- O app é autossuficiente: não carrega nenhuma imagem, css ou js local.

## Onde paramos
- 19/08/2026 — movido de `/escala.html` para `/escala/index.html`. **Nada tocado por
  dentro** — cópia byte a byte, justamente por ser bundle fechado. Só 1 ponto no
  `index.html` apontava pra ele.
