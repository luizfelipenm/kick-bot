/**
 * /api/kick-refresh
 *
 * Renova um access_token expirado usando o refresh_token.
 * Mesma lógica de /api/kick-token: client_secret só existe aqui no servidor.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const { refresh_token } = req.body || {};

  if (!refresh_token) {
    return res.status(400).json({ error: 'Parâmetro refresh_token ausente.' });
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
      grant_type:    'refresh_token',
      client_id:     clientId,
      client_secret: clientSecret,
      refresh_token,
    });

    const tokenRes = await fetch('https://id.kick.com/oauth/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    params.toString(),
    });

    const data = await tokenRes.json();

    if (!tokenRes.ok) {
      return res.status(tokenRes.status).json({
        error: data.error_description || data.error || 'Falha ao renovar token.'
      });
    }

    return res.status(200).json({
      access_token:  data.access_token,
      refresh_token: data.refresh_token || refresh_token,
      expires_in:    data.expires_in,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
