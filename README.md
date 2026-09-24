# Swamp City — Studio Site

Multi-page static site for swampcityrecs.com, owned by Swamp City LLC.
Plain HTML/CSS/JS — no build step, no framework, no package.json.

## Pages
- `index.html` — home
- `electric-crust/` — Electric Crust: Galactic Pizza Delivery
- `projects/`, `projects/blood-moon/` — other projects
- `press/` (+ `press/fact-sheet.html`) — press kit
- `merch/` — merch entry point; links out to the external store at `shop.swampcityrecs.com`
- `privacy/` — privacy policy

Each page carries its own copy of the nav. When adding a nav link, update every page
whose nav has more than a Home link (`privacy/` intentionally has only Home).

## Shared files
- `assets/style.css`, `assets/site.js`, `assets/countdown.js`, `assets/fonts/` — shared CSS/JS/fonts.
  Bump the `?v=` query on the referencing `<link>`/`<script>` tags when you change them.
- `media/` — screenshots, video clips, logos, store/social banners
- `og-image.jpg` — 1200×630 share image used by all pages
- `robots.txt` / `sitemap.xml` — indexing. Add every new public page to the sitemap.
- `CNAME` — custom domain `swampcityrecs.com` (don't delete)
- `_headers` — **protected.** Security headers (including a strict CSP: scripts from `'self'` only)
  and cache rules. Applied when served by the Cloudflare Worker; ignored by GitHub Pages.
  Don't add third-party scripts or embeds without widening the CSP first, and treat
  any CSP change as a security change that needs review.

## Hosting and DNS
- **DNS:** managed in Cloudflare. GoDaddy remains the registrar only, with nameservers pointed at Cloudflare.
- **Hosting (Worker live since 2026-09-24):** Cloudflare Worker with static assets, `swampcityrecs-site`, configured
  in `wrangler.jsonc` and attached to `swampcityrecs.com` as a Worker custom domain. This is the same pattern as the
  other Worker sites. On Workers, `_headers` is applied. Videos are served from R2 (see Updating media).
  - Deploy: `npx wrangler deploy` from the repo root, using wrangler's own login. Don't have `CF_API_TOKEN` or
    `CLOUDFLARE_API_TOKEN` set in that shell, because wrangler will use it instead. `.assetsignore` keeps repo-only files
    (README, wrangler config, CNAME, .git, src/, scripts/, .DS_Store) from being served.
  - Rollback window: GitHub Pages stays enabled and `CNAME` stays in the repo until 2026-10-01, then disable GitHub
    Pages. To roll back before then, remove the custom domain from the Worker and restore the four GitHub Pages
    A records on the apex (`185.199.108-111.153`, proxied).
  - Verify the serving path: `curl -sI https://swampcityrecs.com | grep -i content-security-policy`.
    If the header is present, the Worker is serving and `_headers` is live.
- **Records (names only; values live in Cloudflare):**
  - apex `swampcityrecs.com`: Worker custom domain (Cloudflare-managed record)
  - `www`: proxied placeholder `A 192.0.2.0`, plus a Single Redirect rule that sends a 301 to
    `https://swampcityrecs.com` and preserves path and query
  - email: Google (MX `smtp.google.com`) plus SPF, DKIM (`google._domainkey`), and DMARC TXT records
  - `shop`: A record to the Fourthwall storefront, **DNS only (grey cloud)**; `support.shop` carries Fourthwall's
    support-mail records (MX, SPF, DKIM, DMARC)
  - The old GoDaddy webmail CNAME `email.swampcityrecs.com` was removed on 2026-09-24 because it could not serve
    HTTPS under HSTS `includeSubDomains`.

## Updating media
- Files in `media/` are replaced in place under the same filename. The `/media/*` no-cache rule in `_headers`
  exists so repeat visitors revalidate instead of seeing stale clips.
- **Videos (`media/*.mp4`) are served from R2** (bucket `swampcityrecs-media`) by `src/worker.js`, because Workers
  static assets ignore Range requests and iOS Safari needs 206 responses. After adding or replacing a clip, run
  `scripts/sync-media.sh` and then `npx wrangler deploy`. If a clip is missing from R2, the Worker falls back to the
  static copy (full 200, no seeking).
- Keep web clips short and compressed (roughly under 15–20 MB). Autoplay video must stay muted.
- Screenshots: capture around 1600px wide and convert to WebP.
- Long trailers belong on YouTube, not in the repo.

## Local preview
```
python3 -m http.server 8000
# open http://localhost:8000
```

Last verified: 2026-09-24 (repo contents; Worker config tested locally with `wrangler dev`, not yet deployed)
