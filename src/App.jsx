import { useState, useEffect, useCallback, useRef } from "react";

// ── Default tasks ──────────────────────────────────────────────
const DEFAULT_WFH = [
  { id:"wfh1",  time:"7:00",  label:"Wake up — No phone. Water. Breathe.", category:"Morning", icon:"🌅" },
  { id:"wfh2",  time:"7:10",  label:"Morning journal (3 sentences)",        category:"Morning", icon:"✍️" },
  { id:"wfh3",  time:"7:20",  label:"Get ready & breakfast mindfully",      category:"Morning", icon:"🍳" },
  { id:"wfh4",  time:"8:00",  label:"GitHub — Part 1 (1 hour)",             category:"GitHub",  icon:"💻" },
  { id:"wfh5",  time:"10:00", label:"Walk outside. Prepare for work.",      category:"Health",  icon:"🚶" },
  { id:"wfh6",  time:"11:00", label:"Work starts — Pick ONE task",          category:"Work",    icon:"▶️" },
  { id:"wfh7",  time:"1:00",  label:"Break — Step away fully",              category:"Break",   icon:"☕" },
  { id:"wfh8",  time:"4:15",  label:"Stretch + emotion check-in",           category:"Health",  icon:"🧘" },
  { id:"wfh9",  time:"7:30",  label:"Work ends — Close mentally",           category:"Work",    icon:"◼️" },
  { id:"wfh10", time:"8:00",  label:"GitHub — Part 2 (1 hour)",             category:"GitHub",  icon:"💻" },
  { id:"wfh11", time:"9:00",  label:"Dinner — no screens 15 mins",          category:"Evening", icon:"🍽️" },
  { id:"wfh12", time:"9:30",  label:"10 min silence — no phone",            category:"Evening", icon:"🔇" },
  { id:"wfh13", time:"10:00", label:"Night journal (3 questions)",           category:"Evening", icon:"📔" },
  { id:"wfh14", time:"10:30", label:"Sleep",                                category:"Sleep",   icon:"🌙" },
];
const DEFAULT_OFFICE = [
  { id:"off1",  time:"6:30",  label:"Wake up — No phone. Water. Breathe.",  category:"Morning", icon:"🌅" },
  { id:"off2",  time:"6:40",  label:"Morning journal (3 sentences)",         category:"Morning", icon:"✍️" },
  { id:"off3",  time:"6:50",  label:"Get ready + breakfast mindfully",       category:"Morning", icon:"🍳" },
  { id:"off4",  time:"8:35",  label:"Commute — observe, don't scroll",       category:"Morning", icon:"🚌" },
  { id:"off5",  time:"10:00", label:"Work starts — Pick ONE priority",       category:"Work",    icon:"▶️" },
  { id:"off6",  time:"12:30", label:"Lunch — no phone for 15 mins",          category:"Break",   icon:"☕" },
  { id:"off7",  time:"3:30",  label:"Emotion check-in + stretch",            category:"Health",  icon:"🧘" },
  { id:"off8",  time:"6:00",  label:"Wrap up — plan tomorrow's task",        category:"Work",    icon:"📋" },
  { id:"off9",  time:"6:30",  label:"Work ends — Be present now",            category:"Work",    icon:"◼️" },
  { id:"off10", time:"8:00",  label:"Home — freshen up, dinner slowly",      category:"Evening", icon:"🍽️" },
  { id:"off11", time:"8:30",  label:"GitHub — 1 hour focused session",       category:"GitHub",  icon:"💻" },
  { id:"off12", time:"9:30",  label:"GitHub continued OR wind down",         category:"GitHub",  icon:"💻" },
  { id:"off13", time:"10:00", label:"10 min silence — no phone",             category:"Evening", icon:"🔇" },
  { id:"off14", time:"10:15", label:"Night journal (3 questions)",            category:"Evening", icon:"📔" },
  { id:"off15", time:"10:30", label:"Sleep",                                 category:"Sleep",   icon:"🌙" },
];

const CAT_LIST = ["Morning","GitHub","Work","Health","Break","Evening","Sleep","Custom"];
const CAT = {
  Morning:{ accent:"#6C63FF", light:"rgba(108,99,255,0.12)" },
  GitHub: { accent:"#00C896", light:"rgba(0,200,150,0.12)"  },
  Work:   { accent:"#FF6B35", light:"rgba(255,107,53,0.12)" },
  Health: { accent:"#38BDF8", light:"rgba(56,189,248,0.12)" },
  Break:  { accent:"#FFB347", light:"rgba(255,179,71,0.12)" },
  Evening:{ accent:"#A78BFA", light:"rgba(167,139,250,0.12)"},
  Sleep:  { accent:"#3B82F6", light:"rgba(59,130,246,0.12)" },
  Custom: { accent:"#F472B6", light:"rgba(244,114,182,0.12)"},
};
const ICONS = ["🌅","✍️","🍳","💻","🚶","▶️","☕","🧘","◼️","🍽️","🔇","📔","🌙","🚌","📋","🏃","📚","💪","🎯","🧠","🔥","⚡","🌿","🎵"];

const WFH_DATES = ["2026-03-05","2026-03-06","2026-03-07"];
function toLocal(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function getTodayLocal(){ return toLocal(new Date()); }
function isWFH(ds){ return WFH_DATES.includes(ds); }
function dateLabel(ds){ const [y,m,d]=ds.split("-").map(Number); return new Date(y,m-1,d).toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"}); }
function fullDate(ds){ const [y,m,d]=ds.split("-").map(Number); return new Date(y,m-1,d).toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"}); }
function last30(){ return Array.from({length:30},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-i); return toLocal(d); }).reverse(); }
function last7(){ return Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(i+1)); return toLocal(d); }); }
function uid(){ return "t"+Math.random().toString(36).slice(2,8); }

const ls={
  get:k=>{ try{return localStorage.getItem(k);}catch{return null;} },
  set:(k,v)=>{ try{localStorage.setItem(k,v);}catch{} },
};

function loadTasks(key, defaults){
  const raw=ls.get(key);
  if(raw){ try{ return JSON.parse(raw); }catch{} }
  return defaults;
}

function computeStreak(today, wfhTasks, officeTasks){
  let s=0,i=1;
  while(i<=365){
    const d=new Date(); d.setDate(d.getDate()-i);
    const ds=toLocal(d);
    const raw=ls.get(`tracker:${ds}`);
    if(!raw) break;
    try{
      const c=JSON.parse(raw);
      const t=isWFH(ds)?wfhTasks:officeTasks;
      if(Object.values(c).filter(Boolean).length===t.length){s++;i++;}
      else break;
    }catch{ break; }
  }
  return s;
}

// ── Main App ────────────────────────────────────────────────────
export default function App(){
  const today=getTodayLocal();
  const wfh=isWFH(today);

  const [wfhTasks,setWfhTasks]     = useState(()=>loadTasks("tasks:wfh",DEFAULT_WFH));
  const [officeTasks,setOfficeTasks]= useState(()=>loadTasks("tasks:office",DEFAULT_OFFICE));
  const tasks = wfh ? wfhTasks : officeTasks;
  const setTasks = wfh ? setWfhTasks : setOfficeTasks;
  const taskKey = wfh ? "tasks:wfh" : "tasks:office";
  const cats=[...new Set(tasks.map(t=>t.category))];

  const [checked,setChecked]       = useState({});
  const [loaded,setLoaded]         = useState(false);
  const [tab,setTab]               = useState("today");
  const [editMode,setEditMode]     = useState(false);
  const [editingId,setEditingId]   = useState(null);
  const [editDraft,setEditDraft]   = useState(null);
  const [iconPicker,setIconPicker] = useState(false);
  const [shareModal,setShareModal] = useState(false);
  const [shareText,setShareText]   = useState("");
  const [journalOpen,setJournalOpen]=useState(false);
  const [journal,setJournal]       = useState({priority:"",avoiding:"",truth:"",emotion:"",better:""});
  const [streak,setStreak]         = useState(0);
  const [isMobile,setIsMobile]     = useState(window.innerWidth<768);
  const [toast,setToast]           = useState(null);

  useEffect(()=>{
    const h=()=>setIsMobile(window.innerWidth<768);
    window.addEventListener("resize",h);
    return()=>window.removeEventListener("resize",h);
  },[]);

  useEffect(()=>{
    const raw=ls.get(`tracker:${today}`);
    if(raw){try{setChecked(JSON.parse(raw));}catch{}}
    const rj=ls.get(`journal:${today}`);
    if(rj){try{setJournal(JSON.parse(rj));}catch{}}
    setStreak(computeStreak(today,wfhTasks,officeTasks));
    setLoaded(true);
  },[]);

  useEffect(()=>{
    if(!loaded) return;
    ls.set(`tracker:${today}`,JSON.stringify(checked));
    setStreak(computeStreak(today,wfhTasks,officeTasks));
  },[checked,loaded]);

  const toggle=useCallback(id=>{
    setChecked(prev=>({...prev,[id]:!prev[id]}));
  },[]);

  const saveJournal=()=>{ ls.set(`journal:${today}`,JSON.stringify(journal)); setJournalOpen(false); showToast("Journal saved ✓"); };

  const showToast=(msg)=>{
    setToast(msg);
    setTimeout(()=>setToast(null),2200);
  };

  // ── Edit helpers ──
  const startEdit=(task)=>{
    setEditingId(task.id);
    setEditDraft({...task});
    setIconPicker(false);
  };

  const cancelEdit=()=>{ setEditingId(null); setEditDraft(null); setIconPicker(false); };

  const saveEdit=()=>{
    if(!editDraft.label.trim()){ showToast("Task name can't be empty"); return; }
    const updated=tasks.map(t=>t.id===editDraft.id?{...editDraft}:t);
    setTasks(updated);
    ls.set(taskKey,JSON.stringify(updated));
    setEditingId(null);
    setEditDraft(null);
    showToast("Task updated ✓");
  };

  const deleteTask=(id)=>{
    const updated=tasks.filter(t=>t.id!==id);
    setTasks(updated);
    ls.set(taskKey,JSON.stringify(updated));
    showToast("Task deleted");
  };

  const addTask=()=>{
    const newTask={ id:uid(), time:"9:00", label:"New task", category:"Morning", icon:"🎯" };
    const updated=[...tasks, newTask];
    setTasks(updated);
    ls.set(taskKey,JSON.stringify(updated));
    startEdit(newTask);
  };

  const moveTask=(id, dir)=>{
    const idx=tasks.findIndex(t=>t.id===id);
    if(dir==="up"&&idx===0) return;
    if(dir==="down"&&idx===tasks.length-1) return;
    const arr=[...tasks];
    const swap=dir==="up"?idx-1:idx+1;
    [arr[idx],arr[swap]]=[arr[swap],arr[idx]];
    setTasks(arr);
    ls.set(taskKey,JSON.stringify(arr));
  };

  const resetTasks=()=>{
    const def=wfh?[...DEFAULT_WFH]:[...DEFAULT_OFFICE];
    setTasks(def);
    ls.set(taskKey,JSON.stringify(def));
    showToast("Reset to defaults ✓");
  };

  // ── Share / Export ──
  const openShare=()=>{
    const lines=tasks.map(t=>`${t.time.padEnd(6)} | ${t.icon} ${t.label.padEnd(40)} | ${t.category}`);
    const header=`${wfh?"🏡 WFH":"🏢 OFFICE"} DAILY SCHEDULE\n${"─".repeat(60)}\n`;
    const footer=`\n${"─".repeat(60)}\nGenerated by Habit Tracker`;
    setShareText(header+lines.join("\n")+footer);
    setShareModal(true);
  };

  const copyShare=()=>{
    try{ navigator.clipboard.writeText(shareText); showToast("Copied to clipboard!"); }
    catch{ showToast("Select and copy manually"); }
  };

  const done=Object.values(checked).filter(Boolean).length;
  const total=tasks.length;
  const pct=total>0?Math.round((done/total)*100):0;
  const ghTasks=tasks.filter(t=>t.category==="GitHub");
  const ghDone=ghTasks.filter(t=>checked[t.id]).length;

  const heatColor=p=>{
    if(p<0)  return "rgba(255,255,255,0.04)";
    if(p===0) return "rgba(255,107,53,0.2)";
    if(p<50)  return "rgba(255,179,71,0.3)";
    if(p<80)  return "rgba(0,200,150,0.35)";
    return "rgba(0,200,150,0.85)";
  };
  const getDayData=ds=>{ const r=ls.get(`tracker:${ds}`); if(!r) return null; try{return JSON.parse(r);}catch{return null;} };
  const getDayPct=ds=>{ const c=getDayData(ds); if(!c) return null; const t=isWFH(ds)?wfhTasks:officeTasks; return Math.round((Object.values(c).filter(Boolean).length/t.length)*100); };

  // ── Edit Row Component ──
  const EditRow=({task})=>(
    <div style={{padding:"10px 14px",borderBottom:"1px solid rgba(255,255,255,0.04)",background:"rgba(108,99,255,0.08)",border:"1px solid rgba(108,99,255,0.2)",borderRadius:"10px",margin:"4px 0"}}>
      {/* Icon picker trigger + label */}
      <div style={{display:"flex",gap:"8px",marginBottom:"8px",alignItems:"center"}}>
        <button className="btn" onMouseDown={()=>setIconPicker(p=>!p)} style={{fontSize:"18px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"8px",padding:"4px 8px",cursor:"pointer"}}>
          {editDraft.icon}
        </button>
        <input
          style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(108,99,255,0.4)",borderRadius:"8px",color:"#E8E8F0",padding:"7px 10px",fontFamily:"'DM Sans',sans-serif",fontSize:"13px",outline:"none"}}
          value={editDraft.label}
          onChange={e=>setEditDraft(p=>({...p,label:e.target.value}))}
          placeholder="Task name"
          autoFocus
        />
      </div>
      {/* Icon picker */}
      {iconPicker&&(
        <div style={{display:"flex",flexWrap:"wrap",gap:"5px",padding:"8px",background:"rgba(0,0,0,0.3)",borderRadius:"8px",marginBottom:"8px"}}>
          {ICONS.map(ic=>(
            <button key={ic} className="btn" onMouseDown={()=>{ setEditDraft(p=>({...p,icon:ic})); setIconPicker(false); }} style={{fontSize:"16px",padding:"4px 6px",borderRadius:"6px",background:editDraft.icon===ic?"rgba(108,99,255,0.3)":"transparent",border:"1px solid rgba(255,255,255,0.05)"}}>
              {ic}
            </button>
          ))}
        </div>
      )}
      {/* Time + Category */}
      <div style={{display:"flex",gap:"8px",marginBottom:"8px"}}>
        <div style={{flex:1}}>
          <div style={{fontSize:"9px",color:"#555",marginBottom:"4px",fontWeight:"600",textTransform:"uppercase",letterSpacing:"0.5px"}}>Time</div>
          <input
            style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"8px",color:"#E8E8F0",padding:"6px 10px",fontFamily:"'DM Sans',sans-serif",fontSize:"13px",outline:"none"}}
            value={editDraft.time}
            onChange={e=>setEditDraft(p=>({...p,time:e.target.value}))}
            placeholder="e.g. 9:00"
          />
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:"9px",color:"#555",marginBottom:"4px",fontWeight:"600",textTransform:"uppercase",letterSpacing:"0.5px"}}>Category</div>
          <select
            style={{width:"100%",background:"#0e0e1a",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"8px",color:"#E8E8F0",padding:"6px 10px",fontFamily:"'DM Sans',sans-serif",fontSize:"13px",outline:"none"}}
            value={editDraft.category}
            onChange={e=>setEditDraft(p=>({...p,category:e.target.value}))}
          >
            {CAT_LIST.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      {/* Save / Cancel */}
      <div style={{display:"flex",gap:"7px"}}>
        <button className="btn" onMouseDown={saveEdit} style={{flex:1,padding:"8px",background:"linear-gradient(135deg,#6C63FF,#00C896)",borderRadius:"8px",color:"white",fontSize:"12px",fontWeight:"700",fontFamily:"'DM Sans',sans-serif"}}>Save ✓</button>
        <button className="btn" onMouseDown={cancelEdit} style={{flex:1,padding:"8px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"8px",color:"#777",fontSize:"12px",fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
      </div>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:"#080810",fontFamily:"'DM Sans',sans-serif",color:"#E8E8F0"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:#1a1a2a;border-radius:2px;}
        .btn{cursor:pointer;border:none;font-family:'DM Sans',sans-serif;transition:all 0.15s;}
        .btn:hover{opacity:0.82;} .btn:active{transform:scale(0.97);}
        .row{cursor:pointer;user-select:none;transition:background 0.12s;}
        .row:hover{background:rgba(255,255,255,0.03)!important;}
        .heat{transition:transform 0.1s;border-radius:4px;cursor:default;}
        .heat:hover{transform:scale(1.4);z-index:5;position:relative;}
        @keyframes shimmer{0%{background-position:-300% center}100%{background-position:300% center}}
        .shimmer{background:linear-gradient(90deg,#6C63FF,#00C896,#FF6B35,#A78BFA,#6C63FF);background-size:300% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 4s linear infinite;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .fade{animation:fadeUp 0.2s ease forwards;}
        .chk{width:18px;height:18px;border-radius:4px;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all 0.18s cubic-bezier(0.34,1.56,0.64,1);}
        .tag{display:inline-flex;align-items:center;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600;white-space:nowrap;}
        .journal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.82);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(6px);}
        textarea,input[type=text],input{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);color:#E8E8F0;transition:border 0.2s;}
        @keyframes toastIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .toast{animation:toastIn 0.25s ease forwards;}
        .edit-handle{opacity:0;transition:opacity 0.15s;}
        .edit-row-wrap:hover .edit-handle{opacity:1;}
      `}</style>

      {/* Toast */}
      {toast&&(
        <div className="toast" style={{position:"fixed",bottom:"24px",left:"50%",transform:"translateX(-50%)",background:"rgba(20,20,35,0.98)",border:"1px solid rgba(108,99,255,0.3)",borderRadius:"10px",padding:"10px 18px",fontSize:"13px",fontWeight:"600",color:"#A09CF7",zIndex:999,whiteSpace:"nowrap",boxShadow:"0 4px 20px rgba(0,0,0,0.5)"}}>
          {toast}
        </div>
      )}

      {/* Journal Modal */}
      {journalOpen&&(
        <div className="journal-overlay" onMouseDown={e=>e.target===e.currentTarget&&setJournalOpen(false)}>
          <div style={{background:"#0c0c18",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"20px",padding:"26px",width:"100%",maxWidth:"460px",maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"22px"}}>
              <div style={{fontFamily:"Syne,sans-serif",fontSize:"18px",fontWeight:"800"}}>Daily Journal</div>
              <button className="btn" onMouseDown={()=>setJournalOpen(false)} style={{background:"rgba(255,255,255,0.06)",color:"#777",fontSize:"16px",width:"28px",height:"28px",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
            {[
              {key:"priority",label:"🎯 ONE priority today",    type:"text"},
              {key:"avoiding",label:"👀 What I'm avoiding",     type:"text"},
              {key:"truth",   label:"✅ What is true right now", type:"textarea"},
              {key:"emotion", label:"💭 One emotion today",      type:"text"},
              {key:"better",  label:"⬆️ Do better tomorrow",     type:"text"},
            ].map(f=>(
              <div key={f.key} style={{marginBottom:"14px"}}>
                <div style={{fontSize:"11px",color:"#555",marginBottom:"5px",fontWeight:"500"}}>{f.label}</div>
                {f.type==="textarea"
                  ?<textarea rows={2} value={journal[f.key]} onChange={e=>setJournal(p=>({...p,[f.key]:e.target.value}))} style={{borderRadius:"10px",padding:"10px 13px",fontFamily:"'DM Sans',sans-serif",fontSize:"14px",width:"100%",outline:"none",resize:"vertical"}} />
                  :<input type="text" value={journal[f.key]} onChange={e=>setJournal(p=>({...p,[f.key]:e.target.value}))} style={{borderRadius:"10px",padding:"10px 13px",fontFamily:"'DM Sans',sans-serif",fontSize:"14px",width:"100%",outline:"none"}} />}
              </div>
            ))}
            <button className="btn" onMouseDown={saveJournal} style={{width:"100%",padding:"13px",background:"linear-gradient(135deg,#6C63FF,#00C896)",borderRadius:"12px",color:"white",fontFamily:"Syne,sans-serif",fontWeight:"700",fontSize:"14px",marginTop:"6px"}}>Save ✓</button>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModal&&(
        <div className="journal-overlay" onMouseDown={e=>e.target===e.currentTarget&&setShareModal(false)}>
          <div style={{background:"#0c0c18",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"20px",padding:"26px",width:"100%",maxWidth:"500px",maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"18px"}}>
              <div style={{fontFamily:"Syne,sans-serif",fontSize:"18px",fontWeight:"800"}}>Share Schedule</div>
              <button className="btn" onMouseDown={()=>setShareModal(false)} style={{background:"rgba(255,255,255,0.06)",color:"#777",fontSize:"16px",width:"28px",height:"28px",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
            <div style={{fontSize:"11px",color:"#555",marginBottom:"10px"}}>Copy and paste this to share your schedule with anyone</div>
            <textarea
              readOnly
              value={shareText}
              rows={tasks.length+5}
              style={{width:"100%",borderRadius:"10px",padding:"12px",fontFamily:"monospace",fontSize:"12px",lineHeight:"1.6",color:"#AAA",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",outline:"none",resize:"none"}}
            />
            <div style={{display:"flex",gap:"8px",marginTop:"12px"}}>
              <button className="btn" onMouseDown={copyShare} style={{flex:1,padding:"11px",background:"linear-gradient(135deg,#6C63FF,#00C896)",borderRadius:"10px",color:"white",fontFamily:"Syne,sans-serif",fontWeight:"700",fontSize:"13px"}}>
                📋 Copy to Clipboard
              </button>
              <button className="btn" onMouseDown={()=>setShareModal(false)} style={{padding:"11px 16px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"10px",color:"#666",fontSize:"13px"}}>Close</button>
            </div>
          </div>
        </div>
      )}

      <div style={{display:"flex",minHeight:"100vh"}}>
        {/* SIDEBAR — desktop */}
        {!isMobile&&(
          <div style={{width:"250px",flexShrink:0,padding:"26px 18px",borderRight:"1px solid rgba(255,255,255,0.04)",display:"flex",flexDirection:"column",gap:"16px",position:"sticky",top:0,height:"100vh",overflowY:"auto"}}>
            <div>
              <div style={{fontFamily:"Syne,sans-serif",fontSize:"21px",fontWeight:"800",lineHeight:1.15}}><span className="shimmer">Habit<br/>Tracker</span></div>
              <div style={{fontSize:"10px",color:"#333",marginTop:"6px"}}>{fullDate(today)}</div>
            </div>
            <div style={{padding:"10px 12px",borderRadius:"12px",background:wfh?"rgba(0,200,150,0.07)":"rgba(108,99,255,0.07)",border:`1px solid ${wfh?"rgba(0,200,150,0.18)":"rgba(108,99,255,0.18)"}`,display:"flex",gap:"9px",alignItems:"center"}}>
              <span style={{fontSize:"17px"}}>{wfh?"🏡":"🏢"}</span>
              <div>
                <div style={{fontSize:"12px",fontWeight:"700",color:wfh?"#00C896":"#A09CF7"}}>{wfh?"WFH Mode":"Office Mode"}</div>
                <div style={{fontSize:"9px",color:"#383838"}}>{tasks.length} tasks today</div>
              </div>
            </div>
            <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.04)",borderRadius:"14px",padding:"14px",textAlign:"center"}}>
              <div style={{fontSize:"34px",fontWeight:"800",fontFamily:"Syne,sans-serif",color:pct===100?"#00C896":pct>=50?"#FFB347":"#E8E8F0",lineHeight:1}}>{pct}<span style={{fontSize:"14px",color:"#333"}}>%</span></div>
              <div style={{fontSize:"10px",color:"#444",marginBottom:"10px",marginTop:"2px"}}>Today's progress</div>
              <div style={{height:"5px",background:"rgba(255,255,255,0.05)",borderRadius:"3px",overflow:"hidden"}}>
                <div style={{height:"100%",width:`${pct}%`,background:pct===100?"linear-gradient(90deg,#00C896,#6C63FF)":"linear-gradient(90deg,#6C63FF,#00C896)",borderRadius:"3px",transition:"width 0.5s"}} />
              </div>
              <div style={{fontSize:"11px",color:"#444",marginTop:"8px"}}>{done}/{total} done</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"7px"}}>
              {[{l:"🔥 Streak",v:`${streak}d`,c:"#FF6B35"},{l:"💻 GitHub",v:`${ghDone}/${ghTasks.length}`,c:"#00C896"}].map(s=>(
                <div key={s.l} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.04)",borderRadius:"11px",padding:"11px 8px",textAlign:"center"}}>
                  <div style={{fontSize:"17px",fontWeight:"800",color:s.c,fontFamily:"Syne,sans-serif"}}>{s.v}</div>
                  <div style={{fontSize:"9px",color:"#444",marginTop:"1px"}}>{s.l}</div>
                </div>
              ))}
            </div>
            <div>
              <div style={{fontSize:"9px",color:"#333",fontWeight:"600",letterSpacing:"1px",marginBottom:"8px",textTransform:"uppercase"}}>Categories</div>
              {cats.map(cat=>{
                const c=CAT[cat]||CAT.Custom;
                const ct=tasks.filter(t=>t.category===cat).length;
                const cd=tasks.filter(t=>t.category===cat&&checked[t.id]).length;
                return(
                  <div key={cat} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 9px",marginBottom:"3px",borderRadius:"8px",background:cd===ct?c.light:"transparent"}}>
                    <div style={{fontSize:"11px",color:cd===ct?c.accent:"#444",fontWeight:cd===ct?"600":"400"}}>{cat}</div>
                    <div style={{fontSize:"10px",color:cd===ct?c.accent:"#2a2a2a"}}>{cd}/{ct}</div>
                  </div>
                );
              })}
            </div>
            <button className="btn" onMouseDown={()=>setJournalOpen(true)} style={{marginTop:"auto",padding:"10px",background:"rgba(108,99,255,0.07)",border:"1px dashed rgba(108,99,255,0.25)",borderRadius:"11px",color:"#6C63FF",fontSize:"12px",fontWeight:"600",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px"}}>
              ✍️ Journal {journal.priority&&"✓"}
            </button>
          </div>
        )}

        {/* MAIN */}
        <div style={{flex:1,padding:isMobile?"14px 12px 90px":"26px 30px",overflowY:"auto"}}>

          {/* Mobile header */}
          {isMobile&&(
            <div style={{marginBottom:"18px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"14px"}}>
                <div>
                  <div style={{fontFamily:"Syne,sans-serif",fontSize:"22px",fontWeight:"800",lineHeight:1}}><span className="shimmer">Habit Tracker</span></div>
                  <div style={{fontSize:"10px",color:"#383838",marginTop:"3px"}}>{fullDate(today)}</div>
                </div>
                <div style={{padding:"4px 9px",borderRadius:"16px",fontSize:"10px",fontWeight:"700",background:wfh?"rgba(0,200,150,0.1)":"rgba(108,99,255,0.1)",color:wfh?"#00C896":"#A09CF7",border:`1px solid ${wfh?"rgba(0,200,150,0.2)":"rgba(108,99,255,0.2)"}`}}>
                  {wfh?"🏡 WFH":"🏢 Office"}
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"5px",marginBottom:"12px"}}>
                {[
                  {v:`${pct}%`,l:"Progress",c:pct>=80?"#00C896":pct>=50?"#FFB347":"#CCC"},
                  {v:`${done}/${total}`,l:"Tasks",c:"#A09CF7"},
                  {v:`${streak}d`,l:"🔥 Streak",c:"#FF6B35"},
                  {v:`${ghDone}/${ghTasks.length}`,l:"💻 Git",c:"#00C896"},
                ].map(s=>(
                  <div key={s.l} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"9px",padding:"7px 4px",textAlign:"center"}}>
                    <div style={{fontSize:"13px",fontWeight:"800",color:s.c,fontFamily:"Syne,sans-serif"}}>{s.v}</div>
                    <div style={{fontSize:"8px",color:"#383838",marginTop:"1px"}}>{s.l}</div>
                  </div>
                ))}
              </div>
              <div style={{height:"4px",background:"rgba(255,255,255,0.04)",borderRadius:"2px",overflow:"hidden",marginBottom:"16px"}}>
                <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#6C63FF,#00C896)",borderRadius:"2px",transition:"width 0.5s"}} />
              </div>
            </div>
          )}

          {/* Tabs */}
          <div style={{display:"flex",gap:"4px",marginBottom:"20px",background:"rgba(255,255,255,0.02)",padding:"3px",borderRadius:"11px",border:"1px solid rgba(255,255,255,0.04)"}}>
            {[["today","📋 Today"],["consistency","📊 Consistency"],["history","📅 History"]].map(([k,l])=>(
              <button key={k} className="btn" onMouseDown={()=>{setTab(k);if(k!=="today")setEditMode(false);}} style={{flex:1,padding:"8px 4px",borderRadius:"8px",fontSize:isMobile?"10px":"12px",fontWeight:"600",background:tab===k?"rgba(108,99,255,0.18)":"transparent",color:tab===k?"#A09CF7":"#383838",border:tab===k?"1px solid rgba(108,99,255,0.25)":"1px solid transparent"}}>
                {l}
              </button>
            ))}
          </div>

          {/* ── TODAY ── */}
          {tab==="today"&&(
            <div className="fade">
              {/* Top bar */}
              <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"16px",flexWrap:"wrap"}}>
                {!isMobile&&(
                  <>
                    <div style={{fontSize:"28px",fontWeight:"800",fontFamily:"Syne,sans-serif",color:pct===100?"#00C896":"#E8E8F0",minWidth:"52px"}}>{pct}<span style={{fontSize:"13px",color:"#333"}}>%</span></div>
                    <div style={{flex:1}}>
                      <div style={{height:"6px",background:"rgba(255,255,255,0.04)",borderRadius:"3px",overflow:"hidden",marginBottom:"4px"}}>
                        <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#6C63FF,#00C896)",borderRadius:"3px",transition:"width 0.5s"}} />
                      </div>
                      <div style={{fontSize:"11px",color:"#444"}}>{done} of {total} tasks</div>
                    </div>
                  </>
                )}
                <div style={{display:"flex",gap:"7px",marginLeft:"auto"}}>
                  <button className="btn" onMouseDown={()=>setEditMode(e=>!e)} style={{padding:"7px 13px",background:editMode?"rgba(108,99,255,0.25)":"rgba(255,255,255,0.04)",border:`1px solid ${editMode?"rgba(108,99,255,0.5)":"rgba(255,255,255,0.08)"}`,borderRadius:"9px",color:editMode?"#A09CF7":"#666",fontSize:"12px",fontWeight:"600",display:"flex",alignItems:"center",gap:"5px"}}>
                    ✏️ {editMode?"Done Editing":"Edit Tasks"}
                  </button>
                  <button className="btn" onMouseDown={openShare} style={{padding:"7px 13px",background:"rgba(0,200,150,0.08)",border:"1px solid rgba(0,200,150,0.2)",borderRadius:"9px",color:"#00C896",fontSize:"12px",fontWeight:"600",display:"flex",alignItems:"center",gap:"5px"}}>
                    📤 Share
                  </button>
                  {!isMobile&&(
                    <button className="btn" onMouseDown={()=>setJournalOpen(true)} style={{padding:"7px 13px",background:"rgba(108,99,255,0.07)",border:"1px dashed rgba(108,99,255,0.25)",borderRadius:"9px",color:"#6C63FF",fontSize:"12px",fontWeight:"600"}}>
                      ✍️ Journal {journal.priority&&"✓"}
                    </button>
                  )}
                </div>
              </div>

              {/* Edit mode banner */}
              {editMode&&(
                <div style={{padding:"10px 14px",background:"rgba(108,99,255,0.08)",border:"1px solid rgba(108,99,255,0.2)",borderRadius:"10px",marginBottom:"12px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"8px"}}>
                  <div style={{fontSize:"12px",color:"#A09CF7"}}>✏️ Edit mode — click any task to edit, drag to reorder, or add new tasks</div>
                  <div style={{display:"flex",gap:"7px"}}>
                    <button className="btn" onMouseDown={addTask} style={{padding:"6px 12px",background:"rgba(0,200,150,0.15)",border:"1px solid rgba(0,200,150,0.3)",borderRadius:"8px",color:"#00C896",fontSize:"12px",fontWeight:"600"}}>+ Add Task</button>
                    <button className="btn" onMouseDown={resetTasks} style={{padding:"6px 12px",background:"rgba(255,107,53,0.1)",border:"1px solid rgba(255,107,53,0.2)",borderRadius:"8px",color:"#FF6B35",fontSize:"12px",fontWeight:"600"}}>↺ Reset</button>
                  </div>
                </div>
              )}

              {/* Task table */}
              <div style={{background:"rgba(255,255,255,0.01)",border:"1px solid rgba(255,255,255,0.04)",borderRadius:"14px",overflow:"hidden"}}>
                {/* Header */}
                {!editMode&&(
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"28px 1fr 64px 54px":"32px 1fr 80px 66px",padding:isMobile?"8px 12px":"9px 14px",borderBottom:"1px solid rgba(255,255,255,0.04)",background:"rgba(255,255,255,0.02)"}}>
                    {["","Task","Category","Time"].map((h,i)=>(
                      <div key={i} style={{fontSize:"9px",color:"#2e2e2e",fontWeight:"600",textTransform:"uppercase",letterSpacing:"0.5px",textAlign:i>=2?"center":"left"}}>{h}</div>
                    ))}
                  </div>
                )}

                {/* Rows */}
                <div style={{padding:editMode?"8px":"0"}}>
                  {tasks.map((task,i)=>{
                    const isDone=!!checked[task.id];
                    const c=CAT[task.category]||CAT.Custom;
                    const isEditing=editMode&&editingId===task.id;

                    if(isEditing) return <EditRow key={task.id} task={task} />;

                    if(editMode) return(
                      <div key={task.id} className="edit-row-wrap" style={{display:"flex",alignItems:"center",gap:"8px",padding:"9px 10px",marginBottom:"3px",borderRadius:"9px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.04)"}}>
                        {/* Reorder */}
                        <div style={{display:"flex",flexDirection:"column",gap:"2px",flexShrink:0}}>
                          <button className="btn edit-handle" onMouseDown={()=>moveTask(task.id,"up")} style={{background:"none",color:"#444",fontSize:"10px",lineHeight:1,padding:"1px 3px"}}>▲</button>
                          <button className="btn edit-handle" onMouseDown={()=>moveTask(task.id,"down")} style={{background:"none",color:"#444",fontSize:"10px",lineHeight:1,padding:"1px 3px"}}>▼</button>
                        </div>
                        {/* Icon + label */}
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:"13px",color:"#AAA",fontWeight:"500"}}>{task.icon} {task.label}</div>
                          <div style={{fontSize:"10px",color:"#383838",marginTop:"2px"}}>{task.time} · <span style={{color:c.accent}}>{task.category}</span></div>
                        </div>
                        {/* Edit / Delete */}
                        <button className="btn" onMouseDown={()=>startEdit(task)} style={{padding:"5px 10px",background:"rgba(108,99,255,0.12)",border:"1px solid rgba(108,99,255,0.2)",borderRadius:"7px",color:"#A09CF7",fontSize:"11px",fontWeight:"600",flexShrink:0}}>Edit</button>
                        <button className="btn" onMouseDown={()=>deleteTask(task.id)} style={{padding:"5px 8px",background:"rgba(255,107,53,0.1)",border:"1px solid rgba(255,107,53,0.2)",borderRadius:"7px",color:"#FF6B35",fontSize:"11px",flexShrink:0}}>✕</button>
                      </div>
                    );

                    // Normal row
                    return(
                      <div key={task.id} className="row" onMouseDown={()=>toggle(task.id)} style={{
                        display:"grid",gridTemplateColumns:isMobile?"28px 1fr 64px 54px":"32px 1fr 80px 66px",
                        padding:isMobile?"10px 12px":"11px 14px",
                        borderBottom:i<tasks.length-1?"1px solid rgba(255,255,255,0.025)":"none",
                        background:isDone?"rgba(0,200,150,0.035)":"transparent",
                        alignItems:"center",
                      }}>
                        <div>
                          <div className="chk" style={{background:isDone?c.accent:"transparent",border:`1.5px solid ${isDone?c.accent:"rgba(255,255,255,0.1)"}`,boxShadow:isDone?`0 0 7px ${c.accent}44`:"none"}}>
                            {isDone&&<svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3L3.2 5.5L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </div>
                        </div>
                        <div style={{paddingRight:"6px"}}>
                          <div style={{fontSize:isMobile?"12px":"13px",fontWeight:isDone?"400":"500",color:isDone?"#383838":"#C0C0D0",textDecoration:isDone?"line-through":"none",textDecorationColor:"#2a2a2a",lineHeight:"1.3"}}>{task.icon} {task.label}</div>
                        </div>
                        <div style={{textAlign:"center"}}>
                          <span className="tag" style={{background:isDone?c.light:"rgba(255,255,255,0.03)",color:isDone?c.accent:"#333",border:`1px solid ${isDone?c.accent+"33":"rgba(255,255,255,0.05)"}`}}>{task.category}</span>
                        </div>
                        <div style={{textAlign:"center",fontSize:"11px",color:isDone?"#2e2e2e":"#383838",fontWeight:"500"}}>{task.time}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add task button in edit mode */}
              {editMode&&(
                <button className="btn" onMouseDown={addTask} style={{width:"100%",marginTop:"10px",padding:"11px",background:"rgba(0,200,150,0.06)",border:"1px dashed rgba(0,200,150,0.25)",borderRadius:"10px",color:"#00C896",fontSize:"13px",fontWeight:"600",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px"}}>
                  + Add New Task
                </button>
              )}

              {isMobile&&!editMode&&(
                <button className="btn" onMouseDown={()=>setJournalOpen(true)} style={{width:"100%",marginTop:"12px",padding:"12px",background:"rgba(108,99,255,0.07)",border:"1px dashed rgba(108,99,255,0.25)",borderRadius:"11px",color:"#6C63FF",fontSize:"13px",fontWeight:"600",display:"flex",alignItems:"center",justifyContent:"center",gap:"7px"}}>
                  ✍️ Daily Journal {journal.priority&&<span style={{fontSize:"10px",color:"#00C896",background:"rgba(0,200,150,0.1)",padding:"1px 5px",borderRadius:"8px"}}>Saved ✓</span>}
                </button>
              )}
            </div>
          )}

          {/* ── CONSISTENCY ── */}
          {tab==="consistency"&&(
            <div className="fade">
              <div style={{marginBottom:"18px"}}>
                <div style={{fontFamily:"Syne,sans-serif",fontSize:"15px",fontWeight:"700",marginBottom:"3px"}}>Activity Heatmap</div>
                <div style={{fontSize:"11px",color:"#444"}}>Last 30 days — hover for details</div>
              </div>
              <div style={{background:"rgba(255,255,255,0.01)",border:"1px solid rgba(255,255,255,0.04)",borderRadius:"14px",padding:"18px",marginBottom:"18px"}}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(10,1fr)",gap:"5px"}}>
                  {last30().map(ds=>{
                    const p=getDayPct(ds);
                    const isT=ds===today;
                    return(
                      <div key={ds} className="heat" title={`${dateLabel(ds)}: ${p===null?"No data":p+"%"}`} style={{aspectRatio:"1",background:isT?"transparent":heatColor(p===null?-1:p),border:isT?"2px solid #6C63FF":"none",borderRadius:"4px",position:"relative"}}>
                        {isT&&<div style={{position:"absolute",inset:"1px",background:heatColor(p===null?-1:p),borderRadius:"2px"}} />}
                      </div>
                    );
                  })}
                </div>
                <div style={{display:"flex",gap:"8px",marginTop:"12px",alignItems:"center"}}>
                  <div style={{fontSize:"9px",color:"#333"}}>Less</div>
                  {["rgba(255,255,255,0.04)","rgba(255,107,53,0.25)","rgba(255,179,71,0.35)","rgba(0,200,150,0.4)","rgba(0,200,150,0.85)"].map((bg,i)=>(
                    <div key={i} style={{width:"12px",height:"12px",borderRadius:"3px",background:bg}} />
                  ))}
                  <div style={{fontSize:"9px",color:"#333"}}>Full day</div>
                </div>
              </div>
              <div style={{fontFamily:"Syne,sans-serif",fontSize:"14px",fontWeight:"700",marginBottom:"12px"}}>Weekly Log</div>
              <div style={{background:"rgba(255,255,255,0.01)",border:"1px solid rgba(255,255,255,0.04)",borderRadius:"14px",overflow:"hidden"}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 55px 55px 55px",padding:"8px 14px",borderBottom:"1px solid rgba(255,255,255,0.03)",background:"rgba(255,255,255,0.02)"}}>
                  {["Day","Tasks","GitHub","Score"].map((h,i)=>(
                    <div key={h} style={{fontSize:"9px",color:"#2e2e2e",fontWeight:"600",textTransform:"uppercase",letterSpacing:"0.5px",textAlign:i===0?"left":"center"}}>{h}</div>
                  ))}
                </div>
                {[today,...last7().slice(0,6)].map((ds,i)=>{
                  const c=getDayData(ds);
                  const t=isWFH(ds)?wfhTasks:officeTasks;
                  const d=c?Object.values(c).filter(Boolean).length:0;
                  const gh=t.filter(x=>x.category==="GitHub");
                  const ghd=c?gh.filter(x=>c[x.id]).length:0;
                  const sc=c&&t.length>0?Math.round((d/t.length)*100):null;
                  const isT=ds===today;
                  return(
                    <div key={ds} style={{display:"grid",gridTemplateColumns:"1fr 55px 55px 55px",padding:"11px 14px",borderBottom:i<6?"1px solid rgba(255,255,255,0.025)":"none",background:isT?"rgba(108,99,255,0.05)":"transparent",alignItems:"center"}}>
                      <div>
                        <div style={{fontSize:"12px",fontWeight:isT?"600":"400",color:isT?"#A09CF7":"#666"}}>{isT?"Today ★":dateLabel(ds)}</div>
                        <div style={{fontSize:"9px",color:"#2e2e2e",marginTop:"1px"}}>{isWFH(ds)?"WFH":"Office"}</div>
                      </div>
                      <div style={{textAlign:"center",fontSize:"12px",color:!c?"#222":d>0?"#888":"#444"}}>{!c?"—":`${d}/${t.length}`}</div>
                      <div style={{textAlign:"center",fontSize:"12px",color:!c?"#222":ghd>0?"#00C896":"#444"}}>{!c?"—":`${ghd}/${gh.length}`}</div>
                      <div style={{textAlign:"center"}}>{!c?<span style={{color:"#222",fontSize:"11px"}}>—</span>:<span style={{fontSize:"12px",fontWeight:"700",color:sc>=80?"#00C896":sc>=50?"#FFB347":"#FF6B35"}}>{sc}%</span>}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{fontFamily:"Syne,sans-serif",fontSize:"14px",fontWeight:"700",marginTop:"20px",marginBottom:"12px"}}>Today by Category</div>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(3,1fr)",gap:"8px"}}>
                {cats.map(cat=>{
                  const c=CAT[cat]||CAT.Custom;
                  const ct=tasks.filter(t=>t.category===cat);
                  const cd=ct.filter(t=>checked[t.id]).length;
                  const p=Math.round((cd/ct.length)*100);
                  return(
                    <div key={cat} style={{background:cd===ct.length?c.light:"rgba(255,255,255,0.02)",border:`1px solid ${cd===ct.length?c.accent+"33":"rgba(255,255,255,0.04)"}`,borderRadius:"11px",padding:"12px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"7px"}}>
                        <div style={{fontSize:"12px",fontWeight:"600",color:cd===ct.length?c.accent:"#666"}}>{cat}</div>
                        <div style={{fontSize:"12px",fontWeight:"700",color:cd===ct.length?c.accent:"#444"}}>{cd}/{ct.length}</div>
                      </div>
                      <div style={{height:"3px",background:"rgba(255,255,255,0.04)",borderRadius:"2px",overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${p}%`,background:c.accent,borderRadius:"2px",transition:"width 0.4s"}} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── HISTORY ── */}
          {tab==="history"&&(
            <div className="fade">
              <div style={{fontFamily:"Syne,sans-serif",fontSize:"14px",fontWeight:"700",marginBottom:"12px"}}>Last 7 Days</div>
              {last7().map((ds,i)=>{
                const c=getDayData(ds);
                const t=isWFH(ds)?wfhTasks:officeTasks;
                const d=c?Object.values(c).filter(Boolean).length:0;
                const p=c&&t.length>0?Math.round((d/t.length)*100):null;
                return(
                  <div key={ds} style={{marginBottom:"7px",background:"rgba(255,255,255,0.01)",border:"1px solid rgba(255,255,255,0.04)",borderRadius:"12px",overflow:"hidden"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"10px",padding:"12px 14px"}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:"12px",fontWeight:"500",color:"#777"}}>{dateLabel(ds)}</div>
                        <div style={{fontSize:"9px",color:"#333",marginTop:"1px"}}>{isWFH(ds)?"WFH":"Office"} · {t.length} tasks</div>
                      </div>
                      <div style={{flex:2}}>
                        <div style={{height:"5px",background:"rgba(255,255,255,0.04)",borderRadius:"3px",overflow:"hidden"}}>
                          {p!==null&&<div style={{height:"100%",width:`${p}%`,background:p>=80?"#00C896":p>=50?"#FFB347":"#FF6B35",borderRadius:"3px"}} />}
                        </div>
                      </div>
                      <div style={{minWidth:"38px",textAlign:"right",fontSize:"13px",fontWeight:"700",color:p===null?"#222":p>=80?"#00C896":p>=50?"#FFB347":"#FF6B35"}}>{p===null?"—":`${p}%`}</div>
                    </div>
                    {c&&(
                      <div style={{padding:"0 14px 10px",display:"flex",flexWrap:"wrap",gap:"4px"}}>
                        {t.map(task=>(
                          <span key={task.id} style={{fontSize:"9px",padding:"2px 6px",borderRadius:"8px",background:c[task.id]?"rgba(0,200,150,0.1)":"rgba(255,255,255,0.02)",color:c[task.id]?"#00C896":"#2e2e2e",border:`1px solid ${c[task.id]?"rgba(0,200,150,0.18)":"rgba(255,255,255,0.04)"}`}}>{task.icon}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <div style={{marginTop:"18px",padding:"16px",background:"rgba(255,107,53,0.05)",border:"1px solid rgba(255,107,53,0.12)",borderRadius:"12px"}}>
                <div style={{fontSize:"12px",color:"#FF6B35",fontWeight:"700",marginBottom:"7px"}}>📅 Sunday Review — 15 min</div>
                <div style={{fontSize:"11px",color:"#555",lineHeight:"1.8"}}>
                  1. Which days did I fully show up?<br/>
                  2. What emotion appeared most?<br/>
                  3. What kept getting avoided?<br/>
                  4. ONE change for next week.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}