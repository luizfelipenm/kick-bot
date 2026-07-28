/**
 * /api/groq-comment
 *
 * Recebe as últimas mensagens do chat e devolve um comentário curto,
 * gerado pela IA (Groq / Llama 3.3 70B), reagindo ao que está rolando.
 *
 * A chave da API NUNCA vai ao navegador — fica só aqui,
 * como variável de ambiente no Vercel (GROQ_API_KEY).
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const { messages, persona } = req.body || {};
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'GROQ_API_KEY não configurada no servidor (Vercel → Environment Variables).'
    });
  }

  const chatContext = Array.isArray(messages) && messages.length
    ? messages.map(m => `${m.username || 'anon'}: ${m.content}`).join('\n')
    : '(sem mensagens recentes no chat)';

  const defaultPersona =
    'Você é um espectador brasileiro comum assistindo a uma live na Kick. ' +
    'Comente de forma curta (no máximo 1 frase, poucas palavras), casual, com gírias naturais de chat, ' +
    'reagindo ao que está acontecendo. Não se apresente, não diga que é uma IA ou bot — ' +
    'escreva só o comentário, como se fosse uma pessoa real digitando no chat.';

  const systemPrompt = (persona && persona.trim()) ? persona.trim() : defaultPersona;

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Últimas mensagens do chat:\n${chatContext}\n\nEscreva um comentário curto para o chat agora:` },
        ],
        max_tokens:  60,
        temperature: 0.9,
      }),
    });

    const data = await groqRes.json();

    if (!groqRes.ok) {
      return res.status(groqRes.status).json({
        error: data.error?.message || 'Erro ao gerar comentário com a IA.'
      });
    }

    const comment = data.choices?.[0]?.message?.content?.trim();
    if (!comment) {
      return res.status(500).json({ error: 'A IA devolveu uma resposta vazia.' });
    }

    return res.status(200).json({ comment });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
