/* ============================================================
   Game: state and simulation
   ============================================================ */
let G = null, MD = null;
let W = 0, H = 0, DPR = 1, Z = 1, VW = 0, VH = 0;
const ECOL = { satyr: '#7a5434', harpy: '#7a6a90', spartoi: '#ece4cf', centaur: '#8a5530', gigas: '#8a98ae', shade: '#9ff6ff', cyclops: '#b58a62', minotaur: '#5a3422', medusa: '#5aaa50', amphora: '#c8682e' };

function newRun(hero, demo) {
  G = {
    demo: !!demo, t: 0, state: demo ? 'menu' : 'play', nid: 1, hero, spawnAcc: 0, swarmNext: 95, bossIdx: 0, ampNext: 16,
    hurtFlash: 0, shake: 0, flash: 0, gold: 0, rerolls: demo ? 0 : (SAVE.meta.fates || 0), revives: demo ? 0 : (SAVE.meta.phoenix || 0),
    dawnT: -1, bossesSlain: 0, dmgDealt: 0, pendingLv: 0, chestLv: 0,
    P: { x: CHUNK / 2, y: CHUNK / 2 + 34, hp: 1, r: 12, inv: 0, fx: 1, fy: 0, face: 1, walk: 0, moving: false, lvl: 1, xp: 0, next: xpNeed(1), w: { [HEROES[hero].weapon]: 1 }, p: {}, kills: 0 },
    E: [], PR: [], EP: [], GM: [], FX: [], TX: [], PT: [], wt: {}, shAng: 0, fireT: 0, aiA: Math.random() * TAU,
  };
  if (demo) { G.P.w = { [HEROES[hero].weapon]: 3, shield: 2, fire: 2 }; G.t = 40; }
  MD = mods(); G.P.hp = MD.maxHp;
  return G;
}
function mods() {
  const p = G.P.p, m = G.demo ? {} : SAVE.meta, H = HEROES[G.hero];
  return {
    sp: 132 * H.speed * (1 + 0.1 * (p.hermes || 0)) * (1 + 0.04 * (m.swift || 0)),
    maxHp: H.hp + 20 * (p.ambrosia || 0) + 10 * (m.vigor || 0),
    regen: 0.4 * (p.ambrosia || 0),
    armor: (H.armor || 0) + (p.armor || 0),
    dmg: H.dmg * (1 + 0.1 * (p.ares || 0)) * (1 + 0.05 * (m.might || 0)),
    cd: (1 - 0.08 * (p.kronos || 0)) * (1 - 0.03 * (m.haste || 0)) * (H.cd || 1),
    area: 1 + 0.1 * (p.owl || 0),
    pick: 62 * H.pick * (1 + 0.35 * (p.fleece || 0)) * (1 + 0.1 * (m.reach || 0)),
    xp: 1 + 0.08 * (m.wisdom || 0),
    gold: 1 + 0.12 * (m.greed || 0),
  };
}
function wstat(k) { const w = WEAPONS[k], i = G.P.w[k] - 1, o = {}; for (const s in w.L) o[s] = w.L[s][i]; return o; }
function darkness() {
  if (G.state === 'menu') return 0.46;
  let d = 0.08 + 0.6 * smooth(20, 560, G.t);
  if (G.dawnT >= 0) d *= Math.max(0, 1 - G.dawnT / 2.2);
  return d;
}

/* ---------- Spatial grid ---------- */
const CELL = 48, grid = new Map();
const gkey = (cx, cy) => cx * 100003 + cy;
function buildGrid() {
  grid.clear();
  for (const e of G.E) {
    if (e.dead) continue;
    const k = gkey(Math.floor(e.x / CELL), Math.floor(e.y / CELL));
    let a = grid.get(k); if (!a) { a = []; grid.set(k, a); } a.push(e);
  }
}
function near(x, y, r, cb) {
  r += 38;
  const x0 = Math.floor((x - r) / CELL), x1 = Math.floor((x + r) / CELL), y0 = Math.floor((y - r) / CELL), y1 = Math.floor((y + r) / CELL);
  for (let cx = x0; cx <= x1; cx++) for (let cy = y0; cy <= y1; cy++) {
    const a = grid.get(gkey(cx, cy));
    if (a) for (let i = 0; i < a.length; i++) if (!a[i].dead) cb(a[i]);
  }
}
const d2 = (e, x, y) => (e.x - x) * (e.x - x) + (e.y - y) * (e.y - y);

/* ---------- Effects ---------- */
function burst(x, y, n, col, sp, life, size, opt) {
  opt = opt || {};
  const cap = SAVE.settings.quality === 'high' ? 450 : 140;
  for (let i = 0; i < n && G.PT.length < cap; i++) {
    const a = Math.random() * TAU, v = sp * (0.3 + Math.random() * 0.7);
    G.PT.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (opt.up || 0), life: life * (0.6 + Math.random() * 0.4), max: life, s: size * (0.6 + Math.random() * 0.7), c: col, g: opt.g || 0, add: !!opt.add, k: opt.k || 'dot' });
  }
}
function text(x, y, v, crit, col) {
  if (G.TX.length > 60) G.TX.shift();
  G.TX.push({ x: x + rnd(-6, 6), y, v, life: crit ? 0.85 : 0.6, max: crit ? 0.85 : 0.6, crit: !!crit, c: col });
}
function shake(n) { G.shake = Math.max(G.shake, n); }
function vibrate(ms) { if (!SAVE.settings.vibration || G.demo) return; try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} }

/* ---------- Spawning ---------- */
const spawnRadius = () => Math.hypot(VW, VH) / 2 + 36;
function spawnEnemy(type, x, y) {
  const d = ED[type], m = d.boss || d.prop ? 1 : hpMul(G.t);
  if (x === undefined) { const a = Math.random() * TAU, R = spawnRadius(); x = G.P.x + Math.cos(a) * R; y = G.P.y + Math.sin(a) * R; }
  const e = { id: G.nid++, type, x, y, hp: d.hp * m, maxHp: d.hp * m, sp: d.sp * rnd(0.9, 1.1), r: d.r, dmg: d.dmg, xp: d.xp,
    boss: !!d.boss, prop: !!d.prop, kx: 0, ky: 0, flash: 0, ct: rnd(1.5, 3), mode: 'walk', hs: 0, ph: Math.random() * 10, face: 1, age: 0 };
  G.E.push(e);
  return e;
}
function spawning(dt) {
  const t = G.t;
  if (G.dawnT >= 0) return;
  if (!G.demo && G.bossIdx < BOSSES.length && t >= ED[BOSSES[G.bossIdx]].at) {
    const type = BOSSES[G.bossIdx], d = ED[type];
    spawnEnemy(type); G.bossIdx++;
    audio.boss(); shake(10); G.flash = 0.35;
    bossBanner(d.name, d.title);
  }
  if (!G.demo && t >= G.swarmNext) {
    G.swarmNext += 75;
    // a ring of monsters with one gap to break out through
    const n = 12 + Math.floor(t / 30), type = t < 200 ? 'satyr' : t < 420 ? 'harpy' : 'shade', R = spawnRadius() - 10, gap = Math.random() * TAU;
    for (let i = 0; i < n; i++) {
      const a = gap + 0.9 + i * (TAU - 1.8) / (n - 1);
      spawnEnemy(type, G.P.x + Math.cos(a) * R, G.P.y + Math.sin(a) * R);
    }
    toast('Surrounded!');
  }
  if (!G.demo && t >= G.ampNext) {
    G.ampNext = t + rnd(24, 38);
    const a = Math.random() * TAU, R = rnd(110, 200);
    spawnEnemy('amphora', G.P.x + Math.cos(a) * R, G.P.y + Math.sin(a) * R);
  }
  const rate = G.demo ? 2.2 : spawnRate(t);
  G.spawnAcc += rate * dt;
  while (G.spawnAcc >= 1) { G.spawnAcc--; if (G.E.length < (G.demo ? 70 : MAXE)) spawnEnemy(pickType(G.demo ? rnd(0, 480) : t)); }
}

/* ---------- Combat ---------- */
function hurt(e, dmg, kx, ky, kb) {
  if (e.dead) return;
  const crit = Math.random() < 0.06;
  dmg = Math.max(1, Math.round(dmg * rnd(0.9, 1.1) * (crit ? 2.2 : 1)));
  e.hp -= dmg; e.flash = 0.1; G.dmgDealt += dmg;
  if (!e.prop && SAVE.settings.numbers && !G.demo) text(e.x, e.y - e.r - 6, dmg, crit);
  if (kb && !e.boss && !e.prop) { const m = Math.hypot(kx, ky) || 1; e.kx += kx / m * kb; e.ky += ky / m * kb; }
  burst(e.x, e.y - 4, crit ? 6 : 2, crit ? '#ffe27a' : '#fff3d6', 150, 0.22, 1.6, { k: 'spark', add: true });
  if (!G.demo) crit ? audio.crit() : audio.hit();
  if (e.hp <= 0) kill(e);
}
function kill(e, silent) {
  e.dead = true;
  const col = ECOL[e.type] || '#888';
  if (e.prop) { breakAmphora(e); return; }
  burst(e.x, e.y, e.boss ? 46 : 9, col, e.boss ? 280 : 120, 0.5, e.boss ? 4 : 2.4);
  if (e.type === 'shade') burst(e.x, e.y, 6, '#bff8ff', 60, 0.8, 2, { add: true, up: 30 });
  G.FX.push({ k: 'ring', x: e.x, y: e.y, r: e.r, life: 0.3, max: 0.3 });
  if (silent) return;
  G.P.kills++;
  if (!G.demo) audio.kill();
  if (e.boss) { bossDown(e); return; }
  if (e.xp) dropGem(e.x, e.y, e.xp);
  if (Math.random() < (e.type === 'gigas' ? 0.35 : 0.06)) G.GM.push({ k: 'coin', x: e.x + rnd(-6, 6), y: e.y + rnd(-6, 6), v: e.type === 'gigas' ? 5 : rint(1, 2) });
  if (Math.random() < 0.01) G.GM.push({ k: 'fig', x: e.x, y: e.y });
}
function bossDown(e) {
  G.bossesSlain++; shake(16); G.flash = 0.6;
  G.GM.push({ k: 'chest', x: e.x, y: e.y });
  for (let i = 0; i < 18; i++) G.GM.push({ k: 'coin', x: e.x + rnd(-50, 50), y: e.y + rnd(-50, 50), v: 3 });
  for (let i = 0; i < 12; i++) dropGem(e.x + rnd(-45, 45), e.y + rnd(-45, 45), 5);
  banner(ED[e.type].name + ' has fallen!');
  audio.victory();
}
function breakAmphora(e) {
  audio.break_();
  burst(e.x, e.y, 14, '#c8682e', 140, 0.6, 2.6);
  burst(e.x, e.y, 5, '#1b110c', 120, 0.6, 2.2);
  const r = Math.random();
  if (r < 0.4) for (let i = 0; i < 4; i++) G.GM.push({ k: 'coin', x: e.x + rnd(-14, 14), y: e.y + rnd(-14, 14), v: 2 });
  else if (r < 0.62) G.GM.push({ k: 'fig', x: e.x, y: e.y });
  else if (r < 0.84) G.GM.push({ k: 'horn', x: e.x, y: e.y });
  else G.GM.push({ k: 'orb', x: e.x, y: e.y });
}
function dropGem(x, y, v) {
  if (G.GM.length > 340) { for (const g of G.GM) if (g.k === 'gem' && !g.mag) { g.v += v; return; } }
  G.GM.push({ k: 'gem', x, y, v });
}
const gemTier = v => (v >= 15 ? 3 : v >= 5 ? 2 : v >= 2 ? 1 : 0);
function damagePlayer(d) {
  const P = G.P;
  if (P.inv > 0 || G.demo || G.dawnT >= 0) return;
  P.hp -= Math.max(1, d - MD.armor); P.inv = 0.5; G.hurtFlash = 0.3;
  audio.hurt(); vibrate(30); shake(5);
  burst(P.x, P.y - 4, 6, '#d8352a', 120, 0.4, 2);
}
function nearestEnemies(n, maxR) {
  const P = G.P, list = [];
  for (const e of G.E) { if (e.dead || e.prop) continue; const dd = d2(e, P.x, P.y); if (dd < maxR * maxR) list.push([dd, e]); }
  list.sort((a, b) => a[0] - b[0]);
  return list.slice(0, n).map(x => x[1]);
}
function fireWeapon(k, s) {
  const P = G.P, dm = MD.dmg, quiet = G.demo;
  if (k === 'spear') {
    const targets = nearestEnemies(s.n, 520);
    for (let i = 0; i < s.n; i++) {
      const t = targets[i] || targets[0];
      let a = t ? Math.atan2(t.y - P.y, t.x - P.x) : Math.atan2(P.fy, P.fx);
      if (!targets[i]) a += (i - (s.n - 1) / 2) * 0.25;
      G.PR.push({ k: 'spear', x: P.x, y: P.y - 6, vx: Math.cos(a) * 440, vy: Math.sin(a) * 440, r: 7, dmg: s.dmg * dm, pierce: s.pierce, life: 1.4, hits: [] });
    }
    if (!quiet) audio.throw_();
  } else if (k === 'arrows') {
    const t = nearestEnemies(1, 340)[0];
    const base = t ? Math.atan2(t.y - P.y, t.x - P.x) : Math.atan2(P.fy, P.fx);
    for (let i = 0; i < s.n; i++) {
      const a = base + (i - (s.n - 1) / 2) * 0.15;
      G.PR.push({ k: 'arrow', x: P.x, y: P.y - 6, vx: Math.cos(a) * 400, vy: Math.sin(a) * 400, r: 5, dmg: s.dmg * dm, pierce: 0, life: 0.95, hits: [] });
    }
    if (!quiet) audio.throw_();
  } else if (k === 'club') {
    const r = s.r * MD.area, arc = s.arc * Math.min(1.3, MD.area);
    const t = nearestEnemies(1, r + 40)[0];
    const dirs = [t ? Math.atan2(t.y - P.y, t.x - P.x) : Math.atan2(P.fy, P.fx)]; if (s.both) dirs.push(dirs[0] + Math.PI);
    for (const a of dirs) {
      G.FX.push({ k: 'swoosh', a, arc, r, life: 0.24, max: 0.24 });
      near(P.x, P.y, r, e => {
        const dx = e.x - P.x, dy = e.y - P.y;
        if (dx * dx + dy * dy > (r + e.r) ** 2) return;
        let da = Math.atan2(dy, dx) - a; da = Math.atan2(Math.sin(da), Math.cos(da));
        if (Math.abs(da) <= arc / 2 + 0.2) hurt(e, s.dmg * dm, dx, dy, 260);
      });
    }
    if (!quiet) { audio.swing(); shake(2); }
  } else if (k === 'bolt') {
    const vis = G.E.filter(e => !e.dead && !e.prop && Math.abs(e.x - P.x) < VW / 2 && Math.abs(e.y - P.y) < VH / 2);
    if (!vis.length) { G.wt[k] = 0.3; return; }
    const aoe = s.aoe * MD.area;
    for (let i = 0; i < s.n && vis.length; i++) {
      const t = vis.splice(Math.floor(Math.random() * vis.length), 1)[0];
      strike(t.x, t.y, aoe, s.dmg * dm);
    }
    if (!quiet) { audio.bolt(); shake(3); }
  } else if (k === 'trident') {
    const t = nearestEnemies(1, 600)[0];
    const base = t ? Math.atan2(t.y - P.y, t.x - P.x) : Math.atan2(P.fy, P.fx);
    for (let i = 0; i < s.n; i++) {
      const a = base + i * TAU / s.n;
      G.PR.push({ k: 'trident', x: P.x, y: P.y - 6, dx: Math.cos(a), dy: Math.sin(a), sp: 450, t: 0, T: 1.3, r: 14 * MD.area, dmg: s.dmg * dm, hitT: {}, rot: 0 });
    }
    if (!quiet) audio.throw_();
  }
}
function strike(tx, ty, aoe, dmg) {
  const pts = []; let x = tx + rnd(-40, 40);
  for (let j = 0; j <= 9; j++) { pts.push([x, ty - 340 + j * 340 / 9]); x += rnd(-16, 16); }
  pts[9] = [tx, ty];
  G.FX.push({ k: 'bolt', x: tx, y: ty, pts, r: aoe, life: 0.35, max: 0.35 });
  burst(tx, ty, 10, '#bfe6ff', 200, 0.35, 1.8, { k: 'spark', add: true });
  near(tx, ty, aoe, e => { if (d2(e, tx, ty) < (aoe + e.r) ** 2) hurt(e, dmg, e.x - tx, e.y - ty, 80); });
}
function weapons(dt) {
  const P = G.P;
  for (const k in P.w) {
    const s = wstat(k);
    if (k === 'shield') {
      G.shAng += s.spin * dt;
      const rad = s.rad * MD.area;
      for (let i = 0; i < s.n; i++) {
        const a = G.shAng + i * TAU / s.n, sx = P.x + Math.cos(a) * rad, sy = P.y - 4 + Math.sin(a) * rad;
        near(sx, sy, 13, e => {
          if (e.hs > G.t) return;
          if (d2(e, sx, sy) < (e.r + 13) ** 2) { e.hs = G.t + 0.45; hurt(e, s.dmg * MD.dmg, e.x - P.x, e.y - P.y, 140); }
        });
      }
      continue;
    }
    if (k === 'fire') {
      G.fireT -= dt;
      if (G.fireT <= 0) {
        G.fireT = 0.5;
        const r = s.r * MD.area;
        near(P.x, P.y, r, e => { if (d2(e, P.x, P.y) < (r + e.r) ** 2) hurt(e, s.dmg * MD.dmg, 0, 0, 0); });
      }
      continue;
    }
    G.wt[k] = (G.wt[k] ?? 0.5) - dt;
    if (G.wt[k] > 0) continue;
    G.wt[k] = s.cd * MD.cd;
    fireWeapon(k, s);
  }
}
function projectiles(dt) {
  for (const p of G.PR) {
    if (p.k === 'trident') {
      p.t += dt; p.rot += dt * 10;
      const v = p.sp * (1 - 2 * p.t / p.T);
      p.x += p.dx * v * dt; p.y += p.dy * v * dt;
      if (p.t >= p.T) { p.dead = true; continue; }
      near(p.x, p.y, p.r, e => {
        if ((p.hitT[e.id] || 0) > G.t) return;
        if (d2(e, p.x, p.y) < (e.r + p.r) ** 2) { p.hitT[e.id] = G.t + 0.4; hurt(e, p.dmg, p.dx, p.dy, 90); }
      });
      continue;
    }
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
    if (p.life <= 0) { p.dead = true; continue; }
    near(p.x, p.y, p.r, e => {
      if (p.dead || p.hits.includes(e.id)) return;
      if (d2(e, p.x, p.y) < (e.r + p.r) ** 2) {
        p.hits.push(e.id); hurt(e, p.dmg, p.vx, p.vy, 90);
        if (p.pierce-- <= 0) p.dead = true;
      }
    });
  }
}
function enemies(dt) {
  const P = G.P, reloc = spawnRadius() * 1.6, f = Math.exp(-9 * dt);
  for (const e of G.E) {
    if (e.dead) continue;
    e.flash -= dt; e.age += dt;
    if (e.prop) { if (d2(e, P.x, P.y) > reloc * reloc * 2) e.dead = true; continue; }
    const dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy) || 1;
    let sp = e.sp, ux = dx / d, uy = dy / d;
    if (e.type === 'minotaur') {
      e.ct -= dt;
      if (e.mode === 'wind') { sp = 0; if (e.ct <= 0) { e.mode = 'charge'; e.ct = 0.9; e.cx = ux; e.cy = uy; shake(4); } }
      else if (e.mode === 'charge') { sp = 360; ux = e.cx; uy = e.cy; if (Math.random() < 0.5) burst(e.x, e.y + 20, 1, '#a89070', 40, 0.5, 3); if (e.ct <= 0) { e.mode = 'walk'; e.ct = 3.2; } }
      else if (e.ct <= 0) { e.mode = 'wind'; e.ct = 0.75; }
    } else if (e.type === 'cyclops') {
      e.ct -= dt;
      if (e.ct <= 0) { e.ct = 3; G.EP.push({ k: 'boulder', x: e.x, y: e.y - 30, vx: ux * 180, vy: uy * 180, r: 13, dmg: 16, life: 4, rot: 0 }); }
    } else if (e.type === 'medusa') {
      e.ct -= dt;
      if (e.ct <= 0) {
        e.ct = 2.6;
        for (let i = 0; i < 12; i++) { const a = i * TAU / 12 + G.t; G.EP.push({ k: 'venom', x: e.x, y: e.y - 20, vx: Math.cos(a) * 125, vy: Math.sin(a) * 125, r: 7, dmg: 10, life: 5, rot: a }); }
      }
    } else if (e.type === 'centaur') {
      e.ct -= dt;
      if (e.ct <= 0 && d < 300) { e.ct = rnd(2.6, 4); G.EP.push({ k: 'arrowE', x: e.x, y: e.y - 8, vx: ux * 230, vy: uy * 230, r: 5, dmg: 8, life: 2.2, rot: Math.atan2(uy, ux) }); }
      if (d < 150) sp *= 0.5;
    } else if (e.type === 'harpy' || e.type === 'shade') {
      const w = Math.sin(G.t * (e.type === 'harpy' ? 4 : 2.2) + e.ph) * 0.7;
      ux += -uy * w; uy += ux * w * 0.5;
    }
    if (G.dawnT >= 0) sp = 0;
    e.x += ux * sp * dt + e.kx * dt; e.y += uy * sp * dt + e.ky * dt;
    e.kx *= f; e.ky *= f;
    if (Math.abs(dx) > 3) e.face = dx > 0 ? 1 : -1;
    if (!isFinite(e.x) || !isFinite(e.y)) { e.x = P.x + spawnRadius(); e.y = P.y; e.kx = e.ky = 0; }
    if (!e.boss && d > reloc) { const a = Math.random() * TAU, R = spawnRadius(); e.x = P.x + Math.cos(a) * R; e.y = P.y + Math.sin(a) * R; }
    if (d < e.r + P.r) damagePlayer(e.dmg);
  }
  for (const e of G.E) {
    if (e.dead || e.type === 'shade') continue;
    near(e.x, e.y, e.r, o => {
      if (o.id <= e.id || o.type === 'shade') return;
      const dx = e.x - o.x, dy = e.y - o.y, m = e.r + o.r, dd = dx * dx + dy * dy;
      if (dd >= m * m || dd < 0.0001) return;
      const dist = Math.sqrt(dd), push = (m - dist) * 0.5, nx = dx / dist, ny = dy / dist;
      const eh = e.boss || e.prop, oh = o.boss || o.prop;
      if (eh && oh) return;
      if (eh) { o.x -= nx * push * 2; o.y -= ny * push * 2; }
      else if (oh) { e.x += nx * push * 2; e.y += ny * push * 2; }
      else { e.x += nx * push; e.y += ny * push; o.x -= nx * push; o.y -= ny * push; }
    });
  }
}
function enemyShots(dt) {
  const P = G.P;
  for (const p of G.EP) {
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.rot += dt * 4;
    if (p.life <= 0 || G.dawnT >= 0) { p.dead = true; continue; }
    if (d2(p, P.x, P.y - 4) < (p.r + P.r) ** 2 && P.inv <= 0) { damagePlayer(p.dmg); p.dead = true; burst(p.x, p.y, 6, p.k === 'venom' ? '#7ad040' : '#9a948a', 90, 0.4, 2); }
  }
}
function pickups(dt) {
  const P = G.P;
  for (const g of G.GM) {
    g.age = (g.age || 0) + dt;
    const dx = P.x - g.x, dy = P.y - g.y, d = Math.hypot(dx, dy) || 1;
    if (!g.mag && (d < MD.pick || (g.k === 'chest' && d < 70))) g.mag = true;
    if (g.mag) {
      g.sp = (g.sp || 120) + 900 * dt;
      const step = Math.min(d, g.sp * dt);
      g.x += dx / d * step; g.y += dy / d * step;
    }
    if (d < P.r + 9) { g.dead = true; collect(g); }
  }
}
function collect(g) {
  const P = G.P, demo = G.demo;
  if (g.k === 'gem') { addXp(g.v * MD.xp); if (!demo) audio.gem(); burst(P.x, P.y - 6, 2, GEM_COLS[gemTier(g.v)][1], 60, 0.3, 1.6, { add: true }); }
  else if (g.k === 'coin') { G.gold += g.v * MD.gold; if (!demo) audio.coin(); text(P.x, P.y - 24, '+' + g.v, false, '#ffd34a'); }
  else if (g.k === 'fig') { const h = Math.min(30, MD.maxHp - P.hp); P.hp += h; audio.heal(); text(P.x, P.y - 24, '+' + Math.round(h), false, '#9cf08a'); burst(P.x, P.y, 10, '#9cf08a', 60, 0.6, 2, { up: 40, add: true }); }
  else if (g.k === 'chest') { G.pendingLv++; G.chestLv++; P.hp = Math.min(MD.maxHp, P.hp + MD.maxHp * 0.3); G.gold += 40 * MD.gold; burst(P.x, P.y, 30, '#ffd34a', 200, 0.8, 2.4, { add: true }); }
  else if (g.k === 'horn') { for (const o of G.GM) if (o.k === 'gem' || o.k === 'coin') o.mag = true; audio.magnet(); G.FX.push({ k: 'ring', x: P.x, y: P.y, r: 60, big: true, life: 0.6, max: 0.6 }); toast('Horn of Hermes! Gems fly to you'); }
  else if (g.k === 'orb') {
    audio.wrath(); G.flash = 0.7; shake(14);
    const vis = G.E.filter(e => !e.dead && !e.prop && Math.abs(e.x - P.x) < VW / 2 + 20 && Math.abs(e.y - P.y) < VH / 2 + 20);
    vis.slice(0, 14).forEach(e => G.FX.push({ k: 'bolt', x: e.x, y: e.y, pts: [[e.x + rnd(-30, 30), e.y - 340], [e.x + rnd(-15, 15), e.y - 170], [e.x, e.y]], r: 30, life: 0.4, max: 0.4 }));
    for (const e of vis) hurt(e, e.boss ? 250 : 9999, e.x - P.x, e.y - P.y, 200);
    toast('Wrath of Zeus!');
  }
}
function addXp(v) {
  const P = G.P;
  P.xp += v;
  while (P.xp >= P.next) { P.xp -= P.next; P.lvl++; P.next = xpNeed(P.lvl); G.pendingLv++; }
}
function fxUpdate(dt) {
  for (const f of G.FX) { f.life -= dt; if (f.life <= 0) f.dead = true; }
  for (const t of G.TX) { t.life -= dt; t.y -= 30 * dt; if (t.life <= 0) t.dead = true; }
  const fr = Math.exp(-3 * dt);
  for (const p of G.PT) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= fr; p.vy = p.vy * fr + p.g * dt; if (p.life <= 0) p.dead = true; }
}
function sweep() {
  for (const k of ['E', 'PR', 'EP', 'GM', 'FX', 'TX', 'PT']) {
    const a = G[k]; let j = 0;
    for (let i = 0; i < a.length; i++) if (!a[i].dead) a[j++] = a[i];
    a.length = j;
  }
}

/* ---------- Level-up options ---------- */
function buildOptions() {
  const P = G.P, pool = [], nW = Object.keys(P.w).length;
  for (const k in WEAPONS) { const lv = P.w[k] || 0; if (lv >= 5 || (!lv && nW >= MAX_WEAPONS)) continue; pool.push({ t: 'w', k, lv, wt: lv ? 1.4 : 1 }); }
  for (const k in PASSIVES) { const lv = P.p[k] || 0; if (lv < 5) pool.push({ t: 'p', k, lv, wt: 1 }); }
  const out = [];
  while (out.length < 3 && pool.length) {
    let s = 0; for (const o of pool) s += o.wt;
    let r = Math.random() * s, i = 0;
    for (; i < pool.length - 1; i++) if ((r -= pool[i].wt) <= 0) break;
    out.push(pool.splice(i, 1)[0]);
  }
  if (!out.length) return [{ t: 'heal' }, { t: 'gold' }];
  return out;
}
function applyOption(o) {
  const P = G.P;
  if (o.t === 'w') P.w[o.k] = (P.w[o.k] || 0) + 1;
  else if (o.t === 'p') { P.p[o.k] = (P.p[o.k] || 0) + 1; if (o.k === 'ambrosia') P.hp += 20; }
  else if (o.t === 'heal') P.hp += 50;
  else if (o.t === 'gold') G.gold += 50 * MD.gold;
  MD = mods(); P.hp = Math.min(P.hp, MD.maxHp);
}

/* ---------- Main update ---------- */
function update(dt) {
  const P = G.P;
  G.t += dt; MD = mods();
  let ix = 0, iy = 0;
  if (G.demo) {
    // attract mode: wander and steer away from the crowd
    G.aiA += dt * 0.35; ix = Math.cos(G.aiA); iy = Math.sin(G.aiA * 0.7);
    const n = nearestEnemies(4, 110);
    for (const e of n) { const dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy) || 1; ix += dx / d * 1.4; iy += dy / d * 1.4; }
    const m = Math.hypot(ix, iy) || 1; ix /= m; iy /= m; ix *= 0.75; iy *= 0.75;
  } else {
    const v = inputVector(); ix = v[0]; iy = v[1];
  }
  if (G.dawnT >= 0 || !isFinite(ix) || !isFinite(iy)) { ix = iy = 0; }
  const mag = Math.hypot(ix, iy);
  P.moving = mag > 0.12;
  if (P.moving) { P.fx = ix / mag; P.fy = iy / mag; P.walk += dt * 10 * Math.min(mag, 1); if (Math.abs(ix) > 0.15) P.face = ix > 0 ? 1 : -1; }
  P.x += ix * MD.sp * dt; P.y += iy * MD.sp * dt;
  P.inv -= dt; G.hurtFlash -= dt; G.flash -= dt; G.shake = Math.max(0, G.shake - dt * 30);
  if (P.hp > MD.maxHp) P.hp = MD.maxHp;
  if (P.hp > 0 && P.hp < MD.maxHp) P.hp = Math.min(MD.maxHp, P.hp + MD.regen * dt);
  spawning(dt);
  buildGrid();
  weapons(dt);
  projectiles(dt);
  enemies(dt);
  enemyShots(dt);
  pickups(dt);
  fxUpdate(dt);
  sweep();
  if (G.demo) {
    P.hp = MD.maxHp;
    while (G.pendingLv > 0) { G.pendingLv--; const o = buildOptions(); if (o[0].t === 'w' || o[0].t === 'p') applyOption(o[0]); }
    if (Object.keys(P.w).length >= 4 && G.t > 400) newRun(G.hero, true);
    return;
  }
  audio.music.intensity = G.E.some(e => e.boss) ? 2 : G.t > 300 ? 1.5 : 1;
  if (P.hp <= 0) {
    if (G.revives > 0) {
      G.revives--; P.hp = MD.maxHp * 0.5; P.inv = 2.5; G.flash = 0.8; shake(10); audio.revive();
      for (const e of G.E) if (!e.boss && !e.prop && d2(e, P.x, P.y) < 160 * 160) kill(e, true);
      burst(P.x, P.y, 40, '#ffb02a', 220, 1, 3, { add: true, up: 40 });
      banner('The Phoenix rises!');
    } else { endRun(false); return; }
  }
  if (G.t >= GAME_LEN && G.dawnT < 0) {
    G.dawnT = 0; G.flash = 0.9; audio.victory();
    for (const e of G.E) { if (!e.prop) kill(e, true); }
    banner('Dawn breaks over Olympus');
  }
  if (G.dawnT >= 0) { G.dawnT += dt; P.inv = 1; if (G.dawnT > 3.2) { endRun(true); return; } }
  if (G.pendingLv > 0) openLevelUp();
}
