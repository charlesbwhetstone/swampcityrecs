// Launch countdown — Electric Crust: Galactic Pizza Delivery.
    //
    // Standalone on purpose: the press page does not load site.js (it has no
    // starfield, no reveal-on-scroll, no menu button), so the countdown lives
    // in its own file that both pages can include without pulling in scripts
    // that expect elements they do not have.
    //
    // Wrapped in try/catch to match site.js: if this fails, the static launch
    // date sentence in the markup stays visible and the page is unharmed.
    try {
    (function () {
      // Midnight, January 26 2027, America/Chicago (CST, UTC-6).
      // Every visitor worldwide counts down to the same instant.
      // Change the date in ONE place: the data-launch attribute in the markup.
      var DEFAULT_LAUNCH = '2027-01-26T00:00:00-06:00';

      var widgets = [];

      function pad(n) { return n < 10 ? '0' + n : String(n); }

      function setup(el) {
        var target = Date.parse(el.getAttribute('data-launch') || DEFAULT_LAUNCH);
        // Unparseable date: bail and leave the readable fallback sentence in
        // place. A wrong attribute should never render "NaN" to a journalist.
        if (isNaN(target)) return null;
        return {
          el: el,
          target: target,
          d: el.querySelector('[data-f="d"]'),
          h: el.querySelector('[data-f="h"]'),
          m: el.querySelector('[data-f="m"]'),
          s: el.querySelector('[data-f="s"]'),
          sr: el.querySelector('[data-f="sr"]'),
          lastDays: null
        };
      }

      function render(w, now) {
        var ms = w.target - now;

        if (ms <= 0) {
          w.el.classList.add('is-launched');
          if (w.sr && w.lastDays !== 'out') {
            w.sr.textContent = 'Electric Crust is out now.';
            w.lastDays = 'out';
          }
          return true;
        }

        var total = Math.floor(ms / 1000);
        var days  = Math.floor(total / 86400);
        var hours = Math.floor((total % 86400) / 3600);
        var mins  = Math.floor((total % 3600) / 60);
        var secs  = total % 60;

        if (w.d) w.d.textContent = pad(days);
        if (w.h) w.h.textContent = pad(hours);
        if (w.m) w.m.textContent = pad(mins);
        if (w.s) w.s.textContent = pad(secs);

        // Announce once per DAY, not once per second. A live region that
        // fires every tick makes the page unusable with a screen reader.
        if (w.sr && days !== w.lastDays) {
          w.sr.textContent = days + (days === 1 ? ' day' : ' days') +
            ' until Electric Crust launches on January 26, 2027.';
          w.lastDays = days;
        }
        return false;
      }

      function tick() {
        var now = Date.now();
        var running = false;
        for (var i = 0; i < widgets.length; i++) {
          if (!render(widgets[i], now)) running = true;
        }
        if (!running) return; // launched — stop scheduling entirely

        // Re-derive from the clock every tick and align to the next second
        // boundary. setInterval(fn, 1000) accumulates drift and comes back
        // visibly wrong after a throttled background tab.
        setTimeout(tick, 1000 - (Date.now() % 1000) + 8);
      }

      function init() {
        var nodes = document.querySelectorAll('.countdown');
        for (var i = 0; i < nodes.length; i++) {
          var w = setup(nodes[i]);
          if (w) {
            widgets.push(w);
            nodes[i].classList.add('is-ready'); // reveals the digits, hides fallback
          }
        }
        if (!widgets.length) return;

        tick();

        // Background tabs throttle timers hard. Repaint the moment we return
        // so the numbers are never visibly stale on tab focus.
        document.addEventListener('visibilitychange', function () {
          if (!document.hidden) {
            var now = Date.now();
            for (var i = 0; i < widgets.length; i++) render(widgets[i], now);
          }
        });
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        init();
      }
    })();
    } catch (e) {}
