/**
 * bot.js
 *
 * Loop principal: conecta no chat, acumula mensagens, e a cada intervalo
 * gera um comentário (via IA, com fallback pra fila fixa) e envia.
 */
import { getValidAccessToken } from './kickAuth.js';
import { connectKickChat, getInternalChatroomId, getBroadcasterId, sendChatMessage } from './kickChat.js';
import { generateComment } from './groq.js';

const CHANNEL   = process.env.KICK_CHANNEL;
const INTERVAL_S = parseInt(process.env.INTERVAL_SECONDS || '30', 10);
const JITTER_S   = parseInt(process.env.JITTER_SECONDS   || '8',  10);
const PERSONA    = process.env.PERSONA || '';
const FALLBACK_MESSAGES = (process.env.FALLBACK_MESSAGES || 'Boa live! 🔥,GG chat 👏')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const BUFFER_MAX = 40;
let chatBuffer = [];

// Estado exposto pro health-check (server.js)
export const state = {
  status: 'starting',
  sent: 0,
  errors: 0,
  startedAt: Date.now(),
  lastMessage: null,
  lastError: null,
};

function log(...args) {
  console.log(`[${new Date().toISOString()}]`, ...args);
}

function onChatMessage(msg) {
  chatBuffer.push(msg);
  if (chatBuffer.length > BUFFER_MAX) chatBuffer.shift();
}

function pickFallback() {
  return FALLBACK_MESSAGES[Math.floor(Math.random() * FALLBACK_MESSAGES.length)] || 'Boa live! 🔥';
}

async function sendLoop(broadcasterId) {
  while (true) {
    const delay = (INTERVAL_S + (Math.random() * JITTER_S * 2 - JITTER_S)) * 1000;
    await new Promise(r => setTimeout(r, Math.max(delay, 1000)));

    let comment;
    try {
      comment = await generateComment(chatBuffer.slice(-20), PERSONA);
      log('IA gerou:', comment);
    } catch (err) {
      comment = pickFallback();
      log('IA falhou, usando fallback:', err.message, '→', comment);
    }

    try {
      const token = await getValidAccessToken();
      await sendChatMessage(token, broadcasterId, comment);
      state.sent++;
      state.lastMessage = comment;
      log('Enviado:', comment);
    } catch (err) {
      state.errors++;
      state.lastError = err.message;
      log('Erro no envio:', err.message);
    }
  }
}

export async function startWorker() {
  if (!CHANNEL) throw new Error('Defina KICK_CHANNEL no .env');

  log('Iniciando worker para canal', CHANNEL);

  const token         = await getValidAccessToken();
  const broadcasterId = await getBroadcasterId(CHANNEL, token);
  const chatroomId    = await getInternalChatroomId(CHANNEL);

  log('broadcaster_user_id:', broadcasterId, '| chatroom_id:', chatroomId);

  connectKickChat(chatroomId, onChatMessage, log);

  state.status = 'running';
  await sendLoop(broadcasterId);
}
