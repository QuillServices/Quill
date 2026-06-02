import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const CLAUDE_MODEL = "claude-sonnet-4-5";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  parchment:    "#e8dcc8",
  parchmentMid: "#d4c4a8",
  parchmentDark:"#c0aa88",
  ink:          "#1a0a06",
  inkFaded:     "#4a2818",
  inkLight:     "#8a5a3a",
  crimson:      "#8b1a1a",
  crimsonDeep:  "#5c0f0f",
  crimsonGlow:  "#8b1a1a22",
  burgundy:     "#6b1230",
  gold:         "#c4862a",
  goldDim:      "#c4862a20",
  sage:         "#4a6741",
  sageDim:      "#4a674122",
  white:        "#fdf6ec",
  shadow:       "rgba(26,10,6,0.12)",
};

const PLATFORMS = [
  { id: "instagram", label: "Instagram", color: "#C13584", icon: "◈" },
  { id: "facebook",  label: "Facebook",  color: "#1877F2", icon: "◉" },
  { id: "linkedin",  label: "LinkedIn",  color: "#0A66C2", icon: "◆" },
  { id: "twitter",   label: "X",         color: "#14171A", icon: "◇" },
];

const COPY_TYPES = [
  { id: "caption", label: "Social caption" },
  { id: "email",   label: "Email campaign" },
  { id: "ad",      label: "Ad copy" },
  { id: "product", label: "Product description" },
];

const TONES = ["Professional","Casual","Witty","Urgent","Inspirational","Bold"];

const FREQUENCIES = [
  { id: "daily",      label: "Every day" },
  { id: "weekdays",   label: "Weekdays" },
  { id: "weekly",     label: "Weekly" },
  { id: "twice_week", label: "Twice a week" },
];

const ANALYTICS = {
  reach:   [1200,1850,1400,2200,1950,2800,3100],
  days:    ["M","T","W","T","F","S","S"],
  summary: { totalReach:"14.5K", avgEngagement:"5.7%", postsThisWeek:12, topPlatform:"Instagram" },
  topPosts:[
    { text:"Summer sale NOW — 40% off everything...", platform:"Instagram", likes:284, reach:4200 },
    { text:"5 reasons competitors are outranking you...", platform:"LinkedIn", likes:198, reach:3800 },
    { text:"New arrivals dropped. Shop before they're gone...", platform:"Facebook", likes:156, reach:2900 },
  ],
};

// ─── API ──────────────────────────────────────────────────────────────────────
async function callClaude(system, user, onChunk) {
  const res = await fetch("http://localhost:3001/api/chat", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ model:CLAUDE_MODEL, max_tokens:1000, stream:false, system, messages:[{role:"user",content:user}] }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || "Error"); }
  const data = await res.json();
  onChunk(data?.content?.[0]?.text ?? "");
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function Card({ children, style:extra={}, accent=false }) {
  return (
    <div style={{
      background: T.white, borderRadius:16,
      border: `1px solid ${accent ? T.crimson+"66" : T.parchmentMid}`,
      boxShadow: accent ? `0 2px 20px ${T.crimsonGlow}` : `0 1px 8px ${T.shadow}`,
      padding:20, ...extra,
    }}>{children}</div>
  );
}

function PrimaryBtn({ children, onClick, disabled, type="button" }) {
  const [hover, setHover] = useState(false);
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ padding:"12px 24px", borderRadius:10,
        background: disabled ? T.parchmentMid : (hover ? T.crimsonDeep : T.crimson),
        border:"none", color:T.white, fontSize:13, fontWeight:700,
        cursor: disabled ? "not-allowed" : "pointer", fontFamily:"'Lato',sans-serif",
        transition:"background 0.2s", letterSpacing:"0.03em", width:"100%",
      }}>{children}</button>
  );
}

function GhostBtn({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding:"10px 0", borderRadius:10, background:"transparent",
      border:`1.5px solid ${T.parchmentDark}`, color:T.inkFaded,
      fontSize:13, fontWeight:600, cursor: disabled ? "not-allowed" : "pointer",
      fontFamily:"'Lato',sans-serif", width:"100%",
    }}>{children}</button>
  );
}

function Label({ children }) {
  return <div style={{ fontSize:10, fontWeight:700, color:T.inkLight, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8, fontFamily:"'Lato',sans-serif" }}>{children}</div>;
}

function Input({ value, onChange, placeholder, type="text", required=false }) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} style={{
      width:"100%", background:T.parchment, border:`1px solid ${T.parchmentMid}`,
      borderRadius:10, padding:"11px 14px", color:T.ink, fontSize:13,
      outline:"none", fontFamily:"'Lato',sans-serif", display:"block", boxSizing:"border-box",
    }}/>
  );
}

function Textarea({ value, onChange, placeholder, height=80 }) {
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} style={{
      width:"100%", background:T.parchment, border:`1px solid ${T.parchmentMid}`,
      borderRadius:10, padding:"12px 14px", color:T.ink, fontSize:13,
      resize:"none", height, outline:"none", fontFamily:"'Lato',sans-serif", lineHeight:1.6,
    }}/>
  );
}

function PlatformChip({ platform, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:600,
      background: active ? platform.color+"22" : T.parchment,
      border:`1.5px solid ${active ? platform.color : T.parchmentMid}`,
      color: active ? platform.color : T.inkLight,
      cursor:"pointer", fontFamily:"'Lato',sans-serif", transition:"all 0.15s",
    }}>{platform.icon} {platform.label}</button>
  );
}

function StatusBadge({ status }) {
  const map = {
    active:    { bg:T.sageDim,  color:T.sage,  label:"ACTIVE" },
    paused:    { bg:T.goldDim,  color:T.gold,  label:"PAUSED" },
    sent:      { bg:T.sageDim,  color:T.sage,  label:"SENT" },
    scheduled: { bg:T.goldDim,  color:T.gold,  label:"SCHEDULED" },
  };
  const s = map[status] || map.scheduled;
  return <span style={{ fontSize:9, fontWeight:800, padding:"3px 10px", borderRadius:20, background:s.bg, color:s.color, letterSpacing:"0.08em", fontFamily:"'Lato',sans-serif" }}>{s.label}</span>;
}

function QuillLogo({ size=38 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="10" fill={T.crimson}/>
      <path d="M26 6C26 6 20 8 16 13C12 18 11 24 11 24C11 24 13 22 15 21C14 23 13 26 12 28C12 28 16 26 19 22C21 19 22 16 22 16C22 16 21 18 20 19C20 19 22 15 26 6Z" fill={T.white} strokeLinejoin="round"/>
      <path d="M11 24C10.5 25.5 9.5 28 9 30" stroke={T.white} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// ─── AUTH SCREENS ─────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login"); // login | signup
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
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name } }
        });
        if (error) throw error;
        setSuccess("Account created! Check your email to confirm, then log in.");
        setMode("login");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuth(data.user);
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:T.parchmentDark, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Lato',sans-serif", padding:20 }}>
      <div style={{ position:"fixed", inset:0, backgroundImage:"url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231a0a06' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")", pointerEvents:"none" }}/>
      <div style={{ width:"100%", maxWidth:420, position:"relative", zIndex:1 }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:12 }}>
            <QuillLogo size={48}/>
            <div style={{ textAlign:"left" }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:700, color:T.ink, letterSpacing:"-0.5px", lineHeight:1 }}>Quill</div>
              <div style={{ fontSize:11, color:T.inkLight, letterSpacing:"0.1em", textTransform:"uppercase", fontWeight:600 }}>Marketing Suite</div>
            </div>
          </div>
        </div>

        <Card style={{ padding:32, overflow:"hidden" }}>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, fontWeight:600, color:T.ink, margin:"0 0 6px" }}>
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p style={{ fontSize:13, color:T.inkLight, margin:"0 0 24px" }}>
            {mode === "login" ? "Sign in to your Quill workspace" : "Start your free trial — no credit card needed"}
          </p>

          {error && <div style={{ background:"#8b1a1a11", border:"1px solid #8b1a1a44", borderRadius:10, padding:"10px 14px", fontSize:13, color:T.crimson, marginBottom:16 }}>{error}</div>}
          {success && <div style={{ background:T.sageDim, border:`1px solid ${T.sage}44`, borderRadius:10, padding:"10px 14px", fontSize:13, color:T.sage, marginBottom:16 }}>{success}</div>}

          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {mode === "signup" && (
              <div>
                <Label>Full name</Label>
                <Input value={name} onChange={e=>setName(e.target.value)} placeholder="John Doe" required/>
              </div>
            )}
            <div>
              <Label>Email address</Label>
              <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/>
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required/>
            </div>
            <div style={{ marginTop:4 }}>
              <PrimaryBtn type="submit" disabled={loading}>
                {loading ? "Please wait..." : (mode === "login" ? "Sign in" : "Create account")}
              </PrimaryBtn>
            </div>
          </form>

          <div style={{ marginTop:20, textAlign:"center", fontSize:13, color:T.inkLight }}>
            {mode === "login" ? (
              <>Don't have an account? <button onClick={() => { setMode("signup"); setError(""); setSuccess(""); }} style={{ background:"none", border:"none", color:T.crimson, cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:"'Lato',sans-serif" }}>Sign up free</button></>
            ) : (
              <>Already have an account? <button onClick={() => { setMode("login"); setError(""); setSuccess(""); }} style={{ background:"none", border:"none", color:T.crimson, cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:"'Lato',sans-serif" }}>Sign in</button></>
            )}
          </div>
        </Card>

        <p style={{ textAlign:"center", fontSize:12, color:T.inkLight, marginTop:20 }}>
          By signing up you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

// ─── CAMPAIGNS ────────────────────────────────────────────────────────────────
function CampaignsView({ user }) {
  const [campaigns, setCampaigns] = useState([]);
  const [view, setView] = useState("list");
  const [form, setForm] = useState({ name:"", theme:"", brandVoice:"", platforms:[], frequency:"daily", postTime:"10:00" });
  const [preview, setPreview] = useState(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { fetchCampaigns(); }, []);

  const fetchCampaigns = async () => {
    setFetching(true);
    const { data, error } = await supabase.from("campaigns").select("*").order("created_at", { ascending:false });
    if (!error) setCampaigns(data || []);
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
    if (!form.name.trim() || !form.theme.trim() || !form.platforms.length) {
      setError("Fill in name, theme, and select a platform."); return;
    }
    setLoading(true); setError("");
    const { error } = await supabase.from("campaigns").insert({
      user_id: user.id,
      name: form.name, theme: form.theme,
      brand_voice: form.brandVoice || "professional",
      platforms: form.platforms, frequency: form.frequency,
      post_time: form.postTime, status: "active",
    });
    if (error) { setError(error.message); setLoading(false); return; }
    await fetchCampaigns();
    setForm({ name:"", theme:"", brandVoice:"", platforms:[], frequency:"daily", postTime:"10:00" });
    setPreview(null); setView("list"); setLoading(false);
  };

  const toggleStatus = async (campaign) => {
    const newStatus = campaign.status === "active" ? "paused" : "active";
    await supabase.from("campaigns").update({ status:newStatus }).eq("id", campaign.id);
    await fetchCampaigns();
  };

  const deleteCampaign = async (id) => {
    await supabase.from("campaigns").delete().eq("id", id);
    await fetchCampaigns();
  };

  const [postModal, setPostModal] = useState(null); // campaign being posted
  const [postCaption, setPostCaption] = useState("");
  const [postImage, setPostImage] = useState(null);
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [generatingPostImage, setGeneratingPostImage] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const openPostModal = async (campaign) => {
    setPostModal(campaign);
    setPostImage(null);
    setPostCaption("");
    setGeneratingCaption(true);
    try {
      let caption = "";
      await callClaude("Write one engaging social post caption. Output ONLY the caption, no hashtags.", `Theme: "${campaign.theme}". Voice: ${campaign.brand_voice}.`, c => { caption=c; });
      setPostCaption(caption);
    } catch(e) { setError("Could not generate caption."); }
    setGeneratingCaption(false);
  };

  const generatePostImage = async () => {
    if (!postModal) return;
    setGeneratingPostImage(true);
    try {
      const res = await fetch("http://localhost:3001/api/image", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ prompt:`Professional marketing image for Instagram. Theme: ${postModal.theme}. Clean, eye-catching, boutique brand style.` }) });
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
      const res = await fetch("http://localhost:3001/api/publish", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ platforms:postModal.platforms, text:postCaption, imageUrl:postImage, theme:postModal.theme }),
      });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      await supabase.from("campaigns").update({ posts_published: postModal.posts_published+1, last_post: postCaption.slice(0,55)+"..." }).eq("id", postModal.id);
      await fetchCampaigns();
      setPostModal(null);
      alert("Posted successfully!");
    } catch(e) { setError("Post failed: "+e.message); }
    setPublishing(false);
  };

  if (view === "create") return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:28 }}>
        <button onClick={() => { setView("list"); setError(""); }} style={{ background:"none", border:"none", color:T.inkLight, cursor:"pointer", fontSize:20, padding:"4px 8px", borderRadius:8 }}>←</button>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:600, color:T.ink, margin:0 }}>New Campaign</h2>
      </div>
      {error && <div style={{ background:"#8b1a1a11", border:"1px solid #8b1a1a44", borderRadius:10, padding:"10px 14px", fontSize:13, color:T.crimson, marginBottom:16 }}>{error}</div>}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div><Label>Campaign name</Label><Input value={form.name} onChange={e=>setField("name",e.target.value)} placeholder="e.g. Daily Style Tips"/></div>
          <div><Label>Content theme</Label><Textarea value={form.theme} onChange={e=>setField("theme",e.target.value)} placeholder="e.g. Daily fashion tips for boutique shoppers." height={90}/></div>
          <div><Label>Brand voice (optional)</Label><Input value={form.brandVoice} onChange={e=>setField("brandVoice",e.target.value)} placeholder="e.g. warm, stylish, fashion-forward"/></div>
          <div>
            <Label>Platforms</Label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {PLATFORMS.map(p => <PlatformChip key={p.id} platform={p} active={form.platforms.includes(p.id)} onClick={() => togglePlat(p.id)}/>)}
            </div>
          </div>
          <div>
            <Label>Frequency</Label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {FREQUENCIES.map(f => (
                <button key={f.id} onClick={() => setField("frequency",f.id)} style={{ padding:"9px 12px", borderRadius:10, background:form.frequency===f.id?T.crimsonGlow:T.parchment, border:`1.5px solid ${form.frequency===f.id?T.crimson:T.parchmentMid}`, color:form.frequency===f.id?T.crimson:T.inkFaded, cursor:"pointer", fontSize:12, fontWeight:600, textAlign:"left", fontFamily:"'Lato',sans-serif" }}>{f.label}</button>
              ))}
            </div>
          </div>
          <div><Label>Post time</Label><Input type="time" value={form.postTime} onChange={e=>setField("postTime",e.target.value)}/></div>
          <div style={{ display:"flex", gap:10, marginTop:4 }}>
            <div style={{ flex:1 }}><GhostBtn onClick={generatePreview} disabled={generatingPreview||!form.theme.trim()}>{generatingPreview?"Generating...":"Preview"}</GhostBtn></div>
            <div style={{ flex:2 }}><PrimaryBtn onClick={createCampaign} disabled={loading}>{loading?"Launching...":"Launch Campaign"}</PrimaryBtn></div>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <Label>Sample post preview</Label>
          {preview ? (
            <Card accent>
              <div style={{ fontSize:10, fontWeight:700, color:T.crimson, letterSpacing:"0.1em", marginBottom:12 }}>SAMPLE POST</div>
              <p style={{ fontSize:14, color:T.ink, lineHeight:1.7, marginBottom:14, fontFamily:"'Lato',sans-serif" }}>{preview.caption}</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>
                {preview.hashtags?.map((h,i) => <span key={i} style={{ fontSize:12, color:T.crimson, background:T.crimsonGlow, padding:"2px 10px", borderRadius:20 }}>#{h}</span>)}
              </div>
              <p style={{ fontSize:11, color:T.inkLight, borderTop:`1px solid ${T.parchmentMid}`, paddingTop:10 }}>Every post will be unique — this is one example</p>
            </Card>
          ) : (
            <Card style={{ minHeight:180, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:10 }}>
              <div style={{ fontSize:36, opacity:0.25 }}>✦</div>
              <p style={{ fontSize:13, color:T.inkLight, textAlign:"center" }}>Fill in your theme and click Preview</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28 }}>
        <div>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:36, fontWeight:600, color:T.ink, margin:0 }}>Campaigns</h2>
          <p style={{ fontSize:13, color:T.inkLight, marginTop:6, fontFamily:"'Lato',sans-serif" }}>Set a theme and a schedule — Quill publishes for you automatically</p>
        </div>
        <button onClick={() => { setView("create"); setError(""); }} style={{ padding:"11px 24px", borderRadius:12, background:T.crimson, border:"none", color:T.white, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>+ New Campaign</button>
      </div>
      {error && <div style={{ background:"#8b1a1a11", border:"1px solid #8b1a1a44", borderRadius:10, padding:"10px 14px", fontSize:13, color:T.crimson, marginBottom:16 }}>{error}</div>}
      {fetching ? (
        <div style={{ textAlign:"center", padding:60, color:T.inkLight, fontFamily:"'Lato',sans-serif" }}>Loading your campaigns...</div>
      ) : campaigns.length === 0 ? (
        <Card style={{ padding:"80px 40px", textAlign:"center" }}>
          <div style={{ width:64, height:64, borderRadius:"50%", background:T.crimsonGlow, border:`2px solid ${T.crimson}33`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
            <QuillLogo size={32}/>
          </div>
          <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, color:T.ink, margin:"0 0 10px" }}>No campaigns yet</h3>
          <p style={{ fontSize:14, color:T.inkLight, maxWidth:360, margin:"0 auto 28px", lineHeight:1.6, fontFamily:"'Lato',sans-serif" }}>Create your first campaign and let Quill generate and publish content on autopilot</p>
          <button onClick={() => setView("create")} style={{ padding:"12px 32px", borderRadius:12, background:T.crimson, border:"none", color:T.white, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>Create your first campaign</button>
        </Card>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16 }}>
          {campaigns.map(c => (
            <Card key={c.id} accent={c.status==="active"} style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div style={{ flex:1, minWidth:0, marginRight:10 }}>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, fontWeight:600, color:T.ink, marginBottom:4 }}>{c.name}</div>
                  <div style={{ fontSize:12, color:T.inkLight, lineHeight:1.5, fontFamily:"'Lato',sans-serif" }}>"{c.theme.slice(0,55)}{c.theme.length>55?"...":""}"</div>
                </div>
                <StatusBadge status={c.status}/>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {c.platforms?.map(pid => { const p=PLATFORMS.find(pl=>pl.id===pid); return p?<span key={pid} style={{ fontSize:11, padding:"3px 10px", borderRadius:20, background:p.color+"18", color:p.color, border:`1px solid ${p.color}33`, fontFamily:"'Lato',sans-serif", fontWeight:600 }}>{p.icon} {p.label}</span>:null; })}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                {[
                  { label:"Schedule", val:FREQUENCIES.find(f=>f.id===c.frequency)?.label },
                  { label:"Published", val:c.posts_published },
                  { label:"Post time", val:c.post_time },
                ].map(s => (
                  <div key={s.label} style={{ background:T.parchment, borderRadius:10, padding:"8px 10px" }}>
                    <div style={{ fontSize:9, color:T.inkLight, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:3, fontFamily:"'Lato',sans-serif" }}>{s.label}</div>
                    <div style={{ fontSize:12, color:T.ink, fontWeight:600, fontFamily:"'Lato',sans-serif" }}>{s.val}</div>
                  </div>
                ))}
              </div>
              {c.last_post && <p style={{ fontSize:12, color:T.inkLight, fontStyle:"italic", fontFamily:"'Lato',sans-serif", margin:0 }}>Last: "{c.last_post}"</p>}
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => openPostModal(c)} style={{ flex:1, padding:"9px 0", borderRadius:9, background:T.crimsonGlow, border:`1.5px solid ${T.crimson}44`, color:T.crimson, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>▶ Post now</button>
                <button onClick={() => toggleStatus(c)} style={{ flex:1, padding:"9px 0", borderRadius:9, background:c.status==="active"?T.goldDim:T.sageDim, border:`1.5px solid ${c.status==="active"?T.gold:T.sage}44`, color:c.status==="active"?T.gold:T.sage, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>{c.status==="active"?"⏸ Pause":"▶ Resume"}</button>
                <button onClick={() => deleteCampaign(c.id)} style={{ padding:"9px 12px", borderRadius:9, background:"#8b1a1a11", border:"1px solid #8b1a1a22", color:T.crimson, fontSize:13, cursor:"pointer" }}>✕</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Post Modal */}
      {postModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(26,10,6,0.6)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:T.white, borderRadius:20, padding:32, width:"100%", maxWidth:600, maxHeight:"90vh", overflowY:"auto", boxShadow:`0 20px 60px rgba(26,10,6,0.3)` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, color:T.ink, margin:0 }}>Post to {postModal.name}</h3>
              <button onClick={() => setPostModal(null)} style={{ background:"none", border:"none", fontSize:24, color:T.inkLight, cursor:"pointer" }}>×</button>
            </div>

            {/* Platforms */}
            <div style={{ display:"flex", gap:8, marginBottom:20 }}>
              {postModal.platforms?.map(pid => { const p=PLATFORMS.find(pl=>pl.id===pid); return p?<span key={pid} style={{ fontSize:11, padding:"3px 10px", borderRadius:20, background:p.color+"18", color:p.color, border:`1px solid ${p.color}33`, fontFamily:"'Lato',sans-serif", fontWeight:600 }}>{p.icon} {p.label}</span>:null; })}
            </div>

            {/* Caption */}
            <div style={{ marginBottom:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <Label>Caption</Label>
                <button onClick={() => openPostModal(postModal)} disabled={generatingCaption} style={{ fontSize:11, color:T.crimson, background:"none", border:"none", cursor:"pointer", fontFamily:"'Lato',sans-serif", fontWeight:700 }}>{generatingCaption ? "Generating..." : "↻ Regenerate"}</button>
              </div>
              <textarea value={postCaption} onChange={e=>setPostCaption(e.target.value)} style={{ width:"100%", background:T.parchment, border:`1px solid ${T.parchmentMid}`, borderRadius:10, padding:"12px 14px", color:T.ink, fontSize:13, resize:"none", height:100, outline:"none", fontFamily:"'Lato',sans-serif", lineHeight:1.6 }}/>
            </div>

            {/* Image */}
            <div style={{ marginBottom:24 }}>
              <Label>Image {postModal.platforms?.includes("instagram") ? "(required for Instagram)" : "(optional)"}</Label>
              {postImage ? (
                <div style={{ position:"relative", borderRadius:12, overflow:"hidden", border:`1px solid ${T.parchmentMid}`, marginBottom:10 }}>
                  <img src={postImage} alt="Post" style={{ width:"100%", display:"block", maxHeight:280, objectFit:"cover" }}/>
                  <button onClick={() => setPostImage(null)} style={{ position:"absolute", top:8, right:8, background:"rgba(26,10,6,0.7)", border:"none", color:"#fff", borderRadius:"50%", width:28, height:28, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
                </div>
              ) : (
                <div style={{ border:`2px dashed ${T.parchmentMid}`, borderRadius:12, padding:24, textAlign:"center", marginBottom:10 }}>
                  <p style={{ fontSize:13, color:T.inkLight, marginBottom:14, fontFamily:"'Lato',sans-serif" }}>No image selected</p>
                  <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
                    <button onClick={generatePostImage} disabled={generatingPostImage} style={{ padding:"8px 18px", borderRadius:9, background:T.crimson, border:"none", color:T.white, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>{generatingPostImage ? "Generating... (20-30s)" : "✦ Generate image"}</button>
                    <label style={{ padding:"8px 18px", borderRadius:9, background:T.parchment, border:`1.5px solid ${T.parchmentMid}`, color:T.inkFaded, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>
                      ↑ Upload image
                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display:"none" }}/>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Publish button */}
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setPostModal(null)} style={{ flex:1, padding:"12px 0", borderRadius:10, background:"transparent", border:`1.5px solid ${T.parchmentMid}`, color:T.inkFaded, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>Cancel</button>
              <button onClick={publishPost} disabled={publishing || !postCaption.trim()} style={{ flex:2, padding:"12px 0", borderRadius:10, background:publishing || !postCaption.trim() ? T.parchmentMid : T.crimson, border:"none", color:T.white, fontSize:13, fontWeight:700, cursor:publishing || !postCaption.trim() ? "not-allowed" : "pointer", fontFamily:"'Lato',sans-serif" }}>{publishing ? "Publishing..." : "Publish post"}</button>
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
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:600, color:T.ink, margin:0 }}>Copywriter</h2>
        <p style={{ fontSize:13, color:T.inkLight, marginTop:6, fontFamily:"'Lato',sans-serif" }}>Generate on-brand marketing copy in seconds</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
        <Card style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div>
            <Label>Content type</Label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {COPY_TYPES.map(t => <button key={t.id} onClick={() => setCopyType(t)} style={{ padding:"10px 14px", borderRadius:10, background:copyType.id===t.id?T.crimsonGlow:T.parchment, border:`1.5px solid ${copyType.id===t.id?T.crimson:T.parchmentMid}`, color:copyType.id===t.id?T.crimson:T.inkFaded, cursor:"pointer", fontSize:13, fontWeight:600, textAlign:"left", fontFamily:"'Lato',sans-serif" }}>{t.label}</button>)}
            </div>
          </div>
          <div><Label>What's it about?</Label><Textarea value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. Summer sale — 40% off all shoes this weekend"/></div>
          <div>
            <Label>Tone</Label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {TONES.map(t => <button key={t} onClick={() => setTone(t)} style={{ padding:"6px 14px", borderRadius:20, background:tone===t?T.crimson:T.parchment, border:`1.5px solid ${tone===t?T.crimson:T.parchmentMid}`, color:tone===t?T.white:T.inkFaded, cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"'Lato',sans-serif" }}>{t}</button>)}
            </div>
          </div>
          <div><Label>Brand voice (optional)</Label><Input value={brandVoice} onChange={e=>setBrandVoice(e.target.value)} placeholder="e.g. friendly, boutique, fashion-forward"/></div>
          <PrimaryBtn onClick={generate} disabled={loading||!topic.trim()}>{loading?"Writing...":"Generate"}</PrimaryBtn>
        </Card>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <Label>Output</Label>
            {output && <button onClick={() => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(()=>setCopied(false),2000); }} style={{ padding:"5px 14px", borderRadius:8, background:copied?T.sageDim:T.parchment, border:`1px solid ${copied?T.sage:T.parchmentMid}`, color:copied?T.sage:T.inkLight, cursor:"pointer", fontSize:12, fontFamily:"'Lato',sans-serif" }}>{copied?"✓ Copied":"Copy"}</button>}
          </div>
          <Card style={{ flex:1, minHeight:320, color:error?T.crimson:(output?T.ink:T.inkLight), fontSize:14, lineHeight:1.75, fontFamily:"'Lato',sans-serif", whiteSpace:"pre-wrap", display:"flex", alignItems:output||error?"flex-start":"center", justifyContent:output||error?"flex-start":"center", background:T.parchment }}>
            {error||output||(loading?"Writing your copy...":"Your copy will appear here...")}
          </Card>
          {output && <GhostBtn onClick={generate}>↻ Regenerate</GhostBtn>}
        </div>
      </div>
    </div>
  );
}

// ─── SCHEDULER ────────────────────────────────────────────────────────────────
function SchedulerView({ user }) {
  const [posts, setPosts] = useState([]);
  const [platform, setPlatform] = useState("instagram");
  const [text, setText] = useState("");
  const [time, setTime] = useState("");
  const [fetching, setFetching] = useState(true);

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    setFetching(true);
    const { data } = await supabase.from("posts").select("*").order("created_at", { ascending:false });
    setPosts(data || []);
    setFetching(false);
  };

  const add = async () => {
    if (!text.trim()||!time) return;
    await supabase.from("posts").insert({ user_id:user.id, platform, content:text, scheduled_time:time, status:"scheduled" });
    await fetchPosts();
    setText(""); setTime("");
  };

  const remove = async (id) => {
    await supabase.from("posts").delete().eq("id", id);
    await fetchPosts();
  };

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:600, color:T.ink, margin:0 }}>Scheduler</h2>
        <p style={{ fontSize:13, color:T.inkLight, marginTop:6, fontFamily:"'Lato',sans-serif" }}>Queue and manage your content calendar</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"360px 1fr", gap:24 }}>
        <Card style={{ display:"flex", flexDirection:"column", gap:14, alignSelf:"start" }}>
          <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:T.ink, margin:0 }}>Schedule a post</h3>
          <div>
            <Label>Platform</Label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {PLATFORMS.map(p => <PlatformChip key={p.id} platform={p} active={platform===p.id} onClick={() => setPlatform(p.id)}/>)}
            </div>
          </div>
          <div><Label>Content</Label><Textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Write your post here..." height={100}/></div>
          <div><Label>Schedule time</Label><Input type="datetime-local" value={time} onChange={e=>setTime(e.target.value)}/></div>
          <PrimaryBtn onClick={add} disabled={!text.trim()||!time}>Schedule post</PrimaryBtn>
        </Card>
        <div>
          <Label>Queue</Label>
          {fetching ? <div style={{ color:T.inkLight, fontFamily:"'Lato',sans-serif", fontSize:13, padding:20 }}>Loading...</div> : (
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:8 }}>
              {posts.map(post => {
                const p = PLATFORMS.find(pl=>pl.id===post.platform)||PLATFORMS[0];
                return (
                  <Card key={post.id} style={{ display:"flex", gap:14, alignItems:"flex-start", padding:"14px 18px" }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:p.color+"18", border:`1.5px solid ${p.color}33`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, color:p.color, flexShrink:0 }}>{p.icon}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:13, color:T.ink, lineHeight:1.5, margin:"0 0 6px", fontFamily:"'Lato',sans-serif" }}>{post.content?.length>75?post.content.slice(0,75)+"…":post.content}</p>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontSize:11, color:T.inkLight, fontFamily:"'Lato',sans-serif" }}>◷ {post.scheduled_time}</span>
                        <StatusBadge status={post.status}/>
                      </div>
                    </div>
                    <button onClick={() => remove(post.id)} style={{ background:"none", border:"none", color:T.inkLight, cursor:"pointer", fontSize:18 }}>×</button>
                  </Card>
                );
              })}
              {posts.length===0 && <div style={{ color:T.inkLight, fontFamily:"'Lato',sans-serif", fontSize:13, padding:"20px 0" }}>No posts scheduled yet.</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── VISUALS ──────────────────────────────────────────────────────────────────
function VisualsView() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("photorealistic");
  const [concept, setConcept] = useState("");
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");
  const [loadingConcept, setLoadingConcept] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const STYLES = ["photorealistic","illustration","minimalist","bold graphic","watercolor","cinematic"];

  const genConcept = async () => {
    if (!prompt.trim()) return;
    setConcept(""); setError(""); setLoadingConcept(true);
    try { await callClaude("Creative director. Describe the perfect marketing image in 3-4 vivid sentences.", `${style} concept for: "${prompt}"`, c => setConcept(c)); }
    catch(e) { setError(e.message); }
    setLoadingConcept(false);
  };

  const genImage = async () => {
    if (!concept) return;
    setLoadingImage(true); setError("");
    try {
      const res = await fetch("http://localhost:3001/api/image", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ prompt:`${style} marketing image: ${concept}` }) });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setImages(prev => [{url:d.url,label:prompt},...prev.slice(0,3)]);
    } catch(e) { setError(e.message); }
    setLoadingImage(false);
  };

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:600, color:T.ink, margin:0 }}>Visuals</h2>
        <p style={{ fontSize:13, color:T.inkLight, marginTop:6, fontFamily:"'Lato',sans-serif" }}>Generate social-ready images from a simple brief</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <Card>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div><Label>Image brief</Label><Textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="e.g. A cozy boutique window display for autumn" height={90}/></div>
              <div>
                <Label>Visual style</Label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {STYLES.map(s => <button key={s} onClick={() => setStyle(s)} style={{ padding:"6px 14px", borderRadius:20, background:style===s?T.crimsonGlow:T.parchment, border:`1.5px solid ${style===s?T.crimson:T.parchmentMid}`, color:style===s?T.crimson:T.inkFaded, cursor:"pointer", fontSize:12, fontWeight:600, textTransform:"capitalize", fontFamily:"'Lato',sans-serif" }}>{s}</button>)}
                </div>
              </div>
              <PrimaryBtn onClick={genConcept} disabled={loadingConcept||!prompt.trim()}>{loadingConcept?"Thinking...":"Generate concept"}</PrimaryBtn>
            </div>
          </Card>
          {(concept||error) && (
            <Card style={{ background:error?"#8b1a1a11":T.crimsonGlow, border:`1px solid ${T.crimson}33` }}>
              <div style={{ fontSize:10, fontWeight:700, color:T.crimson, letterSpacing:"0.1em", marginBottom:10 }}>{error?"ERROR":"VISUAL CONCEPT"}</div>
              <p style={{ fontSize:13, color:T.ink, lineHeight:1.7, margin:0, fontFamily:"'Lato',sans-serif" }}>{error||concept}</p>
            </Card>
          )}
          {concept && !error && <PrimaryBtn onClick={genImage} disabled={loadingImage}>{loadingImage?"Creating image (20-30 sec)...":"Create image"}</PrimaryBtn>}
        </div>
        <div>
          <Label>Generated images</Label>
          {images.length===0 ? (
            <Card style={{ minHeight:240, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12, background:T.parchment, marginTop:8 }}>
              <div style={{ fontSize:32, opacity:0.2 }}>◈</div>
              <p style={{ fontSize:13, color:T.inkLight, textAlign:"center", fontFamily:"'Lato',sans-serif" }}>Generate a concept then create your image</p>
            </Card>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:12, marginTop:8 }}>
              {images.map((img,i) => (
                <Card key={i} style={{ padding:0, overflow:"hidden" }}>
                  <img src={img.url} alt={img.label} style={{ width:"100%", display:"block" }}/>
                  <div style={{ padding:"10px 14px", display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontSize:12, color:T.inkFaded, fontFamily:"'Lato',sans-serif" }}>{img.label}</span>
                    <a href={img.url} download target="_blank" rel="noreferrer" style={{ fontSize:12, color:T.crimson, textDecoration:"none", fontWeight:600, fontFamily:"'Lato',sans-serif" }}>Download</a>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
function AnalyticsView() {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const d = ANALYTICS;
  const maxR = Math.max(...d.reach);

  const analyze = async () => {
    setInsight(""); setError(""); setLoading(true);
    try { await callClaude("Social media analyst. Be concise and actionable. Plain text.", `Reach: ${d.summary.totalReach}, Engagement: ${d.summary.avgEngagement}, Posts: ${d.summary.postsThisWeek}, Top: ${d.summary.topPlatform}. 3-sentence insight + 1 recommendation.`, c => setInsight(c)); }
    catch(e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:600, color:T.ink, margin:0 }}>Analytics</h2>
        <p style={{ fontSize:13, color:T.inkLight, marginTop:6, fontFamily:"'Lato',sans-serif" }}>Track performance across all platforms</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        {[
          { label:"Total reach",    val:d.summary.totalReach,    color:T.crimson },
          { label:"Avg engagement", val:d.summary.avgEngagement, color:T.burgundy },
          { label:"Posts this week",val:d.summary.postsThisWeek, color:T.gold },
          { label:"Top platform",   val:d.summary.topPlatform,   color:T.sage },
        ].map(s => (
          <Card key={s.label} style={{ textAlign:"center" }}>
            <div style={{ fontSize:10, fontWeight:700, color:T.inkLight, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8, fontFamily:"'Lato',sans-serif" }}>{s.label}</div>
            <div style={{ fontSize:26, fontWeight:600, color:s.color, fontFamily:"'Cormorant Garamond',serif" }}>{s.val}</div>
          </Card>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:16, marginBottom:16 }}>
        <Card>
          <div style={{ fontSize:13, fontWeight:700, color:T.ink, marginBottom:18, fontFamily:"'Lato',sans-serif" }}>Weekly reach</div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:10, height:120 }}>
            {d.reach.map((v,i) => (
              <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                <div style={{ width:"100%", borderRadius:"4px 4px 0 0", height:`${(v/maxR)*100}%`, background:`linear-gradient(180deg,${T.crimson},${T.burgundy})`, minHeight:4 }}/>
                <span style={{ fontSize:10, color:T.inkLight, fontFamily:"'Lato',sans-serif", fontWeight:600 }}>{d.days[i]}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.ink, fontFamily:"'Lato',sans-serif" }}>Smart insight</div>
            <button onClick={analyze} disabled={loading} style={{ padding:"6px 14px", borderRadius:8, fontSize:11, background:T.crimsonGlow, border:`1px solid ${T.crimson}44`, color:T.crimson, cursor:loading?"not-allowed":"pointer", fontFamily:"'Lato',sans-serif", fontWeight:700 }}>{loading?"Thinking…":"Analyze"}</button>
          </div>
          <p style={{ fontSize:13, color:error?T.crimson:(insight?T.ink:T.inkLight), lineHeight:1.7, minHeight:80, margin:0, fontFamily:"'Lato',sans-serif" }}>
            {error||insight||"Click Analyze to get insights on your performance."}
          </p>
        </Card>
      </div>
      <Card>
        <div style={{ fontSize:13, fontWeight:700, color:T.ink, marginBottom:16, fontFamily:"'Lato',sans-serif" }}>Top performing posts</div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {d.topPosts.map((post,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 14px", background:T.parchment, borderRadius:12, border:`1px solid ${T.parchmentMid}` }}>
              <div style={{ width:30, height:30, borderRadius:8, background:T.crimson, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:T.white, fontWeight:700, flexShrink:0, fontFamily:"'Cormorant Garamond',serif" }}>{i+1}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:13, color:T.ink, margin:"0 0 3px", fontFamily:"'Lato',sans-serif" }}>{post.text}</p>
                <span style={{ fontSize:11, color:T.inkLight, fontFamily:"'Lato',sans-serif" }}>{post.platform}</span>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.ink, fontFamily:"'Lato',sans-serif" }}>♡ {post.likes}</div>
                <div style={{ fontSize:11, color:T.inkLight, fontFamily:"'Lato',sans-serif" }}>{post.reach.toLocaleString()} reach</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── NAV ──────────────────────────────────────────────────────────────────────
const NAV = [
  { id:"campaigns", label:"Campaigns" },
  { id:"copy",      label:"Copywriter" },
  { id:"schedule",  label:"Scheduler" },
  { id:"visuals",   label:"Visuals" },
  { id:"analytics", label:"Analytics" },
  { id:"billing",   label:"Billing" },
];

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "$29",
    priceId: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY ? "price_1Tddw8Pb3Ifjj2XOPzC7cyrI" : "",
    description: "Perfect for solo business owners",
    features: ["50 posts per month", "3 social accounts", "20 images per month", "Basic analytics", "Email support"],
    color: "#4a6741",
  },
  {
    id: "growth",
    name: "Growth",
    price: "$79",
    priceId: "price_1TddwQPb3Ifjj2XOS4lFF3yZ",
    description: "For small businesses scaling up",
    features: ["Unlimited posts", "10 social accounts", "100 images per month", "Full analytics", "Brand voice training", "Priority support"],
    color: "#8b1a1a",
    popular: true,
  },
  {
    id: "agency",
    name: "Agency",
    price: "$199",
    priceId: "price_1TddwsPb3Ifjj2XOVOFwTaWY",
    description: "For agencies managing clients",
    features: ["Unlimited everything", "Unlimited clients", "White-label option", "Client approval flows", "Dedicated support"],
    color: "#6b1230",
  },
];

function BillingView({ user }) {
  const [currentPlan, setCurrentPlan] = useState("free");
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    checkStatus();
    // Check for success/cancel in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      setMessage("Payment successful! Your plan has been upgraded.");
      window.history.replaceState({}, "", "/");
    } else if (params.get("payment") === "cancelled") {
      setMessage("Payment cancelled. No charge was made.");
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/stripe/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: user.email }),
      });
      const data = await res.json();
      setCurrentPlan(data.plan || "free");
    } catch { setCurrentPlan("free"); }
    setLoading(false);
  };

  const checkout = async (plan) => {
    setCheckingOut(plan.id);
    try {
      const res = await fetch("http://localhost:3001/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: plan.priceId,
          userId: user.id,
          userEmail: user.email,
          plan: plan.id,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      window.location.href = data.url;
    } catch (e) {
      setMessage("Checkout failed: " + e.message);
    }
    setCheckingOut(null);
  };

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:600, color:T.ink, margin:0 }}>Billing</h2>
        <p style={{ fontSize:13, color:T.inkLight, marginTop:6, fontFamily:"'Lato',sans-serif" }}>Choose the plan that fits your business</p>
      </div>

      {message && (
        <div style={{ background: message.includes("successful") ? T.sageDim : "#8b1a1a11", border: `1px solid ${message.includes("successful") ? T.sage : T.crimson}44`, borderRadius:10, padding:"12px 16px", fontSize:13, color: message.includes("successful") ? T.sage : T.crimson, marginBottom:24, fontFamily:"'Lato',sans-serif" }}>
          {message}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:"center", padding:60, color:T.inkLight, fontFamily:"'Lato',sans-serif" }}>Checking your plan...</div>
      ) : (
        <>
          {currentPlan !== "free" && (
            <div style={{ background:T.sageDim, border:`1px solid ${T.sage}44`, borderRadius:12, padding:"14px 20px", marginBottom:24, display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontSize:20 }}>✓</span>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:T.sage, fontFamily:"'Lato',sans-serif" }}>Active plan: {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}</div>
                <div style={{ fontSize:12, color:T.inkLight, fontFamily:"'Lato',sans-serif" }}>Your subscription is active and renews monthly</div>
              </div>
            </div>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
            {PLANS.map(plan => (
              <div key={plan.id} style={{ background:T.white, borderRadius:20, border: plan.popular ? `2px solid ${T.crimson}` : `1px solid ${T.parchmentMid}`, padding:28, display:"flex", flexDirection:"column", gap:16, position:"relative", boxShadow: plan.popular ? `0 4px 24px ${T.crimsonGlow}` : `0 1px 8px ${T.shadow}` }}>
                {plan.popular && (
                  <div style={{ position:"absolute", top:-14, left:"50%", transform:"translateX(-50%)", background:T.crimson, color:T.white, fontSize:11, fontWeight:700, padding:"4px 16px", borderRadius:20, whiteSpace:"nowrap", fontFamily:"'Lato',sans-serif", letterSpacing:"0.05em" }}>MOST POPULAR</div>
                )}
                <div>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700, color:T.ink, marginBottom:4 }}>{plan.name}</div>
                  <div style={{ fontSize:13, color:T.inkLight, fontFamily:"'Lato',sans-serif" }}>{plan.description}</div>
                </div>
                <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                  <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:42, fontWeight:700, color:plan.color }}>{plan.price}</span>
                  <span style={{ fontSize:13, color:T.inkLight, fontFamily:"'Lato',sans-serif" }}>/month</span>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:10, flex:1 }}>
                  {plan.features.map((f,i) => (
                    <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                      <span style={{ color:plan.color, fontWeight:700, flexShrink:0, fontSize:14 }}>✓</span>
                      <span style={{ fontSize:13, color:T.inkFaded, fontFamily:"'Lato',sans-serif", lineHeight:1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => currentPlan !== plan.id && checkout(plan)}
                  disabled={checkingOut === plan.id || currentPlan === plan.id}
                  style={{ padding:"12px 0", borderRadius:12, background: currentPlan === plan.id ? T.sageDim : plan.popular ? T.crimson : "transparent", border: currentPlan === plan.id ? `1px solid ${T.sage}` : plan.popular ? "none" : `2px solid ${plan.color}`, color: currentPlan === plan.id ? T.sage : plan.popular ? T.white : plan.color, fontSize:13, fontWeight:700, cursor: currentPlan === plan.id ? "default" : "pointer", fontFamily:"'Lato',sans-serif", transition:"all 0.2s" }}
                >
                  {checkingOut === plan.id ? "Redirecting..." : currentPlan === plan.id ? "✓ Current plan" : "Get started"}
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop:24, textAlign:"center" }}>
            <p style={{ fontSize:12, color:T.inkLight, fontFamily:"'Lato',sans-serif" }}>
              All plans include a 7-day free trial. Cancel anytime. Test mode — use card <strong>4242 4242 4242 4242</strong> with any expiry and CVC.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState("campaigns");

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", background:T.parchmentDark, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <QuillLogo size={48}/>
        <p style={{ marginTop:16, color:T.inkLight, fontFamily:"'Lato',sans-serif", fontSize:14 }}>Loading Quill...</p>
      </div>
    </div>
  );

  if (!user) return <AuthScreen onAuth={setUser}/>;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Lato:wght@400;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${T.parchmentDark}; }
        input, textarea { color-scheme: light; }
        input::placeholder, textarea::placeholder { color: ${T.inkLight}; opacity: 0.7; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: ${T.parchmentMid}; }
        ::-webkit-scrollbar-thumb { background: ${T.parchmentDark}; border-radius: 3px; }
      `}</style>

      <div style={{ display:"flex", minHeight:"100vh", background:T.parchmentDark, fontFamily:"'Lato',sans-serif" }}>

        {/* Sidebar */}
        <aside style={{ width:220, minHeight:"100vh", background:T.parchment, borderRight:`1px solid ${T.parchmentMid}`, display:"flex", flexDirection:"column", position:"sticky", top:0, flexShrink:0, boxShadow:`2px 0 16px ${T.shadow}` }}>
          <div style={{ padding:"28px 22px 24px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <QuillLogo size={38}/>
              <div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700, color:T.ink, letterSpacing:"-0.3px", lineHeight:1 }}>Quill</div>
                <div style={{ fontSize:10, color:T.inkLight, letterSpacing:"0.08em", textTransform:"uppercase", marginTop:3, fontWeight:600 }}>Marketing Suite</div>
              </div>
            </div>
          </div>
          <div style={{ height:1, background:`linear-gradient(90deg,transparent,${T.parchmentMid},transparent)`, margin:"0 16px 16px" }}/>
          <nav style={{ flex:1, padding:"0 10px" }}>
            {NAV.map(item => (
              <button key={item.id} onClick={() => setActive(item.id)} style={{ width:"100%", padding:"11px 14px", marginBottom:4, display:"flex", alignItems:"center", background:active===item.id?T.crimsonGlow:"transparent", border:`1.5px solid ${active===item.id?T.crimson+"55":"transparent"}`, borderRadius:10, cursor:"pointer" }}>
                <span style={{ fontSize:13, fontWeight:active===item.id?700:400, color:active===item.id?T.crimson:T.inkFaded, fontFamily:"'Lato',sans-serif" }}>{item.label}</span>
              </button>
            ))}
          </nav>
          <div style={{ height:1, background:`linear-gradient(90deg,transparent,${T.parchmentMid},transparent)`, margin:"16px" }}/>
          <div style={{ padding:"0 16px 24px" }}>
            <div style={{ background:T.parchmentMid, borderRadius:12, padding:"10px 12px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                <div style={{ width:32, height:32, borderRadius:"50%", background:T.crimson, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:T.white, fontWeight:800, flexShrink:0 }}>
                  {user.email?.[0]?.toUpperCase() || "U"}
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:T.ink, fontFamily:"'Lato',sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.user_metadata?.full_name || "User"}</div>
                  <div style={{ fontSize:10, color:T.inkLight, fontFamily:"'Lato',sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.email}</div>
                </div>
              </div>
              <button onClick={signOut} style={{ width:"100%", padding:"7px 0", borderRadius:8, background:"transparent", border:`1px solid ${T.parchmentDark}`, color:T.inkFaded, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Lato',sans-serif" }}>Sign out</button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex:1, overflow:"auto", background:T.parchmentDark }}>
          <div style={{ position:"fixed", inset:0, backgroundImage:"url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231a0a06' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")", pointerEvents:"none", zIndex:0 }}/>
          <div style={{ position:"relative", zIndex:1, maxWidth:1100, margin:"0 auto", padding:"40px 36px" }}>
            {active==="campaigns" && <CampaignsView user={user}/>}
            {active==="copy"      && <CopywriterView/>}
            {active==="schedule"  && <SchedulerView user={user}/>}
            {active==="visuals"   && <VisualsView/>}
            {active==="analytics" && <AnalyticsView/>}
            {active==="billing"   && <BillingView user={user}/>}
          </div>
        </main>
      </div>
    </>
  );
}
