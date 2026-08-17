# Lola MAC — fechamento do dia

**Endereço:** https://equipelola.net/mac/
**Arquivo:** `mac/index.html` (35 KB)
**Abre pelo portal:** menu → Lola MAC (iframe `/mac/?embed=1&u=<nome>&t=<timestamp>`)

## ⚠️ MUDOU DE DOMÍNIO EM 17/08/2026
Até 17/08 morava no repo `LolaMAC`, servido em `lolaccmq.github.io/LolaMAC/lolamac.html`.
**Domínio diferente do portal** → era cego pra sessão, e por isso o nome de quem estava
usando tinha que **viajar na URL** (`?u=Bianca`).

➡️ **Nunca republicar em `lolaccmq.github.io/LolaMAC/`.** Lá só pode existir o redirect.

## 🔓 PENDENTE: o `?u=` é uma AFIRMAÇÃO, não uma prova
O app faz `const USER = qp.get('u') || ''` e grava esse nome em **`criado_por`**.
Ou seja: quem abrir `/mac/?u=Fernanda` grava fechamento **no nome da Fernanda**.

Hoje isso não bloqueia nada (o `USER` só alimenta o `criado_por`, não é cadeado), mas
**suja a autoria** — e autoria é o que a gente usa pra saber quem fechou o dia errado.

Agora que ele está no mesmo domínio, dá pra ler o nome real da sessão
(`localStorage.lola_session`) em vez de aceitar o da URL. **Não mudei ainda**: precisa
da decisão da Bianca sobre quais papéis podem abrir (`admin` · `financeiro` · `gerente`
· `operacional`) — e a troca do `?u=` deve vir junto, não antes.

⚠️ Quando trocar, **manter o `?u=` funcionando por um tempo**: tem atalho de celular e
link salvo apontando pra lá.

## Frase pra abrir conversa
> "Leia `retomar/REGRAS-GERAIS.md` e `mac/LEIA.md`. Hoje quero mexer no Lola MAC."

## O que não pode mexer
- Nada de caminho relativo pra fora. Caminho absoluto da raiz: `/_comum/auth.js`.
- O app é **autossuficiente**: não carrega nenhuma imagem, css ou js local.

## Onde paramos
- 17/08/2026 — trazido do repo `LolaMAC` para `equipelola.net/mac/`. Nada mudou por
  dentro; o `?u=` continua sendo passado pelo portal. Login não ligado (ver acima).
