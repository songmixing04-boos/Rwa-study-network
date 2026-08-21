import { Router, type Request, type Response } from "express";
import { logger } from "../lib/logger";

const router = Router();
// The Cloudflare Worker that resolves video stream URLs
const WORKER_BASE = "https://api.shanvikashyap9548.workers.dev";
const SITE_ORIGIN = "https://rwa.studybeepro.site";

router.all("/{*path}", async (req: Request, res: Response) => {
  const targetUrl = WORKER_BASE + req.url;

  const forwardHeaders: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    Accept: (req.headers["accept"] as string) || "*/*",
    "Accept-Language": "hi-IN,hi;q=0.9,en;q=0.8",
    Referer: SITE_ORIGIN + "/rwax/player",
    Origin: SITE_ORIGIN,
  };

  if (req.headers["cookie"]) {
    forwardHeaders["Cookie"] = req.headers["cookie"] as string;
  }

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      signal: AbortSignal.timeout(20000),
    } as RequestInit);

    const contentType = response.headers.get("content-type") || "";

    // Allow cross-origin so the browser's fetch() in the iframe can read it
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Content-Type", contentType);
    res.status(response.status);

    const buf = Buffer.from(await response.arrayBuffer());
    res.send(buf);
  } catch (err) {
    logger.error({ err, targetUrl }, "Video worker proxy error");
    if (!res.headersSent) {
      res.status(502).json({ error: "Video worker unreachable" });
    }
  }
});

// Handle preflight
router.options("/{*path}", (_req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.status(204).end();
});

export default router;
