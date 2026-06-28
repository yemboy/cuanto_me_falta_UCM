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
// BOOT
// ============================================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new StarfieldScene());
} else {
  new StarfieldScene();
}
