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
      '#module-comprascartao h2{font-size:1.3rem !important}' +
      '#module-comprascartao h2 + p{font-size:.72rem !important}' +
      '#module-comprascartao table.cart-table{font-size:.72rem !important}' +
      '#module-comprascartao table.cart-table th{font-size:.58rem !important}' +
      '#module-comprascartao label{font-size:.6rem !important}' +
      '@media(min-width:601px){' +
      '#module-comprascartao .cart-wrap{max-width:100% !important}' +
      '#module-comprascartao input:not([type=checkbox]),#module-comprascartao select{font-size:13px !important;padding:7px 10px !important}' +
      '#module-comprascartao table.cart-table td{padding:5px 8px !important}' +
      '#module-comprascartao table.cart-table th{padding:6px 8px !important}' +
      '#module-comprascartao table.cart-table td[data-label="Data"],#module-comprascartao table.cart-table td[data-label="Empresa"],#module-comprascartao table.cart-table td[data-label="Cartão"],#module-comprascartao table.cart-table td[data-label="Valor"],#module-comprascartao table.cart-table td[data-label="Comp."]{white-space:nowrap !important}' +
      '#module-comprascartao table.cart-table td.cart-acoes{white-space:nowrap !important}' +
      '#module-comprascartao table.cart-table td.cart-acoes .btn{padding:4px 8px !important}' +
      '}' +
      '@media(max-width:600px){' +
      '#module-comprascartao table.cart-table tr{display:flex !important;flex-wrap:wrap;align-items:center;gap:6px 0;padding:13px 15px !important;border:1px solid var(--border) !important;border-radius:16px;margin-bottom:12px;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.05)}' +
      '#module-comprascartao table.cart-table td{display:block !important;box-sizing:border-box;border:none !important;padding:0 !important;min-height:0 !important;position:static !important;white-space:normal !important;text-align:left !important;font-size:.82rem;line-height:1.25;color:var(--ink)}' +
      '#module-comprascartao table.cart-table td:before{display:none !important}' +
      '#module-comprascartao table.cart-table td[data-label="Data"]:before,#module-comprascartao table.cart-table td[data-label="Loja"]:before,#module-comprascartao table.cart-table td[data-label="Empresa"]:before,#module-comprascartao table.cart-table td[data-label="Cartão"]:before,#module-comprascartao table.cart-table td[data-label="✓ Lançado"]:before,#module-comprascartao table.cart-table td[data-label="📦 Recebido"]:before{display:inline !important;position:static !important;left:auto !important;top:auto !important;font-size:inherit !important;color:inherit !important;font-weight:inherit !important;text-transform:none !important;letter-spacing:normal !important;white-space:nowrap !important}' +
      '#module-comprascartao table.cart-table td[data-label="Data"]:before{content:"📅 " !important}' +
      '#module-comprascartao table.cart-table td[data-label="Loja"]:before{content:"🏪 " !important}' +
      '#module-comprascartao table.cart-table td[data-label="Empresa"]:before{content:"🏢 " !important}' +
      '#module-comprascartao table.cart-table td[data-label="Cartão"]:before{content:"💳 " !important}' +
      '#module-comprascartao table.cart-table td[data-label="✓ Lançado"]:before{content:"Lançado" !important}' +
      '#module-comprascartao table.cart-table td[data-label="📦 Recebido"]:before{content:"Recebido" !important}' +
      '#module-comprascartao table.cart-table td[data-label="O que comprou"]{order:1;width:60%;font-weight:700;font-size:1rem;padding-right:8px !important}' +
      '#module-comprascartao table.cart-table td[data-label="Valor"]{order:2;width:40%;text-align:right !important;font-weight:800;font-size:1.1rem;color:var(--vinho);white-space:nowrap}' +
      '#module-comprascartao table.cart-table td[data-label="Data"]{order:3;width:42%;font-size:.72rem;color:var(--muted);white-space:nowrap;padding-right:6px !important}' +
      '#module-comprascartao table.cart-table td[data-label="Loja"]{order:4;width:58%;font-size:.72rem;color:var(--muted)}' +
      '#module-comprascartao table.cart-table td[data-label="Empresa"]{order:5;width:38%;font-size:.8rem;font-weight:600;padding-right:6px !important;margin-top:2px}' +
      '#module-comprascartao table.cart-table td[data-label="Cartão"]{order:6;width:34%;font-size:.8rem;font-weight:600;margin-top:2px}' +
      '#module-comprascartao table.cart-table td[data-label="Comp."]{order:7;width:28%;font-size:.7rem;color:var(--muted);text-align:right !important;margin-top:2px}' +
      '#module-comprascartao table.cart-table td[data-label="Comp."]:before{display:none !important}' +
      '#module-comprascartao table.cart-table tr:after{content:"";order:8;width:100%;height:1px;background:var(--border);opacity:.6;margin:7px 0 3px}' +
      '#module-comprascartao table.cart-table td[data-label="✓ Lançado"]{order:9;width:29%;display:flex !important;flex-direction:row-reverse;justify-content:flex-end;align-items:center;gap:6px;font-size:.76rem;color:var(--muted)}' +
      '#module-comprascartao table.cart-table td[data-label="📦 Recebido"]{order:10;width:31%;display:flex !important;flex-direction:row-reverse;justify-content:flex-end;align-items:center;gap:6px;font-size:.76rem;color:var(--muted)}' +
      '#module-comprascartao table.cart-table td.cart-acoes{order:11;width:40%;text-align:right !important;white-space:nowrap}' +
      '#module-comprascartao table.cart-table td.cart-acoes:before{display:none !important}' +
      '#module-comprascartao table.cart-table td.cart-acoes .btn{padding:5px 9px !important;font-size:.95rem;display:inline-block}' +
      '#module-comprascartao table.cart-table td input[type=checkbox]{width:18px !important;height:18px !important;accent-color:var(--vinho);margin:0}' +
      '#module-comprascartao table.cart-table td[data-label="✓ Lançado"]:has(input:checked),#module-comprascartao table.cart-table td[data-label="📦 Recebido"]:has(input:checked){color:var(--green);font-weight:700}' +
      '}';
    (document.head || document.documentElement).appendChild(st);
  } catch (e) {}

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function shortCards(html) {
    if (typeof html !== 'string') return html;
    return html.split('Crédito Banrisul').join('Banrisul')
               .split('Cartão Meliuz').join('Meliuz')
               .split('Débito Stone').join('Stone');
  }

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

  function setTitleFromNav(mod) {
    try {
      if (mod === 'home') return;
      var ph = document.getElementById('phModname');
      if (!ph || (ph.textContent || '').trim()) return;
      var nl = document.querySelector('.nav-item[data-mod="' + mod + '"] .nl');
      if (nl && (nl.textContent || '').trim()) ph.textContent = nl.textContent.trim();
    } catch (e) {}
  }

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
    var h = '<div style="padding:16px 22px;max-width:680px">';
    h += '<h3 style="font-family:\'Playfair Display\',serif;color:var(--vinho);font-style:italic;font-size:1.3rem;margin:0 0 4px">Lista de Compras</h3>';
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
    h += '</div>';
    box.innerHTML = h;
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

  try {
    var _orig = window.switchModule;
    window.switchModule = function (mod) {
      _orig.apply(this, arguments);
      renameNav();
      setTitleFromNav(mod);
      if (mod === 'comprascartao') renderTopo();
    };
  } catch (e) {}

  try {
    if (typeof window.cartaoLista === 'function') {
      var _cl = window.cartaoLista;
      window.cartaoLista = function () { return shortCards(_cl.apply(this, arguments)); };
    }
  } catch (e) {}

  try {
    var mp = document.getElementById('module-comprascartao');
    if (mp) {
      new MutationObserver(function () {
        if (mp.classList.contains('active') && !document.getElementById('cmListaTopo')) renderTopo();
      }).observe(mp, { childList: true });
    }
  } catch (e) {}

  renameNav();
  setTimeout(renameNav, 1500);
})();
