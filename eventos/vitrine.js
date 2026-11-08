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
  var cand=VT.fichas.filter(function(f){return f._n===n;});
  if(!cand.length)cand=VT.fichas.filter(function(f){return f._n.length>=5&&(n.indexOf(f._n)>=0||f._n.indexOf(n)>=0);});
  if(!cand.length)return null;
  cand.sort(function(a,b){return (VT.fichasComFoto.has(b.id)?1:0)-(VT.fichasComFoto.has(a.id)?1:0)||Math.abs(a._n.length-n.length)-Math.abs(b._n.length-n.length);});
  return cand[0];
}
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
  if(VT.schemaOk===false)h+='<div class="vt-aviso">Descrições já podem ser editadas. Para <b>enviar foto própria</b>, <b>escolher a foto de uma ficha</b> e marcar <b>vegetariano/vegano</b>, falta rodar no Supabase o arquivo <code>eventos/sql/2026-11-08-vitrine-itens.sql</code>. Até lá, a foto aparece quando o item tem o mesmo nome de uma ficha técnica com foto.</div>';
  h+='<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><input class="search" style="flex:1;min-width:220px" placeholder="🔍 Buscar…" value="'+esc(VT.q)+'" oninput="vtBusca(this.value)">'
   +'<select onchange="vtFiltro(this.value)" style="padding:7px;border-radius:10px;border:1px solid var(--border)"><option value="">Todos os itens</option><option value="semfoto"'+(VT.filtro==='semfoto'?' selected':'')+'>Sem foto</option><option value="semdesc"'+(VT.filtro==='semdesc'?' selected':'')+'>Sem descrição</option></select>'
   +'<label style="font-size:12.5px;display:flex;gap:5px;align-items:center"><input type="checkbox" '+(VT.preco?'checked':'')+' onchange="vtPreco(this.checked)"> mostrar preço</label></div>';
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
  var h='<div class="vt-meta" style="margin-bottom:10px">'+l.length+' itens · '+semFoto+' sem foto · '+semDesc+' sem descrição</div>';
  if(!l.length){el.innerHTML=h+'<div class="intro">Nenhum item.</div>';return;}
  h+='<div class="vt-grid">'+l.map(function(c){
    var foto=fotoDoItem(c);
    return '<div class="vt-card">'+fotoHTML(foto)
     +'<div class="vt-body"><div class="vt-nome">'+esc(c.nome)+'</div>'
     +'<div class="vt-meta"><span>'+esc(c.secao||'')+'</span>'+tagsHTML(c)+(VT.preco?'<span>· '+precoTxt(c)+'</span>':'')+'</div>'
     +(c.descricao?'<div class="vt-desc">'+esc(c.descricao)+'</div>':'<div class="vt-desc vazia">sem descrição</div>')
     +(c.louca?'<div class="vt-meta">🍽️ '+esc(c.louca)+'</div>':'')
     +(foto&&foto.ficha?'<div class="vt-meta" title="de onde vem a foto">📷 '+esc(foto.origem)+'</div>':'')
     +'<div class="vt-acts"><button class="btn-ghost btn-sm" onclick="vtEditar(\''+esc(c.id)+'\')">✏️ Foto e descrição</button></div></div></div>';
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
   +'<div class="field"><label>Marcações</label><div style="display:flex;gap:10px;flex-wrap:wrap;opacity:'+(ok?1:.5)+'">'+TAGS.map(function(t){return '<label style="font-size:12.5px;display:flex;gap:4px;align-items:center"><input type="checkbox" '+(ok?'':'disabled ')+(ED.tags.indexOf(t[0])>=0?'checked ':'')+'onchange="vtEdTag(\''+t[0]+'\',this.checked)"> '+t[1]+'</label>';}).join('')+'</div></div>'
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
})();
