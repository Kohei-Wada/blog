// Code copy functionality for rehype-pretty-code blocks
/* global document, navigator, setTimeout */
document.addEventListener('DOMContentLoaded', function () {
  // Add copy buttons to all code blocks
  const preElements = document.querySelectorAll('pre.astro-code');

  preElements.forEach(pre => {
    // Create wrapper for positioning
    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper';
    wrapper.style.position = 'relative';
    wrapper.style.margin = '1.5em 0';

    // Wrap the pre element
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);

    // Create copy button
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-code-button';
    copyButton.setAttribute('aria-label', 'コードをコピー');
    copyButton.title = 'コードをコピー';

    // Button content
    copyButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" stroke-width="2" fill="none"/>
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" stroke-width="2" fill="none"/>
      </svg>
      <span class="copy-text">コピー</span>
    `;

    // Insert button into the wrapper
    wrapper.appendChild(copyButton);

    // Copy functionality
    copyButton.addEventListener('click', async function () {
      const code = pre.textContent || '';
      const copyText = this.querySelector('.copy-text');

      try {
        await navigator.clipboard.writeText(code);

        // Success feedback
        this.classList.add('copied');
        if (copyText) {
          copyText.textContent = 'コピー済み';
        }

        setTimeout(() => {
          this.classList.remove('copied');
          if (copyText) {
            copyText.textContent = 'コピー';
          }
        }, 2000);
      } catch (err) {
        console.warn('クリップボードコピーに失敗しました:', err);

        // Fallback: select text
        const textArea = document.createElement('textarea');
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.select();

        try {
          document.execCommand('copy');
          this.classList.add('copied');
          if (copyText) {
            copyText.textContent = 'コピー済み';
          }

          setTimeout(() => {
            this.classList.remove('copied');
            if (copyText) {
              copyText.textContent = 'コピー';
            }
          }, 2000);
        } catch (fallbackErr) {
          console.error('フォールバックコピーも失敗しました:', fallbackErr);
          if (copyText) {
            copyText.textContent = 'エラー';
            setTimeout(() => {
              copyText.textContent = 'コピー';
            }, 2000);
          }
        }

        document.body.removeChild(textArea);
      }
    });
  });
});
