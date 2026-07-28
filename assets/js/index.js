/* ============================================================
   ZIULBOT — index.js
   Scripts da landing page
   ============================================================ */

/* ── TERMINAL TYPEWRITER ─────────────────────────────── */
const TERM_ROWS = [
  [['tc','$ '], ['tg','ziulbot '], ['tw','--channel gaules --start']],
  [['tc','→ '], ['tw','Conectado ao canal '], ['tg','gaules']],
  [['tc','→ '], ['tw','5 mensagens na fila']],
  [['ty','✦ '], ['tw','Enviado: '], ['tc','"VAMOS VAMOS! 🔥"']],
  [['tc','→ '], ['tw','Próximo envio em '], ['tg','28.4s']],
  [['ty','✦ '], ['tw','Enviado: '], ['tc','"GG no chat! 👏"']],
  [['tc','→ '], ['tw','Próximo envio em '], ['tg','31.1s']],
];

function buildTerminal() {
  const body = document.getElementById('termBody');
  if (!body) return;
  body.innerHTML = '<span class="cursor"></span>';

  TERM_ROWS.forEach((row, ri) => {
    const div = document.createElement('div');
    div.className = 'term-line';
    div.style.animationDelay = (ri * 0.38 + 0.8) + 's';
    row.forEach(([cls, txt]) => {
      const sp = document.createElement('span');
      sp.className = cls;
      sp.textContent = txt;
      div.appendChild(sp);
    });
    body.insertBefore(div, body.lastChild);
  });
}

setTimeout(buildTerminal, 600);

/* ── SCROLL REVEAL ───────────────────────────────────── */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target); // dispara só uma vez
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ── NAV SHRINK ON SCROLL ────────────────────────────── */
const mainNav = document.getElementById('mainNav');
window.addEventListener('scroll', () => {
  mainNav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ── MOBILE MENU ─────────────────────────────────────── */
function toggleMenu() {
  document.getElementById('hamburger').classList.toggle('open');
  document.getElementById('mobileMenu').classList.toggle('open');
}

function closeMenu() {
  document.getElementById('hamburger').classList.remove('open');
  document.getElementById('mobileMenu').classList.remove('open');
}

// Fecha ao clicar fora
document.addEventListener('click', e => {
  const hb = document.getElementById('hamburger');
  const mm = document.getElementById('mobileMenu');
  if (!hb || !mm) return;
  if (!hb.contains(e.target) && !mm.contains(e.target)) {
    hb.classList.remove('open');
    mm.classList.remove('open');
  }
});
