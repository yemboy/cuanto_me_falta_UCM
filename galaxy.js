// Animated Galaxy Background — Canvas-based star field
(function() {
  const canvas = document.getElementById('galaxyCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Star colors matching the MCU theme palettes
  const STAR_COLORS = [
    { r: 255, g: 255, b: 255 },   // white
    { r: 200, g: 220, b: 255 },   // cool white
    { r: 0,   g: 210, b: 255 },   // cyan tesseract
    { r: 255, g: 149, b: 0   },   // strange orange
    { r: 140, g: 100, b: 255 },   // venom purple
    { r: 230, g: 36,  b: 41  },   // iron red
    { r: 240, g: 192, b: 64  },   // iron gold
  ];

  // Color weights — most stars are white/cool, few are colored
  const COLOR_WEIGHTS = [35, 25, 10, 8, 8, 7, 7];

  function pickColor() {
    const total = COLOR_WEIGHTS.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < COLOR_WEIGHTS.length; i++) {
      r -= COLOR_WEIGHTS[i];
      if (r <= 0) return STAR_COLORS[i];
    }
    return STAR_COLORS[0];
  }

  // Shooting star pool
  const shootingStars = [];
  const MAX_SHOOTING = 2;

  function spawnShootingStar() {
    if (shootingStars.length >= MAX_SHOOTING) return;
    shootingStars.push({
      x: Math.random() * canvas.width * 0.8,
      y: Math.random() * canvas.height * 0.4,
      len: 60 + Math.random() * 80,
      speed: 8 + Math.random() * 6,
      angle: Math.PI / 6 + Math.random() * 0.3,
      life: 1,
      decay: 0.015 + Math.random() * 0.01,
      color: Math.random() < 0.5
        ? STAR_COLORS[2]  // cyan
        : STAR_COLORS[0], // white
    });
  }

  // Nebula clouds (soft, slow-drifting blobs)
  const nebulae = [];
  const NUM_NEBULAE = 5;

  function initNebulae() {
    const colors = [
      { r: 120, g: 0,   b: 255, a: 0.03 },  // venom purple
      { r: 0,   g: 100, b: 255, a: 0.025 },  // blue
      { r: 255, g: 100, b: 0,   a: 0.015 },  // strange orange
      { r: 230, g: 36,  b: 41,  a: 0.012 },  // iron red
      { r: 0,   g: 180, b: 255, a: 0.02 },   // tesseract cyan
    ];
    for (let i = 0; i < NUM_NEBULAE; i++) {
      const c = colors[i % colors.length];
      nebulae.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: 150 + Math.random() * 250,
        color: c,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.1,
        pulseSpeed: 0.003 + Math.random() * 0.005,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
  }

  // Star field
  let stars = [];
  const NUM_STARS = 300;

  function initStars() {
    stars = [];
    for (let i = 0; i < NUM_STARS; i++) {
      const color = pickColor();
      // depth: 0 = far (small, slow), 1 = close (big, fast)
      const depth = Math.random();
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        depth: depth,
        size: 0.3 + depth * 1.8,
        color: color,
        baseAlpha: 0.3 + depth * 0.7,
        twinkleSpeed: 0.5 + Math.random() * 2,
        twinklePhase: Math.random() * Math.PI * 2,
        // Slow drift — deeper stars move slower (parallax)
        vx: (0.02 + depth * 0.08) * (Math.random() < 0.5 ? 1 : -1),
        vy: 0.01 + depth * 0.04,
      });
    }
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = document.documentElement.scrollHeight;
    if (stars.length === 0) {
      initStars();
      initNebulae();
    }
  }

  // Throttled resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 200);
  });

  // Re-size canvas when content changes height
  const heightObserver = new ResizeObserver(() => {
    const newH = document.documentElement.scrollHeight;
    if (Math.abs(canvas.height - newH) > 50) {
      canvas.height = newH;
    }
  });
  heightObserver.observe(document.body);

  let time = 0;

  function draw() {
    time += 0.016; // ~60fps
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw nebulae
    for (const n of nebulae) {
      n.x += n.vx;
      n.y += n.vy;

      // Wrap around
      if (n.x < -n.radius) n.x = canvas.width + n.radius;
      if (n.x > canvas.width + n.radius) n.x = -n.radius;
      if (n.y < -n.radius) n.y = canvas.height + n.radius;
      if (n.y > canvas.height + n.radius) n.y = -n.radius;

      const pulse = 1 + 0.2 * Math.sin(time * n.pulseSpeed * 60 + n.pulsePhase);
      const r = n.radius * pulse;
      const alpha = n.color.a * (0.8 + 0.2 * Math.sin(time * n.pulseSpeed * 30));

      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r);
      grad.addColorStop(0, `rgba(${n.color.r}, ${n.color.g}, ${n.color.b}, ${alpha})`);
      grad.addColorStop(0.5, `rgba(${n.color.r}, ${n.color.g}, ${n.color.b}, ${alpha * 0.4})`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(n.x - r, n.y - r, r * 2, r * 2);
    }

    // Draw stars
    for (const s of stars) {
      // Move
      s.x += s.vx;
      s.y += s.vy;

      // Wrap around screen
      if (s.x < -2) s.x = canvas.width + 2;
      if (s.x > canvas.width + 2) s.x = -2;
      if (s.y < -2) s.y = canvas.height + 2;
      if (s.y > canvas.height + 2) s.y = -2;

      // Twinkle
      const twinkle = 0.5 + 0.5 * Math.sin(time * s.twinkleSpeed + s.twinklePhase);
      const alpha = s.baseAlpha * (0.4 + 0.6 * twinkle);

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${s.color.r}, ${s.color.g}, ${s.color.b}, ${alpha})`;
      ctx.fill();

      // Glow for brighter/closer stars
      if (s.depth > 0.6 && twinkle > 0.7) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.color.r}, ${s.color.g}, ${s.color.b}, ${alpha * 0.15})`;
        ctx.fill();
      }
    }

    // Draw shooting stars
    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const ss = shootingStars[i];
      ss.x += Math.cos(ss.angle) * ss.speed;
      ss.y += Math.sin(ss.angle) * ss.speed;
      ss.life -= ss.decay;

      if (ss.life <= 0) {
        shootingStars.splice(i, 1);
        continue;
      }

      const tailX = ss.x - Math.cos(ss.angle) * ss.len * ss.life;
      const tailY = ss.y - Math.sin(ss.angle) * ss.len * ss.life;

      const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.7, `rgba(${ss.color.r}, ${ss.color.g}, ${ss.color.b}, ${ss.life * 0.4})`);
      grad.addColorStop(1, `rgba(${ss.color.r}, ${ss.color.g}, ${ss.color.b}, ${ss.life * 0.9})`);

      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(ss.x, ss.y);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Head glow
      ctx.beginPath();
      ctx.arc(ss.x, ss.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${ss.color.r}, ${ss.color.g}, ${ss.color.b}, ${ss.life})`;
      ctx.fill();
    }

    // Randomly spawn shooting stars
    if (Math.random() < 0.003) {
      spawnShootingStar();
    }

    requestAnimationFrame(draw);
  }

  resize();
  draw();
})();
