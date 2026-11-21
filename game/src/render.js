// render.js — draws one scene onto a canvas.
//
// drawScene(ctx, scene, variant) renders the shared object list; when variant
// is true the scene's differences are applied first (colour overrides, moves,
// resizes, flips of angle, removals), which is what makes the right-hand
// panel a near-twin of the left instead of an identical copy.

import { STAGE_W, STAGE_H } from './scenes.js';

const MUTATION_PROPS = ['color', 'stripe', 'awning', 'window', 'scarf', 'sail', 'lid'];

export function effectiveObjects(scene, variant) {
  const mutations = new Map();
  if (variant) for (const d of scene.differences) mutations.set(d.objectId, d.mutation);
  const out = [];
  for (const obj of scene.objects) {
    const m = mutations.get(obj.id);
    if (!m) { out.push(obj); continue; }
    if (m.remove) continue;
    const copy = { ...obj };
    for (const key of MUTATION_PROPS) if (key in m) copy[key] = m[key];
    if (m.dx) copy.x += m.dx;
    if (m.dy) copy.y += m.dy;
    if (m.scale) { copy.s = (copy.s ?? 1) * m.scale; if (copy.r) copy.r *= m.scale; }
    if (m.rotate) copy.angle = (copy.angle ?? 0) + m.rotate;
    out.push(copy);
  }
  return out;
}

export function drawScene(ctx, scene, variant) {
  drawBackground(ctx, scene);
  for (const obj of effectiveObjects(scene, variant)) drawObject(ctx, scene, obj);
}

function drawBackground(ctx, scene) {
  const sky = ctx.createLinearGradient(0, 0, 0, STAGE_H);
  sky.addColorStop(0, scene.sky[0]);
  sky.addColorStop(1, scene.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, STAGE_W, STAGE_H);
  if (scene.sea) {
    ctx.fillStyle = scene.sea;
    ctx.fillRect(0, 238, STAGE_W, 92);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      const y = 252 + i * 11, x = (i * 67) % 480;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 14, y - 4, x + 28, y);
      ctx.quadraticCurveTo(x + 42, y + 4, x + 56, y);
      ctx.stroke();
    }
    ctx.fillStyle = scene.sand;
    ctx.beginPath();
    ctx.ellipse(92, 306, 142, 50, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, 336);
    for (let x = 0; x <= STAGE_W; x += 40) ctx.quadraticCurveTo(x + 20, 328, x + 40, 336);
    ctx.lineTo(STAGE_W, STAGE_H);
    ctx.lineTo(0, STAGE_H);
    ctx.fill();
  } else if (scene.id === 'coral-reef') {
    ctx.fillStyle = 'rgba(255,255,255,0.13)';
    for (const [x0, w] of [[60, 54], [230, 76], [420, 60]]) {
      ctx.beginPath();
      ctx.moveTo(x0, 0); ctx.lineTo(x0 + w, 0);
      ctx.lineTo(x0 + w + 66, 340); ctx.lineTo(x0 + 66, 340);
      ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = scene.sand;
    ctx.beginPath();
    ctx.moveTo(0, 336);
    for (let x = 0; x <= STAGE_W; x += 40) ctx.quadraticCurveTo(x + 20, 328, x + 40, 336);
    ctx.lineTo(STAGE_W, STAGE_H);
    ctx.lineTo(0, STAGE_H);
    ctx.fill();
    ctx.fillStyle = 'rgba(120,96,40,0.35)';
    for (const [x, y, r] of [[40, 392, 7], [150, 404, 5], [330, 396, 6], [480, 402, 5], [540, 388, 4]]) {
      ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
    }
  } else {
    ctx.fillStyle = scene.sand;
    ctx.fillRect(0, scene.id === 'snowy-observatory' ? 292 : 302, STAGE_W, STAGE_H);
    if (scene.id === 'snowy-observatory') {
      ctx.fillStyle = '#dcecf7';
      ctx.beginPath(); ctx.ellipse(356, 310, 185, 58, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(96, 306, 112, 32, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
}

function drawObject(ctx, scene, o) {
  const s = o.s ?? 1;
  ctx.save();
  switch (o.kind) {
    case 'sun': {
      ctx.strokeStyle = o.color; ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(o.x + Math.cos(a) * (o.r + 5), o.y + Math.sin(a) * (o.r + 5));
        ctx.lineTo(o.x + Math.cos(a) * (o.r + 14), o.y + Math.sin(a) * (o.r + 14));
        ctx.stroke();
      }
      ctx.fillStyle = o.color;
      ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'moon': {
      ctx.fillStyle = o.color;
      ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = scene.sky[0];
      ctx.beginPath(); ctx.arc(o.x + o.r * 0.45, o.y - o.r * 0.3, o.r * 0.82, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'cloud': {
      ctx.fillStyle = o.color;
      for (const [dx, dy, r] of [[-26, 4, 17], [0, -4, 23], [26, 4, 17], [0, 8, 20]]) {
        ctx.beginPath(); ctx.arc(o.x + dx * s, o.y + dy * s, r * s, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'star': {
      ctx.fillStyle = o.color;
      const r = 9 * s;
      ctx.beginPath();
      ctx.moveTo(o.x, o.y - r); ctx.quadraticCurveTo(o.x, o.y, o.x + r, o.y);
      ctx.quadraticCurveTo(o.x, o.y, o.x, o.y + r); ctx.quadraticCurveTo(o.x, o.y, o.x - r, o.y);
      ctx.quadraticCurveTo(o.x, o.y, o.x, o.y - r);
      ctx.fill();
      break;
    }
    case 'bird': {
      ctx.strokeStyle = o.color; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(o.x - 11 * s, o.y);
      ctx.quadraticCurveTo(o.x - 4 * s, o.y - 7 * s, o.x, o.y);
      ctx.quadraticCurveTo(o.x + 4 * s, o.y - 7 * s, o.x + 11 * s, o.y);
      ctx.stroke();
      break;
    }
    case 'lighthouse': {
      const h = 112 * s, w0 = 30 * s, w1 = 20 * s;
      ctx.beginPath();
      ctx.moveTo(o.x - w0 / 2, o.y); ctx.lineTo(o.x - w1 / 2, o.y - h);
      ctx.lineTo(o.x + w1 / 2, o.y - h); ctx.lineTo(o.x + w0 / 2, o.y);
      ctx.closePath();
      ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.save(); ctx.clip();
      ctx.fillStyle = o.stripe;
      for (let i = 0; i < 3; i++) ctx.fillRect(o.x - w0 / 2, o.y - h + 12 + i * 34 * s, w0, 15 * s);
      ctx.restore();
      ctx.fillStyle = '#5a6b7d';
      ctx.fillRect(o.x - 13 * s, o.y - h - 6 * s, 26 * s, 7 * s);
      ctx.fillStyle = '#ffd94d';
      ctx.fillRect(o.x - 7 * s, o.y - h - 18 * s, 14 * s, 12 * s);
      ctx.fillStyle = '#5a6b7d';
      ctx.beginPath(); ctx.moveTo(o.x - 10 * s, o.y - h - 18 * s); ctx.lineTo(o.x, o.y - h - 27 * s); ctx.lineTo(o.x + 10 * s, o.y - h - 18 * s); ctx.fill();
      ctx.fillStyle = '#9aa7ad';
      ctx.beginPath(); ctx.ellipse(o.x, o.y + 3, 34 * s, 8 * s, 0, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'house': {
      const w = 86 * s, h = 60 * s;
      ctx.fillStyle = o.wall;
      ctx.fillRect(o.x - w / 2, o.y - h / 2, w, h);
      ctx.fillStyle = o.roof;
      ctx.beginPath();
      ctx.moveTo(o.x - w / 2 - 8 * s, o.y - h / 2);
      ctx.lineTo(o.x, o.y - h / 2 - 30 * s);
      ctx.lineTo(o.x + w / 2 + 8 * s, o.y - h / 2);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#6b4423';
      ctx.fillRect(o.x - 9 * s, o.y + 2 * s, 18 * s, h / 2 - 2 * s);
      ctx.fillStyle = o.window ?? '#ffd94d';
      ctx.fillRect(o.x + 16 * s, o.y - 16 * s, 16 * s, 16 * s);
      ctx.strokeStyle = '#6b4423'; ctx.lineWidth = 2;
      ctx.strokeRect(o.x + 16 * s, o.y - 16 * s, 16 * s, 16 * s);
      break;
    }
    case 'palm': {
      ctx.strokeStyle = '#8a5a2e'; ctx.lineWidth = 7 * s; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.quadraticCurveTo(o.x + 6 * s, o.y - 48 * s, o.x + 16 * s, o.y - 88 * s); ctx.stroke();
      ctx.strokeStyle = '#2f8f4e'; ctx.lineWidth = 5 * s;
      const tx = o.x + 16 * s, ty = o.y - 88 * s;
      for (const a of [-2.8, -2.2, -1.5, -0.8, -0.2]) {
        ctx.beginPath(); ctx.moveTo(tx, ty);
        ctx.quadraticCurveTo(tx + Math.cos(a) * 26 * s, ty + Math.sin(a) * 20 * s - 6, tx + Math.cos(a) * 40 * s, ty + Math.sin(a) * 30 * s + 8);
        ctx.stroke();
      }
      ctx.fillStyle = '#6b4423';
      ctx.beginPath(); ctx.arc(tx - 4 * s, ty + 5 * s, 5 * s, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(tx + 5 * s, ty + 6 * s, 5 * s, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'pine': {
      ctx.fillStyle = '#6b4423';
      ctx.fillRect(o.x - 4 * s, o.y - 14 * s, 8 * s, 14 * s);
      ctx.fillStyle = '#1f6e43';
      for (let i = 0; i < 3; i++) {
        const w = (52 - i * 11) * s, top = o.y - (34 + i * 24) * s, base = o.y - (8 + i * 24) * s;
        ctx.beginPath(); ctx.moveTo(o.x - w / 2, base); ctx.lineTo(o.x, top); ctx.lineTo(o.x + w / 2, base); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(o.x - w / 4, top + 13 * s); ctx.lineTo(o.x, top + 3 * s); ctx.lineTo(o.x + w / 4, top + 13 * s); ctx.stroke();
      }
      break;
    }
    case 'boat': {
      ctx.fillStyle = o.hull;
      ctx.beginPath();
      ctx.moveTo(o.x - 34 * s, o.y - 4 * s); ctx.lineTo(o.x + 34 * s, o.y - 4 * s);
      ctx.lineTo(o.x + 24 * s, o.y + 13 * s); ctx.lineTo(o.x - 24 * s, o.y + 13 * s);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = 3.4;
      ctx.beginPath(); ctx.moveTo(o.x, o.y - 4 * s); ctx.lineTo(o.x, o.y - 56 * s); ctx.stroke();
      if (o.sail) {
        ctx.fillStyle = o.sail;
        ctx.beginPath();
        ctx.moveTo(o.x + 3 * s, o.y - 54 * s); ctx.lineTo(o.x + 3 * s, o.y - 8 * s); ctx.lineTo(o.x + 30 * s, o.y - 8 * s);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(o.x - 3 * s, o.y - 50 * s); ctx.lineTo(o.x - 3 * s, o.y - 8 * s); ctx.lineTo(o.x - 22 * s, o.y - 8 * s);
        ctx.closePath(); ctx.fill();
      }
      break;
    }
    case 'buoy': {
      ctx.fillStyle = o.color;
      ctx.beginPath();
      ctx.moveTo(o.x - 10 * s, o.y + 8 * s); ctx.lineTo(o.x - 6 * s, o.y - 8 * s);
      ctx.lineTo(o.x + 6 * s, o.y - 8 * s); ctx.lineTo(o.x + 10 * s, o.y + 8 * s);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(o.x - 7 * s, o.y - 2 * s, 14 * s, 4 * s);
      ctx.strokeStyle = '#5a6b7d'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(o.x, o.y - 13 * s, 4 * s, 0, Math.PI * 2); ctx.stroke();
      break;
    }
    case 'shell': {
      ctx.fillStyle = o.color;
      ctx.beginPath(); ctx.moveTo(o.x, o.y + 10 * s);
      ctx.arc(o.x, o.y + 10 * s, 15 * s, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#d77f8f'; ctx.lineWidth = 1.6;
      for (const a of [-0.6, -0.3, 0, 0.3, 0.6]) {
        ctx.beginPath(); ctx.moveTo(o.x, o.y + 10 * s);
        ctx.lineTo(o.x + Math.sin(a) * 14 * s, o.y + 10 * s - Math.cos(a) * 14 * s); ctx.stroke();
      }
      break;
    }
    case 'crab': {
      ctx.fillStyle = o.color;
      ctx.beginPath(); ctx.ellipse(o.x, o.y, 15 * s, 10 * s, 0, 0, Math.PI * 2); ctx.fill();
      for (const side of [-1, 1]) {
        ctx.beginPath(); ctx.arc(o.x + side * 20 * s, o.y - 8 * s, 6.5 * s, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = o.color; ctx.lineWidth = 2.4;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath(); ctx.moveTo(o.x + side * 12 * s, o.y + 4 * s);
          ctx.lineTo(o.x + side * (20 + i * 3) * s, o.y + (9 + i * 3) * s); ctx.stroke();
        }
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(o.x + side * 5 * s, o.y - 10 * s, 3 * s, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#22242a';
        ctx.beginPath(); ctx.arc(o.x + side * 5 * s, o.y - 10 * s, 1.5 * s, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = o.color;
      }
      break;
    }
    case 'stall': {
      ctx.fillStyle = '#5a3a1e';
      ctx.fillRect(o.x - 46 * s, o.y - 40 * s, 5 * s, 84 * s);
      ctx.fillRect(o.x + 41 * s, o.y - 40 * s, 5 * s, 84 * s);
      ctx.fillStyle = o.cloth;
      ctx.fillRect(o.x - 48 * s, o.y + 6 * s, 96 * s, 38 * s);
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(o.x - 48 * s, o.y + 6 * s, 96 * s, 6 * s);
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = ['#e2492f', '#ffd94d', '#2f8f6e', '#ff8c42'][i];
        ctx.beginPath(); ctx.arc(o.x - 30 * s + i * 20 * s, o.y - 2 * s, 6 * s, 0, Math.PI * 2); ctx.fill();
      }
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = i % 2 ? '#ffffff' : o.awning;
        const x0 = o.x - 54 * s + i * 18 * s;
        ctx.fillRect(x0, o.y - 58 * s, 18 * s, 20 * s);
        ctx.beginPath(); ctx.arc(x0 + 9 * s, o.y - 38 * s, 9 * s, 0, Math.PI); ctx.fill();
      }
      break;
    }
    case 'lantern': {
      ctx.strokeStyle = '#171226'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(o.x, o.y - 34 * s); ctx.lineTo(o.x, o.y - 13 * s); ctx.stroke();
      const glow = ctx.createRadialGradient(o.x, o.y, 2, o.x, o.y, 26 * s);
      glow.addColorStop(0, 'rgba(255,220,120,0.55)'); glow.addColorStop(1, 'rgba(255,220,120,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(o.x, o.y, 26 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = o.color;
      ctx.beginPath(); ctx.ellipse(o.x, o.y, 10 * s, 13 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8a2f1e';
      ctx.fillRect(o.x - 5 * s, o.y - 15 * s, 10 * s, 3 * s);
      ctx.fillRect(o.x - 5 * s, o.y + 12 * s, 10 * s, 3 * s);
      break;
    }
    case 'cat': {
      ctx.fillStyle = o.color;
      ctx.beginPath(); ctx.ellipse(o.x, o.y + 6 * s, 15 * s, 11 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(o.x + 10 * s, o.y - 8 * s, 8.5 * s, 0, Math.PI * 2); ctx.fill();
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(o.x + (10 + side * 7) * s, o.y - 13 * s);
        ctx.lineTo(o.x + (10 + side * 3) * s, o.y - 21 * s);
        ctx.lineTo(o.x + (10 + side * 1) * s, o.y - 12 * s);
        ctx.closePath(); ctx.fill();
      }
      ctx.strokeStyle = o.color; ctx.lineWidth = 4 * s; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(o.x - 13 * s, o.y + 12 * s);
      ctx.quadraticCurveTo(o.x - 24 * s, o.y + 10 * s, o.x - 22 * s, o.y - 2 * s); ctx.stroke();
      ctx.fillStyle = '#ffd94d';
      ctx.beginPath(); ctx.arc(o.x + 7 * s, o.y - 9 * s, 1.7 * s, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(o.x + 13 * s, o.y - 9 * s, 1.7 * s, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'crate': {
      ctx.fillStyle = o.color;
      ctx.fillRect(o.x - 15 * s, o.y - 15 * s, 30 * s, 30 * s);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2.4;
      ctx.strokeRect(o.x - 15 * s, o.y - 15 * s, 30 * s, 30 * s);
      ctx.beginPath();
      ctx.moveTo(o.x - 15 * s, o.y - 15 * s); ctx.lineTo(o.x + 15 * s, o.y + 15 * s);
      ctx.moveTo(o.x + 15 * s, o.y - 15 * s); ctx.lineTo(o.x - 15 * s, o.y + 15 * s);
      ctx.stroke();
      break;
    }
    case 'jar': {
      ctx.fillStyle = o.color;
      ctx.beginPath();
      ctx.moveTo(o.x - 6 * s, o.y - 16 * s);
      ctx.lineTo(o.x + 6 * s, o.y - 16 * s);
      ctx.quadraticCurveTo(o.x + 13 * s, o.y - 6 * s, o.x + 11 * s, o.y + 6 * s);
      ctx.quadraticCurveTo(o.x + 9 * s, o.y + 15 * s, o.x, o.y + 15 * s);
      ctx.quadraticCurveTo(o.x - 9 * s, o.y + 15 * s, o.x - 11 * s, o.y + 6 * s);
      ctx.quadraticCurveTo(o.x - 13 * s, o.y - 6 * s, o.x - 6 * s, o.y - 16 * s);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(o.x - 6 * s, o.y - 19 * s, 12 * s, 3.4 * s);
      break;
    }
    case 'sign': {
      ctx.strokeStyle = '#171226'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(o.x - 16 * s, o.y - 30 * s); ctx.lineTo(o.x - 16 * s, o.y - 12 * s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(o.x + 16 * s, o.y - 30 * s); ctx.lineTo(o.x + 16 * s, o.y - 12 * s); ctx.stroke();
      ctx.fillStyle = '#5a3a1e';
      ctx.fillRect(o.x - 30 * s, o.y - 12 * s, 60 * s, 24 * s);
      ctx.fillStyle = o.color;
      const r = 7 * s;
      ctx.beginPath();
      ctx.moveTo(o.x, o.y - r); ctx.quadraticCurveTo(o.x, o.y, o.x + r, o.y);
      ctx.quadraticCurveTo(o.x, o.y, o.x, o.y + r); ctx.quadraticCurveTo(o.x, o.y, o.x - r, o.y);
      ctx.quadraticCurveTo(o.x, o.y, o.x, o.y - r);
      ctx.fill();
      break;
    }
    case 'aurora': {
      ctx.save();
      for (const pass of [0, 1, 2]) {
        for (const [dx, h, alpha] of [[-60, 74, 0.16], [70, 96, 0.13], [170, 64, 0.1]]) {
          const grad = ctx.createLinearGradient(0, o.y - 30, 0, o.y + h);
          grad.addColorStop(0, o.color);
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.globalAlpha = alpha;
          ctx.fillStyle = grad;
          const grow = pass * 5;
          ctx.beginPath();
          ctx.moveTo(o.x + dx - (90 + grow) * s, o.y + h);
          for (let t = 0; t <= 1.001; t += 0.125) {
            const px = o.x + dx - (90 + grow) * s + t * (180 + grow * 2) * s;
            const py = o.y - 18 - grow + Math.sin(t * 5.2 + dx) * 13 - t * 10;
            ctx.lineTo(px, py);
          }
          for (let t = 1; t >= -0.001; t -= 0.125) {
            const px = o.x + dx - (90 + grow) * s + t * (180 + grow * 2) * s;
            const py = o.y + h - Math.sin(t * 4.1 + dx) * 9;
            ctx.lineTo(px, py);
          }
          ctx.closePath(); ctx.fill();
        }
      }
      ctx.restore();
      break;
    }
    case 'dome': {
      ctx.fillStyle = '#8b98a5';
      ctx.fillRect(o.x - 62 * s, o.y - 38 * s, 124 * s, 38 * s);
      ctx.fillStyle = o.color;
      ctx.beginPath(); ctx.arc(o.x, o.y - 38 * s, 56 * s, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.save();
      ctx.translate(o.x, o.y - 38 * s); ctx.rotate(-0.5);
      ctx.fillStyle = o.slit;
      ctx.fillRect(-7 * s, -62 * s, 14 * s, 34 * s);
      ctx.restore();
      ctx.fillStyle = '#5a3a1e';
      ctx.fillRect(o.x - 9 * s, o.y - 22 * s, 18 * s, 22 * s);
      break;
    }
    case 'telescope': {
      ctx.fillStyle = '#5a6b7d';
      ctx.fillRect(o.x - 10 * s, o.y + 16 * s, 20 * s, 10 * s);
      ctx.save();
      ctx.translate(o.x, o.y + 14 * s); ctx.rotate(o.angle ?? -0.6);
      ctx.fillStyle = o.color;
      ctx.strokeStyle = 'rgba(20,26,34,0.55)';
      ctx.lineWidth = 1.6;
      ctx.fillRect(-7 * s, -46 * s, 14 * s, 62 * s);
      ctx.strokeRect(-7 * s, -46 * s, 14 * s, 62 * s);
      ctx.fillStyle = '#5a6b7d';
      ctx.fillRect(-9.5 * s, -52 * s, 19 * s, 7 * s);
      ctx.fillRect(-4.5 * s, 16 * s, 9 * s, 9 * s);
      ctx.restore();
      break;
    }
    case 'snowman': {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(o.x, o.y - 18 * s, 19 * s, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(o.x, o.y - 50 * s, 12.5 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = o.scarf;
      ctx.fillRect(o.x - 11 * s, o.y - 41 * s, 22 * s, 6 * s);
      ctx.fillRect(o.x + 4 * s, o.y - 35 * s, 6 * s, 12 * s);
      ctx.fillStyle = '#22242a';
      ctx.beginPath(); ctx.arc(o.x - 4 * s, o.y - 53 * s, 1.7 * s, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(o.x + 4 * s, o.y - 53 * s, 1.7 * s, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(o.x, o.y - 22 * s, 1.8 * s, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(o.x, o.y - 14 * s, 1.8 * s, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#6b4423'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(o.x - 17 * s, o.y - 26 * s); ctx.lineTo(o.x - 30 * s, o.y - 36 * s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(o.x + 17 * s, o.y - 26 * s); ctx.lineTo(o.x + 30 * s, o.y - 38 * s); ctx.stroke();
      break;
    }
    case 'carrot': {
      ctx.fillStyle = o.color;
      ctx.beginPath();
      ctx.moveTo(o.x + 10 * s, o.y - 55 * s);
      ctx.lineTo(o.x + 10 * s, o.y - 46 * s);
      ctx.lineTo(o.x + 30 * s, o.y - 50.5 * s);
      ctx.closePath(); ctx.fill();
      break;
    }
    case 'lamp': {
      ctx.strokeStyle = '#2c3540'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x, o.y - 46 * s); ctx.stroke();
      const glow = ctx.createRadialGradient(o.x, o.y - 52 * s, 2, o.x, o.y - 52 * s, 24 * s);
      glow.addColorStop(0, 'rgba(255,217,77,0.6)'); glow.addColorStop(1, 'rgba(255,217,77,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(o.x, o.y - 52 * s, 24 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = o.color;
      ctx.beginPath(); ctx.arc(o.x, o.y - 52 * s, 7 * s, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'flag': {
      ctx.strokeStyle = '#5a6b7d'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(o.x, o.y + 16 * s); ctx.lineTo(o.x, o.y - 36 * s); ctx.stroke();
      ctx.fillStyle = o.color;
      ctx.beginPath();
      ctx.moveTo(o.x, o.y - 36 * s);
      ctx.quadraticCurveTo(o.x + 16 * s, o.y - 40 * s, o.x + 31 * s, o.y - 33 * s);
      ctx.quadraticCurveTo(o.x + 16 * s, o.y - 27 * s, o.x, o.y - 23 * s);
      ctx.closePath(); ctx.fill();
      break;
    }
    case 'sled': {
      ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(o.x - 30 * s, o.y + 12 * s); ctx.quadraticCurveTo(o.x + 28 * s, o.y + 14 * s, o.x + 34 * s, o.y + 4 * s); ctx.stroke();
      ctx.fillStyle = o.color;
      for (let i = 0; i < 3; i++) ctx.fillRect(o.x - 26 * s, o.y - 2 * s - i * 6 * s, 52 * s, 4 * s);
      ctx.strokeStyle = '#8a2f1e'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(o.x + 30 * s, o.y + 6 * s); ctx.quadraticCurveTo(o.x + 44 * s, o.y, o.x + 46 * s, o.y - 10 * s); ctx.stroke();
      break;
    }
    case 'fish': {
      ctx.fillStyle = o.color;
      ctx.beginPath();
      ctx.moveTo(o.x - 20 * s, o.y);
      ctx.lineTo(o.x - 32 * s, o.y - 10 * s);
      ctx.lineTo(o.x - 32 * s, o.y + 10 * s);
      ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.ellipse(o.x, o.y, 21 * s, 11.5 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(o.x - 2 * s, o.y - 10 * s);
      ctx.quadraticCurveTo(o.x + 4 * s, o.y - 17 * s, o.x + 10 * s, o.y - 10 * s);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(o.x + 2 * s, o.y, 8 * s, -1.1, 1.1); ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(o.x + 12 * s, o.y - 3 * s, 3.1 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#17324a';
      ctx.beginPath(); ctx.arc(o.x + 12.6 * s, o.y - 3 * s, 1.7 * s, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'turtle': {
      ctx.fillStyle = o.color;
      for (const [dx, dy, rot] of [[-16, -12, -0.6], [14, -13, 0.6], [-15, 12, 0.6], [15, 12, -0.6]]) {
        ctx.save(); ctx.translate(o.x + dx * s, o.y + dy * s); ctx.rotate(rot);
        ctx.beginPath(); ctx.ellipse(0, 0, 9 * s, 4.6 * s, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      ctx.beginPath(); ctx.arc(o.x + 27 * s, o.y - 3 * s, 7.5 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2c7a47';
      ctx.beginPath(); ctx.ellipse(o.x, o.y, 24 * s, 16 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.ellipse(o.x, o.y, 15 * s, 9.5 * s, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(o.x - 24 * s, o.y); ctx.lineTo(o.x + 24 * s, o.y); ctx.stroke();
      ctx.fillStyle = '#17324a';
      ctx.beginPath(); ctx.arc(o.x + 29.5 * s, o.y - 5 * s, 1.6 * s, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'coral': {
      ctx.strokeStyle = o.color; ctx.lineCap = 'round';
      const branches = [
        [0, 0, -4, -34, -10, -52], [0, 0, 2, -28, 10, -44], [0, 0, 0, -22, -2, -58],
        [-6, -18, -14, -30, -20, -38], [6, -24, 14, -34, 20, -40],
      ];
      for (const pass of [[7.5, 1], [4.2, 0.85]]) {
        ctx.lineWidth = pass[0] * s;
        ctx.globalAlpha = pass[1];
        for (const [x0, y0, cx, cy, x1, y1] of branches) {
          ctx.beginPath();
          ctx.moveTo(o.x + x0 * s, o.y + y0 * s);
          ctx.quadraticCurveTo(o.x + cx * s, o.y + cy * s, o.x + x1 * s, o.y + y1 * s);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = o.color;
      for (const [, , , , x1, y1] of branches) {
        ctx.beginPath(); ctx.arc(o.x + x1 * s, o.y + y1 * s, 3.6 * s, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'seaweed': {
      ctx.strokeStyle = o.color; ctx.lineWidth = 5 * s; ctx.lineCap = 'round';
      for (const off of [-9, 0, 9]) {
        ctx.beginPath();
        ctx.moveTo(o.x + off * s, o.y);
        ctx.bezierCurveTo(
          o.x + (off - 8) * s, o.y - 20 * s,
          o.x + (off + 8) * s, o.y - 38 * s,
          o.x + off * s, o.y - 56 * s,
        );
        ctx.stroke();
      }
      break;
    }
    case 'starfish': {
      ctx.fillStyle = o.color;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
        const a2 = a + Math.PI / 5;
        ctx.lineTo(o.x + Math.cos(a) * 17 * s, o.y + Math.sin(a) * 17 * s);
        ctx.lineTo(o.x + Math.cos(a2) * 7.5 * s, o.y + Math.sin(a2) * 7.5 * s);
      }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      for (const [dx, dy] of [[0, -6], [-6, 3], [6, 3], [0, 1]]) {
        ctx.beginPath(); ctx.arc(o.x + dx * s, o.y + dy * s, 1.7 * s, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'jellyfish': {
      const glow = ctx.createRadialGradient(o.x, o.y, 2, o.x, o.y, 30 * s);
      glow.addColorStop(0, 'rgba(255,180,220,0.35)'); glow.addColorStop(1, 'rgba(255,180,220,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(o.x, o.y, 30 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = o.color;
      ctx.beginPath(); ctx.arc(o.x, o.y, 16 * s, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 0.75;
      ctx.fillRect(o.x - 16 * s, o.y, 32 * s, 3.4 * s);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = o.color; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
      for (const off of [-11, -4, 4, 11]) {
        ctx.beginPath();
        ctx.moveTo(o.x + off * s, o.y + 3 * s);
        ctx.bezierCurveTo(
          o.x + (off - 5) * s, o.y + 14 * s,
          o.x + (off + 5) * s, o.y + 24 * s,
          o.x + off * s, o.y + 34 * s,
        );
        ctx.stroke();
      }
      break;
    }
    case 'chest': {
      ctx.fillStyle = '#6e4520';
      ctx.fillRect(o.x - 28 * s, o.y - 26 * s, 56 * s, 26 * s);
      ctx.fillStyle = o.lid;
      ctx.beginPath(); ctx.arc(o.x, o.y - 26 * s, 28 * s, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = o.color;
      for (const [dx, dy, r] of [[-16, -30, 5], [-5, -34, 5.6], [6, -31, 5], [15, -28, 4.4], [0, -27, 4.6]]) {
        ctx.beginPath(); ctx.arc(o.x + dx * s, o.y + dy * s, r * s, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = '#4a2f14'; ctx.lineWidth = 2.4;
      ctx.strokeRect(o.x - 28 * s, o.y - 26 * s, 56 * s, 26 * s);
      ctx.beginPath(); ctx.moveTo(o.x - 28 * s, o.y - 26 * s); ctx.lineTo(o.x + 28 * s, o.y - 26 * s); ctx.stroke();
      ctx.fillStyle = '#ffd94d';
      ctx.fillRect(o.x - 5 * s, o.y - 30 * s, 10 * s, 12 * s);
      ctx.fillStyle = '#4a2f14';
      ctx.beginPath(); ctx.arc(o.x, o.y - 25 * s, 2.2 * s, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'bubbles': {
      ctx.strokeStyle = o.color; ctx.lineWidth = 1.7;
      ctx.globalAlpha = 0.85;
      for (const [dx, dy, r] of [[0, 0, 5], [-9, -16, 3.6], [7, -30, 4.4], [-3, -46, 3], [10, -58, 2.6]]) {
        ctx.beginPath(); ctx.arc(o.x + dx * s, o.y + dy * s, r * s, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case 'anchor': {
      ctx.save();
      ctx.translate(o.x, o.y); ctx.rotate(-0.28);
      ctx.strokeStyle = o.color; ctx.lineWidth = 4.6 * s; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, -34 * s); ctx.lineTo(0, 22 * s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-13 * s, -20 * s); ctx.lineTo(13 * s, -20 * s); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 16 * s, 15 * s, 0.25, Math.PI - 0.25); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -41 * s, 6.5 * s, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = o.color;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(side * 15 * s, 10 * s);
        ctx.lineTo(side * 20 * s, 22 * s);
        ctx.lineTo(side * 8 * s, 22 * s);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      break;
    }
  }
  ctx.restore();
}

// A found difference gets the same ring on both panels: a gold circle with a
// soft pulse halo, drawn by the engine on top of the scene.
export function drawFoundMarker(ctx, x, y, pulse) {
  ctx.save();
  ctx.strokeStyle = 'rgba(20, 16, 4, 0.45)';
  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.arc(x, y, 20 + pulse * 5, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 217, 77, 0.35)';
  ctx.lineWidth = 8;
  ctx.beginPath(); ctx.arc(x, y, 20 + pulse * 5, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#ffd94d';
  ctx.lineWidth = 3.4;
  ctx.beginPath(); ctx.arc(x, y, 19, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function drawWrongMark(ctx, x, y) {
  ctx.save();
  ctx.strokeStyle = '#ff5c5c';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 9, y - 9); ctx.lineTo(x + 9, y + 9);
  ctx.moveTo(x + 9, y - 9); ctx.lineTo(x - 9, y + 9);
  ctx.stroke();
  ctx.restore();
}

export function drawHintRing(ctx, x, y, pulse) {
  ctx.save();
  ctx.strokeStyle = '#7ad0ff';
  ctx.lineWidth = 3;
  ctx.setLineDash([7, 6]);
  ctx.beginPath(); ctx.arc(x, y, 30 + Math.sin(pulse * 6) * 5, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}
