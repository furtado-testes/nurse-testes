// EstágioCare — GitHub Pages build
// React & ReactDOM loaded via CDN in index.html
const { useState, useMemo, useEffect, useRef } = React;


// ─── storage ──────────────────────────────────────────────────────────────────
const S = {
  get: (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } },
  set: (k, v)  => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ─── utils ────────────────────────────────────────────────────────────────────
const uid      = () => Math.random().toString(36).slice(2, 9);
const today    = () => new Date().toISOString().split("T")[0];
const fmt      = d => { if (!d) return "—"; const [,m,dd] = d.split("-"); return `${dd}/${MON[+m-1]}`; };
const fmtFull  = d => { if (!d) return "—"; const [y,m,dd] = d.split("-"); return `${dd}/${m}/${y}`; };
const diff     = (a,b) => Math.max(0, Math.round((new Date(b)-new Date(a))/86400000)+1);
const clamp    = (v,a,b) => Math.min(b, Math.max(a, v));
const addDays  = (d,n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };
const toStr    = d => d instanceof Date ? d.toISOString().split("T")[0] : d;
const fmtH     = h => Number.isInteger(h) ? `${h}h` : `${h}h`;

const MON   = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const WDAY  = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const WFULL = ["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"];

const SC = { Manhã:"#FF9500", Tarde:"#5856D6", Noite:"#007AFF", Folga:"#8E8E93" };
const MC = ["","#FF3B30","#FF9500","#FFCC00","#34C759","#007AFF"];
const ML = ["","Muito difícil","Difícil","Normal","Bom","Excelente"];

const INT_COLORS = ["#007AFF","#5856D6","#34C759","#FF9500","#FF3B30","#FF2D55"];

// ─── suggested competencies by service keyword ────────────────────────────────
const SUGG_COMPS = {
  "Cirurgia": [
    { cat: "Técnica", items: ["Preparação pré-operatória","Cuidados pós-operatórios","Gestão de drenos","Pensos cirúrgicos","Algaliação vesical","Cateter venoso periférico","Terapêutica endovenosa"] },
    { cat: "Avaliação", items: ["Avaliação da dor","Monitorização de sinais vitais","Vigilância de complicações pós-op"] },
    { cat: "Relacional", items: ["Comunicação com o doente cirúrgico","Ensino pré e pós-operatório","Apoio à família"] },
    { cat: "Gestão", items: ["Registos de enfermagem","Gestão do ambiente seguro"] },
  ],
  "Urgência": [
    { cat: "Técnica", items: ["Triagem de Manchester","Cateter venoso urgente","Oxigenoterapia","Electrocardiograma","Reanimação cardiorrespiratória"] },
    { cat: "Avaliação", items: ["Avaliação primária ABCDE","Monitorização contínua","Reconhecimento do doente crítico"] },
    { cat: "Relacional", items: ["Comunicação em situação de crise","Apoio emocional ao doente/família"] },
    { cat: "Gestão", items: ["Gestão de prioridades","Documentação em urgência"] },
  ],
  "Medicina": [
    { cat: "Técnica", items: ["Administração de terapêutica oral e EV","Colheita de produtos biológicos","Cateter venoso periférico","Algaliação vesical"] },
    { cat: "Avaliação", items: ["Monitorização de sinais vitais","Avaliação do estado geral","Gestão da polimedicação"] },
    { cat: "Relacional", items: ["Comunicação com doente crónico","Articulação com equipa multidisciplinar","Educação para a saúde"] },
    { cat: "Gestão", items: ["Planeamento de cuidados","Registos de enfermagem"] },
  ],
  "Pediatria": [
    { cat: "Técnica", items: ["Terapêutica pediátrica","Punção venosa em criança","Cálculo de doses pediátricas"] },
    { cat: "Avaliação", items: ["Avaliação do desenvolvimento infantil","Avaliação da dor pediátrica","Sinais vitais pediátricos"] },
    { cat: "Relacional", items: ["Comunicação com a criança","Apoio e ensino à família/cuidadores"] },
    { cat: "Gestão", items: ["Segurança do ambiente pediátrico","Registos de enfermagem"] },
  ],
  "UCI": [
    { cat: "Técnica", items: ["Ventilação mecânica invasiva","Monitorização hemodinâmica invasiva","Gestão de perfusões contínuas","Cuidados ao doente ventilado"] },
    { cat: "Avaliação", items: ["Monitorização contínua multiparamétrica","Avaliação neurológica","Reconhecimento de deterioração clínica"] },
    { cat: "Relacional", items: ["Comunicação com família de doente crítico","Apoio emocional ao doente"] },
    { cat: "Gestão", items: ["Prevenção de infeções associadas a cuidados de saúde","Registos em cuidados intensivos"] },
  ],
  "Geral": [
    { cat: "Integração", items: ["Integração no serviço e na equipa","Conhecimento das rotinas do serviço","Controlo de infeção"] },
    { cat: "Profissional", items: ["Reflexão crítica sobre a prática","Trabalho em equipa","Gestão do tempo e prioridades"] },
  ],
};

// ─── suggested procedures by service keyword ─────────────────────────────────
const SUGG_PROCS = {
  "Cirurgia": ["Sinais vitais","Colheita de sangue","Cateter venoso periférico","Medicação EV","Medicação IM","Penso simples","Penso cirúrgico complexo","Algaliação vesical","SNG","Drenagem cirúrgica","Prep. pré-operatória","Cuidados pós-operatórios","Balanço hídrico","Glicemia capilar"],
  "Urgência": ["Triagem de Manchester","Sinais vitais","Cateter venoso periférico","Medicação EV","ECG","Oxigenoterapia","Glicemia capilar","Colheita de sangue","Algaliação vesical","Imobilização/contenção"],
  "Medicina": ["Sinais vitais","Medicação oral","Medicação EV","Medicação IM","Colheita de sangue","Cateter venoso periférico","Algaliação vesical","SNG","Oxigenoterapia","Glicemia capilar","Balanço hídrico","ECG"],
  "Pediatria": ["Sinais vitais pediátricos","Terapêutica pediátrica","Punção venosa","Glicemia capilar","Oxigenoterapia","Penso simples","Algaliação vesical","SNG pediátrica"],
  "UCI": ["Monitorização contínua","Gestão de ventilador","Gestão de perfusões","Aspiração de secreções","Cuidados ao acesso venoso central","Balanço hídrico rigoroso","Colheita de sangue arterial","Cuidados de higiene ao doente ventilado"],
  "Geral": ["Sinais vitais","Medicação EV","Medicação IM","Colheita de sangue","Cateter venoso periférico","Penso simples","Glicemia capilar","Oxigenoterapia"],
};

function getSuggestions(service) {
  const key = Object.keys(SUGG_COMPS).find(k => service?.toLowerCase().includes(k.toLowerCase())) || "Geral";
  const pKey = Object.keys(SUGG_PROCS).find(k => service?.toLowerCase().includes(k.toLowerCase())) || "Geral";
  return { comps: SUGG_COMPS[key], procs: SUGG_PROCS[pKey] };
}

// ─── css ──────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{background:#F2F2F7;color:#1C1C1E;font-family:-apple-system,'Inter',BlinkMacSystemFont,sans-serif;-webkit-font-smoothing:antialiased}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-thumb{background:#C7C7CC;border-radius:4px}
input,textarea,select,button{font-family:inherit;outline:none}
input:-webkit-autofill{-webkit-box-shadow:0 0 0 100px #fff inset!important;-webkit-text-fill-color:#1C1C1E!important}

.fade{animation:fi .18s ease both}
@keyframes fi{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
.pop{animation:pp .2s cubic-bezier(.34,1.4,.64,1) both}
@keyframes pp{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}

.page{min-height:100vh;background:#F2F2F7}

/* nav */
.nav{background:rgba(255,255,255,.95);backdrop-filter:blur(20px);border-bottom:.5px solid rgba(0,0,0,.07);height:54px;padding:0 20px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100}
.tab-bar{background:rgba(255,255,255,.95);backdrop-filter:blur(20px);border-bottom:.5px solid rgba(0,0,0,.07);padding:0 16px;display:flex;overflow-x:auto;gap:0}
.tab-btn{border:none;background:transparent;cursor:pointer;font-family:inherit;font-weight:500;font-size:13px;padding:12px 14px;white-space:nowrap;color:#8E8E93;border-bottom:2px solid transparent;transition:all .15s}
.tab-btn.on{color:#1C1C1E;border-bottom-color:#007AFF;font-weight:600}

/* cards */
.card{background:#fff;border-radius:14px;overflow:hidden}
.sh{box-shadow:0 1px 4px rgba(0,0,0,.06),0 4px 16px rgba(0,0,0,.04)}
.hov{transition:transform .15s,box-shadow .15s;cursor:pointer}
.hov:hover{transform:translateY(-2px);box-shadow:0 6px 24px rgba(0,0,0,.09)}

/* buttons */
.btn{border:none;cursor:pointer;font-family:inherit;font-weight:600;transition:opacity .15s,transform .12s}
.btn:active{transform:scale(.96);opacity:.85}
.btn-p{background:#007AFF;color:#fff;border-radius:12px;padding:11px 22px;font-size:15px}
.btn-s{background:rgba(0,122,255,.1);color:#007AFF;border-radius:12px;padding:10px 18px;font-size:14px}
.btn-g{background:transparent;border:1px solid #E5E5EA;color:#8E8E93;border-radius:10px;font-size:13px;padding:7px 14px;transition:all .15s}
.btn-g:hover{border-color:#C7C7CC;color:#1C1C1E}
.btn-r{background:rgba(255,59,48,.08);color:#FF3B30;border-radius:10px;font-size:13px;padding:7px 14px}

/* inputs */
.inp{width:100%;background:#F2F2F7;border:none;border-radius:10px;padding:11px 14px;font-size:15px;color:#1C1C1E;transition:background .15s,box-shadow .15s}
.inp:focus{background:#fff;box-shadow:0 0 0 3px rgba(0,122,255,.14)}
.inp::placeholder{color:#C7C7CC}
.inp-s{background:#F2F2F7;border:none;border-radius:8px;padding:8px 11px;font-size:14px;color:#1C1C1E;font-family:inherit;transition:background .15s,box-shadow .15s}
.inp-s:focus{background:#fff;box-shadow:0 0 0 3px rgba(0,122,255,.14);outline:none}
.inp-s::placeholder{color:#C7C7CC}

/* segmented */
.seg{background:rgba(118,118,128,.12);border-radius:9px;padding:2px;display:inline-flex}
.seg-o{border:none;background:transparent;cursor:pointer;font-family:inherit;font-size:13px;font-weight:500;padding:6px 16px;border-radius:7px;color:#1C1C1E;transition:all .18s}
.seg-o.on{background:#fff;font-weight:600;box-shadow:0 1px 3px rgba(0,0,0,.12)}

/* list */
.lcard{background:#fff;border-radius:14px;overflow:hidden}
.lrow{display:flex;align-items:center;padding:13px 16px;border-bottom:.5px solid #F2F2F7;transition:background .12s}
.lrow:last-child{border-bottom:none}
.lrow-tap{cursor:pointer}
.lrow-tap:hover{background:#F9F9F9}

/* day cell */
.dcell{border-radius:12px;border:1.5px solid #E5E5EA;background:#fff;transition:border-color .15s;cursor:pointer;overflow:hidden}
.dcell:hover{border-color:#C7C7CC}
.dcell.sel{border-color:#007AFF;box-shadow:0 0 0 2px rgba(0,122,255,.18)}
.dcell.tod{border-color:#007AFF}
.dcell.off{opacity:.2;pointer-events:none}

/* progress */
.prog{background:#E5E5EA;border-radius:99px;overflow:hidden}
.bar{border-radius:99px;transition:width .6s ease}

/* sheet/overlay */
.ov{position:fixed;inset:0;background:rgba(0,0,0,.38);z-index:500;display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(6px)}
.sheet{background:#fff;border-radius:22px 22px 0 0;padding:16px 24px 40px;max-height:94vh;overflow-y:auto;width:100%;max-width:600px;box-shadow:0 -8px 40px rgba(0,0,0,.1)}
.handle{width:36px;height:4px;background:#E5E5EA;border-radius:2px;margin:0 auto 18px}

.badge{display:inline-flex;align-items:center;font-size:11px;font-weight:600;border-radius:20px;padding:2px 9px}
.tag{display:inline-flex;font-size:12px;font-weight:500;border-radius:6px;padding:2px 8px;margin:2px}

/* suggestion chip */
.sugg{display:inline-flex;align-items:center;gap:5px;background:#F2F2F7;color:#3A3A3C;border-radius:20px;padding:5px 12px;font-size:13px;font-weight:500;cursor:pointer;border:1.5px solid transparent;transition:all .15s;border:none}
.sugg:hover{background:#E5E5EA}
.sugg.on{background:rgba(0,122,255,.1);color:#007AFF}

.step-dot{width:26px;height:26px;border-radius:99px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0}
.comp-row{display:flex;align-items:center;padding:11px 16px;border-bottom:.5px solid #F2F2F7;cursor:pointer;gap:12px;transition:background .12s}
.comp-row:last-child{border-bottom:none}
.comp-row:hover{background:#F9F9F9}
`;

// ─── root ─────────────────────────────────────────────────────────────────────
function App() {
  const [users,  setUsers]  = useState(() => S.get("ec9_u", []));
  const [ints,   setInts]   = useState(() => S.get("ec9_i", []));
  const [logs,   setLogs]   = useState(() => S.get("ec9_l", []));
  const [comps,  setComps]  = useState(() => S.get("ec9_c", {}));
  const [procs,  setProcs]  = useState(() => S.get("ec9_p", {}));
  const [sched,  setSched]  = useState(() => S.get("ec9_s", {}));
  const [user,   setUser]   = useState(null);
  const [page,   setPage]   = useState("home");
  const [active, setActive] = useState(null);
  const [notifs, setNotifs] = useState([]);

  useEffect(() => S.set("ec9_u", users),  [users]);
  useEffect(() => S.set("ec9_i", ints),   [ints]);
  useEffect(() => S.set("ec9_l", logs),   [logs]);
  useEffect(() => S.set("ec9_c", comps),  [comps]);
  useEffect(() => S.set("ec9_p", procs),  [procs]);
  useEffect(() => S.set("ec9_s", sched),  [sched]);

  useEffect(() => {
    if (!user) return;
    const ns = [];
    ints.filter(i => i.userId === user.id).forEach(i => {
      const iL = logs.filter(l => l.internshipId === i.id);
      const h  = iL.reduce((s, l) => s + l.hoursLogged, 0);
      const t  = today();
      if (t >= i.startDate && t <= i.endDate) {
        const dLeft = diff(t, i.endDate);
        const pct   = Math.round(h / i.totalHours * 100);
        if (pct < 40 && dLeft < 21) ns.push({ id: uid(), level: "high", text: `${i.name} — ${pct}% das horas com ${dLeft} dias restantes.` });
        else if (dLeft <= 5)        ns.push({ id: uid(), level: "med",  text: `${i.name} termina em ${dLeft} dia${dLeft !== 1 ? "s" : ""}.` });
        const mon = new Date(); mon.setDate(mon.getDate() - mon.getDay() + 1);
        let miss = 0;
        for (let d = 0; d < 5; d++) { const x = new Date(mon); x.setDate(mon.getDate() + d); const xd = toStr(x); if (xd >= i.startDate && xd < t && !iL.find(l => l.date === xd)) miss++; }
        if (miss > 1) ns.push({ id: uid(), level: "low", text: `${i.name} — ${miss} dias desta semana sem registo.` });
      }
    });
    setNotifs(ns);
  }, [user, ints, logs]);

  const myInts = ints.filter(i => i.userId === user?.id);
  const myLogs = logs.filter(l => l.userId === user?.id);

  const addInt = raw => {
    const id = uid();
    const { _comps, _procs, ...rest } = raw;
    setInts(p => [...p, { ...rest, id, userId: user.id }]);
    if (_comps?.length) setComps(p => ({ ...p, [id]: _comps }));
    if (_procs?.length) setProcs(p => ({ ...p, [id]: _procs }));
  };

  return (
    <>
      <style>{CSS}</style>
      {!user
        ? <Login users={users}
            onLogin={u => setUser(u)}
            onRegister={u => { const n = { ...u, id: uid() }; setUsers(p => [...p, n]); setUser(n); }} />
        : page === "profile"
          ? <ProfilePage user={user} onSave={u => { setUsers(p => p.map(x => x.id === u.id ? u : x)); setUser(u); }} onBack={() => setPage(active ? "dash" : "home")} />
          : page === "home"
            ? <Home user={user} ints={myInts} logs={myLogs} notifs={notifs}
                onOpen={i => { setActive(i); setPage("dash"); }}
                onNew={addInt}
                onLogout={() => { setUser(null); setActive(null); }}
                onProfile={() => setPage("profile")} />
            : <Dashboard user={user} int={active} logs={myLogs}
                comps={comps[active?.id] || []}
                procs={procs[active?.id] || []}
                sched={sched} notifs={notifs}
                onLog={l => setLogs(p => [...p, { ...l, id: uid(), userId: user.id, internshipId: active.id }])}
                onEdit={(id, l) => setLogs(p => p.map(x => x.id === id ? { ...x, ...l } : x))}
                onSetComps={list => setComps(p => ({ ...p, [active.id]: list }))}
                onSetProcs={list => setProcs(p => ({ ...p, [active.id]: list }))}
                onShift={(intId, d, s) => setSched(p => ({ ...p, [`${intId}_${d}`]: s }))}
                onBack={() => setPage("home")}
                onProfile={() => setPage("profile")} />
      }
    </>
  );
}

// ─── login ────────────────────────────────────────────────────────────────────
function Login({ users, onLogin, onRegister }) {
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ email: "", password: "", name: "", course: "Licenciatura em Enfermagem", year: "1º Ano" });
  const [err, setErr] = useState("");
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const login = () => {
    const u = users.find(u => u.email.trim().toLowerCase() === f.email.trim().toLowerCase() && u.password === f.password);
    u ? onLogin(u) : setErr("Email ou palavra-passe incorretos.");
  };
  const register = () => {
    if (!f.name || !f.email || !f.password) return setErr("Preenche todos os campos.");
    if (f.password.length < 6) return setErr("A palavra-passe deve ter pelo menos 6 caracteres.");
    if (users.find(u => u.email.toLowerCase() === f.email.toLowerCase())) return setErr("Já existe uma conta com este email.");
    onRegister({ name: f.name.trim(), email: f.email.trim().toLowerCase(), password: f.password, course: f.course, year: f.year, school: "", phone: "" });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F2F2F7", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="fade" style={{ width: "100%", maxWidth: 380 }}>
        {/* header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: "#007AFF", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <PulseIcon />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1C1C1E", letterSpacing: "-.6px" }}>EstágioCare</h1>
          <p style={{ fontSize: 14, color: "#8E8E93", marginTop: 5 }}>O teu diário de estágio de enfermagem</p>
        </div>

        <div className="card sh" style={{ padding: 24 }}>
          <div className="seg" style={{ width: "100%", marginBottom: 22 }}>
            {[["login","Entrar"],["register","Criar conta"]].map(([m,l]) => (
              <button key={m} className={`seg-o${mode===m?" on":""}`} style={{ flex: 1 }} onClick={() => { setMode(m); setErr(""); }}>{l}</button>
            ))}
          </div>

          {mode === "login" ? (
            <div className="fade">
              <FL label="Email"><input className="inp" type="email" value={f.email} onChange={e => set("email",e.target.value)} placeholder="o-teu@email.pt" /></FL>
              <div style={{ height: 12 }} />
              <FL label="Palavra-passe"><input className="inp" type="password" value={f.password} onChange={e => set("password",e.target.value)} placeholder="••••••••" onKeyDown={e => e.key==="Enter"&&login()} /></FL>
              <div style={{ height: 20 }} />
              {err && <ErrBox msg={err} />}
              <button className="btn btn-p" style={{ width: "100%" }} onClick={login}>Entrar</button>
            </div>
          ) : (
            <div className="fade">
              {[["name","Nome completo","text","O teu nome"],["email","Email","email","o-teu@email.pt"],["password","Palavra-passe","password","Mínimo 6 caracteres"]].map(([k,l,t,ph]) => (
                <div key={k} style={{ marginBottom: 12 }}>
                  <FL label={l}><input className="inp" type={t} value={f[k]} onChange={e => set(k,e.target.value)} placeholder={ph} /></FL>
                </div>
              ))}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                <FL label="Curso"><select className="inp" value={f.course} onChange={e => set("course",e.target.value)}><option>Licenciatura em Enfermagem</option><option>Mestrado em Enfermagem</option><option>Pós-Licenciatura</option></select></FL>
                <FL label="Ano"><select className="inp" value={f.year} onChange={e => set("year",e.target.value)}>{["1º Ano","2º Ano","3º Ano","4º Ano"].map(y=><option key={y}>{y}</option>)}</select></FL>
              </div>
              {err && <ErrBox msg={err} />}
              <button className="btn btn-p" style={{ width: "100%" }} onClick={register}>Criar Conta</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── home ─────────────────────────────────────────────────────────────────────
function Home({ user, ints, logs, notifs, onOpen, onNew, onLogout, onProfile }) {
  const [wizard, setWizard] = useState(false);
  const [showN,  setShowN]  = useState(false);

  const statusOf = i => {
    const t = today();
    if (t < i.startDate) return { label:"Futuro",    bg:"#F2F2F7",              c:"#8E8E93" };
    if (t > i.endDate)   return { label:"Concluído", bg:"rgba(52,199,89,.1)",   c:"#34C759" };
    return                      { label:"Em curso",  bg:"rgba(0,122,255,.1)",   c:"#007AFF" };
  };
  const progOf = i => {
    const h = logs.filter(l=>l.internshipId===i.id).reduce((s,l)=>s+l.hoursLogged,0);
    return { h, pct: clamp(Math.round(h/i.totalHours*100),0,100), n: logs.filter(l=>l.internshipId===i.id).length };
  };

  return (
    <div className="page">
      {/* header */}
      <header style={{ background: "#fff", borderBottom: ".5px solid rgba(0,0,0,.07)", padding: "20px 24px 0" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "#007AFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <PulseIcon size={20} />
              </div>
              <div>
                <p style={{ fontSize: 12, color: "#8E8E93", fontWeight: 500 }}>{user.course} · {user.year}</p>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1C1C1E", letterSpacing: "-.4px", lineHeight: 1.2 }}>Olá, {user.name.split(" ")[0]}</h1>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ position: "relative" }}>
                <button className="btn" onClick={() => setShowN(v=>!v)} style={{ width: 36, height: 36, borderRadius: 99, background: "#F2F2F7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BellIcon color={notifs.length>0?"#007AFF":"#8E8E93"} />
                  {notifs.length>0&&<span style={{ position:"absolute",top:4,right:4,width:7,height:7,borderRadius:99,background:"#FF3B30",border:"1.5px solid #fff" }}/>}
                </button>
                {showN && (
                  <div className="pop card sh" style={{ position:"absolute",top:"110%",right:0,minWidth:300,padding:"8px 0",zIndex:200 }}>
                    <p style={{ fontSize:11,fontWeight:700,color:"#8E8E93",letterSpacing:".8px",padding:"4px 16px 10px",textTransform:"uppercase" }}>Alertas</p>
                    {notifs.length===0
                      ? <p style={{ fontSize:13,color:"#C7C7CC",padding:"4px 16px 8px" }}>Sem alertas activos</p>
                      : notifs.map(n=>(
                        <div key={n.id} style={{ padding:"8px 16px 8px 14px",borderLeft:`3px solid ${n.level==="high"?"#FF3B30":n.level==="med"?"#FF9500":"#007AFF"}`,marginBottom:2 }}>
                          <p style={{ fontSize:13,color:n.level==="high"?"#FF3B30":n.level==="med"?"#FF9500":"#007AFF",lineHeight:1.4 }}>{n.text}</p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
              <button className="btn" onClick={onProfile} style={{ width:36,height:36,borderRadius:99,background:"#007AFF",fontSize:14,fontWeight:700,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center" }}>
                {user.name[0]}
              </button>
              <button className="btn btn-g" onClick={onLogout} style={{ fontSize:12,padding:"6px 12px" }}>Sair</button>
            </div>
          </div>

          {/* summary bar */}
          {ints.length > 0 && (
            <div style={{ display:"flex",gap:28,paddingBottom:16,borderTop:".5px solid #F2F2F7",paddingTop:16 }}>
              {[
                { l:"Estágios activos", v: ints.filter(i=>today()>=i.startDate&&today()<=i.endDate).length },
                { l:"Total de registos", v: logs.length },
                { l:"Horas registadas",  v: `${logs.reduce((s,l)=>s+l.hoursLogged,0)}h` },
              ].map(s=>(
                <div key={s.l}>
                  <p style={{ fontSize:20,fontWeight:700,color:"#1C1C1E",letterSpacing:"-.4px" }}>{s.v}</p>
                  <p style={{ fontSize:11,color:"#8E8E93",marginTop:1 }}>{s.l}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      <div style={{ maxWidth:960,margin:"0 auto",padding:"24px 20px" }}>
        {notifs.filter(n=>n.level==="high").map(n=>(
          <div key={n.id} className="card fade" style={{ padding:"11px 16px",marginBottom:10,background:"rgba(255,59,48,.05)",border:"1px solid rgba(255,59,48,.15)" }}>
            <p style={{ fontSize:13,color:"#FF3B30" }}>{n.text}</p>
          </div>
        ))}

        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18 }}>
          <p style={{ fontSize:16,fontWeight:600,color:"#1C1C1E" }}>Os teus estágios</p>
          <button className="btn btn-p" onClick={()=>setWizard(true)} style={{ fontSize:14,padding:"9px 18px" }}>Novo estágio</button>
        </div>

        {ints.length===0 ? (
          <div style={{ textAlign:"center",padding:"60px 20px" }}>
            <div style={{ width:52,height:52,borderRadius:14,background:"#E5E5EA",margin:"0 auto 14px" }}/>
            <p style={{ fontSize:16,fontWeight:600,color:"#3A3A3C" }}>Ainda sem estágios</p>
            <p style={{ fontSize:14,color:"#8E8E93",marginTop:5,marginBottom:20 }}>Cria o teu primeiro estágio para começar a registar</p>
            <button className="btn btn-p" onClick={()=>setWizard(true)}>Criar o primeiro estágio</button>
          </div>
        ) : (
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12 }}>
            {ints.map((i,ix)=>{
              const st=statusOf(i), pr=progOf(i);
              const dLeft=i.endDate>=today()?diff(today(),i.endDate):0;
              return (
                <div key={i.id} className="card sh hov fade" onClick={()=>onOpen(i)} style={{ animationDelay:`${ix*.05}s` }}>
                  <div style={{ height:3,background:i.color }}/>
                  <div style={{ padding:"16px 18px 18px" }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14 }}>
                      <div>
                        <h3 style={{ fontSize:15,fontWeight:600,color:"#1C1C1E",letterSpacing:"-.2px" }}>{i.name}</h3>
                        <p style={{ fontSize:12,color:"#8E8E93",marginTop:3 }}>{i.hospital}</p>
                        {i.service && <p style={{ fontSize:12,color:"#C7C7CC",marginTop:1 }}>{i.service}</p>}
                      </div>
                      <span className="badge" style={{ background:st.bg,color:st.c,flexShrink:0 }}>{st.label}</span>
                    </div>
                    <div style={{ marginBottom:14 }}>
                      <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,color:"#8E8E93",marginBottom:5 }}>
                        <span>Horas</span>
                        <span style={{ fontWeight:600,color:"#3A3A3C" }}>{fmtH(pr.h)} / {i.totalHours}h</span>
                      </div>
                      <div className="prog" style={{ height:4 }}><div className="bar" style={{ width:`${pr.pct}%`,height:"100%",background:i.color }}/></div>
                    </div>
                    <div style={{ display:"flex",gap:20,borderTop:".5px solid #F2F2F7",paddingTop:12 }}>
                      {[{v:pr.n,l:"registos"},{v:`${pr.pct}%`,l:"horas"},...(st.label==="Em curso"?[{v:dLeft,l:"dias",c:"#FF9500"}]:[])].map((s,j)=>(
                        <div key={j}>
                          <p style={{ fontSize:16,fontWeight:700,color:s.c||"#1C1C1E",letterSpacing:"-.3px" }}>{s.v}</p>
                          <p style={{ fontSize:11,color:"#8E8E93" }}>{s.l}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {wizard && <IntWizard onSave={d=>{onNew(d);setWizard(false);}} onClose={()=>setWizard(false)}/>}
    </div>
  );
}

// ─── wizard ───────────────────────────────────────────────────────────────────
function IntWizard({ onSave, onClose }) {
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ name:"",hospital:"",service:"",supervisor:"",startDate:"",endDate:"",totalHours:"",color:"#007AFF",objectives:[],compCats:[],customProcs:[] });
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  const dur = f.startDate&&f.endDate ? diff(f.startDate,f.endDate) : null;

  // suggestions based on service
  const sugg = useMemo(() => getSuggestions(f.service), [f.service]);

  // objectives
  const addObj  = () => set("objectives",[...f.objectives,{id:uid(),text:""}]);
  const editObj = (id,text) => set("objectives",f.objectives.map(o=>o.id===id?{...o,text}:o));
  const delObj  = id => set("objectives",f.objectives.filter(o=>o.id!==id));

  // comps
  const [compCats, setCC] = useState([]);
  useEffect(() => {
    if (step===3 && compCats.length===0 && sugg.comps.length>0) {
      setCC(sugg.comps.map(c=>({ id:uid(), name:c.cat, items:c.items.map(t=>({id:uid(),text:t,on:false})) })));
    }
  }, [step]);
  const toggleItem = (catId,itemId) => setCC(p=>p.map(c=>c.id===catId?{...c,items:c.items.map(i=>i.id===itemId?{...i,on:!i.on}:i)}:c));
  const editItem   = (catId,itemId,text) => setCC(p=>p.map(c=>c.id===catId?{...c,items:c.items.map(i=>i.id===itemId?{...i,text}:i)}:c));
  const delItem    = (catId,itemId) => setCC(p=>p.map(c=>c.id===catId?{...c,items:c.items.filter(i=>i.id!==itemId)}:c));
  const addItem    = catId => setCC(p=>p.map(c=>c.id===catId?{...c,items:[...c.items,{id:uid(),text:"",on:true}]}:c));
  const addCat     = () => setCC(p=>[...p,{id:uid(),name:"",items:[]}]);
  const delCat     = id => setCC(p=>p.filter(c=>c.id!==id));
  const editCat    = (id,name) => setCC(p=>p.map(c=>c.id===id?{...c,name}:c));
  const selectAll  = catId => setCC(p=>p.map(c=>c.id===catId?{...c,items:c.items.map(i=>({...i,on:true}))}:c));

  // procs
  const [selProcs, setSelProcs] = useState([]);
  const [procInput, setProcInput] = useState("");
  useEffect(() => {
    if (step===4) setSelProcs(sugg.procs.map(p=>({text:p,on:false})));
  }, [step]);
  const toggleProc = text => setSelProcs(p=>p.map(x=>x.text===text?{...x,on:!x.on}:x));
  const addCustomProc = () => {
    const t = procInput.trim();
    if (t && !selProcs.find(x=>x.text===t)) { setSelProcs(p=>[...p,{text:t,on:true}]); setProcInput(""); }
  };
  const removeProc = text => setSelProcs(p=>p.filter(x=>x.text!==text));

  const STEPS = ["Informação","Datas","Objetivos","Competências","Procedimentos"];
  const canNext = () => step===0?(f.name&&f.hospital):step===1?(f.startDate&&f.endDate&&f.totalHours):true;

  const finish = () => {
    const flat = compCats.flatMap(cat=>cat.items.filter(i=>i.on&&i.text.trim()).map(i=>({id:i.id,cat:cat.name||"Geral",label:i.text,status:"pendente"})));
    const pList = selProcs.filter(p=>p.on).map(p=>p.text);
    onSave({ name:f.name,hospital:f.hospital,service:f.service,supervisor:f.supervisor,startDate:f.startDate,endDate:f.endDate,totalHours:+f.totalHours,color:f.color,objectives:f.objectives.filter(o=>o.text.trim()).map(o=>o.text),_comps:flat,_procs:pList });
  };

  return (
    <div className="ov" onClick={onClose}>
      <div className="sheet pop" onClick={e=>e.stopPropagation()}>
        <div className="handle"/>
        {/* steps */}
        <div style={{ display:"flex",alignItems:"center",gap:4,marginBottom:22,overflowX:"auto",paddingBottom:2 }}>
          {STEPS.map((s,i)=>(
            <div key={i} style={{ display:"flex",alignItems:"center",gap:4,flexShrink:0 }}>
              <div className="step-dot" style={{ background:i<step?"#34C759":i===step?"#007AFF":"#E5E5EA",color:i<=step?"#fff":"#C7C7CC" }}>
                {i<step?<Ck/>:i+1}
              </div>
              {i<STEPS.length-1&&<div style={{ width:16,height:2,background:i<step?"#34C759":"#E5E5EA",borderRadius:1 }}/>}
            </div>
          ))}
        </div>

        <h2 style={{ fontSize:20,fontWeight:700,letterSpacing:"-.4px",marginBottom:5 }}>{STEPS[step]}</h2>

        {/* step 0 */}
        {step===0&&(
          <div className="fade">
            <p style={{ fontSize:13,color:"#8E8E93",marginBottom:18 }}>Informação básica sobre o estágio.</p>
            <FL label="Nome do estágio *"><input className="inp" value={f.name} onChange={e=>set("name",e.target.value)} placeholder="Ex: Cirurgia Geral, Urgência Adultos…"/></FL>
            <div style={{ height:12 }}/>
            <FL label="Hospital / Instituição *"><input className="inp" value={f.hospital} onChange={e=>set("hospital",e.target.value)} placeholder="Nome do hospital ou centro de saúde"/></FL>
            <div style={{ height:12 }}/>
            <FL label="Serviço / Unidade"><input className="inp" value={f.service} onChange={e=>set("service",e.target.value)} placeholder="Ex: Bloco Operatório, UCI, Medicina Interna…"/></FL>
            <div style={{ height:12 }}/>
            <FL label="Supervisor / Orientador"><input className="inp" value={f.supervisor} onChange={e=>set("supervisor",e.target.value)} placeholder="Nome do enfermeiro orientador"/></FL>
            <div style={{ height:16 }}/>
            <FL label="Cor">
              <div style={{ display:"flex",gap:8,marginTop:4 }}>
                {INT_COLORS.map(c=><button key={c} onClick={()=>set("color",c)} style={{ width:28,height:28,borderRadius:8,background:c,border:f.color===c?"3px solid #1C1C1E":"3px solid transparent",cursor:"pointer" }}/>)}
              </div>
            </FL>
          </div>
        )}

        {/* step 1 */}
        {step===1&&(
          <div className="fade">
            <p style={{ fontSize:13,color:"#8E8E93",marginBottom:18 }}>Período e carga horária do estágio.</p>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
              <FL label="Início *"><input className="inp" type="date" value={f.startDate} onChange={e=>set("startDate",e.target.value)}/></FL>
              <FL label="Fim *"><input className="inp" type="date" value={f.endDate} onChange={e=>set("endDate",e.target.value)}/></FL>
            </div>
            {dur&&<p style={{ fontSize:12,color:"#007AFF",marginTop:6,fontWeight:500 }}>{dur} dias de duração</p>}
            <div style={{ height:12 }}/>
            <FL label="Total de horas *"><input className="inp" type="number" value={f.totalHours} onChange={e=>set("totalHours",e.target.value)} placeholder="Ex: 420"/></FL>
            {f.totalHours&&dur&&<p style={{ fontSize:12,color:"#8E8E93",marginTop:5 }}>≈ {(+f.totalHours/dur*7).toFixed(1)}h/semana</p>}
          </div>
        )}

        {/* step 2: objectives */}
        {step===2&&(
          <div className="fade">
            <p style={{ fontSize:13,color:"#8E8E93",marginBottom:18 }}>O que queres aprender ou consolidar neste estágio? Define os teus objetivos pessoais.</p>
            {f.objectives.map((o,i)=>(
              <div key={o.id} style={{ display:"flex",gap:8,marginBottom:8,alignItems:"center" }}>
                <div style={{ width:6,height:6,borderRadius:99,background:f.color,flexShrink:0 }}/>
                <input className="inp-s" style={{ flex:1 }} value={o.text} onChange={e=>editObj(o.id,e.target.value)} placeholder={`Objetivo ${i+1}`}/>
                <button className="btn" onClick={()=>delObj(o.id)} style={{ color:"#FF3B30",background:"none",fontSize:18,padding:"0 4px" }}>×</button>
              </div>
            ))}
            <button className="btn btn-s" onClick={addObj} style={{ marginTop:8,fontSize:13,padding:"8px 14px" }}>+ Adicionar objetivo</button>
            {f.objectives.length===0&&<p style={{ fontSize:12,color:"#C7C7CC",marginTop:12 }}>Podes saltar e preencher mais tarde nas Definições.</p>}
          </div>
        )}

        {/* step 3: competencies */}
        {step===3&&(
          <div className="fade">
            <p style={{ fontSize:13,color:"#8E8E93",marginBottom:6 }}>
              Sugerimos algumas competências com base no teu serviço. Seleciona as que se aplicam, edita ou adiciona as tuas.
            </p>
            {f.service&&<p style={{ fontSize:12,fontWeight:600,color:"#007AFF",marginBottom:14 }}>Sugestões para: {f.service}</p>}
            {compCats.map(cat=>(
              <div key={cat.id} style={{ marginBottom:14,background:"#F9F9F9",borderRadius:12,padding:"12px 14px" }}>
                <div style={{ display:"flex",gap:8,alignItems:"center",marginBottom:10 }}>
                  <input className="inp-s" style={{ flex:1,fontWeight:600,background:"transparent" }} value={cat.name} onChange={e=>editCat(cat.id,e.target.value)} placeholder="Categoria"/>
                  <button className="btn" onClick={()=>selectAll(cat.id)} style={{ fontSize:12,color:"#007AFF",background:"none",fontWeight:600 }}>Selec. todas</button>
                  <button className="btn" onClick={()=>delCat(cat.id)} style={{ color:"#FF3B30",background:"none",fontSize:17,padding:"0 2px" }}>×</button>
                </div>
                <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                  {cat.items.map(item=>(
                    <button key={item.id} className={`sugg${item.on?" on":""}`} style={{ background:item.on?"rgba(0,122,255,.1)":"#fff",color:item.on?"#007AFF":"#3A3A3C",border:`1px solid ${item.on?"#007AFF":"#E5E5EA"}`,borderRadius:20,padding:"5px 12px",fontSize:13,fontWeight:item.on?600:400,cursor:"pointer",transition:"all .15s",display:"inline-flex",alignItems:"center",gap:5 }}
                      onClick={()=>toggleItem(cat.id,item.id)}>
                      {item.on&&<Ck size={10} color="#007AFF"/>} {item.text}
                    </button>
                  ))}
                </div>
                <button className="btn" onClick={()=>addItem(cat.id)} style={{ color:"#007AFF",background:"none",fontSize:12,padding:"6px 4px",marginTop:6 }}>+ Adicionar competência</button>
              </div>
            ))}
            <button className="btn btn-s" onClick={addCat} style={{ fontSize:13,padding:"8px 14px" }}>+ Nova categoria</button>
          </div>
        )}

        {/* step 4: procedures */}
        {step===4&&(
          <div className="fade">
            <p style={{ fontSize:13,color:"#8E8E93",marginBottom:6 }}>Que procedimentos vais registar? Seleciona os mais comuns para o teu estágio ou adiciona os teus.</p>
            {f.service&&<p style={{ fontSize:12,fontWeight:600,color:"#007AFF",marginBottom:14 }}>Sugestões para: {f.service}</p>}
            <div style={{ display:"flex",flexWrap:"wrap",gap:6,marginBottom:16 }}>
              {selProcs.map(p=>(
                <button key={p.text} style={{ background:p.on?"rgba(0,122,255,.1)":"#F2F2F7",color:p.on?"#007AFF":"#3A3A3C",border:`1px solid ${p.on?"#007AFF":"transparent"}`,borderRadius:20,padding:"6px 14px",fontSize:13,fontWeight:p.on?600:400,cursor:"pointer",transition:"all .15s",display:"inline-flex",alignItems:"center",gap:5,fontFamily:"inherit" }}
                  onClick={()=>toggleProc(p.text)}>
                  {p.on&&<Ck size={10} color="#007AFF"/>} {p.text}
                </button>
              ))}
            </div>
            <div style={{ display:"flex",gap:8 }}>
              <input className="inp" style={{ flex:1 }} value={procInput} onChange={e=>setProcInput(e.target.value)} placeholder="Adicionar outro procedimento…" onKeyDown={e=>e.key==="Enter"&&addCustomProc()}/>
              <button className="btn btn-p" onClick={addCustomProc} style={{ padding:"11px 16px",fontSize:14,flexShrink:0 }}>Adicionar</button>
            </div>
            <p style={{ fontSize:12,color:"#8E8E93",marginTop:10 }}>{selProcs.filter(p=>p.on).length} procedimentos selecionados</p>
          </div>
        )}

        <div style={{ display:"flex",gap:10,marginTop:26 }}>
          {step>0&&<button className="btn btn-g" onClick={()=>setStep(s=>s-1)} style={{ flex:1,padding:13,borderRadius:12 }}>Anterior</button>}
          {step<STEPS.length-1
            ? <button className="btn btn-p" onClick={()=>canNext()&&setStep(s=>s+1)} style={{ flex:2,padding:13,opacity:canNext()?1:.4 }}>Continuar</button>
            : <button className="btn btn-p" onClick={finish} style={{ flex:2,padding:13 }}>Criar Estágio</button>
          }
        </div>
        {step>=2&&<button className="btn" onClick={()=>step<STEPS.length-1?setStep(s=>s+1):finish()} style={{ width:"100%",marginTop:10,color:"#8E8E93",background:"none",fontSize:13,padding:"8px" }}>Saltar este passo</button>}
      </div>
    </div>
  );
}

// ─── profile ──────────────────────────────────────────────────────────────────
function ProfilePage({ user, onSave, onBack }) {
  const [f, setF] = useState({...user});
  const [saved, setSaved] = useState(false);
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  const save = () => { onSave(f); setSaved(true); setTimeout(()=>setSaved(false),2000); };

  return (
    <div className="page">
      <nav className="nav">
        <button className="btn" onClick={onBack} style={{ fontSize:15,color:"#007AFF",background:"none",padding:0 }}>Voltar</button>
        <span style={{ fontSize:16,fontWeight:600 }}>Perfil</span>
        <button className="btn" onClick={save} style={{ fontSize:15,color:saved?"#34C759":"#007AFF",background:"none",fontWeight:600 }}>{saved?"Guardado":"Guardar"}</button>
      </nav>
      <div style={{ maxWidth:520,margin:"0 auto",padding:"28px 20px" }}>
        <div style={{ textAlign:"center",marginBottom:28 }}>
          <div style={{ width:68,height:68,borderRadius:99,background:"#007AFF",margin:"0 auto 10px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:700,color:"#fff" }}>{f.name[0]}</div>
          <p style={{ fontSize:16,fontWeight:600 }}>{f.name}</p>
          <p style={{ fontSize:13,color:"#8E8E93" }}>{f.email}</p>
        </div>
        {[
          { title:"Pessoal", rows:[["name","Nome","text",""],["email","Email","email",""],["phone","Telemóvel","tel","+351 9XX XXX XXX"]] },
          { title:"Académico", rows:[["school","Escola","text","Escola Superior de Enfermagem"]] },
          { title:"Segurança", rows:[["_pw","Nova palavra-passe","password","Deixa vazio para não alterar"]] },
        ].map(sec=>(
          <div key={sec.title} style={{ marginBottom:20 }}>
            <p style={{ fontSize:12,fontWeight:600,color:"#8E8E93",textTransform:"uppercase",letterSpacing:".6px",marginBottom:7,paddingLeft:4 }}>{sec.title}</p>
            <div className="lcard sh">
              {sec.rows.map(([k,l,t,ph],i)=>(
                <div key={k} style={{ padding:"11px 16px",borderBottom:i<sec.rows.length-1?".5px solid #F2F2F7":"none" }}>
                  <p style={{ fontSize:11,color:"#8E8E93",marginBottom:2 }}>{l}</p>
                  <input style={{ background:"transparent",border:"none",fontSize:15,color:"#1C1C1E",width:"100%",outline:"none",fontFamily:"inherit" }} type={t} value={t==="password"?"":(f[k]||"")} placeholder={ph} onChange={e=>k==="_pw"?(e.target.value&&set("password",e.target.value)):set(k,e.target.value)}/>
                </div>
              ))}
              {sec.title==="Académico"&&(
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",borderTop:".5px solid #F2F2F7" }}>
                  {[["course","Curso",["Licenciatura em Enfermagem","Mestrado em Enfermagem","Pós-Licenciatura"]],["year","Ano",["1º Ano","2º Ano","3º Ano","4º Ano"]]].map(([k,l,opts],i)=>(
                    <div key={k} style={{ padding:"11px 16px",borderRight:i===0?".5px solid #F2F2F7":"none" }}>
                      <p style={{ fontSize:11,color:"#8E8E93",marginBottom:2 }}>{l}</p>
                      <select style={{ background:"transparent",border:"none",fontSize:15,color:"#1C1C1E",width:"100%",outline:"none",fontFamily:"inherit" }} value={f[k]} onChange={e=>set(k,e.target.value)}>
                        {opts.map(o=><option key={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ user, int, logs: all, comps, procs, sched, notifs, onLog, onEdit, onSetComps, onSetProcs, onShift, onBack, onProfile }) {
  const [tab, setTab] = useState("week");
  const [wOff, setWOff] = useState(0);
  const [sel, setSel]   = useState(today());
  const swX = useRef(null);

  const iLogs  = all.filter(l=>l.internshipId===int.id);
  const logMap = useMemo(()=>Object.fromEntries(iLogs.map(l=>[l.date,l])),[iLogs]);
  const getShift = d => sched[`${int.id}_${typeof d === "string" ? d : toStr(d)}`] || "";
  const inR = d => { const s = typeof d === "string" ? d : toStr(d); return s >= int.startDate && s <= int.endDate; };

  const weekDays = useMemo(()=>{
    const n=new Date(), dow=n.getDay(), m=new Date(n);
    m.setDate(n.getDate()-dow+1+wOff*7);
    return Array.from({length:7},(_,i)=>addDays(m,i));
  },[wOff]);

  const onTS = e => { swX.current=e.touches[0].clientX; };
  const onTE = e => { if(!swX.current)return; const dx=e.changedTouches[0].clientX-swX.current; if(Math.abs(dx)>50)setWOff(o=>o+(dx<0?1:-1)); swX.current=null; };

  const hLog  = iLogs.reduce((s,l)=>s+l.hoursLogged,0);
  const hLeft = Math.max(0,int.totalHours-hLog);
  const hPct  = clamp(Math.round(hLog/int.totalHours*100),0,100);
  const dTot  = diff(int.startDate,int.endDate);
  const dEl   = clamp(diff(int.startDate,today()),0,dTot);
  const tPct  = Math.round(dEl/dTot*100);
  const allP  = iLogs.flatMap(l=>l.procedures);
  const pCnt  = allP.reduce((a,p)=>({...a,[p]:(a[p]||0)+1}),{});
  const topP  = Object.entries(pCnt).sort((a,b)=>b[1]-a[1]);
  const avgM  = iLogs.length?iLogs.reduce((s,l)=>s+l.mood,0)/iLogs.length:null;
  const cDone = comps.filter(c=>c.status==="concluido").length;
  const cPct  = comps.length?Math.round(cDone/comps.length*100):0;

  const wkH = useMemo(()=>{
    const map={};
    iLogs.forEach(l=>{const d=new Date(l.date+"T12:00:00"),w=new Date(d);w.setDate(d.getDate()-d.getDay()+1);const k=toStr(w);map[k]=(map[k]||0)+l.hoursLogged;});
    return Object.entries(map).sort((a,b)=>a[0].localeCompare(b[0])).slice(-8);
  },[iLogs]);

  const iNotifs = notifs.filter(n=>n.text.startsWith(int.name));

  return (
    <div className="page">
      <nav className="nav">
        <button className="btn" onClick={onBack} style={{ fontSize:15,color:"#007AFF",background:"none",padding:0 }}>← Estágios</button>
        <div style={{ textAlign:"center" }}>
          <p style={{ fontSize:15,fontWeight:600,color:"#1C1C1E" }}>{int.name}</p>
          <p style={{ fontSize:11,color:"#8E8E93" }}>{int.hospital}</p>
        </div>
        <button className="btn" onClick={onProfile} style={{ width:32,height:32,borderRadius:99,background:"#007AFF",fontSize:13,fontWeight:700,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center" }}>{user.name[0]}</button>
      </nav>

      {/* progress bar */}
      <div style={{ background:"#fff",borderBottom:".5px solid rgba(0,0,0,.06)",padding:"10px 20px",display:"flex",gap:20,alignItems:"center" }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,color:"#8E8E93",marginBottom:5 }}>
            <span>Horas</span><span style={{ color:int.color,fontWeight:600 }}>{fmtH(hLog)} / {int.totalHours}h · {hPct}%</span>
          </div>
          <div className="prog" style={{ height:4 }}><div className="bar" style={{ width:`${hPct}%`,height:"100%",background:int.color }}/></div>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,color:"#8E8E93",marginBottom:5 }}>
            <span>Tempo decorrido</span><span style={{ fontWeight:600 }}>{tPct}%</span>
          </div>
          <div className="prog" style={{ height:4 }}><div className="bar" style={{ width:`${tPct}%`,height:"100%",background:"#C7C7CC" }}/></div>
        </div>
        <button className="btn btn-p" onClick={()=>{setSel(today());setTab("week");}} style={{ fontSize:13,padding:"8px 16px",flexShrink:0 }}>Registar</button>
      </div>

      {iNotifs.map(n=>(
        <div key={n.id} style={{ padding:"8px 20px",background:n.level==="high"?"rgba(255,59,48,.05)":"rgba(255,149,0,.05)",borderBottom:`.5px solid ${n.level==="high"?"rgba(255,59,48,.1)":"rgba(255,149,0,.1)"}`,fontSize:13,color:n.level==="high"?"#FF3B30":"#FF9500" }}>
          {n.text}
        </div>
      ))}

      <div className="tab-bar">
        {[{id:"week",l:"Semana"},{id:"diary",l:"Diário"},{id:"analysis",l:"Análise"},{id:"comps",l:`Competências${comps.length?` · ${cPct}%`:""}`},{id:"settings",l:"Definições"}].map(t=>(
          <button key={t.id} className={`tab-btn${tab===t.id?" on":""}`} onClick={()=>setTab(t.id)}>{t.l}</button>
        ))}
      </div>

      {/* ── WEEK ── */}
      {tab==="week"&&(
        <div style={{ maxWidth:1040,margin:"0 auto",padding:"20px 16px" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
            <div style={{ display:"flex",alignItems:"center",gap:6 }}>
              <button className="btn btn-g" onClick={()=>setWOff(o=>o-1)} style={{ width:32,height:32,padding:0,display:"flex",alignItems:"center",justifyContent:"center" }}><Ch dir="left"/></button>
              <span style={{ fontSize:14,fontWeight:600,minWidth:200,textAlign:"center" }}>{fmt(toStr(weekDays[0]))} — {fmt(toStr(weekDays[6]))}</span>
              <button className="btn btn-g" onClick={()=>setWOff(o=>o+1)} style={{ width:32,height:32,padding:0,display:"flex",alignItems:"center",justifyContent:"center" }}><Ch dir="right"/></button>
              {wOff!==0&&<button className="btn btn-g" onClick={()=>{setWOff(0);setSel(today());}} style={{ padding:"4px 12px",fontSize:12 }}>Hoje</button>}
            </div>
            <span style={{ fontSize:12,color:"#8E8E93" }}>{weekDays.filter(d=>inR(d)&&logMap[toStr(d)]).length}/{weekDays.filter(d=>inR(d)).length} registados</span>
          </div>

          <div onTouchStart={onTS} onTouchEnd={onTE} style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8,marginBottom:16 }}>
            {weekDays.map(date=>{
              const d=toStr(date), log=logMap[d], shift=getShift(d);
              const isT=d===today(), isSel=d===sel, inRange=inR(date), isPast=d<today();
              return (
                <div key={d} className={`dcell${isSel?" sel":""}${isT?" tod":""}${!inRange?" off":""}`} onClick={()=>inRange&&setSel(d)}>
                  <div style={{ padding:"8px 9px 6px",background:isSel?int.color:isT?"rgba(0,122,255,.06)":"#FAFAFA",borderBottom:".5px solid #F2F2F7" }}>
                    <p style={{ fontSize:9,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",color:isSel?"rgba(255,255,255,.6)":isT?int.color:"#C7C7CC" }}>{WDAY[date.getDay()]}</p>
                    <p style={{ fontSize:20,fontWeight:700,lineHeight:1.1,color:isSel?"#fff":"#1C1C1E" }}>{date.getDate()}</p>
                  </div>
                  <div style={{ padding:"7px 8px 8px",minHeight:72 }}>
                    <ShiftPill date={d} current={shift} intId={int.id} onSet={onShift}/>
                    {log?(
                      <div style={{ marginTop:5 }}>
                        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3 }}>
                          <div style={{ width:8,height:8,borderRadius:99,background:MC[log.mood] }}/>
                          <span style={{ fontSize:10,fontWeight:600,color:"#8E8E93" }}>{fmtH(log.hoursLogged)}</span>
                        </div>
                        <p style={{ fontSize:9,color:"#8E8E93",lineHeight:1.4 }}>{log.procedures.slice(0,2).join(", ")}{log.procedures.length>2?` +${log.procedures.length-2}`:""}</p>
                      </div>
                    ):inRange&&isPast?<p style={{ fontSize:9,color:"#C7C7CC",marginTop:5 }}>Sem registo</p>:null}
                  </div>
                </div>
              );
            })}
          </div>

          {sel&&inR(new Date(sel+"T12:00:00"))&&(
            <DayEditor key={sel} date={sel} int={int} log={logMap[sel]} shift={getShift(sel)} procs={procs}
              onSave={l=>logMap[sel]?onEdit(logMap[sel].id,l):onLog(l)}
              onShift={s=>onShift(int.id,sel,s)}/>
          )}
        </div>
      )}

      {/* ── DIARY ── */}
      {tab==="diary"&&(
        <div style={{ maxWidth:680,margin:"0 auto",padding:"24px 20px" }}>
          <h2 style={{ fontSize:22,fontWeight:700,letterSpacing:"-.5px",marginBottom:18 }}>Diário</h2>
          {iLogs.length===0?(
            <div style={{ textAlign:"center",padding:"60px 0" }}>
              <p style={{ fontSize:16,fontWeight:600,color:"#3A3A3C" }}>Sem registos</p>
              <p style={{ fontSize:13,color:"#8E8E93",marginTop:5 }}>Vai à Semana e seleciona um dia</p>
            </div>
          ):[...iLogs].sort((a,b)=>b.date.localeCompare(a.date)).map((l,i)=>{
            const sc=SC[l.shift]||"#8E8E93";
            return (
              <div key={l.id} className="card sh fade" style={{ marginBottom:10,cursor:"pointer",animationDelay:`${i*.04}s` }} onClick={()=>{setSel(l.date);setTab("week");}} onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,.09)"} onMouseLeave={e=>e.currentTarget.style.boxShadow=""}>
                <div style={{ display:"flex",gap:14,padding:"14px 16px" }}>
                  <div style={{ minWidth:44,borderRight:`2px solid ${sc}`,paddingRight:12,textAlign:"center" }}>
                    <p style={{ fontSize:20,fontWeight:700,lineHeight:1 }}>{l.date.split("-")[2]}</p>
                    <p style={{ fontSize:9,fontWeight:700,color:"#8E8E93",letterSpacing:".5px" }}>{MON[+l.date.split("-")[1]-1].toUpperCase()}</p>
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6 }}>
                      <div style={{ display:"flex",gap:5 }}>
                        {l.shift&&<span className="badge" style={{ background:`${sc}15`,color:sc }}>{l.shift}</span>}
                        <span className="badge" style={{ background:"#F2F2F7",color:"#3A3A3C" }}>{fmtH(l.hoursLogged)}</span>
                        <span className="badge" style={{ background:"#F2F2F7",color:"#3A3A3C" }}>{l.patients} doentes</span>
                      </div>
                      <div style={{ width:10,height:10,borderRadius:99,background:MC[l.mood],marginTop:2 }}/>
                    </div>
                    <div style={{ marginBottom:l.reflection?5:0 }}>{l.procedures.map(p=><span key={p} className="tag" style={{ background:"rgba(0,122,255,.08)",color:"#007AFF" }}>{p}</span>)}</div>
                    {l.reflection&&<p style={{ fontSize:12,color:"#8E8E93",lineHeight:1.5,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:1,WebkitBoxOrient:"vertical" }}>{l.reflection}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── ANALYSIS ── */}
      {tab==="analysis"&&(
        <div style={{ maxWidth:900,margin:"0 auto",padding:"24px 20px" }}>
          <h2 style={{ fontSize:22,fontWeight:700,letterSpacing:"-.5px",marginBottom:18 }}>Análise</h2>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16 }}>
            {[
              {l:"Horas feitas",v:`${fmtH(hLog)}`,s:`faltam ${fmtH(hLeft)}`,p:hPct,c:int.color},
              {l:"Tempo",v:`${tPct}%`,s:`${Math.max(0,dTot-dEl)} dias`,p:tPct,c:"#8E8E93"},
              {l:"Competências",v:comps.length?`${cPct}%`:"—",s:comps.length?`${cDone}/${comps.length}`:"Não definidas",p:cPct,c:"#34C759"},
              {l:"Bem-estar médio",v:avgM?`${avgM.toFixed(1)}/5`:"—",s:avgM?ML[Math.round(avgM)]:"sem dados",p:avgM?avgM/5*100:0,c:MC[Math.round(avgM)]||"#C7C7CC"},
            ].map((s,i)=>(
              <div key={i} className="card sh" style={{ padding:"16px 18px" }}>
                <p style={{ fontSize:11,fontWeight:600,color:"#8E8E93",textTransform:"uppercase",letterSpacing:".8px",marginBottom:7 }}>{s.l}</p>
                <p style={{ fontSize:26,fontWeight:700,color:s.c,letterSpacing:"-.5px" }}>{s.v}</p>
                <p style={{ fontSize:11,color:"#8E8E93",marginTop:4,marginBottom:10 }}>{s.s}</p>
                <div className="prog" style={{ height:3 }}><div className="bar" style={{ width:`${s.p}%`,height:"100%",background:s.c }}/></div>
              </div>
            ))}
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14 }}>
            <div className="card sh" style={{ padding:20 }}>
              <p style={{ fontSize:15,fontWeight:600,marginBottom:3 }}>Horas por semana</p>
              <p style={{ fontSize:12,color:"#8E8E93",marginBottom:16 }}>Evolução temporal</p>
              {wkH.length===0?<p style={{ fontSize:13,color:"#C7C7CC" }}>Sem dados</p>:(()=>{
                const max=Math.max(...wkH.map(([,v])=>v),1);
                return (
                  <div style={{ display:"flex",alignItems:"flex-end",gap:6,height:100 }}>
                    {wkH.map(([w,h])=>(
                      <div key={w} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,height:"100%",justifyContent:"flex-end" }}>
                        <span style={{ fontSize:9,color:"#8E8E93",fontWeight:600 }}>{fmtH(h)}</span>
                        <div style={{ width:"100%",height:`${(h/max)*84}px`,background:int.color,borderRadius:"4px 4px 0 0",minHeight:4,opacity:.85 }}/>
                        <span style={{ fontSize:8,color:"#C7C7CC" }}>{MON[+w.split("-")[1]-1]}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
            <div className="card sh" style={{ padding:20 }}>
              <p style={{ fontSize:15,fontWeight:600,marginBottom:3 }}>Bem-estar</p>
              <p style={{ fontSize:12,color:"#8E8E93",marginBottom:16 }}>Evolução ao longo do tempo</p>
              {iLogs.length===0?<p style={{ fontSize:13,color:"#C7C7CC" }}>Sem dados</p>:(()=>{
                const sorted=[...iLogs].sort((a,b)=>a.date.localeCompare(b.date)), H=90;
                return (
                  <div style={{ position:"relative",height:H+20 }}>
                    {[1,2,3,4,5].map(v=><div key={v} style={{ position:"absolute",left:18,right:0,top:`${((5-v)/5)*H}px`,borderTop:".5px solid #F2F2F7" }}><span style={{ fontSize:8,color:"#E5E5EA" }}>{v}</span></div>)}
                    <svg style={{ position:"absolute",top:0,left:18,width:"calc(100% - 18px)",height:H }} preserveAspectRatio="none">
                      <polyline points={sorted.map((l,i)=>`${(i/(sorted.length-1||1))*100}%,${((5-l.mood)/5)*H}`).join(" ")} fill="none" stroke={int.color} strokeWidth="2" strokeLinejoin="round" strokeOpacity=".4"/>
                      {sorted.map((l,i)=><circle key={l.id} cx={`${(i/(sorted.length-1||1))*100}%`} cy={(5-l.mood)/5*H} r="5" fill={MC[l.mood]} stroke="#fff" strokeWidth="2"/>)}
                    </svg>
                  </div>
                );
              })()}
            </div>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
            <div className="card sh" style={{ padding:20 }}>
              <p style={{ fontSize:15,fontWeight:600,marginBottom:14 }}>Top Procedimentos</p>
              {topP.length===0?<p style={{ fontSize:13,color:"#C7C7CC" }}>Sem dados{!procs.length?" — define procedimentos nas Definições":""}</p>:
                topP.slice(0,7).map(([p,c])=>(
                  <div key={p} style={{ marginBottom:10 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4 }}>
                      <span style={{ color:"#3A3A3C" }}>{p}</span>
                      <span style={{ fontWeight:700,color:int.color }}>{c}×</span>
                    </div>
                    <div className="prog" style={{ height:3 }}><div className="bar" style={{ width:`${c/topP[0][1]*100}%`,height:"100%",background:int.color }}/></div>
                  </div>
                ))
              }
            </div>
            <div className="card sh" style={{ padding:20 }}>
              <p style={{ fontSize:15,fontWeight:600,marginBottom:14 }}>Resumo</p>
              {[{l:"Horas feitas",v:fmtH(hLog),c:int.color},{l:"Horas em falta",v:fmtH(hLeft),c:"#FF3B30"},{l:"Dias de estágio",v:dEl,c:"#8E8E93"},{l:"Procedimentos",v:allP.length,c:"#34C759"},{l:"Doentes",v:iLogs.reduce((s,l)=>s+l.patients,0),c:"#FF9500"}].map(r=>(
                <div key={r.l} style={{ display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:".5px solid #F2F2F7" }}>
                  <span style={{ fontSize:14,color:"#3A3A3C" }}>{r.l}</span>
                  <span style={{ fontSize:15,fontWeight:700,color:r.c }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── COMPS ── */}
      {tab==="comps"&&(
        <div style={{ maxWidth:680,margin:"0 auto",padding:"24px 20px" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:18 }}>
            <div>
              <h2 style={{ fontSize:22,fontWeight:700,letterSpacing:"-.5px" }}>Competências</h2>
              {comps.length>0&&<p style={{ fontSize:13,color:"#8E8E93",marginTop:2 }}>{comps.length} competências</p>}
            </div>
            {comps.length>0&&<p style={{ fontSize:28,fontWeight:700,color:int.color,letterSpacing:"-.5px" }}>{cPct}%</p>}
          </div>
          {comps.length===0?(
            <div style={{ textAlign:"center",padding:"50px 0" }}>
              <p style={{ fontSize:16,fontWeight:600,color:"#3A3A3C" }}>Sem competências definidas</p>
              <p style={{ fontSize:13,color:"#8E8E93",marginTop:6,marginBottom:20 }}>Vai às Definições para criar ou importar competências</p>
              <button className="btn btn-s" onClick={()=>setTab("settings")}>Ir para Definições</button>
            </div>
          ):(
            <>
              <div className="card sh" style={{ padding:"14px 18px",marginBottom:16 }}>
                <div style={{ display:"flex",gap:16,marginBottom:10 }}>
                  {[{l:"Concluído",k:"concluido",c:"#34C759"},{l:"Em progresso",k:"em_progresso",c:"#FF9500"},{l:"Pendente",k:"pendente",c:"#E5E5EA"}].map(s=>(
                    <div key={s.k} style={{ display:"flex",alignItems:"center",gap:5 }}>
                      <div style={{ width:8,height:8,borderRadius:99,background:s.c }}/>
                      <span style={{ fontSize:12,color:"#8E8E93" }}>{s.l}</span>
                      <span style={{ fontSize:13,fontWeight:700 }}>{comps.filter(c=>c.status===s.k).length}</span>
                    </div>
                  ))}
                </div>
                <div className="prog" style={{ height:5 }}>
                  <div style={{ height:"100%",display:"flex",borderRadius:99,overflow:"hidden" }}>
                    <div style={{ width:`${Math.round(comps.filter(c=>c.status==="concluido").length/comps.length*100)}%`,background:"#34C759",transition:"width .6s" }}/>
                    <div style={{ width:`${Math.round(comps.filter(c=>c.status==="em_progresso").length/comps.length*100)}%`,background:"#FF9500",transition:"width .6s" }}/>
                  </div>
                </div>
              </div>
              {Object.entries(comps.reduce((a,c)=>{if(!a[c.cat])a[c.cat]=[];a[c.cat].push(c);return a;},{})).map(([cat,items])=>(
                <div key={cat} style={{ marginBottom:14 }}>
                  <p style={{ fontSize:11,fontWeight:700,color:"#8E8E93",textTransform:"uppercase",letterSpacing:".8px",marginBottom:6,paddingLeft:2 }}>{cat}</p>
                  <div className="lcard sh">
                    {items.map((c,i)=>{
                      const next=c.status==="pendente"?"em_progresso":c.status==="em_progresso"?"concluido":"pendente";
                      return (
                        <div key={c.id} className="comp-row" style={{ borderBottom:i<items.length-1?".5px solid #F2F2F7":"none" }} onClick={()=>onSetComps(comps.map(x=>x.id===c.id?{...x,status:next}:x))}>
                          <div style={{ width:22,height:22,borderRadius:99,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:c.status==="concluido"?"#34C759":c.status==="em_progresso"?"#FF9500":"#E5E5EA" }}>
                            {c.status==="concluido"&&<Ck/>}
                            {c.status==="em_progresso"&&<div style={{ width:7,height:7,borderRadius:99,background:"#fff" }}/>}
                          </div>
                          <span style={{ fontSize:14,flex:1,color:c.status==="concluido"?"#C7C7CC":"#1C1C1E",textDecoration:c.status==="concluido"?"line-through":"none" }}>{c.label}</span>
                          <span style={{ fontSize:12,color:c.status==="concluido"?"#34C759":c.status==="em_progresso"?"#FF9500":"transparent",fontWeight:500 }}>
                            {c.status==="concluido"?"Concluído":c.status==="em_progresso"?"Em progresso":""}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {tab==="settings"&&<SettingsTab int={int} comps={comps} procs={procs} onSetComps={onSetComps} onSetProcs={onSetProcs}/>}
    </div>
  );
}

// ─── settings tab ─────────────────────────────────────────────────────────────
function SettingsTab({ int, comps, procs, onSetComps, onSetProcs }) {
  const [cats, setCats] = useState(()=>{
    const g=comps.reduce((a,c)=>{if(!a[c.cat])a[c.cat]=[];a[c.cat].push({id:c.id,text:c.label,status:c.status});return a;},{});
    return Object.entries(g).map(([name,items])=>({id:uid(),name,items}));
  });
  const [pi, setPi] = useState("");
  const [lp, setLp] = useState(procs);
  const [sv, setSv] = useState("");
  const [showSugg, setShowSugg] = useState(false);

  const sugg = useMemo(()=>getSuggestions(int.service),[int.service]);

  const savC = () => { const f=cats.flatMap(c=>c.items.filter(i=>i.text.trim()).map(i=>({id:i.id,cat:c.name||"Geral",label:i.text,status:i.status||"pendente"}))); onSetComps(f); setSv("c"); setTimeout(()=>setSv(""),2000); };
  const savP = () => { onSetProcs(lp); setSv("p"); setTimeout(()=>setSv(""),2000); };

  const addCat  = () => setCats(p=>[...p,{id:uid(),name:"",items:[]}]);
  const editCat = (id,n) => setCats(p=>p.map(c=>c.id===id?{...c,name:n}:c));
  const delCat  = id => setCats(p=>p.filter(c=>c.id!==id));
  const addItem = catId => setCats(p=>p.map(c=>c.id===catId?{...c,items:[...c.items,{id:uid(),text:"",status:"pendente"}]}:c));
  const editItm = (catId,iid,t) => setCats(p=>p.map(c=>c.id===catId?{...c,items:c.items.map(i=>i.id===iid?{...i,text:t}:i)}:c));
  const delItm  = (catId,iid) => setCats(p=>p.map(c=>c.id===catId?{...c,items:c.items.filter(i=>i.id!==iid)}:c));

  const importSugg = () => {
    const newCats = sugg.comps.map(c=>({id:uid(),name:c.cat,items:c.items.map(t=>({id:uid(),text:t,status:"pendente"}))}));
    setCats(p=>[...p,...newCats]); setShowSugg(false);
  };

  const addProc = () => { const t=pi.trim(); if(t&&!lp.includes(t)){setLp(p=>[...p,t]);setPi("");} };

  return (
    <div style={{ maxWidth:680,margin:"0 auto",padding:"24px 20px" }}>
      <h2 style={{ fontSize:22,fontWeight:700,letterSpacing:"-.5px",marginBottom:4 }}>Definições</h2>
      <p style={{ fontSize:13,color:"#8E8E93",marginBottom:24 }}>{int.name} · {int.hospital}</p>

      {/* info */}
      <p style={{ fontSize:12,fontWeight:600,color:"#8E8E93",textTransform:"uppercase",letterSpacing:".6px",marginBottom:7,paddingLeft:2 }}>Informação do estágio</p>
      <div className="lcard sh" style={{ marginBottom:26 }}>
        {[["Serviço",int.service],["Supervisor",int.supervisor],["Início",fmtFull(int.startDate)],["Fim",fmtFull(int.endDate)],["Total horas",`${int.totalHours}h`]].filter(([,v])=>v).map(([l,v])=>(
          <div key={l} className="lrow" style={{ justifyContent:"space-between" }}>
            <span style={{ fontSize:14,color:"#8E8E93" }}>{l}</span>
            <span style={{ fontSize:14,fontWeight:500 }}>{v}</span>
          </div>
        ))}
        {int.objectives?.length>0&&(
          <div className="lrow" style={{ flexDirection:"column",alignItems:"flex-start",gap:6 }}>
            <span style={{ fontSize:12,fontWeight:600,color:"#8E8E93",textTransform:"uppercase",letterSpacing:".6px" }}>Objetivos</span>
            {int.objectives.map((o,i)=><span key={i} style={{ fontSize:13,color:"#3A3A3C" }}>· {o}</span>)}
          </div>
        )}
      </div>

      {/* comps */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
        <p style={{ fontSize:16,fontWeight:600 }}>Competências</p>
        <div style={{ display:"flex",gap:8 }}>
          <button className="btn btn-s" onClick={()=>setShowSugg(true)} style={{ fontSize:12,padding:"6px 12px" }}>Importar sugestões</button>
          <button className="btn" onClick={savC} style={{ fontSize:13,color:sv==="c"?"#34C759":"#007AFF",background:"none",fontWeight:600 }}>{sv==="c"?"Guardado":"Guardar"}</button>
        </div>
      </div>
      <p style={{ fontSize:13,color:"#8E8E93",marginBottom:14 }}>Define as competências a acompanhar. Organiza por categorias.</p>
      {cats.map(cat=>(
        <div key={cat.id} style={{ marginBottom:10,background:"#F9F9F9",borderRadius:12,padding:"12px 14px" }}>
          <div style={{ display:"flex",gap:8,alignItems:"center",marginBottom:8 }}>
            <input className="inp-s" style={{ flex:1,fontWeight:600,background:"transparent" }} value={cat.name} onChange={e=>editCat(cat.id,e.target.value)} placeholder="Nome da categoria"/>
            <button className="btn" onClick={()=>delCat(cat.id)} style={{ color:"#FF3B30",background:"none",fontSize:17,padding:"0 2px" }}>×</button>
          </div>
          {cat.items.map((item,i)=>(
            <div key={item.id} style={{ display:"flex",gap:8,marginBottom:6,alignItems:"center",paddingLeft:8 }}>
              <div style={{ width:4,height:4,borderRadius:99,background:"#C7C7CC",flexShrink:0 }}/>
              <input className="inp-s" style={{ flex:1 }} value={item.text} onChange={e=>editItm(cat.id,item.id,e.target.value)} placeholder={`Competência ${i+1}`}/>
              <button className="btn" onClick={()=>delItm(cat.id,item.id)} style={{ color:"#C7C7CC",background:"none",fontSize:16,padding:"0 2px" }}>×</button>
            </div>
          ))}
          <button className="btn" onClick={()=>addItem(cat.id)} style={{ color:"#007AFF",background:"none",fontSize:12,padding:"5px 4px",marginTop:2 }}>+ Competência</button>
        </div>
      ))}
      <button className="btn btn-s" onClick={addCat} style={{ fontSize:13,padding:"8px 14px",marginBottom:28 }}>+ Nova categoria</button>

      {/* procs */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
        <p style={{ fontSize:16,fontWeight:600 }}>Procedimentos</p>
        <button className="btn" onClick={savP} style={{ fontSize:13,color:sv==="p"?"#34C759":"#007AFF",background:"none",fontWeight:600 }}>{sv==="p"?"Guardado":"Guardar"}</button>
      </div>
      <p style={{ fontSize:13,color:"#8E8E93",marginBottom:12 }}>Os procedimentos que registas no diário.</p>
      <div style={{ display:"flex",gap:8,marginBottom:12 }}>
        <input className="inp" style={{ flex:1 }} value={pi} onChange={e=>setPi(e.target.value)} placeholder="Ex: Algaliação, ECG…" onKeyDown={e=>e.key==="Enter"&&addProc()}/>
        <button className="btn btn-p" onClick={addProc} style={{ padding:"11px 16px",flexShrink:0 }}>Adicionar</button>
      </div>
      <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
        {lp.map(p=>(
          <span key={p} style={{ display:"inline-flex",alignItems:"center",gap:5,background:"rgba(0,122,255,.1)",color:"#007AFF",borderRadius:20,padding:"5px 12px",fontSize:13,fontWeight:500 }}>
            {p}<button className="btn" onClick={()=>setLp(x=>x.filter(y=>y!==p))} style={{ background:"none",color:"#007AFF",fontSize:15,padding:0 }}>×</button>
          </span>
        ))}
      </div>
      {lp.length===0&&<p style={{ fontSize:12,color:"#C7C7CC",marginTop:6 }}>Adiciona os procedimentos do teu estágio.</p>}

      {/* import modal */}
      {showSugg&&(
        <div className="ov" onClick={()=>setShowSugg(false)}>
          <div className="sheet pop" style={{ maxWidth:500 }} onClick={e=>e.stopPropagation()}>
            <div className="handle"/>
            <h3 style={{ fontSize:18,fontWeight:700,marginBottom:4 }}>Importar sugestões</h3>
            <p style={{ fontSize:13,color:"#8E8E93",marginBottom:16 }}>Com base no serviço "{int.service||"Geral"}", sugerimos:</p>
            {sugg.comps.map(c=>(
              <div key={c.cat} style={{ marginBottom:12 }}>
                <p style={{ fontSize:12,fontWeight:700,color:"#8E8E93",textTransform:"uppercase",letterSpacing:".6px",marginBottom:6 }}>{c.cat}</p>
                <div style={{ display:"flex",flexWrap:"wrap",gap:5 }}>
                  {c.items.map(t=><span key={t} style={{ background:"#F2F2F7",color:"#3A3A3C",borderRadius:20,padding:"4px 10px",fontSize:12 }}>{t}</span>)}
                </div>
              </div>
            ))}
            <div style={{ display:"flex",gap:10,marginTop:20 }}>
              <button className="btn btn-p" onClick={importSugg} style={{ flex:1,padding:13 }}>Importar tudo</button>
              <button className="btn btn-g" onClick={()=>setShowSugg(false)} style={{ flex:1,padding:13,borderRadius:12 }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── day editor ───────────────────────────────────────────────────────────────
function DayEditor({ date, int, log, shift: initShift, procs, onSave, onShift }) {
  const [f, setF]       = useState(()=>log?{...log}:{shift:initShift||"Manhã",hoursLogged:8,procedures:[],patients:1,reflection:"",mood:3});
  const [shift,setShift]= useState(()=>log?.shift||initShift||"Manhã");
  const [saved,setSaved]= useState(false);
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  const tog = p => setF(prev=>({...prev,procedures:prev.procedures.includes(p)?prev.procedures.filter(x=>x!==p):[...prev.procedures,p]}));
  const save = () => { onSave({...f,date,shift,hoursLogged:+f.hoursLogged||0}); onShift(shift); setSaved(true); setTimeout(()=>setSaved(false),2000); };

  // half-hour steps
  const stepH = dir => {
    const cur = +f.hoursLogged||0;
    const next = Math.round((cur + dir*0.5)*2)/2;
    set("hoursLogged", clamp(next, 0, 14));
  };

  return (
    <div className="card sh fade">
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 20px",borderBottom:".5px solid #F2F2F7" }}>
        <div>
          <span style={{ fontSize:15,fontWeight:600 }}>{WFULL[new Date(date+"T12:00:00").getDay()]}</span>
          <span style={{ fontSize:14,color:"#8E8E93",marginLeft:8 }}>{fmtFull(date)}</span>
          {date===today()&&<span className="badge" style={{ background:"rgba(0,122,255,.1)",color:"#007AFF",marginLeft:8 }}>Hoje</span>}
          {log&&<span className="badge" style={{ background:"rgba(52,199,89,.1)",color:"#34C759",marginLeft:6 }}>Guardado</span>}
        </div>
        <button className="btn" onClick={save} style={{ background:saved?"#34C759":int.color,color:"#fff",borderRadius:10,padding:"8px 20px",fontSize:14 }}>
          {saved?"Guardado":"Guardar"}
        </button>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"148px 148px 1fr" }}>
        {/* col A */}
        <div style={{ padding:16,borderRight:".5px solid #F2F2F7" }}>
          <p style={{ fontSize:10,fontWeight:700,color:"#8E8E93",textTransform:"uppercase",letterSpacing:".8px",marginBottom:10 }}>Turno</p>
          <div style={{ display:"flex",flexDirection:"column",gap:5,marginBottom:18 }}>
            {["Manhã","Tarde","Noite","Folga"].map(s=>(
              <button key={s} className="btn" onClick={()=>setShift(s)} style={{ padding:"8px 12px",borderRadius:9,fontSize:13,textAlign:"left",fontWeight:shift===s?600:400,background:shift===s?`${SC[s]}15`:"#F2F2F7",color:shift===s?SC[s]:"#8E8E93",border:`1px solid ${shift===s?SC[s]:"transparent"}` }}>
                {s}
              </button>
            ))}
          </div>

          <p style={{ fontSize:10,fontWeight:700,color:"#8E8E93",textTransform:"uppercase",letterSpacing:".8px",marginBottom:8 }}>Horas</p>
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4 }}>
            <button className="btn" onClick={()=>stepH(-1)} style={{ width:28,height:28,borderRadius:99,background:"#F2F2F7",color:"#8E8E93",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center" }}>−</button>
            <span style={{ fontSize:20,fontWeight:700,minWidth:38,textAlign:"center" }}>{fmtH(f.hoursLogged)}</span>
            <button className="btn" onClick={()=>stepH(1)} style={{ width:28,height:28,borderRadius:99,background:"#F2F2F7",color:"#8E8E93",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center" }}>+</button>
          </div>
          <p style={{ fontSize:10,color:"#C7C7CC",marginBottom:16,paddingLeft:4 }}>meia em meia hora</p>

          <p style={{ fontSize:10,fontWeight:700,color:"#8E8E93",textTransform:"uppercase",letterSpacing:".8px",marginBottom:8 }}>Doentes</p>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            <button className="btn" onClick={()=>set("patients",Math.max(0,(+f.patients||0)-1))} style={{ width:28,height:28,borderRadius:99,background:"#F2F2F7",color:"#8E8E93",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center" }}>−</button>
            <span style={{ fontSize:20,fontWeight:700,minWidth:26,textAlign:"center" }}>{f.patients}</span>
            <button className="btn" onClick={()=>set("patients",(+f.patients||0)+1)} style={{ width:28,height:28,borderRadius:99,background:"#F2F2F7",color:"#8E8E93",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center" }}>+</button>
          </div>
        </div>

        {/* col B */}
        <div style={{ padding:"16px 14px",borderRight:".5px solid #F2F2F7" }}>
          <p style={{ fontSize:10,fontWeight:700,color:"#8E8E93",textTransform:"uppercase",letterSpacing:".8px",marginBottom:10 }}>Bem-estar</p>
          <div style={{ display:"flex",flexDirection:"column",gap:5 }}>
            {[5,4,3,2,1].map(v=>(
              <button key={v} className="btn" onClick={()=>set("mood",v)} style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:9,fontSize:12,background:f.mood===v?`${MC[v]}12`:"#F2F2F7",color:f.mood===v?MC[v]:"#8E8E93",fontWeight:f.mood===v?600:400,border:`1px solid ${f.mood===v?MC[v]:"transparent"}` }}>
                <div style={{ width:8,height:8,borderRadius:99,background:f.mood===v?MC[v]:"#C7C7CC",flexShrink:0 }}/>
                <span>{ML[v]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* col C */}
        <div style={{ padding:16 }}>
          <p style={{ fontSize:10,fontWeight:700,color:"#8E8E93",textTransform:"uppercase",letterSpacing:".8px",marginBottom:10 }}>
            Procedimentos{f.procedures.length>0&&<span style={{ color:int.color }}> · {f.procedures.length}</span>}
          </p>
          {procs.length===0?(
            <p style={{ fontSize:13,color:"#C7C7CC",marginBottom:14 }}>Define procedimentos nas Definições do estágio.</p>
          ):(
            <div style={{ display:"flex",flexWrap:"wrap",gap:5,marginBottom:14 }}>
              {procs.map(p=>{
                const on=f.procedures.includes(p);
                return <button key={p} className="btn" onClick={()=>tog(p)} style={{ padding:"5px 11px",borderRadius:20,fontSize:12,fontWeight:on?600:400,background:on?int.color:"#F2F2F7",color:on?"#fff":"#3A3A3C" }}>{p}</button>;
              })}
            </div>
          )}
          <p style={{ fontSize:10,fontWeight:700,color:"#8E8E93",textTransform:"uppercase",letterSpacing:".8px",marginBottom:8 }}>Reflexão</p>
          <textarea className="inp" value={f.reflection} onChange={e=>set("reflection",e.target.value)} rows={3} placeholder="Como correu o dia? O que aprendeu?" style={{ resize:"vertical",lineHeight:1.6,fontSize:14 }}/>
        </div>
      </div>
    </div>
  );
}

// ─── shift pill ───────────────────────────────────────────────────────────────
function ShiftPill({ date, current, intId, onSet }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(()=>{
    const h=e=>{ if(ref.current&&!ref.current.contains(e.target))setOpen(false); };
    document.addEventListener("mousedown",h); return ()=>document.removeEventListener("mousedown",h);
  },[]);
  return (
    <div ref={ref} style={{ position:"relative" }}>
      <button className="btn" onClick={e=>{e.stopPropagation();setOpen(o=>!o);}} style={{ width:"100%",padding:"3px 6px",borderRadius:6,fontSize:9,fontWeight:600,background:current?`${SC[current]}15`:"#F2F2F7",color:current?SC[current]:"#C7C7CC",border:`1px solid ${current?SC[current]:"transparent"}` }}>
        {current||"+ turno"}
      </button>
      {open&&(
        <div className="pop card sh" style={{ position:"absolute",top:"110%",left:0,zIndex:60,padding:"5px 0",minWidth:110 }}>
          {["Manhã","Tarde","Noite","Folga"].map(s=>(
            <button key={s} className="btn" onClick={e=>{e.stopPropagation();onSet(intId,date,s);setOpen(false);}} style={{ display:"block",width:"100%",padding:"7px 14px",fontSize:13,fontWeight:current===s?600:400,background:current===s?`${SC[s]}10`:"transparent",color:SC[s],textAlign:"left" }}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── atoms ────────────────────────────────────────────────────────────────────
function FL({ label, children }) {
  return <div><p style={{ fontSize:12,fontWeight:600,color:"#8E8E93",marginBottom:6 }}>{label}</p>{children}</div>;
}
function ErrBox({ msg }) {
  return <p style={{ fontSize:13,color:"#FF3B30",marginBottom:14,background:"rgba(255,59,48,.07)",padding:"10px 12px",borderRadius:10 }}>{msg}</p>;
}
function Ck({ size=11, color="#fff" }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
function PulseIcon({ size=26 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
}
function BellIcon({ color="#8E8E93" }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
}
function Ch({ dir="right" }) {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">{dir==="right"?<polyline points="9 18 15 12 9 6"/>:<polyline points="15 18 9 12 15 6"/>}</svg>;
}

// ─── mount ───────────────────────────────────────────────────────────────────
const _root = ReactDOM.createRoot(document.getElementById("root"));
_root.render(React.createElement(App));
