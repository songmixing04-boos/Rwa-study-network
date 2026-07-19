import { Router, type Request, type Response } from "express";
import { logger } from "../lib/logger";

const router = Router();
const SITE_ORIGIN = "https://rwa.studybeepro.in";

// Rewrites JSON config responses so player_url and domain point through our proxy
function rewriteConfigJson(data: Record<string, unknown>): Record<string, unknown> {
  const result = { ...data };

  // Rebrand: "RWA" display name → "RWA Study Network"
  if (result["stylishName(brand)"] === "RWA" || result["stylishName(brand)"] === "rwa") {
    result["stylishName(brand)"] = "RWA Study Network";
  }
  if (typeof result.name === "string") {
    result.name = result.name.replace(/\bRWA\b/g, "RWA Study Network");
  }

  // Rewrite player_url so navigation stays inside /proxy
  if (typeof result.player_url === "string") {
    let url = result.player_url;

    // Strip the target origin if present
    url = url.replace(/https?:\/\/rwa\.studybeepro\.in/gi, "");

    // Resolve relative segments: "../foo.html" → "/foo.html", "./foo" → "/foo"
    url = url.replace(/^\.\.\/+/, "/");
    url = url.replace(/^\.\/+/, "/");

    // Ensure it starts with a slash
    if (!url.startsWith("/")) url = "/" + url;

    // Prefix with /proxy if not already proxied
    if (!url.startsWith("/proxy/") && !url.startsWith("/proxy?")) {
      url = "/proxy" + url;
    }

    result.player_url = url;
  }

  return result;
}

// Handle preflight
router.options("/", (_req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.status(204).end();
});

router.all("/", async (req: Request, res: Response) => {
  const targetUrl = req.query["url"] as string;

  if (!targetUrl || !targetUrl.startsWith("http")) {
    res.status(400).json({ error: "Missing or invalid url parameter" });
    return;
  }

  // Build forwarded headers — use site origin so upstream APIs trust the request
  const forwardHeaders: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    Accept: (req.headers["accept"] as string) || "application/json, */*",
    "Accept-Language": "hi-IN,hi;q=0.9,en;q=0.8",
    Origin: SITE_ORIGIN,
    Referer: SITE_ORIGIN + "/",
  };

  // Forward auth / custom headers that the page JS sends
  const passThroughHeaders = [
    "auth-key", "authorization", "user-id", "source",
    "client-service", "x-kgs-token", "x-kgs-short", "timestamp",
    "content-type",
  ];
  for (const h of passThroughHeaders) {
    if (req.headers[h]) {
      forwardHeaders[h] = req.headers[h] as string;
    }
  }

  // Body for POST
  let body: string | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const ct = (req.headers["content-type"] as string) || "";
    if (ct.includes("application/json") && req.body) {
      body = JSON.stringify(req.body);
    } else if (ct.includes("application/x-www-form-urlencoded") && req.body) {
      body = new URLSearchParams(req.body as Record<string, string>).toString();
    }
  }

  try {
    const response = await fetch(targetUrl, {
      method: req.method === "OPTIONS" ? "GET" : req.method,
      headers: forwardHeaders,
      body,
      signal: AbortSignal.timeout(20000),
    } as RequestInit);

    const contentType = response.headers.get("content-type") || "";

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.status(response.status);

    if (contentType.includes("application/json")) {
      const json = await response.json() as Record<string, unknown>;
      // Rewrite player_url so navigation stays inside our proxy
      const rewritten = rewriteConfigJson(json);
      res.setHeader("Content-Type", "application/json");
      res.json(rewritten);
    } else {
      res.setHeader("Content-Type", contentType);
      const buf = Buffer.from(await response.arrayBuffer());
      res.send(buf);
    }
  } catch (err) {
    logger.error({ err, targetUrl }, "Extproxy fetch error");
    if (!res.headersSent) {
      res.status(502).json({ error: "Upstream request failed" });
    }
  }
});

export default router;
