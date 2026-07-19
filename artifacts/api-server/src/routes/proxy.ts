import { Router, type Request, type Response } from "express";
import { logger } from "../lib/logger";

const router = Router();
const TARGET_BASE = "https://rwa.studybeepro.in";

// JS snippet injected into every proxied HTML page.
// Intercepts fetch() / XHR calls to external domains and routes them through
// /api/extproxy so CORS and Origin checks pass on the upstream API servers.
const FETCH_OVERRIDE = `
<script data-proxy-inject="1">
(function(){
  var _BLOCKED=['rwa.smexfot.workers.dev','kgsfreebatch.free.nf','shanvikashyap9548.workers.dev'];
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

// Rewrite all URLs in HTML pointing to the target to go through /proxy
function rewriteHtml(html: string): string {
  // Remove headers that block embedding
  html = html.replace(/<meta[^>]*x-frame-options[^>]*>/gi, "");
  html = html.replace(/<meta[^>]*content-security-policy[^>]*>/gi, "");

  // Inject the fetch override as early as possible (right after <head>)
  html = html.replace(/(<head[^>]*>)/i, "$1" + FETCH_OVERRIDE);

  // Absolute target URLs in attributes
  html = html.replace(
    new RegExp(
      `(href|src|action|data-src|data-href|data-url|poster|srcset)=(['"])(https?:)?//rwa\\.studybeepro\\.in`,
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

  // JS string literals containing the target domain
  html = html.replace(
    new RegExp(`(['"\`])https?://rwa\\.studybeepro\\.in(/[^'"\`]*)`, "g"),
    "$1/proxy$2"
  );
  html = html.replace(
    new RegExp(`(['"\`])https?://rwa\\.studybeepro\\.in(['"\`])`, "g"),
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
    new RegExp(`url\\((['"]?)https?://rwa\\.studybeepro\\.in`, "g"),
    "url($1/proxy"
  );
  html = html.replace(
    /url\((['"]?)(\/(?!proxy\/)[^'"\)]*)\)/g,
    (_, q, path) => `url(${q}/proxy${path})`
  );

  // ── Branding rewrites ──────────────────────────────────────────────────────
  // Replace page <title>
  html = html.replace(/<title>[^<]*<\/title>/i, "<title>RWA Study Network</title>");

  // "studybeepro" as visible text (not inside URLs/hrefs — those were already
  // rewritten above, so by this point any remaining occurrences are display text)
  html = html.replace(/StudyBee\s*Pro/gi, "RWA Study Network");
  html = html.replace(/StudyBee/gi, "RWA Study Network");
  html = html.replace(/studybeepro/gi, "rwa study network");

  // Comment strings referencing StudyBee (CSS/JS comments)
  html = html.replace(/StudyBee Dark/gi, "RWA Study Network Dark");

  return html;
}

// Rewrite URLs in CSS files
function rewriteCss(css: string): string {
  css = css.replace(
    new RegExp(`url\\((['"]?)https?://rwa\\.studybeepro\\.in`, "g"),
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
    new RegExp(`(['"\`])https?://rwa\\.studybeepro\\.in`, "g"),
    "$1/proxy"
  );
  return js;
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

    if (contentType.includes("text/html")) {
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
