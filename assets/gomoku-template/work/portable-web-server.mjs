import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const clientDirectory = resolve(root, "dist", "client");
const worker = (await import("../dist/server/index.js")).default;
const host = process.env.WEB_HOST || "127.0.0.1";
const port = Number(process.env.WEB_PORT || 3015);

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

function safeAssetPath(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const candidate = resolve(clientDirectory, `.${decoded}`);
  const directory = clientDirectory.toLowerCase();
  const prefix = `${clientDirectory}${sep}`.toLowerCase();
  const normalized = candidate.toLowerCase();
  return normalized === directory || normalized.startsWith(prefix) ? candidate : null;
}

async function assetResponse(request) {
  const url = new URL(request.url);
  const path = safeAssetPath(url.pathname);
  if (!path) return new Response("Forbidden", { status: 403 });
  try {
    const details = await stat(path);
    if (!details.isFile()) return new Response("Not found", { status: 404 });
    const headers = new Headers({
      "Content-Type": contentTypes.get(extname(path).toLowerCase()) || "application/octet-stream",
      "Cache-Control": url.pathname.startsWith("/_next/static/")
        ? "public, max-age=31536000, immutable"
        : "no-cache",
    });
    if (request.method === "HEAD") return new Response(null, { status: 200, headers });
    return new Response(await readFile(path), { status: 200, headers });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

const assets = { fetch: assetResponse };

async function handleRequest(request, response) {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || `${host}:${port}`}`);
    const init = {
      method: request.method,
      headers: request.headers,
    };
    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = Readable.toWeb(request);
      init.duplex = "half";
    }
    const webRequest = new Request(url, init);
    const directAsset = await assetResponse(webRequest);
    const webResponse = directAsset.status === 404
      ? await worker.fetch(webRequest, { ASSETS: assets }, { waitUntil() {} })
      : directAsset;

    response.writeHead(webResponse.status, Object.fromEntries(webResponse.headers.entries()));
    if (!webResponse.body) {
      response.end();
      return;
    }
    Readable.fromWeb(webResponse.body).pipe(response);
  } catch (error) {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(error instanceof Error ? error.message : "Portable server failed");
  }
}

createServer(handleRequest).listen(port, host, () => {
  console.log(`Luozi Review portable web server: http://${host}:${port}`);
});
