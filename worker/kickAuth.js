/**
 * kickAuth.js
 *
 * Mantém um access_token válido, renovando automaticamente via refresh_token
 * (guardado no Supabase) quando ele está perto de expirar.
 */
import { loadTokens, saveTokens } from './tokenStore.js';

const clientId     = process.env.KICK_CLIENT_ID;
const clientSecret = process.env.KICK_CLIENT_SECRET;

export async function getValidAccessToken() {
  let tokens = await loadTokens();

  // Renova 60s antes de expirar
  if (Date.now() > tokens.expires_at - 60_000) {
    const params = new URLSearchParams({
      grant_type:    'refresh_token',
      client_id:     clientId,
      client_secret: clientSecret,
      refresh_token: tokens.refresh_token,
    });

    const res = await fetch('https://id.kick.com/oauth/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    params.toString(),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error_description || data.error || 'Falha ao renovar token da Kick.');
    }

    tokens = {
      access_token:  data.access_token,
      refresh_token: data.refresh_token || tokens.refresh_token,
      expires_at:    Date.now() + data.expires_in * 1000,
    };
    await saveTokens(tokens);
  }

  return tokens.access_token;
}
