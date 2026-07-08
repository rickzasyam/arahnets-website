/* ============================================================
   ARAHNETS — motion & data layer
   ============================================================ */
(() => {
  "use strict";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- loader ---------- */
  const loader = $("#loader");
  const boot = () => {
    document.body.classList.add("loaded");
    loader.classList.add("done");
  };
  if (reduced) boot();
  else window.addEventListener("load", () => setTimeout(boot, 650), { once: true });
  setTimeout(boot, 2600); // safety net if load event stalls

  /* ---------- nav + progress ---------- */
  const nav = $("#nav");
  const bar = $("#progressBar");
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("scrolled", y > 40);
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    railUpdate();
  };
  addEventListener("scroll", onScroll, { passive: true });

  /* ---------- reveal ---------- */
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }
  }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
  $$("[data-reveal]").forEach((el) => io.observe(el));

  /* ---------- counters ---------- */
  const fmt = (v, el) => {
    const dec = +el.dataset.decimals || 0;
    let out = v.toFixed(dec);
    if (el.dataset.format === "comma") out = (+out).toLocaleString(window.__i18nLocale || "id-ID");
    return out;
  };
  const cio = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      cio.unobserve(e.target);
      const el = e.target, target = parseFloat(el.dataset.count);
      if (reduced) { el.textContent = fmt(target, el); continue; }
      const t0 = performance.now(), dur = 1700;
      const tick = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 4);
        el.textContent = fmt(target * ease, el);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, { threshold: 0.6 });
  $$(".count").forEach((el) => cio.observe(el));

  /* ---------- live transaction feeds ---------- */
  const SCHEMES = ["QRIS", "VISA", "MASTER", "DEBIT", "JCB", "AMEX"];
  const rand = (a, b) => Math.floor(a + Math.random() * (b - a));
  const clock = () => {
    const d = new Date();
    return [d.getHours(), d.getMinutes(), d.getSeconds()]
      .map((n) => String(n).padStart(2, "0")).join(":");
  };
  const idr = () => "Rp " + (rand(15, 9800) * 1000).toLocaleString("id-ID");

  const pushRow = (list, max, build) => {
    const li = build();
    list.prepend(li);
    while (list.children.length > max) list.lastChild.remove();
  };

  const feed = $("#feed");
  const heroRow = () => {
    const li = document.createElement("li");
    li.className = "ok";
    li.innerHTML =
      `<span class="t">${clock().slice(3)}</span>` +
      `<span class="m">${SCHEMES[rand(0, SCHEMES.length)]}</span>` +
      `<span class="a">${idr()}</span>`;
    return li;
  };
  const uiRows = $("#uiRows");
  const uiRow = () => {
    const li = document.createElement("li");
    li.innerHTML =
      `<span class="t">${clock()}</span>` +
      `<span>TID-${rand(10000, 99999)} · ${SCHEMES[rand(0, SCHEMES.length)]}</span>` +
      `<span>${idr()}</span>` +
      `<span class="st">00·APPROVED</span>`;
    return li;
  };

  for (let i = 0; i < 5; i++) pushRow(feed, 5, heroRow);
  for (let i = 0; i < 4; i++) pushRow(uiRows, 4, uiRow);
  if (!reduced) {
    const loop = (fn, min, max) => {
      const next = () => { fn(); setTimeout(next, rand(min, max)); };
      setTimeout(next, rand(min, max));
    };
    loop(() => pushRow(feed, 5, heroRow), 1400, 3200);
    loop(() => pushRow(uiRows, 4, uiRow), 1800, 3600);
  }

  /* ---------- hero parallax ---------- */
  const visual = $("#heroVisual");
  if (visual && !reduced && matchMedia("(pointer:fine)").matches) {
    const cards = $$("[data-p]", visual);
    let raf = 0, mx = 0, my = 0;
    visual.closest(".hero").addEventListener("pointermove", (e) => {
      mx = (e.clientX / innerWidth - 0.5);
      my = (e.clientY / innerHeight - 0.5);
      if (!raf) raf = requestAnimationFrame(() => {
        raf = 0;
        for (const c of cards) {
          const d = +c.dataset.p;
          c.style.translate = `${(-mx * d).toFixed(1)}px ${(-my * d).toFixed(1)}px`;
        }
      });
    });
  }

  /* ---------- process rail fill ---------- */
  const steps = $("#steps"), railFill = $("#railFill");
  function railUpdate() {
    if (!steps || !railFill) return;
    const r = steps.getBoundingClientRect();
    const start = innerHeight * 0.75;
    const p = Math.min(Math.max((start - r.top) / (r.height * 0.95), 0), 1);
    railFill.style.height = (p * 100).toFixed(2) + "%";
  }

  /* ---------- software feature sync ---------- */
  const featureItems = $$("#swFeatures li");
  if (featureItems.length) {
    const fio = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const idx = e.target.dataset.feature;
        featureItems.forEach((li) => li.classList.toggle("active", li.dataset.f === idx));
      }
    }, { threshold: 0.55 });
    $$(".sw-card").forEach((c) => fio.observe(c));
  }

  /* ---------- constellation ---------- */
  const canvas = $("#net");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    const RED = "#C8102E";
    const SECTORS = ["PERBANKAN", "RITEL", "F&B", "BBM & ENERGI", "LOGISTIK", "PERHOTELAN", "KESEHATAN", "PEMERINTAHAN"];
    let W = 0, H = 0, dpr = 1, nodes = [], pulses = [], running = false, t = 0;

    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    };

    const build = () => {
      const cx = W / 2, cy = H / 2;
      const rx = Math.min(W * 0.38, 460), ry = H * 0.36;
      nodes = SECTORS.map((label, i) => {
        const a = (i / SECTORS.length) * Math.PI * 2 - Math.PI / 2;
        return {
          label,
          bx: cx + Math.cos(a) * rx,
          by: cy + Math.sin(a) * ry,
          ph: Math.random() * Math.PI * 2,
          sp: 0.4 + Math.random() * 0.5,
          x: 0, y: 0,
        };
      });
      pulses = [];
    };

    const spawnPulse = () => {
      if (pulses.length > 5) return;
      pulses.push({ n: rand(0, nodes.length), p: 0, dir: Math.random() > 0.35 ? 1 : -1, v: 0.006 + Math.random() * 0.008 });
    };

    const draw = () => {
      t += 0.016;
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;

      for (const n of nodes) {
        n.x = n.bx + Math.sin(t * n.sp + n.ph) * 9;
        n.y = n.by + Math.cos(t * n.sp * 0.8 + n.ph) * 7;
      }

      // edges: hub -> node
      ctx.lineWidth = 1;
      for (const n of nodes) {
        ctx.strokeStyle = "rgba(17,17,17,.10)";
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(n.x, n.y); ctx.stroke();
      }
      // ring edges
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i], b = nodes[(i + 1) % nodes.length];
        ctx.strokeStyle = "rgba(17,17,17,.06)";
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }

      // pulses along hub edges
      for (let i = pulses.length - 1; i >= 0; i--) {
        const pl = pulses[i], n = nodes[pl.n];
        pl.p += pl.v;
        if (pl.p >= 1) { pulses.splice(i, 1); continue; }
        const q = pl.dir === 1 ? pl.p : 1 - pl.p;
        const x = cx + (n.x - cx) * q, y = cy + (n.y - cy) * q;
        ctx.fillStyle = RED;
        ctx.beginPath(); ctx.arc(x, y, 2.4, 0, Math.PI * 2); ctx.fill();
      }

      // sector nodes + labels
      ctx.font = "500 10px 'Plus Jakarta Sans', sans-serif";
      for (const n of nodes) {
        ctx.fillStyle = "rgba(17,17,17,.85)";
        ctx.beginPath(); ctx.arc(n.x, n.y, 3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "rgba(17,17,17,.18)";
        ctx.beginPath(); ctx.arc(n.x, n.y, 8 + Math.sin(t * 1.4 + n.ph) * 1.5, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = "rgba(17,17,17,.55)";
        const above = n.by < cy;
        ctx.textAlign = "center";
        ctx.fillText(n.label, n.x, above ? n.y - 18 : n.y + 27);
      }

      // hub
      const hubR = 5 + Math.sin(t * 2) * 0.8;
      ctx.fillStyle = RED;
      ctx.beginPath(); ctx.arc(cx, cy, hubR, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(200,16,46,.38)";
      ctx.beginPath(); ctx.arc(cx, cy, 16 + Math.sin(t * 2) * 2, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = "rgba(200,16,46,.14)";
      ctx.beginPath(); ctx.arc(cx, cy, 30 + Math.sin(t * 1.3) * 3, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "#111111";
      ctx.font = "600 11px 'Plus Jakarta Sans', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("ARAHNETS", cx, cy + 52);

      if (Math.random() < 0.05) spawnPulse();
      if (running && !reduced) requestAnimationFrame(draw);
    };

    size();
    addEventListener("resize", () => { size(); if (!running || reduced) draw(); });

    const nio = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting && !running) {
          running = true;
          if (reduced) { draw(); } else requestAnimationFrame(draw);
        } else if (!e.isIntersecting) {
          running = false;
        }
      }
    }, { threshold: 0.05 });
    nio.observe(canvas);

    // relabel sectors when the language changes
    document.addEventListener("i18n:applied", (e) => {
      const d = (e.detail && e.detail.dict) || {};
      for (let i = 0; i < SECTORS.length; i++) {
        const v = d["net.s" + (i + 1)];
        if (v) SECTORS[i] = v;
      }
      build();
      if (!running || reduced) draw();
    });
  }

  /* ---------- client logo marquee ---------- */
  const logoTrack = $("#logoTrack");
  if (logoTrack) {
    const belt = logoTrack.parentElement;
    const baseSet = $(".logo-set", logoTrack);
    const LOGO_SRC = "assets/client-logo/";
    const SPEED = 40; // px per second — constant regardless of logo count
    let marquee = null;

    const esc = (s) => String(s).replace(/[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

    // rebuild the set from the generated manifest (falls back to hardcoded items)
    const populate = (logos) => {
      baseSet.innerHTML = logos.map((l) =>
        `<li><img src="${LOGO_SRC}${esc(l.file)}" alt="${esc(l.alt || "")}" loading="lazy"></li>`
      ).join("");
    };

    const buildMarquee = () => {
      if (marquee) { marquee.kill(); marquee = null; }
      $$(".logo-set", logoTrack).slice(1).forEach((s) => s.remove());
      gsap.set(logoTrack, { x: 0 });
      const setW = baseSet.offsetWidth;
      if (!setW) return;
      // clone the set until the belt stays covered at every scroll offset
      const copies = Math.ceil(belt.clientWidth / setW) + 1;
      for (let i = 0; i < copies; i++) {
        const clone = baseSet.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        logoTrack.appendChild(clone);
      }
      // translating by exactly one set width makes the repeat-snap invisible
      marquee = gsap.to(logoTrack, {
        x: -setW,
        duration: setW / SPEED,
        ease: "none",
        repeat: -1,
      });
    };

    const animate = () => {
      // reduced motion or no GSAP → CSS shows a static, centered row
      if (!window.gsap || reduced) return;
      buildMarquee();

      let rt;
      addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(buildMarquee, 200); });

      // glide to a stop on hover, resume on leave
      belt.addEventListener("mouseenter", () => marquee && gsap.to(marquee, { timeScale: 0, duration: .5 }));
      belt.addEventListener("mouseleave", () => marquee && gsap.to(marquee, { timeScale: 1, duration: .5 }));

      // don't spend frames offscreen
      const mio = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (!marquee) continue;
          e.isIntersecting ? marquee.play() : marquee.pause();
        }
      }, { threshold: 0 });
      mio.observe(belt);
    };

    const measureThenAnimate = () =>
      Promise.all($$("img", baseSet).map((im) => im.decode().catch(() => {}))).then(animate);

    // logos.json is the source of truth; the markup carries a no-JS fallback
    fetch(LOGO_SRC + "logos.json", { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((logos) => { if (Array.isArray(logos) && logos.length) populate(logos); })
      .catch(() => {})
      .finally(measureThenAnimate);
  }

  onScroll();
})();
