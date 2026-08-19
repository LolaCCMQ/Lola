# Arquivos apagados — histórico

Este arquivo existe para que ninguém procure por algo que foi removido de propósito.
**Nada aqui se perdeu:** o Git guarda tudo. Para recuperar qualquer um, abra o commit
de exclusão listado abaixo (aba **Commits** do repositório) e use *View file* / *Restore*.

---

## 19/08/2026 — limpeza de cópias mortas do Reuniões & Tarefas

**Por quê:** todos eram rascunhos ou sandboxes que ficaram para trás depois que o app foi
para `reunioes/index.html`. Nenhum estava no ar nem no menu. O risco não era técnico, era de
confusão: em julho de 2026 quase se "promoveu" o `registros-teste.html` por cima da produção —
ele estava **atrás** do que estava no ar (741 linhas contra 1124) e teria apagado os blocos e a
@menção. Enquanto esses arquivos existirem, esse tropeço continua possível.

Todos os seis ainda carregavam a **lista de nomes escrita à mão** (`var TEAM=[...]`), sem a Cacy —
o problema que motivou a limpeza. Hoje a equipe vem da view `portal_equipe`.

| Arquivo | Tam. | Criado | Última mexida | O que era |
|---|---|---|---|---|
| `registros-teste.html` | 55 KB | 25/06/2026 | 25/06/2026 | página de teste do Reuniões; ficou atrás da produção |
| `registros-v3.html` | 101 KB | 04/07/2026 | 04/07/2026 | tentativa de redesenho V3 |
| `tarefas-v2-teste.html` | 34 KB | 09/07/2026 | 09/07/2026 | reescrita em abas; sandbox só com localStorage |
| `mapa-teste.html` | 22 KB | 23/06/2026 | 23/06/2026 | sandbox do Mapa (tabela `lola_mapa_teste`) |
| `teste-honey-1.html` | 22 KB | 23/06/2026 | 23/06/2026 | ponto de partida da Honey (sandbox) |
| `teste/registros.html` | 58 KB | 01/07/2026 | 01/07/2026 | teste do v2 (cabeçalho transparente + unidades coloridas) |

**O que está valendo:** `reunioes/index.html` — https://equipelola.net/reunioes/
O `registros.html` na raiz é só uma página de redirecionamento.

---

## Ainda por decidir (não foram apagados)

Estes continuam no repositório e também parecem parados. Ninguém confirmou que podem sair:

`chat.html` · `chat-teste.html` (o chat foi escondido do portal em 25/06/2026)
`eventos-teste.html` · `inbox-teste.html` · `inbox-v3.html` · `previa-eventos.html`
`central/cronograma-teste.html` · `estoque/lolaestoque-teste.html`
`teste/index.html` · `teste/inbox.html`
