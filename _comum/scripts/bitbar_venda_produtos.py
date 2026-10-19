#!/usr/bin/env python3
"""Parser do VendaProdutos.pdf do Bitbar (relatório "Venda de Produtos - Analítico").

Uso:  python3 bitbar_venda_produtos.py arquivo.pdf  [--json]
Saída: uma linha por produto com cod, produto, grupo, qtde (= coluna "Venda + Cortesias Qtde",
regra da Mahara), valor (= "Venda + Cortesias Valor"), mais a validação: soma por grupo contra o
subtotal impresso no próprio PDF. Se algum grupo não bater, sai com código 2 e NÃO deve ser gravado.

Leitura por texto com layout (pdftotext -layout): em cada linha de produto as 4 últimas
colunas são  V+C Qtde · V+C Valor · % Grupo · % Total.  Linha do subtotal do grupo:
"<n> - <Grupo> ... V+C Qtde · V+C Valor · % Total".
"""
import re, sys, json, subprocess

def num(s):
    return float(s.replace('.', '').replace(',', '.'))

NUM = r'-?\d[\d.]*,\d+|-?\d+'
def parse(pdf):
    txt = subprocess.run(['pdftotext', '-layout', pdf, '-'], capture_output=True, text=True, check=True).stdout
    data = None
    m = re.search(r'de (\d\d)/(\d\d)/(\d{4}) até (\d\d)/(\d\d)/(\d{4})', txt)
    if m:
        if m.group(1, 2, 3) != m.group(4, 5, 6):
            raise SystemExit('relatório cobre mais de um dia — não importar')
        data = f'{m.group(3)}-{m.group(2)}-{m.group(1)}'
    grupo = None; itens = []; subt = {}; pend = ''
    for raw in txt.splitlines():
        line = raw.rstrip()
        mh = re.match(r'^(\d+) - (.+?)\s{2,}Peso', line)
        if mh:
            grupo = mh.group(2).strip(); pend = ''; continue
        ms = re.match(r'^\s{10,}(\d+) - (.+?)\s{2,}(.*)$', line)
        if ms and grupo and ms.group(2).strip() == grupo:
            nums = re.findall(NUM, ms.group(3))
            if len(nums) >= 3:
                subt[grupo] = (num(nums[-3]), num(nums[-2]))
            pend = ''; continue
        mp = re.match(r'^\s{0,4}(\d{1,5})\s+(.+?)\s{2,}((?:' + NUM + r')(?:\s+(?:' + NUM + r'))+)\s*$', line)
        if mp and grupo:
            nums = re.findall(NUM, mp.group(3))
            if len(nums) >= 5:
                nome = (pend + ' ' + mp.group(2)).strip() if pend else mp.group(2).strip()
                itens.append({'cod': int(mp.group(1)), 'produto': nome, 'grupo': grupo,
                              'qtde': num(nums[-4]), 'valor': num(nums[-3])})
                pend = ''; continue
        # nome de produto que quebrou em 2 linhas: guarda o pedaço pra juntar na próxima
        if grupo and line.strip() and not re.search(r'Cód|Produto|valor|Total|Venda de Produtos|Lola CCMQ|até', line) and not re.search(NUM + r'\s*$', line):
            pend = line.strip()
    # validação
    erros = []
    for g, (q, v) in subt.items():
        sq = sum(i['qtde'] for i in itens if i['grupo'] == g); sv = sum(i['valor'] for i in itens if i['grupo'] == g)
        if abs(sq - q) > 1.01 or abs(sv - v) > 1.01:
            erros.append(f'{g}: lido {sq:.2f}/{sv:.2f} x PDF {q:.2f}/{v:.2f}')
    falt = [g for g in {i['grupo'] for i in itens} if g not in subt]
    return {'data': data, 'itens': itens, 'grupos': len(subt), 'erros': erros, 'sem_subtotal': falt,
            'total_qtde': sum(i['qtde'] for i in itens), 'total_valor': round(sum(i['valor'] for i in itens), 2)}

if __name__ == '__main__':
    r = parse(sys.argv[1])
    if '--json' in sys.argv: print(json.dumps(r, ensure_ascii=False))
    else:
        print(r['data'], len(r['itens']), 'produtos', r['grupos'], 'grupos', 'qtde', r['total_qtde'], 'valor', r['total_valor'])
        for e in r['erros']: print('ERRO', e)
    sys.exit(2 if r['erros'] else 0)
