/* ============================================================
   ZIULBOT — bot.js
   Lógica completa do Kick Chat Bot
   ============================================================ */

// ── STATE ─────────────────────────────────────────────
let msgs    = [];
let running = false;
let sendTimer, progTimer, uptimeTimer;
let idx = 0, sent = 0, errs = 0;
let t0, nextAt, totalMs;

// ── MENSAGENS ─────────────────────────────────────────
function addMessage() {
  const el = document.getElementById('msgInput');
  const v  = el.value.trim();
  if (!v) return;
  msgs.push(v);
  el.value = '';
  renderMsgs();
  log('INFO', `Mensagem #${msgs.length} adicionada`);
  updateStats();
}

document.getElementById('msgInput').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addMessage(); }
});

function removeMsg(i) {
  msgs.splice(i, 1);
  renderMsgs();
  updateStats();
}

function clearMessages() {
  msgs = []; idx = 0;
  renderMsgs();
  updateStats();
  log('WARN', 'Fila de mensagens limpa.');
}

function renderMsgs() {
  const el = document.getElementById('msgList');
  if (!msgs.length) {
    el.innerHTML = '<div class="empty-msg">Nenhuma mensagem</div>';
    return;
  }
  el.innerHTML = msgs.map((m, i) => `
    <div class="msg-item">
      <span class="mi-idx">${String(i + 1).padStart(2, '0')}</span>
      <span class="mi-text">${esc(m)}</span>
      <button class="mi-del" onclick="removeMsg(${i})" title="Remover">✕</button>
    </div>
  `).join('');
}

// ── BOT CORE ──────────────────────────────────────────
function startBot() {
  const ch = document.getElementById('channelInput').value.trim();
  const tk = document.getElementById('tokenInput').value.trim();

  if (!ch)          { log('ERR',  'Informe o nome do canal.'); return; }
  if (!tk)          { log('ERR',  'Informe o token de sessão.'); return; }
  if (!msgs.length) { log('WARN', 'Adicione pelo menos uma mensagem antes de iniciar.'); return; }

  running = true; t0 = Date.now(); sent = 0; errs = 0; idx = 0;
  setStatus('on', 'RODANDO');
  document.getElementById('startBtn').style.display = 'none';
  document.getElementById('stopBtn').style.display  = '';
  document.getElementById('nextBar').style.display  = '';

  log('INFO', `Bot iniciado → kick.com/${ch}`);
  log('INFO', `Modo: ${document.getElementById('modeSelect').value} · Intervalo: ${document.getElementById('intervalInput').value}s`);

  startUptime();
  schedule();
}

function stopBot() {
  running = false;
  clearTimeout(sendTimer);
  clearInterval(progTimer);
  clearInterval(uptimeTimer);

  setStatus('', 'INATIVO');
  document.getElementById('startBtn').style.display = '';
  document.getElementById('stopBtn').style.display  = 'none';
  document.getElementById('nextBar').style.display  = 'none';
  document.getElementById('progressFill').style.width = '0%';

  log('WARN', `Bot parado. Total enviado: ${sent} mensagens.`);
}

function schedule() {
  if (!running) return;
  const base  = parseInt(document.getElementById('intervalInput').value) || 30;
  const j     = parseInt(document.getElementById('jitterInput').value)   || 0;
  const delay = (base + (Math.random() * j * 2 - j)) * 1000;
  totalMs = delay;
  nextAt  = Date.now() + delay;

  log('INFO', `Próxima mensagem em ${(delay / 1000).toFixed(1)}s`);
  startProgress(delay);

  sendTimer = setTimeout(async () => {
    if (!running) return;
    await doSend();
    schedule();
  }, delay);
}

async function doSend() {
  const ch    = document.getElementById('channelInput').value.trim();
  const tk    = document.getElementById('tokenInput').value.trim();
  const mode  = document.getElementById('modeSelect').value;
  const human = document.getElementById('humanToggle').checked;

  const msg = mode === 'random'
    ? msgs[Math.floor(Math.random() * msgs.length)]
    : msgs[idx++ % msgs.length];

  if (human) await sleep(800 + Math.random() * 1400);

  try {
    const res = await fetch(
      `https://kick.com/api/v2/messages/send/${encodeURIComponent(ch)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${tk}`,
          'Accept':        'application/json',
          'X-Socket-ID':   `${rnd()}.${rnd()}`,
        },
        body: JSON.stringify({ content: msg, type: 'message' }),
      }
    );

    if (res.ok) {
      sent++;
      log('SENT', `→ "${msg.length > 60 ? msg.substring(0, 60) + '…' : msg}"`, 'sent');
    } else if (res.status === 401) {
      errs++;
      log('ERR', 'Token inválido ou expirado (401). Verifique suas credenciais.');
      if (document.getElementById('autoStopToggle').checked) stopBot();
    } else if (res.status === 422) {
      errs++;
      log('ERR', 'Erro 422: canal não encontrado ou sem permissão para comentar.');
    } else if (res.status === 429) {
      errs++;
      log('WARN', 'Rate limit (429) — aguardando próximo ciclo.');
    } else {
      errs++;
      log('ERR', `HTTP ${res.status}: ${res.statusText}`);
    }
  } catch (err) {
    errs++;
    if (err.name === 'TypeError') {
      log('ERR', 'CORS bloqueado. Use a extensão "CORS Unblock" no Chrome/Firefox ou um proxy local.');
    } else {
      log('ERR', `Erro de rede: ${err.message}`);
    }
  }

  updateStats();
}

// ── UI HELPERS ────────────────────────────────────────
function setStatus(type, text) {
  document.getElementById('sdot').className  = 'sdot' + (type ? ' ' + type : '');
  document.getElementById('stext').textContent = text;
}

function startProgress(dur) {
  clearInterval(progTimer);
  const bar = document.getElementById('progressFill');
  const lbl = document.getElementById('nextLabel');
  bar.style.width = '0%';

  progTimer = setInterval(() => {
    if (!running) { clearInterval(progTimer); return; }
    const elapsed = Date.now() - (nextAt - dur);
    const pct     = Math.min(100, (elapsed / dur) * 100);
    bar.style.width = pct + '%';
    lbl.textContent = Math.max(0, (nextAt - Date.now()) / 1000).toFixed(1) + 's';
    if (pct >= 100) clearInterval(progTimer);
  }, 180);
}

function startUptime() {
  clearInterval(uptimeTimer);
  uptimeTimer = setInterval(() => {
    if (!running) return;
    const s  = Math.floor((Date.now() - t0) / 1000);
    const m  = Math.floor(s / 60);
    const ss = s % 60;
    document.getElementById('statUp').textContent =
      String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
  }, 1000);
}

function updateStats() {
  document.getElementById('statSent').textContent = sent;
  document.getElementById('statErr').textContent  = errs;
  document.getElementById('statQ').textContent    = msgs.length;
}

// ── LOG ───────────────────────────────────────────────
function log(type, msg, cls) {
  const body = document.getElementById('logBody');
  const time = new Date().toTimeString().slice(0, 8);
  const tc   = cls || ({ INFO:'info', WARN:'warn', ERR:'err', SENT:'sent' }[type] || 'info');

  const el = document.createElement('div');
  el.className = 'log-entry';
  el.innerHTML = `
    <span class="le-time">${time}</span>
    <span class="le-type ${tc}">${type}</span>
    <span class="le-msg">${esc(msg)}</span>
  `;
  body.appendChild(el);
  body.scrollTop = body.scrollHeight;
  while (body.children.length > 300) body.removeChild(body.firstChild);
}

function clearLog() {
  document.getElementById('logBody').innerHTML = '';
  log('INFO', 'Log limpo.');
}

// ── INIT ──────────────────────────────────────────────
msgs = [
  'VAMOS VAMOS! 🔥',
  'Que jogo incrível! PogChamp',
  'GG no chat quem tá acompanhando! 👏',
  'Essa live tá demais 🎮',
  'Bora pra cima!! 💪',
];
renderMsgs();
updateStats();
