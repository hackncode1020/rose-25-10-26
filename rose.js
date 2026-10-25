/* A Rose That Blooms For You — made by @hack.n.code
   A 3D rose built from a parametric surface (no models, no images).
   Tap the bud → petals unfold one by one, golden sparkles rise, petals drift down,
   and a handwritten message types itself. ?name=DHRUVI  ?msg=Your%20text  */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const Q = new URLSearchParams(location.search);
const CAP = Q.has('capture');
let seed = 2510;
const rand = CAP ? () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; } : Math.random;
const $ = id => document.getElementById(id);
const mobile = !CAP && (matchMedia('(pointer:coarse)').matches || innerWidth < 700);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const x = clamp((v - a) / (b - a)); return x * x * (3 - 2 * x); };
const lerp = (a, b, k) => a + (b - a) * k;

/* ---------- renderer / scene ---------- */
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: CAP, powerPreference: 'high-performance' });
renderer.setPixelRatio(CAP ? 2 : Math.min(devicePixelRatio, mobile ? 1.75 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(4, 4, { samples: 4, type: THREE.HalfFloatType }));
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.55, 0.6, 0.72);
composer.addPass(bloomPass); composer.addPass(new OutputPass());

scene.add(new THREE.AmbientLight(0xff9db0, 0.18));
const key = new THREE.DirectionalLight(0xfff0e6, 3.0); key.position.set(1.4, 3.6, 2.2); scene.add(key);
const rim = new THREE.DirectionalLight(0xff3d6e, 2.2); rim.position.set(-2.4, 1.2, -2.2); scene.add(rim);
const fill = new THREE.PointLight(0xff6a8a, 1.2, 8); fill.position.set(0, 0.4, 1.8); scene.add(fill);
const hemi = new THREE.HemisphereLight(0xffd6e0, 0x200008, 0.3); scene.add(hemi);

function gradTex(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  const r = g.createRadialGradient(w / 2, h * 0.36, 0, w / 2, h * 0.36, Math.max(w, h) * 0.75);
  r.addColorStop(0, '#4a0a1c'); r.addColorStop(0.35, '#22040d'); r.addColorStop(1, '#050103');
  g.fillStyle = r; g.fillRect(0, 0, w, h); const t = new THREE.CanvasTexture(g.canvas); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function glowTex(inner = 'rgba(255,90,130,1)', mid = 'rgba(255,40,90,0.35)') {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, inner); r.addColorStop(0.35, mid); r.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* ---------- the rose: a parametric surface ---------- */
// x ∈ [0,1] runs from the base of a petal to its edge; t winds around the spiral of petals.
const NX = mobile ? 20 : 26, T0 = 4 * Math.PI, T1 = 24 * Math.PI, NT = mobile ? 760 : 1150;
const NV = (NX + 1) * (NT + 1);
const pos = new Float32Array(NV * 3), col = new Float32Array(NV * 3);
const vx = new Float32Array(NV), vt = new Float32Array(NV), vp = new Float32Array(NV), vu = new Float32Array(NV), vn = new Float32Array(NV);
const deep = new THREE.Color(0x2a0006), red = new THREE.Color(0xb00a26), edge = new THREE.Color(0xff3a55), tmp = new THREE.Color();
for (let j = 0, k = 0; j <= NT; j++) {
  const t = T0 + (T1 - T0) * j / NT;
  const p = Math.PI / 2 * Math.exp(-t / (8 * Math.PI));                       // how far each petal leans out
  const u = 1 - Math.pow(1 - ((3.6 * t) % (2 * Math.PI)) / Math.PI, 4) / 2 + Math.sin(15 * t) / 150; // petal shape + ruffle
  const n = (t - T0) / (T1 - T0);                                              // 0 = outer petals, 1 = heart of the rose
  for (let i = 0; i <= NX; i++, k++) {
    const x = i / NX; vx[k] = x; vt[k] = t; vp[k] = p; vu[k] = u; vn[k] = n;
    const a = Math.pow(x, 0.9);
    tmp.copy(deep).lerp(red, smooth(0, 0.6, a)).lerp(edge, smooth(0.6, 1, a) * 0.85);
    tmp.multiplyScalar(lerp(1.0, 0.55, Math.pow(n, 1.4)));
    col[k * 3] = tmp.r; col[k * 3 + 1] = tmp.g; col[k * 3 + 2] = tmp.b;
  }
}
const idx = [];
for (let j = 0; j < NT; j++) for (let i = 0; i < NX; i++) {
  const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; idx.push(a, c, b, b, c, d);
}
const roseGeo = new THREE.BufferGeometry();
roseGeo.setIndex(idx);
roseGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
roseGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
const roseMat = new THREE.MeshPhysicalMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.5, metalness: 0.0,
  sheen: 0.8, sheenRoughness: 0.35, sheenColor: new THREE.Color(0xff6f8c),
  emissive: new THREE.Color(0x30000c), emissiveIntensity: 0.35 });
const rose = new THREE.Mesh(roseGeo, roseMat);
const head = new THREE.Group(); head.add(rose); scene.add(head);

function shapeRose(B, time) {
  // B: bloom 0 (closed bud) → 1 (full rose). Outer petals open first, one after another.
  const breathe = 1 + Math.sin(time * 1.6) * 0.012;
  for (let k = 0; k < NV; k++) {
    const x = vx[k], t = vt[k], p = vp[k], u = vu[k], n = vn[k];
    const pb = p * 0.24 + 0.02;                                                // bud: every petal wrapped upright
    const o = smooth(n * 0.78, n * 0.78 + 0.32, B * 1.12);                       // petal-by-petal unfolding
    const pe = lerp(pb, p, o) * breathe;
    const y = 2 * Math.pow(x * x - x, 2) * Math.sin(pe);
    const ue = u * lerp(0.86, 1, o);
    const r = ue * (x * Math.sin(pe) + y * Math.cos(pe));
    const h = ue * (x * Math.cos(pe) - y * Math.sin(pe));
    pos[k * 3] = r * Math.cos(t); pos[k * 3 + 1] = h; pos[k * 3 + 2] = r * Math.sin(t);
  }
  roseGeo.attributes.position.needsUpdate = true; roseGeo.computeVertexNormals();
}

/* stem, sepals and leaves */
const green = new THREE.MeshStandardMaterial({ color: 0x1f6b2a, roughness: 0.6, emissive: 0x06200a, emissiveIntensity: 0.4, side: THREE.DoubleSide });
const stemCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.05, 0), new THREE.Vector3(0.02, -0.6, 0.02),
  new THREE.Vector3(-0.06, -1.4, 0.05), new THREE.Vector3(0.04, -2.4, 0)]);
const stem = new THREE.Mesh(new THREE.TubeGeometry(stemCurve, 48, 0.034, 10, false), green); scene.add(stem);
const receptacle = new THREE.Mesh(new THREE.SphereGeometry(0.08, 20, 14), green); receptacle.scale.set(1, 0.8, 1); receptacle.position.y = 0.02; head.add(receptacle);
function leafGeo(len, wid, curl) {
  const s = new THREE.Shape(); s.moveTo(0, 0);
  s.bezierCurveTo(wid, len * 0.25, wid * 0.9, len * 0.7, 0, len); s.bezierCurveTo(-wid * 0.9, len * 0.7, -wid, len * 0.25, 0, 0);
  const g = new THREE.ShapeGeometry(s, 16); const P = g.attributes.position;
  for (let i = 0; i < P.count; i++) { const X = P.getX(i), Y = P.getY(i); P.setZ(i, curl * (Y / len) ** 2 + Math.abs(X) * 0.5 * curl); }
  g.computeVertexNormals(); return g;
}
const sepals = [];
for (let i = 0; i < 5; i++) {
  const m = new THREE.Mesh(leafGeo(0.34, 0.07, 0.12), green); const piv = new THREE.Group();
  piv.rotation.y = i / 5 * Math.PI * 2 + 0.3; piv.position.y = 0.03; piv.add(m); head.add(piv); sepals.push(m);
}
for (const [y, side, rz] of [[-0.9, 1, -0.9], [-1.5, -1, 0.95]]) {
  const m = new THREE.Mesh(leafGeo(0.55, 0.2, 0.18), green); m.position.set(0.0, y, 0.03);
  m.rotation.set(0.3, side > 0 ? 0.4 : -0.5, rz); scene.add(m);
}

/* glow halo */
const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5 }));
halo.position.set(0, 0.35, -0.6); halo.scale.set(3.6, 3.6, 1); scene.add(halo);

/* sparkles + bokeh: one shader, soft round glows */
const sparkMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { uScale: { value: 300 } },
  vertexShader: `attribute float aSize; attribute float aAlpha; attribute vec3 aColor; varying float vA; varying vec3 vC;
    uniform float uScale; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uScale / -mv.z; vA = aAlpha; vC = aColor; }`,
  fragmentShader: `varying float vA; varying vec3 vC; void main(){ vec2 d = gl_PointCoord - .5; float r = length(d);
    float a = smoothstep(.5, 0., r); a = a*a; float core = smoothstep(.16, 0., r);
    float star = max(0., 1. - abs(d.x)*14.) * smoothstep(.5,.0,abs(d.y)) + max(0., 1. - abs(d.y)*14.) * smoothstep(.5,.0,abs(d.x));
    gl_FragColor = vec4(vC * (a + core*1.6 + star*.6), vA * clamp(a + core + star*.5, 0., 1.)); }`
});
const NS = mobile ? 170 : 260;
const sp = { x: new Float32Array(NS), y: new Float32Array(NS), z: new Float32Array(NS), vx: new Float32Array(NS), vy: new Float32Array(NS), vz: new Float32Array(NS),
  life: new Float32Array(NS), max: new Float32Array(NS), size: new Float32Array(NS), tw: new Float32Array(NS), on: new Uint8Array(NS) };
const sGeo = new THREE.BufferGeometry();
const sPos = new Float32Array(NS * 3), sSize = new Float32Array(NS), sAlpha = new Float32Array(NS), sCol = new Float32Array(NS * 3);
sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3)); sGeo.setAttribute('aSize', new THREE.BufferAttribute(sSize, 1));
sGeo.setAttribute('aAlpha', new THREE.BufferAttribute(sAlpha, 1)); sGeo.setAttribute('aColor', new THREE.BufferAttribute(sCol, 3));
const sparks = new THREE.Points(sGeo, sparkMat); sparks.frustumCulled = false; scene.add(sparks);
function spawnSpark(burst) {
  for (let i = 0; i < NS; i++) if (!sp.on[i]) {
    sp.on[i] = 1; sp.life[i] = 0; sp.tw[i] = rand() * 6.28;
    if (burst) { const a = rand() * 6.283, e = rand() * 0.9 + 0.2, v = 0.6 + rand() * 1.4;
      sp.x[i] = Math.cos(a) * 0.15; sp.y[i] = 0.45; sp.z[i] = Math.sin(a) * 0.15;
      sp.vx[i] = Math.cos(a) * v * Math.cos(e); sp.vy[i] = Math.sin(e) * v * 0.9 + 0.3; sp.vz[i] = Math.sin(a) * v * Math.cos(e);
      sp.max[i] = 1.6 + rand() * 1.6; sp.size[i] = 0.05 + rand() * 0.07;
    } else { sp.x[i] = (rand() - 0.5) * 3.2; sp.y[i] = -1.6 + rand() * 1.4; sp.z[i] = (rand() - 0.5) * 1.6;
      sp.vx[i] = (rand() - 0.5) * 0.05; sp.vy[i] = 0.18 + rand() * 0.32; sp.vz[i] = 0; sp.max[i] = 4 + rand() * 4; sp.size[i] = 0.025 + rand() * 0.05; }
    const g = rand(); sCol[i * 3] = 1.0; sCol[i * 3 + 1] = lerp(0.62, 0.85, g); sCol[i * 3 + 2] = lerp(0.25, 0.55, g * g);
    return; }
}
// faint pink bokeh far behind
const NB = mobile ? 40 : 70, bGeo = new THREE.BufferGeometry(), bPos = new Float32Array(NB * 3), bSize = new Float32Array(NB), bAlpha = new Float32Array(NB), bCol = new Float32Array(NB * 3);
for (let i = 0; i < NB; i++) { bPos[i * 3] = (rand() - 0.5) * 9; bPos[i * 3 + 1] = (rand() - 0.5) * 12; bPos[i * 3 + 2] = -3 - rand() * 4;
  bSize[i] = 0.08 + rand() * 0.25; bAlpha[i] = 0.08 + rand() * 0.18; bCol[i * 3] = 1; bCol[i * 3 + 1] = 0.3 + rand() * 0.2; bCol[i * 3 + 2] = 0.45; }
bGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3)); bGeo.setAttribute('aSize', new THREE.BufferAttribute(bSize, 1));
bGeo.setAttribute('aAlpha', new THREE.BufferAttribute(bAlpha, 1)); bGeo.setAttribute('aColor', new THREE.BufferAttribute(bCol, 3));
const bokeh = new THREE.Points(bGeo, sparkMat); bokeh.frustumCulled = false; scene.add(bokeh);

/* falling petals */
const petalGeo = (() => { const g = leafGeo(0.2, 0.11, 0.06); g.translate(0, -0.1, 0); return g; })();
const petalMat = new THREE.MeshStandardMaterial({ color: 0xd0122f, roughness: 0.5, side: THREE.DoubleSide, emissive: 0x400010, emissiveIntensity: 0.5 });
const NP = mobile ? 10 : 14, petals = [];
for (let i = 0; i < NP; i++) { const m = new THREE.Mesh(petalGeo, petalMat); m.visible = false; scene.add(m);
  petals.push({ m, on: false, t: 0, vy: 0, sx: 0, ph: 0, spin: new THREE.Vector3() }); }
function dropPetal(delay) {
  const P = petals.find(p => !p.on); if (!P) return;
  const a = rand() * 6.283, r = 0.35 + rand() * 0.45;
  P.on = true; P.t = -delay; P.m.position.set(Math.cos(a) * r, 0.45 + rand() * 0.2, Math.sin(a) * r * 0.6 + 0.2);
  P.vy = 0.28 + rand() * 0.22; P.sx = (rand() - 0.5) * 0.5; P.ph = rand() * 6.28;
  P.spin.set(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1); P.m.rotation.set(rand() * 6, rand() * 6, rand() * 6); P.m.visible = false;
}

/* ---------- message ---------- */
const NAME = (Q.get('name') || '').trim().slice(0, 14).toUpperCase();
const MSG = (Q.get('msg') || '').trim().slice(0, 60);
let line1 = '', line2 = '';
function setLines(name) {
  const nice = name ? (/^(YOUR|MY)( |$)/.test(name) ? name.toLowerCase() : name.charAt(0) + name.slice(1).toLowerCase()) : '';
  line1 = name ? `For ${nice} 🌹` : '';
  line2 = MSG || (name ? 'You are my favourite person ❤️' : 'You are my favourite person 🌹');
  $('m2').style.fontSize = name ? '' : 'clamp(34px,10vw,60px)';
}
setLines(NAME); if (NAME) $('name').value = NAME;
const chars = s => Array.from(s);
let typeT = -1;                                                               // seconds since typing began
function renderType() {
  if (typeT < 0) { $('m1').textContent = ''; $('m2').textContent = ''; return; }
  const cps = 13, a = chars(line1), b = chars(line2);
  const n = Math.floor(typeT * cps), n1 = Math.min(a.length, n), n2 = clamp(n - a.length - (a.length ? 4 : 0), 0, b.length);
  $('m1').textContent = a.slice(0, n1).join(''); $('m2').textContent = b.slice(0, n2).join('');
  const done = n2 >= b.length; $('m1').classList.toggle('caret', n1 < a.length);
  $('m2').classList.toggle('caret', n1 >= a.length && !done && Math.floor(typeT * 2) % 2 === 0 || (n1 >= a.length && !done));
}

/* ---------- sound (off by default) ---------- */
let AC = null, soundOn = false, master;
function note(f, t0, dur, vol, type = 'sine') {
  const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.05);
}
const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];
let padTimer = 0, padStep = 0;
function musicTick(dt) {
  if (!soundOn || !AC) return; padTimer -= dt; if (padTimer > 0) return; padTimer = 0.62;
  const chords = [[261.63, 329.63, 392], [220, 261.63, 329.63], [174.61, 220, 261.63], [196, 246.94, 293.66]];
  const c = chords[Math.floor(padStep / 4) % 4], t = AC.currentTime;
  if (padStep % 4 === 0) c.forEach(f => note(f / 2, t, 2.6, 0.035, 'triangle'));
  note(c[padStep % 3] * 2, t, 1.2, 0.05); padStep++;
}
function chime() { if (!soundOn || !AC) return; const t = AC.currentTime; SCALE.forEach((f, i) => note(f, t + i * 0.09, 1.6, 0.06)); }
$('snd').addEventListener('click', e => { e.stopPropagation();
  if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = 0.9; master.connect(AC.destination); }
  soundOn = !soundOn; $('snd').textContent = soundOn ? '🔊' : '🔇'; if (soundOn) AC.resume(); });

/* ---------- state ---------- */
let state = 'bud', bloomT = 0, time = 0, B = 0, sparkAcc = 0, petalAcc = 0, burstLeft = 0;
const BLOOM_DUR = 3.4;
function tap() {
  if (state === 'bud') { state = 'blooming'; bloomT = 0; burstLeft = 90; $('hint').style.opacity = 0; chime(); }
  else if (state === 'open') { burstLeft = 70; for (let i = 0; i < 5; i++) dropPetal(i * 0.15); chime(); }
}
canvas.addEventListener('pointerdown', e => { if (e.isPrimary !== false) tap(); });

$('name').addEventListener('input', () => { const v = $('name').value.trim().toUpperCase().slice(0, 14); setLines(v); if (typeT > 0) typeT = 99; renderType(); });
['pointerdown', 'click'].forEach(ev => $('bar').addEventListener(ev, e => e.stopPropagation()));
$('share').addEventListener('click', async () => {
  const u = new URL(location.href.split('?')[0]); const v = $('name').value.trim(); if (v) u.searchParams.set('name', v.toUpperCase()); if (MSG) u.searchParams.set('msg', MSG);
  const data = { title: 'A rose for you 🌹', text: v ? `A rose that blooms for you, ${v.toUpperCase()} 🌹 (tap the bud)` : 'Tap the bud 🌹', url: u.toString() };
  if (navigator.share && mobile) { try { await navigator.share(data); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
  try { await navigator.clipboard.writeText(u.toString()); toast('Link copied 💌 send it to them'); }
  catch (_) { prompt('Copy this link and send it 🌹', u.toString()); }
});
let toastT; function toast(m) { const t = $('toast'); t.textContent = m; t.style.opacity = 1; clearTimeout(toastT); toastT = setTimeout(() => t.style.opacity = 0, 1800); }

/* ---------- layout ---------- */
let aspect = 1;
function resize() {
  const w = innerWidth, h = innerHeight; aspect = w / h;
  renderer.setSize(w, h, false); composer.setSize(w, h);
  bloomPass.resolution.set(w / 2, h / 2);
  camera.aspect = aspect;
  // keep the open rose (≈2.1 units wide) inside the frame on tall phones and wide screens alike
  const halfV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const dist = Math.max(aspect > 1 ? 5.2 : 6.6, 1.06 / (halfV * Math.min(aspect, 1.2)));
  camera.userData.dist = dist; camera.updateProjectionMatrix();
  scene.background = gradTex(Math.round(256 * Math.min(aspect, 2)), 256);
  sparkMat.uniforms.uScale.value = h * renderer.getPixelRatio() * 0.9;
}
addEventListener('resize', resize);

/* ---------- step ---------- */
function step(dt) {
  time += dt;
  if (state === 'blooming') { bloomT += dt; if (bloomT >= BLOOM_DUR) { state = 'open'; for (let i = 0; i < 4; i++) dropPetal(i * 0.6); } }
  const target = state === 'bud' ? 0 : clamp(bloomT / BLOOM_DUR);
  B = state === 'open' ? 1 : (1 - Math.pow(1 - target, 2.2)) * 0.15 + smooth(0, 1, target) * 0.85;
  shapeRose(B, time);
  if (state !== 'bud' && bloomT > BLOOM_DUR * 0.62 && typeT < 0) typeT = 0;
  if (typeT >= 0) typeT += dt; renderType();

  // head: gentle sway, turning slowly; tilted toward the viewer so the spiral shows
  const d = camera.userData.dist || 5;
  head.rotation.y = time * 0.18 + 0.4; head.rotation.x = lerp(0.14, 0.78, B); head.rotation.z = Math.sin(time * 0.7) * 0.03;
  const s = lerp(0.82, 1.0, B) * (state === 'bud' ? 1 + Math.sin(time * 3.2) * 0.012 : 1); head.scale.setScalar(s);
  head.position.y = 0.0;
  sepals.forEach((m, i) => { m.rotation.x = lerp(-0.25, -1.15, B) + Math.sin(i * 1.7) * 0.06; m.position.y = 0; });
  const camY = lerp(0.9, 1.5, B);
  camera.position.set(Math.sin(time * 0.2) * 0.12 * d / 5, camY + 0.0, d - B * 0.35);
  camera.lookAt(0, aspect < 0.8 ? -0.42 : -0.15, 0);
  halo.material.opacity = 0.3 + 0.22 * B + (state === 'bud' ? Math.sin(time * 3.2) * 0.08 : 0);
  halo.scale.setScalar(lerp(2.2, 3.8, B));
  bloomPass.strength = lerp(0.45, 0.7, B);

  // sparkles
  sparkAcc += dt * (state === 'bud' ? 10 : 22); while (sparkAcc > 1) { sparkAcc--; spawnSpark(false); }
  if (state === 'blooming' && bloomT > 0.6 && burstLeft > 0) { const n = Math.min(burstLeft, Math.ceil(dt * 120)); for (let i = 0; i < n; i++) spawnSpark(true); burstLeft -= n; }
  if (state === 'open' && burstLeft > 0) { const n = Math.min(burstLeft, Math.ceil(dt * 200)); for (let i = 0; i < n; i++) spawnSpark(true); burstLeft -= n; }
  for (let i = 0; i < NS; i++) {
    if (!sp.on[i]) { sAlpha[i] = 0; sSize[i] = 0; continue; }
    sp.life[i] += dt; if (sp.life[i] > sp.max[i]) { sp.on[i] = 0; sAlpha[i] = 0; continue; }
    sp.vx[i] *= 1 - dt * 0.9; sp.vz[i] *= 1 - dt * 0.9; sp.vy[i] = lerp(sp.vy[i], 0.25, dt * 0.8);
    sp.x[i] += (sp.vx[i] + Math.sin(time * 1.3 + sp.tw[i]) * 0.04) * dt; sp.y[i] += sp.vy[i] * dt; sp.z[i] += sp.vz[i] * dt;
    sPos[i * 3] = sp.x[i]; sPos[i * 3 + 1] = sp.y[i]; sPos[i * 3 + 2] = sp.z[i];
    const lf = sp.life[i] / sp.max[i], tw = 0.65 + 0.35 * Math.sin(time * 9 + sp.tw[i] * 3);
    sAlpha[i] = smooth(0, 0.08, lf) * (1 - smooth(0.6, 1, lf)) * tw; sSize[i] = sp.size[i] * (0.8 + 0.4 * tw);
  }
  sGeo.attributes.position.needsUpdate = true; sGeo.attributes.aSize.needsUpdate = true; sGeo.attributes.aAlpha.needsUpdate = true; sGeo.attributes.aColor.needsUpdate = true;
  for (let i = 0; i < NB; i++) { bPos[i * 3 + 1] += dt * 0.05; if (bPos[i * 3 + 1] > 6) bPos[i * 3 + 1] = -6; }
  bGeo.attributes.position.needsUpdate = true;

  // petals drift down, fluttering
  if (state === 'open') { petalAcc += dt; if (petalAcc > 1.1) { petalAcc = 0; dropPetal(0); } }
  for (const P of petals) { if (!P.on) continue; P.t += dt; if (P.t < 0) continue; P.m.visible = true;
    const m = P.m; m.position.y -= P.vy * dt * smooth(0, 0.8, P.t); m.position.x += (P.sx + Math.sin(P.t * 2.2 + P.ph) * 0.35) * dt;
    m.position.z += Math.cos(P.t * 1.7 + P.ph) * 0.1 * dt;
    m.rotation.x += P.spin.x * dt * 1.4; m.rotation.y += P.spin.y * dt; m.rotation.z += P.spin.z * dt * 0.8;
    if (m.position.y < -3.2) { P.on = false; m.visible = false; } }
}
function draw() { composer.render(); }

/* ---------- start ---------- */
resize(); shapeRose(0, 0);
const ready = (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => document.fonts.load('40px "Great Vibes"')).catch(() => {});
ready.then(() => {
  if (CAP) {
    window.__step = (dt, n = 1) => { for (let i = 0; i < n; i++) step(dt); draw(); };
    window.__tap = tap; window.__state = () => state; window.__B = () => B;
    window.__setName = v => { setLines(v); }; window.__toast = toast; window.__adv = dt => step(dt); window.__typeAll = () => { typeT = 99; renderType(); };
    window.__open = () => { state = 'open'; bloomT = BLOOM_DUR; $('hint').style.opacity = 0; };
    window.__ready = true; return;
  }
  let last = performance.now();
  const loop = now => { const dt = Math.min(0.05, (now - last) / 1000); last = now; step(dt); musicTick(dt); draw(); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  if (Q.has('auto')) setTimeout(tap, 900);
});
