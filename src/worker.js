// swampcityrecs-site Worker.
//
// Static assets serve the whole site. This script only runs for /media/*.mp4
// (assets.run_worker_first in wrangler.jsonc). Workers static assets answer a
// Range request with the full file as 200. iOS Safari and scrubbing in any
// browser need 206 Partial Content, so the clips come from R2, which supports
// ranged reads.
//
// _headers is not applied to responses the Worker builds, so this script parses
// the repo's _headers (bundled as text) and applies the matching rules itself.
// _headers stays the single source of truth for security and cache headers.

import HEADERS_FILE from "../_headers";

const HEADER_RULES = parseHeadersFile(HEADERS_FILE);
const VIDEO_PATH = /^\/media\/[^/]+\.mp4$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;
    if (!VIDEO_PATH.test(url.pathname) || (method !== "GET" && method !== "HEAD")) {
      return env.ASSETS.fetch(request);
    }

    const key = decodeURIComponent(url.pathname.slice(1)); // "media/Trailer.mp4"
    const meta = await env.MEDIA.head(key);
    if (!meta) {
      // Not uploaded to R2: fall back to the static copy (full 200, no ranges).
      return env.ASSETS.fetch(request);
    }

    const size = meta.size;
    const etag = meta.httpEtag;
    const headers = new Headers();
    for (const [name, value] of headersFor(url.pathname)) headers.set(name, value);
    headers.set("Content-Type", "video/mp4");
    headers.set("Accept-Ranges", "bytes");
    headers.set("ETag", etag);
    headers.set("Last-Modified", meta.uploaded.toUTCString());

    const inm = request.headers.get("If-None-Match");
    if (inm && inm.split(",").map((s) => s.trim()).some((t) => t === etag || t === "*")) {
      return new Response(null, { status: 304, headers });
    }

    let range = parseRange(request.headers.get("Range"), size);
    const ifRange = request.headers.get("If-Range");
    if (range && ifRange && ifRange !== etag) range = null; // stale validator: send the full file

    if (range && range.unsatisfiable) {
      headers.set("Content-Range", `bytes */${size}`);
      return new Response(null, { status: 416, headers });
    }

    if (range) {
      const { offset, length } = range;
      headers.set("Content-Range", `bytes ${offset}-${offset + length - 1}/${size}`);
      headers.set("Content-Length", String(length));
      if (method === "HEAD") return new Response(null, { status: 206, headers });
      const obj = await env.MEDIA.get(key, { range: { offset, length } });
      if (!obj) return env.ASSETS.fetch(request);
      return new Response(obj.body, { status: 206, headers });
    }

    headers.set("Content-Length", String(size));
    if (method === "HEAD") return new Response(null, { status: 200, headers });
    const obj = await env.MEDIA.get(key);
    if (!obj) return env.ASSETS.fetch(request);
    return new Response(obj.body, { status: 200, headers });
  },
};

// Single "bytes=" range only; anything else is ignored (full 200), per RFC 9110.
export function parseRange(header, size) {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (m[1] === "" && m[2] === "")) return null;
  if (m[1] === "") {
    const suffix = Number(m[2]);
    if (suffix === 0) return { unsatisfiable: true };
    const length = Math.min(suffix, size);
    return { offset: size - length, length };
  }
  const start = Number(m[1]);
  let end = m[2] === "" ? size - 1 : Number(m[2]);
  if (start >= size) return { unsatisfiable: true };
  if (end < start) return null;
  end = Math.min(end, size - 1);
  return { offset: start, length: end - start + 1 };
}

export function parseHeadersFile(text) {
  const rules = [];
  let current = null;
  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith("#")) continue;
    if (!/^\s/.test(raw)) {
      current = { pattern: raw.trim(), headers: [] };
      rules.push(current);
      continue;
    }
    const idx = raw.indexOf(":");
    if (current && idx > 0) current.headers.push([raw.slice(0, idx).trim(), raw.slice(idx + 1).trim()]);
  }
  return rules;
}

function headersFor(pathname) {
  const out = new Map();
  for (const rule of HEADER_RULES) {
    const p = rule.pattern;
    const match = p.endsWith("*") ? pathname.startsWith(p.slice(0, -1)) : pathname === p;
    if (!match) continue;
    for (const [name, value] of rule.headers) out.set(name.toLowerCase(), [name, value]);
  }
  return [...out.values()];
}
