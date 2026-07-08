/* ===========================================================
   Lola · Autenticação do Administrativo (Supabase Auth)
   Login real com e-mail + senha. Cada pessoa tem sua conta e
   seu papel (admin / financeiro / operacional), definido na
   tabela lola_perfis. O token do usuário é usado nas chamadas
   ao banco — quem não tem permissão simplesmente não recebe os dados.
   =========================================================== */
const SB_URL='https://mvjbsdpfjhywhaonvpfl.supabase.co';
const SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12amJzZHBmamh5d2hhb252cGZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MDk2OTAsImV4cCI6MjA5NTM4NTY5MH0.i_3sqgQa6umsIYBmAwWz_NP6nYuT3GfIZid24zHXSEI';
const _LS='lolaSess';

const PAPEL_NOME={admin:'Administradora',financeiro:'Financeiro',operacional:'Operacional'};

function _sessGet(){ try{ return JSON.parse(localStorage.getItem(_LS)||'null'); }catch(e){ return null; } }
function _sessSet(s){ localStorage.setItem(_LS, JSON.stringify(s)); }
function lolaLogout(){ localStorage.removeItem(_LS); }
function lolaSession(){ return _sessGet(); }
function lolaPapel(){ const s=_sessGet(); return s?s.papel:null; }

/* headers para o REST do Supabase (usa o token DO USUÁRIO) */
function lolaHeaders(extra){
  const s=_sessGet();
  return Object.assign({
    apikey: SB_KEY,
    Authorization: 'Bearer ' + (s && s.access_token ? s.access_token : SB_KEY),
    'Content-Type':'application/json'
  }, extra||{});
}

async function _refresh(){
  const s=_sessGet(); if(!s||!s.refresh_token) return null;
  try{
    const r=await fetch(SB_URL+'/auth/v1/token?grant_type=refresh_token',{
      method:'POST', headers:{apikey:SB_KEY,'Content-Type':'application/json'},
      body:JSON.stringify({refresh_token:s.refresh_token})});
    if(!r.ok){ lolaLogout(); return null; }
    const d=await r.json();
    const ns=Object.assign({},s,{access_token:d.access_token, refresh_token:d.refresh_token,
      expires_at:Math.floor(Date.now()/1000)+(d.expires_in||3600)});
    _sessSet(ns); return ns;
  }catch(e){ return null; }
}
/* garante um token válido (renova se estiver perto de expirar) */
async function lolaEnsure(){
  let s=_sessGet(); if(!s) return null;
  const agora=Math.floor(Date.now()/1000);
  if(s.expires_at && s.expires_at-90 < agora) s=await _refresh();
  return s;
}

async function _buscarPerfil(sess){
  try{
    const r=await fetch(`${SB_URL}/rest/v1/lola_perfis?select=nome,papel&email=eq.${encodeURIComponent(sess.email)}`,
      {headers:lolaHeaders()});
    const d=await r.json();
    if(Array.isArray(d)&&d[0]){ sess.papel=d[0].papel; sess.nome=d[0].nome||sess.email; }
    else { sess.papel=null; sess.nome=sess.email; }
  }catch(e){ sess.papel=null; }
  _sessSet(sess); return sess;
}

async function lolaLogin(email,password){
  const r=await fetch(SB_URL+'/auth/v1/token?grant_type=password',{
    method:'POST', headers:{apikey:SB_KEY,'Content-Type':'application/json'},
    body:JSON.stringify({email:(email||'').trim().toLowerCase(), password})});
  const d=await r.json().catch(()=>({}));
  if(!r.ok){
    const m=(d.error_description||d.msg||d.message||'').toLowerCase();
    if(m.includes('invalid login')) throw new Error('E-mail ou senha incorretos.');
    if(m.includes('email not confirmed')) throw new Error('Este e-mail ainda não foi confirmado.');
    throw new Error(d.error_description||d.msg||d.message||'Não foi possível entrar.');
  }
  const sess={access_token:d.access_token, refresh_token:d.refresh_token,
    expires_at:Math.floor(Date.now()/1000)+(d.expires_in||3600),
    email:(d.user&&d.user.email)||(email||'').trim().toLowerCase()};
  _sessSet(sess);
  return await _buscarPerfil(sess);
}

/* ---------- tela de login (bloqueia a página até autorizar) ---------- */
function _gateCSS(){
  if(document.getElementById('lolaGateCSS')) return;
  const st=document.createElement('style'); st.id='lolaGateCSS';
  st.textContent=`
  #lolaGate{position:fixed;inset:0;background:#FBF7F1;z-index:9999;display:flex;align-items:center;justify-content:center;padding:24px;
    font-family:'Hanken Grotesk',system-ui,sans-serif;color:#2A1A17}
  #lolaGate .gb{width:100%;max-width:350px;text-align:center}
  #lolaGate .mk{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:30px;color:#A82A2A;margin-bottom:5px}
  #lolaGate .sb{font-size:13px;color:#8A7A72;margin-bottom:26px}
  #lolaGate input{width:100%;background:#fff;border:1px solid #ECE3D9;border-radius:13px;padding:14px;
    font:inherit;font-size:16px;min-height:50px;margin-bottom:10px;color:#2A1A17}
  #lolaGate button{width:100%;background:#A82A2A;color:#fff;border:0;border-radius:13px;min-height:50px;
    font:inherit;font-weight:700;font-size:14.5px;cursor:pointer;margin-top:4px}
  #lolaGate button:disabled{opacity:.6}
  #lolaGate .er{color:#B5302E;font-size:12.5px;font-weight:600;min-height:20px;margin-top:12px;line-height:1.4}
  #lolaGate .lk{display:block;margin-top:20px;color:#8A7A72;font-size:12.5px;font-weight:600;text-decoration:none}
  `;
  document.head.appendChild(st);
}

/* lolaGate({papeis:['admin'], titulo:'Financeiro'}) -> Promise<sessão> */
function lolaGate(opt){
  opt=opt||{};
  const papeis=opt.papeis||['admin','financeiro','operacional'];
  const titulo=opt.titulo||'Área administrativa';
  _gateCSS();

  return new Promise(async(resolve)=>{
    const ok=s=>s && s.papel && papeis.indexOf(s.papel)>=0;

    // já logado e autorizado?
    let s=await lolaEnsure();
    if(s && !s.papel) s=await _buscarPerfil(s);
    if(ok(s)){ resolve(s); return; }

    const semPermissao = !!(s && s.papel && papeis.indexOf(s.papel)<0);

    const g=document.createElement('div'); g.id='lolaGate';
    g.innerHTML=`<div class="gb">
      <div class="mk">Lola</div>
      <div class="sb">${titulo}</div>
      ${semPermissao
        ? `<div class="er" style="min-height:auto;margin:0 0 18px">Você entrou como <b>${s.email}</b> (${PAPEL_NOME[s.papel]||s.papel}), mas esta área não faz parte do seu acesso.</div>
           <a class="lk" href="/adm/" style="color:#A82A2A">‹ Voltar ao Administrativo</a>
           <button id="lgOut" style="background:#fff;color:#5A463E;border:1px solid #ECE3D9;margin-top:16px">Entrar com outra conta</button>`
        : `<input type="email" id="lgMail" placeholder="Seu e-mail" autocomplete="username" inputmode="email">
           <input type="password" id="lgPass" placeholder="Sua senha" autocomplete="current-password">
           <button id="lgBtn">Entrar</button>
           <div class="er" id="lgErr"></div>`}
    </div>`;
    document.body.appendChild(g);

    if(semPermissao){
      g.querySelector('#lgOut').onclick=()=>{ lolaLogout(); location.reload(); };
      return; // não resolve: fica bloqueado
    }

    const mail=g.querySelector('#lgMail'), pass=g.querySelector('#lgPass'),
          btn=g.querySelector('#lgBtn'), err=g.querySelector('#lgErr');
    const entrar=async()=>{
      err.textContent=''; btn.disabled=true; const t=btn.textContent; btn.textContent='Entrando…';
      try{
        const sess=await lolaLogin(mail.value, pass.value);
        if(!sess.papel){ throw new Error('Sua conta existe, mas ainda não tem um papel definido. Avise a Bianca.'); }
        if(papeis.indexOf(sess.papel)<0){ err.innerHTML=`Você entrou como <b>${PAPEL_NOME[sess.papel]||sess.papel}</b>, mas esta área não faz parte do seu acesso.`; btn.disabled=false; btn.textContent=t; setTimeout(()=>location.reload(),1600); return; }
        g.remove(); resolve(sess);
      }catch(e){ err.textContent=e.message; btn.disabled=false; btn.textContent=t; }
    };
    btn.onclick=entrar;
    [mail,pass].forEach(i=>i.addEventListener('keydown',e=>{ if(e.key==='Enter') entrar(); }));
    mail.focus();
  });
}
