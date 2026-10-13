/* ============================================================
   World: endless procedural island — meadows, roads, ruins
   ============================================================ */
const CHUNK = 256, GS = 1.5, ROAD_W = 30;
const chunks = new Map();
let frameNo = 0;
const roadY = (k, x) => k * 900 + 130 * Math.sin(x / 260 + k * 1.7) + 45 * Math.sin(x / 97 + k);
const roadX = (k, y) => k * 1100 + 140 * Math.sin(y / 300 + k * 2.3) + 40 * Math.sin(y / 83 + k);
function onRoad(x, y, pad) {
  pad = ROAD_W + (pad || 0);
  const ky = Math.round(y / 900), kx = Math.round(x / 1100);
  for (let k = ky - 1; k <= ky + 1; k++) if (Math.abs(y - roadY(k, x)) < pad) return true;
  for (let k = kx - 1; k <= kx + 1; k++) if (Math.abs(x - roadX(k, y)) < pad) return true;
  return false;
}
const isPlaza = (cx, cy) => (cx === 0 && cy === 0) || (hash2(cx * 7 + 3, cy * 13 - 5) < 0.11 && !(Math.abs(cx) <= 1 && Math.abs(cy) <= 1));
function inPlaza(x, y) {
  const cx = Math.floor(x / CHUNK), cy = Math.floor(y / CHUNK);
  if (!isPlaza(cx, cy)) return false;
  const lx = x - cx * CHUNK, ly = y - cy * CHUNK;
  return lx > 26 && lx < 230 && ly > 26 && ly < 230;
}

function chunkAt(cx, cy) {
  const key = cx + ',' + cy;
  let ch = chunks.get(key);
  if (!ch) { ch = { cx, cy, c: null, props: genProps(cx, cy), used: frameNo }; chunks.set(key, ch); evictChunks(); }
  ch.used = frameNo;
  return ch;
}
function evictChunks() {
  if (chunks.size < 60) return;
  const list = [...chunks.values()].filter(ch => frameNo - ch.used > 90).sort((a, b) => a.used - b.used);
  for (let i = 0; i < list.length && chunks.size > 40; i++) chunks.delete(list[i].cx + ',' + list[i].cy);
}

function genProps(cx, cy) {
  const R = rng(hash2(cx * 31 + 7, cy * 17 + 11)), wx = cx * CHUNK, wy = cy * CHUNK, props = [];
  if (isPlaza(cx, cy)) {
    for (let i = 0; i < 5; i++) for (const [px, py] of [[44 + i * 42, 40], [44 + i * 42, 222]]) {
      const r = R();
      if (r < 0.62) props.push({ s: SPR.column, x: wx + px, y: wy + py, tall: true });
      else if (r < 0.87) props.push({ s: SPR.columnBroken, x: wx + px, y: wy + py });
      else props.push({ s: SPR.drum, x: wx + px + 6, y: wy + py + 8 });
    }
    if (cx === 0 && cy === 0 || R() < 0.6) {
      props.push({ s: SPR.statue, x: wx + 128, y: wy + 120, tall: true });
      props.push({ s: SPR.brazier, x: wx + 92, y: wy + 132, light: true });
      props.push({ s: SPR.brazier, x: wx + 164, y: wy + 132, light: true });
    } else {
      props.push({ s: SPR.brazier, x: wx + 128, y: wy + 130, light: true });
      props.push({ s: SPR.drum, x: wx + 100 + R() * 50, y: wy + 170 });
    }
    return props;
  }
  const tryPut = (s, n, extra) => {
    for (let i = 0; i < n; i++) {
      const x = wx + 16 + R() * (CHUNK - 32), y = wy + 16 + R() * (CHUNK - 32);
      if (onRoad(x, y, 14)) continue;
      props.push({ s: typeof s === 'function' ? s() : s, x, y, ...extra });
    }
  };
  const lush = hash2(Math.floor(cx / 3) + 101, Math.floor(cy / 3) - 77);
  tryPut(() => pick(SPR.olive), lush > 0.5 ? (R() < 0.7 ? 2 : 1) : (R() < 0.45 ? 1 : 0), { tall: true });
  tryPut(SPR.cypress, R() < (lush > 0.6 ? 0.5 : 0.15) ? rint(1, 2) : 0, { tall: true });
  tryPut(() => pick(SPR.rock), rint(0, 3));
  tryPut(() => pick(SPR.bush), rint(0, 3));
  if (R() < 0.08) tryPut(SPR.columnBroken, 1);
  if (R() < 0.08) tryPut(SPR.drum, 1);
  if (R() < 0.05) tryPut(SPR.brazier, 1, { light: true });
  return props;
}

function renderChunk(ch) {
  const N = Math.round(CHUNK * GS), cv = document.createElement('canvas'); cv.width = cv.height = N;
  const x = cv.getContext('2d'); x.scale(GS, GS); x.lineCap = 'round'; x.lineJoin = 'round';
  const wx = ch.cx * CHUNK, wy = ch.cy * CHUNK;
  x.fillStyle = '#76863f'; x.fillRect(0, 0, CHUNK, CHUNK);
  const cells = (size, margin, fn) => {
    for (let gx = Math.floor((wx - margin) / size); gx <= Math.floor((wx + CHUNK + margin) / size); gx++)
      for (let gy = Math.floor((wy - margin) / size); gy <= Math.floor((wy + CHUNK + margin) / size); gy++) {
        const h = hash2(gx * 3 + size, gy * 5 - size), px = gx * size + hash2(gx, gy + 99) * size, py = gy * size + hash2(gx - 41, gy) * size;
        fn(h, px, py, px - wx, py - wy, gx, gy);
      }
  };
  // painterly colour variation
  const tints = ['158,160,84', '92,116,50', '140,118,72', '120,138,60', '170,166,96'];
  cells(56, 70, (h, px, py, lx, ly) => {
    const r = 34 + h * 40, col = tints[Math.floor(h * 997) % tints.length];
    const g = x.createRadialGradient(lx, ly, 0, lx, ly, r);
    g.addColorStop(0, 'rgba(' + col + ',0.55)'); g.addColorStop(1, 'rgba(' + col + ',0)');
    x.fillStyle = g; x.fillRect(lx - r, ly - r, r * 2, r * 2);
  });
  // roads
  const drawRoad = pts => {
    const pass = (col, w) => { x.strokeStyle = col; x.lineWidth = w; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke(); };
    pass('rgba(110,92,58,0.35)', ROAD_W * 2 + 14); pass('#b29a68', ROAD_W * 2); pass('rgba(200,180,130,0.6)', ROAD_W * 1.1);
  };
  for (let k = Math.floor((wy - 220) / 900); k <= Math.ceil((wy + CHUNK + 220) / 900); k++) {
    const pts = []; for (let px = wx - 40; px <= wx + CHUNK + 40; px += 8) pts.push([px - wx, roadY(k, px) - wy]);
    if (pts.some(p => p[1] > -60 && p[1] < CHUNK + 60)) drawRoad(pts);
  }
  for (let k = Math.floor((wx - 220) / 1100); k <= Math.ceil((wx + CHUNK + 220) / 1100); k++) {
    const pts = []; for (let py = wy - 40; py <= wy + CHUNK + 40; py += 8) pts.push([roadX(k, py) - wx, py - wy]);
    if (pts.some(p => p[0] > -60 && p[0] < CHUNK + 60)) drawRoad(pts);
  }
  // road pebbles & ruts
  cells(14, 10, (h, px, py, lx, ly) => {
    if (!onRoad(px, py, -6)) return;
    x.fillStyle = h < 0.5 ? 'rgba(120,100,70,0.6)' : 'rgba(230,214,170,0.6)';
    x.beginPath(); x.ellipse(lx, ly, 1.4 + h * 1.6, 1 + h, h * 3, 0, TAU); x.fill();
  });
  // plaza floor
  if (isPlaza(ch.cx, ch.cy)) {
    const R = rng(hash2(ch.cx + 5, ch.cy - 9));
    x.fillStyle = 'rgba(40,40,20,0.35)'; x.fillRect(22, 24, 212, 212);
    x.fillStyle = '#cfc4ae'; x.fillRect(20, 20, 216, 216);
    x.fillStyle = '#e8dfcc'; x.fillRect(20, 20, 216, 4); x.fillStyle = '#9a8e76'; x.fillRect(20, 232, 216, 4);
    const T = 24;
    for (let ty = 0; ty < 8; ty++) for (let tx = 0; tx < 8; tx++) {
      const X = 32 + tx * T, Y = 32 + ty * T, r = R();
      if (r < 0.07) { x.fillStyle = '#6a7a3a'; x.fillRect(X, Y, T, T); continue; }
      const v = Math.floor(222 + R() * 22);
      x.fillStyle = 'rgb(' + v + ',' + (v - 8) + ',' + (v - 24) + ')'; x.fillRect(X, Y, T - 1, T - 1);
      x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(X, Y, T - 1, 1.5); x.fillRect(X, Y, 1.5, T - 1);
      x.fillStyle = 'rgba(80,70,50,0.3)'; x.fillRect(X, Y + T - 2.5, T - 1, 1.5); x.fillRect(X + T - 2.5, Y, 1.5, T - 1);
      if (r > 0.82) { x.strokeStyle = 'rgba(90,80,60,0.55)'; x.lineWidth = 0.8; x.beginPath(); x.moveTo(X + R() * T, Y); x.lineTo(X + T * 0.5, Y + T * 0.5); x.lineTo(X + R() * T, Y + T); x.stroke(); }
      if (r > 0.9) { x.fillStyle = 'rgba(96,120,50,0.55)'; x.beginPath(); x.ellipse(X + R() * T, Y + R() * T, 4 + R() * 5, 2 + R() * 3, R() * 3, 0, TAU); x.fill(); }
    }
    // meander inlay ring
    x.strokeStyle = 'rgba(150,70,40,0.55)'; x.lineWidth = 2;
    for (let i = 0; i < 9; i++) {
      for (const [ox, oy] of [[40 + i * 20, 36], [40 + i * 20, 220]]) {
        x.save(); x.translate(ox, oy); x.beginPath(); x.moveTo(0, 0); x.lineTo(14, 0); x.lineTo(14, -10); x.lineTo(4, -10); x.lineTo(4, -4); x.lineTo(9, -4); x.stroke(); x.restore();
      }
    }
  }
  // grass tufts, flowers, stones
  cells(18, 8, (h, px, py, lx, ly) => {
    if (onRoad(px, py, 2) || inPlaza(px, py) || h > 0.7) return;
    const dark = h < 0.35;
    x.strokeStyle = dark ? 'rgba(52,72,26,0.7)' : 'rgba(176,184,104,0.75)'; x.lineWidth = 1.1;
    x.beginPath(); for (let i = -2; i <= 2; i++) { x.moveTo(lx + i * 1.4, ly); x.quadraticCurveTo(lx + i * 2.2, ly - 3, lx + i * 3, ly - 5 - (2 - Math.abs(i)) * 1.5); } x.stroke();
  });
  cells(34, 6, (h, px, py, lx, ly, gx, gy) => {
    if (onRoad(px, py, 0) || inPlaza(px, py)) return;
    const k = hash2(gx + 500, gy - 300);
    if (k < 0.22) {
      const col = k < 0.09 ? '#d8352a' : k < 0.15 ? '#f2d24a' : k < 0.19 ? '#ffffff' : '#b07ad8';
      for (let i = 0; i < 4; i++) { const ox = lx + (hash2(gx + i, gy) - 0.5) * 14, oy = ly + (hash2(gx, gy + i) - 0.5) * 10; x.fillStyle = 'rgba(40,60,20,0.6)'; x.fillRect(ox - 0.4, oy, 0.8, 3); x.fillStyle = col; x.beginPath(); x.arc(ox, oy, 1.7, 0, TAU); x.fill(); }
    } else if (k > 0.9) {
      x.fillStyle = 'rgba(70,64,50,0.5)'; x.beginPath(); x.ellipse(lx, ly + 1, 3.6, 1.6, 0, 0, TAU); x.fill();
      x.fillStyle = '#b8b0a0'; x.beginPath(); x.ellipse(lx, ly, 3, 2, h, 0, TAU); x.fill();
    }
  });
  ch.c = cv;
}
