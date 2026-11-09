/* ===== Vitrine de eventos (08/11/2026) =====
   Fotos e descrições dos canapés e pratos do catálogo de eventos (lola_eventos_itens),
   + "Do cardápio do Lola": fichas técnicas com foto que ainda não estão no catálogo.
   Usa globais do index.html: sb, esc, fmt, CATALOGO, SECOES, showFlash, refreshFichasCatalogo, currentUserName.
   Colunas novas (eventos/sql/2026-11-08-vitrine-itens.sql): foto_url, ficha_id, tags.
   Sem elas, a vitrine funciona com descrição + foto da ficha achada pelo nome; foto própria/tags ficam travadas. */
(function(){
var VT={aberta:false,schemaOk:null,fichas:[],fichasComFoto:new Set(),fotoCache:{},fotoPend:{},
  sec:'__todas',q:'',preco:false,filtro:'',editId:null,editNovo:null,io:null};
var TAGS=[['V','vegetariano'],['VG','vegano'],['SG','sem glúten'],['SL','sem lactose']];
var STOP=['un','und','unid','unidade','evento','eventos','mini','porcao','porção','kg','gr','g','individual','nova','novo','de','da','do','e','com','pp','porcoes'];

function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\d+\s*(gr|g|ml|kg)\b/g,' ').replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(function(w){return w&&STOP.indexOf(w)<0;}).join(' ');}

/* ficha que corresponde ao item: vínculo salvo > nome igual > nome contido (prefere ficha com foto) */
function fichaDoItem(c){
  if(c.ficha_id){var f=VT.fichas.find(function(x){return x.id===c.ficha_id;});if(f)return f;}
  var n=norm(c.nome); if(n.length<4)return null;
  var A=toks(n), best=null, bs=0;
  VT.fichas.forEach(function(f){var sc=semelhanca(A,f._t||(f._t=toks(f._n)));
    if(sc>bs+1e-9||(Math.abs(sc-bs)<1e-9&&best&&VT.fichasComFoto.has(f.id)&&!VT.fichasComFoto.has(best.id))){bs=sc;best=f;}});
  if(bs<0.6)return null;
  var cand=[best];
  return cand[0];
}
function toks(n){return n.split(' ').filter(Boolean).map(function(w){return w.length>4?w.replace(/s$/,''):w;});}
function semelhanca(A,B){if(!A.length||!B.length)return 0;var m=0;A.forEach(function(a){if(B.some(function(b){return a===b||(a.length>=4&&b.length>=4&&(a.indexOf(b)===0||b.indexOf(a)===0));}))m++;});if(m<Math.min(A.length,B.length))return 0;return m/Math.max(A.length,B.length);}
function fotoDoItem(c){
  if(c.foto_url)return {url:c.foto_url,origem:'própria'};
  var f=fichaDoItem(c); if(f&&VT.fichasComFoto.has(f.id))return {ficha:f.id,origem:'ficha "'+f.nome+'"'+(c.ficha_id?'':' (achada pelo nome)')};
  return null;
}
function itens(){return (typeof CATALOGO!=='undefined'?CATALOGO:[]).filter(function(c){return c.ativo!==false;});}

/* ---------- carregamento ---------- */
async function carregar(){
  if(VT.schemaOk===null){
    try{var t=await sb.from('lola_eventos_itens').select('foto_url,ficha_id,tags').limit(1);VT.schemaOk=!t.error;}catch(e){VT.schemaOk=false;}
    try{var t2=await sb.from('lola_eventos_itens').select('publico').limit(1);VT.pubOk=!t2.error;}catch(e){VT.pubOk=false;}
  }
  if(!VT.fichas.length){
    var r=await Promise.all([
      sb.from('lola_fichas_tecnicas').select('id,nome,cardapio,categoria,preco_venda,rendimento_un').eq('ativo',true).order('nome'),
      sb.from('lola_fichas_fotos').select('ficha_id').limit(5000)
    ]);
    VT.fichas=((r[0]&&r[0].data)||[]).map(function(f){f._n=norm(f.nome);return f;});
    VT.fichasComFoto=new Set(((r[1]&&r[1].data)||[]).map(function(x){return x.ficha_id;}));
  }
}
async function fotoFicha(id){
  if(VT.fotoCache[id]!==undefined)return VT.fotoCache[id];
  if(VT.fotoPend[id])return VT.fotoPend[id];
  VT.fotoPend[id]=(async function(){
    try{var r=await sb.from('lola_fichas_fotos').select('foto').eq('ficha_id',id).order('created_at',{ascending:true}).limit(1);
      VT.fotoCache[id]=(r.data&&r.data[0]&&r.data[0].foto)||null;}catch(e){VT.fotoCache[id]=null;}
    delete VT.fotoPend[id]; return VT.fotoCache[id];
  })();
  return VT.fotoPend[id];
}
function pintarFotosVisiveis(root){
  var els=(root||document).querySelectorAll('[data-vt-ficha]:not([data-vt-ok])');
  if(!('IntersectionObserver' in window)){els.forEach(carregarEl);return;}
  if(!VT.io)VT.io=new IntersectionObserver(function(ents){ents.forEach(function(e){if(e.isIntersecting){VT.io.unobserve(e.target);carregarEl(e.target);}});},{rootMargin:'300px'});
  els.forEach(function(el){VT.io.observe(el);});
}
async function carregarEl(el){
  el.setAttribute('data-vt-ok','1');
  var u=await fotoFicha(el.getAttribute('data-vt-ficha'));
  if(u){el.style.backgroundImage='url("'+u+'")';el.classList.remove('vt-sem');el.innerHTML='';}
  else{el.innerHTML='<span>sem foto</span>';}
}

/* ---------- tela ---------- */
function css(){
  if(document.getElementById('vtCss'))return;
  var s=document.createElement('style');s.id='vtCss';
  s.textContent='#vtOverlay{position:fixed;inset:0;background:rgba(30,10,10,.55);z-index:9998;display:flex;align-items:flex-start;justify-content:center;padding:18px;overflow:auto}'
  +'#vtBox{background:var(--cream);border-radius:16px;max-width:1180px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.35);margin:auto}'
  +'.vt-head{display:flex;align-items:center;gap:10px;padding:16px 18px;border-bottom:1px solid var(--border);flex-wrap:wrap}'
  +'.vt-chips{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}.vt-chip{border:1px solid var(--border);background:#fff;border-radius:99px;padding:5px 12px;font-size:12.5px;cursor:pointer;color:var(--ink)}'
  +'.vt-chip.on{background:var(--vinho);border-color:var(--vinho);color:#fff}'
  +'.vt-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px}'
  +'.vt-card{background:#fff;border:1px solid var(--border);border-radius:14px;overflow:hidden;display:flex;flex-direction:column}'
  +'.vt-foto{aspect-ratio:4/3;background:#F1ECE4 center/cover no-repeat;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:12px;position:relative}'
  +'.vt-foto .vt-orig{position:absolute;left:6px;bottom:6px;background:rgba(255,255,255,.85);border-radius:6px;padding:1px 6px;font-size:10px;color:var(--muted)}'
  +'.vt-body{padding:10px 12px 12px;display:flex;flex-direction:column;gap:5px;flex:1}'
  +'.vt-nome{font-family:var(--serif);font-weight:700;font-size:15.5px;color:var(--vinho-deep);line-height:1.2}'
  +'.vt-desc{font-size:12.5px;color:var(--ink);line-height:1.45}.vt-desc.vazia{color:var(--muted);font-style:italic}'
  +'.vt-meta{font-size:11px;color:var(--muted);display:flex;gap:6px;flex-wrap:wrap;align-items:center}'
  +'.vt-tag{background:var(--green-pale,#E6F3EA);color:var(--green,#2C7A4B);border-radius:6px;padding:1px 6px;font-size:10.5px;font-weight:700}'
  +'.vt-acts{margin-top:auto;display:flex;gap:6px;padding-top:6px}'
  +'.vt-aviso{background:var(--amber-pale,#FBF0DD);color:var(--amber,#9A6B1E);border-radius:10px;padding:9px 12px;font-size:12.5px;margin:10px 0}'
  +'#vtEd{position:fixed;inset:0;background:rgba(30,10,10,.5);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:24px;overflow:auto}'
  +'#vtEd .vt-edbox{background:#fff;border-radius:16px;max-width:620px;width:100%;padding:18px;margin:auto}'
  +'#vtEd textarea{width:100%;min-height:84px;font:inherit;padding:8px;border:1px solid var(--border);border-radius:10px}'
  +'.vt-dd{position:absolute;left:0;right:0;top:100%;background:#fff;border:1px solid var(--border);border-radius:10px;max-height:240px;overflow:auto;z-index:5;box-shadow:0 8px 20px rgba(0,0,0,.12)}'
  +'.vt-dd div{padding:7px 10px;cursor:pointer;font-size:13px;border-bottom:1px solid var(--warm)}.vt-dd div:hover{background:var(--warm)}';
  document.head.appendChild(s);
}
window.openVitrine=async function(){
  css();
  var m=document.getElementById('vtOverlay');
  if(!m){m=document.createElement('div');m.id='vtOverlay';
    m.innerHTML='<div id="vtBox"><div class="vt-head"><b style="flex:1;font-family:var(--serif);font-size:19px;color:var(--vinho)">📸 Vitrine — canapés e pratos para eventos</b>'
    +'<button class="btn-ghost btn-sm" onclick="vtImprimir()">🖨️ Material pro cliente</button><button class="btn-ghost btn-sm" onclick="closeVitrine()">Fechar ✕</button></div>'
    +'<div style="padding:12px 18px 20px"><div id="vtTopo"></div><div id="vtGrid"><div class="loading">Carregando…</div></div></div></div>';
    m.addEventListener('click',function(e){if(e.target===m)closeVitrine();});
    document.body.appendChild(m);}
  m.style.display='flex'; VT.aberta=true;
  try{await carregar();}catch(e){console.error(e);}
  renderTopo();renderGrid();
};
window.closeVitrine=function(){var m=document.getElementById('vtOverlay');if(m)m.style.display='none';VT.aberta=false;};

function secoes(){var s=(typeof SECOES!=='undefined'?SECOES.slice():[]);itens().forEach(function(c){if(c.secao&&s.indexOf(c.secao)<0)s.push(c.secao);});return s;}
function renderTopo(){
  var el=document.getElementById('vtTopo');if(!el)return;
  var chips=[['__todas','Todas (sem bebidas)']].concat(secoes().map(function(s){return [s,s];})).concat([['__lola','➕ Do cardápio do Lola']]);
  var h='';
  if(VT.schemaOk===false||VT.pubOk===false)h+='<div class="vt-aviso">Descrições já podem ser editadas. Para <b>enviar foto própria</b>, <b>escolher a foto de uma ficha</b> e marcar <b>vegetariano/vegano</b>, e escolher o que aparece na <b>página de orçamento do site</b>, falta rodar no Supabase o arquivo <code>eventos/sql/2026-11-08-orcamento-site.sql</code>. Até lá, a foto aparece quando o item tem o mesmo nome de uma ficha técnica com foto.</div>';
  h+='<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><input class="search" style="flex:1 1 260px;min-width:0;width:auto" placeholder="🔍 Buscar…" value="'+esc(VT.q)+'" oninput="vtBusca(this.value)">'
   +'<select onchange="vtFiltro(this.value)" style="flex:0 0 auto;width:auto;padding:7px;border-radius:10px;border:1px solid var(--border)"><option value="">Todos os itens</option><option value="semfoto"'+(VT.filtro==='semfoto'?' selected':'')+'>Sem foto</option><option value="semdesc"'+(VT.filtro==='semdesc'?' selected':'')+'>Sem descrição</option>'+(VT.pubOk?'<option value="site"'+(VT.filtro==='site'?' selected':'')+'>No site</option><option value="forasite"'+(VT.filtro==='forasite'?' selected':'')+'>Fora do site</option>':'')+'</select>'
   +'<label style="flex:0 0 auto;font-size:12.5px;display:flex;gap:5px;align-items:center;white-space:nowrap;margin:0"><input type="checkbox" style="width:auto;margin:0" '+(VT.preco?'checked':'')+' onchange="vtPreco(this.checked)"> mostrar preço</label></div>';
  h+='<div class="vt-chips">'+chips.map(function(c){return '<button class="vt-chip'+(VT.sec===c[0]?' on':'')+'" onclick="vtSec(\''+esc(c[0]).replace(/'/g,"\\'")+'\')">'+esc(c[1])+'</button>';}).join('')+'</div>';
  el.innerHTML=h;
}
window.vtBusca=function(v){VT.q=v;renderGrid();};
window.vtFiltro=function(v){VT.filtro=v;renderGrid();};
window.vtPreco=function(v){VT.preco=v;renderGrid();};
window.vtSec=function(s){VT.sec=s;renderTopo();renderGrid();};

function listaFiltrada(){
  var q=norm(VT.q);
  return itens().filter(function(c){
    if(VT.sec==='__todas'){if(c.secao==='Bebidas'||c.secao==='Outros')return false;}
    else if(c.secao!==VT.sec)return false;
    if(q&&norm(c.nome+' '+(c.descricao||'')).indexOf(q)<0)return false;
    if(VT.filtro==='semfoto'&&fotoDoItem(c))return false;
    if(VT.filtro==='semdesc'&&c.descricao)return false;
    if(VT.filtro==='site'&&!c.publico)return false;
    if(VT.filtro==='forasite'&&c.publico)return false;
    return true;
  }).sort(function(a,b){return secoes().indexOf(a.secao)-secoes().indexOf(b.secao)||String(a.nome).localeCompare(String(b.nome));});
}
function fichasForaDoCatalogo(){
  var usadas=new Set();itens().forEach(function(c){var f=fichaDoItem(c);if(f)usadas.add(f.id);});
  var q=norm(VT.q);
  return VT.fichas.filter(function(f){return f.categoria!=='bebida'&&!usadas.has(f.id)&&VT.fichasComFoto.has(f.id)&&(!q||f._n.indexOf(q)>=0);});
}
function fotoHTML(foto){
  if(!foto)return '<div class="vt-foto vt-sem"><span>sem foto</span></div>';
  if(foto.url)return '<div class="vt-foto" style="background-image:url(&quot;'+esc(foto.url)+'&quot;)"><span class="vt-orig">foto própria</span></div>';
  return '<div class="vt-foto vt-sem" data-vt-ficha="'+esc(foto.ficha)+'"><span>carregando…</span></div>';
}
function tagsHTML(c){return (c.tags||[]).map(function(t){return '<span class="vt-tag">'+esc(t)+'</span>';}).join('');}
function precoTxt(c){return fmt(c.preco)+(c.per_pax!==false?' /pessoa':(c.unidade?' /'+esc(c.unidade):''));}
function renderGrid(){
  var el=document.getElementById('vtGrid');if(!el)return;
  if(VT.sec==='__lola'){
    var fs=fichasForaDoCatalogo();
    el.innerHTML='<div class="intro" style="margin-bottom:10px">Fichas técnicas com foto que ainda <b>não estão</b> no catálogo de eventos ('+fs.length+'). Adicione as que fazem sentido em evento — dá pra ajustar nome (ex.: “Mini porção de …”), preço e descrição.</div>'
      +(fs.length?'<div class="vt-grid">'+fs.map(function(f){return '<div class="vt-card">'+fotoHTML({ficha:f.id})+'<div class="vt-body"><div class="vt-nome">'+esc(f.nome)+'</div><div class="vt-meta">ficha · '+esc(f.cardapio||'')+(f.preco_venda?' · '+fmt(f.preco_venda):'')+'</div><div class="vt-acts"><button class="btn-primary btn-sm" onclick="vtNovoDaFicha(\''+f.id+'\')">+ Adicionar ao catálogo</button></div></div></div>';}).join('')+'</div>':'<div class="intro">Nada aqui: todas as fichas com foto já estão no catálogo.</div>');
    pintarFotosVisiveis(el);return;
  }
  var l=listaFiltrada();
  var semFoto=l.filter(function(c){return !fotoDoItem(c);}).length, semDesc=l.filter(function(c){return !c.descricao;}).length;
  var noSite=l.filter(function(c){return c.publico;}).length;
  var h='<div class="vt-meta" style="margin-bottom:10px">'+l.length+' itens · '+semFoto+' sem foto · '+semDesc+' sem descrição'+(VT.pubOk?' · '+noSite+' no site (<a href="https://lolabar.com.br/orcamento-evento.html" target="_blank">ver página</a>)':'')+'</div>';
  if(!l.length){el.innerHTML=h+'<div class="intro">Nenhum item.</div>';return;}
  h+='<div class="vt-grid">'+l.map(function(c){
    var foto=fotoDoItem(c);
    return '<div class="vt-card">'+fotoHTML(foto)
     +'<div class="vt-body"><div class="vt-nome">'+esc(c.nome)+'</div>'
     +'<div class="vt-meta"><span>'+esc(c.secao||'')+'</span>'+tagsHTML(c)+(VT.preco?'<span>· '+precoTxt(c)+'</span>':'')+'</div>'
     +(c.descricao?'<div class="vt-desc">'+esc(c.descricao)+'</div>':'<div class="vt-desc vazia">sem descrição</div>')
     +(c.louca?'<div class="vt-meta">🍽️ '+esc(c.louca)+'</div>':'')
     +(foto&&foto.ficha?'<div class="vt-meta" title="de onde vem a foto">📷 '+esc(foto.origem)+'</div>':'')
     +'<div class="vt-acts"><button class="btn-ghost btn-sm" onclick="vtEditar(\''+esc(c.id)+'\')">✏️ Foto e descrição</button>'
     +(VT.pubOk?'<button class="btn-'+(c.publico?'primary':'ghost')+' btn-sm" title="'+(c.publico?'Aparece na página de orçamento do site. Toque pra tirar.':'Não aparece no site. Toque pra mostrar na página de orçamento.')+'" onclick="vtSite(\''+esc(c.id)+'\')">🌐 '+(c.publico?'no site':'fora do site')+'</button>':'')
     +'</div></div></div>';
  }).join('')+'</div>';
  el.innerHTML=h; pintarFotosVisiveis(el);
}

/* ---------- editor ---------- */
var ED={};
function abrirEditor(c,novo){
  ED={id:novo?null:c.id,novo:!!novo,nome:c.nome||'',secao:c.secao||(SECOES&&SECOES[0])||'Comidinhas',descricao:c.descricao||'',louca:c.louca||'',
    tags:(c.tags||[]).slice(),foto_url:c.foto_url||'',ficha_id:c.ficha_id||'',preco:c.preco,per_pax:c.per_pax,unidade:c.unidade,arquivo:null,
    fichaAuto:novo?null:fichaDoItem(c)};
  var d=document.getElementById('vtEd');if(!d){d=document.createElement('div');d.id='vtEd';document.body.appendChild(d);}
  d.style.display='flex';pintarEditor();
}
window.vtEditar=function(id){var c=itens().find(function(x){return String(x.id)===String(id);});if(c)abrirEditor(c,false);};
window.vtNovoDaFicha=function(fid){var f=VT.fichas.find(function(x){return x.id===fid;});if(!f)return;
  abrirEditor({nome:f.nome,secao:(SECOES||[])[0]||'Comidinhas',ficha_id:f.id,preco:f.preco_venda||0,per_pax:false,unidade:f.rendimento_un||'un'},true);};
window.vtFecharEd=function(){var d=document.getElementById('vtEd');if(d)d.style.display='none';};
function edFotoAtual(){
  if(ED.arquivo)return {src:ED.arquivo,txt:'foto nova (ainda não salva)'};
  if(ED.foto_url)return {src:ED.foto_url,txt:'foto própria'};
  var fid=ED.ficha_id||(ED.fichaAuto&&ED.fichaAuto.id);
  if(fid&&VT.fichasComFoto.has(fid)){var f=VT.fichas.find(function(x){return x.id===fid;});return {ficha:fid,txt:'foto da ficha "'+(f?f.nome:'')+'"'+(ED.ficha_id?'':' (achada pelo nome)')};}
  return null;
}
function pintarEditor(){
  var d=document.getElementById('vtEd');if(!d)return;
  var ok=VT.schemaOk!==false, fa=edFotoAtual();
  var secOpts=secoes().map(function(s){return '<option'+(s===ED.secao?' selected':'')+'>'+esc(s)+'</option>';}).join('');
  var fichaNome=ED.ficha_id?((VT.fichas.find(function(x){return x.id===ED.ficha_id;})||{}).nome||''):'';
  d.innerHTML='<div class="vt-edbox"><div style="font-weight:700;color:var(--vinho-deep);font-family:var(--serif);font-size:17px;margin-bottom:12px">'+(ED.novo?'Adicionar ao catálogo de eventos':'Foto e descrição')+'</div>'
   +'<div style="display:grid;grid-template-columns:200px 1fr;gap:14px;align-items:start">'
   +'<div><div id="vtEdFoto" class="vt-foto'+(fa&&!fa.ficha?'':' vt-sem')+'" style="border-radius:10px'+(fa&&fa.src?';background-image:url(&quot;'+esc(fa.src)+'&quot;)':'')+'"'+(fa&&fa.ficha?' data-vt-ficha="'+esc(fa.ficha)+'"':'')+'>'+(fa?(fa.ficha?'<span>carregando…</span>':''):'<span>sem foto</span>')+'</div>'
   +'<div class="vt-meta" style="margin-top:4px">'+(fa?esc(fa.txt):'')+'</div>'
   +'<div style="display:flex;flex-direction:column;gap:6px;margin-top:8px">'
   +'<label class="btn-ghost btn-sm" style="text-align:center;cursor:'+(ok?'pointer':'not-allowed')+';opacity:'+(ok?1:.5)+'">📷 Enviar foto<input type="file" accept="image/*" style="display:none" '+(ok?'':'disabled')+' onchange="vtEdArquivo(this)"></label>'
   +((ED.foto_url||ED.arquivo)&&ok?'<button class="btn-ghost btn-sm" onclick="vtEdTirarFoto()">Tirar foto própria</button>':'')
   +'</div></div>'
   +'<div>'
   +'<div class="field"><label>Nome</label><input id="vtEdNome" value="'+esc(ED.nome)+'"></div>'
   +(ED.novo?'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px"><div class="field"><label>Seção</label><select id="vtEdSec">'+secOpts+'</select></div><div class="field"><label>Preço (R$)</label><input id="vtEdPreco" type="number" step="0.01" value="'+esc(ED.preco!=null?ED.preco:'')+'"></div><div class="field"><label>Unidade</label><input id="vtEdUn" value="'+esc(ED.unidade||'un')+'"></div></div><div class="hint" style="margin:-4px 0 6px">Preço por unidade/porção (o da ficha cheia). Ajuste se for mini porção.</div>':'')
   +'<div class="field"><label>Descrição pro cliente <span class="hint">(1 ou 2 frases: o que é e o que tem de especial)</span></label><textarea id="vtEdDesc" maxlength="320" placeholder="ex.: Croqueta cremosa de moqueca, empanada crocante, com aioli de dendê.">'+esc(ED.descricao)+'</textarea></div>'
   +'<div class="field"><label>Louça / como serve <span class="hint">(interno)</span></label><input id="vtEdLouca" value="'+esc(ED.louca)+'" placeholder="ex.: colher de porcelana, cone, copinho 60 ml"></div>'
   +'<div class="field"><label>Marcações</label><div style="display:flex;gap:10px;flex-wrap:wrap;opacity:'+(ok?1:.5)+'">'+TAGS.map(function(t){return '<label style="font-size:12.5px;display:flex;gap:4px;align-items:center;white-space:nowrap;margin:0"><input type="checkbox" style="width:auto;margin:0" '+(ok?'':'disabled ')+(ED.tags.indexOf(t[0])>=0?'checked ':'')+'onchange="vtEdTag(\''+t[0]+'\',this.checked)"> '+t[1]+'</label>';}).join('')+'</div></div>'
   +'<div class="field" style="position:relative"><label>Ficha técnica ligada <span class="hint">(de onde vem a foto quando não há foto própria)</span></label>'
   +'<input id="vtEdFicha" '+(ok?'':'disabled ')+'autocomplete="off" value="'+esc(fichaNome)+'" placeholder="'+(ED.fichaAuto&&!ED.ficha_id?'achada pelo nome: '+esc(ED.fichaAuto.nome):'buscar ficha…')+'" oninput="vtEdFichaBusca(this.value)" onfocus="vtEdFichaBusca(this.value)" onblur="setTimeout(function(){var x=document.getElementById(\'vtEdDD\');if(x)x.style.display=\'none\';},200)"><div id="vtEdDD" class="vt-dd" style="display:none"></div>'
   +(ED.ficha_id?'<button class="btn-ghost btn-sm" style="margin-top:4px" onclick="vtEdFicha(\'\')">desligar ficha</button>':'')+'</div>'
   +'</div></div>'
   +'<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px"><button class="btn-ghost" onclick="vtFecharEd()">Cancelar</button><button class="btn-primary" id="vtEdSalvar" onclick="vtEdSalvar()">Salvar</button></div></div>';
  pintarFotosVisiveis(d);
}
function capturar(){var g=function(id){var e=document.getElementById(id);return e?e.value:null;};
  var v;if((v=g('vtEdNome'))!=null)ED.nome=v;if((v=g('vtEdDesc'))!=null)ED.descricao=v;if((v=g('vtEdLouca'))!=null)ED.louca=v;
  if((v=g('vtEdSec'))!=null)ED.secao=v;if((v=g('vtEdPreco'))!=null)ED.preco=v;if((v=g('vtEdUn'))!=null)ED.unidade=v;}
window.vtEdTag=function(t,on){var i=ED.tags.indexOf(t);if(on&&i<0)ED.tags.push(t);if(!on&&i>=0)ED.tags.splice(i,1);};
window.vtEdTirarFoto=function(){capturar();ED.arquivo=null;ED.foto_url='';pintarEditor();};
window.vtEdArquivo=function(inp){var f=inp.files&&inp.files[0];if(!f)return;capturar();
  reduzir(f,function(durl){ED.arquivo=durl;pintarEditor();});};
window.vtEdFichaBusca=function(q){var dd=document.getElementById('vtEdDD');if(!dd)return;var n=norm(q);
  var l=VT.fichas.filter(function(f){return !n||f._n.indexOf(n)>=0;}).slice(0,40);
  dd.innerHTML=l.length?l.map(function(f){return '<div onmousedown="vtEdFicha(\''+f.id+'\')">'+(VT.fichasComFoto.has(f.id)?'📷 ':'')+esc(f.nome)+' <span style="color:var(--muted)">· '+esc(f.cardapio||'')+'</span></div>';}).join(''):'<div style="color:var(--muted)">nada encontrado</div>';
  dd.style.display='block';};
window.vtEdFicha=function(id){capturar();ED.ficha_id=id||'';if(!id)ED.fichaAuto=null;pintarEditor();};
function reduzir(file,cb){var r=new FileReader();r.onload=function(){var img=new Image();img.onload=function(){var w=img.width,h=img.height,max=1400;
  if(w>max||h>max){if(w>h){h=Math.round(h*max/w);w=max;}else{w=Math.round(w*max/h);h=max;}}
  var c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);cb(c.toDataURL('image/jpeg',0.8));};
  img.onerror=function(){showFlash('Não consegui ler essa imagem.',true);};img.src=r.result;};r.readAsDataURL(file);}
async function subirFoto(durl,base){
  var blob=await (await fetch(durl)).blob();
  var path='eventos-itens/'+base+'-'+Date.now()+'.jpg';
  var up=await sb.storage.from('anexos').upload(path,blob,{upsert:true,contentType:'image/jpeg'});
  if(up.error)throw up.error;
  return sb.storage.from('anexos').getPublicUrl(path).data.publicUrl;
}
window.vtEdSalvar=async function(){
  capturar(); var nome=(ED.nome||'').trim(); if(!nome){showFlash('Dê um nome ao item.',true);return;}
  var b=document.getElementById('vtEdSalvar');if(b){b.disabled=true;b.textContent='Salvando…';}
  try{
    var row={nome:nome,descricao:(ED.descricao||'').trim()||null,louca:(ED.louca||'').trim()||null,updated_at:new Date().toISOString()};
    if(VT.schemaOk!==false){
      if(ED.arquivo)ED.foto_url=await subirFoto(ED.arquivo,ED.id||('novo-'+norm(nome).replace(/ /g,'-').slice(0,40)));
      row.foto_url=ED.foto_url||null; row.ficha_id=ED.ficha_id||null; row.tags=ED.tags.length?ED.tags:null;
    }
    if(ED.novo){
      Object.assign(row,{secao:ED.secao||null,preco:Math.round((Number(ED.preco)||0)*100)/100,unidade:(ED.unidade||'').trim()||null,per_pax:false,ativo:true,criado_por:currentUserName()});
      var r=await sb.from('lola_eventos_itens').insert(row).select();if(r.error)throw r.error;
      if(r.data&&r.data[0])CATALOGO.push(r.data[0]);
    }else{
      var r2=await sb.from('lola_eventos_itens').update(row).eq('id',ED.id);if(r2.error)throw r2.error;
      var i=CATALOGO.findIndex(function(x){return String(x.id)===String(ED.id);});if(i>=0)CATALOGO[i]=Object.assign({},CATALOGO[i],row);
    }
    if(typeof refreshFichasCatalogo==='function')refreshFichasCatalogo();
    vtFecharEd();renderGrid();showFlash(ED.novo?'Adicionado ao catálogo ✓':'Salvo ✓');
  }catch(e){console.error(e);showFlash('Erro ao salvar: '+((e&&e.message)||e),true);if(b){b.disabled=false;b.textContent='Salvar';}}
};

/* ---------- material pro cliente ---------- */
window.vtImprimir=async function(){
  var l=(VT.sec==='__lola')?[]:listaFiltrada();
  if(!l.length){showFlash('Nada pra imprimir nesta seleção.',true);return;}
  showFlash('Montando o material…');
  var fotos=[];
  for(var k=0;k<l.length;k++){var f=fotoDoItem(l[k]);fotos.push(f?(f.url||await fotoFicha(f.ficha)):null);}
  var porSec={};l.forEach(function(c,i){(porSec[c.secao||'Outros']=porSec[c.secao||'Outros']||[]).push([c,fotos[i]]);});
  var html='<!doctype html><html><head><meta charset="utf-8"><title>Lola — Comidinhas para eventos</title>'
   +'<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600;800&family=Hanken+Grotesk:wght@400;600&display=swap" rel="stylesheet">'
   +'<style>@page{size:A4;margin:14mm}body{font-family:"Hanken Grotesk",Arial,sans-serif;color:#2A1A17;margin:0}'
   +'h1{font-family:Fraunces,Georgia,serif;color:#A82A2A;font-size:30px;margin:0}h2{font-family:Fraunces,Georgia,serif;color:#7E1E1F;font-size:19px;border-bottom:1.5px solid #E8CFC7;padding-bottom:4px;margin:22px 0 10px;break-after:avoid}'
   +'.sub{color:#8A7A72;font-size:12px;margin:4px 0 6px}.g{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}'
   +'.c{break-inside:avoid;border:1px solid #ECE3D9;border-radius:10px;overflow:hidden}.f{aspect-ratio:4/3;background:#F1ECE4 center/cover no-repeat;-webkit-print-color-adjust:exact;print-color-adjust:exact}'
   +'.b{padding:7px 9px 9px}.n{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:13.5px;color:#7E1E1F}.d{font-size:11px;line-height:1.4;margin-top:3px}.m{font-size:10px;color:#8A7A72;margin-top:4px}'
   +'.t{display:inline-block;background:#E6F3EA;color:#2C7A4B;border-radius:4px;padding:0 4px;font-size:9px;font-weight:700;margin-left:4px}</style></head><body>'
   +'<h1>Lola · Eventos</h1><div class="sub">Comidinhas, mini porções e doces para o seu evento · Lola CCMQ (7º andar da Casa de Cultura Mario Quintana) e Lola MAC</div>';
  Object.keys(porSec).sort(function(a,b){return secoes().indexOf(a)-secoes().indexOf(b);}).forEach(function(s){
    html+='<h2>'+esc(s)+'</h2><div class="g">'+porSec[s].map(function(p){var c=p[0],u=p[1];
      return '<div class="c">'+(u?'<div class="f" style="background-image:url(&quot;'+esc(u)+'&quot;)"></div>':'<div class="f"></div>')
       +'<div class="b"><div class="n">'+esc(c.nome)+((c.tags||[]).map(function(t){return '<span class="t">'+esc(t)+'</span>';}).join(''))+'</div>'
       +(c.descricao?'<div class="d">'+esc(c.descricao)+'</div>':'')+(VT.preco?'<div class="m">'+precoTxt(c)+'</div>':'')+'</div></div>';}).join('')+'</div>';
  });
  html+='<div class="sub" style="margin-top:18px">V vegetariano · VG vegano · SG sem glúten · SL sem lactose'+(VT.preco?' · Valores sujeitos a confirmação no orçamento.':'')+'</div>'
   +'<script>window.onload=function(){setTimeout(function(){window.print();},700);};<\/script></body></html>';
  var w=window.open('','_blank');if(!w){showFlash('Libere pop-ups pra imprimir.',true);return;}
  w.document.open();w.document.write(html);w.document.close();
};

/* ---------- 🌐 aparece no site (página de orçamento) ---------- */
window.vtSite=async function(id){
  var c=itens().find(function(x){return String(x.id)===String(id);});if(!c)return;
  var novo=!c.publico;
  if(novo&&(!c.descricao||!fotoDoItem(c))&&!confirm('Esse item ainda está '+(!c.descricao?'sem descrição':'sem foto')+'. Mostrar no site mesmo assim?'))return;
  var r=await sb.from('lola_eventos_itens').update({publico:novo,updated_at:new Date().toISOString()}).eq('id',id);
  if(r.error){showFlash('Erro: '+r.error.message,true);return;}
  c.publico=novo;renderGrid();showFlash(novo?'Aparece no site ✓':'Tirado do site');
};

/* ---------- 📥 Pedidos de orçamento que chegam pelo site ---------- */
var PD={lista:[],filtro:'novo',ok:null};
var LOCAL_SITE={ccmq:['ccmq','interno_ccmq','Lola CCMQ'],cupula:['ccmq','cupula_ccmq','Cúpula CCMQ'],mac:['mac','jardim_mac','Lola MAC (jardim)'],catering:['catering','externo','No espaço do cliente'],indef:['','','Ainda não sabe']};
function dtBR(d){if(!d)return 'a definir';var p=String(d).slice(0,10).split('-');return p[2]+'/'+p[1]+'/'+p[0];}
async function contarPedidos(){
  try{var r=await sb.from('lola_eventos_pedidos').select('id',{count:'exact',head:true}).eq('status','novo');
    PD.ok=!r.error; var b=document.getElementById('btnPedidosSite'); if(b&&!r.error)b.textContent='📥 Pedidos do site'+(r.count?' ('+r.count+')':'');
  }catch(e){PD.ok=false;}
}
window.openPedidosSite=async function(){
  css();
  var m=document.getElementById('pdOverlay');
  if(!m){m=document.createElement('div');m.id='pdOverlay';m.style.cssText='position:fixed;inset:0;background:rgba(30,10,10,.55);z-index:9998;display:flex;align-items:flex-start;justify-content:center;padding:18px;overflow:auto';
    m.innerHTML='<div style="background:var(--cream);border-radius:16px;max-width:900px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.35);margin:auto"><div class="vt-head"><b style="flex:1;font-family:var(--serif);font-size:19px;color:var(--vinho)">📥 Pedidos de orçamento do site</b>'
     +'<a class="btn-ghost btn-sm" href="https://lolabar.com.br/orcamento-evento.html" target="_blank" style="text-decoration:none">Abrir a página</a><button class="btn-ghost btn-sm" onclick="pdCopiarLink()">Copiar link</button><button class="btn-ghost btn-sm" onclick="closePedidosSite()">Fechar ✕</button></div><div id="pdBody" style="padding:14px 18px 20px"><div class="loading">Carregando…</div></div></div>';
    m.addEventListener('click',function(e){if(e.target===m)closePedidosSite();});document.body.appendChild(m);}
  m.style.display='flex'; await pdCarregar();
};
window.closePedidosSite=function(){var m=document.getElementById('pdOverlay');if(m)m.style.display='none';contarPedidos();};
window.pdCopiarLink=function(){var u='https://lolabar.com.br/orcamento-evento.html';try{navigator.clipboard.writeText(u);showFlash('Link copiado ✓');}catch(e){prompt('Link da página:',u);}};
async function pdCarregar(){
  var el=document.getElementById('pdBody');
  var r=await sb.from('lola_eventos_pedidos').select('*').order('created_at',{ascending:false}).limit(200);
  if(r.error){PD.ok=false;el.innerHTML='<div class="vt-aviso">Os pedidos ainda não estão sendo guardados no sistema: falta rodar no Supabase o arquivo <code>eventos/sql/2026-11-08-orcamento-site.sql</code>. Enquanto isso, a página do site manda o pedido pelo WhatsApp do Lola.</div>';return;}
  PD.ok=true;PD.lista=r.data||[];pdRender();
}
window.pdFiltro=function(f){PD.filtro=f;pdRender();};
function pdRender(){
  var el=document.getElementById('pdBody');if(!el)return;
  var cont={novo:0,convertido:0,arquivado:0};PD.lista.forEach(function(p){cont[p.status]=(cont[p.status]||0)+1;});
  var l=PD.lista.filter(function(p){return p.status===PD.filtro;});
  var h='<div class="vt-chips">'+[['novo','Novos'],['convertido','Viraram evento'],['arquivado','Arquivados']].map(function(f){return '<button class="vt-chip'+(PD.filtro===f[0]?' on':'')+'" onclick="pdFiltro(\''+f[0]+'\')">'+f[1]+' ('+(cont[f[0]]||0)+')</button>';}).join('')+'</div>';
  if(!l.length){el.innerHTML=h+'<div class="intro">Nenhum pedido aqui.</div>';return;}
  h+=l.map(function(p){
    var loc=(LOCAL_SITE[p.local]||[,,p.local||''])[2];
    var tel=String(p.telefone||'').replace(/\D/g,''); if(tel&&tel.length<=11)tel='55'+tel;
    var itens=(p.itens||[]).map(function(x){return '<tr><td>'+esc(x.nome)+'</td><td style="color:var(--muted)">'+esc(x.secao||'')+'</td><td style="text-align:right">'+(x.per_pax?esc(p.pax)+' pax':esc(x.qtd)+' '+esc(x.unidade||'un'))+'</td><td style="text-align:right">'+fmt((Number(x.preco)||0)*(x.per_pax?(Number(p.pax)||0):(Number(x.qtd)||0)))+'</td></tr>';}).join('');
    return '<div style="background:#fff;border:1px solid var(--border);border-radius:14px;padding:14px;margin-bottom:12px">'
     +'<div style="display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap"><div style="flex:1;min-width:220px"><div style="font-family:var(--serif);font-weight:700;font-size:17px;color:var(--vinho-deep)">'+esc(p.ocasiao||'Evento')+' — '+esc(p.nome)+'</div>'
     +'<div class="vt-meta" style="margin-top:3px">📅 '+dtBR(p.data)+(p.horario?' às '+esc(p.horario):'')+' · 👥 '+esc(p.pax||'?')+' pessoas · 📍 '+esc(loc)+' · '+esc(p.formato||'')+'</div>'
     +'<div class="vt-meta">📞 '+esc(p.telefone||'—')+(p.email?' · ✉️ '+esc(p.email):'')+' · recebido em '+new Date(p.created_at).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})+'</div></div>'
     +'<div style="text-align:right"><div class="vt-meta">estimativa no site</div><div style="font-family:var(--serif);font-weight:800;font-size:20px;color:var(--vinho)">'+fmt(p.estimativa)+'</div></div></div>'
     +(itens?'<table style="width:100%;border-collapse:collapse;font-size:12.5px;margin-top:8px">'+itens+'</table>':'')
     +(p.obs?'<div style="margin-top:8px;font-size:13px;background:var(--warm);border-radius:8px;padding:8px 10px">💬 '+esc(p.obs)+'</div>':'')
     +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">'
     +(p.status==='novo'?'<button class="btn-primary btn-sm" onclick="pdCriarEvento(\''+p.id+'\')">✓ Criar pré-reserva</button>':'')
     +(p.evento_id?'<button class="btn-ghost btn-sm" onclick="pdAbrirEvento(\''+p.evento_id+'\')">Abrir evento →</button>':'')
     +(tel?'<a class="btn-ghost btn-sm" style="text-decoration:none" target="_blank" href="https://wa.me/'+tel+'">WhatsApp do cliente</a>':'')
     +(p.status==='novo'?'<button class="btn-ghost btn-sm" onclick="pdStatus(\''+p.id+'\',\'arquivado\')">Arquivar</button>':'')
     +(p.status==='arquivado'?'<button class="btn-ghost btn-sm" onclick="pdStatus(\''+p.id+'\',\'novo\')">Voltar pra novos</button>':'')
     +(p.atendido_por?'<span class="vt-meta">por '+esc(p.atendido_por)+'</span>':'')
     +'</div></div>';
  }).join('');
  el.innerHTML=h;
}
window.pdStatus=async function(id,st){
  var r=await sb.from('lola_eventos_pedidos').update({status:st,atendido_por:currentUserName(),atendido_em:new Date().toISOString()}).eq('id',id);
  if(r.error){showFlash('Erro: '+r.error.message,true);return;}
  var p=PD.lista.find(function(x){return x.id===id;});if(p){p.status=st;p.atendido_por=currentUserName();}pdRender();
};
window.pdAbrirEvento=function(id){if(typeof getEvent==='function'&&getEvent(id)){closePedidosSite();open_(id);}else location.href='/eventos/?ev='+id;};
window.pdCriarEvento=async function(id){
  var p=PD.lista.find(function(x){return x.id===id;});if(!p||p.status!=='novo')return;
  var loc=LOCAL_SITE[p.local]||['','',''];
  var ev=blankEvent();
  ev.nome=(p.ocasiao||'Evento')+' — '+p.nome; ev.cliente=p.nome; ev.contato=[p.telefone,p.email].filter(Boolean).join(' · ');
  ev.tipo='personalizado'; ev.status='pre'; ev.local=loc[0]; ev.cupula=loc[1];
  ev.data=p.data||''; ev.horario=p.horario||''; ev.duracao=p.duracao||''; ev.ocasiao=p.ocasiao||'';
  ev.pax=p.pax!=null?String(p.pax):''; ev.paxIn=ev.pax; ev.responsavel=currentUserName()==='portal'?'':currentUserName();
  ev.obs='Pedido pelo site em '+new Date(p.created_at).toLocaleDateString('pt-BR')+' · formato: '+(p.formato||'—')+' · estimativa mostrada ao cliente: '+fmt(p.estimativa)+(p.obs?'\nCliente escreveu: '+p.obs:'');
  ev.menu=(p.itens||[]).map(function(x){
    var c=itens().find(function(k){return String(k.id)===String(x.id);})||{};
    return {nome:x.nome_catalogo||x.nome,qtd:x.per_pax?1:(Number(x.qtd)||0),preco:Math.round((Number(x.preco)||0)*100)/100,un:x.unidade||'',perPax:!!x.per_pax,ficha:null,
      cat:x.secao==='Bebidas'?'B':'C',secao:x.secao||'',desc:c.descricao||'',louca:c.louca||'',unCompra:'',tamCompra:''};
  });
  var r=await sb.from('lola_eventos').insert(toRow(ev)).select().single();
  if(r.error){showFlash('Não consegui criar o evento: '+r.error.message,true);return;}
  var e=fromRow(r.data);DB.events.push(e);
  var u=await sb.from('lola_eventos_pedidos').update({status:'convertido',evento_id:e.id,atendido_por:currentUserName(),atendido_em:new Date().toISOString()}).eq('id',id);
  if(u.error)showFlash('Evento criado, mas não marquei o pedido como atendido: '+u.error.message,true);
  p.status='convertido';p.evento_id=e.id;
  closePedidosSite();if(typeof renderList==='function')renderList();open_(e.id);showFlash('Pré-reserva criada a partir do pedido ✓');
};
setTimeout(contarPedidos,2500);

})();
