import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// Resolve Wrangler's text import without installing a bundler or contacting R2.
const headersText = await readFile(new URL("../_headers", import.meta.url), "utf8");
const source = await readFile(new URL("../src/worker.js", import.meta.url), "utf8");
const textImport = 'import HEADERS_FILE from "../_headers";';
assert.ok(source.includes(textImport));
const moduleSource = source.replace(textImport, `const HEADERS_FILE = ${JSON.stringify(headersText)};`);
const { default: worker } = await import(`data:text/javascript;base64,${Buffer.from(moduleSource).toString("base64")}`);

function assetsOnly() {
  const calls = [];
  return {
    calls,
    env: { ASSETS: { fetch: async (request) => {
      calls.push(request);
      return new Response(request.method === "HEAD" ? null : "static asset");
    } } },
  };
}

function production() {
  const state = assetsOnly();
  state.reads = [];
  state.env.MEDIA = {
    head: async (key) => {
      state.reads.push(["head", key]);
      return { size: 10, httpEtag: '"video-v1"', uploaded: new Date("2026-09-24T00:00:00Z") };
    },
    get: async (key, options) => {
      state.reads.push(["get", key, options]);
      return { body: options ? "2345" : "0123456789" };
    },
  };
  return state;
}

test("preview video GET and HEAD work without an R2 binding", async () => {
  for (const method of ["GET", "HEAD"]) {
    const { env, calls } = assetsOnly();
    env.STATIC_MEDIA_PREVIEW = "true";
    const request = new Request("https://preview.example/media/Trailer.mp4", {
      method, headers: { Range: "bytes=2-5" },
    });
    const response = await worker.fetch(request, env);
    assert.equal(response.status, 200);
    assert.equal(await response.text(), method === "HEAD" ? "" : "static asset");
    assert.deepEqual(calls, [request]);
  }
});

test("ads.txt and ordinary pages use static assets", async () => {
  for (const path of ["/ads.txt", "/", "/privacy/"]) {
    const { env, calls } = assetsOnly();
    const response = await worker.fetch(new Request(`https://example.com${path}`), env);
    assert.equal(response.status, 200);
    assert.equal(calls.length, 1);
  }
});

test("production Range GET retains R2 reads, 206 and security headers", async () => {
  for (const previewFlag of [undefined, "false"]) {
    const { env, reads, calls } = production();
    env.STATIC_MEDIA_PREVIEW = previewFlag;
    const response = await worker.fetch(new Request("https://example.com/media/Trailer.mp4", {
      headers: { Range: "bytes=2-5" },
    }), env);
    assert.equal(response.status, 206);
    assert.equal(response.headers.get("Content-Range"), "bytes 2-5/10");
    assert.equal(response.headers.get("Content-Length"), "4");
    assert.equal(response.headers.get("Accept-Ranges"), "bytes");
    assert.ok(response.headers.get("Content-Security-Policy"));
    assert.equal(await response.text(), "2345");
    assert.deepEqual(reads, [["head", "media/Trailer.mp4"], ["get", "media/Trailer.mp4", { range: { offset: 2, length: 4 } }]]);
    assert.equal(calls.length, 0);
  }
});

test("production Range HEAD does not fetch the video body", async () => {
  const { env, reads } = production();
  const response = await worker.fetch(new Request("https://example.com/media/Trailer.mp4", {
    method: "HEAD", headers: { Range: "bytes=2-5" },
  }), env);
  assert.equal(response.status, 206);
  assert.equal(await response.text(), "");
  assert.deepEqual(reads, [["head", "media/Trailer.mp4"]]);
});

test("production unsatisfiable range returns 416", async () => {
  const { env, reads } = production();
  const response = await worker.fetch(new Request("https://example.com/media/Trailer.mp4", {
    headers: { Range: "bytes=20-30" },
  }), env);
  assert.equal(response.status, 416);
  assert.equal(response.headers.get("Content-Range"), "bytes */10");
  assert.equal(reads.length, 1);
});

test("production missing media keeps the existing static fallback", async () => {
  const { env, calls } = assetsOnly();
  env.MEDIA = { head: async () => null };
  const response = await worker.fetch(new Request("https://example.com/media/Trailer.mp4"), env);
  assert.equal(response.status, 200);
  assert.equal(calls.length, 1);
});

test("missing production R2 does not silently activate preview mode", async () => {
  const { env, calls } = assetsOnly();
  await assert.rejects(worker.fetch(new Request("https://example.com/media/Trailer.mp4"), env), TypeError);
  assert.equal(calls.length, 0);
});
