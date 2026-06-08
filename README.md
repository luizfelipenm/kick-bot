# ⚡ KickBot — Live Chat Automator

Bot para comentar automaticamente no chat de lives na **Kick.com**.  
Compatível com **Windows**, **Android** e **iOS** — funciona direto no navegador, sem instalação.

![KickBot Preview](https://img.shields.io/badge/Kick-Chat%20Bot-53fc18?style=for-the-badge&logo=data:image/svg+xml;base64,)

---

## 🚀 Como usar

### 1. Abrir o bot
- Baixe o arquivo `kick-chat-bot.html`
- Abra no navegador (**Chrome**, **Firefox**, **Safari**, **Edge**)
- Funciona em **Windows**, **Android** e **iOS** sem instalar nada

### 2. Obter o Token de sessão
1. Acesse [kick.com](https://kick.com) e faça **login**
2. Pressione **F12** → aba **Console**
3. Cole o comando abaixo e pressione Enter:
```js
document.cookie.split('; ').find(function(c){ return c.indexOf('session_token=') === 0; }).split('=')[1]
```
4. Copie o valor retornado
5. Cole no campo **"Seu Token OAuth"** no bot

> ⚠️ **Nunca compartilhe seu token publicamente.** Ele dá acesso à sua conta.

### 3. Configurar e iniciar
- Informe o **nome do canal** (ex: `xqc`, `gaules`)
- Adicione as **mensagens** que deseja enviar
- Ajuste o **intervalo** entre mensagens
- Clique em **▶ Iniciar Bot**

---

## ✨ Funcionalidades

| Recurso | Descrição |
|---|---|
| 💬 Fila de mensagens | Adicione quantas mensagens quiser |
| 🔀 Modo aleatório | Envia mensagens em ordem aleatória |
| 📋 Modo sequencial | Envia mensagens em ordem definida |
| ⏱ Intervalo configurável | Defina o tempo entre envios |
| 🎲 Variação (jitter) | Adiciona aleatoriedade ao intervalo para parecer humano |
| 🧠 Simulação humana | Atraso aleatório antes de cada envio |
| 📊 Log em tempo real | Acompanhe todos os envios e erros |
| 📈 Estatísticas | Contador de enviados, erros e uptime |
| 🛑 Auto-parada | Para automaticamente em caso de erro de autenticação |

---

## ⚙️ Compatibilidade

| Plataforma | Navegador recomendado |
|---|---|
| Windows | Chrome, Firefox, Edge |
| Android | Chrome para Android |
| iOS | Safari |

---

## ⚠️ Aviso sobre CORS

Ao rodar o arquivo HTML diretamente no navegador, a API do Kick pode bloquear as requisições por **CORS**. Para contornar isso, use uma das opções:

- **Extensão CORS Unblock** (Chrome/Firefox)
- **Proxy local** em Node.js
- **Abrir o arquivo via servidor local** (`npx serve .`)

---

## 📁 Estrutura do projeto

```
kickbot/
├── kick-chat-bot.html   # Bot completo (HTML + CSS + JS em um arquivo)
└── README.md            # Este arquivo
```

---

## 📜 Licença

MIT — Use com responsabilidade. Respeite os Termos de Serviço do Kick.com.
