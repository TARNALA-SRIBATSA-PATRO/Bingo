/**
 * Universal clipboard copy with robust fallback for HTTP and non-secure mobile browsers
 */
export function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }

  return new Promise((resolve, reject) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);

      const range = document.createRange();
      range.selectNodeContents(textArea);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      textArea.setSelectionRange(0, 999999);

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        resolve();
      } else {
        reject(new Error('execCommand copy failed'));
      }
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Universal share handler that attempts native system share,
 * and falls back cleanly if unsupported or running on HTTP LAN.
 */
export async function triggerShare({ roomId, showNotif, onFallbackModal }) {
  if (!roomId) return;
  const shareUrl = `${window.location.origin}/lobby?room=${roomId}`;
  const shareText = `Join my BINGO room! Room Code: ${roomId}`;

  // 1. Try native Web Share API (only works in HTTPS or localhost)
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      const shareData = {
        title: 'Join my BINGO Game!',
        text: `${shareText}\n${shareUrl}`,
        url: shareUrl,
      };

      if (navigator.canShare && !navigator.canShare(shareData)) {
        await navigator.share({ url: shareUrl });
      } else {
        await navigator.share(shareData);
      }
      return;
    } catch (err) {
      if (err.name === 'AbortError') {
        // User closed or dismissed the share sheet
        return;
      }
      // If native share threw an error other than Abort, continue to fallback
    }
  }

  // 2. If navigator.share is unavailable (e.g. mobile over HTTP) or failed:
  // Copy to clipboard first
  try {
    await copyToClipboard(shareUrl);
    if (showNotif) {
      showNotif(`Game link (${roomId}) copied!`, 'success');
    }
  } catch {
    if (showNotif) {
      showNotif(`Room Code: ${roomId}`, 'info');
    }
  }

  // 3. If a fallback modal handler was provided, trigger the share sheet modal
  if (onFallbackModal) {
    onFallbackModal({ roomId, shareUrl, shareText });
  }
}
