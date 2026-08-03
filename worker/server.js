/**
 * server.js
 *
 * Ponto de entrada do worker. Sobe um mini servidor HTTP só pra:
 *  1) O Koyeb reconhecer isso como "Web Service" (exigido no plano grátis)
 *  2) Um serviço externo (ex: UptimeRobot) poder "bater" nele a cada
 *     poucos minutos e evitar que o Koyeb desligue por inatividade.
 *
 * O bot em si roda em paralelo, dentro do mesmo processo.
 */
import 'dotenv/config';
import http from 'node:http';
import { startWorker, state } from './bot.js';

const PORT = process.env.PORT || 8000;

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    ok: true,
    ...state,
    uptime_seconds: Math.floor((Date.now() - state.startedAt) / 1000),
  }));
});

server.listen(PORT, () => {
  console.log(`[server] Health-check ouvindo na porta ${PORT}`);
});

startWorker().catch((err) => {
  console.error('Erro fatal no worker:', err);
  state.status = 'crashed';
  state.lastError = err.message;
  // Não derruba o processo — mantém o health-check no ar pra diagnosticar.
});
