/* ============================================================
   ZIULBOT — kick-config.js
   Configuração pública do OAuth da Kick.

   O client_id NÃO é segredo — pode ficar aqui, visível no navegador.
   O client_secret NUNCA vai neste arquivo — ele fica só no Vercel,
   como variável de ambiente (veja api/kick-token.js).

   COMO CONFIGURAR:
   1. Acesse https://kick.com/settings/developer
   2. Crie um app e defina o Redirect URI EXATAMENTE igual ao redirectUri abaixo
   3. Copie o Client ID gerado e cole em CLIENT_ID abaixo
   4. No Vercel: Settings → Environment Variables → adicione:
        KICK_CLIENT_ID     = mesmo Client ID
        KICK_CLIENT_SECRET = o Client Secret (não compartilhe isso em lugar nenhum)
   ============================================================ */

window.KICK_CONFIG = {
  clientId:    '01KYMPSSMR73HXZ9C53KNFRBM4',
  redirectUri: 'https://ziulbot.digital/kick-bot.html', // ajuste para o seu domínio real
  scopes:      'chat:write channel:read',
};
