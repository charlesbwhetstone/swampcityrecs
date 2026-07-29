// Lightweight drifting starfield — parallax stars scrolling left, like the game.
    (function () {
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) return;
      var c = document.getElementById('stars');
      var ctx = c.getContext('2d');
      var stars = [];
      function size() { c.width = innerWidth; c.height = innerHeight; }
      function seed() {
        stars = [];
        var n = Math.min(160, Math.floor(innerWidth * innerHeight / 9000));
        for (var i = 0; i < n; i++) {
          stars.push({
            x: Math.random() * c.width,
            y: Math.random() * c.height,
            z: Math.random() * 0.8 + 0.2,
          });
        }
      }
      function tick() {
        ctx.clearRect(0, 0, c.width, c.height);
        for (var i = 0; i < stars.length; i++) {
          var s = stars[i];
          s.x -= s.z * 0.45;
          if (s.x < 0) { s.x = c.width; s.y = Math.random() * c.height; }
          ctx.globalAlpha = s.z;
          ctx.fillStyle = s.z > 0.75 ? '#7df9ff' : '#cfeee9';
          ctx.fillRect(s.x, s.y, s.z * 2, s.z * 2);
        }
        requestAnimationFrame(tick);
      }
      size(); seed(); tick();
      addEventListener('resize', function () { size(); seed(); });
    })();

    // Reveal sections on scroll
    (function () {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('in'); });
      }, { threshold: 0.15 });
      document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
    })();

    // Featured reels: autoplay muted only while in view (saves bandwidth/CPU),
    // and a per-clip sound toggle. Unmuting one clip mutes all the others.
    (function () {
      var reels = [].slice.call(document.querySelectorAll('.reel'));
      if (!reels.length) return;

      function setButton(b, on) {
        if (on) {
          b.textContent = 'Sound on';
          b.classList.add('on');
          b.setAttribute('aria-label', 'Turn sound off');
        } else {
          b.textContent = 'Sound off';
          b.classList.remove('on');
          b.setAttribute('aria-label', 'Turn sound on');
        }
      }

      reels.forEach(function (v) {
        var b = v.parentNode.querySelector('.sound-toggle');
        if (!b) return;
        b.addEventListener('click', function () {
          var enabling = v.muted;
          if (enabling) {
            // Mute every other reel and reset its button.
            reels.forEach(function (other) {
              if (other === v) return;
              other.muted = true;
              var ob = other.parentNode.querySelector('.sound-toggle');
              if (ob) setButton(ob, false);
            });
            v.muted = false;
            v.volume = 0.8;
            v.play();
          } else {
            v.muted = true;
          }
          setButton(b, enabling);
        });
      });

      // Play a clip only while it is on screen; pause it when it scrolls away.
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var v = e.target;
          if (e.isIntersecting) {
            if (v.preload === 'none') v.preload = 'metadata';
            v.play().catch(function () {});
          } else {
            v.pause();
          }
        });
      }, { threshold: 0.4 });
      reels.forEach(function (v) { vio.observe(v); });
    })();
