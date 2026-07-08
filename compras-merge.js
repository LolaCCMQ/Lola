/* Portal Lola — junção Lista de Compras + Compras no Cartão
   Overlay não-invasivo: injeta a Lista de Compras (só itens a comprar) no topo
   do módulo "Compras no Cartão", renomeia o menu para "Compras" e esconde o
   item "Lista de Compras" do menu lateral. Reaproveita dbFetch/comprasWrite.

   Também (sem tocar no index.html gigante):
   - diminui a fonte do "Compras no Cartão"; no desktop o form fica compacto e a
     tabela usa a largura cheia (colunas curtas numa linha, descrição/loja quebram);
   - no CELULAR cada compra vira um CARD bonito: valor em destaque, data/loja
     discretas, empresa 🏢 e cartão 💳 com ícone, status + ações numa linha só;
   - a Lista de Compras de cima usa o MESMO fundo creme do cartão;
   - encurta o nome do cartão na tabela (Banrisul/Meliuz/Stone);
   - faz o título do topo (#phModname) mostrar o nome do app clicado mesmo nos
     apps que não estão no mapa NAMES do portal (Atendimento, Avaliações, Eventos). */
(function () {
  // Esconde o item "Lista de Compras" do menu via CSS !important
  // (o applyMenuPerms do portal reseta display inline, mas nao vence um !important)
  // + ajusta a fonte/layout do módulo "Compras no Cartão" (desktop e celular).
  try {
    var st = document.createElement('style');
    st.textContent =
      '.nav-item[data-mod="compras"]{display:none !important}' +
      // ----- Esconde "Financeiro Lola MAC" e "Financeiro Central" (migraram p/ /adm/) -----
      '.nav-item[data-menu="financeiro_mac"],.nav-item[data-menu="financeiro_central"]{display:none !important}' +
      '.app-card[onclick*="financeiro_mac"],.fav-star[onclick*="financeiro_mac"],.app-card[onclick*="financeiro_central"],.fav-star[onclick*="financeiro_central"]{display:none !important}' +
      '.app-card-wrap:has([onclick*="financeiro_mac"]),.app-card-wrap:has([onclick*="financeiro_central"]){display:none !important}' +
      // ----- Cabeçalho padrão Lola (faixa vinho) -----
      '#module-comprascartao .cm-bhead{background:linear-gradient(150deg,#B5302E,#871F20);color:#fff;padding:13px 16px 14px;border-radius:0 0 22px 22px}' +
      '#module-comprascartao .cm-bhead-row{display:flex;align-items:center;gap:10px;margin-bottom:10px}' +
      '#module-comprascartao .cm-bmenu{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.16);border:0;color:#fff;font-family:inherit;font-weight:600;font-size:.85rem;padding:8px 14px 8px 10px;border-radius:22px;cursor:pointer}' +
      '#module-comprascartao .cm-bmenu i{font-size:1.1rem}' +
      '#module-comprascartao .cm-bacts{margin-left:auto;display:flex;gap:8px}' +
      '#module-comprascartao .cm-bic{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.16);border:0;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1.15rem}' +
      '#module-comprascartao .cm-btitle{font-family:Fraunces,serif;font-weight:600;font-style:normal;font-size:1.55rem;line-height:1.1;color:#fff;margin:0}' +
      '#module-comprascartao .cm-bsub{color:rgba(255,255,255,.85);font-size:.82rem;margin-top:3px}' +
      '#cmListaTopo .cm-lista-card{background:#fff;border:1px solid var(--border);border-radius:16px;padding:14px 15px}' +
      // ----- Compras no Cartão: título da seção -----
      '#module-comprascartao h2{font-size:1.45rem !important;font-family:Fraunces,serif !important;font-style:normal !important;font-weight:600 !important;color:var(--vinho) !important}' +
      '#module-comprascartao #cartFiltBtn{display:none !important}' +
      // ----- Card de resumo do mês -----
      '#module-comprascartao .cc-resumo{background:linear-gradient(135deg,#3566A8,#23528C);color:#fff;border-radius:18px;padding:15px 17px;display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin:8px 0 14px}' +
      '#module-comprascartao .cc-rlabel{font-size:.64rem;letter-spacing:.04em;text-transform:uppercase;color:rgba(255,255,255,.78);font-weight:700;margin-bottom:4px}' +
      '#module-comprascartao .cc-rval{font-family:Fraunces,serif;font-weight:600;font-size:1.7rem;line-height:1}' +
      '#module-comprascartao .cc-rright{text-align:right;flex:0 0 auto}' +
      '#module-comprascartao .cc-ritens{display:inline-block;background:rgba(255,255,255,.20);font-weight:700;font-size:.72rem;padding:5px 11px;border-radius:20px;margin-bottom:6px}' +
      '#module-comprascartao .cc-rconf{font-size:.72rem;color:rgba(255,255,255,.82)}' +
      // ----- Filtros em pílula (cartão · mês) -----
      '#module-comprascartao .cc-filtros{display:flex;gap:10px;margin:4px 0 16px}' +
      '#module-comprascartao .cc-fpill{flex:1;display:flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--border);border-radius:13px;padding:11px 13px;font-family:inherit;font-weight:600;font-size:.85rem;color:#5A463E;cursor:pointer}' +
      '#module-comprascartao .cc-fpill i{font-size:1.2rem;color:var(--vinho)}' +
      '#module-comprascartao .cc-fpill .cc-caret{margin-left:auto;color:var(--muted);font-size:.95rem}' +
      '#module-comprascartao .cc-fpill span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      // ----- Card de lançamento -----
      '#module-comprascartao .cc-list{max-width:560px}' +
      '#module-comprascartao .cc-card{background:#fff;border:1px solid var(--border);border-radius:18px;padding:15px 16px;margin-bottom:13px;box-shadow:0 1px 2px rgba(42,26,23,.05),0 12px 26px -18px rgba(42,26,23,.22)}' +
      '#module-comprascartao .cc-top{display:flex;align-items:baseline;justify-content:space-between;gap:10px}' +
      '#module-comprascartao .cc-item{font-weight:700;font-size:1.05rem;color:var(--ink);line-height:1.2}' +
      '#module-comprascartao .cc-val{font-family:Fraunces,serif;font-weight:600;font-size:1.25rem;color:var(--vinho);white-space:nowrap}' +
      '#module-comprascartao .cc-data{display:flex;align-items:center;gap:5px;color:var(--muted);font-size:.78rem;margin-top:4px}' +
      '#module-comprascartao .cc-data i{font-size:1rem}' +
      '#module-comprascartao .cc-forn{display:flex;align-items:center;gap:8px;background:var(--cream,#FBF7F1);border:1px solid var(--border);border-radius:11px;padding:9px 11px;margin-top:11px;font-size:.86rem;color:#5A463E}' +
      '#module-comprascartao .cc-forn i{font-size:1.15rem;color:var(--label,#B79A8E)}' +
      '#module-comprascartao .cc-tags{display:flex;flex-wrap:wrap;gap:7px;margin-top:11px}' +
      '#module-comprascartao .cc-tag{display:inline-flex;align-items:center;line-height:1;font-weight:600;font-size:.72rem;padding:6px 11px;border-radius:10px}' +
      '#module-comprascartao .cc-emp{background:#FBEAE7;color:var(--vinho)}' +
      '#module-comprascartao .cc-cartao{background:#E6EEF8;color:#2C5AA0}' +
      '#module-comprascartao .cc-comp{background:#F1EFE8;color:#6B6258}' +
      '#module-comprascartao .cc-div{height:1px;background:var(--border);margin:13px 0 11px}' +
      '#module-comprascartao .cc-base{display:flex;align-items:center;justify-content:space-between;gap:10px}' +
      '#module-comprascartao .cc-status{display:flex;gap:14px;flex-wrap:wrap}' +
      '#module-comprascartao .cc-chk{display:flex;align-items:center;gap:7px;font-size:.82rem;font-weight:600;color:var(--muted);cursor:pointer}' +
      '#module-comprascartao .cc-chk input{width:20px;height:20px;accent-color:#2C7A4B;margin:0;cursor:pointer}' +
      '#module-comprascartao .cc-chk:has(input:checked){color:#2C7A4B;font-weight:700}' +
      '#module-comprascartao .cc-acts{display:flex;gap:8px}' +
      '#module-comprascartao .cc-ab{width:38px;height:38px;border-radius:11px;border:1px solid var(--border);background:#fff;display:flex;align-items:center;justify-content:center;font-size:1.15rem;cursor:pointer}' +
      '#module-comprascartao .cc-ab.edit{color:#2C5AA0}' +
      '#module-comprascartao .cc-ab.del{color:#B5302E;border-color:#F0D4CF}' +
      '#module-comprascartao .cc-empty{padding:24px 16px;text-align:center;color:var(--muted)}' +
      '#module-comprascartao h2 + p{font-size:.72rem !important}' +
      '#module-comprascartao table.cart-table{font-size:.72rem !important}' +
      '#module-comprascartao table.cart-table th{font-size:.58rem !important}' +
      '#module-comprascartao label{font-size:.6rem !important}' +
      // ----- Só no desktop: form compacto + tabela usando a largura cheia, cabendo tudo -----
      '@media(min-width:601px){' +
      '#module-comprascartao .cart-wrap{max-width:100% !important}' +
      '#module-comprascartao input:not([type=checkbox]),#module-comprascartao select{font-size:13px !important;padding:7px 10px !important}' +
      '#module-comprascartao table.cart-table td{padding:5px 8px !important}' +
      '#module-comprascartao table.cart-table th{padding:6px 8px !important}' +
      '#module-comprascartao table.cart-table td[data-label="Data"],#module-comprascartao table.cart-table td[data-label="Empresa"],#module-comprascartao table.cart-table td[data-label="Cartão"],#module-comprascartao table.cart-table td[data-label="Valor"],#module-comprascartao table.cart-table td[data-label="Comp."]{white-space:nowrap !important}' +
      '#module-comprascartao table.cart-table td.cart-acoes{white-space:nowrap !important}' +
      '#module-comprascartao table.cart-table td.cart-acoes .btn{padding:4px 8px !important}' +
      '}' +
      // ----- Só no celular: cada compra vira um CARD limpo -----
      '@media(max-width:600px){' +
      '#module-comprascartao table.cart-table tr{display:flex !important;flex-wrap:wrap;align-items:center;gap:7px 0;padding:13px 15px !important;border:1px solid var(--border) !important;border-radius:16px;margin-bottom:12px;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.05)}' +
      '#module-comprascartao table.cart-table td{display:block !important;box-sizing:border-box;border:none !important;padding:0 !important;min-height:0 !important;position:static !important;white-space:normal !important;font-size:.82rem;line-height:1.25;color:var(--ink)}' +
      '#module-comprascartao table.cart-table td:before{display:none !important}' +
      '#module-comprascartao table.cart-table td[data-label="O que comprou"]{order:1;width:60%;font-weight:700;font-size:1rem;padding-right:8px !important}' +
      '#module-comprascartao table.cart-table td[data-label="Valor"]{order:2;width:40%;text-align:right !important;font-weight:800;font-size:1.1rem;color:var(--vinho);white-space:nowrap}' +
      '#module-comprascartao table.cart-table td[data-label="Data"]{order:3;width:40%;font-size:.72rem;color:var(--muted);white-space:nowrap;padding-right:6px !important}' +
      '#module-comprascartao table.cart-table td[data-label="Data"]:before{display:inline !important;content:"📅 ";opacity:.8}' +
      '#module-comprascartao table.cart-table td[data-label="Loja"]{order:4;width:60%;font-size:.72rem;color:var(--muted)}' +
      '#module-comprascartao table.cart-table td[data-label="Loja"]:before{display:inline !important;content:"🏪 ";opacity:.8}' +
      '#module-comprascartao table.cart-table td[data-label="Empresa"]{order:5;width:38%;font-size:.8rem;font-weight:600;padding-right:6px !important;margin-top:2px}' +
      '#module-comprascartao table.cart-table td[data-label="Empresa"]:before{display:inline !important;content:"🏢 "}' +
      '#module-comprascartao table.cart-table td[data-label="Cartão"]{order:6;width:34%;font-size:.8rem;font-weight:600;margin-top:2px}' +
      '#module-comprascartao table.cart-table td[data-label="Cartão"]:before{display:inline !important;content:"💳 "}' +
      '#module-comprascartao table.cart-table td[data-label="Comp."]{order:7;width:28%;font-size:.7rem;color:var(--muted);text-align:right !important;margin-top:2px}' +
      '#module-comprascartao table.cart-table td[data-label="Comp."]:before{display:none !important}' +
      '#module-comprascartao table.cart-table tr:after{content:"";order:8;width:100%;height:1px;background:var(--border);opacity:.6;margin:7px 0 2px}' +
      '#module-comprascartao table.cart-table td[data-label="✓ Lançado"]{order:9;width:30%;display:flex !important;align-items:center;gap:6px;font-size:.74rem;color:var(--muted)}' +
      '#module-comprascartao table.cart-table td[data-label="✓ Lançado"]:before{display:inline !important;content:"Lançado"}' +
      '#module-comprascartao table.cart-table td[data-label="📦 Recebido"]{order:10;width:33%;display:flex !important;align-items:center;gap:6px;font-size:.74rem;color:var(--muted)}' +
      '#module-comprascartao table.cart-table td[data-label="📦 Recebido"]:before{display:inline !important;content:"Recebido"}' +
      '#module-comprascartao table.cart-table td.cart-acoes{order:11;width:37%;text-align:right !important;white-space:nowrap}' +
      '#module-comprascartao table.cart-table td.cart-acoes:before{display:none !important}' +
      '#module-comprascartao table.cart-table td input[type=checkbox]{width:17px !important;height:17px !important;accent-color:var(--vinho)}' +
      '#module-comprascartao table.cart-table td[data-label="✓ Lançado"]:has(input:checked){color:var(--green);font-weight:700}' +
      '#module-comprascartao table.cart-table td[data-label="📦 Recebido"]:has(input:checked){color:var(--green);font-weight:700}' +
      '}';
    (document.head || document.documentElement).appendChild(st);
  } catch (e) {}

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // Encurta o nome do cartão pra exibição na tabela (o valor salvo no banco continua inteiro)
  function shortCards(html) {
    if (typeof html !== 'string') return html;
    return html.split('Crédito Banrisul').join('Banrisul')
               .split('Cartão Meliuz').join('Meliuz')
               .split('Débito Stone').join('Stone');
  }

  // Renomeia "Compras no Cartão" -> "Compras" e esconde o item "Lista de Compras"
  function renameNav() {
    var n = document.querySelector('.nav-item[data-mod="comprascartao"] .nl');
    if (n) n.textContent = 'Compras';
    var lista = document.querySelector('.nav-item[data-mod="compras"]');
    if (lista) lista.style.display = 'none';
    var btn = document.querySelector('.nav-item[data-mod="comprascartao"]');
    if (btn && btn.classList.contains('active')) {
      var h = document.getElementById('phModname');
      if (h) h.textContent = 'Compras';
    }
  }

  // Garante que o título do topo mostre o NOME DO APP clicado, mesmo nos módulos
  // que não estão no mapa NAMES do index.html (lá o título fica em branco).
  // Só preenche quando está vazio (não atrapalha os que já funcionam) e nunca no Início.
  function setTitleFromNav(mod) {
    try {
      if (mod === 'home') return;
      var ph = document.getElementById('phModname');
      if (!ph || (ph.textContent || '').trim()) return;
      var nl = document.querySelector('.nav-item[data-mod="' + mod + '"] .nl');
      if (nl && (nl.textContent || '').trim()) ph.textContent = nl.textContent.trim();
    } catch (e) {}
  }

  // Injeta a faixa do cabeçalho padrão Lola no topo do módulo
  function ensureFaixa() {
    var panel = document.getElementById('module-comprascartao');
    if (!panel) return;
    var f = document.getElementById('cmFaixa');
    if (!f) {
      f = document.createElement('div');
      f.id = 'cmFaixa';
      f.className = 'cm-bhead';
      f.style.flex = '0 0 auto';
      f.innerHTML =
        '<div class="cm-bhead-row">' +
        '<button class="cm-bmenu" onclick="window.switchModule&&window.switchModule(\'home\')"><i class="ph-duotone ph-caret-left"></i> Menu</button>' +
        '<div class="cm-bacts">' +
        '<button class="cm-bic" title="Buscar" onclick="var i=document.getElementById(\'cmItem\');if(i){i.scrollIntoView({block:\'center\'});setTimeout(function(){i.focus();},100);}"><i class="ph-duotone ph-magnifying-glass"></i></button>' +
        '<button class="cm-bic" title="Avisos" onclick="var b=document.getElementById(\'phBell\');if(b)b.click()"><i class="ph-duotone ph-bell"></i></button>' +
        '</div></div>' +
        '<h1 class="cm-btitle">Compras</h1>' +
        '<div class="cm-bsub">Lista de compras e compras no cartão</div>';
    }
    // garante que a faixa fique como PRIMEIRO filho (acima da lista e do cartão)
    if (panel.firstChild !== f) panel.insertBefore(f, panel.firstChild);
  }

  // Renderiza a Lista de Compras (apenas itens a comprar) no topo do módulo cartão
  async function renderTopo() {
    var panel = document.getElementById('module-comprascartao');
    if (!panel) return;
    var box = document.getElementById('cmListaTopo');
    if (!box) {
      box = document.createElement('div');
      box.id = 'cmListaTopo';
      box.style.cssText = 'flex:0 0 auto;max-height:42vh;overflow-y:auto;background:var(--cream);border-bottom:1px solid var(--border)';
      panel.insertBefore(box, panel.firstChild);
    }
    var itens = [];
    try {
      itens = await dbFetch('lola_lista_compras', 'select=id,item,quantidade,comprado&order=created_at.asc');
    } catch (e) {
      box.innerHTML = '<div style="padding:14px 22px;color:var(--muted)">Erro ao carregar a lista.</div>';
      return;
    }
    var aComprar = (itens || []).filter(function (i) { return !i.comprado; });
    var h = '<div style="padding:14px 14px 4px;max-width:680px"><div class="cm-lista-card">';
    h += '<h3 style="font-family:Fraunces,serif;color:var(--vinho);font-style:normal;font-weight:600;font-size:1.45rem;margin:0 0 4px">Lista de Compras</h3>';
    h += '<p style="color:var(--muted);font-size:.72rem;margin:0 0 12px">O caderninho da equipe — itens comprados saem da lista automaticamente.</p>';
    h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">';
    h += '<input id="cmItem" placeholder="O que precisa comprar?" onkeydown="if(event.key===\'Enter\')window.__cmAdd()" style="flex:2;min-width:150px;font-family:inherit;font-size:.85rem;border:1.5px solid var(--border);border-radius:9px;padding:9px 12px;background:#fff;color:var(--ink)">';
    h += '<input id="cmQtd" placeholder="Qtd (opcional)" onkeydown="if(event.key===\'Enter\')window.__cmAdd()" style="flex:1;min-width:90px;font-family:inherit;font-size:.85rem;border:1.5px solid var(--border);border-radius:9px;padding:9px 12px;background:#fff;color:var(--ink)">';
    h += '<button onclick="window.__cmAdd()" style="background:var(--vinho);color:#fff;border:none;border-radius:9px;padding:9px 18px;font-weight:600;cursor:pointer;font-family:inherit">+ Adicionar</button>';
    h += '</div>';
    if (!aComprar.length) {
      h += '<div style="color:var(--muted);font-size:.72rem;padding:4px 0 6px">Nada na lista por enquanto.</div>';
    } else {
      h += aComprar.map(function (i) {
        return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">'
          + '<input type="checkbox" onchange="window.__cmToggle(' + i.id + ')" style="width:19px;height:19px;accent-color:var(--vinho);cursor:pointer">'
          + '<span style="flex:1;font-size:.72rem;color:var(--ink)">' + esc(i.item)
          + (i.quantidade ? (' <span style="color:#9A7070;font-size:.66rem">- ' + esc(i.quantidade) + '</span>') : '')
          + '</span></div>';
      }).join('');
    }
    h += '</div></div>';
    box.innerHTML = h;
    ensureFaixa();
  }

  window.__cmAdd = async function () {
    var it = document.getElementById('cmItem'), qt = document.getElementById('cmQtd');
    if (!it) return;
    var item = (it.value || '').trim();
    if (!item) return;
    var quantidade = (qt && qt.value || '').trim();
    var por = (window.__portalUser && window.__portalUser.name) || '';
    try {
      await comprasWrite('POST', { item: item, quantidade: quantidade, adicionado_por: por, comprado: false });
    } catch (e) { alert('Erro ao adicionar.'); return; }
    renderTopo();
  };

  window.__cmToggle = async function (id) {
    var por = (window.__portalUser && window.__portalUser.name) || '';
    try {
      await comprasWrite('PATCH', { comprado: true, comprado_por: por }, '?id=eq.' + id);
    } catch (e) { alert('Erro ao atualizar.'); return; }
    renderTopo();
  };

  // Encaixa no switchModule existente (sem reescrevê-lo)
  try {
    var _orig = window.switchModule;
    window.switchModule = function (mod) {
      _orig.apply(this, arguments);
      renameNav();
      setTitleFromNav(mod);
      if (mod === 'comprascartao') { ensureFaixa(); renderTopo(); }
    };
  } catch (e) {}

  // Encurta o nome do cartão pra exibição (valor salvo continua inteiro)
  function _ccShort(s) {
    s = String(s == null ? '' : s);
    return s.split('Crédito Banrisul').join('Banrisul').split('Cartão Meliuz').join('Meliuz').split('Débito Stone').join('Stone');
  }
  // Atualiza o subtítulo da seção (contagem total) após cada render da lista
  function _ccCount() {
    try {
      var el = document.getElementById('cartCount'); if (!el || typeof COMPRAS === 'undefined') return;
      var n = COMPRAS.length, m = COMPRAS.filter(function (c) { return !c.conferido; }).length;
      el.textContent = n + ' lançamento' + (n === 1 ? '' : 's') + ' · ' + m + ' a conferir';
    } catch (e) {}
  }
  // Re-render do Cartão no padrão Lola: título + resumo + filtros-pílula + cards
  try {
    if (typeof window.cartaoCab === 'function') {
      window.cartaoCab = function () {
        return '<h2 class="cc-h2">Compras no Cartão</h2>' +
          '<p style="color:var(--muted);font-size:.82rem;margin:0 0 2px"><span id="cartCount">—</span></p>';
      };
    }
    if (typeof window.cartaoLista === 'function') {
      window.cartaoLista = function () {
        var lst = (typeof cartaoFiltrar === 'function') ? cartaoFiltrar() : (typeof COMPRAS !== 'undefined' ? COMPRAS : []);
        var F = (typeof CART_F !== 'undefined') ? CART_F : {};
        var cLab = F.cartao ? _ccShort(F.cartao) : 'Todos os cartões';
        var mLab = F.mes ? cartMes(F.mes) : 'Todos os meses';
        var pills = '<div class="cc-filtros">' +
          '<button class="cc-fpill" onclick="cartaoToggleFiltros()"><i class="ph-duotone ph-credit-card"></i><span>' + _escC(cLab) + '</span><i class="ph-duotone ph-caret-down cc-caret"></i></button>' +
          '<button class="cc-fpill" onclick="cartaoToggleFiltros()"><i class="ph-duotone ph-calendar-dots"></i><span>' + _escC(mLab) + '</span><i class="ph-duotone ph-caret-down cc-caret"></i></button>' +
          '</div>';
        setTimeout(_ccCount, 0);
        if (!lst.length) return pills + '<div class="cc-empty">Nenhuma compra com esse filtro.</div>';
        var tot = lst.reduce(function (s, c) { return s + (Number(c.valor) || 0); }, 0);
        var conf = lst.filter(function (c) { return c.conferido; }).length;
        var rl = 'Total' + (F.cartao ? (' · ' + _ccShort(F.cartao)) : '') + (F.mes ? (' · ' + cartMes(F.mes)) : '');
        var resumo = '<div class="cc-resumo"><div><div class="cc-rlabel">' + _escC(rl) + '</div><div class="cc-rval">' + cartBRL(tot) + '</div></div>' +
          '<div class="cc-rright"><div class="cc-ritens">' + lst.length + ' ' + (lst.length === 1 ? 'item' : 'itens') + '</div><div class="cc-rconf">' + conf + ' conferido' + (conf === 1 ? '' : 's') + '</div></div></div>';
        var cards = lst.map(function (c) {
          var h = '<div class="cc-card">';
          h += '<div class="cc-top"><div class="cc-item">' + _escC(c.descricao || '(sem descrição)') + '</div><div class="cc-val">' + cartBRL(c.valor) + '</div></div>';
          if (c.data) h += '<div class="cc-data"><i class="ph-duotone ph-calendar-blank"></i> ' + fmtDate(c.data) + '</div>';
          if (c.loja) h += '<div class="cc-forn"><i class="ph-duotone ph-storefront"></i> ' + _escC(c.loja) + '</div>';
          var tags = '';
          if (c.empresa) tags += '<span class="cc-tag cc-emp">' + _escC(c.empresa) + '</span>';
          if (c.cartao) tags += '<span class="cc-tag cc-cartao">' + _escC(_ccShort(c.cartao)) + '</span>';
          if (c.competencia) tags += '<span class="cc-tag cc-comp">' + cartMes(c.competencia) + '</span>';
          if (tags) h += '<div class="cc-tags">' + tags + '</div>';
          h += '<div class="cc-div"></div>';
          h += '<div class="cc-base"><div class="cc-status">' +
            '<label class="cc-chk"><input type="checkbox" ' + (c.conferido ? 'checked' : '') + ' onchange="cartaoToggleConf(' + c.id + ',this.checked)"> Lançado</label>' +
            '<label class="cc-chk"><input type="checkbox" ' + (c.recebido ? 'checked' : '') + ' onchange="cartaoToggleReceb(' + c.id + ',this.checked)"> Recebido</label>' +
            '</div><div class="cc-acts">' +
            '<button class="cc-ab edit" title="Editar" onclick="cartaoEditar(' + c.id + ')"><i class="ph-duotone ph-pencil-simple"></i></button>' +
            '<button class="cc-ab del" title="Excluir" onclick="cartaoExcluir(' + c.id + ')"><i class="ph-duotone ph-trash"></i></button>' +
            '</div></div>';
          h += '</div>';
          return h;
        }).join('');
        return resumo + pills + '<div class="cc-list">' + cards + '</div>';
      };
    }
  } catch (e) {}

  // Rede de segurança: se o render do cartão limpar o painel, recoloca a lista no topo
  try {
    var mp = document.getElementById('module-comprascartao');
    if (mp) {
      new MutationObserver(function () {
        if (mp.classList.contains('active')) { if (!document.getElementById('cmListaTopo')) renderTopo(); ensureFaixa(); }
      }).observe(mp, { childList: true });
    }
  } catch (e) {}

  // ----- Item "Administrativo" no menu (abre equipelola.net/adm/, com login próprio) -----
  function addAdministrativo() {
    try {
      var sb = document.getElementById('sidebar');
      if (!sb || document.getElementById('sb-administrativo')) return;
      var sec = document.createElement('div');
      sec.className = 'sb-section';
      sec.id = 'sb-administrativo';
      sec.innerHTML = '<span class="sb-label">Administrativo</span>';
      var b = document.createElement('button');
      b.className = 'nav-item';
      b.setAttribute('data-menu', 'administrativo');
      b.innerHTML = '<span class="ni"><i class="ph-duotone ph-lock-key"></i></span><span class="nl">Administrativo</span>';
      b.onclick = function () { window.open('/adm/', '_blank', 'noopener'); };
      sec.appendChild(b);
      sb.appendChild(sec);
    } catch (e) {}
  }
  // o portal reaplica permissões no menu; garantimos que este item não seja escondido
  try {
    var st2 = document.createElement('style');
    st2.textContent =
      '#sb-administrativo{display:block !important}' +
      '.nav-item[data-menu="administrativo"]{display:flex !important}';
    document.head.appendChild(st2);
  } catch (e) {}

  renameNav();
  addAdministrativo();
  setTimeout(function () { renameNav(); addAdministrativo(); }, 1500);
})();
