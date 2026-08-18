# Diário de Gerentes

**Endereço:** https://equipelola.net/diario/
**Arquivo:** `diario/index.html` (36 KB)
**Abre pelo portal:** menu → Diário de Gerentes (iframe `/diario/?embed=1&u=<nome>`)
**Banco:** Supabase, tabela **`GerentesDiario`** (constantes próprias dentro do arquivo)

## O que é
Briefing e checklist do turno: abertura · troca · fechamento, com histórico por dia,
calendário do mês e observações da semana.

## ⚠️ SAIU DE DENTRO DO index.html EM 18/08/2026 — leia antes de procurar código
Até 18/08 este app **não tinha arquivo próprio**: morava embutido no `index.html` do
portal (~33 KB entre CSS, JS e a tela). Mexer nele significava abrir o arquivo de 262 KB
que também tem o login e o menu de todo mundo.

Agora é um arquivo só dele. O `index.html` só tem o iframe.

## ⚠️ O repo `DiarioGerentes` NÃO é este app
Existe um repositório `LolaCCMQ/DiarioGerentes` com um `index.html` intitulado
*"Lola — Briefing Diário"*, parado desde **28/06/2026**. **Nada aponta pra ele** —
conferi arquivo por arquivo. É uma cópia órfã, provavelmente um protótipo antigo.

➡️ **Não publique lá achando que está mexendo no Diário.** O Diário de verdade é
`equipelola.net/diario/`, dentro do repo `Lola`.

## Como o nome do gerente chega
O portal passa `?u=<nome>` no iframe. Mas como agora estamos no **mesmo domínio**, o
arranque tenta primeiro a **sessão real** (`localStorage.lola_session`) e só usa o `?u=`
como reserva.

⚠️ Isso é **preenchimento**, não trava: o campo "Seu nome" continua editável, igual a
antes. Quem quiser pode digitar outro nome. Ligar um cadeado de verdade depende da
decisão da Bianca sobre papéis (`admin` · `financeiro` · `gerente` · `operacional`).

## Frase pra abrir conversa
> "Leia `retomar/REGRAS-GERAIS.md` e `diario/LEIA.md`. Hoje quero mexer no Diário."

## O que não pode mexer
- O CSS usa os seletores `#module-diario ...` **de propósito** — foram copiados do portal
  sem alterar nenhum, pra não introduzir diferença visual. O `<div id="module-diario">`
  tem que continuar existindo, senão o estilo inteiro cai.
- As 7 variáveis de cor (`--bg`, `--border`, `--faint`, `--muted`, `--red`, `--red-light`,
  `--text`) estão declaradas no `:root` do próprio arquivo, copiadas do portal.
- O botão "Menu" chama `switchModule()`, que aqui é um atalho pra voltar ao portal.
- Nada de caminho relativo pra fora. Caminho absoluto da raiz: `/_comum/...`.

## Onde paramos
- 18/08/2026 — extraído do `index.html` para `diario/index.html`. Nada mudou por dentro
  do app; o `index.html` caiu de 262 KB para 230 KB. Login não ligado (ver acima).
