/* ==========================================================================
   MCU TRACKER · THREE.JS STARFIELD 3D
   - Replaces the 2D canvas galaxy with a full 3D starfield
   - Mouse parallax, scroll warp, twinkle shaders, hero stars
   ========================================================================== */

import * as THREE from './three.module.js';

// ============================================================
// STARFIELD 3D
// ============================================================
class StarfieldScene {
  constructor() {
    this.canvas = document.getElementById('galaxyCanvas');
    if (!this.canvas) return;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    this.camera.position.z = 200;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0);

    // Star layers
    this.layerNear = this.createStarLayer(1800, 80, 140, 1.4);   // big stars close
    this.layerMid  = this.createStarLayer(2200, 160, 260, 0.9);  // mid
    this.layerFar  = this.createStarLayer(3500, 280, 420, 0.5);  // far small stars

    this.scene.add(this.layerNear.group);
    this.scene.add(this.layerMid.group);
    this.scene.add(this.layerFar.group);

    // Big hero stars (occasional bright ones)
    this.heroStars = this.createHeroStars(40);
    this.scene.add(this.heroStars.group);

    // Mouse parallax
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetX = 0;
    this.targetY = 0;
    window.addEventListener('mousemove', (e) => {
      this.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      this.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // Scroll warp
    this.scrollVel = 0;
    this.scrollAccum = 0;
    let lastScroll = window.scrollY;
    window.addEventListener('scroll', () => {
      const cur = window.scrollY;
      this.scrollVel = Math.abs(cur - lastScroll) * 0.02;
      lastScroll = cur;
    }, { passive: true });

    window.addEventListener('resize', () => this.onResize());
    this.onResize();
    this.animate();
  }

  createStarLayer(count, minR, maxR, baseSize) {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phase = new Float32Array(count); // twinkle phase

    // Palette matching MCU theme
    const palette = [
      new THREE.Color(0xffffff),   // white
      new THREE.Color(0xbfdbfe),   // cool white
      new THREE.Color(0xfde68a),   // warm gold
      new THREE.Color(0xfbbf24),   // iron gold
      new THREE.Color(0xa5b4fc),   // soft purple
      new THREE.Color(0x00d2ff),   // tesseract cyan
      new THREE.Color(0xff9500),   // strange orange
    ];

    for (let i = 0; i < count; i++) {
      const r = minR + Math.random() * (maxR - minR);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3]     = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      sizes[i] = baseSize + Math.random() * baseSize * 0.8;
      phase[i] = Math.random() * Math.PI * 2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: this.renderer.getPixelRatio() },
      },
      vertexShader: `
        attribute float aSize;
        attribute float aPhase;
        uniform float uTime;
        uniform float uPixelRatio;
        varying vec3 vColor;
        varying float vTwinkle;
        void main() {
          vColor = color;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          float twinkle = 0.7 + 0.3 * sin(uTime * 1.5 + aPhase);
          vTwinkle = twinkle;
          gl_PointSize = aSize * uPixelRatio * twinkle * (300.0 / -mv.z);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vTwinkle;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          if (d > 0.5) discard;
          float alpha = (1.0 - smoothstep(0.0, 0.5, d)) * vTwinkle;
          // soft glow center
          float core = exp(-d * 8.0);
          vec3 col = vColor + core * 0.3;
          gl_FragColor = vec4(col, alpha);
        }
      `,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const group = new THREE.Points(geo, mat);
    return { group, mat, baseRotSpeed: Math.random() * 0.0005 + 0.0001 };
  }

  createHeroStars(count) {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const r = 100 + Math.random() * 200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // warm gold or cool blue
      if (Math.random() > 0.5) {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.85; colors[i * 3 + 2] = 0.4;
      } else {
        colors[i * 3] = 0.6; colors[i * 3 + 1] = 0.8; colors[i * 3 + 2] = 1.0;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 3,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: this.createGlowTexture(),
    });

    const group = new THREE.Points(geo, mat);
    return { group, mat };
  }

  createGlowTexture() {
    const size = 64;
    const cvs = document.createElement('canvas');
    cvs.width = size;
    cvs.height = size;
    const ctx = cvs.getContext('2d');
    const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.3, 'rgba(255,255,255,0.5)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(cvs);
    tex.needsUpdate = true;
    return tex;
  }

  animate = () => {
    requestAnimationFrame(this.animate);
    const t = performance.now() * 0.001;

    // smooth mouse parallax
    this.mouseX += (this.targetX - this.mouseX) * 0.04;
    this.mouseY += (this.targetY - this.mouseY) * 0.04;

    // Layer rotations (different speeds = parallax depth)
    this.layerNear.group.rotation.x = this.mouseY * 0.06 + t * 0.02;
    this.layerNear.group.rotation.y = this.mouseX * 0.06 + t * 0.03;
    this.layerMid.group.rotation.x = this.mouseY * 0.10 + t * 0.012;
    this.layerMid.group.rotation.y = this.mouseX * 0.10 + t * 0.018;
    this.layerFar.group.rotation.x = this.mouseY * 0.14 + t * 0.006;
    this.layerFar.group.rotation.y = this.mouseX * 0.14 + t * 0.009;

    this.heroStars.group.rotation.y = t * 0.04;

    // Update shader uniforms
    [this.layerNear, this.layerMid, this.layerFar].forEach(layer => {
      layer.mat.uniforms.uTime.value = t;
    });

    // scroll warp — compress Z near camera on fast scroll
    this.scrollVel *= 0.92;
    this.scrollAccum += (this.scrollVel - this.scrollAccum) * 0.1;
    if (this.scrollAccum > 0.01) {
      const warpZ = Math.min(this.scrollAccum * 60, 80);
      this.camera.position.z = 200 - warpZ;
      // Slight FOV punch for warp feel
      this.camera.fov = 70 + warpZ * 0.05;
      this.camera.updateProjectionMatrix();
    } else if (this.camera.position.z !== 200) {
      this.camera.position.z += (200 - this.camera.position.z) * 0.05;
      this.camera.fov += (70 - this.camera.fov) * 0.05;
      this.camera.updateProjectionMatrix();
    }

    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}


// ============================================================
// 2. TESSERACT HUD — Three.js enhancement layer
//    Renders behind the CSS cube with orbital particles,
//    energy beams, 3D rings, and progress reactivity.
// ============================================================
class TesseractHUD {
  constructor() {
    this.container = document.querySelector('.tesseract-hud');
    if (!this.container) return;

    // Size to fill the HUD area
    const size = 180;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    this.camera.position.set(0, 0, 4.5);

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(size, size);
    this.renderer.setClearColor(0x000000, 0);

    // Style the canvas to sit behind the CSS cube.
    // Anchor to .progress-wrapper (holds the cube + % text) so the rings center
    // on the cube — not on .tesseract-hud, which is taller due to the ticker below.
    const cvs = this.renderer.domElement;
    cvs.style.position = 'absolute';
    cvs.style.top = '50%';
    cvs.style.left = '50%';
    cvs.style.transform = 'translate(-50%, -50%)';
    cvs.style.zIndex = '0';
    cvs.style.pointerEvents = 'none';
    const anchor = this.container.querySelector('.progress-wrapper') || this.container;
    anchor.style.position = 'relative';
    anchor.insertBefore(cvs, anchor.firstChild);

    this.progress = 0; // 0–1
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.buildScene();

    this.clock = new THREE.Clock();

    // Watch the progress percentage for changes
    this.observeProgress();

    this.animate();
  }

  buildScene() {
    // --- ORBITAL PARTICLES (3 rings at different tilts) ---
    this.orbitals = [];
    const orbitConfigs = [
      { count: 60, radius: 1.6, tiltX: 0, tiltZ: 0, color: 0x00d2ff, speed: 0.2 },
      { count: 45, radius: 1.9, tiltX: Math.PI / 3, tiltZ: Math.PI / 6, color: 0xfbbf24, speed: -0.15 },
      { count: 35, radius: 1.4, tiltX: -Math.PI / 4, tiltZ: Math.PI / 3, color: 0xa78bfa, speed: 0.25 },
    ];

    orbitConfigs.forEach(cfg => {
      const orbital = this.createOrbitalRing(cfg);
      this.orbitals.push(orbital);
      this.group.add(orbital.points);
    });

    // --- ENERGY BEAMS (lines radiating from center) ---
    this.beams = [];
    const beamCount = 8;
    for (let i = 0; i < beamCount; i++) {
      const angle = (i / beamCount) * Math.PI * 2;
      const phi = Math.PI / 2 + (Math.random() - 0.5) * 0.8;

      const dir = new THREE.Vector3(
        Math.sin(phi) * Math.cos(angle),
        Math.sin(phi) * Math.sin(angle),
        Math.cos(phi)
      );

      const points = [
        new THREE.Vector3(0, 0, 0),
        dir.clone().multiplyScalar(1.8),
      ];

      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: 0x00d2ff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const line = new THREE.Line(geo, mat);
      line.userData = { phase: Math.random() * Math.PI * 2, dir };
      this.beams.push(line);
      this.group.add(line);
    }

    // --- GLOWING CORE (icosahedron at center) ---
    const coreGeo = new THREE.IcosahedronGeometry(0.18, 2);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x00d2ff,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.core3d = new THREE.Mesh(coreGeo, coreMat);
    this.group.add(this.core3d);

    // Outer glow halo
    const haloGeo = new THREE.IcosahedronGeometry(0.35, 2);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x00d2ff,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.halo = new THREE.Mesh(haloGeo, haloMat);
    this.group.add(this.halo);

    // --- SPARK PARTICLES (random energy sparks around) ---
    this.sparks = this.createSparks(120);
    this.group.add(this.sparks);

    // --- INFINITY STONES (5 gems orbiting the tesseract) ---
    this.infinityStones = this.createInfinityStones();
    this.infinityStones.forEach(stone => {
      this.group.add(stone.group);
      this.group.add(stone.trail);   // comet trail in absolute orbit coords
    });
  }

  createOrbitalRing({ count, radius, tiltX, tiltZ, color, speed }) {
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = radius + (Math.random() - 0.5) * 0.15;
      positions[i * 3]     = Math.cos(angle) * r;
      positions[i * 3 + 1] = Math.sin(angle) * r;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
      phases[i] = angle;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(color) },
        uIntensity: { value: 0.4 },
      },
      vertexShader: `
        attribute float aPhase;
        uniform float uTime;
        uniform float uIntensity;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          float angle = aPhase + uTime;
          float r = length(position.xy);
          p.x = cos(angle) * r;
          p.y = sin(angle) * r;
          vAlpha = (0.3 + 0.7 * sin(uTime * 2.0 + aPhase * 3.0)) * uIntensity;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = (1.5 + uIntensity * 2.5);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          if (d > 0.5) discard;
          float a = (1.0 - smoothstep(0.0, 0.5, d)) * vAlpha;
          gl_FragColor = vec4(uColor, a);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geo, mat);
    points.rotation.x = tiltX;
    points.rotation.z = tiltZ;

    return { points, mat, speed, tiltX, tiltZ };
  }

  createSparks(count) {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const lifetimes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      this.resetSpark(positions, velocities, lifetimes, i);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.03,
      color: 0x00d2ff,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const pts = new THREE.Points(geo, mat);
    pts.userData = { velocities, lifetimes, count };
    return pts;
  }

  resetSpark(positions, velocities, lifetimes, i) {
    // Start near center
    positions[i * 3]     = (Math.random() - 0.5) * 0.3;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.3;

    // Random outward velocity
    const speed = 0.01 + Math.random() * 0.02;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    velocities[i * 3]     = Math.sin(phi) * Math.cos(theta) * speed;
    velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
    velocities[i * 3 + 2] = Math.cos(phi) * speed;

    lifetimes[i] = 0.5 + Math.random() * 1.0;
  }

  // --- INFINITY STONES ---
  // 5 gems orbiting the tesseract: Soul, Reality, Power, Time, Mind
  // (Space Stone = the tesseract itself)
  createInfinityStones() {
    const stoneConfigs = [
      { name: 'Soul',    color: 0xff9500, orbitRadius: 1.75, orbitSpeed: 0.18,  tiltX: 0.3,  tiltZ: 0,     phase: 0 },
      { name: 'Reality', color: 0xe62429, orbitRadius: 1.55, orbitSpeed: -0.14, tiltX: -0.5, tiltZ: 0.4,   phase: Math.PI * 0.4 },
      { name: 'Power',   color: 0x7b2fff, orbitRadius: 1.9,  orbitSpeed: 0.12,  tiltX: 0.8,  tiltZ: -0.3,  phase: Math.PI * 0.8 },
      { name: 'Time',    color: 0x00ff73, orbitRadius: 1.65, orbitSpeed: -0.16, tiltX: -0.2, tiltZ: 0.7,   phase: Math.PI * 1.2 },
      { name: 'Mind',    color: 0xf0c040, orbitRadius: 1.45, orbitSpeed: 0.2,   tiltX: 0.6,  tiltZ: -0.5,  phase: Math.PI * 1.6 },
    ];

    return stoneConfigs.map(cfg => {
      const stoneGroup = new THREE.Group();

      // Gem body — octahedron (diamond/gem shape)
      const gemGeo = new THREE.OctahedronGeometry(0.09, 0);
      const gemMat = new THREE.MeshBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: 0.9,
      });
      const gem = new THREE.Mesh(gemGeo, gemMat);
      stoneGroup.add(gem);

      // Inner glow (slightly larger, additive)
      const glowGeo = new THREE.OctahedronGeometry(0.14, 1);
      const glowMat = new THREE.MeshBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      stoneGroup.add(glow);

      // Outer halo (soft sphere glow)
      const haloGeo = new THREE.SphereGeometry(0.22, 8, 8);
      const haloMat = new THREE.MeshBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      stoneGroup.add(halo);

      // Comet-style trail behind the stone (added to the main group, not the
      // moving stoneGroup, so the absolute orbit positions render correctly).
      // Per-vertex color fades head→tail; additive blending makes black invisible.
      const trailCount = 32;
      const trailPositions = new Float32Array(trailCount * 3);
      const trailColors = new Float32Array(trailCount * 3);
      const trailGeo = new THREE.BufferGeometry();
      trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
      trailGeo.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));
      const trailMat = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const trail = new THREE.Points(trailGeo, trailMat);

      return {
        group: stoneGroup,
        gem,
        glow,
        halo,
        haloMat,
        trail,
        trailCount,
        trailPositions,
        trailColors,
        trailColor: new THREE.Color(cfg.color),
        ...cfg,
      };
    });
  }

  observeProgress() {
    const percentEl = document.getElementById('progressPercent');
    if (!percentEl) return;

    // Read initial value
    this.progress = Math.min(1, (parseInt(percentEl.textContent) || 0) / 100);

    // Watch for changes
    const observer = new MutationObserver(() => {
      this.progress = Math.min(1, (parseInt(percentEl.textContent) || 0) / 100);
    });
    observer.observe(percentEl, { childList: true, characterData: true, subtree: true });
  }

  animate = () => {
    requestAnimationFrame(this.animate);
    const t = this.clock.getElapsedTime();
    const p = this.progress;

    // Intensity scales with progress
    const intensity = 0.2 + p * 0.8;

    // --- ORBITAL PARTICLES (slowed down) ---
    this.orbitals.forEach(orb => {
      orb.mat.uniforms.uTime.value = t * orb.speed;
      orb.mat.uniforms.uIntensity.value = intensity;
    });

    // --- ENERGY BEAMS: appear gradually, pulse (slower) ---
    this.beams.forEach((beam, i) => {
      const beamProgress = Math.max(0, (p - 0.15) / 0.85);
      const pulse = 0.3 + 0.7 * Math.abs(Math.sin(t * 1.2 + beam.userData.phase));
      beam.material.opacity = beamProgress * pulse * 0.35;

      const len = 0.5 + beamProgress * 1.3;
      const posArr = beam.geometry.attributes.position.array;
      const d = beam.userData.dir;
      posArr[3] = d.x * len;
      posArr[4] = d.y * len;
      posArr[5] = d.z * len;
      beam.geometry.attributes.position.needsUpdate = true;
    });

    // --- CORE: gentle pulse, scale with progress ---
    const corePulse = 1 + Math.sin(t * 1.8) * 0.15 * intensity;
    this.core3d.scale.setScalar(corePulse * (0.6 + p * 0.6));
    this.core3d.material.opacity = 0.15 + p * 0.5;
    this.core3d.rotation.x = t * 0.5;
    this.core3d.rotation.y = t * 0.35;

    // Halo breathes gently
    const haloPulse = 1 + Math.sin(t * 0.8) * 0.2;
    this.halo.scale.setScalar(haloPulse * (0.8 + p * 0.5));
    this.halo.material.opacity = 0.05 + p * 0.15;
    this.halo.rotation.y = -t * 0.12;

    // --- INFINITY STONES: orbit around tesseract ---
    this.infinityStones.forEach(stone => {
      const angle = stone.phase + t * stone.orbitSpeed;
      const r = stone.orbitRadius;

      // Orbital position with tilt
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r * Math.cos(stone.tiltX);
      const z = Math.sin(angle) * r * Math.sin(stone.tiltX) + Math.cos(angle) * Math.sin(stone.tiltZ) * 0.3;

      stone.group.position.set(x, y, z);

      // Gem self-rotation (gentle tumble)
      stone.gem.rotation.x = t * 0.6 + stone.phase;
      stone.gem.rotation.y = t * 0.4;

      // Glow pulse
      const glowPulse = 0.2 + 0.15 * Math.sin(t * 1.5 + stone.phase * 2);
      stone.glow.material.opacity = glowPulse;
      stone.glow.rotation.x = -t * 0.3;
      stone.glow.rotation.z = t * 0.2;

      // Halo breathe
      const haloPulse = 1 + Math.sin(t * 1.2 + stone.phase) * 0.25;
      stone.halo.scale.setScalar(haloPulse);
      stone.haloMat.opacity = 0.08 + 0.06 * Math.sin(t * 1.2 + stone.phase);

      // Comet trail — analytic points trailing the gem along its own orbit
      // (evenly spaced behind the current angle; fades head→tail).
      const N = stone.trailCount;
      const c = stone.trailColor;
      const pos = stone.trailPositions;
      const col = stone.trailColors;
      const trailBright = 0.5 + p * 0.5; // visible even at 0%, brighter with progress
      const dA = 0.018 * Math.sign(stone.orbitSpeed || 1); // spacing, trailing behind motion

      for (let k = 0; k < N; k++) {
        const a = angle - k * dA;
        pos[k * 3]     = Math.cos(a) * r;
        pos[k * 3 + 1] = Math.sin(a) * r * Math.cos(stone.tiltX);
        pos[k * 3 + 2] = Math.sin(a) * r * Math.sin(stone.tiltX) + Math.cos(a) * Math.sin(stone.tiltZ) * 0.3;
        const b = Math.pow(1 - k / (N - 1), 0.7) * trailBright; // head bright → tail faint
        col[k * 3]     = c.r * b;
        col[k * 3 + 1] = c.g * b;
        col[k * 3 + 2] = c.b * b;
      }
      stone.trail.geometry.attributes.position.needsUpdate = true;
      stone.trail.geometry.attributes.color.needsUpdate = true;
    });

    // --- SPARKS: animate outward from center ---
    const { velocities, lifetimes, count } = this.sparks.userData;
    const posArr = this.sparks.geometry.attributes.position.array;
    const dt = 0.016;

    for (let i = 0; i < count; i++) {
      lifetimes[i] -= dt;

      if (lifetimes[i] <= 0) {
        if (Math.random() < (0.1 + p * 0.9)) {
          this.resetSpark(posArr, velocities, lifetimes, i);
        }
        continue;
      }

      posArr[i * 3]     += velocities[i * 3] * intensity;
      posArr[i * 3 + 1] += velocities[i * 3 + 1] * intensity;
      posArr[i * 3 + 2] += velocities[i * 3 + 2] * intensity;
    }
    this.sparks.geometry.attributes.position.needsUpdate = true;
    this.sparks.material.opacity = 0.2 + p * 0.6;

    // Very gentle overall group rotation
    this.group.rotation.y = t * 0.08;
    this.group.rotation.x = Math.sin(t * 0.15) * 0.06;

    this.renderer.render(this.scene, this.camera);
  }
}


// ============================================================
// 3. TVA TIMELINE HUD — Three.js enhancement layer
//    Renders behind the countdown banner.
// ============================================================
class TVATimelineScene {
  constructor() {
    this.container = document.getElementById('countdownCanvasContainer');
    if (!this.container) return;

    this.scene = new THREE.Scene();
    
    // Orthographic camera for a flat 2D-ish look overlay
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera = new THREE.OrthographicCamera(w / -2, w / 2, h / 2, h / -2, 1, 100);
    this.camera.position.z = 10;

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h);
    this.renderer.setClearColor(0x000000, 0);

    this.container.appendChild(this.renderer.domElement);

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.buildLoom(w, h);

    this.clock = new THREE.Clock();
    
    window.addEventListener('resize', this.onResize);
    setTimeout(() => this.onResize(), 100);
    this.animate();
  }

  buildLoom(w, h) {
    // Clear any previous loom so this can be re-run on resize (the banner grows
    // from its "CARGANDO..." size to the mounted timer size).
    if (this.threads) {
      this.threads.forEach(t => { this.group.remove(t); t.geometry.dispose(); t.material.dispose(); });
    }
    if (this.particles) {
      this.group.remove(this.particles);
      this.particles.geometry.dispose();
      this.particles.material.dispose();
    }
    this.builtH = h;

    this.threads = [];
    const threadCount = 15;
    const length = w * 1.5;

    // Palette: Sacred Timeline gold & slight blue variants
    const colors = [0xffd700, 0xffeb3b, 0xffc107, 0x81d4fa];

    for (let i = 0; i < threadCount; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      // Create a sine wave curve
      const points = [];
      const segments = 50;
      
      const amplitude = (Math.random() * h * 0.4) + 5;
      const frequency = (Math.random() * 0.005) + 0.002;
      const phase = Math.random() * Math.PI * 2;
      const yOffset = (Math.random() - 0.5) * (h * 0.2);

      for (let j = 0; j <= segments; j++) {
        const x = (j / segments) * length - (length / 2);
        points.push(new THREE.Vector3(x, 0, 0)); // y is animated
      }

      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: (Math.random() * 0.4) + 0.1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const line = new THREE.Line(geo, mat);
      line.userData = {
        amplitude, frequency, phase, yOffset, 
        speed: (Math.random() * 2) + 0.5,
        originalPoints: points.map(p => p.x)
      };

      this.threads.push(line);
      this.group.add(line);
    }
    
    // Add some glowing "nexus event" particles
    const particleCount = 40;
    const partGeo = new THREE.BufferGeometry();
    const partPos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      partPos[i * 3]     = (Math.random() - 0.5) * w;
      partPos[i * 3 + 1] = (Math.random() - 0.5) * h * 0.5;
      partPos[i * 3 + 2] = 0;
    }
    partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
    
    const partMat = new THREE.PointsMaterial({
      size: 3,
      color: 0xffd700,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    this.particles = new THREE.Points(partGeo, partMat);
    this.particles.userData = { width: w, speeds: Array.from({length: particleCount}, () => (Math.random() * 30) + 10) };
    this.group.add(this.particles);
  }

  onResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;

    this.renderer.setSize(w, h);
    this.camera.left = w / -2;
    this.camera.right = w / 2;
    this.camera.top = h / 2;
    this.camera.bottom = h / -2;
    this.camera.updateProjectionMatrix();

    // Rebuild the loom when the banner height changes noticeably so the
    // threads/particles fill the actual area instead of a stale size.
    if (Math.abs(h - (this.builtH || 0)) > 4) {
      this.buildLoom(w, h);
    }
  };

  animate = () => {
    requestAnimationFrame(this.animate);
    const t = this.clock.getElapsedTime();

    // Animate threads (sine waves flowing)
    this.threads.forEach(thread => {
      const { amplitude, frequency, phase, yOffset, speed, originalPoints } = thread.userData;
      const positions = thread.geometry.attributes.position.array;
      
      for (let i = 0; i < originalPoints.length; i++) {
        const x = originalPoints[i];
        // Wave travels to the right
        const y = Math.sin((x * frequency) - (t * speed) + phase) * amplitude + yOffset;
        positions[i * 3 + 1] = y;
      }
      thread.geometry.attributes.position.needsUpdate = true;
    });

    // Animate particles (flow right)
    const pPos = this.particles.geometry.attributes.position.array;
    const speeds = this.particles.userData.speeds;
    const w = this.particles.userData.width;
    
    for (let i = 0; i < speeds.length; i++) {
      pPos[i * 3] += speeds[i] * 0.016; // rough dt
      if (pPos[i * 3] > w / 2) {
        pPos[i * 3] = -w / 2;
        pPos[i * 3 + 1] = (Math.random() - 0.5) * this.container.clientHeight * 0.5;
      }
    }
    this.particles.geometry.attributes.position.needsUpdate = true;

    this.renderer.render(this.scene, this.camera);
  };
}


// ============================================================
// BOOT
// ============================================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new StarfieldScene();
    new TesseractHUD();
    new TVATimelineScene();
  });
} else {
  new StarfieldScene();
  new TesseractHUD();
  new TVATimelineScene();
}
