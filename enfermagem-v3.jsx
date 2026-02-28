import { useState, useMemo } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);
const todayStr = () => new Date().toISOString().split("T")[0];
const fmtDate = (d) => { if (!d) return "—"; const [y,m,dd]=d.split("-"); return `${dd}/${m}/${y}`; };
const diffDays = (a,b) => Math.max(0, Math.round((new Date(b)-new Date(a))/86400000)+1);
const clamp = (v,mn,mx) => Math.min(mx, Math.max(mn,v));
const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAYS_PT   = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const SHIFT_COLOR = { "Manhã":"#F59E0B","Tarde":"#818CF8","Noite":"#38BDF8","Folga":"#475569" };
const SHIFT_ICON  = { "Manhã":"🌅","Tarde":"🌇","Noite":"🌙","Folga":"🛋️" };
const MOOD_EMOJI  = ["","😞","😟","😐","🙂","😄"];
const MOOD_LABEL  = ["","Muito difícil","Difícil","Normal","Bom","Excelente"];
const MOOD_COL    = ["","#EF4444","#F97316","#EAB308","#22C55E","#06B6D4"];
const PROCEDURES  = [
  "Sinais vitais","Colheita de sangue","Algaliação","Cateter venoso periférico",
  "Medicação EV","Medicação IM","Penso simples","Penso complexo","SNG",
  "Oxigenoterapia","ECG","Glicemia capilar","Balanço hídrico",
  "Preparação pré-operatória","Cuidados pós-operatórios","Drenagem cirúrgica",
];

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — dark clinical
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  bg:        "#080C12",
  panel:     "#0E1420",
  card:      "#121A27",
  cardHov:   "#172031",
  border:    "#1E2D42",
  borderSub: "#162030",
  accent:    "#2D9CDB",
  accentDim: "#1A3F5C",
  accentGlow:"rgba(45,156,219,0.15)",
  text:      "#E8EFF8",
  text2:     "#7A90A8",
  text3:     "#3D5268",
  success:   "#22C55E",
  warning:   "#F59E0B",
  danger:    "#EF4444",
  purple:    "#818CF8",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${T.bg}; color: ${T.text}; font-family: 'IBM Plex Sans', sans-serif; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 4px; }
  input, textarea, select, button { font-family: inherit; }
  input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px ${T.panel} inset !important; -webkit-text-fill-color: ${T.text} !important; }

  .fade { animation: fadeIn .22s ease forwards; }
  @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }

  .slide { animation: slideIn .28s cubic-bezier(.16,1,.3,1) forwards; }
  @keyframes slideIn { from { opacity:0; transform:translateX(18px); } to { opacity:1; transform:translateX(0); } }

  .hov-card { transition: background .15s, transform .18s, border-color .15s; }
  .hov-card:hover { background: ${T.cardHov} !important; border-color: ${T.accentDim} !important; transform: translateY(-1px); }

  .hov-row { transition: background .12s; }
  .hov-row:hover { background: ${T.cardHov} !important; }

  .btn { border: none; cursor: pointer; font-family: inherit; font-weight: 600; transition: all .18s; }
  .btn:hover { filter: brightness(1.12); }
  .btn:active { transform: scale(.98); }
  .btn-ghost { background: transparent; border: 1px solid ${T.border}; color: ${T.text2}; transition: all .15s; }
  .btn-ghost:hover { border-color: ${T.accent}; color: ${T.accent}; background: ${T.accentGlow}; }

  .tab-btn { border: none; background: transparent; cursor: pointer; font-family: inherit; transition: all .18s; }

  .input-field {
    width: 100%; background: ${T.panel}; border: 1px solid ${T.border};
    border-radius: 10px; padding: 11px 14px; font-size: 14px; color: ${T.text};
    transition: border-color .18s, box-shadow .18s; outline: none;
  }
  .input-field:focus { border-color: ${T.accent}; box-shadow: 0 0 0 3px ${T.accentGlow}; }
  .input-field::placeholder { color: ${T.text3}; }

  .proc-btn { border: 1px solid ${T.border}; background: ${T.panel}; color: ${T.text2}; border-radius: 6px; padding: 5px 11px; font-size: 12px; cursor: pointer; transition: all .15s; }
  .proc-btn.on { background: ${T.accentDim}; border-color: ${T.accent}; color: ${T.accent}; }

  .badge { display: inline-flex; align-items: center; font-size: 11px; font-weight: 600; border-radius: 5px; padding: 3px 9px; }
  .ptag { display: inline-flex; align-items: center; font-size: 11px; border-radius: 5px; padding: 3px 9px; font-weight: 500; margin: 2px; background: ${T.accentDim}; color: ${T.accent}; }

  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.7); z-index: 400; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(6px); }
  .modal { background: ${T.panel}; border: 1px solid ${T.border}; border-radius: 18px; padding: 32px; max-width: 600px; width: 100%; max-height: 92vh; overflow-y: auto; }

  .prog-track { background: ${T.border}; border-radius: 99px; overflow: hidden; }
  .prog-fill { border-radius: 99px; transition: width .7s ease; }

  .cal-cell { border-radius: 10px; transition: all .15s; cursor: pointer; }
  .cal-cell:hover { background: ${T.cardHov} !important; border-color: ${T.accentDim} !important; }

  .stat-num { font-family: 'IBM Plex Mono', monospace; font-weight: 600; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// SEED DATA
// ─────────────────────────────────────────────────────────────────────────────
const SEED_USERS = [
  { id:"u1", name:"Ana Ferreira", email:"ana@estagio.pt", password:"ana123", course:"Licenciatura em Enfermagem", year:"3º Ano" },
  { id:"u2", name:"João Santos",  email:"joao@estagio.pt", password:"joao123", course:"Licenciatura em Enfermagem", year:"2º Ano" },
];
const SEED_INTERNSHIPS = [
  { id:"i1", userId:"u1", name:"Cirurgia 2A", hospital:"Hospital de Santa Maria", service:"Cirurgia Geral", supervisor:"Enf.ª Dr.ª Ana Rodrigues", startDate:"2025-02-01", endDate:"2025-04-30", totalHours:420, objectives:"Desenvolver competências em cuidados pré e pós-operatórios, gestão de drenos e feridas cirúrgicas.", color:"#2D9CDB" },
  { id:"i2", userId:"u1", name:"Medicina Interna",hospital:"Hospital de Santa Maria", service:"Medicina Interna",supervisor:"Enf.º Dr. Carlos Melo", startDate:"2024-09-02", endDate:"2024-12-20", totalHours:380, objectives:"Cuidados ao doente crónico, gestão terapêutica e comunicação clínica.", color:"#818CF8" },
  { id:"i3", userId:"u2", name:"Urgência Geral", hospital:"Centro Hospitalar Lisboa Norte", service:"Urgência", supervisor:"Enf.ª Dr.ª Sofia Costa", startDate:"2025-01-13", endDate:"2025-03-28", totalHours:300, objectives:"Triagem de Manchester, estabilização de doente crítico e trabalho em equipa multidisciplinar.", color:"#22C55E" },
];
const SEED_LOGS = [
  { id:"l1", internshipId:"i1", userId:"u1", date:"2025-02-24", shift:"Manhã", hoursLogged:8, procedures:["Sinais vitais","Penso complexo","Colheita de sangue"], patients:5, mood:4, reflection:"Realizei pela primeira vez um penso complexo de ferida cirúrgica. Correu bem com orientação." },
  { id:"l2", internshipId:"i1", userId:"u1", date:"2025-02-26", shift:"Tarde", hoursLogged:8, procedures:["Medicação EV","Cuidados pós-operatórios","Drenagem cirúrgica"], patients:4, mood:5, reflection:"Aprendi sobre drenos de Jackson-Pratt e monitorização contínua pós-op." },
  { id:"l3", internshipId:"i1", userId:"u1", date:"2025-02-28", shift:"Manhã", hoursLogged:8, procedures:["Preparação pré-operatória","Cateter venoso periférico"], patients:3, mood:3, reflection:"Preparei dois doentes para bloco. Muito trabalho mas boa aprendizagem." },
];

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [users, setUsers]             = useState(SEED_USERS);
  const [internships, setInternships] = useState(SEED_INTERNSHIPS);
  const [logs, setLogs]               = useState(SEED_LOGS);
  const [user, setUser]               = useState(null);           // logged-in user
  const [view, setView]               = useState("home");         // home | dashboard
  const [activeInt, setActiveInt]     = useState(null);

  const myInternships = internships.filter(i => i.userId === user?.id);
  const myLogs        = logs.filter(l => l.userId === user?.id);

  const openDashboard = (int) => { setActiveInt(int); setView("dashboard"); };

  return (
    <>
      <style>{css}</style>
      {!user
        ? <LoginPage users={users} onLogin={setUser} onRegister={(u)=>{ setUsers(p=>[...p,u]); setUser(u); }} />
        : view === "home"
          ? <HomePage user={user} internships={myInternships} logs={myLogs}
              onOpen={openDashboard}
              onNew={(int)=>{ setInternships(p=>[...p,{...int,id:uid(),userId:user.id}]); }}
              onLogout={()=>{ setUser(null); setView("home"); setActiveInt(null); }} />
          : <Dashboard user={user} internship={activeInt} logs={myLogs}
              onAddLog={(l)=>setLogs(p=>[...p,{...l,id:uid(),userId:user.id,internshipId:activeInt.id}])}
              onBack={()=>setView("home")} />
      }
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
function LoginPage({ users, onLogin, onRegister }) {
  const [mode, setMode]     = useState("login"); // login | register
  const [email, setEmail]   = useState("");
  const [password, setPass] = useState("");
  const [name, setName]     = useState("");
  const [course, setCourse] = useState("Licenciatura em Enfermagem");
  const [year, setYear]     = useState("1º Ano");
  const [err, setErr]       = useState("");

  const handleLogin = () => {
    const u = users.find(u => u.email === email && u.password === password);
    if (u) { setErr(""); onLogin(u); }
    else setErr("Email ou palavra-passe incorretos.");
  };

  const handleRegister = () => {
    if (!name || !email || !password) { setErr("Preenche todos os campos."); return; }
    if (users.find(u => u.email === email)) { setErr("Este email já está registado."); return; }
    onRegister({ id: uid(), name, email, password, course, year });
  };

  return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      {/* background grid */}
      <div style={{ position:"fixed", inset:0, backgroundImage:`linear-gradient(${T.border} 1px,transparent 1px),linear-gradient(90deg,${T.border} 1px,transparent 1px)`, backgroundSize:"40px 40px", opacity:0.3, pointerEvents:"none" }}/>

      <div className="fade" style={{ width:"100%", maxWidth:420, position:"relative", zIndex:1 }}>
        {/* logo */}
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:52, height:52, borderRadius:14, background:T.accentDim, border:`1px solid ${T.accent}`, fontSize:26, marginBottom:14 }}>🩺</div>
          <div style={{ fontSize:22, fontWeight:700, color:T.text, letterSpacing:"-0.5px" }}>EstágioCare</div>
          <div style={{ fontSize:13, color:T.text3, marginTop:4 }}>Diário de Estágio de Enfermagem</div>
        </div>

        <div style={{ background:T.panel, border:`1px solid ${T.border}`, borderRadius:18, padding:32 }}>
          {/* tabs */}
          <div style={{ display:"flex", background:T.bg, borderRadius:10, padding:4, marginBottom:28, gap:4 }}>
            {[["login","Entrar"],["register","Criar Conta"]].map(([m,l])=>(
              <button key={m} className="btn" onClick={()=>{ setMode(m); setErr(""); }}
                style={{ flex:1, padding:"9px", borderRadius:8, fontSize:13,
                  background: mode===m ? T.accentDim : "transparent",
                  color: mode===m ? T.accent : T.text2,
                  border: mode===m ? `1px solid ${T.accent}` : "1px solid transparent" }}>
                {l}
              </button>
            ))}
          </div>

          {mode === "login" ? (
            <div className="fade">
              <Label>Email</Label>
              <input className="input-field" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="o-teu-email@exemplo.pt" style={{marginBottom:14}}/>
              <Label>Palavra-passe</Label>
              <input className="input-field" type="password" value={password} onChange={e=>setPass(e.target.value)} placeholder="••••••••"
                onKeyDown={e=>e.key==="Enter"&&handleLogin()} style={{marginBottom:20}}/>
              {err && <p style={{fontSize:12,color:T.danger,marginBottom:14,padding:"8px 12px",background:"rgba(239,68,68,0.1)",borderRadius:8}}>{err}</p>}
              <button className="btn" onClick={handleLogin}
                style={{ width:"100%", padding:13, background:T.accent, color:"#fff", borderRadius:11, fontSize:14 }}>
                Entrar
              </button>
              <p style={{fontSize:12,color:T.text3,textAlign:"center",marginTop:16}}>
                Demo: <span style={{color:T.text2}}>ana@estagio.pt</span> / <span style={{color:T.text2}}>ana123</span>
              </p>
            </div>
          ) : (
            <div className="fade">
              <Label>Nome completo</Label>
              <input className="input-field" value={name} onChange={e=>setName(e.target.value)} placeholder="O teu nome" style={{marginBottom:14}}/>
              <Label>Email</Label>
              <input className="input-field" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="o-teu-email@exemplo.pt" style={{marginBottom:14}}/>
              <Label>Palavra-passe</Label>
              <input className="input-field" type="password" value={password} onChange={e=>setPass(e.target.value)} placeholder="Mínimo 6 caracteres" style={{marginBottom:14}}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
                <div>
                  <Label>Curso</Label>
                  <select className="input-field" value={course} onChange={e=>setCourse(e.target.value)}>
                    <option>Licenciatura em Enfermagem</option>
                    <option>Mestrado em Enfermagem</option>
                    <option>Pós-Licenciatura</option>
                  </select>
                </div>
                <div>
                  <Label>Ano</Label>
                  <select className="input-field" value={year} onChange={e=>setYear(e.target.value)}>
                    {["1º Ano","2º Ano","3º Ano","4º Ano"].map(y=><option key={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              {err && <p style={{fontSize:12,color:T.danger,marginBottom:14,padding:"8px 12px",background:"rgba(239,68,68,0.1)",borderRadius:8}}>{err}</p>}
              <button className="btn" onClick={handleRegister}
                style={{ width:"100%", padding:13, background:T.accent, color:"#fff", borderRadius:11, fontSize:14 }}>
                Criar Conta
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOME PAGE — list of internships
// ─────────────────────────────────────────────────────────────────────────────
function HomePage({ user, internships, logs, onOpen, onNew, onLogout }) {
  const [showNew, setShowNew] = useState(false);

  const getStatus = (int) => {
    const t = todayStr();
    if (t < int.startDate) return { label:"Futuro",    color:T.text3,   bg:"rgba(255,255,255,0.04)" };
    if (t > int.endDate)   return { label:"Concluído", color:T.success,  bg:"rgba(34,197,94,0.1)" };
    return                        { label:"Ativo",     color:T.accent,   bg:T.accentGlow };
  };

  const getProgress = (int) => {
    const iLogs = logs.filter(l => l.internshipId === int.id);
    const h = iLogs.reduce((s,l)=>s+l.hoursLogged,0);
    return { hours: h, pct: clamp(Math.round((h/int.totalHours)*100),0,100), entries: iLogs.length };
  };

  return (
    <div style={{ minHeight:"100vh", background:T.bg }}>
      {/* top bar */}
      <nav style={{ background:T.panel, borderBottom:`1px solid ${T.border}`, padding:"0 32px", height:60, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:T.accentDim, border:`1px solid ${T.accent}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17 }}>🩺</div>
          <span style={{ fontSize:16, fontWeight:700, color:T.text, letterSpacing:"-0.3px" }}>EstágioCare</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{user.name}</div>
            <div style={{ fontSize:11, color:T.text3 }}>{user.year} · {user.course}</div>
          </div>
          <div style={{ width:34, height:34, borderRadius:99, background:T.accentDim, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:T.accent }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <button className="btn btn-ghost" onClick={onLogout} style={{ borderRadius:9, padding:"7px 14px", fontSize:12 }}>Sair</button>
        </div>
      </nav>

      <div style={{ maxWidth:1060, margin:"0 auto", padding:"40px 24px" }}>
        {/* header */}
        <div className="fade" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:36 }}>
          <div>
            <div style={{ fontSize:12, fontWeight:600, color:T.accent, letterSpacing:"1.5px", textTransform:"uppercase", marginBottom:8 }}>Bem-vindo/a de volta</div>
            <h1 style={{ fontSize:30, fontWeight:700, color:T.text, letterSpacing:"-0.8px", lineHeight:1.1 }}>{user.name}</h1>
            <p style={{ fontSize:14, color:T.text2, marginTop:6 }}>{internships.length} estágio{internships.length!==1?"s":""} registado{internships.length!==1?"s":""}</p>
          </div>
          <button className="btn" onClick={()=>setShowNew(true)}
            style={{ background:T.accent, color:"#fff", borderRadius:11, padding:"11px 22px", fontSize:13 }}>
            + Novo Estágio
          </button>
        </div>

        {/* internship grid */}
        {internships.length === 0 ? (
          <div className="fade" style={{ textAlign:"center", padding:"80px 0" }}>
            <div style={{ fontSize:48, marginBottom:16 }}>🏥</div>
            <p style={{ fontSize:16, fontWeight:600, color:T.text2 }}>Ainda sem estágios</p>
            <p style={{ fontSize:13, color:T.text3, marginTop:6 }}>Cria o teu primeiro estágio para começar</p>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:20 }}>
            {internships.map((int, i) => {
              const status = getStatus(int);
              const prog   = getProgress(int);
              const dLeft  = int.endDate >= todayStr() ? diffDays(todayStr(), int.endDate) : 0;
              return (
                <div key={int.id} className="hov-card fade" onClick={()=>onOpen(int)}
                  style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:24, cursor:"pointer", animationDelay:`${i*0.07}s` }}>
                  {/* color bar */}
                  <div style={{ height:3, borderRadius:99, background:int.color||T.accent, marginBottom:18, width:"100%" }}/>

                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                    <div>
                      <h3 style={{ fontSize:16, fontWeight:700, color:T.text, letterSpacing:"-0.3px" }}>{int.name}</h3>
                      <p style={{ fontSize:12, color:T.text2, marginTop:3 }}>🏥 {int.hospital}</p>
                      <p style={{ fontSize:12, color:T.text3, marginTop:2 }}>🔬 {int.service}</p>
                    </div>
                    <span className="badge" style={{ background:status.bg, color:status.color, fontSize:10, letterSpacing:"0.5px" }}>{status.label}</span>
                  </div>

                  <div style={{ marginBottom:16 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:T.text3, marginBottom:6 }}>
                      <span>Horas registadas</span>
                      <span style={{ color:T.text2, fontFamily:"'IBM Plex Mono',monospace" }}>{prog.hours}h / {int.totalHours}h</span>
                    </div>
                    <div className="prog-track" style={{ height:5 }}>
                      <div className="prog-fill" style={{ width:`${prog.pct}%`, height:"100%", background:int.color||T.accent }}/>
                    </div>
                  </div>

                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ display:"flex", gap:16 }}>
                      <div style={{ textAlign:"center" }}>
                        <div className="stat-num" style={{ fontSize:18, color:T.text }}>{prog.entries}</div>
                        <div style={{ fontSize:10, color:T.text3 }}>registos</div>
                      </div>
                      <div style={{ textAlign:"center" }}>
                        <div className="stat-num" style={{ fontSize:18, color:T.text }}>{prog.pct}%</div>
                        <div style={{ fontSize:10, color:T.text3 }}>horas</div>
                      </div>
                      {status.label==="Ativo" && (
                        <div style={{ textAlign:"center" }}>
                          <div className="stat-num" style={{ fontSize:18, color:T.warning }}>{dLeft}</div>
                          <div style={{ fontSize:10, color:T.text3 }}>dias rest.</div>
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize:11, color:T.text3 }}>{fmtDate(int.startDate)} → {fmtDate(int.endDate)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showNew && <NewInternshipModal onSave={(d)=>{ onNew(d); setShowNew(false); }} onClose={()=>setShowNew(false)}/>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function Dashboard({ user, internship, logs: allLogs, onAddLog, onBack }) {
  const [tab, setTab]           = useState("calendar");
  const [calYear, setCalYear]   = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [showLog, setShowLog]   = useState(false);
  const [prefill, setPrefill]   = useState(null);
  const [openLog, setOpenLog]   = useState(null);

  const int    = internship;
  const iLogs  = allLogs.filter(l => l.internshipId === int.id);
  const logMap = useMemo(() => Object.fromEntries(iLogs.map(l=>[l.date,l])),[iLogs]);

  // stats
  const hoursLogged = iLogs.reduce((s,l)=>s+l.hoursLogged,0);
  const hoursLeft   = Math.max(0,int.totalHours - hoursLogged);
  const daysTotal   = diffDays(int.startDate, int.endDate);
  const daysElapsed = clamp(diffDays(int.startDate, todayStr()),0,daysTotal);
  const timePct     = Math.round((daysElapsed/daysTotal)*100);
  const hoursPct    = clamp(Math.round((hoursLogged/int.totalHours)*100),0,100);
  const allProcs    = iLogs.flatMap(l=>l.procedures);
  const procCounts  = allProcs.reduce((a,p)=>({...a,[p]:(a[p]||0)+1}),{});
  const topProcs    = Object.entries(procCounts).sort((a,b)=>b[1]-a[1]);
  const avgMood     = iLogs.length ? iLogs.reduce((s,l)=>s+l.mood,0)/iLogs.length : null;

  // calendar
  const firstDay   = new Date(calYear, calMonth, 1).getDay();
  const daysInMon  = new Date(calYear, calMonth+1, 0).getDate();
  const cells      = Array.from({length: firstDay+daysInMon},(_,i)=>i<firstDay?null:new Date(calYear,calMonth,i-firstDay+1));
  const inInt      = (d) => { if(!d) return false; const s=d.toISOString().split("T")[0]; return s>=int.startDate&&s<=int.endDate; };

  const clickDay = (date) => {
    const ds = date.toISOString().split("T")[0];
    if (logMap[ds]) { setOpenLog(logMap[ds]); return; }
    if (inInt(date)) { setPrefill(ds); setShowLog(true); }
  };

  const TABS = [{id:"calendar",icon:"📅",label:"Calendário"},{id:"diary",icon:"📋",label:"Diário"},{id:"stats",icon:"📊",label:"Estatísticas"}];

  return (
    <div style={{ minHeight:"100vh", background:T.bg }}>
      {/* nav */}
      <nav style={{ background:T.panel, borderBottom:`1px solid ${T.border}`, padding:"0 28px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button className="btn btn-ghost" onClick={onBack} style={{ borderRadius:8, padding:"6px 12px", fontSize:12, display:"flex", alignItems:"center", gap:6 }}>
            ← Estágios
          </button>
          <div style={{ width:1, height:20, background:T.border }}/>
          <div style={{ width:10, height:10, borderRadius:3, background:int.color||T.accent }}/>
          <span style={{ fontSize:14, fontWeight:600, color:T.text }}>{int.name}</span>
          <span style={{ fontSize:12, color:T.text3 }}>·</span>
          <span style={{ fontSize:12, color:T.text2 }}>{int.hospital}</span>
        </div>
        <div style={{ display:"flex", gap:20, alignItems:"center" }}>
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            <span style={{ fontSize:11, color:T.text3 }}>Horas</span>
            <span className="stat-num" style={{ fontSize:13, color:T.accent }}>{hoursLogged}h/{int.totalHours}h</span>
          </div>
          <div style={{ width:80, height:4, background:T.border, borderRadius:99, overflow:"hidden" }}>
            <div style={{ width:`${hoursPct}%`, height:"100%", background:int.color||T.accent, borderRadius:99 }}/>
          </div>
          <button className="btn" onClick={()=>{ setPrefill(todayStr()); setShowLog(true); }}
            style={{ background:T.accent, color:"#fff", borderRadius:9, padding:"7px 16px", fontSize:12 }}>
            + Registo
          </button>
        </div>
      </nav>

      {/* tabs */}
      <div style={{ background:T.panel, borderBottom:`1px solid ${T.border}`, padding:"0 28px", display:"flex", gap:2 }}>
        {TABS.map(t=>(
          <button key={t.id} className="tab-btn" onClick={()=>setTab(t.id)}
            style={{ padding:"13px 18px", fontSize:13, fontWeight:600,
              color:tab===t.id?T.accent:T.text2,
              borderBottom:tab===t.id?`2px solid ${T.accent}`:"2px solid transparent",
              display:"flex", alignItems:"center", gap:6 }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"28px 24px" }}>

        {/* ── CALENDAR ── */}
        {tab==="calendar" && (
          <div className="fade">
            {/* month nav */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <button className="btn btn-ghost" onClick={()=>{ let m=calMonth-1,y=calYear; if(m<0){m=11;y--;} setCalMonth(m);setCalYear(y); }}
                  style={{ width:32, height:32, borderRadius:8, padding:0, display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
                <span style={{ fontSize:16, fontWeight:700, color:T.text, minWidth:180, textAlign:"center" }}>{MONTHS_PT[calMonth]} {calYear}</span>
                <button className="btn btn-ghost" onClick={()=>{ let m=calMonth+1,y=calYear; if(m>11){m=0;y++;} setCalMonth(m);setCalYear(y); }}
                  style={{ width:32, height:32, borderRadius:8, padding:0, display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
              </div>
              <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                {Object.entries(SHIFT_COLOR).map(([s,c])=>(
                  <span key={s} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:T.text2 }}>
                    <span style={{ width:8, height:8, borderRadius:2, background:c, display:"inline-block" }}/>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* grid */}
            <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:20 }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:8 }}>
                {DAYS_PT.map(d=>(
                  <div key={d} style={{ textAlign:"center", fontSize:10, fontWeight:700, color:T.text3, padding:"4px 0", letterSpacing:"1px", textTransform:"uppercase" }}>{d}</div>
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
                {cells.map((date, i) => {
                  if (!date) return <div key={i}/>;
                  const ds   = date.toISOString().split("T")[0];
                  const log  = logMap[ds];
                  const inI  = inInt(date);
                  const isT  = ds === todayStr();
                  const past = ds < todayStr();
                  return (
                    <div key={i} className={inI?"cal-cell":""} onClick={()=>inI&&clickDay(date)}
                      style={{
                        minHeight:74, padding:"7px 8px", borderRadius:10, position:"relative",
                        border: isT ? `1.5px solid ${T.accent}` : log ? `1px solid ${SHIFT_COLOR[log.shift]}55` : `1px solid ${inI?T.border:"transparent"}`,
                        background: log ? `${SHIFT_COLOR[log.shift]}12` : inI ? T.panel : "transparent",
                        opacity: !inI ? 0.25 : 1,
                        cursor: inI ? "pointer" : "default",
                      }}>
                      <div style={{ fontSize:12, fontWeight:600, color: isT ? T.accent : T.text2 }}>{date.getDate()}</div>
                      {log && (
                        <>
                          <div style={{ fontSize:10, fontWeight:600, color:SHIFT_COLOR[log.shift], marginTop:4, display:"flex", alignItems:"center", gap:2 }}>
                            {SHIFT_ICON[log.shift]} {log.shift}
                          </div>
                          <div style={{ fontSize:9, color:T.text3, marginTop:2 }}>{log.hoursLogged}h · {log.procedures.length}p</div>
                          <div style={{ position:"absolute", bottom:5, right:6, fontSize:13 }}>{MOOD_EMOJI[log.mood]}</div>
                        </>
                      )}
                      {!log && inI && past && (
                        <div style={{ fontSize:16, color:T.text3, textAlign:"center", marginTop:8 }}>+</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* quick stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginTop:16 }}>
              {[
                { icon:"📝", val:iLogs.filter(l=>l.date.startsWith(`${calYear}-${String(calMonth+1).padStart(2,"0")}`)).length, label:"Registos este mês" },
                { icon:"⏱",  val:`${iLogs.filter(l=>l.date.startsWith(`${calYear}-${String(calMonth+1).padStart(2,"0")}`)).reduce((s,l)=>s+l.hoursLogged,0)}h`, label:"Horas este mês" },
                { icon:"🔬", val:allProcs.length, label:"Procedimentos totais" },
                { icon:"💙", val:avgMood?`${avgMood.toFixed(1)}/5`:"—", label:"Bem-estar médio" },
              ].map((s,i)=>(
                <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"16px 18px", display:"flex", alignItems:"center", gap:12 }}>
                  <span style={{ fontSize:22 }}>{s.icon}</span>
                  <div>
                    <div className="stat-num" style={{ fontSize:20, color:T.text }}>{s.val}</div>
                    <div style={{ fontSize:11, color:T.text3 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DIARY ── */}
        {tab==="diary" && (
          <div className="fade">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h2 style={{ fontSize:20, fontWeight:700, color:T.text }}>Diário de Estágio</h2>
              <button className="btn" onClick={()=>{ setPrefill(todayStr()); setShowLog(true); }}
                style={{ background:T.accent, color:"#fff", borderRadius:10, padding:"9px 18px", fontSize:13 }}>
                + Novo Registo
              </button>
            </div>
            {iLogs.length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px 0" }}>
                <div style={{ fontSize:42, marginBottom:12 }}>📋</div>
                <p style={{ fontSize:15, fontWeight:600, color:T.text2 }}>Sem registos ainda</p>
                <p style={{ fontSize:13, color:T.text3, marginTop:4 }}>Clica num dia no calendário ou em "+ Novo Registo"</p>
              </div>
            ) : [...iLogs].sort((a,b)=>b.date.localeCompare(a.date)).map((l,i)=>(
              <div key={l.id} className="hov-card" onClick={()=>setOpenLog(l)}
                style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"18px 22px", marginBottom:10, display:"flex", gap:16, cursor:"pointer", animationDelay:`${i*0.04}s` }}>
                <div style={{ textAlign:"center", minWidth:48, background:T.panel, borderRadius:10, padding:"10px 6px", flexShrink:0, border:`1px solid ${T.border}` }}>
                  <div className="stat-num" style={{ fontSize:20, color:T.accent, lineHeight:1 }}>{l.date.split("-")[2]}</div>
                  <div style={{ fontSize:9, color:T.text3, marginTop:3, letterSpacing:"0.5px" }}>
                    {["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"][parseInt(l.date.split("-")[1])-1]}
                  </div>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      <span className="badge" style={{ background:`${SHIFT_COLOR[l.shift]}18`, color:SHIFT_COLOR[l.shift] }}>{SHIFT_ICON[l.shift]} {l.shift}</span>
                      <span className="badge" style={{ background:T.panel, color:T.text2 }}>⏱ {l.hoursLogged}h</span>
                      <span className="badge" style={{ background:T.panel, color:T.text2 }}>👥 {l.patients}</span>
                    </div>
                    <span style={{ fontSize:18 }}>{MOOD_EMOJI[l.mood]}</span>
                  </div>
                  <div style={{ marginBottom:6 }}>{l.procedures.map(p=><span key={p} className="ptag">{p}</span>)}</div>
                  {l.reflection && <p style={{ fontSize:12, color:T.text3, lineHeight:1.6, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:1, WebkitBoxOrient:"vertical" }}>"{l.reflection}"</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── STATS ── */}
        {tab==="stats" && (
          <div className="fade">
            <h2 style={{ fontSize:20, fontWeight:700, color:T.text, marginBottom:20 }}>Estatísticas</h2>

            {/* top row */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:16 }}>
              {[
                { label:"Horas registadas", val:`${hoursLogged}h`, sub:`${hoursLeft}h em falta`, pct:hoursPct, color:int.color||T.accent },
                { label:"Progresso temporal", val:`${timePct}%`, sub:`${Math.max(0,daysTotal-daysElapsed)} dias restantes`, pct:timePct, color:T.purple },
                { label:"Bem-estar médio", val:avgMood?`${avgMood.toFixed(1)}/5`:"—", sub:avgMood?MOOD_LABEL[Math.round(avgMood)]:"sem dados", pct:avgMood?avgMood/5*100:0, color:MOOD_COL[Math.round(avgMood)]||T.text3 },
              ].map((s,i)=>(
                <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"20px 22px" }}>
                  <div style={{ fontSize:11, color:T.text3, fontWeight:600, letterSpacing:"0.5px", textTransform:"uppercase", marginBottom:8 }}>{s.label}</div>
                  <div className="stat-num" style={{ fontSize:28, color:s.color }}>{s.val}</div>
                  <div style={{ fontSize:11, color:T.text3, marginTop:4 }}>{s.sub}</div>
                  <div className="prog-track" style={{ height:4, marginTop:12 }}>
                    <div className="prog-fill" style={{ width:`${s.pct}%`, height:"100%", background:s.color }}/>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              {/* procedures */}
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:22 }}>
                <div style={{ fontWeight:700, fontSize:13, color:T.text, marginBottom:16 }}>Procedimentos Realizados</div>
                {topProcs.length===0 ? <p style={{ fontSize:13, color:T.text3 }}>Sem dados.</p> : topProcs.slice(0,8).map(([p,c])=>(
                  <div key={p} style={{ marginBottom:11 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                      <span style={{ color:T.text2 }}>{p}</span>
                      <span className="stat-num" style={{ color:T.accent, fontSize:12 }}>{c}×</span>
                    </div>
                    <div className="prog-track" style={{ height:4 }}>
                      <div className="prog-fill" style={{ width:`${(c/topProcs[0][1])*100}%`, height:"100%", background:`linear-gradient(90deg,${T.accent},${T.purple})` }}/>
                    </div>
                  </div>
                ))}
              </div>

              {/* mood timeline */}
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:22 }}>
                <div style={{ fontWeight:700, fontSize:13, color:T.text, marginBottom:16 }}>Bem-estar ao Longo do Tempo</div>
                {iLogs.length===0 ? <p style={{ fontSize:13, color:T.text3 }}>Sem dados.</p> :
                  [...iLogs].sort((a,b)=>a.date.localeCompare(b.date)).map(l=>(
                    <div key={l.id} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                      <span style={{ fontSize:10, color:T.text3, minWidth:58, fontFamily:"'IBM Plex Mono',monospace" }}>{fmtDate(l.date)}</span>
                      <div style={{ flex:1, display:"flex", gap:3 }}>
                        {[1,2,3,4,5].map(v=>(
                          <div key={v} style={{ flex:1, height:7, borderRadius:3, background: v<=l.mood ? MOOD_COL[l.mood] : T.border }}/>
                        ))}
                      </div>
                      <span style={{ fontSize:14 }}>{MOOD_EMOJI[l.mood]}</span>
                    </div>
                  ))
                }
              </div>

              {/* summary */}
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:22, gridColumn:"span 2" }}>
                <div style={{ fontWeight:700, fontSize:13, color:T.text, marginBottom:14 }}>Resumo do Estágio</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
                  {[
                    { label:"Horas registadas",     val:`${hoursLogged}h`,  color:int.color||T.accent },
                    { label:"Horas em falta",        val:`${hoursLeft}h`,   color:T.danger },
                    { label:"Registos no diário",    val:iLogs.length,      color:T.purple },
                    { label:"Total procedimentos",   val:allProcs.length,   color:T.success },
                    { label:"Tipos de procedimentos",val:Object.keys(procCounts).length, color:T.accent },
                    { label:"Doentes acompanhados",  val:iLogs.reduce((s,l)=>s+l.patients,0), color:T.warning },
                  ].map(r=>(
                    <div key={r.label} style={{ borderLeft:`3px solid ${r.color}`, paddingLeft:12 }}>
                      <div className="stat-num" style={{ fontSize:22, color:r.color }}>{r.val}</div>
                      <div style={{ fontSize:11, color:T.text3, marginTop:2 }}>{r.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showLog && <LogModal prefillDate={prefill} onSave={(d)=>{ onAddLog(d); setShowLog(false); setPrefill(null); }} onClose={()=>{ setShowLog(false); setPrefill(null); }}/>}

      {openLog && (
        <div className="overlay" onClick={()=>setOpenLog(null)}>
          <div className="modal fade" onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <div>
                <div style={{ fontSize:20, fontWeight:700, color:T.text }}>{fmtDate(openLog.date)}</div>
                <div style={{ display:"flex", gap:8, marginTop:8, flexWrap:"wrap" }}>
                  <span className="badge" style={{ background:`${SHIFT_COLOR[openLog.shift]}18`, color:SHIFT_COLOR[openLog.shift] }}>{SHIFT_ICON[openLog.shift]} {openLog.shift}</span>
                  <span className="badge" style={{ background:T.panel, color:T.text2 }}>⏱ {openLog.hoursLogged}h</span>
                  <span className="badge" style={{ background:T.panel, color:T.text2 }}>👥 {openLog.patients} doentes</span>
                  <span className="badge" style={{ background:`${MOOD_COL[openLog.mood]}18`, color:MOOD_COL[openLog.mood] }}>{MOOD_EMOJI[openLog.mood]} {MOOD_LABEL[openLog.mood]}</span>
                </div>
              </div>
              <button onClick={()=>setOpenLog(null)} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:T.text3 }}>✕</button>
            </div>
            <Label>Procedimentos</Label>
            <div style={{ marginTop:8, marginBottom:16 }}>{openLog.procedures.map(p=><span key={p} className="ptag">{p}</span>)}</div>
            {openLog.reflection && <>
              <Label>Reflexão do dia</Label>
              <p style={{ fontSize:14, color:T.text2, lineHeight:1.8, background:T.bg, borderRadius:10, padding:14, marginTop:8 }}>{openLog.reflection}</p>
            </>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL — NEW INTERNSHIP
// ─────────────────────────────────────────────────────────────────────────────
const INT_COLORS = ["#2D9CDB","#818CF8","#22C55E","#F59E0B","#EF4444","#06B6D4","#EC4899"];

function NewInternshipModal({ onSave, onClose }) {
  const [f,setF] = useState({ name:"",hospital:"",service:"",supervisor:"",startDate:"",endDate:"",totalHours:"",objectives:"",color:"#2D9CDB" });
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  const dur = f.startDate&&f.endDate ? diffDays(f.startDate,f.endDate) : null;
  const ok  = f.name&&f.hospital&&f.startDate&&f.endDate&&f.totalHours;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal fade" onClick={e=>e.stopPropagation()}>
        <div style={{ fontSize:18, fontWeight:700, color:T.text, marginBottom:22 }}>Novo Estágio</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <div style={{ gridColumn:"span 2" }}>
            <Label>Nome do Estágio *</Label>
            <input className="input-field" value={f.name} onChange={e=>s("name",e.target.value)} placeholder="Ex: Cirurgia 2A" style={{marginTop:5}}/>
          </div>
          <div><Label>Hospital / Local *</Label><input className="input-field" value={f.hospital} onChange={e=>s("hospital",e.target.value)} placeholder="Ex: Hospital de Santa Maria" style={{marginTop:5}}/></div>
          <div><Label>Serviço / Setor</Label><input className="input-field" value={f.service} onChange={e=>s("service",e.target.value)} placeholder="Ex: Cirurgia Geral" style={{marginTop:5}}/></div>
          <div><Label>Supervisor</Label><input className="input-field" value={f.supervisor} onChange={e=>s("supervisor",e.target.value)} placeholder="Ex: Enf.ª Ana Silva" style={{marginTop:5}}/></div>
          <div><Label>Total de Horas *</Label><input className="input-field" type="number" value={f.totalHours} onChange={e=>s("totalHours",e.target.value)} placeholder="Ex: 420" style={{marginTop:5}}/></div>
          <div>
            <Label>Data de Início *</Label>
            <input className="input-field" type="date" value={f.startDate} onChange={e=>s("startDate",e.target.value)} style={{marginTop:5}}/>
          </div>
          <div>
            <Label>Data de Fim *</Label>
            <input className="input-field" type="date" value={f.endDate} onChange={e=>s("endDate",e.target.value)} style={{marginTop:5}}/>
            {dur && <div style={{ fontSize:11, color:T.accent, marginTop:4 }}>⏱ {dur} dias de duração</div>}
          </div>
          <div style={{ gridColumn:"span 2" }}>
            <Label>Cor do Estágio</Label>
            <div style={{ display:"flex", gap:8, marginTop:8 }}>
              {INT_COLORS.map(c=>(
                <button key={c} onClick={()=>s("color",c)}
                  style={{ width:28, height:28, borderRadius:8, background:c, border: f.color===c?`2px solid ${T.text}`:"2px solid transparent", cursor:"pointer" }}/>
              ))}
            </div>
          </div>
          <div style={{ gridColumn:"span 2" }}>
            <Label>Objetivos</Label>
            <textarea className="input-field" value={f.objectives} onChange={e=>s("objectives",e.target.value)} rows={3} placeholder="Descreva os objetivos do estágio..." style={{marginTop:5,resize:"vertical"}}/>
          </div>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:22 }}>
          <button className="btn" onClick={()=>ok&&onSave({...f,totalHours:parseInt(f.totalHours)})}
            style={{ flex:1, padding:13, background:ok?T.accent:"#1E2D42", color:ok?"#fff":T.text3, borderRadius:11, fontSize:14 }}>
            Criar Estágio
          </button>
          <button className="btn btn-ghost" onClick={onClose} style={{ flex:1, padding:13, borderRadius:11, fontSize:14 }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL — NEW LOG
// ─────────────────────────────────────────────────────────────────────────────
function LogModal({ prefillDate, onSave, onClose }) {
  const [f,setF] = useState({ date:prefillDate||todayStr(), shift:"Manhã", hoursLogged:8, procedures:[], patients:1, reflection:"", mood:3 });
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  const toggle=(p)=>setF(prev=>({...prev,procedures:prev.procedures.includes(p)?prev.procedures.filter(x=>x!==p):[...prev.procedures,p]}));
  const ok = f.date && f.hoursLogged > 0;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal fade" style={{ maxWidth:640 }} onClick={e=>e.stopPropagation()}>
        <div style={{ fontSize:18, fontWeight:700, color:T.text, marginBottom:22 }}>
          Registo do Dia{f.date ? ` — ${fmtDate(f.date)}` : ""}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:16 }}>
          <div><Label>Data *</Label><input className="input-field" type="date" value={f.date} onChange={e=>s("date",e.target.value)} style={{marginTop:5}}/></div>
          <div>
            <Label>Turno</Label>
            <select className="input-field" value={f.shift} onChange={e=>s("shift",e.target.value)} style={{marginTop:5}}>
              {["Manhã","Tarde","Noite","Folga"].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div><Label>Horas</Label><input className="input-field" type="number" value={f.hoursLogged} onChange={e=>s("hoursLogged",parseInt(e.target.value)||0)} min={0} max={12} style={{marginTop:5}}/></div>
        </div>

        <div style={{ marginBottom:16 }}>
          <Label>Nº Doentes Acompanhados</Label>
          <input className="input-field" type="number" value={f.patients} onChange={e=>s("patients",parseInt(e.target.value)||0)} min={0} style={{marginTop:5,width:"30%"}}/>
        </div>

        <div style={{ marginBottom:16 }}>
          <Label>Procedimentos Realizados</Label>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:8 }}>
            {PROCEDURES.map(p=>(
              <button key={p} className={`proc-btn${f.procedures.includes(p)?" on":""}`} onClick={()=>toggle(p)}>{p}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:16 }}>
          <Label>Bem-estar do Dia</Label>
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            {[1,2,3,4,5].map(v=>(
              <button key={v} onClick={()=>s("mood",v)}
                style={{ flex:1, padding:"10px 4px", borderRadius:10, cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:600,
                  border:`1.5px solid ${f.mood===v?MOOD_COL[v]:T.border}`,
                  background: f.mood===v ? `${MOOD_COL[v]}18` : T.panel,
                  color: f.mood===v ? MOOD_COL[v] : T.text3,
                  transition:"all .15s" }}>
                <div style={{ fontSize:22, marginBottom:3 }}>{MOOD_EMOJI[v]}</div>
                <div style={{ fontSize:10 }}>{MOOD_LABEL[v]}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:22 }}>
          <Label>Reflexão do Dia</Label>
          <textarea className="input-field" value={f.reflection} onChange={e=>s("reflection",e.target.value)} rows={3}
            placeholder="Como correu o dia? O que aprendeu? O que quer melhorar?" style={{marginTop:5,resize:"vertical"}}/>
        </div>

        <div style={{ display:"flex", gap:10 }}>
          <button className="btn" onClick={()=>ok&&onSave(f)}
            style={{ flex:1, padding:13, background:ok?T.accent:"#1E2D42", color:ok?"#fff":T.text3, borderRadius:11, fontSize:14 }}>
            Guardar Registo
          </button>
          <button className="btn btn-ghost" onClick={onClose} style={{ flex:1, padding:13, borderRadius:11, fontSize:14 }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TINY HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function Label({ children }) {
  return <div style={{ fontSize:11, fontWeight:600, color:T.text3, letterSpacing:"0.8px", textTransform:"uppercase" }}>{children}</div>;
}
