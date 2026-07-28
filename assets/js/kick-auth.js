/* ============================================================
   ZIULBOT — kick-auth.js
   Gerencia o login OAuth 2.1 (PKCE) com a Kick.

   Fluxo:
   1. startKickLogin()      → gera PKCE, redireciona para a Kick
   2. handleOAuthCallback() → roda ao carregar a página, troca code por token
   3. getValidAccessToken() → devolve um token válido, renovando se preciso
   ============================================================ */

const KICK_AUTH_BASE = 'https://id.kick.com/oauth';
const STORAGE_KEY     = 'ziulbot_kick_auth';

// ── Helpers PKCE ──────────────────────────────────────
function base64url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function randomToken(len = 64) {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return base64url(arr.buffer).slice(0, len);
}

async function pkceChallenge(verifier) {
  const data   = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64url(digest);
}

// ── Storage ───────────────────────────────────────────
function saveAuth(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function loadAuth() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); }
  catch { return null; }
}
function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Verdadeiro se existe uma sessão Kick salva localmente
 * (não garante que o token ainda é válido — use getValidAccessToken para isso).
 */
function isConnected() {
  return !!loadAuth();
}

// ── Login ─────────────────────────────────────────────
async function startKickLogin() {
  if (!window.KICK_CONFIG || !window.KICK_CONFIG.clientId || window.KICK_CONFIG.clientId.startsWith('COLE_')) {
    log('ERR', 'Configure o Client ID em assets/js/kick-config.js antes de conectar.');
    return;
  }

  const verifier  = randomToken(64);
  const challenge = await pkceChallenge(verifier);
  const state     = randomToken(24);

  sessionStorage.setItem('kick_pkce_verifier', verifier);
  sessionStorage.setItem('kick_oauth_state', state);

  const url = new URL(`${KICK_AUTH_BASE}/authorize`);
  url.searchParams.set('client_id', window.KICK_CONFIG.clientId);
  url.searchParams.set('redirect_uri', window.KICK_CONFIG.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', window.KICK_CONFIG.scopes);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state', state);

  window.location.href = url.toString();
}

function disconnectKick() {
  clearAuth();
  log('WARN', 'Desconectado da Kick.');
  if (typeof updateConnUI === 'function') updateConnUI();
}

// ── Callback (roda ao carregar a página) ─────────────
async function handleOAuthCallback() {
  const params = new URLSearchParams(window.location.search);
  const code   = params.get('code');
  const state  = params.get('state');

  if (!code) return false; // não é um retorno de OAuth, segue o fluxo normal

  const expectedState = sessionStorage.getItem('kick_oauth_state');
  const verifier       = sessionStorage.getItem('kick_pkce_verifier');

  // Limpa a URL (?code=...&state=...) independentemente do resultado
  history.replaceState({}, '', window.location.pathname);

  if (!verifier || state !== expectedState) {
    log('ERR', 'Falha na verificação OAuth (state inválido). Tente conectar novamente.');
    return false;
  }

  try {
    const res = await fetch('/api/kick-token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        code_verifier: verifier,
        redirect_uri:  window.KICK_CONFIG.redirectUri,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao trocar código por token.');

    saveAuth({
      access_token:  data.access_token,
      refresh_token: data.refresh_token,
      expires_at:    Date.now() + data.expires_in * 1000,
    });
    log('INFO', 'Conectado à Kick com sucesso!');
  } catch (err) {
    log('ERR', `Falha ao conectar: ${err.message}`);
  }

  return true;
}

// ── Token válido (renova automaticamente se preciso) ──
async function getValidAccessToken() {
  let auth = loadAuth();
  if (!auth) return null;

  // Renova 60s antes de expirar
  if (Date.now() > auth.expires_at - 60000) {
    try {
      const res = await fetch('/api/kick-refresh', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ refresh_token: auth.refresh_token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao renovar token.');

      auth = {
        access_token:  data.access_token,
        refresh_token: data.refresh_token || auth.refresh_token,
        expires_at:    Date.now() + data.expires_in * 1000,
      };
      saveAuth(auth);
    } catch (err) {
      clearAuth();
      log('ERR', `Sessão expirada: ${err.message}. Conecte novamente.`);
      if (typeof updateConnUI === 'function') updateConnUI();
      return null;
    }
  }

  return auth.access_token;
}
