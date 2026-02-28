import { useState, useMemo, useEffect } from "react";

// ─── storage ──────────────────────────────────────────────────────────────────
const S = {
  get: (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ─── utils ────────────────────────────────────────────────────────────────────
const uid      = () => Math.random().toString(36).slice(2, 9);
const today    = () => new Date().toISOString().split("T")[0];
const fmt      = (d) => { if (!d) return "—"; const [y,m,dd]=d.split("-"); return `${dd}/${m}/${y}`; };
const diffDays = (a,b) => Math.max(0, Math.round((new Date(b)-new Date(a))/86400000)+1);
const clamp    = (v,mn,mx) => Math.min(mx,Math.max(mn,v));
const MONTHS   = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const WDAYS    = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

const SHIFT_C  = { Manhã:"#F59E0B", Tarde:"#6366F1", Noite:"#0EA5E9", Folga:"#94A3B8" };
const SHIFT_IC = { Manhã:"🌅", Tarde:"🌇", Noite:"🌙", Folga:"🛋️" };
const MOOD_E   = ["","😞","😟","😐","🙂","😄"];
const MOOD_L   = ["","Muito difícil","Difícil","Normal","Bom","Excelente"];
const MOOD_COL = ["","#EF4444","#F97316","#EAB308","#22C55E","#06B6D4"];
const PROCS    = ["Sinais vitais","Colheita de sangue","Algaliação","Cateter venoso periférico","Medicação EV","Medicação IM","Penso simples","Penso complexo","SNG","Oxigenoterapia","ECG","Glicemia capilar","Balanço hídrico","Prep. pré-operatória","Cuidados pós-op","Drenagem cirúrgica"];
const INT_COLS = ["#3B82F6","#8B5CF6","#10B981","#F59E0B","#EF4444","#06B6D4","#EC4899","#84CC16"];

const COMPS = {
  "Cirurgia Geral": [{id:"c1",cat:"Técnica",label:"Preparação pré-operatória"},{id:"c2",cat:"Técnica",label:"Cuidados pós-operatórios imediatos"},{id:"c3",cat:"Técnica",label:"Gestão de drenos cirúrgicos"},{id:"c4",cat:"Técnica",label:"Pensos complexos"},{id:"c5",cat:"Técnica",label:"Algaliação vesical"},{id:"c6",cat:"Técnica",label:"Cateter venoso periférico"},{id:"c7",cat:"Técnica",label:"Medicação EV"},{id:"c8",cat:"Avaliação",label:"Avaliação da dor pós-op"},{id:"c9",cat:"Avaliação",label:"Monitorização de sinais vitais"},{id:"c10",cat:"Avaliação",label:"Vigilância de complicações"},{id:"c11",cat:"Comunicação",label:"Comunicação com doente cirúrgico"},{id:"c12",cat:"Comunicação",label:"Ensino pós-alta"},{id:"c13",cat:"Organização",label:"Gestão de material cirúrgico"},{id:"c14",cat:"Organização",label:"Registos de enfermagem"}],
  "Medicina Interna": [{id:"m1",cat:"Técnica",label:"Administração de terapêutica EV"},{id:"m2",cat:"Técnica",label:"Colheita de produtos"},{id:"m3",cat:"Técnica",label:"Cateter venoso periférico"},{id:"m4",cat:"Técnica",label:"Algaliação vesical"},{id:"m5",cat:"Avaliação",label:"Monitorização de sinais vitais"},{id:"m6",cat:"Avaliação",label:"Avaliação do estado geral"},{id:"m7",cat:"Avaliação",label:"Gestão de polimedicação"},{id:"m8",cat:"Comunicação",label:"Comunicação com doente crónico"},{id:"m9",cat:"Comunicação",label:"Articulação multidisciplinar"},{id:"m10",cat:"Organização",label:"Planeamento de cuidados"},{id:"m11",cat:"Organização",label:"Registos de enfermagem"}],
  "Urgência": [{id:"u1",cat:"Técnica",label:"Triagem de Manchester"},{id:"u2",cat:"Técnica",label:"RCP (SBV/SAV)"},{id:"u3",cat:"Técnica",label:"Cateter venoso periférico urgente"},{id:"u4",cat:"Técnica",label:"Oxigenoterapia de emergência"},{id:"u5",cat:"Técnica",label:"Electrocardiograma"},{id:"u6",cat:"Avaliação",label:"Avaliação primária ABCDE"},{id:"u7",cat:"Avaliação",label:"Monitorização contínua"},{id:"u8",cat:"Comunicação",label:"Comunicação em crise"},{id:"u9",cat:"Organização",label:"Gestão de múltiplos doentes"},{id:"u10",cat:"Organização",label:"Documentação de urgência"}],
  "Pediatria": [{id:"p1",cat:"Técnica",label:"Terapêutica pediátrica"},{id:"p2",cat:"Técnica",label:"Punção venosa em criança"},{id:"p3",cat:"Técnica",label:"Avaliação de crescimento"},{id:"p4",cat:"Avaliação",label:"Avaliação da dor pediátrica"},{id:"p5",cat:"Avaliação",label:"Sinais vitais pediátricos"},{id:"p6",cat:"Comunicação",label:"Comunicação por faixas etárias"},{id:"p7",cat:"Comunicação",label:"Apoio à família/cuidadores"},{id:"p8",cat:"Organização",label:"Segurança do ambiente pediátrico"}],
};
const GCOMPS = [{id:"g1",cat:"Geral",label:"Integração no serviço"},{id:"g2",cat:"Geral",label:"Identificação das rotinas"},{id:"g3",cat:"Geral",label:"Controlo de infeção"},{id:"g4",cat:"Geral",label:"Trabalho em equipa"},{id:"g5",cat:"Geral",label:"Reflexão crítica"}];

const SEED_U = [{id:"u1",name:"Ana Ferreira",email:"ana@estagio.pt",password:"ana123",course:"Licenciatura em Enfermagem",year:"3º Ano"},{id:"u2",name:"João Santos",email:"joao@estagio.pt",password:"joao123",course:"Licenciatura em Enfermagem",year:"2º Ano"}];
const SEED_I = [{id:"i1",userId:"u1",name:"Cirurgia 2A",hospital:"Hospital de Santa Maria",service:"Cirurgia Geral",supervisor:"Enf.ª Dr.ª Ana Rodrigues",startDate:"2025-02-01",endDate:"2025-04-30",totalHours:420,objectives:"Competências em cuidados pré e pós-operatórios, gestão de drenos e feridas cirúrgicas.",color:"#3B82F6"},{id:"i2",userId:"u2",name:"Urgência Geral",hospital:"CH Lisboa Norte",service:"Urgência",supervisor:"Enf.ª Dr.ª Sofia Costa",startDate:"2025-01-13",endDate:"2025-03-28",totalHours:300,objectives:"Triagem de Manchester, estabilização do doente crítico.",color:"#10B981"}];
const SEED_L = [{id:"l1",internshipId:"i1",userId:"u1",date:"2025-02-24",shift:"Manhã",hoursLogged:8,procedures:["Sinais vitais","Penso complexo","Colheita de sangue"],patients:5,mood:4,reflection:"Primeiro penso complexo com orientação. Correu bem."},{id:"l2",internshipId:"i1",userId:"u1",date:"2025-02-26",shift:"Tarde",hoursLogged:8,procedures:["Medicação EV","Cuidados pós-op","Drenagem cirúrgica"],patients:4,mood:5,reflection:"Aprendi sobre drenos de Jackson-Pratt."},{id:"l3",internshipId:"i1",userId:"u1",date:"2025-02-28",shift:"Manhã",hoursLogged:8,procedures:["Prep. pré-operatória","Cateter venoso periférico"],patients:3,mood:3,reflection:"Preparei dois doentes para bloco operatório."}];

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800;900&family=Geist+Mono:wght@400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{background:#F1F5F9;color:#0F172A;font-family:'Geist',sans-serif;min-height:100vh}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:4px}
  input,textarea,select,button{font-family:inherit}
  input:-webkit-autofill{-webkit-box-shadow:0 0 0 100px #fff inset!important;-webkit-text-fill-color:#0F172A!important}

  .fade{animation:fi .22s ease forwards}
  @keyframes fi{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
  .slide-l{animation:sl .26s cubic-bezier(.16,1,.3,1) forwards}
  @keyframes sl{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
  .slide-r{animation:sr .26s cubic-bezier(.16,1,.3,1) forwards}
  @keyframes sr{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}

  .btn{border:none;cursor:pointer;font-family:inherit;font-weight:600;transition:all .15s;display:inline-flex;align-items:center;justify-content:center;gap:5px}
  .btn:active{transform:scale(.97)}
  .btn-dark{background:#0F172A;color:#fff;border-radius:10px;padding:10px 18px;font-size:13px}
  .btn-dark:hover{background:#1E293B}
  .btn-out{background:#fff;color:#0F172A;border:1.5px solid #E2E8F0;border-radius:10px;padding:9px 16px;font-size:13px}
  .btn-out:hover{border-color:#94A3B8}
  .btn-ghost{background:transparent;color:#64748B;border:none;border-radius:8px;padding:6px 10px;font-size:13px;font-weight:500}
  .btn-ghost:hover{background:#E2E8F0;color:#0F172A}
  .btn-sq{background:#fff;border:1.5px solid #E2E8F0;border-radius:8px;width:32px;height:32px;padding:0;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-size:14px;transition:all .15s;font-family:inherit;font-weight:700;color:#0F172A}
  .btn-sq:hover{border-color:#94A3B8;background:#F8FAFC}

  .ifield{width:100%;background:#fff;border:1.5px solid #E2E8F0;border-radius:9px;padding:10px 13px;font-size:13px;color:#0F172A;transition:border-color .15s,box-shadow .15s;outline:none}
  .ifield:focus{border-color:#0F172A;box-shadow:0 0 0 3px rgba(15,23,42,.06)}
  .ifield::placeholder{color:#CBD5E1}

  .tab-btn{border:none;background:transparent;cursor:pointer;font-family:inherit;transition:all .15s;white-space:nowrap;display:flex;align-items:center;gap:5px;font-size:13px;font-weight:500;padding:13px 16px 11px}

  .surface{background:#fff;border:1.5px solid #E2E8F0;border-radius:16px}
  .hov-card{transition:all .15s;cursor:pointer}
  .hov-card:hover{border-color:#94A3B8 !important;box-shadow:0 4px 20px rgba(0,0,0,.07)}

  .badge{display:inline-flex;align-items:center;font-size:11px;font-weight:600;border-radius:6px;padding:3px 8px;gap:3px}
  .ptag{display:inline-flex;align-items:center;font-size:11px;border-radius:5px;padding:2px 8px;font-weight:500;margin:2px;background:#F1F5F9;color:#475569;border:1px solid #E2E8F0}
  .mono{font-family:'Geist Mono',monospace;font-weight:500}

  .overlay{position:fixed;inset:0;background:rgba(15,23,42,.35);z-index:500;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(6px)}
  .modal{background:#fff;border:1.5px solid #E2E8F0;border-radius:20px;padding:30px;max-width:480px;width:100%;max-height:92vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,.14)}

  .prog-track{background:#F1F5F9;border-radius:99px;overflow:hidden}
  .prog-fill{border-radius:99px;transition:width .6s ease}

  .day-chip{border-radius:12px;border:2px solid #E2E8F0;cursor:pointer;transition:all .18s;overflow:hidden;background:#fff}
  .day-chip:hover{border-color:#94A3B8;box-shadow:0 2px 12px rgba(0,0,0,.06)}
  .day-chip.sel{border-color:var(--ic) !important;box-shadow:0 4px 16px rgba(0,0,0,.1)}
  .day-chip.done{border-color:var(--sc) !important}

  .proc-btn{border:1.5px solid #E2E8F0;background:#fff;color:#475569;border-radius:7px;padding:5px 11px;font-size:12px;cursor:pointer;transition:all .13s;font-family:inherit;font-weight:500}
  .proc-btn:hover{border-color:#94A3B8}
  .proc-btn.on{background:#0F172A;border-color:#0F172A;color:#fff}

  .comp-row{display:flex;align-items:center;gap:10px;padding:10px 16px;cursor:pointer;transition:background .12s}
  .comp-row:hover{background:#F8FAFC}

  .spin-btn{background:#F1F5F9;border:none;border-radius:7px;width:30px;height:30px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;font-weight:700;color:#0F172A;transition:background .12s;font-family:inherit}
  .spin-btn:hover{background:#E2E8F0}
`;

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [users,setUsers]             = useState(()=>S.get("ec5_users",SEED_U));
  const [internships,setInternships] = useState(()=>S.get("ec5_ints",SEED_I));
  const [logs,setLogs]               = useState(()=>S.get("ec5_logs",SEED_L));
  const [comps,setComps]             = useState(()=>S.get("ec5_comps",{}));
  const [schedule,setSchedule]       = useState(()=>S.get("ec5_sched",{}));
  const [user,setUser]               = useState(null);
  const [view,setView]               = useState("home");
  const [activeInt,setActiveInt]     = useState(null);

  useEffect(()=>S.set("ec5_users",users),[users]);
  useEffect(()=>S.set("ec5_ints",internships),[internships]);
  useEffect(()=>S.set("ec5_logs",logs),[logs]);
  useEffect(()=>S.set("ec5_comps",comps),[comps]);
  useEffect(()=>S.set("ec5_sched",schedule),[schedule]);

  const myInt  = internships.filter(i=>i.userId===user?.id);
  const myLogs = logs.filter(l=>l.userId===user?.id);

  return (
    <>
      <style>{CSS}</style>
      {!user
        ? <LoginPage users={users} onLogin={setUser} onRegister={u=>{const n={...u,id:uid()};setUsers(p=>[...p,n]);setUser(n);}}/>
        : view==="home"
          ? <HomePage user={user} internships={myInt} logs={myLogs}
              onOpen={i=>{setActiveInt(i);setView("dash")}}
              onNew={i=>setInternships(p=>[...p,{...i,id:uid(),userId:user.id}])}
              onLogout={()=>{setUser(null);setView("home");setActiveInt(null)}}/>
          : <Dashboard user={user} int={activeInt} logs={myLogs}
              comps={comps} schedule={schedule}
              onAddLog={l=>setLogs(p=>[...p,{...l,id:uid(),userId:user.id,internshipId:activeInt.id}])}
              onUpdateLog={(id,data)=>setLogs(p=>p.map(l=>l.id===id?{...l,...data}:l))}
              onSetComp={(iid,cid,v)=>setComps(p=>({...p,[`${iid}_${cid}`]:v}))}
              onSetShift={(iid,date,sh)=>setSchedule(p=>({...p,[`${iid}_${date}`]:sh}))}
              onBack={()=>setView("home")}/>
      }
    </>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginPage({users,onLogin,onRegister}){
  const [mode,setMode]=useState("login");
  const [f,setF]=useState({email:"",password:"",name:"",course:"Licenciatura em Enfermagem",year:"1º Ano"});
  const [err,setErr]=useState("");
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  const login=()=>{const u=users.find(u=>u.email===f.email&&u.password===f.password);u?(setErr(""),onLogin(u)):setErr("Email ou palavra-passe incorretos.");};
  const register=()=>{
    if(!f.name||!f.email||!f.password)return setErr("Preenche todos os campos.");
    if(users.find(u=>u.email===f.email))return setErr("Email já registado.");
    onRegister(f);
  };
  return(
    <div style={{minHeight:"100vh",background:"#F1F5F9",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{position:"fixed",top:"-10%",right:"-5%",width:500,height:500,background:"radial-gradient(circle,rgba(59,130,246,.07) 0%,transparent 65%)",pointerEvents:"none"}}/>
      <div className="fade" style={{width:"100%",maxWidth:380,position:"relative",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:52,height:52,borderRadius:14,background:"#0F172A",fontSize:26,marginBottom:12,boxShadow:"0 8px 24px rgba(15,23,42,.25)"}}>🩺</div>
          <div style={{fontSize:22,fontWeight:800,color:"#0F172A",letterSpacing:"-.6px"}}>EstágioCare</div>
          <div style={{fontSize:11,color:"#94A3B8",marginTop:3,letterSpacing:"1px",fontWeight:600}}>DIÁRIO DE ESTÁGIO · ENFERMAGEM</div>
        </div>
        <div className="surface" style={{padding:28,boxShadow:"0 8px 32px rgba(0,0,0,.08)"}}>
          <div style={{display:"flex",background:"#F1F5F9",borderRadius:10,padding:3,marginBottom:22,gap:3}}>
            {[["login","Entrar"],["register","Criar conta"]].map(([m,l])=>(
              <button key={m} className="btn" onClick={()=>{setMode(m);setErr("");}}
                style={{flex:1,padding:"8px",borderRadius:8,fontSize:13,background:mode===m?"#0F172A":"transparent",color:mode===m?"#fff":"#64748B"}}>
                {l}
              </button>
            ))}
          </div>
          {mode==="login"?(
            <div className="fade">
              <Lbl>Email</Lbl><input className="ifield" type="email" value={f.email} onChange={e=>s("email",e.target.value)} placeholder="o-teu@email.pt" style={{marginTop:5,marginBottom:14}}/>
              <Lbl>Palavra-passe</Lbl><input className="ifield" type="password" value={f.password} onChange={e=>s("password",e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&login()} style={{marginTop:5,marginBottom:20}}/>
              {err&&<Err msg={err}/>}
              <button className="btn btn-dark" onClick={login} style={{width:"100%",padding:12,fontSize:14,borderRadius:10,marginTop:err?10:0}}>Entrar →</button>
              <p style={{fontSize:11,color:"#94A3B8",textAlign:"center",marginTop:14}}>Demo: <b style={{color:"#64748B"}}>ana@estagio.pt</b> / <b style={{color:"#64748B"}}>ana123</b></p>
            </div>
          ):(
            <div className="fade">
              <Lbl>Nome completo</Lbl><input className="ifield" value={f.name} onChange={e=>s("name",e.target.value)} placeholder="O teu nome" style={{marginTop:5,marginBottom:14}}/>
              <Lbl>Email</Lbl><input className="ifield" type="email" value={f.email} onChange={e=>s("email",e.target.value)} placeholder="o-teu@email.pt" style={{marginTop:5,marginBottom:14}}/>
              <Lbl>Palavra-passe</Lbl><input className="ifield" type="password" value={f.password} onChange={e=>s("password",e.target.value)} placeholder="Mín. 6 caracteres" style={{marginTop:5,marginBottom:14}}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
                <div><Lbl>Curso</Lbl><select className="ifield" value={f.course} onChange={e=>s("course",e.target.value)} style={{marginTop:5}}><option>Licenciatura em Enfermagem</option><option>Mestrado em Enfermagem</option><option>Pós-Licenciatura</option></select></div>
                <div><Lbl>Ano</Lbl><select className="ifield" value={f.year} onChange={e=>s("year",e.target.value)} style={{marginTop:5}}>{["1º Ano","2º Ano","3º Ano","4º Ano"].map(y=><option key={y}>{y}</option>)}</select></div>
              </div>
              {err&&<Err msg={err}/>}
              <button className="btn btn-dark" onClick={register} style={{width:"100%",padding:12,fontSize:14,borderRadius:10}}>Criar conta →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function HomePage({user,internships,logs,onOpen,onNew,onLogout}){
  const [showNew,setShowNew]=useState(false);
  const getStatus=i=>{const t=today();if(t<i.startDate)return{label:"Futuro",color:"#94A3B8",bg:"#F8FAFC"};if(t>i.endDate)return{label:"Concluído",color:"#10B981",bg:"#ECFDF5"};return{label:"Ativo",color:"#3B82F6",bg:"#EFF6FF"};};
  const prog=i=>{const h=logs.filter(l=>l.internshipId===i.id).reduce((s,l)=>s+l.hoursLogged,0);return{hours:h,pct:clamp(Math.round((h/i.totalHours)*100),0,100),entries:logs.filter(l=>l.internshipId===i.id).length};};
  return(
    <div style={{minHeight:"100vh",background:"#F1F5F9"}}>
      <nav style={{background:"#fff",borderBottom:"1.5px solid #E2E8F0",padding:"0 24px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:30,height:30,borderRadius:8,background:"#0F172A",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🩺</div>
          <span style={{fontSize:15,fontWeight:800,color:"#0F172A",letterSpacing:"-.4px"}}>EstágioCare</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:13,fontWeight:600,color:"#0F172A"}}>{user.name}</div>
            <div style={{fontSize:11,color:"#94A3B8"}}>{user.year}</div>
          </div>
          <div style={{width:32,height:32,borderRadius:99,background:"#0F172A",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff"}}>{user.name.charAt(0)}</div>
          <button className="btn btn-out" onClick={onLogout} style={{padding:"5px 12px",fontSize:12}}>Sair</button>
        </div>
      </nav>
      <div style={{maxWidth:1020,margin:"0 auto",padding:"36px 20px"}}>
        <div className="fade" style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:28}}>
          <div>
            <p style={{fontSize:11,fontWeight:700,color:"#94A3B8",letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:5}}>Os teus estágios</p>
            <h1 style={{fontSize:26,fontWeight:800,color:"#0F172A",letterSpacing:"-.6px"}}>Olá, {user.name.split(" ")[0]} 👋</h1>
          </div>
          <button className="btn btn-dark" onClick={()=>setShowNew(true)}>+ Novo Estágio</button>
        </div>
        {internships.length===0?(
          <div className="surface fade" style={{padding:"60px 32px",textAlign:"center",boxShadow:"none"}}>
            <div style={{fontSize:44,marginBottom:12}}>🏥</div>
            <p style={{fontSize:15,fontWeight:700,color:"#0F172A"}}>Ainda sem estágios</p>
            <p style={{fontSize:13,color:"#94A3B8",marginTop:4}}>Cria o teu primeiro estágio para começar</p>
          </div>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
            {internships.map((int,i)=>{
              const st=getStatus(int),pr=prog(int);
              const dLeft=int.endDate>=today()?diffDays(today(),int.endDate):0;
              return(
                <div key={int.id} className="surface hov-card fade" onClick={()=>onOpen(int)} style={{padding:0,overflow:"hidden",animationDelay:`${i*.06}s`,boxShadow:"none"}}>
                  <div style={{height:4,background:int.color||"#3B82F6"}}/>
                  <div style={{padding:"18px 20px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                      <div>
                        <h3 style={{fontSize:15,fontWeight:700,color:"#0F172A",letterSpacing:"-.3px",marginBottom:3}}>{int.name}</h3>
                        <p style={{fontSize:12,color:"#64748B"}}>🏥 {int.hospital}</p>
                        <p style={{fontSize:12,color:"#94A3B8",marginTop:2}}>🔬 {int.service}</p>
                      </div>
                      <span className="badge" style={{background:st.bg,color:st.color}}>{st.label}</span>
                    </div>
                    <div style={{marginBottom:14}}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#94A3B8",marginBottom:4}}>
                        <span>Horas registadas</span>
                        <span className="mono" style={{color:"#475569"}}>{pr.hours}h / {int.totalHours}h</span>
                      </div>
                      <div className="prog-track" style={{height:4}}>
                        <div className="prog-fill" style={{width:`${pr.pct}%`,height:"100%",background:int.color||"#3B82F6"}}/>
                      </div>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{display:"flex",gap:14}}>
                        {[{v:pr.entries,l:"registos"},{v:`${pr.pct}%`,l:"horas"},...(st.label==="Ativo"?[{v:dLeft,l:"dias",c:"#F59E0B"}]:[])].map((s,j)=>(
                          <div key={j}><div className="mono" style={{fontSize:15,fontWeight:700,color:s.c||"#0F172A"}}>{s.v}</div><div style={{fontSize:10,color:"#94A3B8"}}>{s.l}</div></div>
                        ))}
                      </div>
                      <div style={{fontSize:11,color:"#CBD5E1"}}>{fmt(int.startDate)} → {fmt(int.endDate)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {showNew&&<IntModal onSave={d=>{onNew(d);setShowNew(false);}} onClose={()=>setShowNew(false)}/>}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({user,int,logs:allLogs,comps,schedule,onAddLog,onUpdateLog,onSetComp,onSetShift,onBack}){
  const [tab,setTab]         = useState("week");
  const [weekOff,setWeekOff] = useState(0);
  const [selDate,setSelDate] = useState(today());
  const [anim,setAnim]       = useState("");
  const [calYear,setCalYear] = useState(new Date().getFullYear());
  const [calMonth,setCalMonth] = useState(new Date().getMonth());

  const iLogs  = allLogs.filter(l=>l.internshipId===int.id);
  const logMap = useMemo(()=>Object.fromEntries(iLogs.map(l=>[l.date,l])),[iLogs]);

  const hoursLogged = iLogs.reduce((s,l)=>s+l.hoursLogged,0);
  const hoursLeft   = Math.max(0,int.totalHours-hoursLogged);
  const daysTotal   = diffDays(int.startDate,int.endDate);
  const daysElapsed = clamp(diffDays(int.startDate,today()),0,daysTotal);
  const hoursPct    = clamp(Math.round((hoursLogged/int.totalHours)*100),0,100);
  const timePct     = daysTotal?Math.round((daysElapsed/daysTotal)*100):0;
  const allProcs    = iLogs.flatMap(l=>l.procedures);
  const procCounts  = allProcs.reduce((a,p)=>({...a,[p]:(a[p]||0)+1}),{});
  const topProcs    = Object.entries(procCounts).sort((a,b)=>b[1]-a[1]);
  const avgMood     = iLogs.length?iLogs.reduce((s,l)=>s+l.mood,0)/iLogs.length:null;
  const serviceComps= [...(COMPS[int.service]||[]),...GCOMPS];
  const compStatus  = id=>comps[`${int.id}_${id}`]||"pendente";
  const compDone    = serviceComps.filter(c=>compStatus(c.id)==="concluido").length;
  const compPct     = Math.round((compDone/serviceComps.length)*100);

  const getWeekDates=off=>{const now=new Date();const dow=now.getDay();const mon=new Date(now);mon.setDate(now.getDate()-dow+1+off*7);return Array.from({length:7},(_,i)=>{const d=new Date(mon);d.setDate(mon.getDate()+i);return d;});};
  const weekDates=getWeekDates(weekOff);
  const inInt=ds=>ds>=int.startDate&&ds<=int.endDate;
  const getShift=ds=>schedule[`${int.id}_${ds}`]||null;

  const changeWeek=dir=>{setAnim(dir>0?"slide-l":"slide-r");setWeekOff(w=>w+dir);setTimeout(()=>setAnim(""),300);};

  const firstDay  = new Date(calYear,calMonth,1).getDay();
  const daysInMon = new Date(calYear,calMonth+1,0).getDate();
  const calCells  = Array.from({length:firstDay+daysInMon},(_,i)=>i<firstDay?null:new Date(calYear,calMonth,i-firstDay+1));

  const TABS=[{id:"week",icon:"📅",label:"Semana"},{id:"calendar",icon:"🗓",label:"Calendário"},{id:"comps",icon:"✅",label:"Competências"},{id:"stats",icon:"📊",label:"Estatísticas"}];

  return(
    <div style={{minHeight:"100vh",background:"#F1F5F9"}}>
      {/* NAV */}
      <nav style={{background:"#fff",borderBottom:"1.5px solid #E2E8F0",padding:"0 20px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button className="btn btn-ghost" onClick={onBack} style={{fontSize:12,gap:3}}>← Estágios</button>
          <div style={{width:1,height:16,background:"#E2E8F0"}}/>
          <div style={{width:8,height:8,borderRadius:2,background:int.color||"#3B82F6"}}/>
          <span style={{fontSize:14,fontWeight:700,color:"#0F172A"}}>{int.name}</span>
          <span style={{fontSize:12,color:"#CBD5E1"}}>·</span>
          <span style={{fontSize:12,color:"#94A3B8"}}>{int.service}</span>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <span style={{fontSize:11,color:"#94A3B8"}}>Horas</span>
          <span className="mono" style={{fontSize:13,fontWeight:600,color:int.color||"#3B82F6"}}>{hoursLogged}/{int.totalHours}h</span>
          <div style={{width:56,height:4,background:"#F1F5F9",borderRadius:99,overflow:"hidden"}}>
            <div style={{width:`${hoursPct}%`,height:"100%",background:int.color||"#3B82F6",borderRadius:99}}/>
          </div>
        </div>
      </nav>

      {/* TABS */}
      <div style={{background:"#fff",borderBottom:"1.5px solid #E2E8F0",padding:"0 20px",display:"flex",overflowX:"auto"}}>
        {TABS.map(t=>(
          <button key={t.id} className="tab-btn" onClick={()=>setTab(t.id)}
            style={{color:tab===t.id?"#0F172A":"#94A3B8",fontWeight:tab===t.id?700:500,borderBottom:tab===t.id?"2.5px solid #0F172A":"2.5px solid transparent"}}>
            {t.icon} {t.label}
            {t.id==="comps"&&<span style={{fontSize:10,background:compPct===100?"#ECFDF5":"#F1F5F9",color:compPct===100?"#10B981":"#94A3B8",borderRadius:5,padding:"1px 5px",marginLeft:1}}>{compPct}%</span>}
          </button>
        ))}
      </div>

      <div style={{maxWidth:1080,margin:"0 auto",padding:"20px 16px"}}>

        {/* ═══ WEEK ═══ */}
        {tab==="week"&&(
          <div className="fade">
            {/* week nav */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <button className="btn-sq" onClick={()=>changeWeek(-1)}>‹</button>
                <span style={{fontSize:14,fontWeight:700,color:"#0F172A",minWidth:196,textAlign:"center"}}>{fmt(weekDates[0].toISOString().split("T")[0])} — {fmt(weekDates[6].toISOString().split("T")[0])}</span>
                <button className="btn-sq" onClick={()=>changeWeek(1)}>›</button>
                {weekOff!==0&&<button className="btn btn-ghost" onClick={()=>{setWeekOff(0);setSelDate(today());}} style={{fontSize:11}}>Hoje</button>}
              </div>
              <div style={{display:"flex",gap:10}}>
                {Object.entries(SHIFT_C).map(([s,c])=>(
                  <span key={s} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#64748B"}}>
                    <span style={{width:7,height:7,borderRadius:2,background:c,display:"inline-block"}}/>{s}
                  </span>
                ))}
              </div>
            </div>

            {/* 7 day chips */}
            <div className={anim} style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8,marginBottom:18}}>
              {weekDates.map((date,i)=>{
                const ds=date.toISOString().split("T")[0];
                const log=logMap[ds],inI=inInt(ds),isT=ds===today(),isSel=ds===selDate,isPast=ds<today();
                const shift=getShift(ds);
                const sc=log?SHIFT_C[log.shift]:shift?SHIFT_C[shift]:null;
                const missing=inI&&isPast&&!log;
                return(
                  <div key={i} className={`day-chip${isSel?" sel":""}${log?" done":""}`}
                    style={{"--ic":int.color||"#3B82F6","--sc":sc||"#E2E8F0",opacity:inI?1:.3,cursor:inI?"pointer":"default"}}
                    onClick={()=>{if(inI){setSelDate(ds);}}}>
                    <div style={{height:3,background:sc||"transparent"}}/>
                    <div style={{padding:"10px 8px 10px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                        <span style={{fontSize:10,fontWeight:700,color:isT?int.color||"#3B82F6":"#94A3B8",textTransform:"uppercase",letterSpacing:"1px"}}>{WDAYS[date.getDay()]}</span>
                        {missing&&<span style={{width:5,height:5,borderRadius:99,background:"#EF4444",flexShrink:0}}/>}
                      </div>
                      <div className="mono" style={{fontSize:20,fontWeight:700,color:isT?int.color||"#3B82F6":"#0F172A",lineHeight:1,marginBottom:6}}>{date.getDate()}</div>
                      {log?(
                        <>
                          <div style={{fontSize:10,fontWeight:600,color:SHIFT_C[log.shift],marginBottom:2}}>{SHIFT_IC[log.shift]} {log.shift}</div>
                          <div style={{fontSize:9,color:"#94A3B8"}}>{log.hoursLogged}h · {log.procedures.length}p</div>
                          <div style={{fontSize:14,marginTop:4}}>{MOOD_E[log.mood]}</div>
                        </>
                      ):shift?(
                        <>
                          <div style={{fontSize:10,color:SHIFT_C[shift],fontWeight:600}}>{SHIFT_IC[shift]} {shift}</div>
                          <div style={{fontSize:9,color:"#CBD5E1",marginTop:2}}>sem registo</div>
                        </>
                      ):inI?(
                        <div style={{fontSize:10,color:"#CBD5E1"}}>{isT?"hoje ✎":isPast?"em falta":"planeado"}</div>
                      ):null}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* INLINE DAY PANEL */}
            {selDate&&inInt(selDate)&&(
              <DayPanel key={selDate} date={selDate} log={logMap[selDate]} shift={getShift(selDate)}
                intColor={int.color} onSave={data=>{if(logMap[selDate])onUpdateLog(logMap[selDate].id,{...data,date:selDate});else onAddLog({...data,date:selDate});}}
                onSetShift={sh=>onSetShift(int.id,selDate,sh)}/>
            )}

            {/* week summary strip */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginTop:16}}>
              {[
                {icon:"📝",val:weekDates.filter(d=>logMap[d.toISOString().split("T")[0]]).length,label:"registos esta semana"},
                {icon:"⏱",val:`${weekDates.reduce((s,d)=>{const l=logMap[d.toISOString().split("T")[0]];return s+(l?l.hoursLogged:0);},0)}h`,label:"horas esta semana"},
                {icon:"🔴",val:weekDates.filter(d=>{const ds=d.toISOString().split("T")[0];return inInt(ds)&&ds<today()&&!logMap[ds];}).length,label:"dias em falta"},
                {icon:"✅",val:`${compPct}%`,label:"competências concluídas"},
              ].map((s,i)=>(
                <div key={i} className="surface" style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:10,boxShadow:"none"}}>
                  <span style={{fontSize:20}}>{s.icon}</span>
                  <div><div className="mono" style={{fontSize:18,fontWeight:700,color:"#0F172A"}}>{s.val}</div><div style={{fontSize:10,color:"#94A3B8"}}>{s.label}</div></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ CALENDAR ═══ */}
        {tab==="calendar"&&(
          <div className="fade">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <button className="btn-sq" onClick={()=>{let m=calMonth-1,y=calYear;if(m<0){m=11;y--;}setCalMonth(m);setCalYear(y);}}>‹</button>
                <span style={{fontSize:15,fontWeight:700,color:"#0F172A",minWidth:170,textAlign:"center"}}>{MONTHS[calMonth]} {calYear}</span>
                <button className="btn-sq" onClick={()=>{let m=calMonth+1,y=calYear;if(m>11){m=0;y++;}setCalMonth(m);setCalYear(y);}}>›</button>
              </div>
              <div style={{display:"flex",gap:10}}>{Object.entries(SHIFT_C).map(([s,c])=><span key={s} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#64748B"}}><span style={{width:7,height:7,borderRadius:2,background:c,display:"inline-block"}}/>{s}</span>)}</div>
            </div>
            <div className="surface" style={{padding:16,boxShadow:"none"}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:6}}>
                {WDAYS.map(d=><div key={d} style={{textAlign:"center",fontSize:10,fontWeight:700,color:"#CBD5E1",padding:"3px 0",letterSpacing:"1px"}}>{d}</div>)}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
                {calCells.map((date,i)=>{
                  if(!date)return<div key={i}/>;
                  const ds=date.toISOString().split("T")[0];
                  const log=logMap[ds],inI=inInt(ds),isT=ds===today(),past=ds<today();
                  const sc=log?SHIFT_C[log.shift]:null;
                  return(
                    <div key={i} onClick={()=>{if(inI){setSelDate(ds);setTab("week");const d=new Date(ds);const now=new Date();const diff=Math.round((d-now)/604800000);setWeekOff(Math.round(diff));}}}
                      style={{minHeight:60,padding:"6px 7px",borderRadius:9,cursor:inI?"pointer":"default",
                        background:log?`${sc}10`:inI?"#fff":"transparent",
                        border:`1.5px solid ${isT?int.color||"#3B82F6":log?`${sc}55`:inI?"#E2E8F0":"transparent"}`,
                        opacity:inI?1:.22,transition:"all .13s",position:"relative"}}
                      className={inI?"hov-card":""}>
                      <div style={{fontSize:12,fontWeight:600,color:isT?int.color||"#3B82F6":"#475569"}}>{date.getDate()}</div>
                      {log&&<><div style={{fontSize:9,fontWeight:600,color:sc,marginTop:2}}>{SHIFT_IC[log.shift]} {log.shift}</div><div style={{position:"absolute",bottom:4,right:5,fontSize:11}}>{MOOD_E[log.mood]}</div></>}
                      {!log&&inI&&past&&<div style={{position:"absolute",bottom:4,right:5,width:5,height:5,borderRadius:99,background:"#EF4444"}}/>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginTop:14}}>
              {[
                {icon:"📝",val:iLogs.filter(l=>l.date.startsWith(`${calYear}-${String(calMonth+1).padStart(2,"0")}`)).length,label:"registos este mês"},
                {icon:"⏱",val:`${iLogs.filter(l=>l.date.startsWith(`${calYear}-${String(calMonth+1).padStart(2,"0")}`)).reduce((s,l)=>s+l.hoursLogged,0)}h`,label:"horas este mês"},
                {icon:"🔬",val:allProcs.length,label:"procedimentos totais"},
                {icon:"✅",val:`${compPct}%`,label:"competências"},
              ].map((s,i)=>(
                <div key={i} className="surface" style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:10,boxShadow:"none"}}>
                  <span style={{fontSize:20}}>{s.icon}</span>
                  <div><div className="mono" style={{fontSize:18,fontWeight:700,color:"#0F172A"}}>{s.val}</div><div style={{fontSize:10,color:"#94A3B8"}}>{s.label}</div></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ COMPETÊNCIAS ═══ */}
        {tab==="comps"&&(
          <div className="fade">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:16}}>
              <div>
                <h2 style={{fontSize:18,fontWeight:800,color:"#0F172A",letterSpacing:"-.4px"}}>Competências</h2>
                <p style={{fontSize:12,color:"#94A3B8",marginTop:2}}>{int.service} · {serviceComps.length} competências</p>
              </div>
              <div style={{textAlign:"right"}}>
                <div className="mono" style={{fontSize:24,fontWeight:700,color:int.color||"#3B82F6"}}>{compPct}%</div>
                <div style={{fontSize:11,color:"#94A3B8"}}>{compDone} concluídas</div>
              </div>
            </div>
            <div className="surface" style={{padding:"14px 18px",marginBottom:14,boxShadow:"none"}}>
              <div style={{display:"flex",gap:14,marginBottom:10}}>
                {[{l:"Concluído",k:"concluido",c:"#10B981"},{l:"Em progresso",k:"em_progresso",c:"#F59E0B"},{l:"Pendente",k:"pendente",c:"#CBD5E1"}].map(s=>{
                  const n=serviceComps.filter(c=>compStatus(c.id)===s.k).length;
                  return<div key={s.k} style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:8,height:8,borderRadius:2,background:s.c,display:"inline-block"}}/><span style={{fontSize:12,color:"#475569"}}>{s.l}</span><span className="mono" style={{fontSize:12,color:s.c,fontWeight:600}}>{n}</span></div>;
                })}
              </div>
              <div className="prog-track" style={{height:6}}>
                <div style={{height:"100%",display:"flex",overflow:"hidden",borderRadius:99}}>
                  <div style={{width:`${Math.round((serviceComps.filter(c=>compStatus(c.id)==="concluido").length/serviceComps.length)*100)}%`,background:"#10B981",transition:"width .6s"}}/>
                  <div style={{width:`${Math.round((serviceComps.filter(c=>compStatus(c.id)==="em_progresso").length/serviceComps.length)*100)}%`,background:"#F59E0B",transition:"width .6s"}}/>
                </div>
              </div>
            </div>
            {Object.entries(serviceComps.reduce((a,c)=>{if(!a[c.cat])a[c.cat]=[];a[c.cat].push(c);return a;},{})).map(([cat,items])=>(
              <div key={cat} className="surface" style={{marginBottom:10,overflow:"hidden",boxShadow:"none"}}>
                <div style={{padding:"10px 16px",borderBottom:"1px solid #F1F5F9",background:"#FAFAFA"}}>
                  <span style={{fontSize:10,fontWeight:700,color:"#94A3B8",letterSpacing:"1px",textTransform:"uppercase"}}>{cat}</span>
                </div>
                {items.map(comp=>{
                  const st=compStatus(comp.id);
                  const [bg,col,ic]=st==="concluido"?["#ECFDF5","#10B981","✓"]:st==="em_progresso"?["#FFFBEB","#F59E0B","◐"]:["#fff","#CBD5E1","○"];
                  return(
                    <div key={comp.id} className="comp-row" onClick={()=>{const next=st==="pendente"?"em_progresso":st==="em_progresso"?"concluido":"pendente";onSetComp(int.id,comp.id,next);}}>
                      <div style={{width:24,height:24,borderRadius:7,background:bg,border:`1.5px solid ${col}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:col,flexShrink:0,fontWeight:700}}>{ic}</div>
                      <span style={{fontSize:13,color:st==="concluido"?"#94A3B8":"#0F172A",textDecoration:st==="concluido"?"line-through":"none",flex:1}}>{comp.label}</span>
                      <span style={{fontSize:11,color:col,fontWeight:600}}>{st==="concluido"?"Concluído":st==="em_progresso"?"Em progresso":"Pendente"}</span>
                    </div>
                  );
                })}
              </div>
            ))}
            <p style={{fontSize:11,color:"#94A3B8",textAlign:"center",marginTop:8}}>Clica numa competência para alternar entre estados</p>
          </div>
        )}

        {/* ═══ STATS ═══ */}
        {tab==="stats"&&(
          <div className="fade">
            <h2 style={{fontSize:18,fontWeight:800,color:"#0F172A",letterSpacing:"-.4px",marginBottom:16}}>Estatísticas</h2>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:14}}>
              {[
                {label:"Horas registadas",val:`${hoursLogged}h`,sub:`${hoursLeft}h em falta`,pct:hoursPct,color:int.color||"#3B82F6"},
                {label:"Progresso temporal",val:`${timePct}%`,sub:`${Math.max(0,daysTotal-daysElapsed)} dias restantes`,pct:timePct,color:"#8B5CF6"},
                {label:"Competências",val:`${compPct}%`,sub:`${compDone} de ${serviceComps.length}`,pct:compPct,color:"#10B981"},
              ].map((s,i)=>(
                <div key={i} className="surface" style={{padding:"18px 20px",boxShadow:"none"}}>
                  <Lbl>{s.label}</Lbl>
                  <div className="mono" style={{fontSize:26,fontWeight:700,color:s.color,marginTop:8}}>{s.val}</div>
                  <div style={{fontSize:11,color:"#94A3B8",marginTop:3}}>{s.sub}</div>
                  <div className="prog-track" style={{height:4,marginTop:12}}><div className="prog-fill" style={{width:`${s.pct}%`,height:"100%",background:s.color}}/></div>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div className="surface" style={{padding:20,boxShadow:"none"}}>
                <div style={{fontWeight:700,fontSize:13,color:"#0F172A",marginBottom:14}}>Procedimentos Realizados</div>
                {topProcs.length===0?<p style={{fontSize:13,color:"#94A3B8"}}>Sem dados.</p>:topProcs.slice(0,8).map(([p,c])=>(
                  <div key={p} style={{marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}><span style={{color:"#475569"}}>{p}</span><span className="mono" style={{color:int.color||"#3B82F6",fontSize:12}}>{c}×</span></div>
                    <div className="prog-track" style={{height:3}}><div className="prog-fill" style={{width:`${(c/topProcs[0][1])*100}%`,height:"100%",background:int.color||"#3B82F6"}}/></div>
                  </div>
                ))}
              </div>
              <div className="surface" style={{padding:20,boxShadow:"none"}}>
                <div style={{fontWeight:700,fontSize:13,color:"#0F172A",marginBottom:14}}>Bem-estar ao Longo do Tempo</div>
                {iLogs.length===0?<p style={{fontSize:13,color:"#94A3B8"}}>Sem dados.</p>:[...iLogs].sort((a,b)=>a.date.localeCompare(b.date)).map(l=>(
                  <div key={l.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                    <span className="mono" style={{fontSize:10,color:"#94A3B8",minWidth:52}}>{fmt(l.date)}</span>
                    <div style={{flex:1,display:"flex",gap:3}}>{[1,2,3,4,5].map(v=><div key={v} style={{flex:1,height:5,borderRadius:3,background:v<=l.mood?MOOD_COL[l.mood]:"#F1F5F9"}}/>)}</div>
                    <span style={{fontSize:13}}>{MOOD_E[l.mood]}</span>
                  </div>
                ))}
              </div>
              <div className="surface" style={{padding:20,gridColumn:"span 2",boxShadow:"none"}}>
                <div style={{fontWeight:700,fontSize:13,color:"#0F172A",marginBottom:14}}>Resumo Completo</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
                  {[{label:"Horas registadas",val:`${hoursLogged}h`,color:int.color||"#3B82F6"},{label:"Horas em falta",val:`${hoursLeft}h`,color:"#EF4444"},{label:"Total procedimentos",val:allProcs.length,color:"#8B5CF6"},{label:"Tipos diferentes",val:Object.keys(procCounts).length,color:"#0EA5E9"},{label:"Doentes acompanhados",val:iLogs.reduce((s,l)=>s+l.patients,0),color:"#F59E0B"},{label:"Bem-estar médio",val:avgMood?`${avgMood.toFixed(1)}/5`:"—",color:MOOD_COL[Math.round(avgMood)]||"#94A3B8"}].map(r=>(
                    <div key={r.label} style={{borderLeft:`3px solid ${r.color}`,paddingLeft:12}}>
                      <div className="mono" style={{fontSize:20,fontWeight:700,color:r.color}}>{r.val}</div>
                      <div style={{fontSize:11,color:"#94A3B8",marginTop:2}}>{r.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DAY PANEL ────────────────────────────────────────────────────────────────
function DayPanel({date,log,shift,intColor,onSave,onSetShift}){
  const [f,setF]=useState({shift:log?.shift||shift||"Manhã",hoursLogged:log?.hoursLogged??8,procedures:log?.procedures??[],patients:log?.patients??1,mood:log?.mood??3,reflection:log?.reflection??""});
  const [saved,setSaved]=useState(false);
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  const toggle=p=>setF(prev=>({...prev,procedures:prev.procedures.includes(p)?prev.procedures.filter(x=>x!==p):[...prev.procedures,p]}));

  useEffect(()=>{setF({shift:log?.shift||shift||"Manhã",hoursLogged:log?.hoursLogged??8,procedures:log?.procedures??[],patients:log?.patients??1,mood:log?.mood??3,reflection:log?.reflection??""});setSaved(false);},[date]);

  const handleSave=()=>{onSave(f);onSetShift(f.shift);setSaved(true);setTimeout(()=>setSaved(false),2200);};
  const [y,m,dd]=date.split("-");
  const dateObj=new Date(date);
  const isToday=date===today(),isPast=date<today();
  const ic=intColor||"#3B82F6";

  return(
    <div className="surface fade" style={{overflow:"hidden",boxShadow:"0 4px 24px rgba(0,0,0,.07)"}}>
      {/* header strip */}
      <div style={{background:ic,padding:"16px 22px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,.65)",letterSpacing:"1px",textTransform:"uppercase",marginBottom:3}}>
            {WDAYS[dateObj.getDay()]} {isToday?"· Hoje":isPast?"· Passado":"· Futuro"}
          </div>
          <div style={{fontSize:22,fontWeight:800,color:"#fff",letterSpacing:"-.5px"}}>{dd} / {m} / {y}</div>
        </div>
        {log&&<div style={{background:"rgba(255,255,255,.2)",borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:600,color:"#fff",display:"flex",alignItems:"center",gap:4}}>✓ Já registado</div>}
      </div>

      <div style={{padding:"20px 22px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        {/* LEFT col */}
        <div style={{display:"flex",flexDirection:"column",gap:18}}>
          {/* shift */}
          <div>
            <Lbl>Turno</Lbl>
            <div style={{display:"flex",gap:5,marginTop:7,flexWrap:"wrap"}}>
              {Object.keys(SHIFT_C).map(sh=>(
                <button key={sh} onClick={()=>s("shift",sh)}
                  style={{padding:"6px 11px",borderRadius:8,border:`1.5px solid ${f.shift===sh?SHIFT_C[sh]:"#E2E8F0"}`,background:f.shift===sh?`${SHIFT_C[sh]}12`:"#fff",color:f.shift===sh?SHIFT_C[sh]:"#94A3B8",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all .13s"}}>
                  {SHIFT_IC[sh]} {sh}
                </button>
              ))}
            </div>
          </div>

          {/* hours + patients */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div>
              <Lbl>Horas</Lbl>
              <div style={{display:"flex",alignItems:"center",gap:6,marginTop:7}}>
                <button className="spin-btn" onClick={()=>s("hoursLogged",Math.max(0,f.hoursLogged-1))}>−</button>
                <span className="mono" style={{fontSize:22,fontWeight:700,color:"#0F172A",minWidth:32,textAlign:"center"}}>{f.hoursLogged}</span>
                <button className="spin-btn" onClick={()=>s("hoursLogged",Math.min(12,f.hoursLogged+1))}>+</button>
              </div>
            </div>
            <div>
              <Lbl>Doentes</Lbl>
              <div style={{display:"flex",alignItems:"center",gap:6,marginTop:7}}>
                <button className="spin-btn" onClick={()=>s("patients",Math.max(0,f.patients-1))}>−</button>
                <span className="mono" style={{fontSize:22,fontWeight:700,color:"#0F172A",minWidth:32,textAlign:"center"}}>{f.patients}</span>
                <button className="spin-btn" onClick={()=>s("patients",f.patients+1)}>+</button>
              </div>
            </div>
          </div>

          {/* mood */}
          <div>
            <Lbl>Como foi o dia?</Lbl>
            <div style={{display:"flex",gap:6,marginTop:7}}>
              {[1,2,3,4,5].map(v=>(
                <button key={v} onClick={()=>s("mood",v)}
                  style={{flex:1,padding:"9px 3px",borderRadius:9,cursor:"pointer",fontFamily:"inherit",transition:"all .13s",border:`1.5px solid ${f.mood===v?MOOD_COL[v]:"#E2E8F0"}`,background:f.mood===v?`${MOOD_COL[v]}10`:"#fff",color:f.mood===v?MOOD_COL[v]:"#CBD5E1"}}>
                  <div style={{fontSize:20,marginBottom:2}}>{MOOD_E[v]}</div>
                  <div style={{fontSize:9,fontWeight:600}}>{MOOD_L[v]}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT col */}
        <div style={{display:"flex",flexDirection:"column",gap:18}}>
          {/* procedures */}
          <div style={{flex:1}}>
            <Lbl>Procedimentos <span style={{color:"#94A3B8",fontWeight:400,textTransform:"none",letterSpacing:0,fontSize:10}}>({f.procedures.length} selecionados)</span></Lbl>
            <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:7}}>
              {PROCS.map(p=><button key={p} className={`proc-btn${f.procedures.includes(p)?" on":""}`} onClick={()=>toggle(p)}>{p}</button>)}
            </div>
          </div>

          {/* reflection */}
          <div>
            <Lbl>Reflexão</Lbl>
            <textarea className="ifield" value={f.reflection} onChange={e=>s("reflection",e.target.value)} rows={4}
              placeholder="Como correu o dia? O que aprendeu? O que quer melhorar?"
              style={{marginTop:7,resize:"vertical"}}/>
          </div>
        </div>
      </div>

      {/* save button */}
      <div style={{padding:"0 22px 20px"}}>
        <button className="btn" onClick={handleSave}
          style={{width:"100%",padding:13,fontSize:14,borderRadius:11,background:saved?"#10B981":ic,color:"#fff",transition:"background .3s",fontWeight:700}}>
          {saved?"✓ Guardado com sucesso!":"Guardar Registo"}
        </button>
      </div>
    </div>
  );
}

// ─── INT MODAL ────────────────────────────────────────────────────────────────
function IntModal({onSave,onClose}){
  const [f,setF]=useState({name:"",hospital:"",service:"Cirurgia Geral",supervisor:"",startDate:"",endDate:"",totalHours:"",objectives:"",color:"#3B82F6"});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  const dur=f.startDate&&f.endDate?diffDays(f.startDate,f.endDate):null;
  const ok=f.name&&f.hospital&&f.startDate&&f.endDate&&f.totalHours;
  return(
    <div className="overlay" onClick={onClose}>
      <div className="modal fade" onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:18,fontWeight:800,color:"#0F172A",letterSpacing:"-.4px",marginBottom:22}}>Novo Estágio</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div style={{gridColumn:"span 2"}}><Lbl>Nome *</Lbl><input className="ifield" value={f.name} onChange={e=>s("name",e.target.value)} placeholder="Ex: Cirurgia 2A" style={{marginTop:5}}/></div>
          <div><Lbl>Hospital *</Lbl><input className="ifield" value={f.hospital} onChange={e=>s("hospital",e.target.value)} placeholder="Ex: Hospital de Santa Maria" style={{marginTop:5}}/></div>
          <div><Lbl>Serviço</Lbl><select className="ifield" value={f.service} onChange={e=>s("service",e.target.value)} style={{marginTop:5}}>{["Cirurgia Geral","Medicina Interna","Urgência","Pediatria","Outro"].map(sv=><option key={sv}>{sv}</option>)}</select></div>
          <div><Lbl>Supervisor</Lbl><input className="ifield" value={f.supervisor} onChange={e=>s("supervisor",e.target.value)} placeholder="Ex: Enf.ª Ana Silva" style={{marginTop:5}}/></div>
          <div><Lbl>Total de Horas *</Lbl><input className="ifield" type="number" value={f.totalHours} onChange={e=>s("totalHours",e.target.value)} placeholder="Ex: 420" style={{marginTop:5}}/></div>
          <div><Lbl>Data de Início *</Lbl><input className="ifield" type="date" value={f.startDate} onChange={e=>s("startDate",e.target.value)} style={{marginTop:5}}/></div>
          <div>
            <Lbl>Data de Fim *</Lbl><input className="ifield" type="date" value={f.endDate} onChange={e=>s("endDate",e.target.value)} style={{marginTop:5}}/>
            {dur&&<div style={{fontSize:11,color:"#3B82F6",marginTop:4,fontWeight:600}}>⏱ {dur} dias</div>}
          </div>
          <div style={{gridColumn:"span 2"}}><Lbl>Cor</Lbl><div style={{display:"flex",gap:7,marginTop:7}}>{INT_COLS.map(c=><button key={c} onClick={()=>s("color",c)} style={{width:26,height:26,borderRadius:7,background:c,border:f.color===c?"3px solid #0F172A":"3px solid transparent",cursor:"pointer"}}/>)}</div></div>
          <div style={{gridColumn:"span 2"}}><Lbl>Objetivos</Lbl><textarea className="ifield" value={f.objectives} onChange={e=>s("objectives",e.target.value)} rows={3} style={{marginTop:5,resize:"vertical"}}/></div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:22}}>
          <button className="btn btn-dark" onClick={()=>ok&&onSave({...f,totalHours:parseInt(f.totalHours)})} style={{flex:1,padding:12,borderRadius:11,fontSize:14,opacity:ok?1:.4}}>Criar Estágio</button>
          <button className="btn btn-out" onClick={onClose} style={{flex:1,padding:12,borderRadius:11,fontSize:14}}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ─── ATOMS ────────────────────────────────────────────────────────────────────
const Lbl=({children,style})=><div style={{fontSize:10,fontWeight:700,color:"#94A3B8",letterSpacing:"1px",textTransform:"uppercase",...style}}>{children}</div>;
const Err=({msg})=><div style={{fontSize:12,color:"#EF4444",marginTop:10,padding:"8px 12px",background:"#FEF2F2",borderRadius:8,border:"1px solid #FECACA"}}>{msg}</div>;
