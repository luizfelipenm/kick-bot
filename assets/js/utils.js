/* ============================================================
   ZIULBOT — utils.js
   Funções compartilhadas entre index.html e kick-bot.html
   ============================================================ */

/**
 * Escapa HTML para evitar XSS ao inserir texto dinâmico no DOM.
 * @param {string} s
 * @returns {string}
 */
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Copia texto para a área de transferência e atualiza o botão visualmente.
 * @param {HTMLButtonElement} btn   - O botão clicado
 * @param {string}            codeId - ID do elemento <code> com o texto
 */
function copyCmd(btn, codeId) {
  const text = document.getElementById(codeId).textContent;

  const iconCopy = `<svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
    <rect x="9" y="9" width="13" height="13" rx="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg> Copiar`;

  const iconDone = `<svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
    <polyline points="20,6 9,17 4,12"/>
  </svg> Copiado!`;

  const reset = () => {
    btn.classList.remove('copied');
    btn.innerHTML = iconCopy;
  };

  navigator.clipboard.writeText(text).then(() => {
    btn.classList.add('copied');
    btn.innerHTML = iconDone;
    setTimeout(reset, 2200);
  }).catch(() => {
    // Fallback para navegadores sem Clipboard API
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    btn.classList.add('copied');
    btn.innerHTML = iconDone;
    setTimeout(reset, 2000);
  });
}

/**
 * Promise que resolve após `ms` milissegundos.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Inteiro aleatório entre 0 e 9999 (usado como X-Socket-ID).
 * @returns {number}
 */
function rnd() {
  return Math.floor(Math.random() * 9999);
}
