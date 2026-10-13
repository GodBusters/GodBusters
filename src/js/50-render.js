/* ============================================================
   Render
   ============================================================ */
const cv = $('cv'), ctx = cv.getContext('2d');
let vignette = null, lowHpVig = null, lightCv = null, lctx = null;
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  Z = clamp(Math.min(W, H) / 430, 0.8, 1.6);
  VW = W / Z; VH = H / Z;
  vignette = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.38, W / 2, H / 2, Math.hypot(W, H) * 0.62);
  vignette.addColorStop(0, 'rgba(8,8,20,0)'); vignette.addColorStop(1, 'rgba(8,8,20,0.55)');
  lowHpVig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.hypot(W, H) * 0.6);
  lowHpVig.addColorStop(0, 'rgba(180,20,20,0)'); lowHpVig.addColorStop(1, 'rgba(180,20,20,0.55)');
  lightCv = lightCv || document.createElement('canvas');
  lightCv.width = Math.max(1, Math.round(W * 0.5)); lightCv.height = Math.max(1, Math.round(H * 0.5));
  lctx = lightCv.getContext('2d');
}

function spr(s, x, y, flip, white, alpha, sc) {
  const img = white ? whiteOf(s) : s.c;
  if (alpha != null) ctx.globalAlpha = alpha;
  if (flip || sc) {
    ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1); if (sc) ctx.scale(sc, sc);
    ctx.drawImage(img, -s.ax, -s.ay, s.w, s.h); ctx.restore();
  } else ctx.drawImage(img, x - s.ax, y - s.ay, s.w, s.h);
  if (alpha != null) ctx.globalAlpha = 1;
}
function sprRot(s, x, y, rot, alpha) {
  if (alpha != null) ctx.globalAlpha = alpha;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.drawImage(s.c, -s.ax, -s.ay, s.w, s.h); ctx.restore();
  if (alpha != null) ctx.globalAlpha = 1;
}
function glow(s, x, y, size, alpha) {
  ctx.globalAlpha = alpha; ctx.drawImage(s.c, x - size / 2, y - size / 2, size, size); ctx.globalAlpha = 1;
}
const flicker = (seed) => 0.85 + Math.sin(G.t * 13 + seed) * 0.08 + Math.sin(G.t * 7.3 + seed * 2) * 0.07;

function drawEnemy(e) {
  const frames = SPR[e.type], fr = frames[(Math.floor(G.t * (e.boss ? 4 : 9) + e.ph) % frames.length + frames.length) % frames.length];
  let y = e.y, alpha = null, sc = null;
  if (ED[e.type].fly) y -= 8 + Math.sin(G.t * 3 + e.ph) * 3;
  if (e.type === 'shade') alpha = 0.8;
  if (e.age < 0.35 && !e.prop) alpha = (alpha || 1) * (e.age / 0.35);
  if (e.type === 'minotaur' && e.mode === 'wind') sc = 1 + Math.sin(G.t * 50) * 0.03;
  if (e.prop) y += Math.sin(G.t * 2 + e.ph) * 0.4;
  if (e.boss) {
    ctx.globalCompositeOperation = 'lighter';
    glow(SPR.glowWarm, e.x, e.y + e.r * 0.6, e.r * 4, 0.22 + Math.sin(G.t * 4) * 0.08);
    ctx.globalCompositeOperation = 'source-over';
  }
  spr(fr, e.x, y, e.face < 0, e.flash > 0, alpha, sc);
  if (e.type === 'cyclops' && e.flash <= 0) {
    const la = Math.atan2(G.P.y - (y - 37), G.P.x - e.x), ex = e.x;
    ctx.fillStyle = '#7a3a1a'; ctx.beginPath(); ctx.arc(ex + Math.cos(la) * 3.6, y - 37 + Math.sin(la) * 3.6, 4.6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#0e0606'; ctx.beginPath(); ctx.arc(ex + Math.cos(la) * 4.2, y - 37 + Math.sin(la) * 4.2, 2.6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ex + Math.cos(la) * 3 - 1.4, y - 38.6 + Math.sin(la) * 3, 1, 0, TAU); ctx.fill();
  }
}
function drawPlayer() {
  const P = G.P, frames = SPR['hero_' + G.hero];
  const fr = frames[P.moving ? ((Math.floor(P.walk) % 4) + 4) % 4 : 0];
  const blink = P.inv > 0 && G.dawnT < 0 && Math.floor(G.t * 20) % 2 === 0;
  const bob = P.moving ? -Math.abs(Math.sin(P.walk * Math.PI / 2)) * 1.6 : Math.sin(G.t * 2.2) * 0.6;
  spr(fr, P.x, P.y + bob, P.face < 0, blink);
  if (!G.demo) {
    const hp = clamp(P.hp / MD.maxHp, 0, 1), w = 30;
    ctx.fillStyle = 'rgba(12,10,20,0.8)'; ctx.fillRect(P.x - w / 2 - 1, P.y + 24, w + 2, 5);
    ctx.fillStyle = hp > 0.5 ? '#7fd36a' : hp > 0.25 ? '#f2c040' : '#e8402a'; ctx.fillRect(P.x - w / 2, P.y + 25, w * hp, 3);
  }
}
function drawShadows(L, T, R, B) {
  ctx.fillStyle = 'rgba(14,18,8,0.3)'; ctx.beginPath();
  const add = (x, y, rx, ry) => { ctx.moveTo(x + rx, y); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); };
  for (const e of G.E) {
    if (e.x < L - 60 || e.x > R + 60 || e.y < T - 60 || e.y > B + 60) continue;
    const fly = ED[e.type].fly, k = fly ? 0.7 : 1;
    add(e.x, e.y + (e.boss ? e.r * 1.05 : e.r * 0.85 + 2), e.r * 1.05 * k, e.r * 0.42 * k);
  }
  add(G.P.x, G.P.y + 17, 11, 4.5);
  ctx.fill();
}
function drawFireAura() {
  const P = G.P;
  if (!P.w.fire) return;
  const r = wstat('fire').r * MD.area;
  const g = ctx.createRadialGradient(P.x, P.y, r * 0.15, P.x, P.y, r);
  g.addColorStop(0, 'rgba(255,190,90,0.04)'); g.addColorStop(0.7, 'rgba(240,110,40,0.16)'); g.addColorStop(1, 'rgba(200,50,20,0.3)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(P.x, P.y, r, 0, TAU); ctx.fill();
  const n = Math.round(r / 5);
  for (let i = 0; i < n; i++) {
    const a = i * TAU / n + G.t * 0.7, fx = P.x + Math.cos(a) * r, fy = P.y + Math.sin(a) * r * 0.92;
    spr(SPR.flame, fx, fy, false, false, 0.9, 0.42 + Math.sin(G.t * 12 + i * 1.9) * 0.12);
  }
}
function drawPickups(L, T, R, B) {
  for (const g of G.GM) {
    if (g.x < L - 20 || g.x > R + 20 || g.y < T - 20 || g.y > B + 20) continue;
    const bob = Math.sin(G.t * 4 + g.x * 0.1) * 1.5;
    if (g.k === 'gem') spr(SPR.gem[gemTier(g.v)], g.x, g.y + bob);
    else if (g.k === 'coin') spr(SPR.coin, g.x, g.y + bob);
    else if (g.k === 'fig') spr(SPR.fig, g.x, g.y + bob);
    else if (g.k === 'horn') spr(SPR.horn, g.x, g.y + bob);
    else if (g.k === 'orb') spr(SPR.orb, g.x, g.y + bob);
    else if (g.k === 'chest') {
      ctx.globalCompositeOperation = 'lighter'; glow(SPR.glowGold, g.x, g.y, 80 + Math.sin(G.t * 5) * 8, 0.6); ctx.globalCompositeOperation = 'source-over';
      spr(SPR.chest, g.x, g.y + bob);
    }
  }
}
function drawShots() {
  ctx.globalCompositeOperation = 'lighter';
  for (const p of G.PR) {
    if (p.k === 'trident') glow(SPR.glowCyan, p.x, p.y, 44, 0.55);
    else if (p.k === 'spear') glow(SPR.glowGold, p.x, p.y, 26, 0.35);
  }
  for (const p of G.EP) glow(p.k === 'venom' ? SPR.glowGreen : SPR.glowWarm, p.x, p.y, p.r * 4, 0.45);
  ctx.globalCompositeOperation = 'source-over';
  for (const p of G.PR) {
    if (p.k === 'spear') sprRot(SPR.spear, p.x, p.y, Math.atan2(p.vy, p.vx));
    else if (p.k === 'arrow') sprRot(SPR.arrow, p.x, p.y, Math.atan2(p.vy, p.vx));
    else if (p.k === 'trident') sprRot(SPR.trident, p.x, p.y, p.rot);
  }
  for (const p of G.EP) sprRot(SPR[p.k], p.x, p.y, p.k === 'arrowE' ? Math.atan2(p.vy, p.vx) : p.rot);
}
function drawShields() {
  const P = G.P;
  if (!P.w.shield) return;
  const s = wstat('shield'), rad = s.rad * MD.area;
  ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,220,140,0.16)'; ctx.lineWidth = 7;
  for (let i = 0; i < s.n; i++) { const a = G.shAng + i * TAU / s.n; ctx.beginPath(); ctx.arc(P.x, P.y - 4, rad, a - 0.55, a); ctx.stroke(); }
  ctx.globalCompositeOperation = 'source-over';
  for (let i = 0; i < s.n; i++) {
    const a = G.shAng + i * TAU / s.n;
    sprRot(SPR.aspis, P.x + Math.cos(a) * rad, P.y - 4 + Math.sin(a) * rad, G.t * 6);
  }
}
function drawFx() {
  const P = G.P;
  for (const f of G.FX) {
    const k = f.life / f.max;
    if (f.k === 'bolt') {
      ctx.globalCompositeOperation = 'lighter';
      glow(SPR.glowBlue, f.x, f.y, f.r * 3.4, k * 0.9);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.globalAlpha = k;
      const path = () => { ctx.beginPath(); f.pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); };
      path(); ctx.strokeStyle = 'rgba(90,160,255,0.6)'; ctx.lineWidth = 9; ctx.stroke();
      ctx.strokeStyle = '#e8f6ff'; ctx.lineWidth = 3; ctx.stroke();
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(255,255,255,' + (k * 0.8).toFixed(3) + ')'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r * (1.3 - k * 0.5), f.r * (1.3 - k * 0.5) * 0.5, 0, 0, TAU); ctx.stroke();
    } else if (f.k === 'ring') {
      ctx.strokeStyle = f.big ? 'rgba(255,220,120,' + (k * 0.8).toFixed(3) + ')' : 'rgba(255,245,220,' + (k * 0.5).toFixed(3) + ')';
      ctx.lineWidth = f.big ? 4 : 2;
      const rr = f.big ? f.r + (1 - k) * 260 : f.r * (1.8 - k * 0.8);
      ctx.beginPath(); ctx.ellipse(f.x, f.y, rr, rr * 0.6, 0, 0, TAU); ctx.stroke();
    } else if (f.k === 'swoosh') {
      const prog = 1 - k, a0 = f.a - f.arc / 2, a1 = a0 + f.arc * Math.min(1, prog * 1.8);
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255,230,170,' + (k * 0.55).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(P.x, P.y - 4, f.r, a0, a1); ctx.arc(P.x, P.y - 4, f.r * 0.45, a1, a0, true); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,240,' + k.toFixed(3) + ')'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(P.x, P.y - 4, f.r, a0, a1); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }
  }
}
function drawParticles() {
  for (const p of G.PT) {
    const k = p.life / p.max;
    if (p.k === 'spark') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = p.c; ctx.globalAlpha = k; ctx.lineWidth = p.s;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04); ctx.stroke();
    } else {
      if (p.add) ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.min(1, k * 1.5); ctx.fillStyle = p.c;
      ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
}
function drawTexts() {
  ctx.textAlign = 'center'; ctx.lineJoin = 'round';
  for (const t of G.TX) {
    const k = t.life / t.max, pop = t.crit ? 1 + Math.max(0, (k - 0.75) * 3) : 1;
    ctx.font = (t.crit ? '900 ' + Math.round(17 * pop) : '800 13') + 'px "Alegreya Sans", system-ui, sans-serif';
    ctx.globalAlpha = Math.min(1, k * 3);
    ctx.lineWidth = 3.4; ctx.strokeStyle = 'rgba(16,10,24,0.95)';
    const s = t.crit ? t.v + '!' : String(t.v);
    ctx.strokeText(s, t.x, t.y); ctx.fillStyle = t.c || (t.crit ? '#ffd34a' : '#fff6e6'); ctx.fillText(s, t.x, t.y);
  }
  ctx.globalAlpha = 1;
}
function lighting(camX, camY, props) {
  const dark = darkness(), P = G.P;
  if (dark < 0.02) return;
  if (SAVE.settings.quality !== 'high') { ctx.fillStyle = 'rgba(14,16,42,' + (dark * 0.72).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); return; }
  const LW = lightCv.width, LH = lightCv.height, k = LW / W;
  lctx.globalCompositeOperation = 'source-over'; lctx.globalAlpha = 1; lctx.clearRect(0, 0, LW, LH);
  lctx.fillStyle = 'rgba(12,14,40,' + dark.toFixed(3) + ')'; lctx.fillRect(0, 0, LW, LH);
  lctx.globalCompositeOperation = 'destination-out';
  const L = (x, y, r, a) => {
    const sx = ((x - camX) * Z + W / 2) * k, sy = ((y - camY) * Z + H / 2) * k, R = r * Z * k;
    if (sx < -R || sy < -R || sx > LW + R || sy > LH + R) return;
    lctx.globalAlpha = Math.min(1, a); lctx.drawImage(SPR.light.c, sx - R, sy - R, R * 2, R * 2);
  };
  L(P.x, P.y, 200, 0.9); L(P.x, P.y, 90, 0.8);
  if (P.w.fire) L(P.x, P.y, wstat('fire').r * MD.area * 1.9, 0.75);
  for (const p of props) if (p.light) L(p.x, p.y - 22, 170 * flicker(p.x), 1);
  for (const f of G.FX) { if (f.k === 'bolt') L(f.x, f.y, 110, f.life / f.max * 1.2); else if (f.k === 'swoosh') L(P.x, P.y, f.r * 1.5, 0.5); }
  for (const p of G.PR) if (p.k === 'trident') L(p.x, p.y, 60, 0.45);
  for (const p of G.EP) L(p.x, p.y, 40, 0.5);
  let n = 0;
  for (const g of G.GM) { if (g.k === 'chest') L(g.x, g.y, 110, 0.8); else if (n++ < 40) L(g.x, g.y, 22, 0.45); }
  for (const e of G.E) if (e.type === 'shade' || e.type === 'medusa') L(e.x, e.y, 46, 0.45);
  lctx.globalAlpha = 1;
  ctx.drawImage(lightCv, 0, 0, W, H);
  ctx.globalCompositeOperation = 'lighter';
  const S = (x, y) => [(x - camX) * Z + W / 2, (y - camY) * Z + H / 2];
  for (const p of props) if (p.light) { const [sx, sy] = S(p.x, p.y - 22); glow(SPR.glowWarm, sx, sy, 150 * Z * flicker(p.y), 0.32 * dark + 0.08); }
  if (P.w.fire) { const [sx, sy] = S(P.x, P.y); glow(SPR.glowWarm, sx, sy, wstat('fire').r * MD.area * 2.6 * Z, 0.22); }
  ctx.globalCompositeOperation = 'source-over';
}

function render() {
  frameNo++;
  const P = G.P, sh = SAVE.settings.shake ? G.shake : 0;
  const camX = P.x + (sh ? rnd(-sh, sh) * 0.45 : 0), camY = P.y + (sh ? rnd(-sh, sh) * 0.45 : 0);
  const s = DPR * Z;
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.setTransform(s, 0, 0, s, W * DPR / 2 - camX * s, H * DPR / 2 - camY * s);
  const L = camX - VW / 2, T = camY - VH / 2, R = camX + VW / 2, B = camY + VH / 2;
  const cx0 = Math.floor(L / CHUNK), cx1 = Math.floor(R / CHUNK), cy0 = Math.floor(T / CHUNK), cyB = Math.floor(B / CHUNK), cy1 = Math.floor((B + 100) / CHUNK);
  let budget = render.warm ? 2 : 99;
  render.warm = true;
  const props = [];
  for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
    const ch = chunkAt(cx, cy);
    if (cy <= cyB) {
      if (!ch.c && budget-- > 0) renderChunk(ch);
      if (ch.c) ctx.drawImage(ch.c, cx * CHUNK, cy * CHUNK, CHUNK + 0.6, CHUNK + 0.6);
      else { ctx.fillStyle = '#76863f'; ctx.fillRect(cx * CHUNK, cy * CHUNK, CHUNK + 0.6, CHUNK + 0.6); }
    }
    for (const p of ch.props) if (p.x > L - 60 && p.x < R + 60 && p.y > T - 12 && p.y < B + 100) props.push(p);
  }
  drawFireAura();
  drawShadows(L, T, R, B);
  drawPickups(L, T, R, B);
  const D = [];
  for (const p of props) D.push([p.y, 0, p]);
  for (const e of G.E) if (e.x > L - 70 && e.x < R + 70 && e.y > T - 30 && e.y < B + 90) D.push([e.y + (e.prop ? -2 : 0), 1, e]);
  D.push([P.y, 2, P]);
  D.sort((a, b) => a[0] - b[0]);
  for (const [, kind, o] of D) {
    if (kind === 0) {
      let a = null;
      if (o.tall && P.y < o.y && P.y > o.y - o.s.h + 10 && Math.abs(P.x - o.x) < o.s.w / 2 + 6) a = 0.45;
      spr(o.s, o.x, o.y, false, false, a);
      if (o.light) spr(SPR.flame, o.x, o.y - 20, false, false, 0.95, 0.75 * flicker(o.x + o.y));
    } else if (kind === 1) drawEnemy(o);
    else drawPlayer();
  }
  drawShots();
  drawShields();
  drawFx();
  drawParticles();
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  lighting(camX, camY, props);
  ctx.setTransform(s, 0, 0, s, W * DPR / 2 - camX * s, H * DPR / 2 - camY * s);
  drawTexts();
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = vignette; ctx.fillRect(0, 0, W, H);
  if (!G.demo && P.hp / MD.maxHp < 0.3 && P.hp > 0) { ctx.globalAlpha = 0.55 + Math.sin(G.t * 6) * 0.35; ctx.fillStyle = lowHpVig; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  if (G.hurtFlash > 0) { ctx.fillStyle = 'rgba(200,30,20,' + (G.hurtFlash * 0.7).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); }
  if (G.flash > 0) { ctx.fillStyle = 'rgba(255,250,235,' + Math.min(0.85, G.flash).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); }
  if (joy.active && G.state === 'play') {
    ctx.strokeStyle = 'rgba(255,240,210,0.5)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(joy.ox, joy.oy, JOY_R, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(10,12,30,0.25)'; ctx.fill();
    const kx = joy.ox + joy.dx * JOY_R, ky = joy.oy + joy.dy * JOY_R;
    const g = ctx.createRadialGradient(kx - 6, ky - 6, 2, kx, ky, 24); g.addColorStop(0, '#fff6dc'); g.addColorStop(1, '#d9a040');
    ctx.fillStyle = g; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.arc(kx, ky, 22, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
  }
}
