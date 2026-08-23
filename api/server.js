import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const TARGET_BASE = "https://rwa.streamfiles.eu.org";
const WORKER_BASE = "https://api.shanvikashyap9548.workers.dev";
const SITE_ORIGIN = "https://rwa.streamfiles.eu.org";

const FETCH_OVERRIDE = `<script data-proxy-inject="1">
(function(){
  var _B=['rwa.smexfot.workers.dev','kgsfreebatch.free.nf','shanvikashyap9548.workers.dev','rwa.iownprince5.workers.dev'];
  function _isB(u){if(!u)return false;for(var i=0;i<_B.length;i++){if(u.indexOf(_B[i])!==-1)return true;}return false;}
  function _pUrl(u){return'/api/extproxy?url='+encodeURIComponent(u);}
  var _oF=window.fetch;
  window.fetch=function(input,opts){
    var url=typeof input==='string'?input:(input&&input.url?input.url:'');
    if(_isB(url))return _oF(_pUrl(url),opts);
    return _oF.apply(this,arguments);
  };
  var _X=window.XMLHttpRequest,_o=_X.prototype.open;
  _X.prototype.open=function(m,u){if(_isB(u))u=_pUrl(u);return _o.apply(this,[m,u].concat(Array.prototype.slice.call(arguments,2)));};
})();
</script>`;

const SOCIAL_POPUP = `<style>
#rwa-popup-overlay{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:99998;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);}
#rwa-popup-overlay.rwa-hidden{display:none!important;}
#rwa-popup-box{background:linear-gradient(145deg,#0f0f0f,#1a1200);border:1.5px solid #FACC15;border-radius:18px;padding:28px 24px 22px;max-width:340px;width:90%;box-shadow:0 0 40px #FACC1540,0 8px 32px #0008;position:relative;text-align:center;font-family:'Segoe UI',sans-serif;}
#rwa-popup-box h2{color:#FACC15;font-size:18px;margin:0 0 4px;font-weight:800;}
#rwa-popup-box p{color:#ccc;font-size:12px;margin:0 0 18px;}
.rwa-social-btn{display:flex;align-items:center;gap:12px;width:100%;padding:11px 16px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;margin-bottom:10px;transition:transform .15s;border:none;cursor:pointer;}
.rwa-social-btn:hover{transform:translateY(-2px);}
.rwa-btn-tg{background:#0088cc;color:#fff;}
.rwa-btn-wa{background:#25D366;color:#fff;}
.rwa-btn-ig1{background:linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045);color:#fff;}
.rwa-btn-ig2{background:linear-gradient(135deg,#405de6,#833ab4,#e1306c);color:#fff;}
.rwa-social-btn svg{flex-shrink:0;width:20px;height:20px;}
#rwa-close-btn{position:absolute;top:10px;right:12px;background:none;border:none;color:#888;font-size:20px;cursor:pointer;padding:2px 6px;border-radius:6px;}
#rwa-close-btn:hover{color:#FACC15;}
#rwa-popup-note{color:#666;font-size:11px;margin-top:14px;}
</style>
<div id="rwa-popup-overlay">
  <div id="rwa-popup-box">
    <button id="rwa-close-btn">✕</button>
    <h2>🌟 Join RWA Study Network</h2>
    <p>Stay updated — join our official channels</p>
    <a class="rwa-social-btn rwa-btn-tg" href="https://t.me/+SvWSdC034SVkN2U1" target="_blank" rel="noopener">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 14.03l-2.95-.924c-.64-.203-.654-.64.136-.953l11.57-4.461c.537-.194 1.006.131.836.956z"/></svg>
      Telegram Channel
    </a>
    <a class="rwa-social-btn rwa-btn-wa" href="https://whatsapp.com/channel/0029VbCbDOt0VycLRqoBz82x" target="_blank" rel="noopener">
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
  try{var val=localStorage.getItem(KEY);if(val&&(Date.now()-parseInt(val,10))<86400000){overlay.classList.add('rwa-hidden');return;}}catch(e){}
  document.getElementById('rwa-close-btn').addEventListener('click',function(){overlay.classList.add('rwa-hidden');try{localStorage.setItem(KEY,Date.now().toString());}catch(e){}});
  overlay.addEventListener('click',function(e){if(e.target===overlay){overlay.classList.add('rwa-hidden');try{localStorage.setItem(KEY,Date.now().toString());}catch(e){}}});
})();
</script>`;

function rewriteHtml(html) {
  html = html.replace(/<meta[^>]*x-frame-options[^>]*>/gi, "");
  html = html.replace(/<meta[^>]*content-security-policy[^>]*>/gi, "");
  html = html.replace(/(<head[^>]*>)/i, "$1" + FETCH_OVERRIDE);
  html = html.replace(new RegExp(`(href|src|action|data-src|data-href|data-url|poster|srcset)=(['"])(https?:)?//rwa\\.studybeepro\\.site`, "gi"), "$1=$2/proxy");
  html = html.replace(/(href|src|action|data-src|poster|srcset)=(['"])(\/(?!proxy\/|\/)[^'"> ]*)/gi, "$1=$2/proxy$3");
  html = html.replace(/(href|src|action|data-src|data-href|data-url|poster|srcset)=(['"])(?!https?:|\/\/|\/|#|data:|mailto:|tel:)([^'"> ]+)/gi, "$1=$2/proxy/$3");
  html = html.replace(new RegExp(`(['"\`])https?://rwa\\.streamfiles\\.eu\\.org(/[^'"\`]*)`, "g"), "$1/proxy$2");
  html = html.replace(new RegExp(`(['"\`])https?://rwa\\.streamfiles\\.eu\\.org(['"\`])`, "g"), "$1/proxy/$2");
  html = html.replace(/(['"`])(https?:)?\/\/api\.shanvikashyap9548\.workers\.dev/gi, "$1/api/video-worker");
  html = html.replace(/(window\.location(?:\.href)?\s*=\s*['"])(\/(?!proxy\/)[^'"]+)/gi, "$1/proxy$2");
  html = html.replace(new RegExp(`url\\((['"]?)https?://rwa\\.streamfiles\\.eu\\.org`, "g"), "url($1/proxy");
  html = html.replace(/url\((['"]?)(\/(?!proxy\/)[^'"\)]*)\)/g, (_, q, p) => `url(${q}/proxy${p})`);
  html = html.replace(/https:\/\/i\.ibb\.co\/yF4mhNPB\/f493d534-fbf8-4b31-b741-83b343f8a9e1\.jpg/g, "/rwa-logo.jpg");
  html = html.replace(/<title>[^<]*<\/title>/i, "<title>RWA Study Network</title>");
  html = html.replace(/StudyBee\s*Pro/gi, "RWA Study Network");
  html = html.replace(/<div([^>]*)class="brand"[^>]*>STUDY<span[^>]*>BEE<\/span><\/div>/gi, '<div$1class="brand">RWA <span>Study Network</span></div>');
  html = html.replace(/StudyBee/gi, "RWA Study Network");
  html = html.replace(/studybeepro/gi, "rwa study network");

  const TICKER = `<div id="rwa-ticker-wrap" style="width:100%;overflow:hidden;background:linear-gradient(90deg,#0a0a0a,#1a1200,#0a0a0a);border-top:1px solid #FACC1540;border-bottom:1px solid #FACC1540;padding:5px 0;z-index:999;"><style>@keyframes rwa-scroll{0%{transform:translateX(100vw)}100%{transform:translateX(-100%)}}#rwa-ticker-inner{display:inline-block;white-space:nowrap;animation:rwa-scroll 28s linear infinite;font-size:13px;font-weight:700;}#rwa-ticker-inner span.t1{color:#FACC15;}#rwa-ticker-inner span.t2{color:#e2c97e;font-size:12px;}#rwa-ticker-inner span.sep{color:#FACC1566;margin:0 18px;}</style><div id="rwa-ticker-inner"><span class="t1">🌟 RWA Study Network</span><span class="sep">✦</span><span class="t2">Development by 🌺⃞⃪꯭𝓐𝓷𝓴𝓲𝓽 𝓒𝓱𝓪𝓾𝓭𝓱𝓪𝓻𝔂🦅</span><span class="sep">✦</span><span class="t1">🌟 RWA Study Network</span><span class="sep">✦</span><span class="t2">Development by 🌺⃞⃪꯭𝓐𝓷𝓴𝓲𝓽 𝓒𝓱𝓪𝓾𝓭𝓱𝓪𝓻𝔂🦅</span><span class="sep">✦</span></div></div>`;
  html = html.replace(/(<\/header>)/i, "$1" + TICKER);
  html = html.replace(/(<\/body>)/i, SOCIAL_POPUP + "$1");
  return html;
}

function rewriteCss(css) {
  css = css.replace(new RegExp(`url\\((['"]?)https?://rwa\\.studybeepro\\.site`, "g"), "url($1/proxy");
  css = css.replace(/url\((['"]?)(\/(?!proxy\/)[^'"\)]*)\)/g, (_, q, p) => `url(${q}/proxy${p})`);
  return css;
}

function rewriteJs(js) {
  js = js.replace(new RegExp(`(['"\`])https?://rwa\\.streamfiles\\.eu\\.org`, "g"), "$1/proxy");
  return js.replace(/(['"`])api\/(?!proxy\/)/g, "$1/proxy/api/");
}

// Health
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// Extproxy
function rewriteConfigJson(data) {
  const result = { ...data };
  if (result["stylishName(brand)"] === "RWA" || result["stylishName(brand)"] === "rwa") result["stylishName(brand)"] = "RWA Study Network";
  if (typeof result.name === "string") result.name = result.name.replace(/\bRWA\b/g, "RWA Study Network");
  if (typeof result.player_url === "string") {
    let url = result.player_url.replace(/https?:\/\/rwa\.streamfiles\.eu\.org/gi, "").replace(/^\.\.\/+/, "/").replace(/^\.\/+/, "/");
    if (!url.startsWith("/")) url = "/" + url;
    if (!url.startsWith("/proxy/") && !url.startsWith("/proxy?")) url = "/proxy" + url;
    result.player_url = url;
  }
  return result;
}

app.options("/api/extproxy", (_req, res) => { res.setHeader("Access-Control-Allow-Origin", "*"); res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS"); res.setHeader("Access-Control-Allow-Headers", "*"); res.status(204).end(); });

app.all("/api/extproxy", async (req, res) => {
  const targetUrl = req.query["url"];
  if (!targetUrl || !targetUrl.startsWith("http")) { res.status(400).json({ error: "Missing or invalid url" }); return; }
  const fh = { "User-Agent": "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36", Accept: req.headers["accept"] || "application/json,*/*", "Accept-Language": "hi-IN,hi;q=0.9,en;q=0.8", Origin: SITE_ORIGIN, Referer: SITE_ORIGIN + "/rwax/" };
  for (const h of ["auth-key","authorization","user-id","source","client-service","x-kgs-token","x-kgs-short","timestamp","content-type"]) { if (req.headers[h]) fh[h] = req.headers[h]; }
  let body;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const ct = req.headers["content-type"] || "";
    if (ct.includes("application/json") && req.body) body = JSON.stringify(req.body);
    else if (ct.includes("application/x-www-form-urlencoded") && req.body) body = new URLSearchParams(req.body).toString();
  }
  try {
    const response = await fetch(targetUrl, { method: req.method === "OPTIONS" ? "GET" : req.method, headers: fh, body, signal: AbortSignal.timeout(20000) });
    const ct = response.headers.get("content-type") || "";
    res.setHeader("Access-Control-Allow-Origin", "*"); res.setHeader("Access-Control-Allow-Credentials", "true"); res.setHeader("Access-Control-Allow-Headers", "*"); res.status(response.status);
    if (ct.includes("application/json")) { const json = await response.json(); res.setHeader("Content-Type", "application/json"); res.json(rewriteConfigJson(json)); }
    else { res.setHeader("Content-Type", ct); res.send(Buffer.from(await response.arrayBuffer())); }
  } catch { if (!res.headersSent) res.status(502).json({ error: "Upstream failed" }); }
});

// Video worker
app.options("/api/video-worker/*", (_req, res) => { res.setHeader("Access-Control-Allow-Origin", "*"); res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS"); res.setHeader("Access-Control-Allow-Headers", "Content-Type"); res.status(204).end(); });
app.all("/api/video-worker/*", async (req, res) => {
  const targetUrl = WORKER_BASE + req.url.replace("/api/video-worker", "");
  const fh = { "User-Agent": "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36", Accept: req.headers["accept"] || "*/*", "Accept-Language": "hi-IN,hi;q=0.9,en;q=0.8", Referer: SITE_ORIGIN + "/rwax/player", Origin: SITE_ORIGIN };
  if (req.headers["cookie"]) fh["Cookie"] = req.headers["cookie"];
  try {
    const response = await fetch(targetUrl, { method: req.method, headers: fh, signal: AbortSignal.timeout(20000) });
    res.setHeader("Access-Control-Allow-Origin", "*"); res.setHeader("Content-Type", response.headers.get("content-type") || ""); res.status(response.status);
    res.send(Buffer.from(await response.arrayBuffer()));
  } catch { if (!res.headersSent) res.status(502).json({ error: "Video worker unreachable" }); }
});

// Main proxy
app.all("/proxy/*", async (req, res) => {
  const targetUrl = TARGET_BASE + req.url.replace(/^\/proxy/, "");
  const fh = { "User-Agent": "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36", Accept: req.headers["accept"] || "*/*", "Accept-Language": req.headers["accept-language"] || "hi-IN,hi;q=0.9,en;q=0.8", "Accept-Encoding": "identity", Referer: TARGET_BASE + "/", Origin: TARGET_BASE };
  for (const h of ["dev-jisu-key","dev-jisu-signature","authorization","user-id"]) { if (req.headers[h]) fh[h] = req.headers[h]; }
  if (req.headers["cookie"]) fh["Cookie"] = req.headers["cookie"];
  let bodyPayload;
  const method = req.method.toUpperCase();
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    const ct = req.headers["content-type"] || "";
    if (ct.includes("application/json") && req.body) { bodyPayload = JSON.stringify(req.body); fh["Content-Type"] = "application/json"; }
    else if (ct.includes("application/x-www-form-urlencoded") && req.body) { bodyPayload = new URLSearchParams(req.body).toString(); fh["Content-Type"] = "application/x-www-form-urlencoded"; }
  }
  try {
    const response = await fetch(targetUrl, { method, headers: fh, body: bodyPayload, redirect: "follow", signal: AbortSignal.timeout(30000) });
    const ct = response.headers.get("content-type") || "";
    const rawCookie = response.headers.get("set-cookie");
    if (rawCookie) res.setHeader("Set-Cookie", rawCookie.replace(/;\s*domain=[^;,]*/gi, "").replace(/;\s*samesite=(?:strict|lax)/gi, "; SameSite=None").replace(/;\s*secure/gi, ""));
    res.setHeader("Content-Type", ct); res.setHeader("Access-Control-Allow-Origin", "*"); res.setHeader("Access-Control-Allow-Credentials", "true"); res.removeHeader("X-Frame-Options"); res.status(response.status);
    if (ct.includes("text/html")) res.send(rewriteHtml(await response.text()));
    else if (ct.includes("text/css")) res.send(rewriteCss(await response.text()));
    else if (ct.includes("javascript") || ct.includes("ecmascript")) res.send(rewriteJs(await response.text()));
    else { const buf = Buffer.from(await response.arrayBuffer()); res.setHeader("Content-Length", buf.length); res.send(buf); }
  } catch { if (!res.headersSent) res.status(502).send("Proxy error"); }
});

// Root
app.get("/", (_req, res) => {
  res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>RWA Study Network</title><style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;overflow:hidden;background:#000}iframe{width:100%;height:100%;border:none;display:block}</style></head><body><iframe src="/proxy/" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation" allow="autoplay;fullscreen;encrypted-media"></iframe></body></html>`);
});

export default app;
