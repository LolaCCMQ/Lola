# Reuniões e Tarefas

**Endereço:** https://equipelola.net/reunioes/
**Arquivo:** `reunioes/index.html` (115 KB)
**Abre pelo portal:** menu → Reuniões & Tarefas (iframe `/reunioes/`)

## Parâmetros que ele aceita na URL
| Parâmetro | O que faz | Quem usa |
|---|---|---|
| `?view=minhas` | abre já filtrado nas tarefas da pessoa | atalho do portal |
| `?open=<id>` | abre direto num registro | portal (sino) e **app da Central** |
| `?novo=1` | abre no formulário de novo registro | atalho do portal |

⚠️ **O app da Central linka pra cá** (`/reunioes/?open=<id>` e `/reunioes/`). Se mudar o
endereço de novo, tem que mexer no `central/index.html` também.

## Cuidado ao mexer nos campos
O `central/index.html` **grava os mesmos campos** deste app (`concluido`, `concluido_em`,
`etapa`) e desenha o card com as mesmas cores e rótulos, de propósito — pro card parecer
o mesmo card nos dois lugares. Mudar nome ou significado de campo aqui **quebra a Central**.

## Frase pra abrir conversa
> "Leia `retomar/REGRAS-GERAIS.md` e `reunioes/LEIA.md`. Hoje quero mexer no Reuniões e Tarefas."

## O que não pode mexer
- `/registros.html` na raiz é **redirect** do endereço antigo — preserva `?query` e `#hash`,
  que aqui importa muito (é como o sino e a Central abrem um registro específico).
  Não apagar e não virar cópia do app.
- Nada de caminho relativo pra fora. Caminho absoluto da raiz: `/_comum/...`, `/central/`.
- O app é **autossuficiente**: não carrega nenhuma imagem, css ou js local.
- ⚠️ Este app é uma das exceções da regra dos 980px (junto com Atendimento e Eventos) —
  ver `REGRAS-GERAIS.md`, seção de padrão visual.

## Onde paramos
- 18/08/2026 — movido de `/registros.html` para `/reunioes/index.html`. Nada mudou por
  dentro. Atualizados: 4 pontos no `index.html` e 2 no `central/index.html`.
