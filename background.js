// ── Icon generation ───────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(setDynamicIcon);
chrome.runtime.onStartup.addListener(setDynamicIcon);

const GOLD  = '#C49A20';
const GREEN = '#163319';

async function setDynamicIcon() {
  try {
    await chrome.action.setIcon({
      imageData: {
        16:  drawIcon(16),
        32:  drawIcon(32),
        48:  drawIcon(48),
        128: drawIcon(128),
      }
    });
  } catch (e) {}
}

function drawIcon(s) {
  const canvas = new OffscreenCanvas(s, s);
  const ctx = canvas.getContext('2d');
  s <= 32 ? drawSmall(ctx, s) : drawFull(ctx, s);
  return ctx.getImageData(0, 0, s, s);
}

function drawSmall(ctx, s) {
  const r = s * 0.18;
  ctx.fillStyle = GREEN;
  ctx.beginPath(); rrect(ctx, 0, 0, s, s, r); ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = Math.max(1, s * 0.07);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); dome(ctx, s*.5, s*.58, s*.10, s*.30); ctx.stroke();
  const by = s*.58, cx = s*.5, hw = s*.30;
  ctx.beginPath();
  ctx.moveTo(cx-hw-s*.06, by); ctx.lineTo(cx-s*.03, by);
  ctx.moveTo(cx+s*.03, by);   ctx.lineTo(cx+hw+s*.06, by);
  ctx.stroke();
}

function drawFull(ctx, s) {
  ctx.fillStyle = 'white'; ctx.fillRect(0, 0, s, s);
  const cx = s*.5, lw = Math.max(1.5, s*.022);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const ob=s*.44, ot=s*.05, ow=s*.28;
  ctx.strokeStyle=GOLD; ctx.lineWidth=lw;
  ctx.beginPath(); dome(ctx,cx,ob,ot,ow); ctx.stroke();
  const ib=s*.395, it=s*.13, iw=s*.17;
  ctx.beginPath(); dome(ctx,cx,ib,it,iw); ctx.stroke();
  const gap=s*.032;
  ctx.lineWidth=lw; ctx.beginPath();
  ctx.moveTo(cx-ow-s*.08,ob); ctx.lineTo(cx-gap,ob);
  ctx.moveTo(cx+gap,ob);      ctx.lineTo(cx+ow+s*.08,ob);
  ctx.stroke();
  const fs=s<=48?s*.20:s*.185;
  ctx.fillStyle=GREEN; ctx.font=`900 ${fs}px Georgia,"Times New Roman",serif`;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('NAZEER', cx, s*.685);
  const ly=s*.815, lhw=s*.37, dg=s*.046;
  ctx.strokeStyle=GOLD; ctx.lineWidth=lw*.65; ctx.beginPath();
  ctx.moveTo(cx-lhw,ly); ctx.lineTo(cx-dg,ly);
  ctx.moveTo(cx+dg,ly);  ctx.lineTo(cx+lhw,ly);
  ctx.stroke();
  const ds=s*.026; ctx.fillStyle=GOLD;
  ctx.save(); ctx.translate(cx,ly); ctx.rotate(Math.PI/4);
  ctx.fillRect(-ds,-ds,ds*2,ds*2); ctx.restore();
}

function dome(ctx, cx, baseY, topY, halfW) {
  const h=baseY-topY;
  ctx.moveTo(cx-halfW, baseY);
  ctx.bezierCurveTo(cx-halfW,baseY-h*.26, cx-halfW*1.20,baseY-h*.54, cx,topY);
  ctx.bezierCurveTo(cx+halfW*1.20,baseY-h*.54, cx+halfW,baseY-h*.26, cx+halfW,baseY);
}
function rrect(ctx,x,y,w,h,r){
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r);
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r);
  ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}

// ── AI Tool Prompt Injection ──────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'OPEN_AI_TOOL') {
    openAndInject(msg.url, msg.prompt);
    sendResponse({ ok: true });
  }
  return false;
});

async function openAndInject(url, prompt) {
  // Create the tab
  const tab = await chrome.tabs.create({ url, active: true });

  // Timeout safety — stop listening after 30 s
  const deadline = Date.now() + 30_000;

  const listener = (tabId, changeInfo, tabInfo) => {
    if (tabId !== tab.id) return;
    if (changeInfo.status !== 'complete') return;
    if (Date.now() > deadline) { chrome.tabs.onUpdated.removeListener(listener); return; }

    // Some SPAs fire 'complete' before React/Vue mounts the input.
    // Wait 2 s after load complete, then retry up to 15 times × 600 ms.
    chrome.tabs.onUpdated.removeListener(listener);

    setTimeout(() => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: injectPromptIntoPage,
        args: [prompt],
      }).catch(() => {
        // Page may have restricted CSP — silently ignore
      });
    }, 2000);
  };

  chrome.tabs.onUpdated.addListener(listener);
}

// ── Injection function — runs INSIDE the target page context ─────────────────
// Must be fully self-contained (no closures from background scope).

function injectPromptIntoPage(prompt) {
  let attempts = 0;

  // Site-specific input selectors, in priority order
  const SELECTORS = {
    'chatgpt.com':       ['#prompt-textarea', 'div[contenteditable="true"]'],
    'claude.ai':         ['.ProseMirror', 'div[contenteditable="true"]'],
    'gemini.google.com': ['.ql-editor', 'rich-textarea [contenteditable="true"]', 'div[contenteditable="true"]'],
    'grok.com':          ['textarea', 'div[contenteditable="true"]'],
    'deepseek.com':      ['textarea#chat-input', 'textarea', 'div[contenteditable="true"]'],
    'perplexity.ai':     ['textarea', 'div[contenteditable="true"]'],
  };

  function getSelectors() {
    const host = location.hostname;
    for (const [key, list] of Object.entries(SELECTORS)) {
      if (host.includes(key)) return list;
    }
    return ['textarea', 'div[contenteditable="true"]'];
  }

  function isVisible(el) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).display !== 'none';
  }

  function findInput() {
    for (const sel of getSelectors()) {
      const el = [...document.querySelectorAll(sel)].find(isVisible);
      if (el) return el;
    }
    return null;
  }

  function fillTextarea(el, text) {
    // Use React's native value setter to trigger synthetic onChange
    const proto = el.tagName === 'TEXTAREA'
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) {
      setter.call(el, text);
    } else {
      el.value = text;
    }
    ['input', 'change', 'keyup'].forEach(t =>
      el.dispatchEvent(new Event(t, { bubbles: true }))
    );
  }

  function fillContentEditable(el, text) {
    el.focus();

    // Method 1 — execCommand (works in most Chromium-based apps)
    try {
      document.execCommand('selectAll', false, null);
      if (document.execCommand('insertText', false, text)) return;
    } catch (_) {}

    // Method 2 — simulate a paste event (works for React / ProseMirror)
    try {
      const dt = new DataTransfer();
      dt.setData('text/plain', text);
      el.dispatchEvent(new ClipboardEvent('paste', {
        clipboardData: dt,
        bubbles: true,
        cancelable: true,
      }));
    } catch (_) {
      // Method 3 — brute force innerText
      el.innerText = text;
      el.dispatchEvent(new InputEvent('input', { bubbles: true, data: text }));
    }
  }

  function highlight(el) {
    const prev = el.style.outline;
    el.style.transition = 'outline 0.4s';
    el.style.outline = '2.5px solid #6366f1';
    setTimeout(() => { el.style.outline = prev; el.style.transition = ''; }, 1800);
  }

  function tryInject() {
    attempts++;
    const el = findInput();

    if (!el) {
      if (attempts < 15) setTimeout(tryInject, 600);
      return;
    }

    el.focus();

    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      fillTextarea(el, prompt);
    } else {
      fillContentEditable(el, prompt);
    }

    highlight(el);
  }

  tryInject();
}
