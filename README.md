# Swamp City — Studio Site

Static one-page site for swampcityrecs.com. Plain HTML/CSS/JS — no build step.
Deployed via GitHub Pages on the custom domain.

## Files
- `index.html` — the whole site (styles + starfield script are inline)
- `CNAME` — tells GitHub Pages to serve `swampcityrecs.com` (don't delete)
- `robots.txt` / `sitemap.xml` — help Google index the site
- `og-image.png` — **TODO**: add a 1200×630 share image, then uncomment the
  `og:image` line in `index.html`

## Deploy (GitHub Pages)
1. Create a repo and push these files to the `main` branch (root).
2. Repo **Settings → Pages**:
   - Source: **Deploy from a branch**
   - Branch: **main** / **/ (root)** → Save
3. Under **Custom domain**, enter `swampcityrecs.com` → Save.
   (GitHub uses the `CNAME` file already in the repo.)
4. Wait for DNS (below), then tick **Enforce HTTPS**.

## DNS at GoDaddy
In GoDaddy → your domain → **DNS / Manage DNS**.

**Apex (`swampcityrecs.com`)** — add four A records, Name `@`, pointing to GitHub Pages:
```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```
(Optional IPv6 — AAAA records, Name `@`:)
```
2606:50c0:8000::153
2606:50c0:8001::153
2606:50c0:8002::153
2606:50c0:8003::153
```

**www** — add a CNAME record, Name `www`, value `YOUR-GH-USERNAME.github.io`

Notes:
- Remove any old GoDaddy "Forwarding"/parked A or CNAME records first, or they'll
  fight the new ones (this is what was causing the redirect failures).
- GitHub auto-redirects between apex and www once both are configured.
- Verify with: `dig swampcityrecs.com +noall +answer -t A`

## After it's live (fixes the indexing issue)
1. In a private window, load `https://swampcityrecs.com/` and confirm HTTPS + correct content.
2. Google Search Console → **Sitemaps** → submit `sitemap.xml`.
3. Search Console → **URL Inspection** on `https://swampcityrecs.com/` → **Request indexing**.
4. The old "Page with redirect" items should clear once the clean http→https /
   www→apex redirects are in place.

## Adding the video + screenshots (do this during a testing pass)
The "In Action" section already has slots. You don't need the physical device —
**Unity Recorder** can capture clean footage straight from Editor Play Mode at a
controlled resolution/framerate (Window → General → Recorder). Screenshots can
also come from `ScreenCapture.CaptureScreenshot` or the Recorder's image mode.

Put files in a `media/` folder in the repo, named exactly:

**Video** (`media/gameplay.mp4`, optional `media/gameplay.webm`, `media/gameplay-poster.jpg`)
- Short loop, ~10–25s. 720p is plenty for web (1080p only if it stays small).
- Export H.264 MP4. For autoplay on mobile it must stay **muted** (already set).
- Keep it under ~15–20 MB. GitHub blocks files >100 MB and Pages has a ~100 GB/mo
  bandwidth soft cap — a short compressed clip is fine; no Git LFS needed.
- For a longer trailer, upload to YouTube and use the iframe option instead.
- Then: in `index.html`, delete the video placeholder div and uncomment the
  `<video>` block.

**Screenshots** (`media/shot-1.webp` … `media/shot-4.webp`)
- Capture at ~1600px wide (2× for sharp display), then convert to WebP to shrink.
- Then: delete the screenshot placeholder divs and uncomment the `<img>` tags.
  Update the `alt` text to match what each shot actually shows.

Until the files are added, the page shows tasteful "coming soon" placeholder tiles —
so it's safe to ship now and populate later.

## Local preview
```
python3 -m http.server 8000
# open http://localhost:8000
```
