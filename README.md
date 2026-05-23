<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>CityPramaan — Proof of Repair for Accountable Cities</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@400;500&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet"/>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --ink:#0b1120;
    --ink2:#101828;
    --teal:#00d4aa;
    --teal-dim:#00a880;
    --teal-glow:rgba(0,212,170,0.18);
    --blue:#3b82f6;
    --blue-glow:rgba(59,130,246,0.15);
    --amber:#f59e0b;
    --red:#ef4444;
    --surface:#131f35;
    --surface2:#1a2840;
    --border:rgba(0,212,170,0.14);
    --border2:rgba(255,255,255,0.07);
    --text:#e2e8f0;
    --muted:#7a92ad;
    --font-display:'Syne',sans-serif;
    --font-body:'Inter',sans-serif;
    --font-mono:'DM Mono',monospace;
  }
  html{scroll-behavior:smooth}
  body{
    background:var(--ink);
    color:var(--text);
    font-family:var(--font-body);
    line-height:1.7;
    overflow-x:hidden;
  }

  /* ── CANVAS GRID BG ── */
  #grid-canvas{position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.35}

  /* ── NAV ── */
  nav{
    position:fixed;top:0;left:0;right:0;z-index:100;
    padding:1rem 2rem;
    display:flex;align-items:center;justify-content:space-between;
    background:rgba(11,17,32,0.85);
    backdrop-filter:blur(16px);
    border-bottom:1px solid var(--border);
  }
  .nav-logo{
    font-family:var(--font-display);font-weight:800;font-size:1.1rem;
    color:var(--teal);letter-spacing:-.01em;
  }
  .nav-logo span{color:var(--text);font-weight:400}
  .nav-links{display:flex;gap:1.8rem}
  .nav-links a{
    font-size:.82rem;letter-spacing:.06em;text-transform:uppercase;
    color:var(--muted);text-decoration:none;transition:color .2s;
  }
  .nav-links a:hover{color:var(--teal)}
  .nav-badge{
    font-size:.75rem;font-family:var(--font-mono);
    padding:.35rem .8rem;border-radius:6px;
    background:var(--teal-glow);border:1px solid var(--teal);
    color:var(--teal);letter-spacing:.04em;
  }

  /* ── SECTIONS ── */
  section{position:relative;z-index:1}
  .container{max-width:1100px;margin:0 auto;padding:0 2rem}

  /* ── HERO ── */
  .hero{
    min-height:100vh;display:flex;align-items:center;
    padding-top:6rem;
    background:radial-gradient(ellipse 70% 60% at 50% -10%,rgba(0,212,170,.07) 0%,transparent 60%);
  }
  .hero-inner{text-align:center;max-width:860px;margin:0 auto}
  .hero-eyebrow{
    display:inline-flex;align-items:center;gap:.6rem;
    font-family:var(--font-mono);font-size:.78rem;letter-spacing:.1em;
    color:var(--teal);padding:.45rem 1rem;
    border:1px solid var(--border);border-radius:50px;
    background:var(--teal-glow);margin-bottom:2rem;
    animation:fadeUp .8s ease both;
  }
  .dot{width:7px;height:7px;border-radius:50%;background:var(--teal);animation:pulse 2s infinite}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}
  .hero h1{
    font-family:var(--font-display);font-weight:800;
    font-size:clamp(2.8rem,7vw,5.2rem);
    line-height:1.07;letter-spacing:-.03em;
    animation:fadeUp .9s .1s ease both;
  }
  .hero h1 .grd{
    background:linear-gradient(135deg,var(--teal) 0%,#60a5fa 100%);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  }
  .hero-sub{
    margin:1.6rem auto 2.4rem;max-width:640px;
    font-size:1.12rem;color:var(--muted);line-height:1.75;
    animation:fadeUp 1s .2s ease both;
  }
  .hero-actions{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;animation:fadeUp 1s .3s ease both}
  .btn{
    display:inline-flex;align-items:center;gap:.5rem;
    font-size:.9rem;font-weight:500;text-decoration:none;
    padding:.8rem 1.8rem;border-radius:10px;transition:all .25s;
  }
  .btn-primary{background:var(--teal);color:#050e1a;border:none}
  .btn-primary:hover{background:#00f0c3;transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,212,170,.35)}
  .btn-outline{background:transparent;color:var(--teal);border:1px solid var(--border)}
  .btn-outline:hover{background:var(--teal-glow);transform:translateY(-2px)}
  .hero-scroll{
    margin-top:4rem;display:flex;flex-direction:column;align-items:center;gap:.5rem;
    color:var(--muted);font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;
    animation:fadeUp 1s .5s ease both;
  }
  .scroll-line{width:1px;height:48px;background:linear-gradient(to bottom,var(--teal),transparent);animation:scrollAnim 2s infinite}
  @keyframes scrollAnim{0%{transform:scaleY(0);transform-origin:top}50%{transform:scaleY(1);transform-origin:top}100%{transform:scaleY(0);transform-origin:bottom}}

  /* ── STATS STRIP ── */
  .stats-strip{
    border-top:1px solid var(--border2);border-bottom:1px solid var(--border2);
    padding:2.5rem 0;background:var(--surface);
  }
  .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:0}
  .stat-item{
    text-align:center;padding:0 1.5rem;
    border-right:1px solid var(--border2);
  }
  .stat-item:last-child{border-right:none}
  .stat-num{
    font-family:var(--font-display);font-size:2.4rem;font-weight:800;
    color:var(--teal);letter-spacing:-.03em;line-height:1;
  }
  .stat-label{font-size:.8rem;color:var(--muted);margin-top:.4rem;text-transform:uppercase;letter-spacing:.06em}

  /* ── SECTION HEADER ── */
  .sec-header{text-align:center;margin-bottom:4rem}
  .sec-eyebrow{
    font-family:var(--font-mono);font-size:.75rem;letter-spacing:.14em;
    text-transform:uppercase;color:var(--teal);margin-bottom:.9rem;display:block;
  }
  .sec-header h2{
    font-family:var(--font-display);font-weight:700;
    font-size:clamp(1.8rem,4vw,2.8rem);letter-spacing:-.02em;
  }
  .sec-header p{color:var(--muted);max-width:560px;margin:.8rem auto 0;font-size:1rem}

  /* ── PROBLEM ── */
  .problem{padding:6rem 0}
  .problem-grid{display:grid;grid-template-columns:1fr 1fr;gap:2rem;align-items:center}
  .problem-card{
    background:var(--surface);border:1px solid var(--border2);border-radius:16px;
    padding:2.2rem;position:relative;overflow:hidden;
  }
  .problem-card::before{
    content:'';position:absolute;inset:-1px;border-radius:16px;
    background:linear-gradient(135deg,rgba(0,212,170,.12),transparent);
    pointer-events:none;
  }
  .problem-card h3{
    font-family:var(--font-display);font-weight:700;font-size:1.3rem;
    margin-bottom:1rem;
  }
  .problem-card p{color:var(--muted);font-size:.95rem;line-height:1.8}
  .issue-list{list-style:none;margin-top:1.2rem;display:flex;flex-direction:column;gap:.6rem}
  .issue-list li{
    display:flex;align-items:center;gap:.8rem;
    font-size:.9rem;padding:.6rem .9rem;
    background:rgba(255,255,255,.03);border-radius:8px;
    border-left:3px solid var(--red);
  }
  .issue-list li::before{content:'⚠';font-size:.85rem}
  .sol-list{list-style:none;margin-top:1.2rem;display:flex;flex-direction:column;gap:.6rem}
  .sol-list li{
    display:flex;align-items:center;gap:.8rem;
    font-size:.9rem;padding:.6rem .9rem;
    background:rgba(0,212,170,.05);border-radius:8px;
    border-left:3px solid var(--teal);
  }
  .sol-list li::before{content:'✓';color:var(--teal);font-weight:700;font-size:.9rem}

  /* ── FEATURES ── */
  .features{padding:6rem 0;background:var(--surface)}
  .features-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.4rem}
  .feat-card{
    background:var(--ink2);border:1px solid var(--border2);
    border-radius:14px;padding:1.8rem;
    transition:all .3s;position:relative;overflow:hidden;
    cursor:default;
  }
  .feat-card::after{
    content:'';position:absolute;inset:0;
    background:radial-gradient(circle at 0 0,var(--teal-glow),transparent 60%);
    opacity:0;transition:opacity .3s;
  }
  .feat-card:hover{border-color:var(--border);transform:translateY(-4px);box-shadow:0 12px 40px rgba(0,0,0,.4)}
  .feat-card:hover::after{opacity:1}
  .feat-icon{
    width:44px;height:44px;border-radius:10px;
    background:var(--teal-glow);border:1px solid var(--border);
    display:flex;align-items:center;justify-content:center;
    font-size:1.2rem;margin-bottom:1.2rem;position:relative;z-index:1;
  }
  .feat-card h3{font-family:var(--font-display);font-weight:700;font-size:1.05rem;margin-bottom:.7rem;position:relative;z-index:1}
  .feat-card p{color:var(--muted);font-size:.88rem;line-height:1.75;position:relative;z-index:1}
  .feat-tag{
    display:inline-block;margin-top:.9rem;
    font-family:var(--font-mono);font-size:.7rem;letter-spacing:.06em;
    padding:.25rem .65rem;border-radius:5px;position:relative;z-index:1;
  }
  .tag-ai{background:rgba(59,130,246,.12);color:#93c5fd;border:1px solid rgba(59,130,246,.2)}
  .tag-web3{background:rgba(245,158,11,.1);color:#fcd34d;border:1px solid rgba(245,158,11,.2)}
  .tag-civic{background:var(--teal-glow);color:var(--teal);border:1px solid var(--border)}

  /* ── TIMELINE ── */
  .timeline{padding:6rem 0}
  .tl-track{position:relative;max-width:760px;margin:0 auto}
  .tl-line{
    position:absolute;left:50%;top:0;bottom:0;width:1px;
    background:linear-gradient(to bottom,transparent,var(--teal),var(--blue),transparent);
    transform:translateX(-50%);
  }
  .tl-step{
    display:flex;align-items:flex-start;gap:2rem;margin-bottom:2.5rem;
    position:relative;
  }
  .tl-step:nth-child(even){flex-direction:row-reverse;text-align:right}
  .tl-content{
    flex:1;background:var(--surface);border:1px solid var(--border2);
    border-radius:12px;padding:1.4rem 1.6rem;
    transition:border-color .3s,transform .3s;
  }
  .tl-content:hover{border-color:var(--border);transform:scale(1.01)}
  .tl-node{
    position:absolute;left:50%;transform:translateX(-50%);
    width:36px;height:36px;border-radius:50%;
    background:var(--ink2);border:2px solid var(--teal);
    display:flex;align-items:center;justify-content:center;
    font-family:var(--font-mono);font-size:.75rem;color:var(--teal);
    font-weight:500;z-index:2;flex-shrink:0;
  }
  .tl-content h4{font-family:var(--font-display);font-weight:700;font-size:.95rem;margin-bottom:.4rem}
  .tl-content p{font-size:.85rem;color:var(--muted)}

  /* ── ARCHITECTURE ── */
  .arch{padding:6rem 0;background:var(--surface)}
  .arch-diagram{
    background:var(--ink);border:1px solid var(--border2);
    border-radius:16px;padding:2.5rem;overflow:hidden;position:relative;
  }
  .arch-layer{
    display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;
    margin-bottom:1rem;
  }
  .arch-box{
    padding:.7rem 1.2rem;border-radius:8px;font-size:.8rem;
    font-family:var(--font-mono);text-align:center;
    border:1px solid;white-space:nowrap;
    transition:all .25s;cursor:default;
  }
  .arch-box:hover{transform:translateY(-3px);box-shadow:0 6px 20px rgba(0,0,0,.4)}
  .layer-users .arch-box{background:rgba(59,130,246,.1);border-color:rgba(59,130,246,.25);color:#93c5fd}
  .layer-app .arch-box{background:rgba(0,212,170,.08);border-color:var(--border);color:var(--teal)}
  .layer-ai .arch-box{background:rgba(245,158,11,.08);border-color:rgba(245,158,11,.2);color:#fcd34d}
  .layer-storage .arch-box{background:rgba(139,92,246,.09);border-color:rgba(139,92,246,.2);color:#c4b5fd}
  .layer-chain .arch-box{background:rgba(239,68,68,.08);border-color:rgba(239,68,68,.18);color:#fca5a5}
  .arch-arrow{
    text-align:center;color:var(--muted);font-size:.8rem;
    display:flex;align-items:center;justify-content:center;gap:.5rem;margin:.4rem 0;
  }
  .arrow-line{width:1px;height:20px;background:var(--border);display:inline-block}
  .arch-layer-label{
    text-align:center;font-family:var(--font-mono);font-size:.68rem;
    letter-spacing:.1em;color:var(--muted);text-transform:uppercase;margin-bottom:.5rem;
  }

  /* ── COMPARE ── */
  .compare{padding:6rem 0}
  .compare-table{width:100%;border-collapse:collapse;border-radius:12px;overflow:hidden}
  .compare-table th{
    font-family:var(--font-mono);font-size:.78rem;letter-spacing:.08em;
    text-transform:uppercase;padding:1rem 1.4rem;
    text-align:left;border-bottom:1px solid var(--border2);
  }
  .compare-table th:first-child{color:var(--muted);background:var(--surface)}
  .compare-table th.col-old{background:rgba(239,68,68,.06);color:#fca5a5}
  .compare-table th.col-new{background:var(--teal-glow);color:var(--teal)}
  .compare-table td{
    padding:.85rem 1.4rem;font-size:.9rem;
    border-bottom:1px solid var(--border2);
    background:var(--surface);
  }
  .compare-table td:first-child{color:var(--muted);font-size:.85rem}
  .compare-table td.col-old{color:#fca5a5;background:rgba(239,68,68,.03)}
  .compare-table td.col-new{color:#6ee7b7;background:rgba(0,212,170,.03)}
  .x-icon{color:#ef4444}
  .check-icon{color:var(--teal)}

  /* ── TECH STACK ── */
  .techstack{padding:6rem 0;background:var(--surface)}
  .stack-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:1rem}
  .stack-cat{
    background:var(--ink2);border:1px solid var(--border2);
    border-radius:12px;padding:1.4rem;
  }
  .stack-cat-label{
    font-family:var(--font-mono);font-size:.7rem;letter-spacing:.1em;
    text-transform:uppercase;color:var(--teal);margin-bottom:.9rem;
  }
  .stack-cat h4{font-family:var(--font-display);font-weight:700;font-size:.85rem;margin-bottom:.7rem}
  .stack-pills{display:flex;flex-wrap:wrap;gap:.4rem}
  .pill{
    font-size:.72rem;font-family:var(--font-mono);
    padding:.25rem .55rem;border-radius:5px;
    background:rgba(255,255,255,.05);
    border:1px solid var(--border2);color:var(--muted);
    transition:all .2s;
  }
  .pill:hover{background:var(--teal-glow);border-color:var(--border);color:var(--teal)}

  /* ── CONTRACT ── */
  .contract{padding:6rem 0}
  .code-block{
    background:#060e1c;border:1px solid var(--border2);
    border-radius:14px;overflow:hidden;
  }
  .code-topbar{
    display:flex;align-items:center;gap:.8rem;padding:.9rem 1.3rem;
    background:var(--surface2);border-bottom:1px solid var(--border2);
  }
  .dot-row{display:flex;gap:.4rem}
  .dot-btn{width:11px;height:11px;border-radius:50%}
  .dot-btn:nth-child(1){background:#ff5f56}
  .dot-btn:nth-child(2){background:#ffbd2e}
  .dot-btn:nth-child(3){background:#27c93f}
  .code-file{font-family:var(--font-mono);font-size:.75rem;color:var(--muted);letter-spacing:.04em;margin-left:auto}
  .code-body{
    padding:1.8rem 2rem;font-family:var(--font-mono);font-size:.84rem;
    line-height:1.9;overflow-x:auto;
  }
  .kw{color:#c792ea}
  .type{color:#82aaff}
  .str{color:#c3e88d}
  .prop{color:#89ddff}
  .val{color:#f78c6c}
  .cmt{color:#546e7a;font-style:italic}

  /* ── STATUS BADGES ── */
  .status-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-top:2.5rem}
  .status-badge{
    display:flex;align-items:center;gap:.7rem;
    background:var(--surface);border:1px solid var(--border2);
    border-radius:9px;padding:.8rem 1rem;font-size:.82rem;font-family:var(--font-mono);
    transition:all .25s;
  }
  .status-badge:hover{border-color:var(--border);background:var(--surface2)}
  .sbdot{width:8px;height:8px;border-radius:50%;flex-shrink:0}

  /* ── IMPACT ── */
  .impact{padding:6rem 0;background:var(--surface)}
  .impact-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1.2rem}
  .impact-card{
    background:var(--ink2);border:1px solid var(--border2);
    border-radius:14px;padding:1.6rem;text-align:center;
    transition:all .3s;
  }
  .impact-card:hover{border-color:var(--border);transform:translateY(-4px)}
  .impact-icon{font-size:2rem;margin-bottom:.9rem}
  .impact-card h4{font-family:var(--font-display);font-weight:700;font-size:.95rem;margin-bottom:.5rem}
  .impact-card p{font-size:.82rem;color:var(--muted)}

  /* ── INSTALL ── */
  .install{padding:6rem 0}
  .install-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:1.4rem}
  .install-step{
    background:var(--surface);border:1px solid var(--border2);
    border-radius:14px;padding:1.8rem;
  }
  .step-num{
    width:32px;height:32px;border-radius:8px;
    background:var(--teal-glow);border:1px solid var(--border);
    display:flex;align-items:center;justify-content:center;
    font-family:var(--font-mono);font-size:.8rem;color:var(--teal);
    margin-bottom:1rem;
  }
  .install-step h4{font-family:var(--font-display);font-weight:700;font-size:.95rem;margin-bottom:.8rem}
  .cmd{
    background:#060e1c;border:1px solid var(--border2);
    border-radius:7px;padding:.6rem .9rem;margin:.35rem 0;
    font-family:var(--font-mono);font-size:.78rem;
    color:var(--teal);display:flex;align-items:center;gap:.5rem;
  }
  .cmd::before{content:'$';color:var(--muted);flex-shrink:0}

  /* ── CTA ── */
  .cta{
    padding:7rem 0;text-align:center;
    background:radial-gradient(ellipse 80% 60% at 50% 100%,rgba(0,212,170,.06) 0%,transparent 60%);
  }
  .cta h2{
    font-family:var(--font-display);font-weight:800;
    font-size:clamp(2rem,5vw,3.5rem);letter-spacing:-.03em;
    margin-bottom:1.2rem;
  }
  .cta p{color:var(--muted);max-width:520px;margin:0 auto 2.5rem;font-size:1rem}
  .cta-buttons{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap}

  /* ── FOOTER ── */
  footer{
    border-top:1px solid var(--border2);
    padding:2rem;text-align:center;
    font-size:.82rem;color:var(--muted);
  }
  footer a{color:var(--teal);text-decoration:none}

  /* ── ANIMATIONS ── */
  @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
  .reveal{opacity:0;transform:translateY(28px);transition:opacity .65s ease,transform .65s ease}
  .reveal.visible{opacity:1;transform:translateY(0)}

  /* ── BLOCKCHAIN ANIM ── */
  .chain-anim{
    display:flex;align-items:center;justify-content:center;
    gap:0;margin:2rem 0;overflow:hidden;
  }
  .chain-block{
    width:90px;height:60px;border-radius:8px;
    border:1px solid var(--border);
    background:var(--surface2);
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    font-family:var(--font-mono);font-size:.6rem;color:var(--muted);
    position:relative;animation:blockGlow 3s infinite;flex-shrink:0;
  }
  .chain-block:nth-child(odd){animation-delay:.5s}
  .chain-block:nth-child(3){border-color:var(--teal);color:var(--teal);background:var(--teal-glow)}
  .chain-hash{font-size:.55rem;margin-top:.2rem;color:var(--blue);opacity:.7}
  .chain-link{
    width:32px;height:2px;background:linear-gradient(90deg,var(--border),var(--teal),var(--border));
    position:relative;flex-shrink:0;
  }
  .chain-link::after{
    content:'';position:absolute;width:8px;height:8px;
    background:var(--teal);border-radius:50%;top:50%;
    transform:translateY(-50%);
    animation:linkPulse 2s infinite;opacity:.7;
  }
  @keyframes blockGlow{0%,100%{box-shadow:0 0 0 0 transparent}50%{box-shadow:0 0 12px rgba(0,212,170,.12)}}
  @keyframes linkPulse{0%{left:-4px;opacity:0}50%{opacity:1}100%{left:calc(100% - 4px);opacity:0}}

  /* ── SCROLLING MARQUEE ── */
  .marquee-wrap{overflow:hidden;border-top:1px solid var(--border2);border-bottom:1px solid var(--border2);padding:.8rem 0;background:var(--surface2)}
  .marquee-track{display:flex;gap:2.5rem;animation:marquee 22s linear infinite;width:max-content}
  .marquee-item{
    display:flex;align-items:center;gap:.6rem;
    font-family:var(--font-mono);font-size:.75rem;color:var(--muted);white-space:nowrap;
  }
  .marquee-item::before{content:'◈';color:var(--teal);font-size:.6rem}
  @keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}

  @media(max-width:768px){
    .stats-grid,.features-grid,.stack-grid,.impact-grid{grid-template-columns:1fr 1fr}
    .problem-grid,.install-steps,.compare-table{display:block}
    .tl-step{flex-direction:column!important;text-align:left!important;padding-left:2.5rem}
    .tl-node{left:0;transform:none}
    .tl-line{left:18px}
    .status-grid{grid-template-columns:1fr 1fr}
  }
</style>
</head>
<body>

<canvas id="grid-canvas"></canvas>

<!-- NAV -->
<nav>
  <div class="nav-logo">City<span>Pramaan</span></div>
  <div class="nav-links">
    <a href="#problem">Problem</a>
    <a href="#features">Features</a>
    <a href="#architecture">Architecture</a>
    <a href="#stack">Stack</a>
    <a href="#install">Install</a>
  </div>
  <div class="nav-badge">MVP · Hackathon</div>
</nav>

<!-- HERO -->
<section class="hero">
  <div class="container">
    <div class="hero-inner">
      <div class="hero-eyebrow">
        <span class="dot"></span>
        Web3 + AI Civic Accountability Platform
      </div>
      <h1>
        Proof of Repair for<br>
        <span class="grd">Accountable Cities</span>
      </h1>
      <p class="hero-sub">
        CityPramaan converts ordinary civic complaints into verifiable, transparent, and tamper-proof proof-of-repair records — making civic closures impossible to fake.
      </p>
      <div class="hero-actions">
        <a href="https://github.com/virajkvk18/CityPramaan" class="btn btn-primary" target="_blank">⬡ View on GitHub</a>
        <a href="#features" class="btn btn-outline">Explore Features →</a>
      </div>

      <!-- Blockchain anim -->
      <div class="chain-anim" style="margin-top:3.5rem">
        <div class="chain-block">
          <div>#4a1f</div>
          <div class="chain-hash">Reported</div>
        </div>
        <div class="chain-link"></div>
        <div class="chain-block">
          <div>#7c3e</div>
          <div class="chain-hash">Verified</div>
        </div>
        <div class="chain-link"></div>
        <div class="chain-block">
          <div>#2b9d</div>
          <div class="chain-hash" style="color:var(--teal)">Repaired ✓</div>
        </div>
        <div class="chain-link"></div>
        <div class="chain-block">
          <div>#f1a3</div>
          <div class="chain-hash">Warranty</div>
        </div>
        <div class="chain-link"></div>
        <div class="chain-block">
          <div>#09cc</div>
          <div class="chain-hash">Closed</div>
        </div>
      </div>

      <div class="hero-scroll">
        <div class="scroll-line"></div>
        <span>Scroll to explore</span>
      </div>
    </div>
  </div>
</section>

<!-- MARQUEE -->
<div class="marquee-wrap">
  <div class="marquee-track">
    <span class="marquee-item">AI Damage Verification</span>
    <span class="marquee-item">Blockchain Proof Records</span>
    <span class="marquee-item">IPFS Evidence Storage</span>
    <span class="marquee-item">Contractor Accountability</span>
    <span class="marquee-item">Warranty Breach Scanner</span>
    <span class="marquee-item">Public Audit Dashboard</span>
    <span class="marquee-item">Repeat Failure Detection</span>
    <span class="marquee-item">Before-After AI Comparison</span>
    <span class="marquee-item">Tamper-Proof Records</span>
    <span class="marquee-item">AI Damage Verification</span>
    <span class="marquee-item">Blockchain Proof Records</span>
    <span class="marquee-item">IPFS Evidence Storage</span>
    <span class="marquee-item">Contractor Accountability</span>
    <span class="marquee-item">Warranty Breach Scanner</span>
    <span class="marquee-item">Public Audit Dashboard</span>
    <span class="marquee-item">Repeat Failure Detection</span>
    <span class="marquee-item">Before-After AI Comparison</span>
    <span class="marquee-item">Tamper-Proof Records</span>
  </div>
</div>

<!-- STATS -->
<div class="stats-strip">
  <div class="container">
    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-num" data-target="7">0</div>
        <div class="stat-label">Issue Types Tracked</div>
      </div>
      <div class="stat-item">
        <div class="stat-num" data-target="10">0</div>
        <div class="stat-label">Proof Timeline Stages</div>
      </div>
      <div class="stat-item">
        <div class="stat-num" data-target="8">0</div>
        <div class="stat-label">Smart Contract States</div>
      </div>
      <div class="stat-item">
        <div class="stat-num" data-target="5">0</div>
        <div class="stat-label">Platform Modules</div>
      </div>
    </div>
  </div>
</div>

<!-- PROBLEM -->
<section class="problem" id="problem">
  <div class="container">
    <div class="sec-header reveal">
      <span class="sec-eyebrow">// The Problem</span>
      <h2>Cities Need More Than<br>Complaint Tracking</h2>
      <p>Most platforms stop at two states. CityPramaan demands verifiable proof through the entire repair lifecycle.</p>
    </div>
    <div class="problem-grid">
      <div class="problem-card reveal">
        <h3>❌ The Accountability Gap</h3>
        <p>Civic complaints today can be silently closed without any proof repairs actually happened or lasted.</p>
        <ul class="issue-list">
          <li>Complaints marked resolved without evidence</li>
          <li>Poor quality repairs go undetected</li>
          <li>Same pothole refilled and breaks repeatedly</li>
          <li>No permanent audit trail for citizens</li>
          <li>Contractor performance is invisible</li>
          <li>Public money leaks through fake closures</li>
        </ul>
      </div>
      <div class="problem-card reveal">
        <h3 style="color:var(--teal)">✓ The CityPramaan Fix</h3>
        <p>Every repair is cryptographically verified, stored on-chain, and publicly auditable forever.</p>
        <ul class="sol-list">
          <li>AI verifies photo evidence of damage</li>
          <li>Blockchain records every status change</li>
          <li>Before-after comparison by AI vision</li>
          <li>Warranty period with automatic breach detection</li>
          <li>Contractor reputation tracked permanently</li>
          <li>Public proof timeline visible to all</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<!-- FEATURES -->
<section class="features" id="features">
  <div class="container">
    <div class="sec-header reveal">
      <span class="sec-eyebrow">// Key Features</span>
      <h2>Everything Repairs Need<br>to Be Accountable</h2>
      <p>Six integrated modules that cover the full civic repair lifecycle — from report to permanent proof.</p>
    </div>
    <div class="features-grid">
      <div class="feat-card reveal">
        <div class="feat-icon">📍</div>
        <h3>Citizen Civic Reporting</h3>
        <p>Geo-tagged issue submission with photo evidence, severity levels, and category tagging for potholes, drainage, streetlights, and more.</p>
        <span class="feat-tag tag-civic">Civic</span>
      </div>
      <div class="feat-card reveal">
        <div class="feat-icon">🤖</div>
        <h3>AI Damage Verification</h3>
        <p>Image-based issue verification using Gemini and Groq. Detects issue type, scores severity, identifies duplicates, and generates automated report summaries.</p>
        <span class="feat-tag tag-ai">AI / Vision</span>
      </div>
      <div class="feat-card reveal">
        <div class="feat-icon">⬡</div>
        <h3>Blockchain Proof Records</h3>
        <p>Every verified issue becomes an immutable on-chain record. Status updates, contractor IDs, timestamps, and warranty state — all tamper-proof.</p>
        <span class="feat-tag tag-web3">Web3 / Solidity</span>
      </div>
      <div class="feat-card reveal">
        <div class="feat-icon">🗂</div>
        <h3>IPFS Evidence Storage</h3>
        <p>Before/after photos and geo-tagged evidence stored decentrally via IPFS and Pinata. Proof hashes recorded on-chain for audit integrity.</p>
        <span class="feat-tag tag-web3">IPFS / Pinata</span>
      </div>
      <div class="feat-card reveal">
        <div class="feat-icon">🏗</div>
        <h3>Contractor Accountability</h3>
        <p>Contractors upload repair proof after work completion. AI compares before-after. Reputation scores build over time — fully transparent.</p>
        <span class="feat-tag tag-civic">Accountability</span>
      </div>
      <div class="feat-card reveal">
        <div class="feat-icon">🔍</div>
        <h3>Warranty Breach Scanner</h3>
        <p>If the same issue recurs near a repaired location during the warranty period, the system auto-flags it as a repeat failure — exposing negligence.</p>
        <span class="feat-tag tag-ai">AI Detection</span>
      </div>
    </div>
  </div>
</section>

<!-- TIMELINE -->
<section style="padding:6rem 0" id="timeline">
  <div class="container">
    <div class="sec-header reveal">
      <span class="sec-eyebrow">// Proof Timeline</span>
      <h2>10 Stages of Verifiable<br>Repair Accountability</h2>
      <p>Every issue passes through a cryptographically sealed timeline, visible to citizens, authorities, and the public.</p>
    </div>
    <div class="tl-track">
      <div class="tl-line"></div>
      <div class="tl-step reveal">
        <div class="tl-content">
          <h4>Citizen Reports Issue</h4>
          <p>Geo-tagged photo with severity and category uploaded to the platform.</p>
        </div>
        <div class="tl-node">01</div>
        <div style="flex:1"></div>
      </div>
      <div class="tl-step reveal">
        <div style="flex:1"></div>
        <div class="tl-node">02</div>
        <div class="tl-content">
          <h4>AI Verifies Damage</h4>
          <p>Vision model analyzes image, scores severity, detects category and duplicates.</p>
        </div>
      </div>
      <div class="tl-step reveal">
        <div class="tl-content">
          <h4>Blockchain Record Created</h4>
          <p>Evidence hash written to smart contract. Immutable proof of complaint is live.</p>
        </div>
        <div class="tl-node" style="border-color:var(--teal);color:var(--teal)">03</div>
        <div style="flex:1"></div>
      </div>
      <div class="tl-step reveal">
        <div style="flex:1"></div>
        <div class="tl-node">04</div>
        <div class="tl-content">
          <h4>Civic Admin Reviews</h4>
          <p>Municipal authority sees issue on dashboard and initiates assignment workflow.</p>
        </div>
      </div>
      <div class="tl-step reveal">
        <div class="tl-content">
          <h4>Contractor Assigned</h4>
          <p>Contractor ID is recorded on-chain. They receive repair task with deadline.</p>
        </div>
        <div class="tl-node">05</div>
        <div style="flex:1"></div>
      </div>
      <div class="tl-step reveal">
        <div style="flex:1"></div>
        <div class="tl-node">06</div>
        <div class="tl-content">
          <h4>Contractor Uploads Proof</h4>
          <p>After-repair photo uploaded and pinned to IPFS. Repair hash stored on-chain.</p>
        </div>
      </div>
      <div class="tl-step reveal">
        <div class="tl-content">
          <h4>AI Verifies Before-After</h4>
          <p>AI vision compares original and repaired image. Quality score generated.</p>
        </div>
        <div class="tl-node" style="border-color:var(--blue);color:var(--blue)">07</div>
        <div style="flex:1"></div>
      </div>
      <div class="tl-step reveal">
        <div style="flex:1"></div>
        <div class="tl-node">08</div>
        <div class="tl-content">
          <h4>Warranty Period Starts</h4>
          <p>Smart contract records warranty end date. Contractor is responsible during this period.</p>
        </div>
      </div>
      <div class="tl-step reveal">
        <div class="tl-content">
          <h4>Repeat Failure Detection</h4>
          <p>Scanner monitors the area. If same issue recurs, it's automatically flagged.</p>
        </div>
        <div class="tl-node" style="border-color:var(--amber);color:var(--amber)">09</div>
        <div style="flex:1"></div>
      </div>
      <div class="tl-step reveal">
        <div style="flex:1"></div>
        <div class="tl-node" style="border-color:var(--teal);color:var(--teal);background:var(--teal-glow)">10</div>
        <div class="tl-content" style="border-color:var(--border)">
          <h4>Public Closure Proof</h4>
          <p>Final proof hash published. Public audit timeline is permanently accessible to all.</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ARCHITECTURE -->
<section class="arch" id="architecture">
  <div class="container">
    <div class="sec-header reveal">
      <span class="sec-eyebrow">// Technical Architecture</span>
      <h2>Full-Stack Web3 + AI<br>Civic Infrastructure</h2>
      <p>Five layers working together — from citizen interface to immutable blockchain proof.</p>
    </div>
    <div class="arch-diagram reveal">
      <div class="arch-layer-label">Users</div>
      <div class="arch-layer layer-users">
        <div class="arch-box">Citizen</div>
        <div class="arch-box">Contractor</div>
        <div class="arch-box">Civic Admin</div>
        <div class="arch-box">Public Viewer</div>
      </div>
      <div class="arch-arrow">↓ HTTP / Web3</div>
      <div class="arch-layer-label">Application</div>
      <div class="arch-layer layer-app">
        <div class="arch-box">Next.js + React</div>
        <div class="arch-box">Tailwind CSS</div>
        <div class="arch-box">Framer Motion</div>
        <div class="arch-box">OpenStreetMap</div>
      </div>
      <div class="arch-arrow">↓ API Routes / Gemini / Groq</div>
      <div class="arch-layer-label">AI Verification</div>
      <div class="arch-layer layer-ai">
        <div class="arch-box">Image Analysis</div>
        <div class="arch-box">Severity Scoring</div>
        <div class="arch-box">Duplicate Detection</div>
        <div class="arch-box">Before/After Compare</div>
        <div class="arch-box">AI Summary Gen</div>
      </div>
      <div class="arch-arrow">↓ Hash → IPFS → On-chain</div>
      <div class="arch-layer-label">Evidence Storage</div>
      <div class="arch-layer layer-storage">
        <div class="arch-box">IPFS</div>
        <div class="arch-box">Pinata</div>
        <div class="arch-box">Supabase Storage</div>
        <div class="arch-box">PostgreSQL</div>
      </div>
      <div class="arch-arrow">↓ ethers.js / wagmi</div>
      <div class="arch-layer-label">Blockchain Proof Layer</div>
      <div class="arch-layer layer-chain">
        <div class="arch-box">Solidity Smart Contract</div>
        <div class="arch-box">Base Sepolia</div>
        <div class="arch-box">Polygon Amoy</div>
        <div class="arch-box">Hardhat</div>
      </div>
    </div>
  </div>
</section>

<!-- COMPARE -->
<section class="compare" id="compare">
  <div class="container">
    <div class="sec-header reveal">
      <span class="sec-eyebrow">// Why CityPramaan</span>
      <h2>The Difference Is<br>Verifiable Proof</h2>
    </div>
    <div class="reveal" style="overflow:auto">
      <table class="compare-table">
        <thead>
          <tr>
            <th>Feature</th>
            <th class="col-old">Existing Complaint Apps</th>
            <th class="col-new">CityPramaan</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Complaint lifecycle</td>
            <td class="col-old"><span class="x-icon">✕</span> Stops at complaint tracking</td>
            <td class="col-new"><span class="check-icon">✓</span> Full proof-of-repair lifecycle</td>
          </tr>
          <tr>
            <td>Closure verification</td>
            <td class="col-old"><span class="x-icon">✕</span> Can be faked silently</td>
            <td class="col-new"><span class="check-icon">✓</span> Requires verifiable repair proof</td>
          </tr>
          <tr>
            <td>Repair history</td>
            <td class="col-old"><span class="x-icon">✕</span> No immutable history</td>
            <td class="col-new"><span class="check-icon">✓</span> Blockchain-backed proof record</td>
          </tr>
          <tr>
            <td>Warranty tracking</td>
            <td class="col-old"><span class="x-icon">✕</span> No warranty trail</td>
            <td class="col-new"><span class="check-icon">✓</span> Warranty monitoring for repeat failures</td>
          </tr>
          <tr>
            <td>Contractor accountability</td>
            <td class="col-old"><span class="x-icon">✕</span> No contractor reputation</td>
            <td class="col-new"><span class="check-icon">✓</span> Reputation scoring and history</td>
          </tr>
          <tr>
            <td>Public transparency</td>
            <td class="col-old"><span class="x-icon">✕</span> Limited public access</td>
            <td class="col-new"><span class="check-icon">✓</span> Open civic audit dashboard</td>
          </tr>
          <tr>
            <td>Evidence storage</td>
            <td class="col-old"><span class="x-icon">✕</span> Centralized, deletable</td>
            <td class="col-new"><span class="check-icon">✓</span> Decentralized IPFS + on-chain hash</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</section>

<!-- SMART CONTRACT -->
<section style="padding:6rem 0;background:var(--surface)" id="contract">
  <div class="container">
    <div class="sec-header reveal">
      <span class="sec-eyebrow">// Smart Contract</span>
      <h2>Immutable On-Chain<br>Civic Proof Records</h2>
    </div>
    <div class="code-block reveal">
      <div class="code-topbar">
        <div class="dot-row">
          <div class="dot-btn"></div><div class="dot-btn"></div><div class="dot-btn"></div>
        </div>
        <div class="code-file">CivicReport.sol · Base Sepolia / Polygon Amoy</div>
      </div>
      <div class="code-body"><pre><span class="cmt">// SPDX-License-Identifier: MIT</span>
<span class="kw">pragma</span> solidity ^<span class="val">0.8.20</span>;

<span class="kw">contract</span> <span class="type">CityPramaan</span> {

  <span class="kw">enum</span> <span class="type">ReportStatus</span> {
    Reported, Verified, Assigned, RepairSubmitted,
    RepairVerified, WarrantyActive, RepeatFailureDetected, Closed
  }

  <span class="kw">struct</span> <span class="type">CivicReport</span> {
    <span class="type">uint256</span>  <span class="prop">reportId</span>;
    <span class="type">string</span>   <span class="prop">location</span>;
    <span class="type">string</span>   <span class="prop">issueType</span>;
    <span class="type">string</span>   <span class="prop">evidenceHash</span>;        <span class="cmt">// IPFS CID of complaint image</span>
    <span class="type">string</span>   <span class="prop">repairProofHash</span>;     <span class="cmt">// IPFS CID of after-repair photo</span>
    <span class="type">address</span>  <span class="prop">reporter</span>;
    <span class="type">address</span>  <span class="prop">contractor</span>;
    <span class="type">uint256</span>  <span class="prop">createdAt</span>;
    <span class="type">uint256</span>  <span class="prop">repairedAt</span>;
    <span class="type">uint256</span>  <span class="prop">warrantyEndsAt</span>;
    <span class="type">ReportStatus</span> <span class="prop">status</span>;
    <span class="type">bool</span>     <span class="prop">repeatFailureDetected</span>;
  }

  <span class="kw">mapping</span>(<span class="type">uint256</span> => <span class="type">CivicReport</span>) <span class="kw">public</span> reports;

  <span class="kw">event</span> <span class="type">ReportCreated</span>(<span class="type">uint256</span> indexed <span class="prop">reportId</span>, <span class="type">address</span> <span class="prop">reporter</span>);
  <span class="kw">event</span> <span class="type">StatusUpdated</span>(<span class="type">uint256</span> indexed <span class="prop">reportId</span>, <span class="type">ReportStatus</span> <span class="prop">newStatus</span>);
  <span class="kw">event</span> <span class="type">RepeatFailureDetected</span>(<span class="type">uint256</span> indexed <span class="prop">reportId</span>);
}</pre></div>
    </div>
    <!-- Status Badges -->
    <div class="status-grid reveal">
      <div class="status-badge"><div class="sbdot" style="background:#60a5fa"></div>Reported</div>
      <div class="status-badge"><div class="sbdot" style="background:#a78bfa"></div>Verified</div>
      <div class="status-badge"><div class="sbdot" style="background:#fbbf24"></div>Assigned</div>
      <div class="status-badge"><div class="sbdot" style="background:#34d399"></div>RepairSubmitted</div>
      <div class="status-badge"><div class="sbdot" style="background:var(--teal)"></div>RepairVerified</div>
      <div class="status-badge"><div class="sbdot" style="background:#22d3ee"></div>WarrantyActive</div>
      <div class="status-badge"><div class="sbdot" style="background:#f87171"></div>RepeatFailureDetected</div>
      <div class="status-badge"><div class="sbdot" style="background:#6ee7b7"></div>Closed</div>
    </div>
  </div>
</section>

<!-- TECH STACK -->
<section style="padding:6rem 0" id="stack">
  <div class="container">
    <div class="sec-header reveal">
      <span class="sec-eyebrow">// Tech Stack</span>
      <h2>Production-Grade<br>Full-Stack Web3 Setup</h2>
    </div>
    <div class="stack-grid reveal">
      <div class="stack-cat">
        <div class="stack-cat-label">Frontend</div>
        <div class="stack-pills">
          <span class="pill">Next.js</span>
          <span class="pill">React</span>
          <span class="pill">TypeScript</span>
          <span class="pill">Tailwind</span>
          <span class="pill">Framer Motion</span>
          <span class="pill">OpenStreetMap</span>
        </div>
      </div>
      <div class="stack-cat">
        <div class="stack-cat-label">Backend / DB</div>
        <div class="stack-pills">
          <span class="pill">Supabase</span>
          <span class="pill">PostgreSQL</span>
          <span class="pill">API Routes</span>
        </div>
      </div>
      <div class="stack-cat">
        <div class="stack-cat-label">Web3</div>
        <div class="stack-pills">
          <span class="pill">Solidity</span>
          <span class="pill">Hardhat</span>
          <span class="pill">ethers.js</span>
          <span class="pill">wagmi</span>
          <span class="pill">Base Sepolia</span>
          <span class="pill">Polygon Amoy</span>
        </div>
      </div>
      <div class="stack-cat">
        <div class="stack-cat-label">AI / GenAI</div>
        <div class="stack-pills">
          <span class="pill">Gemini API</span>
          <span class="pill">Groq API</span>
          <span class="pill">Vision Models</span>
        </div>
      </div>
      <div class="stack-cat">
        <div class="stack-cat-label">Storage / Deploy</div>
        <div class="stack-pills">
          <span class="pill">IPFS</span>
          <span class="pill">Pinata</span>
          <span class="pill">Supabase Storage</span>
          <span class="pill">Vercel</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- IMPACT -->
<section class="impact">
  <div class="container">
    <div class="sec-header reveal">
      <span class="sec-eyebrow">// Real-World Impact</span>
      <h2>Why Cities Need<br>CityPramaan</h2>
    </div>
    <div class="impact-grid">
      <div class="impact-card reveal">
        <div class="impact-icon">🔎</div>
        <h4>Radical Transparency</h4>
        <p>Every repair step is publicly visible and permanently auditable.</p>
      </div>
      <div class="impact-card reveal">
        <div class="impact-icon">🤝</div>
        <h4>Contractor Trust</h4>
        <p>Reputation scores based on verifiable repair quality — not self-reported.</p>
      </div>
      <div class="impact-card reveal">
        <div class="impact-icon">💰</div>
        <h4>Save Public Money</h4>
        <p>Warranty enforcement stops contractors from doing quick, failing repairs.</p>
      </div>
      <div class="impact-card reveal">
        <div class="impact-icon">🏙</div>
        <h4>Smart City Governance</h4>
        <p>Data-driven insights into repeat failure zones and civic performance by ward.</p>
      </div>
    </div>
  </div>
</section>

<!-- INSTALL -->
<section class="install" id="install">
  <div class="container">
    <div class="sec-header reveal">
      <span class="sec-eyebrow">// Installation</span>
      <h2>Get Running in<br>Three Steps</h2>
    </div>
    <div class="install-steps">
      <div class="install-step reveal">
        <div class="step-num">01</div>
        <h4>Clone & Install Frontend</h4>
        <div class="cmd">git clone https://github.com/virajkvk18/CityPramaan.git</div>
        <div class="cmd">cd CityPramaan/web</div>
        <div class="cmd">npm install</div>
        <div class="cmd">npm run dev</div>
        <p style="margin-top:.9rem;font-size:.82rem;color:var(--muted)">App runs on <code style="color:var(--teal);font-family:var(--font-mono)">localhost:3000</code></p>
      </div>
      <div class="install-step reveal">
        <div class="step-num">02</div>
        <h4>Configure Environment</h4>
        <p style="font-size:.82rem;color:var(--muted);margin-bottom:.9rem">Create <code style="color:var(--teal);font-family:var(--font-mono)">web/.env.local</code> with:</p>
        <div class="cmd">NEXT_PUBLIC_SUPABASE_URL=</div>
        <div class="cmd">NEXT_PUBLIC_SUPABASE_ANON_KEY=</div>
        <div class="cmd">GEMINI_API_KEY=</div>
        <div class="cmd">GROQ_API_KEY=</div>
        <div class="cmd">NEXT_PUBLIC_CONTRACT_ADDRESS=</div>
      </div>
      <div class="install-step reveal">
        <div class="step-num">03</div>
        <h4>Deploy Smart Contract</h4>
        <div class="cmd">cd contracts && npm install</div>
        <div class="cmd">npx hardhat compile</div>
        <div class="cmd">npx hardhat run scripts/deploy.ts --network baseSepolia</div>
        <div class="cmd">npx hardhat run scripts/deploy.ts --network polygonAmoy</div>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="cta">
  <div class="container">
    <h2>Civic Repairs Should Be<br><span style="color:var(--teal)">Provable, Not Promisable.</span></h2>
    <p>CityPramaan makes civic accountability impossible to fake — one blockchain record at a time.</p>
    <div class="cta-buttons">
      <a href="https://github.com/virajkvk18/CityPramaan" class="btn btn-primary" target="_blank">⬡ GitHub Repository</a>
      <a href="https://github.com/virajkvk18" class="btn btn-outline" target="_blank">← Built by Viraj</a>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <p>Built by <a href="https://github.com/virajkvk18" target="_blank">Viraj Kumar Vishwakarma</a> · Hackathon Track: Smart Cities / Civic Tech · Web3 · AI/GenAI</p>
</footer>

<script>
/* ── GRID CANVAS ── */
const canvas = document.getElementById('grid-canvas');
const ctx = canvas.getContext('2d');
let W, H, dots = [], t = 0;
function resize(){W = canvas.width = innerWidth; H = canvas.height = innerHeight; initDots()}
function initDots(){
  dots = [];
  const cols = Math.ceil(W/60), rows = Math.ceil(H/60);
  for(let r=0;r<=rows;r++) for(let c=0;c<=cols;c++){
    dots.push({x:c*60,y:r*60,phase:Math.random()*Math.PI*2,speed:.4+Math.random()*.6})
  }
}
function drawGrid(){
  ctx.clearRect(0,0,W,H);
  const teal = 'rgba(0,212,170,';
  /* grid lines */
  ctx.strokeStyle = 'rgba(0,212,170,0.04)';ctx.lineWidth=.5;
  for(let x=0;x<W;x+=60){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}
  for(let y=0;y<H;y+=60){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
  /* dots */
  dots.forEach(d=>{
    const a = .04+.08*(.5+.5*Math.sin(t*d.speed+d.phase));
    ctx.fillStyle = teal+a+')';
    ctx.beginPath();ctx.arc(d.x,d.y,1.5,0,Math.PI*2);ctx.fill();
  });
  t+=.015;requestAnimationFrame(drawGrid);
}
window.addEventListener('resize',resize);
resize();drawGrid();

/* ── SCROLL REVEAL ── */
const reveals = document.querySelectorAll('.reveal');
const io = new IntersectionObserver(entries=>{
  entries.forEach((e,i)=>{
    if(e.isIntersecting){e.target.style.transitionDelay=(i*.07)+'s';e.target.classList.add('visible');io.unobserve(e.target)}
  })
},{threshold:.12});
reveals.forEach(el=>io.observe(el));

/* ── COUNTER ANIMATION ── */
function animateCounter(el, target){
  let start = 0; const dur = 1800;
  const step = ts => {
    if(!start) start = ts;
    const prog = Math.min((ts-start)/dur,1);
    el.textContent = Math.round(prog*target);
    if(prog<1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const counterIO = new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      const t = +e.target.dataset.target;
      animateCounter(e.target, t);
      counterIO.unobserve(e.target);
    }
  })
},{threshold:.5});
document.querySelectorAll('[data-target]').forEach(el=>counterIO.observe(el));

/* ── NAV ACTIVE ── */
const navLinks = document.querySelectorAll('.nav-links a');
const sections = document.querySelectorAll('section[id]');
const secIO = new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      navLinks.forEach(l=>l.style.color='');
      const active = document.querySelector(`.nav-links a[href="#${e.target.id}"]`);
      if(active) active.style.color = 'var(--teal)';
    }
  })
},{threshold:.4});
sections.forEach(s=>secIO.observe(s));
</script>
</body>
</html>
