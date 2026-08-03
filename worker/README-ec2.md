# 🖥️ Deploy do ZIULBOT Worker na EC2

Guia específico pra rodar o worker numa instância EC2 — mais simples que o Koyeb nesse caso,
porque uma VM de verdade não desliga sozinha por inatividade (não precisa de UptimeRobot).

> ⚠️ Sua conta AWS usa o modelo de créditos (pós-15/07/2025): $100-200 válidos por **6 meses**.
> Depois disso, ou o crédito acaba e a conta fecha (Free Plan), ou passa a cobrar (Paid Plan).
> Um `t3.micro` rodando 24/7 custa pouco (~$7-8/mês fora do crédito), mas **configure um alarme
> de billing** (Passo 6) e um lembrete de calendário pra daqui uns 5 meses.

---

## 1. Lançar a instância

No console EC2:
- **AMI**: Ubuntu Server 24.04 LTS
- **Tipo de instância**: `t3.micro` (ou `t2.micro`, o que estiver elegível)
- **Par de chaves**: crie um novo `.pem` (ou use um existente) e guarde num lugar seguro
- **Security Group**: libere apenas a porta **22 (SSH)** — o bot não precisa receber tráfego
  público, só faz conexões de saída (chat da Kick, Groq, Supabase)
- **Storage**: 8GB gp3 já é suficiente

## 2. Conectar via SSH

```bash
chmod 400 sua-chave.pem
ssh -i sua-chave.pem ubuntu@SEU_IP_PUBLICO
```

## 3. Instalar Node.js e o PM2

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v   # confirme que é 18+

sudo npm install -g pm2
```

## 4. Subir o código

Clone o repositório (ou copie a pasta `worker/` via `scp`):

```bash
git clone https://github.com/SEU_USUARIO/kick-bot.git
cd kick-bot/worker
npm install
```

## 5. Configurar o `.env`

```bash
cp .env.example .env
nano .env
```

Preencha todos os campos (mesmos do guia principal: `KICK_CLIENT_ID`, `KICK_CLIENT_SECRET`,
`KICK_CHANNEL`, `GROQ_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, etc.)

Depois, rode o bootstrap (uma única vez, com o `KICK_INITIAL_REFRESH_TOKEN` preenchido):

```bash
npm run bootstrap
```

## 6. Configurar um alarme de billing (recomendado)

No console AWS → **Billing → Budgets** → crie um orçamento simples avisando por e-mail quando
o gasto passar de, digamos, $5. Leva 2 minutos e evita surpresa.

## 7. Rodar com PM2 (fica ligado mesmo se você desconectar do SSH)

```bash
mkdir -p logs
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

O último comando (`pm2 startup`) vai imprimir uma linha de comando — **copie e cole ela** pra
o PM2 também sobreviver a um reboot da instância.

## 8. Comandos úteis do dia a dia

```bash
pm2 status              # ver se está rodando
pm2 logs ziulbot-worker  # acompanhar os logs em tempo real
pm2 restart ziulbot-worker
pm2 stop ziulbot-worker
```

---

## Por que EC2 é mais simples aqui que o Koyeb

| | Koyeb (free) | EC2 |
|---|---|---|
| Desliga por inatividade | Sim, após 1h sem tráfego HTTP | Não |
| Precisa de health-check + UptimeRobot | Sim | Não |
| Controle total do ambiente | Limitado | Total (é uma VM) |
| Custo depois do período grátis | $0 (ou upgrade) | Cobra por hora (barato: ~$7-8/mês num t3.micro) |

Não precisa manter o endpoint HTTP do `server.js` público — pode deixar rodando só localmente
(o PM2 já cuida de manter o processo vivo, e a EC2 já fica ligada por si só).
