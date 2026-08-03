# ⚡ ZIULBOT Worker — rodando em segundo plano

Versão do bot que roda **sem navegador aberto e sem o computador ligado** — um processo Node.js
independente, hospedado 24/7 em um serviço gratuito.

## Arquitetura

Diferente do `kick-bot.html` (que roda no navegador), este worker:
- Conecta direto no WebSocket da Kick (sem precisar de aba aberta)
- Guarda o token de sessão no **Supabase** (não em `localStorage`, que só existe no navegador)
- Gera comentários com IA (Groq) e envia sozinho, em loop infinito
- Expõe um mini endpoint HTTP (`/`) só pra satisfazer o requisito de "Web Service" do Koyeb

---

## 1. Criar a tabela no Supabase

No painel do seu projeto Supabase → **SQL Editor** → cole e rode:

```sql
create table if not exists kick_bot_state (
  id text primary key default 'default',
  access_token text,
  refresh_token text not null,
  expires_at bigint not null,
  channel text,
  updated_at timestamptz default now()
);
```

> Se você já criou a tabela antes (sem a coluna `channel`), rode também:
> ```sql
> alter table kick_bot_state add column if not exists channel text;
> ```

Depois, em **Settings → API**, copie:
- **Project URL** → vai virar `SUPABASE_URL`
- **service_role key** (não a `anon`!) → vai virar `SUPABASE_SERVICE_KEY`

> ⚠️ A `service_role key` tem acesso total ao banco — nunca a exponha no navegador ou em código público. Ela só deve existir nas variáveis de ambiente do worker.

---

## 🔀 Trocar de canal sem precisar entrar na EC2

O worker lê o canal ativo direto do Supabase (coluna `channel` na tabela `kick_bot_state`), não do `.env`. O `KICK_CHANNEL` no `.env` só é usado **uma vez**, na primeira execução, pra preencher essa coluna caso ela ainda esteja vazia.

Pra trocar de canal depois, é só editar esse valor **direto no painel do Supabase**:
- **Table Editor** → tabela `kick_bot_state` → clique na célula `channel` → digite o novo nome do canal → salve

O worker confere essa coluna a cada 1 minuto e troca de canal sozinho — reconecta o chat, resolve os novos IDs, tudo automático. Não precisa reiniciar o processo nem entrar na EC2.

---

## 2. Conectar sua conta Kick uma única vez

O worker precisa de um `refresh_token` inicial pra começar. Pra conseguir isso:

1. Abra `kick-bot.html` no navegador normalmente
2. Clique em **"🔗 Conectar com Kick"** e autorize
3. Abra o Console (F12) e rode:
   ```js
   JSON.parse(localStorage.getItem('ziulbot_kick_auth')).refresh_token
   ```
4. Copie o valor retornado

---

## 3. Configurar o `.env`

```bash
cd worker
cp .env.example .env
```

Preencha todos os campos do `.env`, incluindo o `KICK_INITIAL_REFRESH_TOKEN` do passo anterior.

---

## 4. Rodar o bootstrap (uma única vez)

```bash
npm install
npm run bootstrap
```

Se der certo, você verá `✅ Tokens salvos no Supabase com sucesso!`. A partir daqui, o
`KICK_INITIAL_REFRESH_TOKEN` não é mais necessário (pode até remover do `.env`).

---

## 5. Testar localmente

```bash
npm start
```

Acompanhe os logs no terminal. Se aparecer `Enviado: ...` periodicamente, está funcionando.
Pressione `Ctrl+C` pra parar.

---

## 6. Deploy no Koyeb (grátis, 24/7)

1. Suba a pasta `worker/` para um repositório Git (pode ser o mesmo `kick-bot` ou um novo, só o
   Koyeb precisa apontar pra essa subpasta)
2. Em [koyeb.com](https://www.koyeb.com), crie um novo **Web Service** a partir do repositório
3. Configure:
   - **Build**: detecta Node.js automaticamente (usa o `package.json`)
   - **Run command**: `npm start`
   - **Port**: `8000` (ou o valor que você definir em `PORT`)
   - **Instance**: Free (512MB RAM, 0.1 vCPU)
4. Adicione todas as variáveis do `.env` (exceto `KICK_INITIAL_REFRESH_TOKEN`) em
   **Environment Variables** no painel do Koyeb
5. Deploy!

### ⚠️ Importante: evitar que o Koyeb desligue o bot

O plano grátis do Koyeb **desliga automaticamente depois de 1 hora sem tráfego HTTP** — e como
nosso bot não recebe requisições normalmente, ele seria desligado mesmo estando ativo.

**Solução gratuita — UptimeRobot:**
1. Crie uma conta grátis em [uptimerobot.com](https://uptimerobot.com)
2. Adicione um novo monitor do tipo **HTTP(s)**
3. Cole a URL pública que o Koyeb te deu (ex: `https://seu-app.koyeb.app`)
4. Defina o intervalo de checagem pra **5 minutos**

Isso faz o UptimeRobot "bater" no seu worker a cada 5 minutos, contando como tráfego e
mantendo o Koyeb sempre ligado.

---

## Variáveis de ambiente (resumo)

| Variável | Onde conseguir |
|---|---|
| `KICK_CLIENT_ID` / `KICK_CLIENT_SECRET` | kick.com/settings/developer |
| `KICK_CHANNEL` | Nome do canal (ex: `odudutips`) |
| `GROQ_API_KEY` | console.groq.com/keys |
| `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` | Painel do Supabase → Settings → API |
| `PORT` | `8000` (ou o que o Koyeb pedir) |
| `INTERVAL_SECONDS` / `JITTER_SECONDS` | Timing dos comentários |
| `PERSONA` | Instruções de estilo pra IA (opcional) |
| `FALLBACK_MESSAGES` | Mensagens caso a IA falhe, separadas por vírgula |

---

## Estrutura dos arquivos

```
worker/
├── server.js           # Ponto de entrada — sobe o health-check + inicia o bot
├── bot.js              # Loop principal (chat → IA → envio)
├── kickChat.js         # WebSocket Pusher + API oficial da Kick
├── kickAuth.js         # Renovação automática do token
├── groq.js             # Geração de comentários via IA
├── tokenStore.js        # Persistência do token no Supabase
├── bootstrap-token.js   # Script de configuração inicial (roda uma vez)
├── .env.example
└── package.json
```
