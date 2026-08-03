/**
 * ecosystem.config.cjs
 *
 * Configuração do PM2 — gerencia o processo do worker na EC2:
 *  - reinicia automaticamente se o processo cair
 *  - reinicia automaticamente se a instância reiniciar (com `pm2 startup` + `pm2 save`)
 *  - guarda logs organizados
 *
 * Uso:
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 *   pm2 startup   (siga a instrução que ele imprimir, uma vez só)
 */
module.exports = {
  apps: [
    {
      name: 'ziulbot-worker',
      script: 'server.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
      },
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      time: true,
    },
  ],
};
