/**
 * groq.js
 *
 * Gera um comentário curto com base nas últimas mensagens do chat.
 * O worker já roda num ambiente seguro (servidor), então a chave fica só no .env.
 */
const apiKey = process.env.GROQ_API_KEY;

const DEFAULT_PERSONA =
  'Você é um espectador brasileiro comum assistindo a uma live na Kick. ' +
  'Comente de forma curta (no máximo 1 frase, poucas palavras), casual, com gírias naturais de chat, ' +
  'reagindo ao que está acontecendo. Não se apresente, não diga que é uma IA ou bot — ' +
  'escreva só o comentário, como se fosse uma pessoa real digitando no chat.';

export async function generateComment(messages, persona) {
  if (!apiKey) {
    throw new Error('GROQ_API_KEY não definida no .env');
  }

  const chatContext = messages && messages.length
    ? messages.map(m => `${m.username}: ${m.content}`).join('\n')
    : '(sem mensagens recentes no chat)';

  const systemPrompt = (persona && persona.trim()) ? persona.trim() : DEFAULT_PERSONA;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method:  'POST',
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

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message || 'Erro ao gerar comentário com a IA.');
  }

  const comment = data.choices?.[0]?.message?.content?.trim();
  if (!comment) throw new Error('A IA devolveu uma resposta vazia.');

  return comment;
}
