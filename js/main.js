// ===================== CONFIGURAÇÃO =====================
const FIXA = {
  whatsapp: '5564999611588',      // DDI + DDD + número, só dígitos
  instagram: 'fixa.estudio',      // usuário sem @
  email: '',                      // deixe vazio para esconder o botão de e-mail
};

// ===================== utilidades =====================
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const wppLink = msg => `https://wa.me/${FIXA.whatsapp}?text=${encodeURIComponent(msg)}`;
const icon = (id, cls = 'ico') => `<svg class="${cls}"><use href="#${id}"/></svg>`;
const store = {
  get: k => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* sem armazenamento: tudo bem */ } },
};

// ===================== links de contato =====================
$('#year').textContent = new Date().getFullYear();
const hello = wppLink('Olá! Vim pelo site da FIXA.');
['#lnkWhats', '#wppFloat', '#ftWhats'].forEach(s => { $(s).href = hello; });
['#lnkInsta', '#ftInsta'].forEach(s => { $(s).href = `https://instagram.com/${FIXA.instagram}`; });
if (FIXA.email) $('#lnkMail').href = `mailto:${FIXA.email}`;
else $('#lnkMail').parentElement.remove();
$$('[data-wpp]').forEach(a => { a.href = wppLink(a.dataset.wpp); a.target = '_blank'; a.rel = 'noopener'; });

// ===================== abertura animada =====================
// O navegador só deixa tocar som depois de um clique. Por isso: tentamos tocar com som;
// se ele bloquear, aparece a tela "Clique para entrar", e o clique libera o som.
const INTRO_KEY = 'fixa-intro-visto';
const intro = $('#intro'), introAudio = $('#introAudio'), soundBtn = $('#introSound'), gate = $('#introGate');
let introRaf = 0, introT0 = 0, introRunning = false;

function introTime() { return (performance.now() - introT0) / 1000; }
function setSoundLabel(on) {
  soundBtn.innerHTML = on ? `${icon('i-sound')}Som ligado` : `${icon('i-mute')}Som desligado`;
  soundBtn.setAttribute('aria-pressed', on);
}
function showIntroLayer() {
  intro.classList.remove('off', 'leaving');
  intro.setAttribute('aria-hidden', 'false');
  document.body.classList.add('lock');
  introRunning = true;
}
function runIntro() {
  gate.hidden = true;
  introT0 = performance.now();
  const tick = () => {
    const t = introTime();
    window.FixaIntro.render(Math.min(t, window.FixaIntro.DUR));
    if (t >= window.FixaIntro.DUR) return finishIntro();
    introRaf = requestAnimationFrame(tick);
  };
  tick();
}
function playIntro() {
  if (!window.FixaIntro) return startPage();
  showIntroLayer();
  window.FixaIntro.render(0);
  setSoundLabel(true);
  introAudio.currentTime = 0;
  introAudio.play()
    .then(runIntro)
    .catch(() => { gate.hidden = false; $('#introEnter').focus(); });
}
function finishIntro() {
  if (!introRunning) return;
  introRunning = false;
  cancelAnimationFrame(introRaf);
  introAudio.pause();
  store.set(INTRO_KEY, '1');
  intro.classList.add('leaving');
  setTimeout(() => {
    intro.classList.add('off');
    intro.setAttribute('aria-hidden', 'true');
    gate.hidden = true;
    document.body.classList.remove('lock');
    startPage();
  }, 650);
}
$('#introEnter').addEventListener('click', () => {
  introAudio.currentTime = 0;
  introAudio.play().then(() => setSoundLabel(true)).catch(() => setSoundLabel(false));
  runIntro();
});
$('#introGateSkip').addEventListener('click', finishIntro);
$('#introSkip').addEventListener('click', finishIntro);
soundBtn.addEventListener('click', () => {
  if (introAudio.paused) {
    introAudio.currentTime = Math.min(introTime(), introAudio.duration || 99);
    introAudio.play().then(() => setSoundLabel(true)).catch(() => {});
  } else { introAudio.pause(); setSoundLabel(false); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && introRunning) finishIntro(); });
$('#replayIntro').addEventListener('click', () => {
  if (!window.FixaIntro) return;
  showIntroLayer();
  introAudio.currentTime = 0;
  introAudio.play().then(() => setSoundLabel(true)).catch(() => setSoundLabel(false));
  runIntro();
});

// ===================== títulos palavra por palavra =====================
let wordIndex = 0;
function splitInto(node, target, extraClass) {
  node.textContent.split(/(\s+)/).forEach(part => {
    if (!part) return;
    if (/^\s+$/.test(part)) { target.appendChild(document.createTextNode(' ')); return; }
    const w = document.createElement('span'); w.className = 'w';
    const wi = document.createElement('span'); wi.className = 'wi' + (extraClass ? ' ' + extraClass : '');
    wi.style.setProperty('--wi', wordIndex++);
    wi.textContent = part;
    w.appendChild(wi); target.appendChild(w);
  });
}
$$('[data-split]').forEach(el => {
  wordIndex = 0;
  const frag = document.createDocumentFragment();
  [...el.childNodes].forEach(n => {
    if (n.nodeType === 3) splitInto(n, frag);
    else if (n.nodeType === 1) {
      // palavras com degradê (ex.: <em class="grad-warm">) levam a classe para cada palavra
      const holder = document.createElement(n.tagName.toLowerCase());
      splitInto(n, holder, n.className);
      frag.appendChild(holder);
    }
  });
  el.textContent = '';
  el.appendChild(frag);
  el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
});

// ===================== entrada ao rolar =====================
let pageStarted = false, io;
function observe(el) { if (io) io.observe(el); }
function startPage() {
  if (pageStarted) return;
  pageStarted = true;
  io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { threshold: 0.18, rootMargin: '0px 0px -60px 0px' });
  $$('[data-reveal], [data-split], .showcase, #steps').forEach(observe);
}

// ===================== botões: ímã, clique "jello" (estilo Animista) =====================
if (finePointer && !reduceMotion) $$('.magnetic').forEach(el => {
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * 0.28).toFixed(1) + 'px');
    el.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * 0.4).toFixed(1) + 'px');
  });
  el.addEventListener('pointerleave', () => { el.style.setProperty('--mx', '0px'); el.style.setProperty('--my', '0px'); });
});
$$('.btn').forEach(btn => {
  btn.addEventListener('pointerdown', () => { btn.classList.remove('pressed'); void btn.offsetWidth; btn.classList.add('pressed'); });
  btn.addEventListener('animationend', e => { if (e.animationName === 'jello') btn.classList.remove('pressed'); });
});

// cartões: luz e borda que seguem o mouse
if (finePointer) $$('.spot').forEach(el => el.addEventListener('pointermove', e => {
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mx', e.clientX - r.left + 'px');
  el.style.setProperty('--my', e.clientY - r.top + 'px');
}));

// borda giratória nos planos em destaque
$$('.plan.featured').forEach(p => { const b = document.createElement('span'); b.className = 'featured-border'; b.setAttribute('aria-hidden', 'true'); p.prepend(b); });

// ícones se redesenham ao passar o mouse
$$('.service').forEach(card => card.addEventListener('mouseenter', () => {
  const ico = $('.draw', card);
  if (!ico || reduceMotion || !card.classList.contains('is-in')) return;
  ico.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 1100, easing: 'cubic-bezier(.16,1,.3,1)' });
}));

// ===================== gotinhas saindo do cursor, como na logo =====================
const canvas = $('#dropsCanvas'), ctx2d = canvas.getContext('2d');
const drops = [];
let dpr = 1, lastX = null, lastY = null, travel = 0, dropsRaf = 0, lastFrame = 0;
function sizeCanvas() { dpr = finePointer ? Math.min(window.devicePixelRatio || 1, 2) : 1; canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr; }
sizeCanvas();
addEventListener('resize', sizeCanvas);
const palette = () => $('#topbar').classList.contains('tc')
  ? ['#2F55E6', '#1A7BFF', '#1FC8F2', '#2F3FD9'] : ['#FF1A0A', '#FF3D00', '#FF5A00', '#FFB000'];
function spawn(x, y, n, speed) {
  const cols = palette();
  for (let i = 0; i < n; i++) {
    if (drops.length > 260) drops.shift();
    const ang = Math.PI * (0.05 + Math.random() * 0.55), v = speed * (0.4 + Math.random() * 0.8);
    drops.push({
      x: x + 12 + Math.random() * 8, y: y + 22 + Math.random() * 8, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v,
      r: 1.6 + Math.random() * 3.6, life: 0, max: 0.55 + Math.random() * 0.45,
      c: cols[(Math.random() * cols.length) | 0], rot: Math.random() * Math.PI,
    });
  }
  if (!dropsRaf) { lastFrame = performance.now(); dropsRaf = requestAnimationFrame(drawDrops); }
}
function drawDrops(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000); lastFrame = now;
  ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx2d.clearRect(0, 0, innerWidth, innerHeight);
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    d.life += dt;
    if (d.life >= d.max) { drops.splice(i, 1); continue; }
    d.vy += 520 * dt; d.vx *= 0.985; d.x += d.vx * dt; d.y += d.vy * dt;
    const k = d.life / d.max, s = 1 - k * 0.6;
    ctx2d.globalAlpha = 1 - k * k; ctx2d.fillStyle = d.c;
    ctx2d.beginPath(); ctx2d.ellipse(d.x, d.y, d.r * s, d.r * 1.2 * s, d.rot, 0, Math.PI * 2); ctx2d.fill();
  }
  ctx2d.globalAlpha = 1;
  dropsRaf = drops.length ? requestAnimationFrame(drawDrops) : 0;
}
if (!reduceMotion) {
  document.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch' || introRunning) { lastX = null; return; }
    if (lastX !== null) travel += Math.hypot(e.clientX - lastX, e.clientY - lastY);
    lastX = e.clientX; lastY = e.clientY;
    if (travel > 14) { travel = 0; spawn(e.clientX, e.clientY, 1 + (Math.random() < 0.4), 70); }
  }, { passive: true });
  document.addEventListener('pointerdown', e => {
    if (introRunning || e.target.closest('input, textarea, select')) return;
    const touch = e.pointerType === 'touch';
    spawn(touch ? e.clientX - 14 : e.clientX, touch ? e.clientY - 26 : e.clientY, 9, 190);
  });
}

// ===================== vitrine do topo: janelas com parallax =====================
const showcase = $('#showcase'), windows = $$('.window', showcase), heroText = $('#heroText');
function fitWindows() { windows.forEach(w => { const v = $('.win-view', w); v.style.setProperty('--view', v.clientHeight + 'px'); }); }
fitWindows();
addEventListener('resize', fitWindows);
if (finePointer && !reduceMotion) $('.hero').addEventListener('pointermove', e => {
  const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
  windows.forEach(w => {
    const d = +w.dataset.depth;
    w.style.setProperty('--px', (-x * d).toFixed(1) + 'px');
    w.style.setProperty('--py', (-y * d).toFixed(1) + 'px');
  });
});

// ===================== rolagem: topo, progresso, cor, processo =====================
const topbar = $('#topbar');

// ----- indicador lateral (substitui a barra de rolagem) -----
const side = $('#sideProgress'), spTrack = $('#spTrack'), spPct = $('#spPct'), spTicks = $('#spTicks');
const TICKS = [['inicio', 'Início'], ['estudio', 'Estúdio'], ['solucoes', 'Soluções'], ['processo', 'Processo'], ['projetos', 'Projetos'], ['contato', 'Contato']];
const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - innerHeight);
function buildTicks() {
  spTicks.innerHTML = '';
  TICKS.forEach(([id, label]) => {
    const sec = document.getElementById(id);
    if (!sec) return;
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.label = label; b.setAttribute('aria-label', 'Ir para ' + label);
    b.dataset.at = clamp((sec.offsetTop - (id === 'inicio' ? 0 : 70)) / maxScroll());
    b.style.top = b.dataset.at * 100 + '%';
    b.addEventListener('click', e => { e.stopPropagation(); sec.scrollIntoView({ behavior: 'smooth' }); });
    spTicks.appendChild(b);
  });
}
// arrastar ou clicar no trilho rola a página
function scrollFromTrack(e) {
  const r = spTrack.getBoundingClientRect();
  window.scrollTo({ top: clamp((e.clientY - r.top) / r.height) * maxScroll(), behavior: 'instant' });
}
spTrack.addEventListener('pointerdown', e => {
  if (e.target.closest('button')) return;
  spTrack.setPointerCapture(e.pointerId);
  scrollFromTrack(e);
  const move = ev => scrollFromTrack(ev);
  const up = () => { spTrack.removeEventListener('pointermove', move); spTrack.removeEventListener('pointerup', up); };
  spTrack.addEventListener('pointermove', move);
  spTrack.addEventListener('pointerup', up);
});
let activeTimer = 0;

// ----- transição Estúdio → Soluções -----
const sw = $('#troca'), swCursor = $('.switch-cursor', sw);
let swSide = 0;
const sections = $$('main section[id]'), navLinks = $$('.nav a[href^="#"]:not(.btn)');
const stepsEl = $('#steps'), stepsFill = $('#stepsFill'), stepItems = $$('.step');
const wppFloat = $('#wppFloat'), contact = $('#contato'), nav = $('#nav');
const tickButtons = () => $$('button', spTicks);

// Medidas da página guardadas em cache: a rolagem não mede nada a cada quadro (isso travava o celular).
const M = {};
function measure() {
  const y = scrollY, top = el => el.getBoundingClientRect().top + y;
  M.vh = innerHeight;
  M.max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  M.sections = sections.map(s => ({ id: s.id, top: top(s) }));
  M.swTop = top(sw); M.swRange = Math.max(1, sw.offsetHeight - innerHeight);
  M.stepsTop = top(stepsEl); M.stepsH = stepsEl.offsetHeight;
  M.contactTop = top(contact); M.contactH = contact.offsetHeight;
  M.ticks = tickButtons().map(b => ({ b, at: +b.dataset.at }));
}

let prevScroll = 0, ticking = false, lastSection = '', lastPct = -1, heroDone = false, lastCool = null, themeTimer = 0;
function onScroll() {
  ticking = false;
  const y = scrollY, vh = M.vh;

  // indicador lateral
  const sp = clamp(y / M.max);
  side.style.setProperty('--sp', sp.toFixed(4));
  const pct = Math.round(sp * 100);
  if (pct !== lastPct) { spPct.textContent = pct + '%'; lastPct = pct; M.ticks.forEach(t => t.b.classList.toggle('passed', sp >= t.at - 0.002)); }
  side.classList.add('active');
  clearTimeout(activeTimer);
  activeTimer = setTimeout(() => side.classList.remove('active'), 900);

  // transição Estúdio → Soluções (0 = Estúdio, 1 = Soluções); só trabalha quando está na tela
  const raw = clamp((y - M.swTop) / M.swRange);
  if (y > M.swTop - vh && y < M.swTop + M.swRange + vh) {
    const p = raw < .5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;
    sw.style.setProperty('--p', p.toFixed(3));
    sw.style.setProperty('--bump', Math.sin(Math.PI * p).toFixed(3));
    const swNow = p >= .5 ? 1 : 0;
    if (swNow !== swSide && raw > 0 && raw < 1 && !reduceMotion) {
      // respingo de gotas quando a cor vira
      const r = swCursor.getBoundingClientRect();
      spawn(r.left + r.width * .1, r.top + r.height * .15, finePointer ? 22 : 12, 300);
    }
    swSide = swNow;
  }
  // cor: menu e indicador trocam na hora (são leves); o resto da página troca quando a rolagem para,
  // para o recálculo de estilo não cair no meio do movimento
  const cool = y >= M.swTop + M.swRange * .5;
  if (cool !== lastCool) { lastCool = cool; topbar.classList.toggle('tc', cool); side.classList.toggle('tc', cool); }
  if (document.body.classList.contains('tc') !== cool) {
    clearTimeout(themeTimer);
    themeTimer = setTimeout(() => document.body.classList.toggle('tc', lastCool), 180);
  }

  // menu do topo
  topbar.classList.toggle('scrolled', y > 20);
  if (!nav.classList.contains('open') && y > 600 && y > prevScroll + 4) topbar.classList.add('hide');
  else if (y < prevScroll - 4 || y < 600) topbar.classList.remove('hide');
  prevScroll = y;

  // link ativo do menu
  const mid = y + vh * 0.45;
  let current = '';
  M.sections.forEach(s => { if (s.top <= mid) current = s.id; });
  if (current !== lastSection) {
    lastSection = current;
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
  }

  // topo: a vitrine sobe em velocidades diferentes e o texto se afasta (só enquanto o topo está na tela)
  if (!reduceMotion && finePointer && (y < vh * 1.2 || !heroDone)) {
    heroDone = y >= vh * 1.2;
    const yy = Math.min(y, vh * 1.2);
    windows.forEach(w => w.style.setProperty('--sy', (-yy * +w.dataset.depth / 160).toFixed(1) + 'px'));
    const k = clamp(yy / (vh * 0.8));
    heroText.style.opacity = 1 - k * 0.9;
    heroText.style.transform = `translateY(${(k * 40).toFixed(1)}px)`;
  }

  // linha do processo cresce com a rolagem e acende cada etapa
  const stepsTopNow = M.stepsTop - y;
  if (stepsTopNow < vh && stepsTopNow > -M.stepsH) {
    const sp2 = clamp((vh * 0.72 - stepsTopNow) / (M.stepsH * 0.6 + vh * 0.15));
    stepsFill.style.setProperty('--p', sp2.toFixed(3));
    stepItems.forEach((s, i) => {
      const on = sp2 >= i / (stepItems.length - 1) * 0.98 && stepsTopNow < vh * 0.85;
      s.classList.toggle('lit', on);
      if (on) s.classList.add('is-in');
    });
  }

  const ct = M.contactTop - y;
  wppFloat.classList.toggle('hidden', ct < vh * 0.6 && ct + M.contactH > 0);
}
function refresh() { buildTicks(); measure(); onScroll(); }
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
addEventListener('resize', refresh);
addEventListener('load', refresh);
refresh();
side.classList.remove('active');
// quando o conteúdo muda de altura (imagens, fontes, filtros), mede de novo, no máximo uma vez por quadro
let roPending = false;
if ('ResizeObserver' in window) new ResizeObserver(() => {
  if (roPending) return;
  roPending = true;
  requestAnimationFrame(() => { roPending = false; refresh(); });
}).observe(document.body);

// pausa animações que estão fora da tela (economiza bateria e deixa a rolagem leve)
const pauseIO = new IntersectionObserver(entries => entries.forEach(e => e.target.classList.toggle('offscreen', !e.isIntersecting)), { rootMargin: '100px' });
$$('.hero, .clients, .plans, .switch').forEach(el => pauseIO.observe(el));

// menu do celular
const menuBtn = $('#menuToggle');
menuBtn.addEventListener('click', () => { const open = nav.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', open); });
$$('a', nav).forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }));

// ===================== projetos =====================
const TIPOS = ['Todos', 'Landing page', 'Catálogo', 'Institucional', 'Loja virtual', 'Agendamento'];
const gallery = $('#gallery'), filters = $('#filters');
const works = window.PORTFOLIO || [];
const host = url => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; } };
function fitShots() { $$('.work .shot', gallery).forEach(s => s.parentElement.closest('.work').style.setProperty('--frame-h', s.clientHeight + 'px')); }
function renderGallery(tipo = 'Todos') {
  gallery.innerHTML = '';
  works.filter(w => tipo === 'Todos' || w.tipo === tipo).forEach((w, i) => {
    const a = document.createElement('a');
    a.className = 'card work spot';
    a.dataset.reveal = '';
    a.style.setProperty('--i', i);
    if (w.link) { a.href = w.link; a.target = '_blank'; a.rel = 'noopener'; }
    const full = w.imagem && w.imagem.replace(/\.jpg$/, '-full.jpg');
    a.innerHTML = `<div class="frame"><div class="win-bar"><i></i><i></i><i></i><span></span></div>
      <div class="shot"><img alt="" loading="lazy"></div></div>
      <div class="info"><div><span class="tag"></span><h3></h3><p></p></div><span class="go">${icon('i-external')}</span></div>`;
    $('.win-bar span', a).textContent = host(w.link);
    const img = $('img', a);
    img.src = full || w.imagem || '';
    img.onerror = () => { if (w.imagem && img.src.indexOf(w.imagem) < 0) img.src = w.imagem; };
    img.alt = 'Site ' + (w.nome || '');
    $('.tag', a).textContent = w.tipo || '';
    $('h3', a).textContent = w.nome || '';
    $('p', a).textContent = w.descricao || '';
    a.addEventListener('pointermove', e => {
      const r = a.getBoundingClientRect();
      a.style.setProperty('--mx', e.clientX - r.left + 'px'); a.style.setProperty('--my', e.clientY - r.top + 'px');
    });
    gallery.appendChild(a);
    if (pageStarted) requestAnimationFrame(() => a.classList.add('is-in')); else observe(a);
  });
  requestAnimationFrame(fitShots);
}
if (works.length > 1) {
  TIPOS.filter(t => t === 'Todos' || works.some(w => w.tipo === t)).forEach((t, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = t; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', i === 0);
    b.addEventListener('click', () => {
      $$('button', filters).forEach(x => x.setAttribute('aria-selected', x === b));
      $$('.work', gallery).forEach(w => w.classList.add('is-hiding'));
      setTimeout(() => renderGallery(t), 320);
    });
    filters.appendChild(b);
  });
} else filters.remove();
renderGallery();
addEventListener('resize', fitShots);

// ===================== perguntas: abrir e fechar com movimento =====================
$$('.faq details').forEach(d => {
  const summary = $('summary', d), body = $('.faq-body', d);
  summary.addEventListener('click', e => {
    if (reduceMotion) return;
    e.preventDefault();
    if (d.open) {
      const a = body.animate([{ height: body.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 380, easing: 'cubic-bezier(.16,1,.3,1)' });
      a.onfinish = () => { d.open = false; };
    } else {
      d.open = true;
      body.animate([{ height: '0px', opacity: 0 }, { height: body.offsetHeight + 'px', opacity: 1 }], { duration: 520, easing: 'cubic-bezier(.16,1,.3,1)' });
    }
  });
});

// ===================== formulário → WhatsApp =====================
$('#contactForm').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.currentTarget, nome = f.nome.value.trim();
  if (!nome) { f.nome.classList.add('invalid'); f.nome.focus(); setTimeout(() => f.nome.classList.remove('invalid'), 600); return; }
  let msg = `Olá! Meu nome é ${nome}. Tenho interesse em: ${f.interesse.value}.`;
  if (f.mensagem.value.trim()) msg += `\n\n${f.mensagem.value.trim()}`;
  window.open(wppLink(msg), '_blank', 'noopener');
});

// ===================== início =====================
if (!reduceMotion && store.get(INTRO_KEY) !== '1') playIntro();
else startPage();
