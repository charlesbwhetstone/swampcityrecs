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
  and cache rules. This file is honored by Cloudflare Pages, not by GitHub Pages.
  Don't add third-party scripts or embeds without widening the CSP first, and treat
  any CSP change as a security change that needs review.

## Hosting and DNS
- **DNS:** managed in Cloudflare. GoDaddy remains the registrar only, with nameservers pointed at Cloudflare.
- **Hosting path: UNVERIFIED — confirm in Cloudflare dashboard.** The repo has GitHub Pages enabled,
  and `_headers` implies Cloudflare Pages. Check which one actually serves the site:
  `curl -sI https://swampcityrecs.com | grep -i -E 'server|content-security|cache-control'`
  A `content-security-policy` header present means Cloudflare Pages (`_headers` is live).
  Absent means GitHub Pages behind the Cloudflare proxy (`_headers` is inert). Update this section with the result.
- **Records (names only; values live in Cloudflare):**
  - apex `swampcityrecs.com` and `www` — the site
  - email — Cloudflare Email Routing (MX) plus SPF, DKIM, and DMARC TXT records
  - `shop` — planned CNAME → `shops.myshopify.com`, **DNS only (grey cloud)**, for the Shopify storefront

## Updating media
- Files in `media/` are replaced in place under the same filename. The `/media/*` no-cache rule in `_headers`
  exists so repeat visitors revalidate instead of seeing stale clips.
- Keep web clips short and compressed (roughly under 15–20 MB). Autoplay video must stay muted.
- Screenshots: capture around 1600px wide and convert to WebP.
- Long trailers belong on YouTube, not in the repo.

## Local preview
```
python3 -m http.server 8000
# open http://localhost:8000
```

Last verified: 2026-09-24 @ 7792534 (repo contents; hosting path not yet verified)
