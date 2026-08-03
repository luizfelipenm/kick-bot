/**
 * kickChat.js
 *
 * Cliente Kick para o worker Node:
 *  - connectKickChat: conecta no WebSocket Pusher (protocolo cru, sem depender de libs de navegador)
 *  - getInternalChatroomId / getBroadcasterId: resolvem os IDs necessários
 *  - sendChatMessage: envia mensagem via API oficial da Kick
 */
import WebSocket from 'ws';

const PUSHER_KEY     = '32cbd69e4b950bf97679';
const PUSHER_CLUSTER = 'us2';
const WS_URL = `wss://ws-${PUSHER_CLUSTER}.pusher.com/app/${PUSHER_KEY}?protocol=7&client=js&version=8.4.0&flash=false`;

/**
 * Conecta ao chat em tempo real de uma sala e chama onMessage({username, content})
 * para cada mensagem recebida. Reconecta automaticamente se a conexão cair.
 */
export function connectKickChat(chatroomId, onMessage, log = console.log) {
  let ws;
  let pingInterval;

  function connect() {
    ws = new WebSocket(WS_URL);

    ws.on('open', () => {
      log('[chat] WebSocket conectado, aguardando handshake...');
    });

    ws.on('message', (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (msg.event === 'pusher:connection_established') {
        ws.send(JSON.stringify({
          event: 'pusher:subscribe',
          data:  { channel: `chatrooms.${chatroomId}` },
        }));

        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ event: 'pusher:ping', data: {} }));
          }
        }, 30_000);

        log(`[chat] Inscrito em chatrooms.${chatroomId}`);
        return;
      }

      if (
        msg.event === 'App\\Events\\ChatMessageEvent' ||
        msg.event === 'App\\Events\\ChatMessageSentEvent'
      ) {
        try {
          const payload  = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
          const content  = payload?.message?.message ?? payload?.content;
          const username = payload?.user?.username   ?? payload?.sender?.username;
          if (content) onMessage({ username: username || 'anon', content });
        } catch {
          // ignora eventos com formato inesperado
        }
      }
    });

    ws.on('close', () => {
      log('[chat] Conexão fechada, reconectando em 5s...');
      clearInterval(pingInterval);
      setTimeout(connect, 5000);
    });

    ws.on('error', (err) => {
      log('[chat] Erro no WebSocket:', err.message);
    });
  }

  connect();
}

/**
 * ID da sala de chat (usado no WebSocket) — leitura pública, sem autenticação.
 */
export async function getInternalChatroomId(channel) {
  const res = await fetch(`https://kick.com/api/v2/channels/${encodeURIComponent(channel)}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Canal "${channel}" não encontrado ao buscar sala de chat (HTTP ${res.status}).`);
  }
  const data = await res.json();
  const id = data?.chatroom?.id;
  if (!id) throw new Error('Não foi possível obter o ID da sala de chat.');
  return id;
}

/**
 * broadcaster_user_id (usado pra enviar mensagem) — via API oficial.
 */
export async function getBroadcasterId(channel, token) {
  const res = await fetch(`https://api.kick.com/public/v1/channels?slug=${encodeURIComponent(channel)}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Canal "${channel}" não encontrado (HTTP ${res.status}).`);
  }
  const json = await res.json();
  const item = json.data?.[0];
  if (!item) throw new Error(`Canal "${channel}" não encontrado na resposta da API.`);
  return item.broadcaster_user_id;
}

/**
 * Envia uma mensagem no chat via API oficial da Kick.
 */
export async function sendChatMessage(token, broadcasterId, content) {
  const res = await fetch('https://api.kick.com/public/v1/chat', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      broadcaster_user_id: broadcasterId,
      content,
      type: 'user',
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}${text ? ' — ' + text.slice(0, 150) : ''}`);
  }
}
