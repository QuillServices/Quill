import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const CLAUDE_MODEL = "claude-sonnet-4-5";
const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:3001";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  bg:           "#ffffff",
  bgSoft:       "#f9f9f7",
  bgMuted:      "#f3f2ef",
  border:       "#e8e6e1",
  borderStrong: "#d4d1cb",
  ink:          "#1a1a18",
  inkMid:       "#4a4a44",
  inkLight:     "#8a8a82",
  inkMuted:     "#b8b8b0",
  accent:       "#1a1a18",
  accentHover:  "#333330",
  crimson:      "#c41e3a",
  crimsonSoft:  "#fdf0f2",
  crimsonMid:   "#f5c6ce",
  gold:         "#b8860b",
  goldSoft:     "#fdf8ee",
  green:        "#2d6a4f",
  greenSoft:    "#edf7f2",
  white:        "#ffffff",
  shadow:       "rgba(0,0,0,0.06)",
  shadowMd:     "rgba(0,0,0,0.10)",
};

const PLATFORMS = [
  { id:"instagram", label:"Instagram", color:"#C13584", icon:"◈" },
  { id:"facebook",  label:"Facebook",  color:"#1877F2", icon:"◉" },
  { id:"linkedin",  label:"LinkedIn",  color:"#0A66C2", icon:"◆" },
  { id:"twitter",   label:"X",         color:"#14171A", icon:"◇" },
];

const COPY_TYPES = [
  { id:"caption", label:"Social caption" },
  { id:"email",   label:"Email campaign" },
  { id:"ad",      label:"Ad copy" },
  { id:"product", label:"Product description" },
];

const TONES = ["Professional","Casual","Witty","Urgent","Inspirational","Bold"];

const FREQUENCIES = [
  { id:"daily",      label:"Every day" },
  { id:"weekdays",   label:"Weekdays" },
  { id:"weekly",     label:"Weekly" },
  { id:"twice_week", label:"Twice a week" },
];

const PLANS = [
  {
    id:"trial", name:"Free Trial",
    monthlyPrice:0, annualPrice:0,
    monthlyPriceId:null, annualPriceId:null,
    description:"7 days free, no credit card needed",
    features:["2 active campaigns","20 posts total","10 images total","Basic analytics"],
    limits:{ campaigns:2, posts:20, images:10 },
  },
  {
    id:"starter", name:"Starter",
    monthlyPrice:29, annualPrice:279,
    monthlyPriceId:"price_1Tddw8Pb3Ifjj2XOPzC7cyrI",
    annualPriceId:"price_1TeNWOPb3Ifjj2XO5SdnK9jB",
    description:"Perfect for solo business owners",
    features:["3 active campaigns","50 posts per month","20 images per month","Basic analytics","Email support"],
    limits:{ campaigns:3, posts:50, images:20 },
  },
  {
    id:"growth", name:"Growth", popular:true,
    monthlyPrice:79, annualPrice:759,
    monthlyPriceId:"price_1TddwQPb3Ifjj2XOS4lFF3yZ",
    annualPriceId:"price_1TeNVePb3Ifjj2XOo55OlGv9",
    description:"For small businesses scaling up",
    features:["Unlimited campaigns","Unlimited posts","100 images per month","Full analytics + insights","Brand Kit","Priority support"],
    limits:{ campaigns:-1, posts:-1, images:100 },
  },
  {
    id:"agency", name:"Agency",
    monthlyPrice:169, annualPrice:1622,
    monthlyPriceId:"price_1TddwsPb3Ifjj2XOVOFwTaWY",
    annualPriceId:"price_1TeNTvPb3Ifjj2XOoEZDYj4v",
    description:"For agencies managing clients",
    features:["Everything in Growth","Unlimited client accounts","White-label option","Client approval flows","Dedicated account manager"],
    limits:{ campaigns:-1, posts:-1, images:-1 },
  },
];

// Credit/usage hook
function usePlanLimits(user, currentPlan) {
  const plan = PLANS.find(p => p.id === currentPlan) || PLANS[0];
  const limits = plan.limits || { campaigns:2, posts:20, images:10 };
  
  const canDo = (type, currentCount) => {
    if (limits[type] === -1) return true; // unlimited
    return currentCount < limits[type];
  };

  const limitLabel = (type) => {
    if (limits[type] === -1) return "Unlimited";
    return limits[type].toString();
  };

  return { plan, limits, canDo, limitLabel };
}

function UsageBanner({ currentPlan, campaigns, posts, images }) {
  const planData = PLANS.find(p => p.id === currentPlan) || PLANS[0];
  const limits = planData.limits || { campaigns:2, posts:20, images:10 };
  if (currentPlan === "agency") return null;

  const items = [
    { label:"Campaigns", used:campaigns, limit:limits.campaigns },
    { label:"Posts", used:posts, limit:limits.posts },
    { label:"Images", used:images, limit:limits.images },
  ].filter(i => i.limit !== -1);

  const isNearLimit = items.some(i => i.used >= i.limit * 0.8);
  const isAtLimit = items.some(i => i.used >= i.limit);

  if (!isNearLimit) return null;

  return (
    <div style={{ background:isAtLimit?"#fdf0f2":"#fdf8ee", border:`1px solid ${isAtLimit?"#f5c6ce":"#f0d070"}`, borderRadius:10, padding:"12px 16px", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
      <div>
        <div style={{ fontSize:13, fontWeight:600, color:isAtLimit?"#c41e3a":"#b8860b", marginBottom:4 }}>
          {isAtLimit?"You've reached your plan limit":"You're approaching your plan limit"}
        </div>
        <div style={{ fontSize:12, color:"#6a6a62" }}>
          {items.map(i => `${i.label}: ${i.used}/${i.limit}`).join(" · ")}
        </div>
      </div>
      <button style={{ padding:"8px 16px", borderRadius:8, background:"#1a1a18", border:"none", color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif", whiteSpace:"nowrap" }} onClick={() => window.location.hash="billing"}>Upgrade plan</button>
    </div>
  );
}

// ─── API ──────────────────────────────────────────────────────────────────────
async function callClaude(system, user, onChunk) {
  const res = await fetch(SERVER_URL + "/api/chat", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({ model:CLAUDE_MODEL, max_tokens:1000, stream:false, system, messages:[{role:"user",content:user}] }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || "Error"); }
  const data = await res.json();
  onChunk(data?.content?.[0]?.text ?? "");
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function QuillLogo({ size=32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill={T.ink}/>
      <path d="M22 5C22 5 17 7 14 11C11 15 10 20 10 20C10 20 12 18 14 17C13 19 12 22 11 24C11 24 14 22 17 18C19 15 20 12 20 12C20 12 19 14 18 15C18 15 20 11 22 5Z" fill="white"/>
      <path d="M10 20C10 20 9 22 8 26" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function Card({ children, style:extra={}, hover=false }) {
  return (
    <div style={{
      background:T.white, borderRadius:12,
      border:`1px solid ${T.border}`,
      boxShadow:`0 1px 4px ${T.shadow}`,
      padding:24, ...extra,
    }}>{children}</div>
  );
}

function Btn({ children, onClick, disabled, variant="primary", small=false, full=true }) {
  const styles = {
    primary: { bg: disabled ? T.inkMuted : T.ink, color: T.white, border: "none" },
    secondary: { bg: T.white, color: T.ink, border: `1.5px solid ${T.border}` },
    danger: { bg: T.white, color: T.crimson, border: `1.5px solid ${T.crimsonMid}` },
    crimson: { bg: T.crimson, color: T.white, border: "none" },
  };
  const s = styles[variant] || styles.primary;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: small ? "7px 16px" : "11px 20px",
      borderRadius:8, background:s.bg, color:s.color, border:s.border,
      fontSize: small ? 12 : 13, fontWeight:600,
      cursor: disabled ? "not-allowed" : "pointer",
      fontFamily:"'Inter',sans-serif", transition:"all 0.15s",
      width: full ? "100%" : "auto", letterSpacing:"0.01em",
    }}>{children}</button>
  );
}

function Label({ children }) {
  return <div style={{ fontSize:11, fontWeight:600, color:T.inkLight, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6, fontFamily:"'Inter',sans-serif" }}>{children}</div>;
}

function Input({ value, onChange, placeholder, type="text", required=false }) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} style={{
      width:"100%", background:T.white, border:`1.5px solid ${T.border}`,
      borderRadius:8, padding:"10px 13px", color:T.ink, fontSize:13,
      outline:"none", fontFamily:"'Inter',sans-serif", boxSizing:"border-box",
      transition:"border-color 0.15s",
    }}/>
  );
}

function Textarea({ value, onChange, placeholder, height=80 }) {
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} style={{
      width:"100%", background:T.white, border:`1.5px solid ${T.border}`,
      borderRadius:8, padding:"10px 13px", color:T.ink, fontSize:13,
      resize:"none", height, outline:"none", fontFamily:"'Inter',sans-serif",
      lineHeight:1.6, boxSizing:"border-box",
    }}/>
  );
}

function Badge({ children, color="default" }) {
  const colors = {
    default: { bg:T.bgMuted, color:T.inkMid },
    green:   { bg:T.greenSoft, color:T.green },
    gold:    { bg:T.goldSoft, color:T.gold },
    crimson: { bg:T.crimsonSoft, color:T.crimson },
  };
  const c = colors[color] || colors.default;
  return <span style={{ fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:20, background:c.bg, color:c.color, letterSpacing:"0.06em", fontFamily:"'Inter',sans-serif" }}>{children}</span>;
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
function LandingPage({ onSignup, onLogin }) {
  const features = [
    { icon:"✦", title:"Campaign Autopilot", desc:"Set a theme once. Quill writes captions, generates images, and posts to your social media on your schedule — forever." },
    { icon:"◈", title:"Brand Kit", desc:"Upload your logo and brand assets. Every post stays visually consistent with your boutique's aesthetic." },
    { icon:"◎", title:"Real Analytics", desc:"See exactly what's working. Track reach, engagement, and post performance across all your connected platforms." },
    { icon:"◉", title:"Platform Publishing", desc:"Connect Instagram, Facebook, LinkedIn, and X. One campaign, every platform, zero manual work." },
  ];

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", background:T.white, minHeight:"100vh" }}>
      {/* Nav */}
      <nav style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 64px", borderBottom:`1px solid ${T.border}`, position:"sticky", top:0, background:T.white, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <QuillLogo size={32}/>
          <span style={{ fontSize:18, fontWeight:700, color:T.ink, letterSpacing:"-0.3px" }}>Quill</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={onLogin} style={{ padding:"8px 18px", borderRadius:8, background:"transparent", border:`1.5px solid ${T.border}`, color:T.inkMid, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>Log in</button>
          <button onClick={onSignup} style={{ padding:"8px 18px", borderRadius:8, background:T.ink, border:"none", color:T.white, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>Start free trial</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth:760, margin:"0 auto", padding:"100px 32px 80px", textAlign:"center" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:T.bgSoft, border:`1px solid ${T.border}`, borderRadius:20, padding:"6px 14px", marginBottom:32 }}>
          <span style={{ fontSize:11, fontWeight:600, color:T.inkMid, letterSpacing:"0.06em" }}>7-DAY FREE TRIAL — NO CREDIT CARD NEEDED</span>
        </div>
        <h1 style={{ fontSize:58, fontWeight:800, color:T.ink, lineHeight:1.1, letterSpacing:"-2px", margin:"0 0 24px" }}>
          Your social media,<br/>on autopilot.
        </h1>
        <p style={{ fontSize:18, color:T.inkMid, lineHeight:1.65, margin:"0 0 40px", maxWidth:520, marginLeft:"auto", marginRight:"auto" }}>
          Quill writes your captions, creates your images, and publishes to all your platforms — automatically. Set it up once. Let it run forever.
        </p>
        <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
          <button onClick={onSignup} style={{ padding:"14px 32px", borderRadius:10, background:T.ink, border:"none", color:T.white, fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"'Inter',sans-serif", letterSpacing:"0.01em" }}>Start free trial →</button>
          <button onClick={onLogin} style={{ padding:"14px 28px", borderRadius:10, background:"transparent", border:`1.5px solid ${T.border}`, color:T.inkMid, fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>Log in</button>
        </div>
        <p style={{ fontSize:12, color:T.inkMuted, marginTop:16 }}>7 days free. Then from $29/month. Cancel anytime.</p>
      </div>

      {/* Features */}
      <div style={{ background:T.bgSoft, borderTop:`1px solid ${T.border}`, borderBottom:`1px solid ${T.border}`, padding:"80px 64px" }}>
        <div style={{ maxWidth:960, margin:"0 auto" }}>
          <h2 style={{ fontSize:32, fontWeight:800, color:T.ink, letterSpacing:"-1px", margin:"0 0 8px", textAlign:"center" }}>Everything you need. Nothing you don't.</h2>
          <p style={{ fontSize:15, color:T.inkMid, textAlign:"center", margin:"0 0 56px" }}>Built for boutique owners who want results without the busywork.</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
            {features.map((f,i) => (
              <Card key={i} style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
                <div style={{ width:36, height:36, borderRadius:8, background:T.bgMuted, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{f.icon}</div>
                <div>
                  <div style={{ fontSize:15, fontWeight:700, color:T.ink, marginBottom:6, fontFamily:"'Inter',sans-serif" }}>{f.title}</div>
                  <div style={{ fontSize:13, color:T.inkMid, lineHeight:1.6, fontFamily:"'Inter',sans-serif" }}>{f.desc}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div style={{ maxWidth:960, margin:"0 auto", padding:"80px 64px" }}>
        <h2 style={{ fontSize:32, fontWeight:800, color:T.ink, letterSpacing:"-1px", margin:"0 0 8px", textAlign:"center" }}>Simple, transparent pricing.</h2>
        <p style={{ fontSize:15, color:T.inkMid, textAlign:"center", margin:"0 0 48px" }}>Start free. Scale when you're ready.</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
          {PLANS.map(plan => (
            <div key={plan.id} style={{ background:T.white, borderRadius:16, border:`1.5px solid ${plan.popular ? T.ink : T.border}`, padding:28, position:"relative", boxShadow:plan.popular?`0 4px 24px ${T.shadowMd}`:`0 1px 4px ${T.shadow}` }}>
              {plan.popular && <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", background:T.ink, color:T.white, fontSize:10, fontWeight:700, padding:"4px 14px", borderRadius:20, letterSpacing:"0.06em", whiteSpace:"nowrap" }}>MOST POPULAR</div>}
              <div style={{ fontSize:18, fontWeight:700, color:T.ink, marginBottom:4 }}>{plan.name}</div>
              <div style={{ fontSize:13, color:T.inkMid, marginBottom:20 }}>{plan.description}</div>
              <div style={{ fontSize:40, fontWeight:800, color:T.ink, letterSpacing:"-1px", marginBottom:20 }}>${plan.monthlyPrice}<span style={{ fontSize:14, fontWeight:400, color:T.inkMid }}>/mo</span></div>
              <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
                {plan.features.map((f,i) => (
                  <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                    <span style={{ color:T.green, fontWeight:700, flexShrink:0 }}>✓</span>
                    <span style={{ fontSize:13, color:T.inkMid }}>{f}</span>
                  </div>
                ))}
              </div>
              <button onClick={onSignup} style={{ width:"100%", padding:"11px 0", borderRadius:8, background:plan.popular?T.ink:T.white, border:plan.popular?"none":`1.5px solid ${T.border}`, color:plan.popular?T.white:T.ink, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>Start free trial</button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop:`1px solid ${T.border}`, padding:"32px 64px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <QuillLogo size={24}/>
          <span style={{ fontSize:14, fontWeight:600, color:T.ink }}>Quill</span>
        </div>
        <span style={{ fontSize:12, color:T.inkMuted }}>© 2026 Quill. All rights reserved.</span>
      </div>
    </div>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({ onAuth, initialMode="login" }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password, options:{ data:{ full_name:name } } });
        if (error) throw error;
        setSuccess("Account created! Check your email to confirm, then log in.");
        setMode("login");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuth(data.user);
      }
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:T.bgSoft, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Inter',sans-serif", padding:20 }}>
      <div style={{ width:"100%", maxWidth:400 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:10, marginBottom:8 }}>
            <QuillLogo size={40}/>
            <span style={{ fontSize:24, fontWeight:800, color:T.ink, letterSpacing:"-0.5px" }}>Quill</span>
          </div>
          <p style={{ fontSize:13, color:T.inkMid, margin:0 }}>Marketing Agent</p>
        </div>
        <Card style={{ padding:32 }}>
          <h2 style={{ fontSize:20, fontWeight:700, color:T.ink, margin:"0 0 4px", letterSpacing:"-0.3px" }}>
            {mode==="login" ? "Welcome back" : "Start your free trial"}
          </h2>
          <p style={{ fontSize:13, color:T.inkMid, margin:"0 0 24px" }}>
            {mode==="login" ? "Sign in to your workspace" : "7 days free, no credit card needed"}
          </p>
          {error && <div style={{ background:T.crimsonSoft, border:`1px solid ${T.crimsonMid}`, borderRadius:8, padding:"10px 13px", fontSize:13, color:T.crimson, marginBottom:16 }}>{error}</div>}
          {success && <div style={{ background:T.greenSoft, border:`1px solid ${T.green}44`, borderRadius:8, padding:"10px 13px", fontSize:13, color:T.green, marginBottom:16 }}>{success}</div>}
          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {mode==="signup" && (
              <div><Label>Full name</Label><Input value={name} onChange={e=>setName(e.target.value)} placeholder="Jane Smith" required/></div>
            )}
            <div><Label>Email</Label><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/></div>
            <div><Label>Password</Label><Input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required/></div>
            <div style={{ marginTop:4 }}>
              <button type="submit" disabled={loading} style={{ width:"100%", padding:"11px 0", borderRadius:8, background:loading?T.inkMuted:T.ink, border:"none", color:T.white, fontSize:13, fontWeight:600, cursor:loading?"not-allowed":"pointer", fontFamily:"'Inter',sans-serif" }}>
                {loading ? "Please wait..." : (mode==="login" ? "Sign in" : "Create account")}
              </button>
            </div>
          </form>
          <div style={{ marginTop:20, textAlign:"center", fontSize:13, color:T.inkMid }}>
            {mode==="login" ? (
              <>Don't have an account? <button onClick={() => { setMode("signup"); setError(""); }} style={{ background:"none", border:"none", color:T.ink, cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:"'Inter',sans-serif", textDecoration:"underline" }}>Start free trial</button></>
            ) : (
              <>Already have an account? <button onClick={() => { setMode("login"); setError(""); }} style={{ background:"none", border:"none", color:T.ink, cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:"'Inter',sans-serif", textDecoration:"underline" }}>Sign in</button></>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── CAMPAIGNS + BRAND KIT ────────────────────────────────────────────────────
function CampaignsView({ user }) {
  const [subTab, setSubTab] = useState("campaigns");
  const [campaigns, setCampaigns] = useState([]);
  const [view, setView] = useState("list");
  const [form, setForm] = useState({ name:"", theme:"", brandVoice:"", platforms:[], frequency:"daily", postTime:"10:00" });
  const [preview, setPreview] = useState(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [postModal, setPostModal] = useState(null);
  const [postCaption, setPostCaption] = useState("");
  const [postImage, setPostImage] = useState(null);
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [generatingPostImage, setGeneratingPostImage] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => { fetchCampaigns(); }, []);

  const fetchCampaigns = async () => {
    setFetching(true);
    const { data } = await supabase.from("campaigns").select("*").order("created_at", { ascending:false });
    setCampaigns(data || []);
    setFetching(false);
  };

  const setField = (key, val) => setForm(f => ({...f, [key]:val}));
  const togglePlat = (id) => setField("platforms", form.platforms.includes(id) ? form.platforms.filter(p=>p!==id) : [...form.platforms, id]);

  const generatePreview = async () => {
    if (!form.theme.trim()) return;
    setGeneratingPreview(true); setPreview(null);
    try {
      let raw = "";
      await callClaude("Generate one social media post. Output ONLY a JSON object: {caption:string, hashtags:string[5]}. No markdown.", `Theme: "${form.theme}". Voice: ${form.brandVoice||"professional"}.`, c => { raw=c; });
      setPreview(JSON.parse(raw.replace(/```json|```/g,"").trim()));
    } catch { setError("Preview failed."); }
    setGeneratingPreview(false);
  };

  const createCampaign = async () => {
    if (!form.name.trim() || !form.theme.trim() || !form.platforms.length) { setError("Fill in name, theme, and select a platform."); return; }
    // Check campaign limit (trial = 2, starter = 3)
    const activeCampaigns = campaigns.filter(c => c.status === "active").length;
    if (activeCampaigns >= 2) { setError("You've reached your campaign limit. Upgrade your plan to create more campaigns."); return; }
    setLoading(true); setError("");
    const { error } = await supabase.from("campaigns").insert({ user_id:user.id, name:form.name, theme:form.theme, brand_voice:form.brandVoice||"professional", platforms:form.platforms, frequency:form.frequency, post_time:form.postTime, status:"active" });
    if (error) { setError(error.message); setLoading(false); return; }
    await fetchCampaigns();
    setForm({ name:"", theme:"", brandVoice:"", platforms:[], frequency:"daily", postTime:"10:00" });
    setPreview(null); setView("list"); setLoading(false);
  };

  const toggleStatus = async (campaign) => {
    const newStatus = campaign.status==="active"?"paused":"active";
    await supabase.from("campaigns").update({ status:newStatus }).eq("id", campaign.id);
    await fetchCampaigns();
  };

  const deleteCampaign = async (id) => {
    await supabase.from("campaigns").delete().eq("id", id);
    await fetchCampaigns();
  };

  const openPostModal = async (campaign) => {
    setPostModal(campaign); setPostImage(null); setPostCaption(""); setGeneratingCaption(true);
    try {
      let caption = "";
      await callClaude("Write one engaging social post caption. Output ONLY the caption.", `Theme: "${campaign.theme}". Voice: ${campaign.brand_voice}.`, c => { caption=c; });
      setPostCaption(caption);
    } catch { setError("Could not generate caption."); }
    setGeneratingCaption(false);
  };

  const generatePostImage = async () => {
    if (!postModal) return;
    setGeneratingPostImage(true);
    try {
      const res = await fetch(SERVER_URL + "/api/image", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ prompt:`Professional marketing image for Instagram. Theme: ${postModal.theme}. Clean, eye-catching style.` }) });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setPostImage(d.url);
    } catch(e) { setError("Image generation failed."); }
    setGeneratingPostImage(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPostImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  const publishPost = async () => {
    if (!postModal || !postCaption.trim()) return;
    setPublishing(true);
    try {
      const res = await fetch(SERVER_URL + "/api/publish", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ platforms:postModal.platforms, text:postCaption, imageUrl:postImage, theme:postModal.theme }) });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      await supabase.from("campaigns").update({ posts_published:(postModal.posts_published||0)+1, last_post:postCaption.slice(0,55)+"..." }).eq("id", postModal.id);
      await fetchCampaigns();
      setPostModal(null);
      alert("Posted successfully!");
    } catch(e) { setError("Post failed: "+e.message); }
    setPublishing(false);
  };

  // Brand Kit sub-tab
  if (subTab==="brandkit") return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:28 }}>
        <button onClick={() => setSubTab("campaigns")} style={{ padding:"7px 14px", borderRadius:8, background:T.white, border:`1.5px solid ${T.border}`, color:T.inkMid, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>← Back</button>
        <h2 style={{ fontSize:24, fontWeight:800, color:T.ink, margin:0, letterSpacing:"-0.5px" }}>Brand Kit</h2>
      </div>
      <BrandKitView user={user}/>
    </div>
  );

  // Create campaign
  if (view==="create") return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:28 }}>
        <button onClick={() => { setView("list"); setError(""); }} style={{ padding:"7px 14px", borderRadius:8, background:T.white, border:`1.5px solid ${T.border}`, color:T.inkMid, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>← Back</button>
        <h2 style={{ fontSize:24, fontWeight:800, color:T.ink, margin:0, letterSpacing:"-0.5px" }}>New Campaign</h2>
      </div>
      {error && <div style={{ background:T.crimsonSoft, border:`1px solid ${T.crimsonMid}`, borderRadius:8, padding:"10px 13px", fontSize:13, color:T.crimson, marginBottom:16 }}>{error}</div>}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div><Label>Campaign name</Label><Input value={form.name} onChange={e=>setField("name",e.target.value)} placeholder="e.g. Daily Style Tips"/></div>
          <div><Label>Content theme</Label><Textarea value={form.theme} onChange={e=>setField("theme",e.target.value)} placeholder="e.g. Daily fashion tips for boutique shoppers." height={90}/></div>
          <div><Label>Brand voice (optional)</Label><Input value={form.brandVoice} onChange={e=>setField("brandVoice",e.target.value)} placeholder="e.g. warm, stylish, fashion-forward"/></div>
          <div>
            <Label>Platforms</Label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {PLATFORMS.map(p => (
                <button key={p.id} onClick={() => togglePlat(p.id)} style={{ padding:"7px 14px", borderRadius:20, fontSize:12, fontWeight:600, background:form.platforms.includes(p.id)?p.color+"18":T.white, border:`1.5px solid ${form.platforms.includes(p.id)?p.color:T.border}`, color:form.platforms.includes(p.id)?p.color:T.inkMid, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>{p.icon} {p.label}</button>
              ))}
            </div>
          </div>
          <div>
            <Label>Frequency</Label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {FREQUENCIES.map(f => (
                <button key={f.id} onClick={() => setField("frequency",f.id)} style={{ padding:"9px 12px", borderRadius:8, background:form.frequency===f.id?T.ink:T.white, border:`1.5px solid ${form.frequency===f.id?T.ink:T.border}`, color:form.frequency===f.id?T.white:T.inkMid, cursor:"pointer", fontSize:12, fontWeight:600, textAlign:"left", fontFamily:"'Inter',sans-serif" }}>{f.label}</button>
              ))}
            </div>
          </div>
          <div><Label>Post time</Label><Input type="time" value={form.postTime} onChange={e=>setField("postTime",e.target.value)}/></div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={generatePreview} disabled={generatingPreview||!form.theme.trim()} style={{ flex:1, padding:"10px 0", borderRadius:8, background:T.white, border:`1.5px solid ${T.border}`, color:T.inkMid, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>{generatingPreview?"Generating...":"Preview"}</button>
            <button onClick={createCampaign} disabled={loading} style={{ flex:2, padding:"10px 0", borderRadius:8, background:loading?T.inkMuted:T.ink, border:"none", color:T.white, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>{loading?"Launching...":"Launch Campaign"}</button>
          </div>
        </div>
        <div>
          <Label>Preview</Label>
          {preview ? (
            <Card style={{ marginTop:6 }}>
              <div style={{ fontSize:10, fontWeight:700, color:T.inkLight, letterSpacing:"0.08em", marginBottom:12 }}>SAMPLE POST</div>
              <p style={{ fontSize:14, color:T.ink, lineHeight:1.7, marginBottom:14 }}>{preview.caption}</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {preview.hashtags?.map((h,i) => <span key={i} style={{ fontSize:12, color:T.inkMid, background:T.bgMuted, padding:"2px 10px", borderRadius:20 }}>#{h}</span>)}
              </div>
            </Card>
          ) : (
            <Card style={{ minHeight:200, display:"flex", alignItems:"center", justifyContent:"center", marginTop:6, background:T.bgSoft }}>
              <p style={{ fontSize:13, color:T.inkMuted, textAlign:"center" }}>Fill in your theme and click Preview</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <UsageBanner currentPlan="trial" campaigns={campaigns.length} posts={campaigns.reduce((s,c)=>s+(c.posts_published||0),0)} images={0}/>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28 }}>
        <div>
          <h2 style={{ fontSize:28, fontWeight:800, color:T.ink, margin:0, letterSpacing:"-0.5px" }}>Campaigns</h2>
          <p style={{ fontSize:13, color:T.inkMid, marginTop:4 }}>Set a theme and a schedule — Quill publishes automatically</p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={() => setSubTab("brandkit")} style={{ padding:"9px 18px", borderRadius:8, background:T.white, border:`1.5px solid ${T.border}`, color:T.inkMid, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>🎨 Brand Kit</button>
          <button onClick={() => { setView("create"); setError(""); }} style={{ padding:"9px 20px", borderRadius:8, background:T.ink, border:"none", color:T.white, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>+ New Campaign</button>
        </div>
      </div>

      {error && <div style={{ background:T.crimsonSoft, border:`1px solid ${T.crimsonMid}`, borderRadius:8, padding:"10px 13px", fontSize:13, color:T.crimson, marginBottom:16 }}>{error}</div>}

      {fetching ? (
        <div style={{ textAlign:"center", padding:60, color:T.inkMid }}>Loading...</div>
      ) : campaigns.length===0 ? (
        <Card style={{ padding:"80px 40px", textAlign:"center", background:T.bgSoft }}>
          <div style={{ width:56, height:56, borderRadius:12, background:T.bgMuted, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", fontSize:24 }}>✦</div>
          <h3 style={{ fontSize:20, fontWeight:700, color:T.ink, margin:"0 0 8px" }}>No campaigns yet</h3>
          <p style={{ fontSize:14, color:T.inkMid, maxWidth:340, margin:"0 auto 24px", lineHeight:1.6 }}>Create your first campaign and let Quill generate and publish content automatically</p>
          <button onClick={() => setView("create")} style={{ padding:"10px 24px", borderRadius:8, background:T.ink, border:"none", color:T.white, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>Create first campaign</button>
        </Card>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16 }}>
          {campaigns.map(c => (
            <Card key={c.id} style={{ display:"flex", flexDirection:"column", gap:14, border:`1.5px solid ${c.status==="active"?T.ink:T.border}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div style={{ flex:1, minWidth:0, marginRight:10 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:T.ink, marginBottom:4 }}>{c.name}</div>
                  <div style={{ fontSize:12, color:T.inkMid, lineHeight:1.5 }}>"{c.theme?.slice(0,55)}{c.theme?.length>55?"...":""}"</div>
                </div>
                <Badge color={c.status==="active"?"green":"gold"}>{c.status==="active"?"ACTIVE":"PAUSED"}</Badge>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {c.platforms?.map(pid => { const p=PLATFORMS.find(pl=>pl.id===pid); return p?<span key={pid} style={{ fontSize:11, padding:"3px 10px", borderRadius:20, background:p.color+"12", color:p.color, border:`1px solid ${p.color}22`, fontWeight:600 }}>{p.icon} {p.label}</span>:null; })}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                {[
                  { label:"Schedule", val:FREQUENCIES.find(f=>f.id===c.frequency)?.label },
                  { label:"Published", val:c.posts_published||0 },
                  { label:"Post time", val:c.post_time },
                ].map(s => (
                  <div key={s.label} style={{ background:T.bgSoft, borderRadius:8, padding:"8px 10px" }}>
                    <div style={{ fontSize:9, color:T.inkLight, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:3 }}>{s.label}</div>
                    <div style={{ fontSize:12, color:T.ink, fontWeight:600 }}>{s.val}</div>
                  </div>
                ))}
              </div>
              {c.last_post && <p style={{ fontSize:12, color:T.inkMid, fontStyle:"italic", margin:0 }}>Last: "{c.last_post}"</p>}
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => openPostModal(c)} style={{ flex:1, padding:"8px 0", borderRadius:8, background:T.bgSoft, border:`1.5px solid ${T.border}`, color:T.inkMid, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>▶ Post now</button>
                <button onClick={() => toggleStatus(c)} style={{ flex:1, padding:"8px 0", borderRadius:8, background:T.bgSoft, border:`1.5px solid ${T.border}`, color:c.status==="active"?T.gold:T.green, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>{c.status==="active"?"⏸ Pause":"▶ Resume"}</button>
                <button onClick={() => deleteCampaign(c.id)} style={{ padding:"8px 12px", borderRadius:8, background:T.crimsonSoft, border:`1px solid ${T.crimsonMid}`, color:T.crimson, fontSize:12, cursor:"pointer" }}>✕</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Post Modal */}
      {postModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:T.white, borderRadius:16, padding:32, width:"100%", maxWidth:560, maxHeight:"90vh", overflowY:"auto", boxShadow:`0 20px 60px rgba(0,0,0,0.2)` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h3 style={{ fontSize:18, fontWeight:700, color:T.ink, margin:0 }}>Post to {postModal.name}</h3>
              <button onClick={() => setPostModal(null)} style={{ background:"none", border:"none", fontSize:22, color:T.inkMid, cursor:"pointer" }}>×</button>
            </div>
            <div style={{ display:"flex", gap:8, marginBottom:20 }}>
              {postModal.platforms?.map(pid => { const p=PLATFORMS.find(pl=>pl.id===pid); return p?<span key={pid} style={{ fontSize:11, padding:"3px 10px", borderRadius:20, background:p.color+"12", color:p.color, border:`1px solid ${p.color}22`, fontWeight:600 }}>{p.icon} {p.label}</span>:null; })}
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <Label>Caption</Label>
                <button onClick={() => openPostModal(postModal)} disabled={generatingCaption} style={{ fontSize:11, color:T.ink, background:"none", border:"none", cursor:"pointer", fontWeight:600, textDecoration:"underline" }}>{generatingCaption?"Generating...":"↻ Regenerate"}</button>
              </div>
              <Textarea value={postCaption} onChange={e=>setPostCaption(e.target.value)} height={100}/>
            </div>
            <div style={{ marginBottom:24 }}>
              <Label>Image {postModal.platforms?.includes("instagram")?"(required for Instagram)":"(optional)"}</Label>
              {postImage ? (
                <div style={{ position:"relative", borderRadius:10, overflow:"hidden", border:`1px solid ${T.border}`, marginBottom:10 }}>
                  <img src={postImage} alt="Post" style={{ width:"100%", display:"block", maxHeight:240, objectFit:"cover" }}/>
                  <button onClick={() => setPostImage(null)} style={{ position:"absolute", top:8, right:8, background:"rgba(0,0,0,0.6)", border:"none", color:"#fff", borderRadius:"50%", width:28, height:28, cursor:"pointer", fontSize:16 }}>×</button>
                </div>
              ) : (
                <div style={{ border:`2px dashed ${T.border}`, borderRadius:10, padding:24, textAlign:"center", marginBottom:10 }}>
                  <p style={{ fontSize:13, color:T.inkMid, marginBottom:14 }}>No image selected</p>
                  <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
                    <button onClick={generatePostImage} disabled={generatingPostImage} style={{ padding:"8px 16px", borderRadius:8, background:T.ink, border:"none", color:T.white, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>{generatingPostImage?"Generating...":"✦ Generate image"}</button>
                    <label style={{ padding:"8px 16px", borderRadius:8, background:T.white, border:`1.5px solid ${T.border}`, color:T.inkMid, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>
                      ↑ Upload
                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display:"none" }}/>
                    </label>
                  </div>
                </div>
              )}
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setPostModal(null)} style={{ flex:1, padding:"11px 0", borderRadius:8, background:T.white, border:`1.5px solid ${T.border}`, color:T.inkMid, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>Cancel</button>
              <button onClick={publishPost} disabled={publishing||!postCaption.trim()} style={{ flex:2, padding:"11px 0", borderRadius:8, background:publishing||!postCaption.trim()?T.inkMuted:T.ink, border:"none", color:T.white, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>{publishing?"Publishing...":"Publish post"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── COPYWRITER ────────────────────────────────────────────────────────────────
function CopywriterView() {
  const [copyType, setCopyType] = useState(COPY_TYPES[0]);
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Professional");
  const [brandVoice, setBrandVoice] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!topic.trim()) return;
    setOutput(""); setError(""); setLoading(true);
    try { await callClaude(`Expert marketing copywriter. Write compelling ${copyType.label}. Output ONLY the copy.`, `About: "${topic}". Tone: ${tone}.${brandVoice?` Voice: ${brandVoice}.`:""}`, c => setOutput(c)); }
    catch(e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:28, fontWeight:800, color:T.ink, margin:0, letterSpacing:"-0.5px" }}>Copywriter</h2>
        <p style={{ fontSize:13, color:T.inkMid, marginTop:4 }}>Generate on-brand marketing copy in seconds</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
        <Card style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div>
            <Label>Content type</Label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {COPY_TYPES.map(t => <button key={t.id} onClick={() => setCopyType(t)} style={{ padding:"9px 12px", borderRadius:8, background:copyType.id===t.id?T.ink:T.white, border:`1.5px solid ${copyType.id===t.id?T.ink:T.border}`, color:copyType.id===t.id?T.white:T.inkMid, cursor:"pointer", fontSize:12, fontWeight:600, textAlign:"left", fontFamily:"'Inter',sans-serif" }}>{t.label}</button>)}
            </div>
          </div>
          <div><Label>What's it about?</Label><Textarea value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. Summer sale — 40% off all shoes this weekend"/></div>
          <div>
            <Label>Tone</Label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {TONES.map(t => <button key={t} onClick={() => setTone(t)} style={{ padding:"6px 14px", borderRadius:20, background:tone===t?T.ink:T.white, border:`1.5px solid ${tone===t?T.ink:T.border}`, color:tone===t?T.white:T.inkMid, cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"'Inter',sans-serif" }}>{t}</button>)}
            </div>
          </div>
          <div><Label>Brand voice (optional)</Label><Input value={brandVoice} onChange={e=>setBrandVoice(e.target.value)} placeholder="e.g. friendly, boutique, fashion-forward"/></div>
          <Btn onClick={generate} disabled={loading||!topic.trim()}>{loading?"Writing...":"Generate"}</Btn>
        </Card>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <Label>Output</Label>
            {output && <button onClick={() => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(()=>setCopied(false),2000); }} style={{ padding:"5px 12px", borderRadius:6, background:copied?T.greenSoft:T.white, border:`1px solid ${copied?T.green:T.border}`, color:copied?T.green:T.inkMid, cursor:"pointer", fontSize:12 }}>{copied?"✓ Copied":"Copy"}</button>}
          </div>
          <Card style={{ flex:1, minHeight:320, color:error?T.crimson:(output?T.ink:T.inkMuted), fontSize:14, lineHeight:1.75, whiteSpace:"pre-wrap", display:"flex", alignItems:output||error?"flex-start":"center", justifyContent:output||error?"flex-start":"center", background:T.bgSoft }}>
            {error||output||(loading?"Writing your copy...":"Your copy will appear here...")}
          </Card>
          {output && <Btn onClick={generate} variant="secondary">↻ Regenerate</Btn>}
        </div>
      </div>
    </div>
  );
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
function AnalyticsView({ user }) {
  const [insight, setInsight] = useState("");
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setLoadingStats(true); setError("");
    try {
      const res = await fetch(SERVER_URL + "/api/analytics/stats?username=Quill");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStats(data.impressions);
      setHistory(data.history?.history || []);
    } catch(e) { setError("Could not load analytics: " + e.message); }
    setLoadingStats(false);
  };

  const analyze = async () => {
    setInsight(""); setLoadingInsight(true);
    try {
      const summary = stats ? `Total impressions: ${stats.total_impressions||0}, Posts: ${history.length}` : "No data yet";
      await callClaude("Social media analyst. Be concise and actionable. Plain text.", `${summary}. Give 3-sentence insight + 1 recommendation.`, c => setInsight(c));
    } catch(e) { setInsight("Could not generate insight."); }
    setLoadingInsight(false);
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28 }}>
        <div>
          <h2 style={{ fontSize:28, fontWeight:800, color:T.ink, margin:0, letterSpacing:"-0.5px" }}>Analytics</h2>
          <p style={{ fontSize:13, color:T.inkMid, marginTop:4 }}>Real performance data from your connected accounts</p>
        </div>
        <button onClick={fetchStats} disabled={loadingStats} style={{ padding:"8px 16px", borderRadius:8, background:T.white, border:`1.5px solid ${T.border}`, color:T.inkMid, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>{loadingStats?"Loading...":"↻ Refresh"}</button>
      </div>

      {error && <div style={{ background:T.crimsonSoft, border:`1px solid ${T.crimsonMid}`, borderRadius:8, padding:"10px 13px", fontSize:13, color:T.crimson, marginBottom:16 }}>{error}</div>}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        {[
          { label:"Total impressions", val:stats?.total_impressions??0 },
          { label:"Total posts", val:history.length },
          { label:"Successful posts", val:history.filter(p=>p.success).length },
          { label:"Platforms connected", val:1 },
        ].map(s => (
          <Card key={s.label} style={{ textAlign:"center", padding:20 }}>
            <div style={{ fontSize:10, fontWeight:700, color:T.inkLight, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>{s.label}</div>
            <div style={{ fontSize:28, fontWeight:800, color:T.ink, letterSpacing:"-0.5px" }}>{loadingStats?"...":s.val}</div>
          </Card>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontSize:14, fontWeight:700, color:T.ink }}>Smart insight</div>
            <button onClick={analyze} disabled={loadingInsight} style={{ padding:"6px 14px", borderRadius:8, fontSize:11, background:T.bgMuted, border:`1px solid ${T.border}`, color:T.inkMid, cursor:loadingInsight?"not-allowed":"pointer", fontFamily:"'Inter',sans-serif", fontWeight:600 }}>{loadingInsight?"Thinking…":"Analyze"}</button>
          </div>
          <p style={{ fontSize:13, color:T.inkMid, lineHeight:1.7, minHeight:80, margin:0 }}>
            {insight||"Click Analyze to get insights on your performance."}
          </p>
        </Card>
        <Card>
          <div style={{ fontSize:14, fontWeight:700, color:T.ink, marginBottom:14 }}>Post success rate</div>
          {history.length===0 ? (
            <p style={{ fontSize:13, color:T.inkMuted }}>No posts yet.</p>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:13, color:T.inkMid }}>Successful</span>
                <span style={{ fontSize:13, fontWeight:700, color:T.green }}>{history.filter(p=>p.success).length}</span>
              </div>
              <div style={{ height:8, background:T.bgMuted, borderRadius:4, overflow:"hidden" }}>
                <div style={{ height:"100%", background:T.green, borderRadius:4, width:`${(history.filter(p=>p.success).length/history.length)*100}%` }}/>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:13, color:T.inkMid }}>Failed</span>
                <span style={{ fontSize:13, fontWeight:700, color:T.crimson }}>{history.filter(p=>!p.success).length}</span>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div style={{ fontSize:14, fontWeight:700, color:T.ink, marginBottom:16 }}>Recent posts</div>
        {loadingStats ? (
          <p style={{ fontSize:13, color:T.inkMid }}>Loading...</p>
        ) : history.length===0 ? (
          <p style={{ fontSize:13, color:T.inkMuted }}>No posts yet. Create a campaign to start publishing!</p>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {history.slice(0,5).map((post,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 14px", background:T.bgSoft, borderRadius:10, border:`1px solid ${T.border}` }}>
                <div style={{ width:28, height:28, borderRadius:6, background:post.success?T.greenSoft:T.crimsonSoft, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, flexShrink:0 }}>{post.success?"✓":"✕"}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, color:T.ink, margin:"0 0 3px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{post.post_title||post.post_caption||"Post"}</p>
                  <span style={{ fontSize:11, color:T.inkLight }}>{post.platform} · {post.upload_timestamp?new Date(post.upload_timestamp).toLocaleDateString():""}</span>
                </div>
                {post.post_url && <a href={post.post_url} target="_blank" rel="noreferrer" style={{ fontSize:11, color:T.ink, textDecoration:"none", fontWeight:600, flexShrink:0, border:`1px solid ${T.border}`, padding:"4px 10px", borderRadius:6 }}>View →</a>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── BRAND KIT ────────────────────────────────────────────────────────────────
function BrandKitView({ user }) {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [brandName, setBrandName] = useState("");
  const [brandColors, setBrandColors] = useState("");
  const [brandVoice, setBrandVoice] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => { fetchImages(); fetchSettings(); }, []);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage.from("brand-kit").list(user.id + "/", { limit:20 });
      if (error) throw error;
      const urls = (data||[]).map(file => ({
        name:file.name,
        url:supabase.storage.from("brand-kit").getPublicUrl(user.id+"/"+file.name).data.publicUrl,
      }));
      setImages(urls);
    } catch(e) { setError("Could not load images."); }
    setLoading(false);
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from("brand_settings").select("*").eq("user_id", user.id).single();
    if (data) { setBrandName(data.brand_name||""); setBrandColors(data.brand_colors||""); setBrandVoice(data.brand_voice||""); }
  };

  const saveSettings = async () => {
    setSavingSettings(true); setError(""); setSuccess("");
    try {
      await supabase.from("brand_settings").upsert({ user_id:user.id, brand_name:brandName, brand_colors:brandColors, brand_voice:brandVoice, updated_at:new Date().toISOString() });
      setSuccess("Brand settings saved!");
      setTimeout(() => setSuccess(""), 3000);
    } catch(e) { setError("Could not save settings."); }
    setSavingSettings(false);
  };

  const uploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true); setError(""); setSuccess("");
    try {
      const fileName = Date.now()+"_"+file.name.replace(/\s/g,"_");
      const { error } = await supabase.storage.from("brand-kit").upload(user.id+"/"+fileName, file, { contentType:file.type });
      if (error) throw error;
      setSuccess("Image uploaded!");
      setTimeout(() => setSuccess(""), 3000);
      await fetchImages();
    } catch(e) { setError("Upload failed: "+e.message); }
    setUploading(false);
  };

  const deleteImage = async (name) => {
    await supabase.storage.from("brand-kit").remove([user.id+"/"+name]);
    await fetchImages();
  };

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        <Card>
          <h3 style={{ fontSize:16, fontWeight:700, color:T.ink, margin:"0 0 16px" }}>Brand settings</h3>
          {error && <div style={{ background:T.crimsonSoft, border:`1px solid ${T.crimsonMid}`, borderRadius:8, padding:"10px 13px", fontSize:13, color:T.crimson, marginBottom:12 }}>{error}</div>}
          {success && <div style={{ background:T.greenSoft, border:`1px solid ${T.green}44`, borderRadius:8, padding:"10px 13px", fontSize:13, color:T.green, marginBottom:12 }}>{success}</div>}
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div><Label>Brand name</Label><Input value={brandName} onChange={e=>setBrandName(e.target.value)} placeholder="e.g. Luxe Boutique"/></div>
            <div><Label>Brand colors</Label><Input value={brandColors} onChange={e=>setBrandColors(e.target.value)} placeholder="e.g. blush pink, gold, cream"/></div>
            <div><Label>Brand voice</Label><Textarea value={brandVoice} onChange={e=>setBrandVoice(e.target.value)} placeholder="e.g. Feminine, elegant, speaks to fashion-forward women aged 25-45" height={80}/></div>
            <Btn onClick={saveSettings} disabled={savingSettings}>{savingSettings?"Saving...":"Save settings"}</Btn>
          </div>
        </Card>
        <Card>
          <h3 style={{ fontSize:16, fontWeight:700, color:T.ink, margin:"0 0 12px" }}>Upload brand images</h3>
          <p style={{ fontSize:13, color:T.inkMid, marginBottom:16, lineHeight:1.6 }}>Upload your logo, product photos, or brand imagery to use in posts.</p>
          <label style={{ display:"block", border:`2px dashed ${T.border}`, borderRadius:10, padding:"28px 20px", textAlign:"center", cursor:"pointer", background:T.bgSoft }}>
            <div style={{ fontSize:24, marginBottom:8, opacity:0.4 }}>↑</div>
            <div style={{ fontSize:13, fontWeight:600, color:T.inkMid, marginBottom:4 }}>{uploading?"Uploading...":"Click to upload image"}</div>
            <div style={{ fontSize:12, color:T.inkMuted }}>PNG, JPG, WEBP up to 10MB</div>
            <input type="file" accept="image/*" onChange={uploadImage} disabled={uploading} style={{ display:"none" }}/>
          </label>
        </Card>
      </div>
      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <h3 style={{ fontSize:16, fontWeight:700, color:T.ink, margin:0 }}>Your images</h3>
          <button onClick={fetchImages} style={{ background:"none", border:"none", color:T.inkMid, cursor:"pointer", fontSize:12, textDecoration:"underline" }}>↻ Refresh</button>
        </div>
        {loading ? <p style={{ fontSize:13, color:T.inkMid }}>Loading...</p> : images.length===0 ? (
          <div style={{ textAlign:"center", padding:"40px 20px" }}>
            <div style={{ fontSize:32, opacity:0.2, marginBottom:12 }}>🖼</div>
            <p style={{ fontSize:13, color:T.inkMuted }}>No images yet. Upload your logo or brand photos.</p>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {images.map((img,i) => (
              <div key={i} style={{ borderRadius:10, overflow:"hidden", border:`1px solid ${T.border}` }}>
                <img src={img.url} alt={img.name} style={{ width:"100%", height:110, objectFit:"cover", display:"block" }}/>
                <div style={{ background:T.white, padding:"8px 10px" }}>
                  <div style={{ fontSize:11, color:T.inkMid, marginBottom:6, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{img.name}</div>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={() => { navigator.clipboard.writeText(img.url); }} style={{ flex:1, padding:"5px 0", borderRadius:6, background:T.bgSoft, border:`1px solid ${T.border}`, color:T.inkMid, fontSize:11, cursor:"pointer" }}>Copy URL</button>
                    <button onClick={() => deleteImage(img.name)} style={{ padding:"5px 10px", borderRadius:6, background:T.crimsonSoft, border:`1px solid ${T.crimsonMid}`, color:T.crimson, fontSize:11, cursor:"pointer" }}>✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── ACCOUNTS ─────────────────────────────────────────────────────────────────
function AccountsView({ user }) {
  const [accounts, setAccounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const uploadPostUsername = user.id;

  useEffect(() => { initProfile(); }, []);

  const initProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(SERVER_URL + "/api/social/accounts", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ username:uploadPostUsername }) });
      const data = await res.json();
      if (data.profile) setAccounts(data.profile.social_accounts||{});
      else {
        await fetch(SERVER_URL + "/api/social/create-profile", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ username:uploadPostUsername }) });
        setAccounts({});
      }
    } catch(e) { setError("Could not load accounts."); }
    setLoading(false);
  };

  const connectAccounts = async () => {
    setConnecting(true); setError(""); setSuccess("");
    try {
      const res = await fetch(SERVER_URL + "/api/social/connect-link", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ username:uploadPostUsername }) });
      const data = await res.json();
      if (data.access_url) {
        setSuccess("Opening social media connection page...");
        window.open(data.access_url, "_blank");
        setTimeout(() => initProfile(), 5000);
      } else throw new Error(data.message||"Could not generate link");
    } catch(e) { setError("Could not generate connection link: "+e.message); }
    setConnecting(false);
  };

  const SOCIAL_PLATFORMS = [
    { id:"instagram", label:"Instagram", color:"#C13584", icon:"◈" },
    { id:"facebook",  label:"Facebook",  color:"#1877F2", icon:"◉" },
    { id:"linkedin",  label:"LinkedIn",  color:"#0A66C2", icon:"◆" },
    { id:"twitter",   label:"X / Twitter", color:"#14171A", icon:"◇" },
    { id:"tiktok",    label:"TikTok",    color:"#010101", icon:"◐" },
  ];

  const isConnected = (platform) => {
    if (!accounts) return false;
    const acc = accounts[platform];
    return acc && typeof acc==="object" && (acc.handle||acc.display_name||acc.username);
  };

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:28, fontWeight:800, color:T.ink, margin:0, letterSpacing:"-0.5px" }}>Connected Accounts</h2>
        <p style={{ fontSize:13, color:T.inkMid, marginTop:4 }}>Link your social media accounts to publish directly from Quill</p>
      </div>
      {error && <div style={{ background:T.crimsonSoft, border:`1px solid ${T.crimsonMid}`, borderRadius:8, padding:"10px 13px", fontSize:13, color:T.crimson, marginBottom:16 }}>{error}</div>}
      {success && <div style={{ background:T.greenSoft, border:`1px solid ${T.green}44`, borderRadius:8, padding:"10px 13px", fontSize:13, color:T.green, marginBottom:16 }}>{success}</div>}
      {loading ? <div style={{ textAlign:"center", padding:60, color:T.inkMid }}>Loading...</div> : (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:12, marginBottom:24 }}>
            {SOCIAL_PLATFORMS.map(platform => {
              const connected = isConnected(platform.id);
              const accountData = accounts?.[platform.id];
              return (
                <Card key={platform.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 18px", border:`1.5px solid ${connected?T.ink:T.border}` }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:platform.color+"12", border:`1.5px solid ${platform.color}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, color:platform.color, flexShrink:0 }}>{platform.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.ink, marginBottom:3 }}>{platform.label}</div>
                    {connected ? <div style={{ fontSize:12, color:T.green }}>✓ Connected{accountData?.display_name?` as @${accountData.display_name}`:accountData?.handle?` as @${accountData.handle}`:""}</div> : <div style={{ fontSize:12, color:T.inkMid }}>Not connected</div>}
                  </div>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:connected?T.green:T.bgMuted, flexShrink:0 }}/>
                </Card>
              );
            })}
          </div>
          <Card style={{ textAlign:"center", padding:"40px 32px", background:T.bgSoft }}>
            <h3 style={{ fontSize:18, fontWeight:700, color:T.ink, margin:"0 0 10px" }}>Connect your social accounts</h3>
            <p style={{ fontSize:13, color:T.inkMid, maxWidth:380, margin:"0 auto 24px", lineHeight:1.65 }}>Connect Instagram, Facebook, LinkedIn, X, and TikTok in one place. The link expires in 48 hours.</p>
            <button onClick={connectAccounts} disabled={connecting} style={{ padding:"12px 28px", borderRadius:8, background:connecting?T.inkMuted:T.ink, border:"none", color:T.white, fontSize:13, fontWeight:600, cursor:connecting?"not-allowed":"pointer", fontFamily:"'Inter',sans-serif" }}>{connecting?"Generating link...":"Connect social accounts"}</button>
          </Card>
          <div style={{ marginTop:12 }}>
            <button onClick={initProfile} style={{ background:"none", border:"none", color:T.inkMid, cursor:"pointer", fontSize:12, textDecoration:"underline" }}>↻ Refresh connection status</button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── BILLING ──────────────────────────────────────────────────────────────────
function BillingView({ user }) {
  const [currentPlan, setCurrentPlan] = useState("free");
  const [billing, setBilling] = useState("monthly");
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    checkStatus();
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment")==="success") { setMessage("Payment successful! Your plan has been upgraded."); window.history.replaceState({},"/","/"); }
    else if (params.get("payment")==="cancelled") { setMessage("Payment cancelled. No charge was made."); window.history.replaceState({},"/","/"); }
  }, []);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(SERVER_URL + "/api/stripe/status", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ userEmail:user.email }) });
      const data = await res.json();
      setCurrentPlan(data.plan||"free");
    } catch { setCurrentPlan("free"); }
    setLoading(false);
  };

  const checkout = async (plan) => {
    setCheckingOut(plan.id);
    try {
      const priceId = billing==="annual" ? plan.annualPriceId : plan.monthlyPriceId;
      const res = await fetch(SERVER_URL + "/api/stripe/checkout", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ priceId, userId:user.id, userEmail:user.email, plan:plan.id }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      window.location.href = data.url;
    } catch(e) { setMessage("Checkout failed: "+e.message); }
    setCheckingOut(null);
  };

  const monthlyTotal = PLANS.reduce((sum, p) => sum + p.monthlyPrice, 0);
  const annualTotal = PLANS.reduce((sum, p) => sum + p.annualPrice, 0);
  const savings = monthlyTotal * 12 - annualTotal;

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:28, fontWeight:800, color:T.ink, margin:0, letterSpacing:"-0.5px" }}>Billing</h2>
        <p style={{ fontSize:13, color:T.inkMid, marginTop:4 }}>Choose the plan that fits your business</p>
      </div>

      {message && <div style={{ background:message.includes("successful")?T.greenSoft:T.crimsonSoft, border:`1px solid ${message.includes("successful")?T.green:T.crimson}44`, borderRadius:8, padding:"12px 16px", fontSize:13, color:message.includes("successful")?T.green:T.crimson, marginBottom:24 }}>{message}</div>}

      {/* Billing toggle */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:16, marginBottom:40 }}>
        <button onClick={() => setBilling("monthly")} style={{ padding:"8px 20px", borderRadius:8, background:billing==="monthly"?T.ink:T.white, border:`1.5px solid ${billing==="monthly"?T.ink:T.border}`, color:billing==="monthly"?T.white:T.inkMid, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>Monthly</button>
        <button onClick={() => setBilling("annual")} style={{ padding:"8px 20px", borderRadius:8, background:billing==="annual"?T.ink:T.white, border:`1.5px solid ${billing==="annual"?T.ink:T.border}`, color:billing==="annual"?T.white:T.inkMid, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif", display:"flex", alignItems:"center", gap:8 }}>
          Annual
          <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, background:T.greenSoft, color:T.green }}>SAVE 20%</span>
        </button>
      </div>

      {loading ? <div style={{ textAlign:"center", padding:60, color:T.inkMid }}>Checking your plan...</div> : (
        <>
          {currentPlan!=="free" && (
            <div style={{ background:T.greenSoft, border:`1px solid ${T.green}44`, borderRadius:10, padding:"14px 20px", marginBottom:24, display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontSize:18 }}>✓</span>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:T.green }}>Active plan: {currentPlan.charAt(0).toUpperCase()+currentPlan.slice(1)}</div>
                <div style={{ fontSize:12, color:T.inkMid }}>Your subscription is active and renews {billing==="annual"?"annually":"monthly"}</div>
              </div>
            </div>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20, marginBottom:24 }}>
            {PLANS.filter(p => p.id !== "trial").map(plan => {
              const price = billing==="annual" ? plan.annualPrice : plan.monthlyPrice;
              const period = billing==="annual" ? "/yr" : "/mo";
              return (
                <div key={plan.id} style={{ background:T.white, borderRadius:16, border:`1.5px solid ${plan.popular?T.ink:T.border}`, padding:28, display:"flex", flexDirection:"column", gap:16, position:"relative", boxShadow:plan.popular?`0 4px 24px ${T.shadowMd}`:`0 1px 4px ${T.shadow}` }}>
                  {plan.popular && <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", background:T.ink, color:T.white, fontSize:10, fontWeight:700, padding:"4px 14px", borderRadius:20, letterSpacing:"0.06em", whiteSpace:"nowrap" }}>MOST POPULAR</div>}
                  <div>
                    <div style={{ fontSize:17, fontWeight:700, color:T.ink, marginBottom:4 }}>{plan.name}</div>
                    <div style={{ fontSize:12, color:T.inkMid }}>{plan.description}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:38, fontWeight:800, color:T.ink, letterSpacing:"-1px", lineHeight:1 }}>${price}<span style={{ fontSize:14, fontWeight:400, color:T.inkMid }}>{period}</span></div>
                    {billing==="annual" && <div style={{ fontSize:12, color:T.green, marginTop:4 }}>Save ${(plan.monthlyPrice*12-plan.annualPrice)}/yr vs monthly</div>}
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8, flex:1 }}>
                    {plan.features.map((f,i) => (
                      <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                        <span style={{ color:T.green, fontWeight:700, flexShrink:0, fontSize:13 }}>✓</span>
                        <span style={{ fontSize:13, color:T.inkMid, lineHeight:1.5 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => currentPlan!==plan.id && checkout(plan)} disabled={checkingOut===plan.id||currentPlan===plan.id} style={{ padding:"11px 0", borderRadius:8, background:currentPlan===plan.id?T.greenSoft:plan.popular?T.ink:T.white, border:currentPlan===plan.id?`1px solid ${T.green}`:plan.popular?"none":`1.5px solid ${T.border}`, color:currentPlan===plan.id?T.green:plan.popular?T.white:T.ink, fontSize:13, fontWeight:600, cursor:currentPlan===plan.id?"default":"pointer", fontFamily:"'Inter',sans-serif", transition:"all 0.15s" }}>
                    {checkingOut===plan.id?"Redirecting...":currentPlan===plan.id?"✓ Current plan":"Start 7-day free trial"}
                  </button>
                </div>
              );
            })}
          </div>
          <p style={{ textAlign:"center", fontSize:12, color:T.inkMuted }}>All plans include a 7-day free trial. Cancel anytime. No hidden fees. Test card: 4242 4242 4242 4242.</p>
        </>
      )}
    </div>
  );
}

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
const NAV = [
  { id:"campaigns", label:"Campaigns", icon:"✦" },
  { id:"copy",      label:"Copywriter", icon:"✎" },
  { id:"analytics", label:"Analytics",  icon:"◎" },
  { id:"accounts",  label:"Accounts",   icon:"◈" },
  { id:"billing",   label:"Billing",    icon:"◇" },
];

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [active, setActive] = useState("campaigns");
  const [authMode, setAuthMode] = useState("login");
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoadingAuth(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); setUser(null); setShowAuth(false); };

  if (loadingAuth) return (
    <div style={{ minHeight:"100vh", background:T.bgSoft, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Inter',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <QuillLogo size={40}/>
        <p style={{ marginTop:16, color:T.inkMid, fontSize:14 }}>Loading...</p>
      </div>
    </div>
  );

  if (!user && !showAuth) return (
    <LandingPage
      onSignup={() => { setAuthMode("signup"); setShowAuth(true); }}
      onLogin={() => { setAuthMode("login"); setShowAuth(true); }}
    />
  );

  if (!user && showAuth) return <AuthScreen onAuth={setUser} initialMode={authMode}/>;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${T.bgSoft}; font-family: 'Inter', sans-serif; }
        input, textarea { color-scheme: light; }
        input::placeholder, textarea::placeholder { color: ${T.inkMuted}; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: ${T.bgSoft}; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 3px; }
        button { transition: all 0.15s; }
        button:hover { opacity: 0.9; }
      `}</style>

      <div style={{ display:"flex", minHeight:"100vh", background:T.bgSoft }}>
        {/* Sidebar */}
        <aside style={{ width:220, minHeight:"100vh", background:T.white, borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", position:"sticky", top:0, flexShrink:0 }}>
          {/* Logo */}
          <div style={{ padding:"24px 20px 20px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <QuillLogo size={32}/>
              <div>
                <div style={{ fontSize:17, fontWeight:800, color:T.ink, letterSpacing:"-0.3px", lineHeight:1 }}>Quill</div>
                <div style={{ fontSize:10, color:T.inkMuted, letterSpacing:"0.06em", textTransform:"uppercase", marginTop:2 }}>Marketing Agent</div>
              </div>
            </div>
          </div>

          <div style={{ height:1, background:T.border, margin:"0 16px 12px" }}/>

          {/* Nav */}
          <nav style={{ flex:1, padding:"0 10px" }}>
            {NAV.map(item => (
              <button key={item.id} onClick={() => setActive(item.id)} style={{
                width:"100%", padding:"10px 12px", marginBottom:2,
                display:"flex", alignItems:"center", gap:10,
                background:active===item.id?T.bgMuted:"transparent",
                border:`1px solid ${active===item.id?T.border:"transparent"}`,
                borderRadius:8, cursor:"pointer",
              }}>
                <span style={{ fontSize:13, color:active===item.id?T.ink:T.inkLight }}>{item.icon}</span>
                <span style={{ fontSize:13, fontWeight:active===item.id?600:400, color:active===item.id?T.ink:T.inkMid, fontFamily:"'Inter',sans-serif" }}>{item.label}</span>
              </button>
            ))}
          </nav>

          <div style={{ height:1, background:T.border, margin:"12px 16px 12px" }}/>

          {/* User */}
          <div style={{ padding:"0 14px 20px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:T.bgSoft, borderRadius:10, border:`1px solid ${T.border}` }}>
              <div style={{ width:30, height:30, borderRadius:"50%", background:T.ink, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:T.white, fontWeight:700, flexShrink:0 }}>
                {user.email?.[0]?.toUpperCase()||"U"}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:600, color:T.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.user_metadata?.full_name||"User"}</div>
                <div style={{ fontSize:10, color:T.inkMuted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.email}</div>
              </div>
            </div>
            <button onClick={signOut} style={{ width:"100%", marginTop:8, padding:"8px 0", borderRadius:8, background:"transparent", border:`1px solid ${T.border}`, color:T.inkMid, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>Sign out</button>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex:1, overflow:"auto" }}>
          <div style={{ maxWidth:1080, margin:"0 auto", padding:"40px 36px" }}>
            {active==="campaigns" && <CampaignsView user={user}/>}
            {active==="copy"      && <CopywriterView/>}
            {active==="analytics" && <AnalyticsView user={user}/>}
            {active==="accounts"  && <AccountsView user={user}/>}
            {active==="billing"   && <BillingView user={user}/>}
          </div>
        </main>
      </div>
    </>
  );
}
