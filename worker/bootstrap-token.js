/**
 * bootstrap-token.js
 *
 * Roda UMA VEZ, localmente, pra semear o Supabase com o refresh_token
 * inicial (obtido do navegador depois de clicar "Conectar com Kick" em kick-bot.html).
 *
 * Uso: npm run bootstrap
 */
import 'dotenv/config';
import { saveTokens } from './tokenStore.js';

const refreshToken = process.env.KICK_INITIAL_REFRESH_TOKEN;
const clientId     = process.env.KICK_CLIENT_ID;
const clientSecret = process.env.KICK_CLIENT_SECRET;

if (!refreshToken) {
  console.error('❌ Defina KICK_INITIAL_REFRESH_TOKEN no .env antes de rodar este script.');
  console.error('   Pegue o valor no navegador (depois de conectar em kick-bot.html):');
  console.error("   F12 → Console → JSON.parse(localStorage.getItem('ziulbot_kick_auth')).refresh_token");
  process.exit(1);
}

if (!clientId || !clientSecret) {
  console.error('❌ Defina KICK_CLIENT_ID e KICK_CLIENT_SECRET no .env antes de rodar este script.');
  process.exit(1);
}

console.log('Validando o refresh_token com a Kick...');

const params = new URLSearchParams({
  grant_type:    'refresh_token',
  client_id:     clientId,
  client_secret: clientSecret,
  refresh_token: refreshToken,
});

const res = await fetch('https://id.kick.com/oauth/token', {
  method:  'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body:    params.toString(),
});

const data = await res.json();

if (!res.ok) {
  console.error('❌ Falha ao validar refresh_token:', data.error_description || data.error || data);
  process.exit(1);
}

await saveTokens({
  access_token:  data.access_token,
  refresh_token: data.refresh_token || refreshToken,
  expires_at:    Date.now() + data.expires_in * 1000,
});

console.log('✅ Tokens salvos no Supabase com sucesso! O worker já pode rodar sozinho a partir de agora.');
process.exit(0);
