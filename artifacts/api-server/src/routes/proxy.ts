import { Router, type Request, type Response } from "express";
import { createReadStream } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { logger } from "../lib/logger";

const router = Router();
const TARGET_BASE = "https://rwa.streamfiles.eu.org";
const TARGET_HOST_PATTERN = "rwa\\.streamfiles\\.eu\\.org";

// Serve logo directly under /proxy so it resolves correctly inside the iframe
const LOGO_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../public/rwa-logo.jpg"
);
router.get("/rwa-logo.jpg", (_req, res) => {
  res.setHeader("Content-Type", "image/jpeg");
  res.setHeader("Cache-Control", "public, max-age=86400");
  createReadStream(LOGO_PATH).pipe(res);
});
router.get("/rwa-network-logo.svg", (_req, res) => {
  res.type("image/svg+xml").send(`<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffe58a"/><stop offset=".5" stop-color="#facc15"/><stop offset="1" stop-color="#a16207"/></linearGradient></defs><rect width="160" height="160" rx="38" fill="#11100b"/><path d="M35 58l12-25 18 16 15-25 15 25 18-16 12 25-15-5-9 12H59l-9-12-15 5z" fill="url(#g)" stroke="#fff2a8" stroke-width="3"/><path d="M30 68c18-8 42-8 50 0 8-8 32-8 50 0v55c-18-8-38-8-50 1-12-9-32-9-50-1V68z" fill="#f8d66d" stroke="#fff2a8" stroke-width="4"/><path d="M80 68v55M42 82c13-4 25-2 38 4M118 82c-13-4-25-2-38 4" fill="none" stroke="#7c4a03" stroke-width="4" stroke-linecap="round"/><text x="80" y="148" text-anchor="middle" fill="#facc15" font-family="Arial,sans-serif" font-size="10" font-weight="700">RWA</text></svg>`);
});

// JS snippet injected into every proxied HTML page.
// Intercepts fetch() / XHR calls to external domains and routes them through
// /api/extproxy so CORS and Origin checks pass on the upstream API servers.
const FETCH_OVERRIDE = `
<script data-proxy-inject="1">
(function(){
  var _BLOCKED=['rwa.smexfot.workers.dev','kgsfreebatch.free.nf','shanvikashyap9548.workers.dev','rwa.iownprince5.workers.dev'];
  function _isBlocked(u){if(!u)return false;for(var i=0;i<_BLOCKED.length;i++){if(u.indexOf(_BLOCKED[i])!==-1)return true;}return false;}
  function _proxyUrl(u){return'/api/extproxy?url='+encodeURIComponent(u);}
  var _origFetch=window.fetch;
  window.fetch=function(input,opts){
    var url=typeof input==='string'?input:(input&&input.url?input.url:'');
    if(_isBlocked(url)){
      var pu=_proxyUrl(url);
      return _origFetch(pu,opts);
    }
    return _origFetch.apply(this,arguments);
  };
  var _XHR=window.XMLHttpRequest,_open=_XHR.prototype.open;
  _XHR.prototype.open=function(m,u){
    if(_isBlocked(u))u=_proxyUrl(u);
    return _open.apply(this,[m,u].concat(Array.prototype.slice.call(arguments,2)));
  };
})();
</script>`;

// Media URLs in the source player point at a separate storage host. Keep the
// signed URL intact, but route it through our own proxy so the iframe does not
// lose access because of cross-origin media/CORS restrictions.
const MEDIA_OVERRIDE = `
<script data-proxy-media="1">
(function(){
  var _mediaHost='rwa-stream-server-b80fb0d6b8e4.herokuapp.com';
  function proxyMedia(u){
    if(!u || typeof u!=='string' || u.indexOf('/api/extproxy?url=')===0) return u;
    if(u.indexOf(_mediaHost)===-1) return u;
    return '/api/extproxy?url='+encodeURIComponent(u);
  }
  var _set=HTMLMediaElement.prototype.__defineSetter__ && Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'src');
  if(_set && _set.set) Object.defineProperty(HTMLMediaElement.prototype,'src',{get:_set.get,set:function(u){return _set.set.call(this,proxyMedia(u));}});
  var _attr=Element.prototype.setAttribute;
  Element.prototype.setAttribute=function(name,value){
    if((name==='src'||name==='href') && typeof value==='string') value=proxyMedia(value);
    return _attr.call(this,name,value);
  };
  function wrapHls(){
    if(!window.Hls || window.Hls.__rwaWrapped || !window.Hls.prototype.loadSource) return;
    var old=window.Hls.prototype.loadSource;
    window.Hls.prototype.loadSource=function(u){return old.call(this,proxyMedia(u));};
    window.Hls.__rwaWrapped=true;
  }
  var timer=setInterval(wrapHls,100);
  setTimeout(function(){clearInterval(timer);wrapHls();},15000);
  function rewriteLinks(){
    document.querySelectorAll('a[href],source[src],video[src]').forEach(function(el){
      var attr=el.hasAttribute('href')?'href':'src', value=el.getAttribute(attr);
      var next=proxyMedia(value);
      if(next!==value) el.setAttribute(attr,next);
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',rewriteLinks); else rewriteLinks();
})();
</script>`;

// Rewrite all URLs in HTML pointing to the target to go through /proxy
function rewriteHtml(html: string): string {
  // Remove headers that block embedding
  html = html.replace(/<meta[^>]*x-frame-options[^>]*>/gi, "");
  html = html.replace(/<meta[^>]*content-security-policy[^>]*>/gi, "");

  // Inject the fetch override as early as possible (right after <head>)
  html = html.replace(/(<head[^>]*>)/i, "$1" + FETCH_OVERRIDE + MEDIA_OVERRIDE);

  // Absolute target URLs in attributes
  html = html.replace(
    new RegExp(
      `(href|src|action|data-src|data-href|data-url|poster|srcset)=(['"])(https?:)?//${TARGET_HOST_PATTERN}`,
      "gi"
    ),
    "$1=$2/proxy"
  );

  // Absolute path references: href="/..." → href="/proxy/..."
  // Skip: /proxy (already rewritten), // (protocol-relative), hash, javascript, mailto, tel, data
  html = html.replace(
    /(href|src|action|data-src|poster|srcset)=(['"])(\/(?!proxy\/|\/)[^'"> ]*)/gi,
    "$1=$2/proxy$3"
  );
  html = html.replace(
    /(href|src|action|data-src|data-href|data-url|poster|srcset)=(['"])(?!https?:|\/\/|\/|#|data:|mailto:|tel:)([^'"> ]+)/gi,
    "$1=$2/proxy/$3"
  );

  // JS string literals containing the target domain
  html = html.replace(
    new RegExp(`(['"\`])https?://${TARGET_HOST_PATTERN}(/[^'"\`]*)`, "g"),
    "$1/proxy$2"
  );
  html = html.replace(
    new RegExp(`(['"\`])https?://${TARGET_HOST_PATTERN}(['"\`])`, "g"),
    "$1/proxy/$2"
  );

  // Rewrite the Cloudflare video worker URL → our server-side proxy
  // This fixes lecture video loading when the player page is served through /proxy
  html = html.replace(
    /(['"`])(https?:)?\/\/api\.shanvikashyap9548\.workers\.dev/gi,
    "$1/api/video-worker"
  );

  // window.location and similar JS patterns with absolute paths
  html = html.replace(
    /(window\.location(?:\.href)?\s*=\s*['"])(\/(?!proxy\/)[^'"]+)/gi,
    "$1/proxy$2"
  );

  // CSS url() inside <style> tags
  html = html.replace(
    new RegExp(`url\\((['"]?)https?://${TARGET_HOST_PATTERN}`, "g"),
    "url($1/proxy"
  );
  html = html.replace(
    /url\((['"]?)(\/(?!proxy\/)[^'"\)]*)\)/g,
    (_, q, path) => `url(${q}/proxy${path})`
  );

  // ── Logo replacement ───────────────────────────────────────────────────────
  // Swap the site's original logo with our RWA Study Network logo everywhere
  // Served at /proxy/rwa-logo.jpg so it resolves correctly inside the iframe
  html = html.replace(
    /https:\/\/i\.ibb\.co\/yF4mhNPB\/f493d534-fbf8-4b31-b741-83b343f8a9e1\.jpg/g,
    "/proxy/rwa-logo.jpg"
  );

  // ── Branding rewrites ──────────────────────────────────────────────────────
  // Replace page <title>
  html = html.replace(/<title>[^<]*<\/title>/i, "<title>RWA Study Network</title>");

  // "studybeepro" as visible text (not inside URLs/hrefs — those were already
  // rewritten above, so by this point any remaining occurrences are display text)
  html = html.replace(/StudyBee\s*Pro/gi, "RWA Study Network");
  html = html.replace(/StudyRays/gi, "Rwa by Ankit");

  // Player page header: STUDY<span>BEE</span> → RWA Study Network
  html = html.replace(
    /<div([^>]*)class="brand"[^>]*>STUDY<span[^>]*>BEE<\/span><\/div>/gi,
    '<div$1class="brand">RWA <span>Study Network</span></div>'
  );

  html = html.replace(/StudyBee/gi, "RWA Study Network");
  html = html.replace(/StudyRays/gi, "Rwa by Ankit");
  html = html.replace(/studybeepro/gi, "rwa study network");

  // Comment strings referencing StudyBee (CSS/JS comments)
  html = html.replace(/StudyBee Dark/gi, "RWA Study Network Dark");

  // ── Social media popup ────────────────────────────────────────────────────
  const SOCIAL_POPUP = `
<style>
#rwa-popup-overlay{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:99998;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);}
#rwa-popup-overlay.rwa-hidden{display:none!important;}
#rwa-popup-box{
  background:linear-gradient(145deg,#0f0f0f,#1a1200);
  border:1.5px solid #FACC15;border-radius:18px;
  padding:28px 24px 22px;max-width:340px;width:90%;
  box-shadow:0 0 40px #FACC1540,0 8px 32px #0008;
  position:relative;text-align:center;font-family:'Segoe UI',sans-serif;
}
#rwa-popup-box h2{color:#FACC15;font-size:18px;margin:0 0 4px;font-weight:800;letter-spacing:.03em;}
#rwa-popup-box p{color:#ccc;font-size:12px;margin:0 0 18px;}
.rwa-social-btn{
  display:flex;align-items:center;gap:12px;
  width:100%;padding:11px 16px;border-radius:10px;
  text-decoration:none;font-size:14px;font-weight:600;
  margin-bottom:10px;transition:transform .15s,box-shadow .15s;
  border:none;cursor:pointer;
}
.rwa-social-btn:hover{transform:translateY(-2px);box-shadow:0 4px 16px #0006;}
.rwa-social-btn:last-of-type{margin-bottom:0;}
.rwa-btn-tg{background:#0088cc;color:#fff;}
.rwa-btn-wa{background:#25D366;color:#fff;}
.rwa-btn-ig1{background:linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045);color:#fff;}
.rwa-btn-ig2{background:linear-gradient(135deg,#405de6,#833ab4,#e1306c);color:#fff;}
.rwa-social-btn svg{flex-shrink:0;width:20px;height:20px;}
#rwa-close-btn{
  position:absolute;top:10px;right:12px;
  background:none;border:none;color:#888;font-size:20px;
  cursor:pointer;line-height:1;padding:2px 6px;border-radius:6px;
  transition:color .15s,background .15s;
}
#rwa-close-btn:hover{color:#FACC15;background:#FACC1520;}
#rwa-popup-note{color:#666;font-size:11px;margin-top:14px;}
</style>
<div id="rwa-popup-overlay">
  <div id="rwa-popup-box">
    <button id="rwa-close-btn" title="Close">✕</button>
    <h2>🌟 Join RWA Study Network</h2>
    <p>Stay updated — join our official channels</p>
    <a class="rwa-social-btn rwa-btn-tg" href="https://t.me/+oStLl-wO2dMyZmM1" target="_blank" rel="noopener">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 14.03l-2.95-.924c-.64-.203-.654-.64.136-.953l11.57-4.461c.537-.194 1.006.131.836.956z"/></svg>
      Telegram Channel
    </a>
    <a class="rwa-social-btn rwa-btn-wa" href="https://whatsapp.com/channel/0029VbDCEcsGehEQt6q1lu36" target="_blank" rel="noopener">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      WhatsApp Channel
    </a>
    <a class="rwa-social-btn rwa-btn-ig1" href="https://www.instagram.com/pw_study_network_official?igsh=MTkxMjAzOXVzMmtmeA==" target="_blank" rel="noopener">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
      PW Study Network (Instagram)
    </a>
    <a class="rwa-social-btn rwa-btn-ig2" href="https://www.instagram.com/neetupdatesdaily?igsh=MXcwMTR4M25hZzV4cw==" target="_blank" rel="noopener">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
      Neet Updates Daily (Instagram)
    </a>
    <div id="rwa-popup-note">✓ Will not show again for 24 hours after closing</div>
  </div>
</div>
<script>
(function(){
  var KEY='rwa_popup_closed';
  var overlay=document.getElementById('rwa-popup-overlay');
  if(!overlay)return;
  try{
    var val=localStorage.getItem(KEY);
    if(val&&(Date.now()-parseInt(val,10))<86400000){
      overlay.classList.add('rwa-hidden');return;
    }
  }catch(e){}
  document.getElementById('rwa-close-btn').addEventListener('click',function(){
    overlay.classList.add('rwa-hidden');
    try{localStorage.setItem(KEY,Date.now().toString());}catch(e){}
  });
  overlay.addEventListener('click',function(e){
    if(e.target===overlay){
      overlay.classList.add('rwa-hidden');
      try{localStorage.setItem(KEY,Date.now().toString());}catch(e){}
    }
  });
})();
</script>`;
  html = html.replace(/(<\/body>)/i, SOCIAL_POPUP + "$1");

  // ── Scrolling ticker injected after </header> ───────────────────────────
  const TICKER = `
<div id="rwa-ticker-wrap" style="
  width:100%;overflow:hidden;background:linear-gradient(90deg,#0a0a0a 0%,#1a1200 50%,#0a0a0a 100%);
  border-top:1px solid #FACC1540;border-bottom:1px solid #FACC1540;
  padding:5px 0;position:relative;z-index:999;">
<style>
@keyframes rwa-scroll{0%{transform:translateX(100vw)}100%{transform:translateX(-100%)}}
#rwa-ticker-inner{
  display:inline-block;white-space:nowrap;
  animation:rwa-scroll 28s linear infinite;
  font-family:'Syne','Inter',sans-serif;font-size:13px;font-weight:700;
  letter-spacing:.06em;
}
#rwa-ticker-inner span.t1{color:#FACC15;text-shadow:0 0 8px #FACC1580;}
#rwa-ticker-inner span.t2{color:#e2c97e;font-size:12px;opacity:.85;}
#rwa-ticker-inner span.sep{color:#FACC1566;margin:0 18px;}
</style>
<div id="rwa-ticker-inner">
  <span class="t1">🌟 RWA Study Network</span>
  <span class="sep">✦</span>
  <span class="t2">Development by Ankit</span>
  <span class="sep">✦</span>
  <span class="t1">🌟 RWA Study Network</span>
  <span class="sep">✦</span>
  <span class="t2">Development by Ankit</span>
  <span class="sep">✦</span>
  <span class="t1">🌟 RWA Study Network</span>
  <span class="sep">✦</span>
  <span class="t2">Development by Ankit</span>
  <span class="sep">✦</span>
</div>
</div>`;
  if (/<\/header>/i.test(html)) html = html.replace(/(<\/header>)/i, "$1" + TICKER);
  else html = html.replace(/(<body[^>]*>)/i, "$1" + TICKER);

  return html;
}

// Rewrite URLs in CSS files
function rewriteCss(css: string): string {
  css = css.replace(
    new RegExp(`url\\((['"]?)https?://${TARGET_HOST_PATTERN}`, "g"),
    "url($1/proxy"
  );
  css = css.replace(
    /url\((['"]?)(\/(?!proxy\/)[^'"\)]*)\)/g,
    (_, q, path) => `url(${q}/proxy${path})`
  );
  return css;
}

// Rewrite URLs in JS files
function rewriteJs(js: string): string {
  js = js.replace(
    new RegExp(`(['"\`])https?://${TARGET_HOST_PATTERN}`, "g"),
    "$1/proxy"
  );
  return js.replace(/(['"`])api\/(?!proxy\/)/g, "$1/proxy/api/");
}

router.all("/{*path}", async (req: Request, res: Response) => {
  // Build the target URL from the sub-path (req.url is relative to /proxy mount)
  const targetUrl = TARGET_BASE + req.url;

  // Build forwarded headers
  const forwardHeaders: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    Accept: (req.headers["accept"] as string) || "*/*",
    "Accept-Language":
      (req.headers["accept-language"] as string) || "hi-IN,hi;q=0.9,en;q=0.8",
    "Accept-Encoding": "identity",
    Referer: TARGET_BASE + "/",
    Origin: TARGET_BASE,
  };
  for (const header of ["dev-jisu-key", "dev-jisu-signature", "authorization", "user-id"]) {
    const value = req.headers[header];
    if (value) forwardHeaders[header] = value as string;
  }

  if (req.headers["cookie"]) {
    forwardHeaders["Cookie"] = req.headers["cookie"] as string;
  }

  // Re-serialize parsed body for POST/PUT/PATCH
  let bodyPayload: string | undefined;
  const method = req.method.toUpperCase();
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    const ct = (req.headers["content-type"] as string) || "";
    if (ct.includes("application/json") && req.body) {
      bodyPayload = JSON.stringify(req.body);
      forwardHeaders["Content-Type"] = "application/json";
    } else if (
      ct.includes("application/x-www-form-urlencoded") &&
      req.body
    ) {
      bodyPayload = new URLSearchParams(
        req.body as Record<string, string>
      ).toString();
      forwardHeaders["Content-Type"] = "application/x-www-form-urlencoded";
    } else if (typeof req.body === "string") {
      bodyPayload = req.body;
      if (ct) forwardHeaders["Content-Type"] = ct;
    }
  }

  try {
    const response = await fetch(targetUrl, {
      method,
      headers: forwardHeaders,
      body: bodyPayload,
      redirect: "follow",
      signal: AbortSignal.timeout(30000),
    } as RequestInit);

    const contentType = response.headers.get("content-type") || "";

    // Forward Set-Cookie but strip domain so cookies work on proxy domain
    const rawSetCookie = response.headers.get("set-cookie");
    if (rawSetCookie) {
      const cleaned = rawSetCookie
        .replace(/;\s*domain=[^;,]*/gi, "")
        .replace(/;\s*samesite=(?:strict|lax)/gi, "; SameSite=None")
        .replace(/;\s*secure/gi, "");
      res.setHeader("Set-Cookie", cleaned);
    }

    // Remove headers that block proxy or embedding
    res.setHeader("Content-Type", contentType);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.removeHeader("X-Frame-Options");

    res.status(response.status);

    if (targetUrl.endsWith("/api/app-config.php") && contentType.includes("application/json")) {
      const config = await response.json() as Record<string, any>;
      config.app = { ...(config.app || {}), name: "RWA Study Network", title: "RWA Study Network" };
      config.logo = { ...(config.logo || {}), url: "/proxy/rwa-network-logo.svg" };
      res.setHeader("Content-Type", "application/json");
      res.send(JSON.stringify(config));
    } else if (contentType.includes("text/html")) {
      const text = await response.text();
      const rewritten = rewriteHtml(text);
      res.send(rewritten);
    } else if (contentType.includes("text/css")) {
      const text = await response.text();
      res.send(rewriteCss(text));
    } else if (
      contentType.includes("javascript") ||
      contentType.includes("ecmascript")
    ) {
      const text = await response.text();
      res.send(rewriteJs(text));
    } else {
      // Binary: images, PDFs, video, fonts — stream directly
      const buf = Buffer.from(await response.arrayBuffer());
      res.setHeader("Content-Length", buf.length);
      res.send(buf);
    }
  } catch (err) {
    logger.error({ err, targetUrl }, "Proxy fetch error");
    if (!res.headersSent) {
      res.status(502).send("Proxy error: could not reach upstream server");
    }
  }
});

export default router;
