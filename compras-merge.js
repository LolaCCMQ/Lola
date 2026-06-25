/* Portal Lola — junção Lista de Compras + Compras no Cartão
   Overlay não-invasivo: injeta a Lista de Compras (só itens a comprar) no topo
   do módulo "Compras no Cartão", renomeia o menu para "Compras" e esconde o
   item "Lista de Compras" do menu lateral. Reaproveita dbFetch/comprasWrite. */
(function () {
  // Esconde o item "Lista de Compras" do menu via CSS !important
  // (o applyMenuPerms do portal reseta display inline, mas nao vence um !important)
  try {
    var st = document.createElement('style');
    st.textContent = '.nav-item[data-mod="compras"]{display:none !important}';
    (document.head || document.documentElement).appendChild(st);
  } catch (e) {}

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
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

  // Renderiza a Lista de Compras (apenas itens a comprar) no topo do módulo cartão
  async function renderTopo() {
    var panel = document.getElementById('module-comprascartao');
    if (!panel) return;
    var box = document.getElementById('cmListaTopo');
    if (!box) {
      box = document.createElement('div');
      box.id = 'cmListaTopo';
      box.style.cssText = 'flex:0 0 auto;max-height:42vh;overflow-y:auto;background:#fff;border-bottom:3px solid var(--vinho)';
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
    h += '<h3 style="font-family:\'Playfair Display\',serif;color:var(--vinho);font-style:italic;font-size:1.25rem;margin:0 0 4px">Lista de Compras</h3>';
    h += '<p style="color:var(--muted);font-size:.8rem;margin:0 0 12px">O caderninho da equipe — itens comprados saem da lista automaticamente.</p>';
    h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">';
    h += '<input id="cmItem" placeholder="O que precisa comprar?" onkeydown="if(event.key===\'Enter\')window.__cmAdd()" style="flex:2;min-width:150px;font-family:inherit;font-size:.9rem;border:1.5px solid var(--border);border-radius:9px;padding:9px 12px;background:#fff;color:var(--ink)">';
    h += '<input id="cmQtd" placeholder="Qtd (opcional)" onkeydown="if(event.key===\'Enter\')window.__cmAdd()" style="flex:1;min-width:90px;font-family:inherit;font-size:.9rem;border:1.5px solid var(--border);border-radius:9px;padding:9px 12px;background:#fff;color:var(--ink)">';
    h += '<button onclick="window.__cmAdd()" style="background:var(--vinho);color:#fff;border:none;border-radius:9px;padding:9px 18px;font-weight:600;cursor:pointer;font-family:inherit">+ Adicionar</button>';
    h += '</div>';
    if (!aComprar.length) {
      h += '<div style="color:var(--muted);font-size:.85rem;padding:4px 0 6px">Nada na lista por enquanto.</div>';
    } else {
      h += aComprar.map(function (i) {
        return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">'
          + '<input type="checkbox" onchange="window.__cmToggle(' + i.id + ')" style="width:19px;height:19px;accent-color:var(--vinho);cursor:pointer">'
          + '<span style="flex:1;font-size:.92rem;color:var(--ink)">' + esc(i.item)
          + (i.quantidade ? (' <span style="color:#9A7070;font-size:.82rem">- ' + esc(i.quantidade) + '</span>') : '')
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

  // Encaixa no switchModule existente (sem reescrevê-lo)
  try {
    var _orig = window.switchModule;
    window.switchModule = function (mod) {
      _orig.apply(this, arguments);
      renameNav();
      if (mod === 'comprascartao') renderTopo();
    };
  } catch (e) {}

  // Rede de segurança: se o render do cartão limpar o painel, recoloca a lista no topo
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
