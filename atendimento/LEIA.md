# Atendimento (Inbox)

**Endereço:** https://equipelola.net/atendimento/
**Arquivo:** `atendimento/index.html` (102 KB)
**Abre pelo portal:** menu → Atendimento (iframe `/atendimento/`)

## O que é
Inbox unificado: WhatsApp · Instagram. Conversas, contatos, Robô Lola, arquivos,
transmissão e agenda. Filtros por canal (CCMQ / MAC) e por status.

## Frase pra abrir conversa
> "Leia `retomar/REGRAS-GERAIS.md` e `atendimento/LEIA.md`. Hoje quero mexer no Atendimento."

## O que não pode mexer
- `/inbox.html` na raiz é **redirect** do endereço antigo — preserva `?query` e `#hash`.
  Não apagar e não virar cópia do app.
- Nada de caminho relativo pra fora. Caminho absoluto da raiz: `/_comum/...`.
- O app é **autossuficiente**: não carrega nenhuma imagem, css ou js local. Os selos de
  canal são SVG desenhado no próprio código (`seloSvg`), não arquivo.
- ⚠️ **Visual próprio.** Este app é exceção dupla no `REGRAS-GERAIS.md`: não segue a
  largura máxima de 980px (junto com Eventos e Reuniões) **e** tem visual próprio.
  Não "padronizar" sem falar com a Bianca.

## 🧹 Achado durante a mudança
`inbox-bg.png` (264 KB) está na raiz do repo e **ninguém aponta pra ele** — nem este app,
nem o portal, nem CSS nenhum. Provável resíduo de uma versão antiga. Candidato à limpeza
(não apaguei porque não estava na lista aprovada).

## Onde paramos
- 18/08/2026 — movido de `/inbox.html` para `/atendimento/index.html`. Nada mudou por
  dentro. Só 1 ponto no `index.html` apontava pra ele.
