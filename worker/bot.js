/**
 * bot.js
 *
 * Loop principal: conecta no chat, acumula mensagens, e a cada intervalo
 * gera um comentário (via IA, com fallback pra fila fixa) e envia.
 *
 * O canal ativo vem do Supabase (coluna "channel" em kick_bot_state).
 * Trocar esse valor direto no Supabase faz o worker migrar de canal
 * automaticamente, sem precisar reiniciar nem entrar na EC2.
 * KICK_CHANNEL no .env só serve como valor inicial (usado uma vez,
 * pra semear o Supabase, caso a coluna ainda esteja vazia).
 */
import { getValidAccessToken } from './kickAuth.js';
import { connectKickChat, getInternalChatroomId, getBroadcasterId, sendChatMessage } from './kickChat.js';
import { generateComment } from './groq.js';
import { loadChannel, saveChannel } from './tokenStore.js';

const CHANNEL_ENV_FALLBACK = process.env.KICK_CHANNEL || '';
const INTERVAL_S = parseInt(process.env.INTERVAL_SECONDS || '30', 10);
const JITTER_S   = parseInt(process.env.JITTER_SECONDS   || '8',  10);
const PERSONA    = process.env.PERSONA || '';
const FALLBACK_MESSAGES = (process.env.FALLBACK_MESSAGES || 'Boa live! 🔥,GG chat 👏')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const CHANNEL_CHECK_INTERVAL_MS = 60_000; // confere troca de canal a cada 1 minuto
const BUFFER_MAX = 40;

let chatBuffer          = [];
let currentChannel       = null;
let currentBroadcasterId = null;
let chatHandle           = null; // controller devolvido por connectKickChat (permite .close())

// Estado exposto pro health-check (server.js)
export const state = {
  status: 'starting',
  channel: null,
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

/**
 * Troca o canal ativo: resolve os IDs, reconecta o chat, atualiza o estado.
 */
async function switchChannel(newChannel, token) {
  log(`Trocando para o canal "${newChannel}"...`);

  const broadcasterId = await getBroadcasterId(newChannel, token);
  const chatroomId    = await getInternalChatroomId(newChannel);

  if (chatHandle) chatHandle.close();
  chatBuffer = [];
  chatHandle = connectKickChat(chatroomId, onChatMessage, log);

  currentChannel       = newChannel;
  currentBroadcasterId = broadcasterId;
  state.channel = newChannel;

  log(`Canal ativo: "${newChannel}" | broadcaster_user_id ${broadcasterId} | chatroom_id ${chatroomId}`);
}

/**
 * Roda em paralelo ao loop de envio — confere periodicamente se o canal
 * mudou no Supabase e, se sim, troca sem precisar reiniciar o processo.
 */
async function channelWatcher() {
  while (true) {
    await new Promise(r => setTimeout(r, CHANNEL_CHECK_INTERVAL_MS));
    try {
      const desired = await loadChannel();
      if (desired && desired !== currentChannel) {
        const token = await getValidAccessToken();
        await switchChannel(desired, token);
      }
    } catch (err) {
      log('Erro ao checar troca de canal:', err.message);
    }
  }
}

async function sendLoop() {
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
      await sendChatMessage(token, currentBroadcasterId, comment);
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
  const token = await getValidAccessToken();

  let initialChannel = await loadChannel();
  if (!initialChannel) {
    if (!CHANNEL_ENV_FALLBACK) {
      throw new Error('Defina KICK_CHANNEL no .env (valor inicial) ou o canal "channel" na tabela kick_bot_state do Supabase.');
    }
    initialChannel = CHANNEL_ENV_FALLBACK;
    await saveChannel(initialChannel);
    log(`Canal inicial "${initialChannel}" salvo no Supabase (a partir do .env).`);
  }

  await switchChannel(initialChannel, token);

  state.status = 'running';

  channelWatcher(); // roda em paralelo, não bloqueia o loop de envio
  await sendLoop();
}
