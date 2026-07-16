import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const CLAUDE_MODEL = "claude-sonnet-4-5";
const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:3001";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

// ─── DESIGN TOKENS — PREMIUM CHARCOAL ─────────────────────────────────────────
const T = {
  // Backgrounds — deep charcoal family
  bg:           "#14110D",   // main canvas
  bgSoft:       "#181410",   // slightly lifted
  bgMuted:      "#1A150F",   // cards, inputs
  bgHover:      "#221B14",   // hover states
  bgStrong:     "#261F18",   // active / selected

  // Borders
  border:       "rgba(242,234,219,.09)",
  borderStrong: "rgba(242,234,219,.16)",
  borderBright: "rgba(242,234,219,.28)",

  // Text
  ink:          "#F2EADB",   // primary white
  inkSoft:      "#E4DACA",   // slightly softer white
  inkMid:       "#A89B86",   // secondary
  inkLight:     "#7E7466",   // tertiary
  inkMuted:     "#574F44",   // disabled / placeholder

  // Accent — slick white glow
  accent:       "#FF5B2E",
  accentSoft:   "#FF7B52",
  accentMuted:  "#E14E24",

  // Semantic
  crimson:      "#f87171",
  crimsonSoft:  "#1f1215",
  crimsonMid:   "#3d1f24",
  gold:         "#F4B740",
  goldSoft:     "#1c1710",
  green:        "#34D27B",
  greenSoft:    "#0d1f14",

  // Shadows
  shadow:       "rgba(0,0,0,0.4)",
  shadowMd:     "rgba(0,0,0,0.6)",
  shadowLg:     "rgba(0,0,0,0.8)",
};

const PLATFORMS = [
  { id:"instagram", label:"Instagram", color:"#e1306c", icon:"◈" },
  { id:"facebook",  label:"Facebook",  color:"#1877F2", icon:"◉" },
  { id:"linkedin",  label:"LinkedIn",  color:"#0A66C2", icon:"◆" },
  { id:"twitter",   label:"X",         color:"#a1a1aa", icon:"◇" },
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
    features:["3 platforms included","3 active campaigns","50 posts per month","20 images per month","Basic analytics","Email support"],
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

function usePlanLimits(user, currentPlan) {
  const plan = PLANS.find(p => p.id === currentPlan) || PLANS[0];
  const limits = plan.limits || { campaigns:2, posts:20, images:10 };
  const canDo = (type, currentCount) => limits[type] === -1 ? true : currentCount < limits[type];
  const limitLabel = (type) => limits[type] === -1 ? "Unlimited" : limits[type].toString();
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
  const isAtLimit   = items.some(i => i.used >= i.limit);
  if (!isNearLimit) return null;
  return (
    <div style={{ background:isAtLimit?T.crimsonSoft:T.goldSoft, border:`1px solid ${isAtLimit?T.crimsonMid:"#3d2e10"}`, borderRadius:10, padding:"12px 18px", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
      <div>
        <div style={{ fontSize:13, fontWeight:600, color:isAtLimit?T.crimson:T.gold, marginBottom:3 }}>
          {isAtLimit ? "You've reached your plan limit" : "Approaching your plan limit"}
        </div>
        <div style={{ fontSize:12, color:T.inkMid }}>{items.map(i=>`${i.label}: ${i.used}/${i.limit}`).join(" · ")}</div>
      </div>
      <button onClick={() => window.location.hash="billing"} style={{ padding:"7px 16px", borderRadius:6, background:T.accent, border:"none", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Space Grotesk',sans-serif", whiteSpace:"nowrap" }}>Upgrade</button>
    </div>
  );
}

// ─── API ──────────────────────────────────────────────────────────────────────
async function callClaude(system, user, onChunk) {
  const res = await fetch(SERVER_URL + "/api/chat", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({ model:CLAUDE_MODEL, max_tokens:1000, stream:false, system, messages:[{role:"user",content:user}] }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message||"Error"); }
  const data = await res.json();
  onChunk(data?.content?.[0]?.text ?? "");
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function QuillLogo({ size=32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="7" fill={T.bgStrong}/>
      <rect width="32" height="32" rx="7" stroke={T.borderStrong} strokeWidth="1"/>
      <path d="M22 5C22 5 17 7 14 11C11 15 10 20 10 20C10 20 12 18 14 17C13 19 12 22 11 24C11 24 14 22 17 18C19 15 20 12 20 12C20 12 19 14 18 15C18 15 20 11 22 5Z" fill={T.accent}/>
      <path d="M10 20C10 20 9 22 8 26" stroke={T.inkMid} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function Card({ children, style:extra={} }) {
  return (
    <div className="q-card" style={{
      background: T.bgMuted,
      borderRadius: 12,
      border: `1px solid ${T.border}`,
      padding: 24,
      ...extra,
    }}>{children}</div>
  );
}

function Btn({ children, onClick, disabled, variant="primary", small=false, full=true }) {
  const styles = {
    primary:   { bg: disabled?T.bgStrong:T.accent,    color: disabled?T.inkMuted:"#fff",      border:"none" },
    secondary: { bg: T.bgMuted,                        color: T.inkSoft,                     border:`1px solid ${T.border}` },
    danger:    { bg: T.crimsonSoft,                    color: T.crimson,                     border:`1px solid ${T.crimsonMid}` },
    ghost:     { bg: "transparent",                    color: T.inkMid,                      border:`1px solid ${T.border}` },
  };
  const s = styles[variant] || styles.primary;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: small?"7px 14px":"11px 20px",
      borderRadius:8, background:s.bg, color:s.color, border:s.border,
      fontSize: small?12:13, fontWeight:600,
      cursor: disabled?"not-allowed":"pointer",
      fontFamily:"'Space Grotesk',sans-serif", transition:"all 0.15s",
      width: full?"100%":"auto", letterSpacing:"0.01em",
    }}>{children}</button>
  );
}

function Label({ children }) {
  return <div style={{ fontSize:11, fontWeight:600, color:T.inkLight, letterSpacing:"0.09em", textTransform:"uppercase", marginBottom:7, fontFamily:"'Space Grotesk',sans-serif" }}>{children}</div>;
}

function Input({ value, onChange, placeholder, type="text", required=false }) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} style={{
      width:"100%", background:T.bgStrong, border:`1px solid ${T.border}`,
      borderRadius:8, padding:"10px 13px", color:T.ink, fontSize:13,
      outline:"none", fontFamily:"'Space Grotesk',sans-serif", boxSizing:"border-box",
      transition:"border-color 0.15s",
    }}/>
  );
}

function Textarea({ value, onChange, placeholder, height=80 }) {
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} style={{
      width:"100%", background:T.bgStrong, border:`1px solid ${T.border}`,
      borderRadius:8, padding:"10px 13px", color:T.ink, fontSize:13,
      resize:"none", height, outline:"none", fontFamily:"'Space Grotesk',sans-serif",
      lineHeight:1.6, boxSizing:"border-box",
    }}/>
  );
}

function Badge({ children, color="default" }) {
  const colors = {
    default: { bg:T.bgStrong,    color:T.inkMid },
    green:   { bg:T.greenSoft,   color:T.green  },
    gold:    { bg:T.goldSoft,    color:T.gold   },
    crimson: { bg:T.crimsonSoft, color:T.crimson},
    white:   { bg:"rgba(255,255,255,0.08)", color:T.inkSoft },
  };
  const c = colors[color]||colors.default;
  return <span style={{ fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:20, background:c.bg, color:c.color, letterSpacing:"0.07em", fontFamily:"'Space Grotesk',sans-serif" }}>{children}</span>;
}

function Divider() {
  return <div style={{ height:1, background:T.border, margin:"0 0" }}/>;
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
function LandingPage({ onSignup, onLogin }) {
  const [annual, setAnnual] = useState(true);
  const [frText, setFrText] = useState("");
  const [frEmail, setFrEmail] = useState("");
  const [frSent, setFrSent] = useState(false);

  // Scroll-reveal via IntersectionObserver
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.opacity = "1";
          e.target.style.transform = "none";
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
    document.querySelectorAll("[data-reveal]").forEach(el => {
      el.style.opacity = "0";
      el.style.transform = "translateY(24px)";
      el.style.transition = "opacity .8s cubic-bezier(.2,.7,.2,1), transform .8s cubic-bezier(.2,.7,.2,1)";
      io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  const creatorPrice = annual ? "$63" : "$79";
  const studioPrice  = annual ? "$135" : "$169";
  const period       = annual ? "/ mo, billed yearly" : "/ mo";

  const pillBtn = (active) => ({
    border: "none",
    background: active ? "#FF5B2E" : "transparent",
    color: active ? "#fff" : "#A89B86",
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 13.5,
    fontWeight: active ? 600 : 500,
    padding: "9px 18px",
    borderRadius: 999,
    cursor: "pointer",
    transition: "background .2s, color .2s",
  });

  const styles = {
    page: { fontFamily: "'Space Grotesk', sans-serif", background: "#14110D", minHeight: "100vh", color: "#F2EADB", overflowX: "hidden" },
    // Nav
    nav: { position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(14px)", background: "rgba(20,17,13,.72)", borderBottom: "1px solid rgba(242,234,219,.07)" },
    navInner: { maxWidth: 1200, margin: "0 auto", padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" },
    navLogo: { display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "inherit", cursor: "pointer" },
    navLogoIcon: { width: 30, height: 30, borderRadius: 9, background: "#FF5B2E", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    navWordmark: { fontFamily: "'Instrument Serif', serif", fontSize: 25 },
    navLinks: { display: "flex", alignItems: "center", gap: 32, fontSize: 14.5, color: "#A89B86" },
    navCta: { display: "flex", alignItems: "center", gap: 18, fontSize: 14.5 },
    btnGhost: { background: "none", border: "none", color: "#A89B86", cursor: "pointer", fontSize: 14.5, fontFamily: "'Space Grotesk', sans-serif", transition: "color .2s" },
    btnPill: { background: "#F2EADB", color: "#14110D", padding: "11px 20px", borderRadius: 999, fontWeight: 600, fontSize: 14.5, border: "none", cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", transition: "transform .2s" },
    // Hero
    heroGrid: { maxWidth: 1200, margin: "0 auto", padding: "84px 40px 72px", display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: 56, alignItems: "center", position: "relative" },
    eyebrow: { fontFamily: "'Space Mono', monospace", fontSize: 12, letterSpacing: ".18em", textTransform: "uppercase", color: "#FF7B52" },
    badge: { display: "inline-flex", alignItems: "center", gap: 9, fontFamily: "'Space Mono', monospace", fontSize: 12, letterSpacing: ".16em", textTransform: "uppercase", color: "#FF7B52", border: "1px solid rgba(255,91,46,.3)", padding: "7px 14px", borderRadius: 999 },
    h1: { fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: 82, lineHeight: .98, letterSpacing: "-.015em", margin: "24px 0 0" },
    h2: { fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: 56, lineHeight: 1.02, letterSpacing: "-.01em", margin: "16px 0 0" },
    h2lg: { fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: 50, lineHeight: 1.05, letterSpacing: "-.01em", margin: "16px 0 0" },
    btnOrange: { background: "#FF5B2E", color: "#fff", padding: "15px 28px", borderRadius: 999, fontWeight: 600, fontSize: 15.5, border: "none", cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", boxShadow: "0 10px 30px rgba(255,91,46,.25)", transition: "transform .2s", textDecoration: "none", display: "inline-block" },
    btnOutline: { border: "1px solid rgba(242,234,219,.22)", color: "#F2EADB", padding: "15px 26px", borderRadius: 999, fontWeight: 500, fontSize: 15.5, background: "none", cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", textDecoration: "none", display: "inline-block" },
    // Cards
    featureCard: { background: "#1A150F", border: "1px solid rgba(242,234,219,.09)", borderRadius: 16, padding: 28, transition: "border-color .2s, transform .2s", cursor: "default" },
    composerBox: { background: "#1E1812", border: "1px solid rgba(242,234,219,.1)", borderRadius: 20, padding: 20, boxShadow: "0 30px 70px rgba(0,0,0,.45)" },
    consolePanel: { background: "#1A150F", border: "1px solid rgba(242,234,219,.1)", borderRadius: 18, overflow: "hidden", boxShadow: "0 30px 70px rgba(0,0,0,.45)" },
    integCard: { background: "#1A150F", border: "1px solid rgba(242,234,219,.09)", borderRadius: 14, padding: 20, display: "flex", alignItems: "center", gap: 12, transition: "border-color .2s", cursor: "default" },
    priceCardBase: { background: "#1A150F", border: "1px solid rgba(242,234,219,.09)", borderRadius: 20, padding: 32, display: "flex", flexDirection: "column" },
    priceCardPop: { background: "#211913", border: "1.5px solid #FF5B2E", borderRadius: 20, padding: 32, display: "flex", flexDirection: "column", position: "relative", boxShadow: "0 30px 70px rgba(255,91,46,.12)" },
    priceBadge: { position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#FF5B2E", color: "#fff", fontFamily: "'Space Mono', monospace", fontSize: 10.5, letterSpacing: ".1em", padding: "5px 12px", borderRadius: 999, whiteSpace: "nowrap" },
    priceNum: { fontFamily: "'Instrument Serif', serif", fontSize: 58, lineHeight: 1 },
    pricePeriod: { fontSize: 14, color: "#7E7466" },
    checkItem: { display: "flex", gap: 10, fontSize: 14 },
    faqItem: { padding: "24px 0", borderBottom: "1px solid rgba(242,234,219,.08)" },
    faqQ: { fontFamily: "'Instrument Serif', serif", fontSize: 23 },
    faqA: { fontSize: 14.5, lineHeight: 1.6, color: "#9C9081", marginTop: 10 },
    // CTA section
    ctaBox: { position: "relative", background: "#1E1812", border: "1px solid rgba(242,234,219,.1)", borderRadius: 28, padding: "80px 40px", textAlign: "center", overflow: "hidden" },
  };

  const QuillLogoSvg = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M4 14 Q4 4 9 4 Q14 4 14 9 Q14 14 9 14" stroke="#14110D" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      <path d="M9 14 L9 17" stroke="#14110D" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );

  const PulseDot = () => (
    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF5B2E", display: "inline-block", animation: "qpulse 2.4s ease-in-out infinite" }}/>
  );

  const CheckIcon = () => <span style={{ color: "#FF7B52" }}>✓</span>;

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Space+Grotesk:wght@400;500;600&family=Space+Mono&display=swap');
        html { scroll-behavior: smooth; }
        ::selection { background: #FF5B2E; color: #14110D; }
        @keyframes qpulse { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:.35;transform:scale(.7);} }
        @keyframes qfloat { 0%,100%{transform:translateY(0) rotate(-4deg);}50%{transform:translateY(-14px) rotate(-4deg);} }
        .lp-nav-link { color: #A89B86; text-decoration: none; transition: color .2s; }
        .lp-nav-link:hover { color: #F2EADB; }
        .lp-feature-card:hover { border-color: rgba(255,91,46,.4) !important; transform: translateY(-4px) !important; }
        .lp-integ-card:hover { border-color: rgba(242,234,219,.25) !important; }
        .lp-btn-orange:hover { transform: translateY(-2px); }
        .lp-btn-outline:hover { border-color: rgba(242,234,219,.5) !important; }
        .lp-footer-link { color: #A89B86; text-decoration: none; transition: color .2s; }
        .lp-footer-link:hover { color: #F2EADB; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <div style={styles.navLogo} onClick={() => window.scrollTo(0,0)} role="button" tabIndex={0}>
            <div style={styles.navLogoIcon}><QuillLogoSvg/></div>
            <span style={styles.navWordmark}>Quill</span>
          </div>
          <div style={styles.navLinks}>
            <a href="#lp-features" className="lp-nav-link">Features</a>
            <a href="#lp-how" className="lp-nav-link">How it works</a>
            <a href="#lp-pricing" className="lp-nav-link">Pricing</a>
            
          </div>
          <div style={styles.navCta}>
            <button onClick={onLogin} style={styles.btnGhost}>Log in</button>
            <button onClick={onSignup} style={styles.btnPill}>Start free</button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", top: -120, right: -120, width: 620, height: 620, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,91,46,.16), rgba(255,91,46,0) 66%)", pointerEvents: "none" }}/>
        <div style={styles.heroGrid}>
          {/* Left */}
          <div data-reveal="">
            <div style={styles.badge}><PulseDot/> Autopilot for creators</div>
            <h1 style={styles.h1}>
              Your social media,<br/>on <em style={{ fontStyle: "italic", color: "#FF5B2E" }}>autopilot.</em>
            </h1>
            <p style={{ fontSize: 19, lineHeight: 1.55, color: "#B6AA98", maxWidth: 480, margin: "26px 0 0" }}>
              Quill writes, designs, and posts for you — across Instagram, Facebook, and Pinterest, every day. You set the direction. It ships the work.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 36 }}>
              <button onClick={onSignup} className="lp-btn-orange" style={styles.btnOrange}>Start free →</button>
              <a href="#lp-how" className="lp-btn-outline" style={styles.btnOutline}>Watch it work</a>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 28, fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#7E7466", letterSpacing: ".04em", flexWrap: "wrap" }}>
              <span>NO CARD NEEDED</span><span style={{ opacity: .4 }}>/</span>
              <span>7-DAY FULL ACCESS</span><span style={{ opacity: .4 }}>/</span>
              <span>CANCEL ANYTIME</span>
            </div>
          </div>

          {/* Right — composer mock */}
          <div data-reveal="" style={{ position: "relative" }}>
            <div style={styles.composerBox}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: "#A89B86" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF5B2E", display: "inline-block" }}/> Composing · today 9:00
                </div>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10.5, letterSpacing: ".1em", color: "#14110D", background: "#F4B740", padding: "4px 9px", borderRadius: 6 }}>AUTO</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {["Instagram", "Facebook", "Pinterest"].map((p, i) => (
                  <span key={p} style={{ fontSize: 12, color: i === 0 ? "#14110D" : "#A89B86", background: i === 0 ? "#F2EADB" : "#261F18", padding: "6px 12px", borderRadius: 8, fontWeight: i === 0 ? 600 : 400 }}>{p}</span>
                ))}
              </div>
              <div style={{ height: 178, borderRadius: 14, background: "repeating-linear-gradient(45deg,#2A221A,#2A221A 9px,#221B14 9px,#221B14 18px)", display: "flex", alignItems: "flex-end", padding: 12 }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#6E6557", background: "rgba(20,17,13,.55)", padding: "5px 9px", borderRadius: 6 }}>auto-designed carousel</span>
              </div>
              <p style={{ fontSize: 14.5, lineHeight: 1.5, color: "#D8CDBB", margin: "14px 2px 4px" }}>5 ways I batch a month of content in one sitting <span style={{ color: "#FF7B52" }}>→</span> the last one changed everything for me 🧵</p>
              <div style={{ display: "flex", gap: 6, margin: "0 2px 16px", fontSize: 12.5, color: "#7E7466" }}>#creatoreconomy · #solopreneur · #contentstrategy</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid rgba(242,234,219,.08)" }}>
                <span style={{ fontSize: 12.5, color: "#8E8373" }}>Queued to 4 platforms</span>
                <button onClick={onSignup} style={{ fontSize: 13, color: "#14110D", background: "#FF5B2E", padding: "8px 16px", borderRadius: 8, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif" }}>Approve &amp; schedule</button>
              </div>
            </div>
            {/* Floating stat */}
            <div style={{ position: "absolute", bottom: -26, left: -26, background: "#F2EADB", color: "#14110D", borderRadius: 14, padding: "14px 18px", boxShadow: "0 18px 40px rgba(0,0,0,.4)", animation: "qfloat 6s ease-in-out infinite" }}>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 30, lineHeight: 1 }}>+218%</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10.5, letterSpacing: ".08em", color: "#6b6052", marginTop: 3 }}>REACH THIS MONTH</div>
            </div>
          </div>
        </div>

        {/* Platform strip */}
        <div style={{ borderTop: "1px solid rgba(242,234,219,.08)", borderBottom: "1px solid rgba(242,234,219,.08)" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 40px", display: "flex", alignItems: "center", gap: 38, flexWrap: "wrap", fontFamily: "'Space Mono', monospace", fontSize: 12, letterSpacing: ".1em", color: "#6E6557" }}>
            <span style={{ color: "#574F44" }}>POSTS TO</span>
            {["INSTAGRAM","FACEBOOK","PINTEREST"].map(p => <span key={p}>{p}</span>)}
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px" }}>
        <div data-reveal="" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderBottom: "1px solid rgba(242,234,219,.08)" }}>
          {[
            { num: "3", label: "PLATFORMS, ONE QUEUE" },
            { num: "24/7", label: "PUBLISHING ON AUTOPILOT" },
            { num: "9 hrs", label: "SAVED EVERY WEEK" },
            { num: "7 days", label: "FREE, NO CARD NEEDED" },
          ].map((s, i) => (
            <div key={s.label} style={{ padding: i === 0 ? "46px 28px 46px 0" : i === 3 ? "46px 0 46px 28px" : "46px 28px", borderLeft: i > 0 ? "1px solid rgba(242,234,219,.08)" : "none" }}>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 50, lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11.5, letterSpacing: ".08em", color: "#7E7466", marginTop: 8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div id="lp-how" style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 40px 40px" }}>
        <div data-reveal="" style={{ maxWidth: 680 }}>
          <div style={styles.eyebrow}>How it works</div>
          <h2 style={styles.h2}>From one idea to a<br/>full feed — hands off.</h2>
          <p style={{ fontSize: 18, lineHeight: 1.55, color: "#B6AA98", margin: "20px 0 0" }}>Set the strategy once. Quill drafts, designs, schedules, and publishes — and shows you exactly what's going out, live.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: ".82fr 1.18fr", gap: 48, marginTop: 56, alignItems: "center" }}>
          <div data-reveal="" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { n: "01", title: "Set your voice", desc: "Tell Quill your brand, tone, and topics once. Every post follows it from day one." },
              { n: "02", title: "Draft and design",   desc: "Quill writes the caption and generates an on-brand image for every post, automatically." },
              { n: "03", title: "Auto-publish",      desc: "Posts go out on your schedule to Instagram, Facebook, and Pinterest. You just watch the feed fill up." },
            ].map(s => (
              <div key={s.n} className="lp-feature-card" style={styles.featureCard}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#FF7B52", letterSpacing: ".08em" }}>{s.n}</div>
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 25, marginTop: 8 }}>{s.title}</div>
                <p style={{ fontSize: 14.5, lineHeight: 1.55, color: "#9C9081", margin: "8px 0 0" }}>{s.desc}</p>
              </div>
            ))}
          </div>
          {/* Console panel */}
          <div data-reveal="" style={styles.consolePanel}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(242,234,219,.08)", background: "#1E1812" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#34D27B", boxShadow: "0 0 0 3px rgba(52,210,123,.18)", display: "inline-block" }}/>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12.5, letterSpacing: ".06em", color: "#D8CDBB" }}>AUTOPILOT · ON</span>
              </div>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11.5, color: "#7E7466" }}>this week · 14 posts queued</span>
            </div>
            <div style={{ padding: 8 }}>
              {[
                { time: "09:00", platform: "Instagram", copy: "5 ways I batch a month of content…", status: "PUBLISHING", statusColor: "#FF7B52", pulse: true,  rowBg: "rgba(255,91,46,.07)" },
                { time: "12:30", platform: "Facebook",  copy: "Why I stopped scheduling manually",  status: "SCHEDULED",  statusColor: "#8E8373", pulse: false, rowBg: "transparent" },
                { time: "17:00", platform: "Pinterest", copy: "3 hooks that doubled my saves",      status: "DESIGNING",  statusColor: "#F4B740", pulse: false, rowBg: "transparent" },
                { time: "19:30", platform: "X · Threads",copy: "The 1-idea-to-10-posts workflow",   status: "DRAFTED",    statusColor: "#8E8373", pulse: false, rowBg: "transparent" },
              ].map((row, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "64px 96px 1fr 124px", gap: 12, alignItems: "center", padding: 14, borderRadius: i === 0 ? 12 : 0, background: row.rowBg, borderTop: i > 0 ? "1px solid rgba(242,234,219,.05)" : "none" }}>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: i === 0 ? "#C7BBA8" : "#9C9081" }}>{row.time}</span>
                  <span style={{ fontSize: 11.5, color: i === 0 ? "#14110D" : "#A89B86", background: i === 0 ? "#F2EADB" : "#261F18", padding: "4px 9px", borderRadius: 7, textAlign: "center", fontWeight: i === 0 ? 600 : 400 }}>{row.platform}</span>
                  <span style={{ fontSize: 13.5, color: i === 0 ? "#E4DACA" : "#C7BBA8", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{row.copy}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: row.statusColor, fontFamily: "'Space Mono', monospace" }}>
                    {row.pulse && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF5B2E", display: "inline-block", animation: "qpulse 1.6s ease-in-out infinite" }}/>}
                    {row.status}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderTop: "1px solid rgba(242,234,219,.08)", background: "#1E1812" }}>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12.5, color: "#9C9081" }}>next 7 days</span>
              <span style={{ fontSize: 12, color: "#14110D", background: "#F4B740", padding: "7px 14px", borderRadius: 8, fontFamily: "'Space Mono', monospace", letterSpacing: ".04em" }}>+ 9 MORE AUTO-PLANNED</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div id="lp-features" style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 40px 40px" }}>
        <div data-reveal="" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40, flexWrap: "wrap" }}>
          <div style={{ maxWidth: 620 }}>
            <div style={styles.eyebrow}>Everything, handled</div>
            <h2 style={styles.h2}>A whole content team,<br/>running quietly.</h2>
          </div>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: "#9C9081", maxWidth: 320 }}>Each piece of the job a creator dreads — written, designed, timed, and shipped without you.</p>
        </div>
        <div data-reveal="" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginTop: 48 }}>
          {[
            { n:"01", t:"Writes in your voice",   d:"Describe your brand voice once. Every caption and hook sticks to it, on every post, without you touching a keyboard." },
            { n:"02", t:"Creates every image",    d:"On-brand images generated automatically for each post. No designer, no stock photos, no blank feed." },
            { n:"03", t:"Posts on your schedule", d:"Daily, weekdays, or weekly. Pick the cadence and time once and Quill publishes like clockwork." },
            { n:"04", t:"One theme, endless posts", d:"A single campaign brief becomes a continuous stream of fresh, on-theme content. Set it and forget it." },
            { n:"05", t:"Post now, anytime",      d:"Need something out immediately? Generate, tweak, and publish a post in under a minute from any campaign." },
            { n:"06", t:"Analytics + AI insights",d:"Track impressions and post performance across platforms, with AI-generated insights on what is working." },
          ].map(f => (
            <div key={f.n} className="lp-feature-card" style={styles.featureCard}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#7E7466" }}>{f.n}</div>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 27, marginTop: 14 }}>{f.t}</div>
              <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "#9C9081", margin: "10px 0 0" }}>{f.d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── TESTIMONIALS ── */}
      <div id="lp-stories" style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 40px 40px" }}>
        <div data-reveal="" style={{ textAlign: "center", maxWidth: 760, margin: "0 auto" }}>
          <div style={styles.eyebrow}>Stories</div>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: 50, lineHeight: 1.05, letterSpacing: "-.01em", margin: "16px 0 0" }}>
            "I went from posting twice a month to <em style={{ fontStyle: "italic", color: "#FF5B2E" }}>every single day</em> — and I didn't touch a thing."
          </h2>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 24 }}>
            <span style={{ width: 38, height: 38, borderRadius: "50%", background: "repeating-linear-gradient(45deg,#2A221A,#2A221A 6px,#221B14 6px,#221B14 12px)", display: "inline-block", flexShrink: 0 }}/>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 14.5, color: "#F2EADB" }}>Maya Okafor</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11.5, color: "#7E7466" }}>@maya.makes · 92k followers</div>
            </div>
          </div>
        </div>
        <div data-reveal="" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginTop: 56 }}>
          {[
            { q: '"It writes more like me than I do at 11pm. My engagement doubled in six weeks."', name: "Devon Reyes", handle: "@devbuilds" },
            { q: '"I run a one-person studio. Quill is the marketing hire I could never afford."',   name: "Priya Anand", handle: "@priya.ceramics" },
            { q: '"Set it on Monday, forget it all week. The feed just keeps showing up without me."', name: "Theo Marsh", handle: "@theo.travels" },
          ].map(t => (
            <div key={t.handle} style={{ background: "#1A150F", border: "1px solid rgba(242,234,219,.09)", borderRadius: 16, padding: 26 }}>
              <p style={{ fontSize: 15.5, lineHeight: 1.6, color: "#D8CDBB", margin: 0 }}>{t.q}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 11, marginTop: 22 }}>
                <span style={{ width: 34, height: 34, borderRadius: "50%", background: "repeating-linear-gradient(45deg,#2A221A,#2A221A 6px,#221B14 6px,#221B14 12px)", display: "inline-block", flexShrink: 0 }}/>
                <div>
                  <div style={{ fontSize: 13.5 }}>{t.name}</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#7E7466" }}>{t.handle}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── INTEGRATIONS ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 40px 40px" }}>
        <div data-reveal="" style={{ maxWidth: 560 }}>
          <div style={styles.eyebrow}>Integrations</div>
          <h2 style={styles.h2lg}>Plugs into your whole stack.</h2>
          <p style={{ fontSize: 17, lineHeight: 1.55, color: "#B6AA98", margin: "18px 0 0" }}>Publish to Instagram, Facebook, and Pinterest from one queue — with more platforms on the way.</p>
        </div>
        <div data-reveal="" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginTop: 44 }}>
          {["Instagram","Facebook","Pinterest"].map(name => (
            <div key={name} className="lp-integ-card" style={styles.integCard}>
              <span style={{ width: 30, height: 30, borderRadius: 9, background: "#261F18", display: "inline-block", flexShrink: 0 }}/>
              <span style={{ fontSize: 14.5, color: "#D8CDBB" }}>{name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── PRICING ── */}
      <div id="lp-pricing" style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 40px 40px" }}>
        <div data-reveal="" style={{ textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
          <div style={styles.eyebrow}>Pricing</div>
          <h2 style={styles.h2}>Cheaper than a coffee habit.</h2>
          <p style={{ fontSize: 17, lineHeight: 1.55, color: "#B6AA98", margin: "18px 0 0" }}>Start free. Upgrade when Quill has already paid for itself.</p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 26, background: "#1A150F", border: "1px solid rgba(242,234,219,.1)", borderRadius: 999, padding: 5 }}>
            <button style={pillBtn(!annual)} onClick={() => setAnnual(false)}>Monthly</button>
            <button style={pillBtn(annual)}  onClick={() => setAnnual(true)}>Annual · save 20%</button>
          </div>
        </div>
        <div data-reveal="" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginTop: 48, alignItems: "stretch" }}>
          {/* Starter */}
          <div style={styles.priceCardBase}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, letterSpacing: ".1em", color: "#A89B86", textTransform: "uppercase" }}>Starter</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 18 }}><span style={styles.priceNum}>{annual ? "$23" : "$29"}</span><span style={styles.pricePeriod}>{period}</span></div>
            <p style={{ fontSize: 14, color: "#9C9081", margin: "14px 0 0", lineHeight: 1.5 }}>Perfect for solo business owners.</p>
            <button onClick={onSignup} style={{ display: "block", textAlign: "center", margin: "24px 0 26px", border: "1px solid rgba(242,234,219,.22)", color: "#F2EADB", padding: 13, borderRadius: 999, fontWeight: 600, fontSize: 14.5, background: "none", cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", width: "100%" }}>Start 7-day trial</button>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {["3 platforms included","3 active campaigns","50 posts per month","20 images per month","Basic analytics","Email support"].map(f => (
                <div key={f} style={styles.checkItem}><CheckIcon/> {f}</div>
              ))}
            </div>
          </div>
          {/* Creator */}
          <div style={styles.priceCardPop}>
            <span style={styles.priceBadge}>MOST POPULAR</span>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, letterSpacing: ".1em", color: "#FF7B52", textTransform: "uppercase" }}>Growth</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 18 }}><span style={styles.priceNum}>{creatorPrice}</span><span style={styles.pricePeriod}>{period}</span></div>
            <p style={{ fontSize: 14, color: "#9C9081", margin: "14px 0 0", lineHeight: 1.5 }}>For small businesses scaling up.</p>
            <button onClick={onSignup} style={{ display: "block", textAlign: "center", margin: "24px 0 26px", background: "#FF5B2E", color: "#fff", padding: 13, borderRadius: 999, fontWeight: 600, fontSize: 14.5, border: "none", cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", boxShadow: "0 10px 30px rgba(255,91,46,.3)", width: "100%" }}>Start 7-day trial</button>
            <div style={{ display: "flex", flexDirection: "column", gap: 11, color: "#E4DACA" }}>
              {["Unlimited campaigns","Unlimited posts","100 images per month","Full analytics + insights","Brand Kit","Priority support"].map(f => (
                <div key={f} style={styles.checkItem}><CheckIcon/> {f}</div>
              ))}
            </div>
          </div>
          {/* Studio */}
          <div style={styles.priceCardBase}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, letterSpacing: ".1em", color: "#A89B86", textTransform: "uppercase" }}>Agency</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 18 }}><span style={styles.priceNum}>{studioPrice}</span><span style={styles.pricePeriod}>{period}</span></div>
            <p style={{ fontSize: 14, color: "#9C9081", margin: "14px 0 0", lineHeight: 1.5 }}>For agencies managing clients.</p>
            <button onClick={onSignup} style={{ display: "block", textAlign: "center", margin: "24px 0 26px", border: "1px solid rgba(242,234,219,.22)", color: "#F2EADB", padding: 13, borderRadius: 999, fontWeight: 600, fontSize: 14.5, background: "none", cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif", width: "100%" }}>Start 7-day trial</button>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {["Everything in Growth","Unlimited client accounts","White-label option","Client approval flows","Dedicated account manager"].map(f => (
                <div key={f} style={styles.checkItem}><CheckIcon/> {f}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 40px 40px" }}>
        <div data-reveal="" style={{ maxWidth: 560 }}>
          <div style={styles.eyebrow}>FAQ</div>
          <h2 style={styles.h2lg}>The questions everyone asks.</h2>
        </div>
        <div data-reveal="" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 48px", marginTop: 44, borderTop: "1px solid rgba(242,234,219,.08)", paddingTop: 8 }}>
          {[
            { q: "Will it actually sound like me?",            a: "You describe your voice in plain words: warm, witty, luxury, whatever fits. Quill sticks to it on every post, and you can edit anything before it ships." },
            { q: "Do I approve posts, or does it just publish?",a: "Campaigns run on autopilot at the times you set. Want more control? Use Post Now to review and edit any post before it goes live." },
            { q: "Which platforms can it post to?",             a: "Instagram, TikTok, LinkedIn, X, and Facebook today — with more rolling out. One queue feeds them all." },
            { q: "Can I cancel anytime?",                       a: "Yes. No contracts, no lock-in. Every paid plan starts with a 7-day full-access trial, no card required." },
          ].map(f => (
            <div key={f.q} style={styles.faqItem}>
              <div style={styles.faqQ}>{f.q}</div>
              <p style={styles.faqA}>{f.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURE REQUEST ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 40px 40px" }}>
        <div data-reveal="" style={{ background: "#1A150F", border: "1px solid rgba(242,234,219,.1)", borderRadius: 24, padding: 48, display: "grid", gridTemplateColumns: ".9fr 1.1fr", gap: 48, alignItems: "center" }}>
          <div>
            <div style={styles.eyebrow}>Shape the roadmap</div>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: 44, lineHeight: 1.05, letterSpacing: "-.01em", margin: "14px 0 0" }}>Missing something?<br/>Tell us what to build.</h2>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: "#9C9081", margin: "16px 0 0", maxWidth: 340 }}>Real requests from creators ship every week. Drop yours — we read every one.</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 22 }}>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#8E8373", background: "#261F18", padding: "6px 11px", borderRadius: 999 }}>↑ 412 · Carousel templates</span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#8E8373", background: "#261F18", padding: "6px 11px", borderRadius: 999 }}>↑ 287 · Pinterest support</span>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#14110D", background: "#34D27B", padding: "6px 11px", borderRadius: 999 }}>✓ Shipped · Voice notes</span>
            </div>
          </div>
          <div style={{ background: "#14110D", border: "1px solid rgba(242,234,219,.1)", borderRadius: 18, padding: 26 }}>
            {!frSent ? (
              <>
                <label style={{ fontFamily: "'Space Mono', monospace", fontSize: 11.5, letterSpacing: ".08em", color: "#7E7466", textTransform: "uppercase" }}>What should Quill do next?</label>
                <textarea value={frText} onChange={e => setFrText(e.target.value)} placeholder="e.g. auto-generate Reels from my blog posts…" rows={3} style={{ width: "100%", marginTop: 10, resize: "vertical", background: "#1E1812", border: "1px solid rgba(242,234,219,.12)", borderRadius: 12, padding: 14, color: "#F2EADB", fontFamily: "'Space Grotesk', sans-serif", fontSize: 14.5, lineHeight: 1.5, outline: "none" }}/>
                <label style={{ display: "block", marginTop: 16, fontFamily: "'Space Mono', monospace", fontSize: 11.5, letterSpacing: ".08em", color: "#7E7466", textTransform: "uppercase" }}>Email (so we can tell you when it ships)</label>
                <input value={frEmail} onChange={e => setFrEmail(e.target.value)} placeholder="you@studio.com" style={{ width: "100%", marginTop: 10, background: "#1E1812", border: "1px solid rgba(242,234,219,.12)", borderRadius: 12, padding: "13px 14px", color: "#F2EADB", fontFamily: "'Space Grotesk', sans-serif", fontSize: 14.5, outline: "none" }}/>
                <button onClick={() => frText.trim() && setFrSent(true)} style={{ width: "100%", marginTop: 18, background: "#FF5B2E", color: "#fff", border: "none", padding: 14, borderRadius: 999, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15, cursor: "pointer", boxShadow: "0 10px 30px rgba(255,91,46,.28)" }}>Send request →</button>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "18px 8px" }}>
                <div style={{ width: 54, height: 54, borderRadius: "50%", background: "rgba(52,210,123,.16)", color: "#34D27B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>✓</div>
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 30, marginTop: 16 }}>Added to the roadmap.</div>
                <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "#9C9081", margin: "10px 0 0", maxWidth: 320 }}>Thanks — we read every request and ship the popular ones fast. We'll email you the moment yours goes live.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 40px" }}>
        <div data-reveal="" style={styles.ctaBox}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(100% 120% at 50% 0%,rgba(255,91,46,.18),rgba(30,24,18,0) 60%)", pointerEvents: "none" }}/>
          <div style={{ position: "relative" }}>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: 66, lineHeight: 1.0, letterSpacing: "-.015em", margin: 0 }}>
              Put your feed on<br/><em style={{ fontStyle: "italic", color: "#FF5B2E" }}>autopilot</em> tonight.
            </h2>
            <p style={{ fontSize: 18, lineHeight: 1.55, color: "#B6AA98", maxWidth: 480, margin: "22px auto 0" }}>Connect an account, set your direction, and wake up to a week of posts already live.</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 34 }}>
              <button onClick={onSignup} className="lp-btn-orange" style={{ ...styles.btnOrange, padding: "16px 32px", fontSize: 16, boxShadow: "0 14px 40px rgba(255,91,46,.32)" }}>Start free →</button>
              <a href="#lp-how" className="lp-btn-outline" style={{ ...styles.btnOutline, padding: "16px 28px", fontSize: 16 }}>See it in action</a>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ borderTop: "1px solid rgba(242,234,219,.08)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 40px 40px", display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 40 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={styles.navLogoIcon}><QuillLogoSvg/></div>
              <span style={styles.navWordmark}>Quill</span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "#7E7466", maxWidth: 260, margin: "16px 0 0" }}>Your social media, on autopilot. Written, designed, and posted for you — every day.</p>
          </div>
          {[
            { label: "Product",    links: [["Features","#lp-features"],["How it works","#lp-how"],["Pricing","#lp-pricing"],["Integrations","#lp-features"]] },
            { label: "Company",   links: [["About","#"],["Careers","#"],["Blog","#"]] },
            { label: "Get started",links: [["Log in","#"],["Start free","#lp-pricing"],["Contact","#"]] },
          ].map(col => (
            <div key={col.label}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11.5, letterSpacing: ".1em", color: "#574F44", textTransform: "uppercase" }}>{col.label}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
                {col.links.map(([text, href]) => (
                  <a key={text} href={href} className="lp-footer-link" onClick={text === "Log in" ? (e) => { e.preventDefault(); onLogin(); } : text === "Start free" ? (e) => { e.preventDefault(); onSignup(); } : undefined}>{text}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 40px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(242,234,219,.06)", fontFamily: "'Space Mono', monospace", fontSize: 11.5, color: "#574F44", letterSpacing: ".04em" }}>
          <span>© 2026 QUILL · MADE FOR PEOPLE WITH BETTER THINGS TO DO</span>
          <span style={{ display: "flex", gap: 20 }}>
            <a href="#" style={{ color: "inherit", textDecoration: "none" }}>PRIVACY</a>
            <a href="#" style={{ color: "inherit", textDecoration: "none" }}>TERMS</a>
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({ onAuth, initialMode="login" }) {
  const [mode, setMode]       = useState(initialMode);
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setSuccess(""); setLoading(true);
    try {
      if (mode==="signup") {
        const { error } = await supabase.auth.signUp({ email, password, options:{ data:{ full_name:name } } });
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
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Space Grotesk',sans-serif", padding:20, position:"relative", overflow:"hidden" }}>
      <style>{`@keyframes authIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } } input:focus { border-color: rgba(255,91,46,.55) !important; box-shadow: 0 0 0 3px rgba(255,91,46,.12); }`}</style>
      <div style={{ position:"absolute", top:"-25%", left:"50%", transform:"translateX(-50%)", width:720, height:720, borderRadius:"50%", background:"radial-gradient(circle, rgba(255,91,46,.14), rgba(255,91,46,0) 65%)", pointerEvents:"none" }}/>
      <div style={{ width:"100%", maxWidth:380, position:"relative", animation:"authIn .5s cubic-bezier(.2,.7,.2,1)" }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <QuillLogo size={36}/>
            <span style={{ fontFamily:"Instrument Serif, serif", fontSize:26, fontWeight:400, color:T.ink }}>Quill</span>
          </div>
          <p style={{ fontSize:13, color:T.inkMid, margin:0 }}>Marketing Agent</p>
        </div>
        <div style={{ background:T.bgMuted, borderRadius:14, border:`1px solid ${T.border}`, padding:28 }}>
          <h2 style={{ fontFamily:"Instrument Serif, serif", fontSize:26, fontWeight:400, color:T.ink, margin:"0 0 5px" }}>
            {mode==="login" ? "Welcome back" : "Start your free trial"}
          </h2>
          <p style={{ fontSize:13, color:T.inkMid, margin:"0 0 22px" }}>
            {mode==="login" ? "Sign in to your workspace" : "7 days free, no credit card needed"}
          </p>
          {error   && <div style={{ background:T.crimsonSoft, border:`1px solid ${T.crimsonMid}`, borderRadius:8, padding:"10px 13px", fontSize:13, color:T.crimson, marginBottom:14 }}>{error}</div>}
          {success && <div style={{ background:T.greenSoft,   border:`1px solid ${T.green}33`,   borderRadius:8, padding:"10px 13px", fontSize:13, color:T.green,   marginBottom:14 }}>{success}</div>}
          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {mode==="signup" && <div><Label>Full name</Label><Input value={name} onChange={e=>setName(e.target.value)} placeholder="Jane Smith" required/></div>}
            <div><Label>Email</Label><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/></div>
            <div><Label>Password</Label><Input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required/></div>
            <div style={{ marginTop:4 }}>
              <button type="submit" disabled={loading} style={{ width:"100%", padding:"11px 0", borderRadius:8, background:loading?T.bgStrong:T.accent, border:"none", color:loading?T.inkMuted:"#fff", fontSize:13, fontWeight:700, cursor:loading?"not-allowed":"pointer", fontFamily:"'Space Grotesk',sans-serif" }}>
                {loading ? "Please wait…" : (mode==="login" ? "Sign in" : "Create account")}
              </button>
            </div>
          </form>
          <div style={{ marginTop:18, textAlign:"center", fontSize:13, color:T.inkMid }}>
            {mode==="login"
              ? <>Don't have an account? <button onClick={()=>{setMode("signup");setError("");}} style={{ background:"none", border:"none", color:T.inkSoft, cursor:"pointer", fontWeight:600, fontSize:13, fontFamily:"'Space Grotesk',sans-serif" }}>Start free trial</button></>
              : <>Already have an account? <button onClick={()=>{setMode("login");setError("");}} style={{ background:"none", border:"none", color:T.inkSoft, cursor:"pointer", fontWeight:600, fontSize:13, fontFamily:"'Space Grotesk',sans-serif" }}>Sign in</button></>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CAMPAIGNS ────────────────────────────────────────────────────────────────
function CampaignsView({ user }) {
  const [subTab, setSubTab]                   = useState("campaigns");
  const [campaigns, setCampaigns]             = useState([]);
  const [view, setView]                       = useState("list");
  const [form, setForm]                       = useState({ name:"", theme:"", brandVoice:"", platforms:[], frequency:"daily", postTime:"10:00" });
  const [preview, setPreview]                 = useState(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [fetching, setFetching]               = useState(true);
  const [error, setError]                     = useState("");
  const [postModal, setPostModal]             = useState(null);
  const [postCaption, setPostCaption]         = useState("");
  const [postImage, setPostImage]             = useState(null);
  const [generatingCaption, setGeneratingCaption]   = useState(false);
  const [generatingPostImage, setGeneratingPostImage] = useState(false);
  const [publishing, setPublishing]           = useState(false);

  useEffect(() => { fetchCampaigns(); }, []);

  const fetchCampaigns = async () => {
    setFetching(true);
    const { data } = await supabase.from("campaigns").select("*").order("created_at",{ascending:false});
    setCampaigns(data||[]);
    setFetching(false);
  };

  const setField    = (k,v) => setForm(f=>({...f,[k]:v}));
  const togglePlat  = (id)  => setField("platforms", form.platforms.includes(id)?form.platforms.filter(p=>p!==id):[...form.platforms,id]);

  const generatePreview = async () => {
    if (!form.theme.trim()) return;
    setGeneratingPreview(true); setPreview(null);
    try {
      let raw="";
      await callClaude("Generate one social media post. Output ONLY a JSON object: {caption:string, hashtags:string[5]}. No markdown.",`Theme: "${form.theme}". Voice: ${form.brandVoice||"professional"}.`,c=>{raw=c;});
      setPreview(JSON.parse(raw.replace(/```json|```/g,"").trim()));
    } catch { setError("Preview failed."); }
    setGeneratingPreview(false);
  };

  const createCampaign = async () => {
    if (!form.name.trim()||!form.theme.trim()||!form.platforms.length){setError("Fill in name, theme, and select a platform.");return;}
    const active = campaigns.filter(c=>c.status==="active").length;
    if (active>=2){setError("Campaign limit reached. Upgrade to create more.");return;}
    setLoading(true); setError("");
    const {error} = await supabase.from("campaigns").insert({user_id:user.id,name:form.name,theme:form.theme,brand_voice:form.brandVoice||"professional",platforms:form.platforms,frequency:form.frequency,post_time:form.postTime,status:"active"});
    if (error){setError(error.message);setLoading(false);return;}
    await fetchCampaigns();
    setForm({name:"",theme:"",brandVoice:"",platforms:[],frequency:"daily",postTime:"10:00"});
    setPreview(null); setView("list"); setLoading(false);
  };

  const toggleStatus   = async (c) => { await supabase.from("campaigns").update({status:c.status==="active"?"paused":"active"}).eq("id",c.id); await fetchCampaigns(); };
  const deleteCampaign = async (id) => { await supabase.from("campaigns").delete().eq("id",id); await fetchCampaigns(); };

  const openPostModal = async (campaign) => {
    setPostModal(campaign); setPostImage(null); setPostCaption(""); setGeneratingCaption(true);
    try {
      let caption="";
      await callClaude("Write one engaging social post caption. Output ONLY the caption.",`Theme: "${campaign.theme}". Voice: ${campaign.brand_voice}.`,c=>{caption=c;});
      setPostCaption(caption);
    } catch { setError("Could not generate caption."); }
    setGeneratingCaption(false);
  };

  const generatePostImage = async () => {
    if (!postModal) return;
    setGeneratingPostImage(true);
    try {
      const res = await fetch(SERVER_URL+"/api/image",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:`Professional marketing image for Instagram. Theme: ${postModal.theme}. Clean, eye-catching style.`})});
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setPostImage(d.url);
    } catch(e) { setError("Image generation failed."); }
    setGeneratingPostImage(false);
  };

  const handleImageUpload = (e) => {
    const file=e.target.files[0]; if (!file) return;
    const reader=new FileReader();
    reader.onload=(ev)=>setPostImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  const publishPost = async () => {
    if (!postModal||!postCaption.trim()) return;
    setPublishing(true);
    try {
      const res=await fetch(SERVER_URL+"/api/publish",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({platforms:postModal.platforms,text:postCaption,imageUrl:postImage,theme:postModal.theme})});
      const d=await res.json();
      if (d.error) throw new Error(d.error);
      await supabase.from("campaigns").update({posts_published:(postModal.posts_published||0)+1,last_post:postCaption.slice(0,55)+"..."}).eq("id",postModal.id);
      await fetchCampaigns();
      setPostModal(null);
      alert("Posted successfully!");
    } catch(e) { setError("Post failed: "+e.message); }
    setPublishing(false);
  };

  if (subTab==="brandkit") return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:28}}>
        <button onClick={()=>setSubTab("campaigns")} style={{padding:"7px 14px",borderRadius:7,background:T.bgMuted,border:`1px solid ${T.border}`,color:T.inkMid,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Space Grotesk',sans-serif"}}>← Back</button>
        <h2 style={{fontFamily:"Instrument Serif, serif",fontSize:26,fontWeight:400,color:T.ink,margin:0}}>Brand Kit</h2>
      </div>
      <BrandKitView user={user}/>
    </div>
  );

  if (view==="create") return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:28}}>
        <button onClick={()=>{setView("list");setError("");}} style={{padding:"7px 14px",borderRadius:7,background:T.bgMuted,border:`1px solid ${T.border}`,color:T.inkMid,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Space Grotesk',sans-serif"}}>← Back</button>
        <h2 style={{fontFamily:"Instrument Serif, serif",fontSize:26,fontWeight:400,color:T.ink,margin:0}}>New Campaign</h2>
      </div>
      {error && <div style={{background:T.crimsonSoft,border:`1px solid ${T.crimsonMid}`,borderRadius:8,padding:"10px 13px",fontSize:13,color:T.crimson,marginBottom:16}}>{error}</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div><Label>Campaign name</Label><Input value={form.name} onChange={e=>setField("name",e.target.value)} placeholder="e.g. Daily Style Tips"/></div>
          <div><Label>Content theme</Label><Textarea value={form.theme} onChange={e=>setField("theme",e.target.value)} placeholder="e.g. Daily fashion tips for boutique shoppers." height={90}/></div>
          <div><Label>Brand voice (optional)</Label><Input value={form.brandVoice} onChange={e=>setField("brandVoice",e.target.value)} placeholder="e.g. warm, stylish, fashion-forward"/></div>
          <div>
            <Label>Platforms</Label>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {PLATFORMS.map(p=>(
                <button key={p.id} onClick={()=>togglePlat(p.id)} style={{padding:"7px 14px",borderRadius:20,fontSize:12,fontWeight:600,background:form.platforms.includes(p.id)?p.color+"22":T.bgStrong,border:`1px solid ${form.platforms.includes(p.id)?p.color:T.border}`,color:form.platforms.includes(p.id)?p.color:T.inkMid,cursor:"pointer",fontFamily:"'Space Grotesk',sans-serif"}}>{p.icon} {p.label}</button>
              ))}
            </div>
          </div>
          <div>
            <Label>Frequency</Label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {FREQUENCIES.map(f=>(
                <button key={f.id} onClick={()=>setField("frequency",f.id)} style={{padding:"9px 12px",borderRadius:8,background:form.frequency===f.id?T.accent:T.bgStrong,border:`1px solid ${form.frequency===f.id?T.accent:T.border}`,color:form.frequency===f.id?"#fff":T.inkMid,cursor:"pointer",fontSize:12,fontWeight:600,textAlign:"left",fontFamily:"'Space Grotesk',sans-serif"}}>{f.label}</button>
              ))}
            </div>
          </div>
          <div><Label>Post time</Label><Input type="time" value={form.postTime} onChange={e=>setField("postTime",e.target.value)}/></div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={generatePreview} disabled={generatingPreview||!form.theme.trim()} style={{flex:1,padding:"10px 0",borderRadius:8,background:T.bgStrong,border:`1px solid ${T.border}`,color:T.inkMid,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Space Grotesk',sans-serif"}}>{generatingPreview?"Generating…":"Preview"}</button>
            <button onClick={createCampaign} disabled={loading} style={{flex:2,padding:"10px 0",borderRadius:8,background:loading?T.bgStrong:T.accent,border:"none",color:loading?T.inkMuted:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Space Grotesk',sans-serif"}}>{loading?"Launching…":"Launch Campaign"}</button>
          </div>
        </div>
        <div>
          <Label>Preview</Label>
          {preview ? (
            <Card style={{marginTop:6}}>
              <div style={{fontSize:10,fontWeight:700,color:T.inkLight,letterSpacing:"0.1em",marginBottom:12}}>SAMPLE POST</div>
              <p style={{fontSize:14,color:T.ink,lineHeight:1.7,marginBottom:14}}>{preview.caption}</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {preview.hashtags?.map((h,i)=><span key={i} style={{fontSize:12,color:T.inkMid,background:T.bgStrong,padding:"2px 10px",borderRadius:20}}>#{h}</span>)}
              </div>
            </Card>
          ) : (
            <Card style={{minHeight:200,display:"flex",alignItems:"center",justifyContent:"center",marginTop:6}}>
              <p style={{fontSize:13,color:T.inkLight,textAlign:"center"}}>Fill in your theme and click Preview</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <UsageBanner currentPlan="trial" campaigns={campaigns.length} posts={campaigns.reduce((s,c)=>s+(c.posts_published||0),0)} images={0}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
        <div>
          <h2 style={{fontFamily:"Instrument Serif, serif",fontSize:30,fontWeight:400,color:T.ink,margin:0}}>Campaigns</h2>
          <p style={{fontSize:13,color:T.inkMid,marginTop:4}}>Set a theme and a schedule — Quill publishes automatically</p>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>setSubTab("brandkit")} style={{padding:"8px 16px",borderRadius:8,background:T.bgMuted,border:`1px solid ${T.border}`,color:T.inkMid,fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"'Space Grotesk',sans-serif"}}>🎨 Brand Kit</button>
          <button onClick={()=>{setView("create");setError("");}} style={{padding:"8px 18px",borderRadius:8,background:T.accent,border:"none",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Space Grotesk',sans-serif"}}>+ New Campaign</button>
        </div>
      </div>

      {error && <div style={{background:T.crimsonSoft,border:`1px solid ${T.crimsonMid}`,borderRadius:8,padding:"10px 13px",fontSize:13,color:T.crimson,marginBottom:16}}>{error}</div>}

      {fetching ? (
        <div style={{textAlign:"center",padding:60,color:T.inkMid}}>Loading…</div>
      ) : campaigns.length===0 ? (
        <Card style={{padding:"80px 40px",textAlign:"center"}}>
          <div style={{width:52,height:52,borderRadius:12,background:T.bgStrong,border:`1px solid ${T.borderStrong}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:22,color:T.inkMid}}>✦</div>
          <h3 style={{fontSize:18,fontWeight:700,color:T.ink,margin:"0 0 8px"}}>No campaigns yet</h3>
          <p style={{fontSize:13,color:T.inkMid,maxWidth:320,margin:"0 auto 24px",lineHeight:1.6}}>Create your first campaign and let Quill generate and publish content automatically</p>
          <button onClick={()=>setView("create")} style={{padding:"10px 24px",borderRadius:8,background:T.accent,border:"none",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Space Grotesk',sans-serif"}}>Create first campaign</button>
        </Card>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:14}}>
          {campaigns.map(c=>(
            <Card key={c.id} style={{display:"flex",flexDirection:"column",gap:14,border:`1px solid ${c.status==="active"?T.borderBright:T.border}`,padding:20}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1,minWidth:0,marginRight:10}}>
                  <div style={{fontSize:14,fontWeight:600,color:T.ink,marginBottom:3}}>{c.name}</div>
                  <div style={{fontSize:12,color:T.inkMid,lineHeight:1.5}}>"{c.theme?.slice(0,55)}{c.theme?.length>55?"…":""}"</div>
                </div>
                <Badge color={c.status==="active"?"green":"gold"}>{c.status==="active"?"ACTIVE":"PAUSED"}</Badge>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {c.platforms?.map(pid=>{const p=PLATFORMS.find(pl=>pl.id===pid);return p?<span key={pid} style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:p.color+"18",color:p.color,border:`1px solid ${p.color}33`,fontWeight:600}}>{p.icon} {p.label}</span>:null;})}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                {[{label:"Schedule",val:FREQUENCIES.find(f=>f.id===c.frequency)?.label},{label:"Published",val:c.posts_published||0},{label:"Post time",val:c.post_time}].map(s=>(
                  <div key={s.label} style={{background:T.bgStrong,borderRadius:7,padding:"8px 10px"}}>
                    <div style={{fontSize:9,color:T.inkLight,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3}}>{s.label}</div>
                    <div style={{fontSize:12,color:T.inkSoft,fontWeight:600}}>{s.val}</div>
                  </div>
                ))}
              </div>
              {c.last_post && <p style={{fontSize:12,color:T.inkMid,fontStyle:"italic",margin:0}}>Last: "{c.last_post}"</p>}
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>openPostModal(c)} style={{flex:1,padding:"7px 0",borderRadius:7,background:T.bgStrong,border:`1px solid ${T.border}`,color:T.inkMid,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Space Grotesk',sans-serif"}}>▶ Post now</button>
                <button onClick={()=>toggleStatus(c)} style={{flex:1,padding:"7px 0",borderRadius:7,background:T.bgStrong,border:`1px solid ${T.border}`,color:c.status==="active"?T.gold:T.green,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Space Grotesk',sans-serif"}}>{c.status==="active"?"⏸ Pause":"▶ Resume"}</button>
                <button onClick={()=>deleteCampaign(c.id)} style={{padding:"7px 12px",borderRadius:7,background:T.crimsonSoft,border:`1px solid ${T.crimsonMid}`,color:T.crimson,fontSize:12,cursor:"pointer"}}>✕</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {postModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(6px)"}}>
          <div style={{background:T.bgMuted,border:`1px solid ${T.borderStrong}`,borderRadius:16,padding:28,width:"100%",maxWidth:540,maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <h3 style={{fontSize:16,fontWeight:700,color:T.ink,margin:0}}>Post to {postModal.name}</h3>
              <button onClick={()=>setPostModal(null)} style={{background:"none",border:"none",fontSize:20,color:T.inkMid,cursor:"pointer",lineHeight:1}}>×</button>
            </div>
            <div style={{display:"flex",gap:7,marginBottom:18}}>
              {postModal.platforms?.map(pid=>{const p=PLATFORMS.find(pl=>pl.id===pid);return p?<span key={pid} style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:p.color+"18",color:p.color,border:`1px solid ${p.color}33`,fontWeight:600}}>{p.icon} {p.label}</span>:null;})}
            </div>
            <div style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <Label>Caption</Label>
                <button onClick={()=>openPostModal(postModal)} disabled={generatingCaption} style={{fontSize:11,color:T.inkMid,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>{generatingCaption?"Generating…":"↻ Regenerate"}</button>
              </div>
              <Textarea value={postCaption} onChange={e=>setPostCaption(e.target.value)} height={100}/>
            </div>
            <div style={{marginBottom:22}}>
              <Label>Image {postModal.platforms?.includes("instagram")?"(required for Instagram)":"(optional)"}</Label>
              {postImage ? (
                <div style={{position:"relative",borderRadius:10,overflow:"hidden",border:`1px solid ${T.border}`,marginBottom:10}}>
                  <img src={postImage} alt="Post" style={{width:"100%",display:"block",maxHeight:220,objectFit:"cover"}}/>
                  <button onClick={()=>setPostImage(null)} style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,0.7)",border:"none",color:"#fff",borderRadius:"50%",width:26,height:26,cursor:"pointer",fontSize:14}}>×</button>
                </div>
              ) : (
                <div style={{border:`1px dashed ${T.borderStrong}`,borderRadius:10,padding:22,textAlign:"center",marginBottom:10}}>
                  <p style={{fontSize:13,color:T.inkMid,marginBottom:12}}>No image selected</p>
                  <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                    <button onClick={generatePostImage} disabled={generatingPostImage} style={{padding:"7px 14px",borderRadius:7,background:T.accent,border:"none",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Space Grotesk',sans-serif"}}>{generatingPostImage?"Generating…":"✦ Generate image"}</button>
                    <label style={{padding:"7px 14px",borderRadius:7,background:T.bgStrong,border:`1px solid ${T.border}`,color:T.inkMid,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Space Grotesk',sans-serif"}}>
                      ↑ Upload
                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{display:"none"}}/>
                    </label>
                  </div>
                </div>
              )}
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setPostModal(null)} style={{flex:1,padding:"10px 0",borderRadius:8,background:T.bgStrong,border:`1px solid ${T.border}`,color:T.inkMid,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Space Grotesk',sans-serif"}}>Cancel</button>
              <button onClick={publishPost} disabled={publishing||!postCaption.trim()} style={{flex:2,padding:"10px 0",borderRadius:8,background:publishing||!postCaption.trim()?T.bgStrong:T.accent,border:"none",color:publishing||!postCaption.trim()?T.inkMuted:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Space Grotesk',sans-serif"}}>{publishing?"Publishing…":"Publish post"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── COPYWRITER ────────────────────────────────────────────────────────────────
function CopywriterView() {
  const [copyType, setCopyType]   = useState(COPY_TYPES[0]);
  const [topic, setTopic]         = useState("");
  const [tone, setTone]           = useState("Professional");
  const [brandVoice, setBrandVoice] = useState("");
  const [output, setOutput]       = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [copied, setCopied]       = useState(false);

  const generate = async () => {
    if (!topic.trim()) return;
    setOutput(""); setError(""); setLoading(true);
    try { await callClaude(`Expert marketing copywriter. Write compelling ${copyType.label}. Output ONLY the copy.`,`About: "${topic}". Tone: ${tone}.${brandVoice?` Voice: ${brandVoice}`:""}.`,c=>setOutput(c)); }
    catch(e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div>
      <div style={{marginBottom:28}}>
        <h2 style={{fontFamily:"Instrument Serif, serif",fontSize:30,fontWeight:400,color:T.ink,margin:0}}>Copywriter</h2>
        <p style={{fontSize:13,color:T.inkMid,marginTop:4}}>Generate on-brand marketing copy in seconds</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <Card style={{display:"flex",flexDirection:"column",gap:16}}>
          <div>
            <Label>Content type</Label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {COPY_TYPES.map(t=><button key={t.id} onClick={()=>setCopyType(t)} style={{padding:"9px 12px",borderRadius:8,background:copyType.id===t.id?T.accent:T.bgStrong,border:`1px solid ${copyType.id===t.id?T.accent:T.border}`,color:copyType.id===t.id?"#fff":T.inkMid,cursor:"pointer",fontSize:12,fontWeight:600,textAlign:"left",fontFamily:"'Space Grotesk',sans-serif"}}>{t.label}</button>)}
            </div>
          </div>
          <div><Label>What's it about?</Label><Textarea value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. Summer sale — 40% off all shoes this weekend"/></div>
          <div>
            <Label>Tone</Label>
            <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
              {TONES.map(t=><button key={t} onClick={()=>setTone(t)} style={{padding:"6px 13px",borderRadius:20,background:tone===t?T.accent:T.bgStrong,border:`1px solid ${tone===t?T.accent:T.border}`,color:tone===t?"#fff":T.inkMid,cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"'Space Grotesk',sans-serif"}}>{t}</button>)}
            </div>
          </div>
          <div><Label>Brand voice (optional)</Label><Input value={brandVoice} onChange={e=>setBrandVoice(e.target.value)} placeholder="e.g. friendly, boutique, fashion-forward"/></div>
          <Btn onClick={generate} disabled={loading||!topic.trim()}>{loading?"Writing…":"Generate"}</Btn>
        </Card>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <Label>Output</Label>
            {output && <button onClick={()=>{navigator.clipboard.writeText(output);setCopied(true);setTimeout(()=>setCopied(false),2000);}} style={{padding:"4px 11px",borderRadius:6,background:copied?T.greenSoft:T.bgStrong,border:`1px solid ${copied?T.green:T.border}`,color:copied?T.green:T.inkMid,cursor:"pointer",fontSize:12}}>{copied?"✓ Copied":"Copy"}</button>}
          </div>
          <Card style={{flex:1,minHeight:300,color:error?T.crimson:(output?T.ink:T.inkLight),fontSize:14,lineHeight:1.75,whiteSpace:"pre-wrap",display:"flex",alignItems:output||error?"flex-start":"center",justifyContent:output||error?"flex-start":"center"}}>
            {error||output||(loading?"Writing your copy…":"Your copy will appear here…")}
          </Card>
          {output && <Btn onClick={generate} variant="ghost">↻ Regenerate</Btn>}
        </div>
      </div>
    </div>
  );
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
function AnalyticsView({ user }) {
  const [insight, setInsight]           = useState("");
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError]               = useState("");
  const [stats, setStats]               = useState(null);
  const [history, setHistory]           = useState([]);

  useEffect(()=>{fetchStats();},[]);

  const fetchStats = async () => {
    setLoadingStats(true); setError("");
    try {
      const res  = await fetch(SERVER_URL+"/api/analytics/stats?username=Quill");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStats(data.impressions);
      setHistory(data.history?.history||[]);
    } catch(e) { setError("Could not load analytics: "+e.message); }
    setLoadingStats(false);
  };

  const analyze = async () => {
    setInsight(""); setLoadingInsight(true);
    try {
      const summary = stats?`Total impressions: ${stats.total_impressions||0}, Posts: ${history.length}`:"No data yet";
      await callClaude("Social media analyst. Be concise and actionable. Plain text.",`${summary}. Give 3-sentence insight + 1 recommendation.`,c=>setInsight(c));
    } catch(e) { setInsight("Could not generate insight."); }
    setLoadingInsight(false);
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:28}}>
        <div>
          <h2 style={{fontFamily:"Instrument Serif, serif",fontSize:30,fontWeight:400,color:T.ink,margin:0}}>Analytics</h2>
          <p style={{fontSize:13,color:T.inkMid,marginTop:4}}>Real performance data from your connected accounts</p>
        </div>
        <button onClick={fetchStats} disabled={loadingStats} style={{padding:"7px 14px",borderRadius:7,background:T.bgMuted,border:`1px solid ${T.border}`,color:T.inkMid,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Space Grotesk',sans-serif"}}>{loadingStats?"Loading…":"↻ Refresh"}</button>
      </div>

      {error && <div style={{background:T.crimsonSoft,border:`1px solid ${T.crimsonMid}`,borderRadius:8,padding:"10px 13px",fontSize:13,color:T.crimson,marginBottom:16}}>{error}</div>}

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
        {[
          {label:"Total impressions",val:stats?.total_impressions??0},
          {label:"Total posts",val:history.length},
          {label:"Successful posts",val:history.filter(p=>p.success).length},
          {label:"Platforms connected",val:1},
        ].map(s=>(
          <Card key={s.label} style={{textAlign:"center",padding:18}}>
            <div style={{fontSize:10,fontWeight:600,color:T.inkLight,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>{s.label}</div>
            <div style={{fontSize:26,fontWeight:700,color:T.ink,letterSpacing:"-0.5px"}}>{loadingStats?"…":s.val}</div>
          </Card>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:600,color:T.ink}}>Smart insight</div>
            <button onClick={analyze} disabled={loadingInsight} style={{padding:"5px 12px",borderRadius:7,fontSize:11,background:T.bgStrong,border:`1px solid ${T.border}`,color:T.inkMid,cursor:loadingInsight?"not-allowed":"pointer",fontFamily:"'Space Grotesk',sans-serif",fontWeight:600}}>{loadingInsight?"Thinking…":"Analyze"}</button>
          </div>
          <p style={{fontSize:13,color:T.inkMid,lineHeight:1.7,minHeight:80,margin:0}}>{insight||"Click Analyze to get insights on your performance."}</p>
        </Card>
        <Card>
          <div style={{fontSize:13,fontWeight:600,color:T.ink,marginBottom:12}}>Post success rate</div>
          {history.length===0 ? <p style={{fontSize:13,color:T.inkLight}}>No posts yet.</p> : (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:13,color:T.inkMid}}>Successful</span>
                <span style={{fontSize:13,fontWeight:700,color:T.green}}>{history.filter(p=>p.success).length}</span>
              </div>
              <div style={{height:5,background:T.bgStrong,borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",background:T.green,borderRadius:3,width:`${(history.filter(p=>p.success).length/history.length)*100}%`}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:13,color:T.inkMid}}>Failed</span>
                <span style={{fontSize:13,fontWeight:700,color:T.crimson}}>{history.filter(p=>!p.success).length}</span>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <div style={{fontSize:13,fontWeight:600,color:T.ink,marginBottom:14}}>Recent posts</div>
        {loadingStats ? <p style={{fontSize:13,color:T.inkMid}}>Loading…</p>
        : history.length===0 ? <p style={{fontSize:13,color:T.inkLight}}>No posts yet. Create a campaign to start publishing!</p>
        : (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {history.slice(0,5).map((post,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"11px 14px",background:T.bgStrong,borderRadius:9,border:`1px solid ${T.border}`}}>
                <div style={{width:26,height:26,borderRadius:6,background:post.success?T.greenSoft:T.crimsonSoft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,flexShrink:0,color:post.success?T.green:T.crimson}}>{post.success?"✓":"✕"}</div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:13,color:T.ink,margin:"0 0 2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{post.post_title||post.post_caption||"Post"}</p>
                  <span style={{fontSize:11,color:T.inkLight}}>{post.platform} · {post.upload_timestamp?new Date(post.upload_timestamp).toLocaleDateString():""}</span>
                </div>
                {post.post_url && <a href={post.post_url} target="_blank" rel="noreferrer" style={{fontSize:11,color:T.inkMid,textDecoration:"none",fontWeight:600,flexShrink:0,border:`1px solid ${T.border}`,padding:"3px 9px",borderRadius:6}}>View →</a>}
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
  const [images, setImages]           = useState([]);
  const [uploading, setUploading]     = useState(false);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState("");
  const [brandName, setBrandName]     = useState("");
  const [brandColors, setBrandColors] = useState("");
  const [brandVoice, setBrandVoice]   = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(()=>{fetchImages();fetchSettings();},[]);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const {data,error} = await supabase.storage.from("brand-kit").list(user.id+"/",{limit:20});
      if (error) throw error;
      setImages((data||[]).map(f=>({name:f.name,url:supabase.storage.from("brand-kit").getPublicUrl(user.id+"/"+f.name).data.publicUrl})));
    } catch(e) { setError("Could not load images."); }
    setLoading(false);
  };

  const fetchSettings = async () => {
    const {data} = await supabase.from("brand_settings").select("*").eq("user_id",user.id).single();
    if (data){setBrandName(data.brand_name||"");setBrandColors(data.brand_colors||"");setBrandVoice(data.brand_voice||"");}
  };

  const saveSettings = async () => {
    setSavingSettings(true); setError(""); setSuccess("");
    try {
      await supabase.from("brand_settings").upsert({user_id:user.id,brand_name:brandName,brand_colors:brandColors,brand_voice:brandVoice,updated_at:new Date().toISOString()});
      setSuccess("Brand settings saved!"); setTimeout(()=>setSuccess(""),3000);
    } catch(e) { setError("Could not save settings."); }
    setSavingSettings(false);
  };

  const uploadImage = async (e) => {
    const file=e.target.files[0]; if (!file) return;
    setUploading(true); setError(""); setSuccess("");
    try {
      const fileName=Date.now()+"_"+file.name.replace(/\s/g,"_");
      const {error}=await supabase.storage.from("brand-kit").upload(user.id+"/"+fileName,file,{contentType:file.type});
      if (error) throw error;
      setSuccess("Image uploaded!"); setTimeout(()=>setSuccess(""),3000);
      await fetchImages();
    } catch(e) { setError("Upload failed: "+e.message); }
    setUploading(false);
  };

  const deleteImage = async (name) => {
    await supabase.storage.from("brand-kit").remove([user.id+"/"+name]);
    await fetchImages();
  };

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <Card>
          <h3 style={{fontSize:15,fontWeight:700,color:T.ink,margin:"0 0 14px"}}>Brand settings</h3>
          {error   && <div style={{background:T.crimsonSoft,border:`1px solid ${T.crimsonMid}`,borderRadius:8,padding:"10px 13px",fontSize:13,color:T.crimson,marginBottom:12}}>{error}</div>}
          {success && <div style={{background:T.greenSoft,border:`1px solid ${T.green}33`,borderRadius:8,padding:"10px 13px",fontSize:13,color:T.green,marginBottom:12}}>{success}</div>}
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div><Label>Brand name</Label><Input value={brandName} onChange={e=>setBrandName(e.target.value)} placeholder="e.g. Luxe Boutique"/></div>
            <div><Label>Brand colors</Label><Input value={brandColors} onChange={e=>setBrandColors(e.target.value)} placeholder="e.g. blush pink, gold, cream"/></div>
            <div><Label>Brand voice</Label><Textarea value={brandVoice} onChange={e=>setBrandVoice(e.target.value)} placeholder="e.g. Feminine, elegant, speaks to fashion-forward women aged 25-45" height={80}/></div>
            <Btn onClick={saveSettings} disabled={savingSettings}>{savingSettings?"Saving…":"Save settings"}</Btn>
          </div>
        </Card>
        <Card>
          <h3 style={{fontSize:15,fontWeight:700,color:T.ink,margin:"0 0 10px"}}>Upload brand images</h3>
          <p style={{fontSize:13,color:T.inkMid,marginBottom:14,lineHeight:1.6}}>Upload your logo, product photos, or brand imagery to use in posts.</p>
          <label style={{display:"block",border:`1px dashed ${T.borderStrong}`,borderRadius:10,padding:"26px 20px",textAlign:"center",cursor:"pointer"}}>
            <div style={{fontSize:22,marginBottom:8,color:T.inkLight}}>↑</div>
            <div style={{fontSize:13,fontWeight:600,color:T.inkMid,marginBottom:3}}>{uploading?"Uploading…":"Click to upload image"}</div>
            <div style={{fontSize:12,color:T.inkLight}}>PNG, JPG, WEBP up to 10MB</div>
            <input type="file" accept="image/*" onChange={uploadImage} disabled={uploading} style={{display:"none"}}/>
          </label>
        </Card>
      </div>
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <h3 style={{fontSize:15,fontWeight:700,color:T.ink,margin:0}}>Your images</h3>
          <button onClick={fetchImages} style={{background:"none",border:"none",color:T.inkMid,cursor:"pointer",fontSize:12}}>↻ Refresh</button>
        </div>
        {loading ? <p style={{fontSize:13,color:T.inkMid}}>Loading…</p> : images.length===0 ? (
          <div style={{textAlign:"center",padding:"40px 20px"}}>
            <div style={{fontSize:30,opacity:0.2,marginBottom:10}}>🖼</div>
            <p style={{fontSize:13,color:T.inkLight}}>No images yet. Upload your logo or brand photos.</p>
          </div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {images.map((img,i)=>(
              <div key={i} style={{borderRadius:9,overflow:"hidden",border:`1px solid ${T.border}`}}>
                <img src={img.url} alt={img.name} style={{width:"100%",height:100,objectFit:"cover",display:"block"}}/>
                <div style={{background:T.bgStrong,padding:"7px 10px"}}>
                  <div style={{fontSize:11,color:T.inkMid,marginBottom:5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{img.name}</div>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>{navigator.clipboard.writeText(img.url);}} style={{flex:1,padding:"4px 0",borderRadius:6,background:T.bgMuted,border:`1px solid ${T.border}`,color:T.inkMid,fontSize:11,cursor:"pointer"}}>Copy URL</button>
                    <button onClick={()=>deleteImage(img.name)} style={{padding:"4px 9px",borderRadius:6,background:T.crimsonSoft,border:`1px solid ${T.crimsonMid}`,color:T.crimson,fontSize:11,cursor:"pointer"}}>✕</button>
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
  const [accounts, setAccounts]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");
  const uploadPostUsername          = user.id;

  useEffect(()=>{initProfile();},[]);

  const initProfile = async () => {
    setLoading(true);
    try {
      const res  = await fetch(SERVER_URL+"/api/social/accounts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:uploadPostUsername})});
      const data = await res.json();
      if (data.profile) setAccounts(data.profile.social_accounts||{});
      else { await fetch(SERVER_URL+"/api/social/create-profile",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:uploadPostUsername})}); setAccounts({}); }
    } catch(e) { setError("Could not load accounts."); }
    setLoading(false);
  };

  const connectAccounts = async () => {
    setConnecting(true); setError(""); setSuccess("");
    try {
      const res  = await fetch(SERVER_URL+"/api/social/connect-link",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:uploadPostUsername})});
      const data = await res.json();
      if (data.access_url) { setSuccess("Opening social media connection page…"); window.open(data.access_url,"_blank"); setTimeout(()=>initProfile(),5000); }
      else throw new Error(data.message||"Could not generate link");
    } catch(e) { setError("Could not generate connection link: "+e.message); }
    setConnecting(false);
  };

  const SOCIAL_PLATFORMS = [
    {id:"instagram",label:"Instagram",color:"#e1306c",icon:"◈"},
    {id:"facebook", label:"Facebook", color:"#1877F2",icon:"◉"},
    {id:"linkedin", label:"LinkedIn", color:"#0A66C2",icon:"◆"},
    {id:"twitter",  label:"X / Twitter",color:"#a1a1aa",icon:"◇"},
    {id:"tiktok",   label:"TikTok",   color:"#69C9D0",icon:"◐"},
  ];

  const isConnected = (id) => {
    if (!accounts) return false;
    const acc=accounts[id];
    return acc&&typeof acc==="object"&&(acc.handle||acc.display_name||acc.username);
  };

  return (
    <div>
      <div style={{marginBottom:28}}>
        <h2 style={{fontFamily:"Instrument Serif, serif",fontSize:30,fontWeight:400,color:T.ink,margin:0}}>Connected Accounts</h2>
        <p style={{fontSize:13,color:T.inkMid,marginTop:4}}>Link your social media accounts to publish directly from Quill</p>
      </div>
      {error   && <div style={{background:T.crimsonSoft,border:`1px solid ${T.crimsonMid}`,borderRadius:8,padding:"10px 13px",fontSize:13,color:T.crimson,marginBottom:14}}>{error}</div>}
      {success && <div style={{background:T.greenSoft,border:`1px solid ${T.green}33`,borderRadius:8,padding:"10px 13px",fontSize:13,color:T.green,marginBottom:14}}>{success}</div>}
      {loading ? <div style={{textAlign:"center",padding:60,color:T.inkMid}}>Loading…</div> : (
        <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10,marginBottom:20}}>
            {SOCIAL_PLATFORMS.map(platform=>{
              const connected  = isConnected(platform.id);
              const accountData = accounts?.[platform.id];
              return (
                <Card key={platform.id} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",border:`1px solid ${connected?T.borderBright:T.border}`}}>
                  <div style={{width:38,height:38,borderRadius:9,background:platform.color+"18",border:`1px solid ${platform.color}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:platform.color,flexShrink:0}}>{platform.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:T.ink,marginBottom:2}}>{platform.label}</div>
                    {connected
                      ? <div style={{fontSize:12,color:T.green}}>✓ Connected{accountData?.display_name?` as @${accountData.display_name}`:accountData?.handle?` as @${accountData.handle}`:""}</div>
                      : <div style={{fontSize:12,color:T.inkMid}}>Not connected</div>
                    }
                  </div>
                  <div style={{width:7,height:7,borderRadius:"50%",background:connected?T.green:T.bgStrong,flexShrink:0}}/>
                </Card>
              );
            })}
          </div>
          <Card style={{textAlign:"center",padding:"36px 28px"}}>
            <h3 style={{fontSize:16,fontWeight:700,color:T.ink,margin:"0 0 8px"}}>Connect your social accounts</h3>
            <p style={{fontSize:13,color:T.inkMid,maxWidth:360,margin:"0 auto 22px",lineHeight:1.65}}>Connect Instagram, Facebook, LinkedIn, X, and TikTok in one place. The link expires in 48 hours.</p>
            <button onClick={connectAccounts} disabled={connecting} style={{padding:"11px 26px",borderRadius:8,background:connecting?T.bgStrong:T.accent,border:"none",color:connecting?T.inkMuted:"#fff",fontSize:13,fontWeight:700,cursor:connecting?"not-allowed":"pointer",fontFamily:"'Space Grotesk',sans-serif"}}>{connecting?"Generating link…":"Connect social accounts"}</button>
          </Card>
          <div style={{marginTop:10}}>
            <button onClick={initProfile} style={{background:"none",border:"none",color:T.inkMid,cursor:"pointer",fontSize:12,textDecoration:"underline"}}>↻ Refresh connection status</button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── BILLING ──────────────────────────────────────────────────────────────────
function BillingView({ user }) {
  const [currentPlan, setCurrentPlan] = useState("free");
  const [billing, setBilling]         = useState("monthly");
  const [loading, setLoading]         = useState(true);
  const [checkingOut, setCheckingOut] = useState(null);
  const [message, setMessage]         = useState("");

  useEffect(()=>{
    checkStatus();
    const p=new URLSearchParams(window.location.search);
    if (p.get("payment")==="success")    {setMessage("Payment successful! Your plan has been upgraded.");window.history.replaceState({},"/","/");}
    else if (p.get("payment")==="cancelled"){setMessage("Payment cancelled. No charge was made.");window.history.replaceState({},"/","/");}
  },[]);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const res=await fetch(SERVER_URL+"/api/stripe/status",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userEmail:user.email})});
      const data=await res.json();
      setCurrentPlan(data.plan||"free");
    } catch { setCurrentPlan("free"); }
    setLoading(false);
  };

  const checkout = async (plan) => {
    setCheckingOut(plan.id);
    try {
      const priceId=billing==="annual"?plan.annualPriceId:plan.monthlyPriceId;
      const res=await fetch(SERVER_URL+"/api/stripe/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({priceId,userId:user.id,userEmail:user.email,plan:plan.id})});
      const data=await res.json();
      if (data.error) throw new Error(data.error);
      window.location.href=data.url;
    } catch(e) { setMessage("Checkout failed: "+e.message); }
    setCheckingOut(null);
  };

  return (
    <div>
      <div style={{marginBottom:28}}>
        <h2 style={{fontFamily:"Instrument Serif, serif",fontSize:30,fontWeight:400,color:T.ink,margin:0}}>Billing</h2>
        <p style={{fontSize:13,color:T.inkMid,marginTop:4}}>Choose the plan that fits your business</p>
      </div>

      {message && <div style={{background:message.includes("successful")?T.greenSoft:T.crimsonSoft,border:`1px solid ${message.includes("successful")?T.green:T.crimson}44`,borderRadius:8,padding:"12px 16px",fontSize:13,color:message.includes("successful")?T.green:T.crimson,marginBottom:22}}>{message}</div>}

      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:36}}>
        {["monthly","annual"].map(b=>(
          <button key={b} onClick={()=>setBilling(b)} style={{padding:"8px 20px",borderRadius:8,background:billing===b?T.accent:T.bgMuted,border:`1px solid ${billing===b?T.accent:T.border}`,color:billing===b?"#fff":T.inkMid,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Space Grotesk',sans-serif",display:"flex",alignItems:"center",gap:7}}>
            {b==="monthly"?"Monthly":"Annual"}
            {b==="annual" && <span style={{fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:20,background:T.greenSoft,color:T.green}}>SAVE 20%</span>}
          </button>
        ))}
      </div>

      {loading ? <div style={{textAlign:"center",padding:60,color:T.inkMid}}>Checking your plan…</div> : (
        <>
          {currentPlan!=="free" && (
            <div style={{background:T.greenSoft,border:`1px solid ${T.green}33`,borderRadius:10,padding:"13px 18px",marginBottom:22,display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:16,color:T.green}}>✓</span>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:T.green}}>Active plan: {currentPlan.charAt(0).toUpperCase()+currentPlan.slice(1)}</div>
                <div style={{fontSize:12,color:T.inkMid}}>Renews {billing==="annual"?"annually":"monthly"}</div>
              </div>
            </div>
          )}

          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:20}}>
            {PLANS.filter(p=>p.id!=="trial").map(plan=>{
              const price  = billing==="annual"?plan.annualPrice:plan.monthlyPrice;
              const period = billing==="annual"?"/yr":"/mo";
              return (
                <div key={plan.id} style={{background:plan.popular?T.bgStrong:T.bgMuted,borderRadius:14,border:`1px solid ${plan.popular?T.borderBright:T.border}`,padding:24,display:"flex",flexDirection:"column",gap:14,position:"relative"}}>
                  {plan.popular && <div style={{position:"absolute",top:-11,left:"50%",transform:"translateX(-50%)",background:T.accent,color:"#fff",fontSize:9,fontWeight:800,padding:"3px 12px",borderRadius:20,letterSpacing:"0.1em",whiteSpace:"nowrap"}}>MOST POPULAR</div>}
                  <div>
                    <div style={{fontSize:16,fontWeight:700,color:T.ink,marginBottom:3}}>{plan.name}</div>
                    <div style={{fontSize:12,color:T.inkMid}}>{plan.description}</div>
                  </div>
                  <div>
                    <div style={{fontSize:34,fontWeight:800,color:T.ink,letterSpacing:"-1.5px",lineHeight:1}}>${price}<span style={{fontSize:13,fontWeight:400,color:T.inkMid}}>{period}</span></div>
                    {billing==="annual" && <div style={{fontSize:12,color:T.green,marginTop:4}}>Save ${(plan.monthlyPrice*12-plan.annualPrice)}/yr</div>}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8,flex:1}}>
                    {plan.features.map((f,i)=>(
                      <div key={i} style={{display:"flex",gap:9,alignItems:"flex-start"}}>
                        <span style={{color:T.inkMid,flexShrink:0,fontSize:12,marginTop:1}}>✓</span>
                        <span style={{fontSize:12,color:T.inkMid,lineHeight:1.5}}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={()=>currentPlan!==plan.id&&checkout(plan)} disabled={checkingOut===plan.id||currentPlan===plan.id} style={{padding:"10px 0",borderRadius:8,background:currentPlan===plan.id?T.greenSoft:plan.popular?T.accent:T.bgHover,border:currentPlan===plan.id?`1px solid ${T.green}`:plan.popular?"none":`1px solid ${T.borderStrong}`,color:currentPlan===plan.id?T.green:plan.popular?"#fff":T.inkSoft,fontSize:13,fontWeight:600,cursor:currentPlan===plan.id?"default":"pointer",fontFamily:"'Space Grotesk',sans-serif",transition:"all 0.15s"}}>
                    {checkingOut===plan.id?"Redirecting…":currentPlan===plan.id?"✓ Current plan":"Start 7-day free trial"}
                  </button>
                </div>
              );
            })}
          </div>
          <p style={{textAlign:"center",fontSize:12,color:T.inkLight}}>All plans include a 7-day free trial. Cancel anytime. No hidden fees.</p>
        </>
      )}
    </div>
  );
}

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
const NAV = [
  {id:"campaigns", label:"Campaigns", icon:"✦"},
  {id:"copy",      label:"Copywriter",icon:"✎"},
  {id:"analytics", label:"Analytics", icon:"◎"},
  {id:"accounts",  label:"Accounts",  icon:"◈"},
  {id:"billing",   label:"Billing",   icon:"◇"},
];

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]         = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [active, setActive]     = useState("campaigns");
  const [authMode, setAuthMode] = useState("login");
  const [showAuth, setShowAuth] = useState(false);

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{setUser(session?.user??null);setLoadingAuth(false);});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{setUser(session?.user??null);});
    return ()=>subscription.unsubscribe();
  },[]);

  const signOut = async () => { await supabase.auth.signOut(); setUser(null); setShowAuth(false); };

  if (loadingAuth) return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Space Grotesk',sans-serif"}}>
      <div style={{textAlign:"center"}}>
        <QuillLogo size={36}/>
        <p style={{marginTop:14,color:T.inkMid,fontSize:13}}>Loading…</p>
      </div>
    </div>
  );

  if (!user&&!showAuth) return <LandingPage onSignup={()=>{setAuthMode("signup");setShowAuth(true);}} onLogin={()=>{setAuthMode("login");setShowAuth(true);}}/>;
  if (!user&&showAuth)  return <AuthScreen onAuth={setUser} initialMode={authMode}/>;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Space+Grotesk:wght@400;500;600&family=Space+Mono&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #14110D; font-family: 'Space Grotesk', sans-serif; }
        input, textarea, select { color-scheme: dark; }
        input::placeholder, textarea::placeholder { color: #574F44; }
        input[type="time"]::-webkit-calendar-picker-indicator { filter: invert(0.6); }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(242,234,219,.18); border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(242,234,219,.3); }
        button { transition: opacity 0.12s, background 0.12s, border-color 0.12s, transform 0.15s, box-shadow 0.15s; }
        button:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
        a { color: inherit; }
        input:focus, textarea:focus { border-color: rgba(255,91,46,.55) !important; box-shadow: 0 0 0 3px rgba(255,91,46,.12); }
        .q-card { transition: border-color .2s, transform .2s, box-shadow .2s; }
        .q-card:hover { border-color: rgba(255,91,46,.3) !important; transform: translateY(-2px); box-shadow: 0 12px 30px rgba(0,0,0,.35); }
        .q-view { animation: viewIn .4s cubic-bezier(.2,.7,.2,1); }
        @keyframes viewIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
      `}</style>

      <div style={{display:"flex",minHeight:"100vh",background:T.bg}}>

        {/* ── SIDEBAR ── */}
        <aside style={{
          width: 216,
          minHeight: "100vh",
          background: T.bgSoft,
          borderRight: `1px solid ${T.border}`,
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          flexShrink: 0,
        }}>
          {/* Logo */}
          <div style={{padding:"22px 18px 18px"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <QuillLogo size={30}/>
              <div>
                <div style={{fontFamily:"Instrument Serif, serif",fontSize:19,fontWeight:400,color:T.ink,lineHeight:1}}>Quill</div>
                <div style={{fontSize:10,color:T.inkLight,letterSpacing:"0.08em",textTransform:"uppercase",marginTop:2,fontWeight:500}}>Marketing Agent</div>
              </div>
            </div>
          </div>

          <Divider/>

          {/* Nav items */}
          <nav style={{flex:1,padding:"10px 8px"}}>
            {NAV.map(item=>(
              <button key={item.id} onClick={()=>setActive(item.id)} style={{
                width:"100%",
                padding:"9px 11px",
                marginBottom:1,
                display:"flex",
                alignItems:"center",
                gap:10,
                background: active===item.id ? T.bgStrong : "transparent",
                border: "none",
                borderRadius:8,
                cursor:"pointer",
                position:"relative",
                overflow:"hidden",
              }}>
                {active===item.id && <div style={{position:"absolute",left:0,top:"20%",bottom:"20%",width:2,background:T.accent,borderRadius:"0 2px 2px 0"}}/>}
                <span style={{fontSize:13,color:active===item.id?T.inkSoft:T.inkLight,marginLeft:active===item.id?4:6,transition:"all 0.12s"}}>{item.icon}</span>
                <span style={{fontSize:13,fontWeight:active===item.id?600:400,color:active===item.id?T.ink:T.inkMid,fontFamily:"'Space Grotesk',sans-serif",letterSpacing:"-0.1px"}}>{item.label}</span>
              </button>
            ))}
          </nav>

          <Divider/>

          {/* User area */}
          <div style={{padding:"12px 10px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 11px",background:T.bgStrong,borderRadius:9,border:`1px solid ${T.border}`}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:T.bgMuted,border:`1px solid ${T.borderBright}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:T.inkSoft,fontWeight:700,flexShrink:0}}>
                {user.email?.[0]?.toUpperCase()||"U"}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,color:T.ink,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.user_metadata?.full_name||"User"}</div>
                <div style={{fontSize:10,color:T.inkLight,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.email}</div>
              </div>
            </div>
            <button onClick={signOut} style={{width:"100%",marginTop:8,padding:"7px 0",borderRadius:7,background:"transparent",border:`1px solid ${T.border}`,color:T.inkMid,fontSize:11,fontWeight:500,cursor:"pointer",fontFamily:"'Space Grotesk',sans-serif"}}>Sign out</button>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main style={{flex:1,overflow:"auto",background:T.bg}}>
          <div key={active} className="q-view" style={{maxWidth:1060,margin:"0 auto",padding:"38px 34px"}}>
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
