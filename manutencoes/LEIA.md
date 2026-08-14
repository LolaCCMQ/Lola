# Manutenções — Equipamentos Lola

**Endereço:** https://equipelola.net/manutencoes/
**Arquivo:** `manutencoes/index.html` (76 KB)
**Abre pelo portal:** menu → Manutenções (iframe `/manutencoes/?embed=1&page=<x>`)
**Também linkado de:** Inventário → botão de equipamento (`/manutencoes/?page=equip`)

## O que é
Painel · Equipamentos · Preventivas · Descartes · Contatos.
Tabelas no Supabase: `equipamentos`, `tipos`, `preventivas` (entre outras).

## ⚠️ MUDOU DE DOMÍNIO EM 14/08/2026 — leia antes de mexer no endereço
Até 14/08 este app morava no repo `Lola-Manutencoes`, servido em
`lolaccmq.github.io/Lola-Manutencoes/`. **Domínio diferente do portal.**

Consequência: ele era **cego pra sessão** — memória de navegador é por domínio, então
ele não tinha como saber quem tinha entrado no portal. Por isso nunca teve login.

Trazer pro `equipelola.net/manutencoes/` é o que **torna o login possível**.
➡️ **Nunca republicar em `lolaccmq.github.io/Lola-Manutencoes/`.** Lá só pode existir
o redirect. Republicar lá reabre o buraco e **a tela fica igualzinha** — ninguém percebe.

## 🔓 PENDENTE: o login ainda NÃO foi ligado
Mover foi o passo 1. Ligar o gate (`/_comum/auth.js` → `lolaGate({papeis:[...]})`) depende
de uma decisão da Bianca: **quem pode abrir Manutenções?** Hoje todo mundo que tem o link
abre. Papéis disponíveis: `admin` · `financeiro` · `gerente` · `operacional`.

## Frase pra abrir conversa
> "Leia `retomar/REGRAS-GERAIS.md` e `manutencoes/LEIA.md`. Hoje quero mexer no Manutenções."

## O que não pode mexer
- Nada de caminho relativo pra fora. Caminho absoluto da raiz: `/_comum/auth.js`, `/inventario/`.
- O app é **autossuficiente**: não carrega nenhuma imagem, css ou js local. Se adicionar
  algum, coloque dentro de `manutencoes/` ou em `/_comum/`.

## Onde paramos
- 14/08/2026 — trazido do repo `Lola-Manutencoes` para `equipelola.net/manutencoes/`.
  Nada mudou por dentro. Login ainda não ligado (ver acima).
