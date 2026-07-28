/**
 * /api/kick-token
 *
 * Troca o "code" do OAuth (PKCE) por um access_token/refresh_token.
 * O client_secret NUNCA é enviado ao navegador — fica só aqui,
 * como variável de ambiente no Vercel (KICK_CLIENT_SECRET).
 *
 * Configurar no painel do Vercel → Settings → Environment Variables:
 *   KICK_CLIENT_ID     = (o client_id do seu app Kick)
 *   KICK_CLIENT_SECRET = (o client_secret do seu app Kick)
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const { code, code_verifier, redirect_uri } = req.body || {};

  if (!code || !code_verifier || !redirect_uri) {
    return res.status(400).json({ error: 'Parâmetros ausentes: code, code_verifier ou redirect_uri.' });
  }

  const clientId     = process.env.KICK_CLIENT_ID;
  const clientSecret = process.env.KICK_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({
      error: 'KICK_CLIENT_ID / KICK_CLIENT_SECRET não configurados no servidor (Vercel → Environment Variables).'
    });
  }

  try {
    const params = new URLSearchParams({
      grant_type:    'authorization_code',
      client_id:     clientId,
      client_secret: clientSecret,
      redirect_uri,
      code,
      code_verifier,
    });

    const tokenRes = await fetch('https://id.kick.com/oauth/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    params.toString(),
    });

    const data = await tokenRes.json();

    if (!tokenRes.ok) {
      return res.status(tokenRes.status).json({
        error: data.error_description || data.error || 'Falha ao trocar código por token.'
      });
    }

    return res.status(200).json({
      access_token:  data.access_token,
      refresh_token: data.refresh_token,
      expires_in:    data.expires_in,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
