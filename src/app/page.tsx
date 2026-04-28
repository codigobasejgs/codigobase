const styles = `
* { margin:0; padding:0; box-sizing:border-box; }
html { scroll-behavior:smooth; scroll-padding-top:80px; }
body { background:#060b16; color:#f4f7ff; font-family:-apple-system,'Inter',sans-serif; line-height:1; }

/* ═══ HEADER ═══ */
.hdr {
  display:flex; align-items:center; justify-content:space-between;
  padding:0 40px; height:64px;
  background:rgba(6,11,22,0.7); backdrop-filter:blur(24px);
  border-bottom:1px solid rgba(255,255,255,0.05);
  position:sticky; top:0; z-index:50;
}
.logo { font-size:17px; font-weight:900; letter-spacing:-0.5px; }
.logo b { color:#F97316; font-weight:900; }
.logo span { color:#f4f7ff; }
.nav-links { display:flex; gap:28px; }
.nav-links a { font-size:13px; color:#8896b3; text-decoration:none; transition:color .15s; }
.nav-links a:hover { color:#f4f7ff; }
.hdr-cta {
  display:flex; align-items:center; gap:8px;
  background:linear-gradient(135deg,#F97316,#dc6010);
  padding:9px 20px; border-radius:100px;
  font-size:12px; font-weight:700; color:#fff;
  box-shadow:0 4px 20px rgba(249,115,22,.32); cursor:pointer; text-decoration:none;
}

/* ═══ HERO ═══ */
.hero {
  display:grid; grid-template-columns:1fr 400px;
  gap:0; min-height:640px; align-items:center;
  padding:80px 40px 80px;
  position:relative; overflow:hidden;
  background:
    radial-gradient(ellipse at 0% 50%, rgba(6,182,212,.10) 0%, transparent 48%),
    radial-gradient(ellipse at 90% 10%, rgba(249,115,22,.14) 0%, transparent 42%),
    radial-gradient(ellipse at 75% 90%, rgba(6,182,212,.07) 0%, transparent 38%);
}
.hero::after {
  content:''; position:absolute; inset:0; pointer-events:none;
  background-image:
    linear-gradient(rgba(6,182,212,.03) 1px,transparent 1px),
    linear-gradient(90deg,rgba(6,182,212,.03) 1px,transparent 1px);
  background-size:52px 52px;
}
.hero-text { position:relative; z-index:2; max-width:540px; }

/* Badge */
.badge {
  display:inline-flex; align-items:center; gap:8px;
  padding:5px 14px; border-radius:100px;
  background:rgba(6,182,212,.08); border:1px solid rgba(6,182,212,.22);
  font-size:11px; color:#06B6D4; font-weight:600; margin-bottom:28px;
  letter-spacing:.2px;
}
.badge-dot { width:6px; height:6px; border-radius:50%; background:#06B6D4; box-shadow:0 0 8px rgba(6,182,212,.9); }

/* Headline */
.h1 { font-size:52px; font-weight:900; line-height:1.05; letter-spacing:-2.5px; color:#f4f7ff; margin-bottom:20px; }
.h1 .line2 { display:block; background:linear-gradient(90deg,#06B6D4 0%,#F97316 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }

/* Sub */
.sub { font-size:16px; color:#8896b3; line-height:1.7; max-width:440px; margin-bottom:32px; }
.sub strong { color:#c8d4e8; font-weight:600; }

/* CTAs */
.btns { display:flex; gap:12px; align-items:center; margin-bottom:40px; }
.btn-a {
  display:flex; align-items:center; gap:9px;
  background:linear-gradient(135deg,#F97316,#dc6010);
  padding:14px 26px; border-radius:100px;
  font-size:14px; font-weight:700; color:#fff;
  box-shadow:0 6px 28px rgba(249,115,22,.38); cursor:pointer; text-decoration:none;
}
.btn-b {
  border:1px solid rgba(255,255,255,.12);
  padding:14px 26px; border-radius:100px;
  font-size:14px; color:#b0bad0; cursor:pointer; text-decoration:none;
}
.microcopy { font-size:11px; color:#3d4a60; display:flex; align-items:center; gap:6px; }
.microcopy::before { content:'✓'; color:#06B6D4; font-size:11px; }

/* Stats inline */
.stats { display:flex; gap:36px; padding-top:32px; border-top:1px solid rgba(255,255,255,.06); }
.stat-v { font-size:30px; font-weight:900; letter-spacing:-1px; }
.stat-l { font-size:11px; color:#6b7691; margin-top:4px; line-height:1.4; }

/* ── Hero right: floating cards ── */
.hero-cards { position:relative; z-index:2; height:500px; }
.fc {
  position:absolute;
  background:rgba(10,16,28,.92);
  border-radius:18px; padding:18px 20px;
  backdrop-filter:blur(20px);
  box-shadow:0 24px 64px rgba(0,0,0,.55), 0 1px 0 rgba(255,255,255,.06) inset;
}
.fc1 { top:0; left:0; width:210px; border:1px solid rgba(6,182,212,.18); }
.fc2 { top:130px; right:0; width:200px; border:1px solid rgba(249,115,22,.2); }
.fc3 { bottom:30px; left:24px; width:230px; border:1px solid rgba(6,182,212,.14); }
.fc4 { top:10px; right:16px; width:130px; border:1px solid rgba(255,255,255,.07); background:rgba(6,182,212,.05); }

.fc-tag { font-size:9px; color:#6b7691; margin-bottom:10px; text-transform:uppercase; letter-spacing:.8px; }
.fc-name { font-size:12px; font-weight:700; color:#f4f7ff; margin-bottom:10px; }
.fc-bar { height:4px; border-radius:2px; background:rgba(255,255,255,.06); margin-bottom:5px; overflow:hidden; }
.fc-bar-fill { height:100%; border-radius:2px; }
.fc-metric { font-size:22px; font-weight:900; letter-spacing:-1px; margin-top:8px; }
.fc-desc { font-size:10px; color:#6b7691; margin-top:3px; }
.bubble { font-size:11px; border-radius:8px; padding:7px 10px; margin-bottom:5px; line-height:1.4; }
.bubble.in { background:rgba(6,182,212,.1); color:#e0f2f7; }
.bubble.out { background:rgba(249,115,22,.1); color:#fed7aa; text-align:right; }
.pulse { width:8px; height:8px; border-radius:50%; background:#22c55e; display:inline-block; box-shadow:0 0 6px rgba(34,197,94,.7); margin-right:5px; }

/* ═══ STATS BAR ═══ */
.stats-bar {
  display:grid; grid-template-columns:repeat(4,1fr);
  background:rgba(255,255,255,.02);
  border-top:1px solid rgba(255,255,255,.05);
  border-bottom:1px solid rgba(255,255,255,.05);
}
.stat-item {
  padding:32px 28px; text-align:center;
  border-right:1px solid rgba(255,255,255,.04);
  position:relative;
}
.stat-item:last-child { border-right:none; }
.stat-big { font-size:36px; font-weight:900; letter-spacing:-1.5px; margin-bottom:6px; }
.stat-small { font-size:12px; color:#6b7691; line-height:1.5; }
.stat-context { font-size:10px; color:#3d4a60; margin-top:4px; }

/* ═══ SERVIÇOS ═══ */
.services { padding:88px 40px; }
.sec-head { margin-bottom:60px; }
.sec-tag {
  display:inline-flex; align-items:center; gap:6px;
  font-size:10px; font-weight:700; color:#06B6D4;
  letter-spacing:1.5px; text-transform:uppercase; margin-bottom:14px;
}
.sec-tag::before { content:''; width:20px; height:1px; background:#06B6D4; }
.sec-h2 { font-size:42px; font-weight:900; letter-spacing:-2px; line-height:1.06; margin-bottom:14px; }
.sec-sub { font-size:15px; color:#8896b3; max-width:500px; line-height:1.65; }

.svc-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:2px; }
.svc-card {
  padding:32px 28px; background:rgba(255,255,255,.025);
  border:1px solid rgba(255,255,255,.06);
  border-radius:2px; position:relative; overflow:hidden;
  transition:all .25s;
}
.svc-card:first-child { border-radius:20px 2px 2px 2px; }
.svc-card:last-child { border-radius:2px 2px 20px 2px; }
.svc-card:nth-child(2) { border-color:rgba(249,115,22,.15); background:rgba(249,115,22,.02); }
.svc-card:hover { background:rgba(6,182,212,.04); border-color:rgba(6,182,212,.25); }

.svc-icon { font-size:28px; margin-bottom:16px; }
.svc-problem { font-size:10px; font-weight:700; color:#F97316; letter-spacing:1px; text-transform:uppercase; margin-bottom:10px; }
.svc-h3 { font-size:20px; font-weight:800; letter-spacing:-.5px; margin-bottom:10px; }
.svc-desc { font-size:13px; color:#8896b3; line-height:1.65; margin-bottom:16px; }
.svc-transform { font-size:12px; color:#06B6D4; font-weight:600; padding:8px 12px; background:rgba(6,182,212,.07); border-radius:8px; border-left:2px solid #06B6D4; margin-bottom:16px; }
.svc-tags { display:flex; flex-wrap:wrap; gap:6px; }
.svc-tag { font-size:10px; padding:3px 10px; border-radius:100px; background:rgba(255,255,255,.05); color:#8896b3; }

/* ═══ COMO FUNCIONA ═══ */
.how {
  padding:88px 40px;
  background:radial-gradient(ellipse at 50% -5%, rgba(6,182,212,.06) 0%, transparent 55%);
}
.how-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:0; margin-top:60px; position:relative; }
.how-grid::before {
  content:''; position:absolute; top:36px; left:calc(16% + 36px); right:calc(16% + 36px);
  height:1px;
  background:linear-gradient(90deg, rgba(6,182,212,.4) 0%, rgba(249,115,22,.4) 50%, rgba(6,182,212,.4) 100%);
}
.step { padding:0 24px; position:relative; }
.step-num {
  width:72px; height:72px; border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  font-size:13px; font-weight:900; letter-spacing:.5px;
  margin:0 auto 24px;
  position:relative; z-index:1;
  border:1px solid rgba(6,182,212,.25);
  background:linear-gradient(135deg,rgba(6,182,212,.1),rgba(6,182,212,.03));
  color:#06B6D4;
}
.step:nth-child(2) .step-num { border-color:rgba(249,115,22,.3); background:linear-gradient(135deg,rgba(249,115,22,.1),rgba(249,115,22,.03)); color:#F97316; }
.step-h3 { font-size:18px; font-weight:800; text-align:center; margin-bottom:10px; letter-spacing:-.3px; }
.step-desc { font-size:13px; color:#8896b3; line-height:1.65; text-align:center; }
.step-note { font-size:11px; color:#3d4a60; text-align:center; margin-top:10px; font-style:italic; }

/* ═══ PROJETOS ═══ */
.projects { padding:88px 40px; }
.proj-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
.proj-card {
  border-radius:20px; overflow:hidden;
  border:1px solid rgba(255,255,255,.07);
  background:rgba(255,255,255,.02);
  display:flex; flex-direction:column;
}
.proj-thumb {
  padding:24px; display:flex; flex-direction:column; justify-content:flex-end;
  height:180px; position:relative; overflow:hidden;
}
.proj-client { font-size:9px; color:rgba(255,255,255,.4); text-transform:uppercase; letter-spacing:1px; margin-bottom:6px; }
.proj-title-sm { font-size:15px; font-weight:800; color:#f4f7ff; letter-spacing:-.3px; }
.proj-body { padding:20px; flex:1; display:flex; flex-direction:column; }
.proj-niche {
  display:inline-flex; align-items:center; gap:5px;
  font-size:10px; font-weight:700; padding:3px 10px; border-radius:100px;
  margin-bottom:12px; width:fit-content;
}
.proj-context { font-size:12px; color:#6b7691; margin-bottom:10px; line-height:1.5; }
.proj-solution { font-size:12px; color:#b0bad0; margin-bottom:12px; line-height:1.5; }
.proj-result {
  margin-top:auto; padding:10px 14px; border-radius:10px;
  display:flex; align-items:center; justify-content:space-between;
}
.proj-result-num { font-size:18px; font-weight:900; }
.proj-result-desc { font-size:10px; color:#6b7691; }

/* ═══ DEPOIMENTOS ═══ */
.testimonials { padding:88px 40px; background:rgba(255,255,255,.015); border-top:1px solid rgba(255,255,255,.04); }
.test-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-top:60px; }
.test-card {
  border-radius:20px; padding:28px;
  border:1px solid rgba(255,255,255,.07);
  background:rgba(255,255,255,.025);
  display:flex; flex-direction:column; position:relative;
}
.test-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:16px; }
.test-avatar {
  width:44px; height:44px; border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  font-size:18px; flex-shrink:0;
  background:rgba(6,182,212,.1); border:1px solid rgba(6,182,212,.2);
}
.avatar-initials {
  width:44px;
  height:44px;
  border-radius:50%;
  background:var(--color-primary, #01696f);
  display:flex;
  align-items:center;
  justify-content:center;
  font-weight:700;
  color:#fff;
  font-size:0.875rem;
  flex-shrink:0;
  font-family:var(--font-body, sans-serif);
  letter-spacing:0.02em;
}
.test-meta { flex:1; margin-left:12px; }
.test-name { font-size:13px; font-weight:700; margin-bottom:3px; }
.test-role { font-size:11px; color:#6b7691; }
.test-rating { font-size:12px; color:#F97316; }
.test-quote { font-size:13px; color:#b0bad0; line-height:1.7; flex:1; font-style:italic; margin-bottom:16px; }
.test-project { font-size:10px; color:#3d4a60; padding-top:12px; border-top:1px solid rgba(255,255,255,.05); display:flex; align-items:center; gap:6px; }
.test-project::before { content:'🔧'; font-size:10px; }

/* ═══ CTA FINAL ═══ */
.cta-final {
  padding:100px 40px; text-align:center; position:relative; overflow:hidden;
  border-top:1px solid rgba(255,255,255,.05);
}
.cta-final::before {
  content:''; position:absolute; inset:0;
  background:radial-gradient(ellipse at 50% 0%, rgba(249,115,22,.12) 0%, transparent 60%),
              radial-gradient(ellipse at 50% 100%, rgba(6,182,212,.08) 0%, transparent 55%);
}
.cta-final-tag { position:relative; font-size:10px; font-weight:700; color:#F97316; letter-spacing:2px; text-transform:uppercase; margin-bottom:20px; }
.cta-final-h2 { font-size:48px; font-weight:900; letter-spacing:-2.5px; line-height:1.06; margin-bottom:16px; position:relative; }
.cta-final-sub { font-size:16px; color:#8896b3; max-width:500px; margin:0 auto 12px; line-height:1.65; position:relative; }
.cta-final-note { font-size:12px; color:#3d4a60; margin-bottom:36px; position:relative; }
.cta-final-note span { color:#06B6D4; }
.cta-actions { display:flex; gap:14px; justify-content:center; position:relative; }
.cta-trust { display:flex; gap:24px; justify-content:center; margin-top:28px; position:relative; }
.cta-trust-item { font-size:11px; color:#3d4a60; display:flex; align-items:center; gap:5px; }
.cta-trust-item::before { content:'✓'; color:#06B6D4; }

/* ═══ FOOTER ═══ */
.footer {
  padding:60px 40px 28px; background:#030710;
  border-top:1px solid rgba(255,255,255,.05);
}
.footer-grid { display:grid; grid-template-columns:2.2fr 1fr 1fr 1.4fr; gap:40px; margin-bottom:44px; }
.f-logo { font-size:20px; font-weight:900; margin-bottom:12px; }
.f-logo b { color:#F97316; }
.f-desc { font-size:13px; color:#6b7691; line-height:1.65; max-width:220px; margin-bottom:20px; }
.f-social { display:flex; gap:12px; }
.f-social-link { width:32px; height:32px; border-radius:8px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07); display:flex; align-items:center; justify-content:center; font-size:14px; color:#8896b3; text-decoration:none; transition:color .15s,border-color .15s; }
.f-social-link:hover { color:#06B6D4; border-color:rgba(6,182,212,.25); }
.f-col h5 { font-size:11px; font-weight:700; color:#f4f7ff; margin-bottom:16px; letter-spacing:.5px; text-transform:uppercase; }
.f-col a { display:block; font-size:13px; color:#6b7691; margin-bottom:10px; text-decoration:none; transition:color .15s; }
.f-col a:hover { color:#06B6D4; }
.f-contact-item { display:flex; align-items:center; gap:8px; font-size:13px; color:#6b7691; margin-bottom:10px; }
.f-contact-icon { width:28px; height:28px; border-radius:8px; background:rgba(6,182,212,.08); border:1px solid rgba(6,182,212,.15); display:flex; align-items:center; justify-content:center; font-size:12px; flex-shrink:0; }
.footer-bottom { display:flex; justify-content:space-between; align-items:center; padding-top:20px; border-top:1px solid rgba(255,255,255,.04); }
.footer-bottom p { font-size:12px; color:#3d4a60; }
.footer-bottom-links { display:flex; gap:20px; }
.footer-bottom-links a { font-size:12px; color:#3d4a60; text-decoration:none; }
`;

const markup = `
<!-- HEADER -->
<header class="hdr">
  <div class="logo"><span>Código</span><b>Base</b></div>
  <nav class="nav-links">
    <a href="#servicos">Serviços</a>
    <a href="#projetos">Projetos</a>
    <a href="#depoimentos">Depoimentos</a>
    <a href="#contato">Contato</a>
  </nav>
  <a class="hdr-cta" href="https://wa.me/5511986262240?text=Ol%C3%A1%2C+vim+pelo+site+da+C%C3%B3digo+Base+e+quero+saber+mais" target="_blank" rel="noopener noreferrer">
    <span>💬</span> Falar no WhatsApp
  </a>
</header>

<section class="hero">
  <div class="hero-text">
    <div class="badge">
      <div class="badge-dot"></div>
      Software, sistemas e infraestrutura — tudo sob um mesmo teto
    </div>

    <h1 class="h1">
      Sua empresa para de<br/>
      perder tempo e começa<br/>
      <span class="line2">a operar de verdade</span>
    </h1>

    <p class="sub">
      Construímos <strong>sistemas sob medida</strong>, automatizamos processos manuais e cuidamos da infraestrutura que faz tudo rodar.
      Do software ao hardware — <strong>sem precisar contratar duas empresas</strong>.
    </p>

    <div class="btns">
      <a class="btn-a" href="https://wa.me/5511986262240?text=Ol%C3%A1%2C+vim+pelo+site+da+C%C3%B3digo+Base+e+quero+saber+mais" target="_blank" rel="noopener noreferrer">
        <span>💬</span> Falar no WhatsApp
      </a>
      <a class="btn-b" href="#projetos">Ver projetos →</a>
    </div>
    <div class="microcopy">Resposta em até 2 horas em dias úteis</div>

    <div class="stats">
      <div>
        <div class="stat-v" style="color:#06B6D4;">24h</div>
        <div class="stat-l">Tempo médio<br/>de resposta</div>
      </div>
      <div>
        <div class="stat-v" style="color:#F97316;">2 em 1</div>
        <div class="stat-l">Software +<br/>Infraestrutura</div>
      </div>
      <div>
        <div class="stat-v" style="color:#f4f7ff;">100%</div>
        <div class="stat-l">Projetos com<br/>suporte pós-entrega</div>
      </div>
    </div>
  </div>

  <!-- FLOATING EVIDENCE CARDS -->
  <div class="hero-cards">

    <!-- Card 1: ERP Dashboard -->
    <div class="fc fc1">
      <div class="fc-tag">💼 sistema · indústria</div>
      <div class="fc-name">ERP de Vendas & Estoque</div>
      <div class="fc-bar"><div class="fc-bar-fill" style="width:82%;background:linear-gradient(90deg,#06B6D4,#0284c7);"></div></div>
      <div class="fc-bar"><div class="fc-bar-fill" style="width:67%;background:linear-gradient(90deg,#F97316,#dc6010);"></div></div>
      <div style="display:flex;justify-content:space-between;margin-top:10px;">
        <div>
          <div class="fc-metric" style="color:#06B6D4;">+38%</div>
          <div class="fc-desc">produtividade</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:10px;background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.25);color:#22c55e;padding:3px 8px;border-radius:6px;"><span class="pulse"></span>ao vivo</div>
        </div>
      </div>
    </div>

    <!-- Card 4: Uptime quick -->
    <div class="fc fc4">
      <div class="fc-tag">🖥️ infra</div>
      <div style="font-size:22px;font-weight:900;color:#22c55e;margin:6px 0;">99.7%</div>
      <div class="fc-desc">uptime servidores<br/>clientes ativos</div>
    </div>

    <!-- Card 2: WhatsApp Bot -->
    <div class="fc fc2">
      <div class="fc-tag">💬 automação · e-commerce</div>
      <div class="fc-name">Atendimento WhatsApp</div>
      <div class="bubble in">Olá! Quero saber meu pedido</div>
      <div class="bubble out">Pedido #4821 — saiu para entrega ✓</div>
      <div style="font-size:10px;color:#F97316;margin-top:6px;font-weight:600;">↓ 70% no tempo de resposta</div>
    </div>

    <!-- Card 3: IoT Sensors -->
    <div class="fc fc3">
      <div class="fc-tag">🌡️ hardware iot · indústria frigorífica</div>
      <div class="fc-name">Monitoramento em Tempo Real</div>
      <div style="display:flex;gap:10px;margin-top:8px;">
        <div style="flex:1;text-align:center;background:rgba(6,182,212,.07);border-radius:10px;padding:10px;">
          <div style="font-size:17px;font-weight:900;color:#06B6D4;">-2°C</div>
          <div style="font-size:9px;color:#6b7691;">Câmara A</div>
        </div>
        <div style="flex:1;text-align:center;background:rgba(249,115,22,.07);border-radius:10px;padding:10px;">
          <div style="font-size:17px;font-weight:900;color:#F97316;">32</div>
          <div style="font-size:9px;color:#6b7691;">Sensores</div>
        </div>
        <div style="flex:1;text-align:center;background:rgba(34,197,94,.07);border-radius:10px;padding:10px;">
          <div style="font-size:17px;font-weight:900;color:#22c55e;">0</div>
          <div style="font-size:9px;color:#6b7691;">Alertas</div>
        </div>
      </div>
    </div>
  </div>
</section>

<div class="stats-bar">
  <div class="stat-item">
    <div class="stat-big" style="background:linear-gradient(135deg,#06B6D4,#0284c7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Desde<br/>2023</div>
    <div class="stat-small">Fundada para resolver<br/>o que outros terceirizam</div>
  </div>
  <div class="stat-item">
    <div class="stat-big" style="background:linear-gradient(135deg,#F97316,#dc6010);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">2 em 1</div>
    <div class="stat-small">Software + Infraestrutura<br/>sob o mesmo teto</div>
    <div class="stat-context">Único ponto de contato para toda a tecnologia</div>
  </div>
  <div class="stat-item">
    <div class="stat-big" style="background:linear-gradient(135deg,#06B6D4,#F97316);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">&lt; 24h</div>
    <div class="stat-small">Resposta garantida<br/>em dias úteis</div>
    <div class="stat-context">Sem fila de ticket, sem formulário genérico</div>
  </div>
  <div class="stat-item">
    <div class="stat-big" style="background:linear-gradient(135deg,#F97316,#06B6D4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">100%</div>
    <div class="stat-small">Suporte após entrega<br/>em todos os projetos</div>
    <div class="stat-context">O projeto não termina no deploy</div>
  </div>
</div>

<section class="services" id="servicos">
  <div class="sec-head">
    <div class="sec-tag">O que entregamos</div>
    <h2 class="sec-h2">Tecnologia aplicada<br/>ao negócio real</h2>
    <p class="sec-sub">Cada serviço existe para resolver um problema concreto — não para preencher um portfólio. Veja o que fazemos e por quê.</p>
  </div>

  <div class="svc-grid">
    <!-- SOFTWARE -->
    <div class="svc-card">
      <div class="svc-icon">💻</div>
      <div class="svc-problem">Você controla seu negócio por WhatsApp e planilha?</div>
      <h3 class="svc-h3">Sistemas & Software</h3>
      <p class="svc-desc">Construímos o sistema que organiza sua operação, automatiza o que é repetitivo e te dá visibilidade do que acontece em tempo real — sem depender de gambiarras.</p>
      <div class="svc-transform">→ Operação organizada, dados confiáveis, menos retrabalho</div>
      <div class="svc-tags">
        <span class="svc-tag">Next.js</span><span class="svc-tag">Node.js</span>
        <span class="svc-tag">PostgreSQL</span><span class="svc-tag">SaaS</span>
        <span class="svc-tag">Dashboards</span><span class="svc-tag">Apps</span>
      </div>
    </div>

    <!-- INFRAESTRUTURA -->
    <div class="svc-card">
      <div class="svc-icon">🖥️</div>
      <div class="svc-problem" style="color:#F97316;">Máquina lenta ou sistema travando no pior momento?</div>
      <h3 class="svc-h3">Infraestrutura & Hardware</h3>
      <p class="svc-desc">Diagnosticamos, upgradamos e mantemos o ambiente técnico da sua empresa. Desktop, notebook, servidor, rede — a base que faz tudo rodar estável.</p>
      <div class="svc-transform" style="border-color:#F97316;background:rgba(249,115,22,.07);color:#F97316;">→ Ambiente estável, menos paradas, mais desempenho</div>
      <div class="svc-tags">
        <span class="svc-tag">Diagnóstico</span><span class="svc-tag">Upgrade</span>
        <span class="svc-tag">Servidores</span><span class="svc-tag">Rede</span>
        <span class="svc-tag">IoT</span><span class="svc-tag">Suporte</span>
      </div>
    </div>

    <!-- AUTOMAÇÃO -->
    <div class="svc-card">
      <div class="svc-icon">⚡</div>
      <div class="svc-problem">Sua equipe perde horas em tarefas que deveriam ser automáticas?</div>
      <h3 class="svc-h3">Automação & IA</h3>
      <p class="svc-desc">Conectamos seus sistemas, automatizamos fluxos repetitivos e integramos IA onde faz sentido. Do atendimento no WhatsApp ao relatório que gerava 3 horas de trabalho.</p>
      <div class="svc-transform">→ Processos rápidos, erros eliminados, time focado no que importa</div>
      <div class="svc-tags">
        <span class="svc-tag">n8n</span><span class="svc-tag">WhatsApp API</span>
        <span class="svc-tag">OpenAI</span><span class="svc-tag">Agentes IA</span>
        <span class="svc-tag">Integrações</span><span class="svc-tag">APIs</span>
      </div>
    </div>
  </div>
</section>

<section class="how">
  <div class="sec-head" style="text-align:center;">
    <div class="sec-tag" style="justify-content:center;">Nosso processo</div>
    <h2 class="sec-h2" style="text-align:center;">Do problema ao ar<br/>em 3 etapas claras</h2>
    <p class="sec-sub" style="margin:0 auto;text-align:center;">Sem proposta de 40 páginas. Sem sumiço depois do fechamento. Processo direto, comunicação constante.</p>
  </div>
  <div class="how-grid">
    <div class="step">
      <div class="step-num">01</div>
      <h3 class="step-h3">Diagnóstico</h3>
      <p class="step-desc">Reunião de 30 minutos onde você explica o problema e a gente já aponta caminhos. Sem comprometimento. Sem apresentação de vendas.</p>
      <p class="step-note">Você sai da reunião com clareza — independente de contratar</p>
    </div>
    <div class="step">
      <div class="step-num">02</div>
      <h3 class="step-h3">Desenvolvimento</h3>
      <p class="step-desc">Sprints semanais com entregas reais e visibilidade total do progresso. Você acompanha sem precisar entender de código — direto no WhatsApp.</p>
      <p class="step-note">Sem "estamos trabalhando nisso" sem mostrar nada</p>
    </div>
    <div class="step">
      <div class="step-num">03</div>
      <h3 class="step-h3">Entrega com suporte</h3>
      <p class="step-desc">Deploy em produção, treinamento, documentação básica e suporte pós-entrega incluído. O projeto não termina quando o sistema vai ao ar.</p>
      <p class="step-note">Porque o verdadeiro teste é na vida real, não no ambiente de teste</p>
    </div>
  </div>
</section>

<section class="projects" id="projetos">
  <div class="sec-head" style="display:flex;justify-content:space-between;align-items:flex-end;">
    <div>
      <div class="sec-tag">Casos reais</div>
      <h2 class="sec-h2" style="margin-bottom:0;">Problemas resolvidos,<br/>resultados que ficaram</h2>
    </div>
    <a href="#projetos" style="font-size:13px;color:#06B6D4;text-decoration:none;white-space:nowrap;">Ver todos os projetos →</a>
  </div>

  <div class="proj-grid" style="margin-top:48px;">
    <!-- Case 1 -->
    <div class="proj-card">
      <div class="proj-thumb" style="background:linear-gradient(135deg,#050f1e,#0a1f35);">
        <div style="position:absolute;top:16px;right:16px;font-size:28px;">💼</div>
        <div class="proj-client">Distribuidora · Região de Campinas</div>
        <div class="proj-title-sm">ERP de Vendas, Estoque e Financeiro</div>
      </div>
      <div class="proj-body">
        <div class="proj-niche" style="background:rgba(6,182,212,.1);color:#06B6D4;">Software · ERP</div>
        <div class="proj-context"><strong style="color:#8896b3;">Problema:</strong> Gestão feita em planilhas compartilhadas. Dois vendedores vendendo o mesmo item sem saber.</div>
        <div class="proj-solution"><strong style="color:#b0bad0;">Solução:</strong> Sistema web com controle de estoque em tempo real, emissão de pedidos, comissões e relatório gerencial.</div>
        <div class="proj-result" style="background:rgba(6,182,212,.07);border:1px solid rgba(6,182,212,.15);">
          <div>
            <div class="proj-result-num" style="color:#06B6D4;">+38%</div>
            <div class="proj-result-desc">produtividade operacional</div>
          </div>
          <div style="font-size:10px;color:#3d4a60;">Primeiros 3 meses</div>
        </div>
      </div>
    </div>

    <!-- Case 2 -->
    <div class="proj-card">
      <div class="proj-thumb" style="background:linear-gradient(135deg,#130800,#1f0f00);">
        <div style="position:absolute;top:16px;right:16px;font-size:28px;">💬</div>
        <div class="proj-client">E-commerce de moda · São Paulo</div>
        <div class="proj-title-sm">Bot de Atendimento WhatsApp + IA</div>
      </div>
      <div class="proj-body">
        <div class="proj-niche" style="background:rgba(249,115,22,.1);color:#F97316;">Automação · IA</div>
        <div class="proj-context"><strong style="color:#8896b3;">Problema:</strong> Equipe de 2 pessoas respondendo 800+ mensagens por dia. Clientes esperando horas por rastreio.</div>
        <div class="proj-solution"><strong style="color:#b0bad0;">Solução:</strong> Bot com IA para rastreio, FAQ e qualificação de compra. Handoff para humano apenas nos casos complexos.</div>
        <div class="proj-result" style="background:rgba(249,115,22,.07);border:1px solid rgba(249,115,22,.15);">
          <div>
            <div class="proj-result-num" style="color:#F97316;">-70%</div>
            <div class="proj-result-desc">no tempo de resposta</div>
          </div>
          <div style="font-size:10px;color:#3d4a60;">10k msgs processadas/dia</div>
        </div>
      </div>
    </div>

    <!-- Case 3 -->
    <div class="proj-card">
      <div class="proj-thumb" style="background:linear-gradient(135deg,#020d14,#041f2e);">
        <div style="position:absolute;top:16px;right:16px;font-size:28px;">🌡️</div>
        <div class="proj-client">Indústria frigorífica · Interior de SP</div>
        <div class="proj-title-sm">Rede IoT de Monitoramento Térmico</div>
      </div>
      <div class="proj-body">
        <div class="proj-niche" style="background:rgba(6,182,212,.1);color:#06B6D4;">Hardware · IoT</div>
        <div class="proj-context"><strong style="color:#8896b3;">Problema:</strong> Variações de temperatura descobertas horas depois, resultando em perda de carga e multas sanitárias.</div>
        <div class="proj-solution"><strong style="color:#b0bad0;">Solução:</strong> 32 sensores ESP32 com alertas em tempo real via Telegram e dashboard histórico de temperatura e umidade.</div>
        <div class="proj-result" style="background:rgba(6,182,212,.07);border:1px solid rgba(6,182,212,.15);">
          <div>
            <div class="proj-result-num" style="color:#06B6D4;">R$ 0</div>
            <div class="proj-result-desc">em perda de carga desde instalação</div>
          </div>
          <div style="font-size:10px;color:#3d4a60;">98% uptime · 6 meses</div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="testimonials" id="depoimentos">
  <div class="sec-head" style="text-align:center;">
    <div class="sec-tag" style="justify-content:center;">Prova social</div>
    <h2 class="sec-h2" style="text-align:center;">Quem já trabalhava<br/>em planilha, conta</h2>
  </div>
  <div class="test-grid">
    <div class="test-card">
      <div class="test-header">
        <div class="avatar-initials" aria-label="Carlos Silva">CS</div>
        <div class="test-meta">
          <div class="test-name">Carlos Silva</div>
          <div class="test-role">Diretor Comercial · Distribuidora, Campinas</div>
        </div>
        <div class="test-rating">★★★★★</div>
      </div>
      <p class="test-quote">"Em 3 meses o sistema pagou o investimento. Hoje tenho visibilidade do estoque em tempo real e minha equipe parou de vender o que não tem."</p>
      <div class="test-project">Projeto: ERP de Vendas & Estoque</div>
    </div>
    <div class="test-card" style="border-color:rgba(249,115,22,.15);">
      <div class="test-header">
        <div class="avatar-initials" aria-label="Ana Rodrigues" style="background:#F97316;">AR</div>
        <div class="test-meta">
          <div class="test-name">Ana Rodrigues</div>
          <div class="test-role">Gerente de Operações · E-commerce, São Paulo</div>
        </div>
        <div class="test-rating">★★★★★</div>
      </div>
      <p class="test-quote">"Minha equipe passava o dia só respondendo WhatsApp. Hoje o bot resolve 70% dos atendimentos e o time foca no que realmente precisa de atenção humana."</p>
      <div class="test-project">Projeto: Bot WhatsApp com IA</div>
    </div>
    <div class="test-card">
      <div class="test-header">
        <div class="avatar-initials" aria-label="Roberto Costa">RC</div>
        <div class="test-meta">
          <div class="test-name">Roberto Costa</div>
          <div class="test-role">Gerente de TI · Indústria frigorífica, Interior SP</div>
        </div>
        <div class="test-rating">★★★★★</div>
      </div>
      <p class="test-quote">"Antes eu descobria o problema depois do prejuízo. Agora recebo alerta no celular antes de qualquer variação sair do limite. Sem complicação, funciona."</p>
      <div class="test-project">Projeto: Monitoramento IoT Térmico</div>
    </div>
  </div>
</section>

<section class="cta-final" id="contato">
  <div class="cta-final-tag">Próximo passo</div>
  <h2 class="cta-final-h2">
    Tem um problema de<br/>
    <span style="background:linear-gradient(90deg,#F97316,#06B6D4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">tecnologia sem solução?</span>
  </h2>
  <p class="cta-final-sub">Não precisa saber exatamente o que precisa. Conta o problema — a gente mapeia o que faz sentido para o seu caso, sem compromisso.</p>
  <p class="cta-final-note">Reunião de diagnóstico gratuita · <span>Resposta em até 2 horas</span> · Sem apresentação de vendas</p>
  <div class="cta-actions">
    <a class="btn-a" href="https://wa.me/5511986262240?text=Ol%C3%A1%2C+vim+pelo+site+da+C%C3%B3digo+Base+e+quero+saber+mais" target="_blank" rel="noopener noreferrer" style="font-size:15px;padding:16px 32px;">💬 Falar no WhatsApp agora</a>
    <a class="btn-b" href="mailto:Projetosti.jgs@gmail.com" target="_blank" rel="noopener noreferrer" style="font-size:15px;padding:16px 32px;">✉️ Enviar e-mail</a>
  </div>
  <div class="cta-trust">
    <div class="cta-trust-item">Sem contrato de fidelidade</div>
    <div class="cta-trust-item">Proposta em até 24h</div>
    <div class="cta-trust-item">Suporte incluído em todos os projetos</div>
  </div>
</section>

<footer class="footer">
  <div class="footer-grid">
    <div>
      <div class="f-logo"><span>Código</span><b>Base</b></div>
      <p class="f-desc">Software, hardware e automação para empresas que precisam de tecnologia que funciona de verdade.</p>
      <div class="f-social">
        <a class="f-social-link" href="https://instagram.com/codigo.base" target="_blank" rel="noopener noreferrer" aria-label="Instagram da Código Base"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></a>
        <a class="f-social-link" href="https://wa.me/5511986262240?text=Ol%C3%A1%2C+vim+pelo+site+da+C%C3%B3digo+Base" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp da Código Base"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></a>
        <a class="f-social-link" href="mailto:Projetosti.jgs@gmail.com" target="_blank" rel="noopener noreferrer" aria-label="E-mail da Código Base"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></a>
      </div>
    </div>
    <div class="f-col">
      <h5>Navegação</h5>
      <a href="#topo">Home</a><a href="#servicos">Serviços</a><a href="#projetos">Projetos</a>
      <a href="#depoimentos">Depoimentos</a><a href="#contato">Contato</a>
    </div>
    <div class="f-col">
      <h5>Serviços</h5>
      <a href="#servicos">Sistemas Web</a><a href="#servicos">Apps Mobile</a><a href="#servicos">SaaS</a>
      <a href="#servicos">Automações</a><a href="#servicos">Hardware IoT</a><a href="#servicos">Infraestrutura</a>
    </div>
    <div class="f-col">
      <h5>Contato direto</h5>
      <div class="f-contact-item">
        <div class="f-contact-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></div>
        <a href="https://wa.me/5511986262240?text=Ol%C3%A1%2C+vim+pelo+site+da+C%C3%B3digo+Base+e+quero+saber+mais" target="_blank" rel="noopener noreferrer" style="margin:0;">(11) 98626-2240</a>
      </div>
      <div class="f-contact-item">
        <div class="f-contact-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
        <a href="mailto:Projetosti.jgs@gmail.com" target="_blank" rel="noopener noreferrer" style="margin:0;">Projetosti.jgs@gmail.com</a>
      </div>
      <div class="f-contact-item">
        <div class="f-contact-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></div>
        <a href="https://instagram.com/codigo.base" target="_blank" rel="noopener noreferrer" style="margin:0;">@codigo.base</a>
      </div>
    </div>
  </div>
  <div class="footer-bottom">
    <p><span>© 2026 Código Base. Todos os direitos reservados.</span></p>
    <div class="footer-bottom-links">
      <a href="#contato">Política de Privacidade</a>
      <a href="#contato">Termos de Uso</a>
    </div>
  </div>
</footer>
`;

export default function Home() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div dangerouslySetInnerHTML={{ __html: markup }} />
    </>
  );
}
