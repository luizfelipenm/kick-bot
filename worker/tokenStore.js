/**
 * tokenStore.js
 *
 * Guarda o access_token / refresh_token da Kick de forma persistente no Supabase,
 * pra sobreviver a reinícios do worker (diferente de localStorage, que só existe no navegador).
 *
 * Tabela necessária no Supabase (rode uma vez no SQL Editor):
 *
 *   create table if not exists kick_bot_state (
 *     id text primary key default 'default',
 *     access_token text,
 *     refresh_token text not null,
 *     expires_at bigint not null,
 *     updated_at timestamptz default now()
 *   );
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export async function loadTokens() {
  const { data, error } = await supabase
    .from('kick_bot_state')
    .select('*')
    .eq('id', 'default')
    .single();

  if (error) {
    throw new Error(`Falha ao ler tokens do Supabase: ${error.message}`);
  }
  return data;
}

export async function saveTokens({ access_token, refresh_token, expires_at }) {
  const { error } = await supabase
    .from('kick_bot_state')
    .upsert({
      id: 'default',
      access_token,
      refresh_token,
      expires_at,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    throw new Error(`Falha ao salvar tokens no Supabase: ${error.message}`);
  }
}

/**
 * Lê o canal ativo (coluna "channel" da mesma tabela).
 * Devolve null se ainda não tiver sido definido.
 */
export async function loadChannel() {
  const { data, error } = await supabase
    .from('kick_bot_state')
    .select('channel')
    .eq('id', 'default')
    .single();

  if (error) {
    throw new Error(`Falha ao ler canal do Supabase: ${error.message}`);
  }
  return data?.channel || null;
}

/**
 * Atualiza o canal ativo. Trocar esse valor direto no Supabase
 * (Table Editor ou SQL) faz o worker migrar de canal automaticamente,
 * sem precisar reiniciar nem entrar na EC2.
 */
export async function saveChannel(channel) {
  const { error } = await supabase
    .from('kick_bot_state')
    .update({ channel, updated_at: new Date().toISOString() })
    .eq('id', 'default');

  if (error) {
    throw new Error(`Falha ao salvar canal no Supabase: ${error.message}`);
  }
}
