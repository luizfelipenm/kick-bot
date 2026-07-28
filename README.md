<div align="center">

# ⚡ ZIULBOT

**Bot de chat automático para lives na Kick.com**

Comenta automaticamente no chat de qualquer live — sem instalar nada, direto no navegador.

[![Plataformas](https://img.shields.io/badge/Plataformas-Windows%20%7C%20Android%20%7C%20iOS-53fc18?style=flat-square&labelColor=0e120e)](.)
[![Licença](https://img.shields.io/badge/Licença-MIT-53fc18?style=flat-square&labelColor=0e120e)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Ativo-53fc18?style=flat-square&labelColor=0e120e)](.)

</div>

---

## 📋 Índice

- [Visão geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Estrutura do projeto](#-estrutura-do-projeto)
- [Como usar](#-como-usar)
- [Compatibilidade](#-compatibilidade)
- [Aviso sobre CORS](#-aviso-sobre-cors)
- [Licença](#-licença)

---

## 🤖 Visão geral

O ZIULBOT é um chatbot web para a plataforma **Kick.com**. Funciona diretamente no navegador — sem Node.js, sem instalação, sem configuração de servidor. Basta abrir o arquivo `kick-bot.html`, colar seu token de sessão e iniciar.

A landing page (`index.html`) apresenta o projeto e guia o usuário até o painel do bot.

---

## ✨ Funcionalidades

| Recurso | Descrição |
|---|---|
| 💬 Fila de mensagens | Adicione quantas mensagens quiser e edite a qualquer hora |
| 🔀 Modo aleatório | Mistura as mensagens para parecer mais natural |
| 📋 Modo sequencial | Envia as mensagens em ordem definida |
| ⏱ Intervalo configurável | Defina o tempo (em segundos) entre cada envio |
| 🎲 Variação (jitter) | Adiciona aleatoriedade ao intervalo para evitar padrões detectáveis |
| 🧠 Simulação humana | Atraso aleatório antes de cada envio, simulando digitação real |
| 📊 Log em tempo real | Registro detalhado de cada envio, erro e aviso com timestamp |
| 📈 Estatísticas | Contador de enviados, erros, uptime e tamanho da fila |
| 🛡️ Auto-proteção | Para automaticamente se o token expirar (401) |
| 📋 Botão copiar | Copia o comando do console com um clique |

---

## 📁 Estrutura do projeto

```
ziulbot/
├── index.html                    # Landing page
├── kick-bot.html                 # Painel do bot
│
└── assets/
    ├── css/
    │   ├── base.css              # Variáveis, reset e utilitários globais
    │   ├── index.css             # Estilos da landing page
    │   └── bot.css               # Estilos do painel do bot
    │
    ├── js/
    │   ├── utils.js              # Funções compartilhadas (esc, copyCmd, sleep)
    │   ├── index.js              # Terminal animado, scroll reveal, menu mobile
    │   └── bot.js                # Lógica completa do bot
    │
    └── icons/
        ├── favicon.ico           # Ícone multi-tamanho (16 → 256px)
        ├── apple-touch-icon.png  # 180px — iOS/Safari
        └── icon-512.png          # 512px — Android/PWA
```

---

## 🚀 Como usar

### 1. Clone ou baixe o repositório

```bash
git clone https://github.com/SEU_USUARIO/ziulbot.git
cd ziulbot
```

Ou baixe o `.zip` pelo GitHub e extraia.

### 2. Abra no navegador

Abra o arquivo `index.html` diretamente no navegador, ou sirva localmente:

```bash
# Com Node.js
npx serve .

# Com Python
python -m http.server 8080
```

### 3. Obtenha o token de sessão

> ⚠️ **Nunca compartilhe seu token. Ele dá acesso completo à sua conta Kick.**

1. Acesse [kick.com](https://kick.com) e faça login
2. Pressione **F12** → aba **Console**
3. Cole o comando abaixo e pressione **Enter**:

```js
document.cookie.split('; ').find(function(c){ return c.indexOf('session_token=') === 0; }).split('=')[1]
```

4. Copie o valor retornado
5. Cole no campo **Token de sessão** no painel do bot

> 💡 Na landing page e no painel já existe um botão **Copiar** que copia o comando acima automaticamente.

### 4. Configure e inicie

| Campo | Descrição |
|---|---|
| **Canal Kick** | Nome do canal sem `kick.com/` (ex: `gaules`) |
| **Token de sessão** | Valor obtido no passo anterior |
| **Intervalo (s)** | Tempo entre cada mensagem (mínimo: 5s) |
| **Variação ±(s)** | Aleatoriedade adicional ao intervalo |
| **Modo de envio** | Sequencial ou Aleatório |

Adicione suas mensagens, clique em **▶ Iniciar Bot** e acompanhe o log em tempo real.

---

## 🖥️ Compatibilidade

| Plataforma | Navegador recomendado |
|---|---|
| Windows | Chrome, Firefox, Edge |
| Android | Chrome para Android |
| iOS | Safari |

---

## ⚠️ Aviso sobre CORS

Ao abrir o arquivo HTML diretamente (`file://`), o navegador bloqueia as requisições à API da Kick por política de **CORS**. Para contornar isso, use uma das opções abaixo:

**Opção 1 — Extensão (mais fácil)**  
Instale a extensão **CORS Unblock** no Chrome ou Firefox e ative-a antes de usar o bot.

**Opção 2 — Servidor local**
```bash
npx serve .
# Acesse http://localhost:3000
```

**Opção 3 — Proxy Node.js**  
Crie um proxy local que repassa as requisições sem restrição de CORS.

---

## 📜 Licença

MIT © 2026 ZIULBOT

Distribuído livremente. Use com responsabilidade e respeite os [Termos de Serviço da Kick.com](https://kick.com/terms-of-service).
