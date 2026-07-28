/* ============================================================
   ZIULBOT — kick-chat-listener.js
   Escuta o chat da Kick em tempo real via Pusher WebSocket
   (o mesmo canal que o site da Kick usa pra renderizar o chat).

   Depende da lib pusher-js, carregada via CDN no <head> do HTML:
   <script src="https://js.pusher.com/8.4.0/pusher.min.js"></script>
   ============================================================ */

const KICK_PUSHER_APP_KEY = '32cbd69e4b950bf97679';
const KICK_PUSHER_CLUSTER = 'us2';
const CHAT_BUFFER_MAX     = 40;

let chatBuffer      = [];
let pusherClient     = null;
let pusherChannelRef = null;
let chatConnected    = false;

/**
 * Busca o ID numérico da sala de chat (necessário para o canal do Pusher).
 * Endpoint público de leitura — não precisa de autenticação.
 */
async function getInternalChatroomId(channel) {
  const res = await fetch(`https://kick.com/api/v2/channels/${encodeURIComponent(channel)}`, {
    headers: { 'Accept': 'application/json' }
  });
  if (!res.ok) {
    throw new Error(`Canal "${channel}" não encontrado ao buscar sala de chat (HTTP ${res.status}).`);
  }
  const data = await res.json();
  const id = data && data.chatroom && data.chatroom.id;
  if (!id) {
    throw new Error('Não foi possível obter o ID da sala de chat.');
  }
  return id;
}

function pushChatMessage(username, content) {
  if (!content) return;
  chatBuffer.push({ username: username || 'anon', content: String(content) });
  if (chatBuffer.length > CHAT_BUFFER_MAX) chatBuffer.shift();
  if (typeof updateChatFeedUI === 'function') updateChatFeedUI();
}

function handlePusherEvent(data) {
  try {
    const content  = data?.message?.message ?? data?.content;
    const username = data?.user?.username   ?? data?.sender?.username;
    pushChatMessage(username, content);
  } catch (e) {
    // ignora eventos com formato inesperado
  }
}

/**
 * Conecta ao chat em tempo real do canal informado.
 */
async function connectKickChat(channel) {
  disconnectKickChat();

  if (typeof Pusher === 'undefined') {
    throw new Error('Biblioteca Pusher não carregada (verifique o <script> no HTML).');
  }

  const chatroomId = await getInternalChatroomId(channel);

  pusherClient = new Pusher(KICK_PUSHER_APP_KEY, { cluster: KICK_PUSHER_CLUSTER });
  pusherChannelRef = pusherClient.subscribe(`chatrooms.${chatroomId}`);

  pusherChannelRef.bind('App\\Events\\ChatMessageEvent', handlePusherEvent);
  pusherChannelRef.bind('App\\Events\\ChatMessageSentEvent', handlePusherEvent);

  chatConnected = true;
}

function disconnectKickChat() {
  if (pusherClient) {
    try { pusherClient.disconnect(); } catch (e) { /* noop */ }
  }
  pusherClient     = null;
  pusherChannelRef = null;
  chatConnected    = false;
  chatBuffer       = [];
  if (typeof updateChatFeedUI === 'function') updateChatFeedUI();
}

function isChatConnected() {
  return chatConnected;
}

/**
 * Devolve as últimas N mensagens capturadas do chat.
 */
function getRecentChatMessages(limit = 20) {
  return chatBuffer.slice(-limit);
}
