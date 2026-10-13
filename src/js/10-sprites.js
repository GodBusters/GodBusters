/* ============================================================
   Sprites: everything is painted once into off-screen canvases
   ============================================================ */
const SS = Math.min(2.5, Math.max(2, window.devicePixelRatio || 1));
const OUT = '#1d1220';
function mk(w, h, ax, ay, fn, scale) {
  const k = scale || SS;
  const c = document.createElement('canvas');
  c.width = Math.ceil(w * k); c.height = Math.ceil(h * k);
  const x = c.getContext('2d');
  x.scale(k, k); x.translate(ax, ay); x.lineJoin = 'round'; x.lineCap = 'round';
  fn(x);
  return { c, w, h, ax, ay, wc: null };
}
function whiteOf(s) {
  if (!s.wc) {
    const c = document.createElement('canvas'); c.width = s.c.width; c.height = s.c.height;
    const x = c.getContext('2d'); x.drawImage(s.c, 0, 0);
    x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fff8ec'; x.fillRect(0, 0, c.width, c.height);
    s.wc = c;
  }
  return s.wc;
}
/* path + paint helpers */
function E(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, TAU); }
function C(c, x, y, r) { c.beginPath(); c.arc(x, y, Math.max(0.1, r), 0, TAU); }
function RR(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
}
function LG(c, x0, y0, x1, y1, ...cols) { const g = c.createLinearGradient(x0, y0, x1, y1); cols.forEach((col, i) => g.addColorStop(i / (cols.length - 1), col)); return g; }
function RG(c, x, y, r, ...cols) { const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.08, x, y, r); cols.forEach((col, i) => g.addColorStop(i / (cols.length - 1), col)); return g; }
function paint(c, fill, lw) { c.strokeStyle = OUT; c.lineWidth = lw == null ? 2 : lw; c.stroke(); c.fillStyle = fill; c.fill(); }
function line(c, col, lw, pts) { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); }
function limb(c, col, lw, pts) { line(c, OUT, lw + 2, pts); line(c, col, lw, pts); }

/* ---------- Weapons held / thrown ---------- */
function artSpear(c, len) {
  limb(c, '#8a5a2b', 2.4, [[-len / 2, 0], [len / 2 - 6, 0]]);
  c.beginPath(); c.moveTo(len / 2 - 8, -3); c.quadraticCurveTo(len / 2 - 2, -2.6, len / 2 + 4, 0); c.quadraticCurveTo(len / 2 - 2, 2.6, len / 2 - 8, 3); c.closePath();
  paint(c, LG(c, 0, -3, 0, 3, '#fff1c2', '#e2a840', '#8a5a1a'), 1.4);
  c.beginPath(); c.moveTo(-len / 2 - 3, 0); c.lineTo(-len / 2 + 1, -1.6); c.lineTo(-len / 2 + 1, 1.6); c.closePath(); paint(c, '#b98a3a', 1);
}
function artArrow(c, dark) {
  limb(c, dark ? '#3a2a20' : '#c49a5a', 1.3, [[-10, 0], [7, 0]]);
  c.beginPath(); c.moveTo(6, -2.4); c.lineTo(11, 0); c.lineTo(6, 2.4); c.closePath(); paint(c, dark ? '#6a6a70' : '#e9c46a', 1);
  c.fillStyle = dark ? '#1d1a1a' : '#c8322a';
  c.beginPath(); c.moveTo(-10, 0); c.lineTo(-6, -3.2); c.lineTo(-3, -3.2); c.lineTo(-6, 0); c.lineTo(-3, 3.2); c.lineTo(-6, 3.2); c.closePath(); c.fill();
}
function artTrident(c) {
  limb(c, '#2c8a9a', 2.6, [[-16, 0], [8, 0]]);
  c.strokeStyle = OUT; c.lineWidth = 5; c.beginPath();
  c.moveTo(16, -6); c.lineTo(8, -6); c.quadraticCurveTo(4, -6, 4, 0); c.quadraticCurveTo(4, 6, 8, 6); c.lineTo(16, 6); c.moveTo(4, 0); c.lineTo(17, 0); c.stroke();
  c.strokeStyle = LG(c, 0, -6, 0, 6, '#bff6ff', '#4cc3d9', '#1d6f86'); c.lineWidth = 3; c.stroke();
  c.fillStyle = '#e6fdff';
  for (const y of [-6, 0, 6]) { c.beginPath(); c.moveTo(16, y - 2.4); c.lineTo(21, y); c.lineTo(16, y + 2.4); c.closePath(); c.fill(); }
  C(c, -16, 0, 2.6); paint(c, '#e2b54a', 1.2);
}
function artAspis(c, r, emblem) {
  C(c, 0, 0, r); paint(c, RG(c, 0, 0, r, '#fff1b8', '#e3a843', '#9a6220', '#5e3a12'), 2);
  c.strokeStyle = '#6e4416'; c.lineWidth = 1.4; C(c, 0, 0, r - 2.6); c.stroke();
  if (emblem === 'mirror') {
    C(c, 0, 0, r - 3); c.fillStyle = RG(c, 0, 0, r, '#ffffff', '#d7e3f5', '#8ea2c4'); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-r * 0.45, -r * 0.1); c.lineTo(-r * 0.1, -r * 0.5); c.stroke();
  } else if (emblem === 'owl') {
    C(c, 0, 0, r * 0.55); c.fillStyle = '#2a1a12'; c.fill();
    c.fillStyle = '#e8b44a'; C(c, -r * 0.2, -r * 0.08, r * 0.15); c.fill(); C(c, r * 0.2, -r * 0.08, r * 0.15); c.fill();
  } else {
    c.fillStyle = '#a3261c'; c.beginPath();
    for (let i = 0; i < 16; i++) { const a = i * TAU / 16, rr = i % 2 ? r * 0.25 : r * 0.58; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    c.closePath(); c.fill();
    C(c, 0, 0, r * 0.18); c.fillStyle = '#f6d580'; c.fill();
  }
  c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 1.2; c.beginPath(); c.arc(0, 0, r - 4.5, -2.6, -1.4); c.stroke();
}
function artClub(c, s) {
  c.save(); c.scale(s, s);
  c.beginPath(); c.moveTo(-2, 14); c.lineTo(-5.5, -14); c.quadraticCurveTo(0, -20, 5.5, -14); c.lineTo(2, 14); c.closePath();
  paint(c, LG(c, -5, 0, 5, 0, '#a8723c', '#7a4a22', '#4e2c12'), 1.8);
  c.fillStyle = '#3e220e';
  for (const [x, y] of [[-3, -9], [2.5, -4], [-2, 2], [3.2, -13]]) { E(c, x, y, 1.6, 1.1); c.fill(); }
  c.restore();
}
function artBow(c, dark) {
  c.strokeStyle = OUT; c.lineWidth = 4.2; c.beginPath(); c.moveTo(0, -14); c.quadraticCurveTo(9, -8, 6, 0); c.quadraticCurveTo(9, 8, 0, 14); c.stroke();
  c.strokeStyle = dark ? '#5a3a22' : '#c8902f'; c.lineWidth = 2.4; c.stroke();
  c.strokeStyle = 'rgba(255,245,220,0.8)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(0, -14); c.lineTo(0, 14); c.stroke();
}
function artFlame(c, s) {
  const lay = [['#a3261c', 1], ['#f06a24', 0.78], ['#ffc54a', 0.55], ['#fff6c8', 0.3]];
  for (const [col, k] of lay) {
    c.beginPath(); c.moveTo(0, -18 * s * k - 4 * s); c.bezierCurveTo(9 * s * k, -6 * s * k, 9 * s * k, 8 * s * k, 0, 9 * s * k);
    c.bezierCurveTo(-9 * s * k, 8 * s * k, -9 * s * k, -6 * s * k, 0, -18 * s * k - 4 * s); c.fillStyle = col; c.fill();
  }
}

/* ---------- Heroes ---------- */
const HERO_LOOK = {
  achilles: { skin: '#e2a877', tunic: '#c0392b', tunicD: '#6e1a14', cape: '#2f58a8', capeD: '#152a5a', armor: ['#ffe39a', '#d39a3e', '#7a4a17'], sandal: '#5a3418', head: 'corinthian', crest: '#d8352a', weapon: 'spear', shield: 'star' },
  atalanta: { skin: '#efc193', tunic: '#3f8a46', tunicD: '#1d4a25', cape: '#7a5230', capeD: '#3a2414', armor: ['#f0dfb0', '#bfa06a', '#6a5030'], sandal: '#4a2c14', head: 'hair', hair: '#d0702a', weapon: 'bow' },
  heracles: { skin: '#c98a5a', tunic: '#6a4426', tunicD: '#3a2210', cape: '#d29a42', capeD: '#7a5220', armor: ['#e0b878', '#a87a3e', '#5a3a16'], sandal: '#3a2210', head: 'lion', weapon: 'club' },
  perseus: { skin: '#e7b285', tunic: '#eae3d2', tunicD: '#a89c82', cape: '#6a3fa0', capeD: '#2e1a4e', armor: ['#eef3fb', '#a9b8d0', '#5a6a86'], sandal: '#4a3020', head: 'winged', weapon: 'harpe', shield: 'mirror' },
};
function drawHero(c, key, f) {
  const o = HERO_LOOK[key], ph = f * Math.PI / 2, sw = Math.sin(ph) * 2.6, sway = Math.cos(ph) * 1.6;
  // cape
  c.beginPath(); c.moveTo(-8, -8); c.quadraticCurveTo(-14, 5, -12 + sway, 18); c.lineTo(-4 + sway, 16.5); c.lineTo(4 + sway, 18); c.lineTo(12 + sway, 16.5); c.quadraticCurveTo(14, 5, 8, -8); c.closePath();
  paint(c, LG(c, 0, -8, 0, 18, o.cape, o.capeD));
  // legs
  for (const [lx, d] of [[-4, sw], [4, -sw]]) {
    const ly = 17 + d * 0.5;
    c.beginPath(); c.moveTo(lx - 2.5, 6); c.lineTo(lx - 2.2, ly); c.lineTo(lx + 2.2, ly); c.lineTo(lx + 2.5, 6); c.closePath(); paint(c, o.skin, 1.8);
    line(c, o.sandal, 1, [[lx - 2.2, ly - 3], [lx + 2.2, ly - 4.6]]); line(c, o.sandal, 1, [[lx - 2.2, ly - 6], [lx + 2.2, ly - 7.6]]);
    E(c, lx, ly, 3.2, 1.8); paint(c, o.sandal, 1.4);
  }
  // pteruges skirt
  c.beginPath(); c.moveTo(-8, 1); c.lineTo(-9.6, 10.5); c.lineTo(9.6, 10.5); c.lineTo(8, 1); c.closePath(); paint(c, LG(c, 0, 1, 0, 10.5, o.tunic, o.tunicD));
  c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 0.8; c.beginPath(); for (let i = -6; i <= 6; i += 3) { c.moveTo(i, 2.5); c.lineTo(i * 1.15, 10); } c.stroke();
  // weapon behind arm
  c.save(); c.translate(10.5, -1);
  if (o.weapon === 'spear') { c.rotate(-Math.PI / 2 + 0.06); artSpear(c, 46); }
  else if (o.weapon === 'bow') { c.translate(1.5, 0); artBow(c); }
  else if (o.weapon === 'club') { c.translate(2, -6); c.rotate(0.25); artClub(c, 0.95); }
  else if (o.weapon === 'harpe') {
    c.translate(1, -4); limb(c, '#6a4a2a', 2, [[0, 8], [0, -4]]);
    c.beginPath(); c.moveTo(0, -4); c.lineTo(0, -12); c.quadraticCurveTo(1, -19, 8, -18); c.quadraticCurveTo(3, -16, 3, -11); c.lineTo(2, -4); c.closePath();
    paint(c, LG(c, 0, -18, 6, -4, '#ffffff', '#b8c6dc', '#6a7a96'), 1.4);
  }
  c.restore();
  // torso cuirass
  RR(c, -8, -9.5, 16, 12, 4); paint(c, LG(c, -8, -9, 8, 3, o.armor[0], o.armor[1], o.armor[2]));
  c.strokeStyle = 'rgba(60,30,10,0.45)'; c.lineWidth = 0.9; c.beginPath();
  c.moveTo(0, -7.5); c.lineTo(0, 0.5); c.moveTo(-5.5, -4.5); c.quadraticCurveTo(-2, -2, 0, -4.5); c.moveTo(5.5, -4.5); c.quadraticCurveTo(2, -2, 0, -4.5); c.stroke();
  c.fillStyle = '#5a3216'; c.fillRect(-8, 0.5, 16, 2.2);
  c.fillStyle = '#f2c55a'; c.fillRect(-1.2, 0.5, 2.4, 2.2);
  // right arm
  E(c, 10, -2.5, 3, 4.6); paint(c, o.skin, 1.6);
  // head
  if (o.head === 'lion') {
    c.beginPath(); for (let i = 0; i <= 18; i++) { const a = Math.PI * 0.95 + i * Math.PI * 1.1 / 18, r = i % 2 ? 10.5 : 12.5; c.lineTo(Math.cos(a) * r, -15 + Math.sin(a) * r); } c.closePath();
    paint(c, LG(c, 0, -27, 0, -6, '#e8b45a', '#a8682a'), 1.8);
  }
  if (o.head === 'hair') { c.beginPath(); c.moveTo(4, -18); c.quadraticCurveTo(13, -14, 9, -2); c.quadraticCurveTo(8, -9, 3, -12); c.closePath(); paint(c, o.hair, 1.6); }
  C(c, 0, -15, 7); paint(c, RG(c, 0, -15, 7, '#ffe0c0', o.skin, '#a8683a'), 1.8);
  c.fillStyle = '#2a1810'; C(c, -2.6, -14.5, 1); c.fill(); C(c, 2.6, -14.5, 1); c.fill();
  if (o.head === 'corinthian') {
    c.beginPath(); c.moveTo(-7.6, -13); c.quadraticCurveTo(-8.6, -23.5, 0, -24); c.quadraticCurveTo(8.6, -23.5, 7.6, -13); c.lineTo(7, -8.6); c.lineTo(3.6, -9.4);
    c.lineTo(3, -13.6); c.lineTo(-3, -13.6); c.lineTo(-3.6, -9.4); c.lineTo(-7, -8.6); c.closePath();
    paint(c, LG(c, -8, -24, 8, -9, '#fff0b0', '#d9a040', '#7a4a17'), 1.8);
    c.fillStyle = '#1a0e08'; c.fillRect(-6.2, -17, 4.4, 2.2); c.fillRect(1.8, -17, 4.4, 2.2);
    c.fillStyle = '#fff6d8'; c.fillRect(-4.5, -16.6, 1, 0.9); c.fillRect(3.4, -16.6, 1, 0.9);
    c.fillStyle = '#b97d2c'; c.fillRect(-0.8, -17, 1.6, 4.4);
    c.beginPath(); c.moveTo(-10, -21); c.quadraticCurveTo(0, -35, 10, -21); c.quadraticCurveTo(0, -26, -10, -21); c.closePath();
    paint(c, LG(c, 0, -33, 0, -21, '#ff8a5a', o.crest, '#6a1010'), 1.8);
    c.strokeStyle = 'rgba(70,0,0,0.5)'; c.lineWidth = 0.7; c.beginPath(); for (let i = -7; i <= 7; i += 2) { c.moveTo(i * 0.9, -22.5 - (7 - Math.abs(i)) * 0.5); c.lineTo(i * 1.2, -24 - (7 - Math.abs(i)) * 1.3); } c.stroke();
  } else if (o.head === 'hair') {
    c.beginPath(); c.moveTo(-7.4, -14); c.quadraticCurveTo(-8, -23, 0, -23); c.quadraticCurveTo(8, -23, 7.4, -14); c.quadraticCurveTo(3, -19, -7.4, -14); c.closePath(); paint(c, LG(c, 0, -23, 0, -14, '#f0a050', o.hair, '#7a3a10'), 1.6);
    c.strokeStyle = '#e8c24a'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-7, -18.5); c.quadraticCurveTo(0, -21.5, 7, -18.5); c.stroke();
  } else if (o.head === 'lion') {
    c.beginPath(); c.moveTo(-8, -15); c.quadraticCurveTo(-9, -25, 0, -25.5); c.quadraticCurveTo(9, -25, 8, -15); c.quadraticCurveTo(4, -18.5, 0, -18); c.quadraticCurveTo(-4, -18.5, -8, -15); c.closePath();
    paint(c, LG(c, 0, -26, 0, -15, '#f2c27a', '#c8823a', '#8a5222'), 1.6);
    for (const s of [-1, 1]) { E(c, s * 6.5, -24, 2.6, 2.2); paint(c, '#c8823a', 1.4); }
    c.fillStyle = '#2a1408'; C(c, -3, -21.5, 0.9); c.fill(); C(c, 3, -21.5, 0.9); c.fill();
    c.fillStyle = '#5a2a10'; E(c, 0, -19, 1.6, 1); c.fill();
  } else if (o.head === 'winged') {
    c.beginPath(); c.moveTo(-7.6, -14); c.quadraticCurveTo(-8, -24, 0, -24); c.quadraticCurveTo(8, -24, 7.6, -14); c.lineTo(5, -16); c.lineTo(-5, -16); c.closePath();
    paint(c, LG(c, -8, -24, 8, -14, '#7a6aa0', '#3a2e5a', '#1e1630'), 1.8);
    for (const s of [-1, 1]) {
      c.beginPath(); c.moveTo(s * 7, -19); c.quadraticCurveTo(s * 15, -26, s * 17, -21); c.quadraticCurveTo(s * 14, -21, s * 15, -18); c.quadraticCurveTo(s * 12, -18, s * 12.5, -16); c.closePath();
      paint(c, LG(c, 0, -26, 0, -16, '#ffffff', '#c8d4ea'), 1.4);
    }
  }
  // left arm / shield
  if (o.shield) { c.save(); c.translate(-10, 0); artAspis(c, 9.5, o.shield); c.restore(); }
  else { E(c, -10, -2.5, 3, 4.6); paint(c, o.skin, 1.6); }
}

/* ---------- Enemies ---------- */
function drawSatyr(c, f) {
  const ph = f * Math.PI / 2, d = Math.sin(ph) * 2.2, fur = '#6b4a2f', furD = '#3a2616', skin = '#c98d5e';
  for (const [s, k] of [[-1, d], [1, -d]]) {
    limb(c, fur, 3.6, [[s * 4, 5], [s * 5.5, 10 + k * 0.3], [s * 3.6, 13.5], [s * 4.2, 17 + k * 0.4]]);
    E(c, s * 4.4, 17.8 + k * 0.4, 2.4, 1.5); paint(c, '#1e1410', 1.2);
  }
  E(c, 0, 6, 8, 5); paint(c, LG(c, 0, 1, 0, 11, '#8a6040', fur, furD));
  c.strokeStyle = furD; c.lineWidth = 0.9; c.beginPath(); for (let i = -6; i <= 6; i += 2.4) { c.moveTo(i, 8); c.lineTo(i + 0.8, 10.5); } c.stroke();
  // club
  c.save(); c.translate(9.5, -1); c.rotate(0.5 + Math.sin(ph) * 0.1); artClub(c, 0.6); c.restore();
  E(c, 0, -3, 7, 7.5); paint(c, RG(c, 0, -3, 8, '#f0b888', skin, '#8a5530'));
  c.strokeStyle = 'rgba(90,40,20,0.5)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-3, -5); c.quadraticCurveTo(0, -3, 3, -5); c.moveTo(0, -3); c.lineTo(0, 1); c.stroke();
  E(c, -7.6, -2, 2.6, 4); paint(c, skin, 1.4); E(c, 8, -2, 2.6, 4); paint(c, skin, 1.4);
  // horns
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(s * 2, -18); c.quadraticCurveTo(s * 5, -27, s * 11, -24); c.quadraticCurveTo(s * 7, -24, s * 5.5, -17.5); c.closePath();
    paint(c, LG(c, 0, -27, 0, -17, '#f2e2c0', '#a88a5a'), 1.4);
  }
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 5, -14); c.lineTo(s * 11, -16.5); c.lineTo(s * 5.5, -11); c.closePath(); paint(c, skin, 1.3); }
  C(c, 0, -13, 6.4); paint(c, RG(c, 0, -13, 6.4, '#f4c294', skin, '#8a5530'), 1.8);
  c.beginPath(); c.moveTo(-4, -9.5); c.quadraticCurveTo(0, -1, 4, -9.5); c.closePath(); paint(c, '#5a3a20', 1.2);
  c.fillStyle = '#ffd84a'; E(c, -2.4, -13.5, 1.5, 1.2); c.fill(); E(c, 2.4, -13.5, 1.5, 1.2); c.fill();
  c.fillStyle = '#1a0e08'; c.fillRect(-2.7, -14.3, 0.6, 1.6); c.fillRect(2.1, -14.3, 0.6, 1.6);
  line(c, '#3a2010', 1, [[-4, -16], [-1, -15.2]]); line(c, '#3a2010', 1, [[4, -16], [1, -15.2]]);
}
function drawHarpy(c, f) {
  const a = [-0.6, 0, 0.6, 0][f];
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(s * 4, -4);
    c.quadraticCurveTo(s * 14, -14 + a * 6, s * 25, -10 + a * 16);
    for (let i = 0; i < 5; i++) { const t = i / 4; c.quadraticCurveTo(s * (24 - t * 16 + 2), -4 + a * 12 * (1 - t) + 5, s * (21 - t * 16), -6 + a * 12 * (1 - t) + 6 + t * 3); }
    c.lineTo(s * 4, 4); c.closePath();
    paint(c, LG(c, 0, -14, 0, 8, '#9a86b0', '#5a4a70', '#2e2440'), 1.8);
    c.strokeStyle = 'rgba(20,10,30,0.45)'; c.lineWidth = 0.8; c.beginPath();
    for (let i = 1; i < 5; i++) { const t = i / 5; c.moveTo(s * (5 + t * 4), -2); c.lineTo(s * (8 + t * 16), -6 + a * 12 * (1 - t) + 6); } c.stroke();
  }
  for (const s of [-1, 1]) { limb(c, '#e0b040', 1.4, [[s * 2.5, 8], [s * 3, 13]]); line(c, '#2a1a10', 1, [[s * 3, 13], [s * 1.5, 15]]); line(c, '#2a1a10', 1, [[s * 3, 13], [s * 4.5, 15]]); }
  c.beginPath(); c.moveTo(-3, 8); c.lineTo(0, 14); c.lineTo(3, 8); c.closePath(); paint(c, '#4a3a5a', 1.2);
  E(c, 0, 1.5, 5.6, 7.5); paint(c, LG(c, 0, -6, 0, 9, '#b6a2c8', '#6a5a80', '#3a2e4e'));
  c.beginPath(); for (let i = 0; i <= 10; i++) { const an = Math.PI + i * Math.PI / 10, r = i % 2 ? 6 : 9; c.lineTo(Math.cos(an) * r, -9 + Math.sin(an) * r); } c.lineTo(5, -4); c.lineTo(-5, -4); c.closePath(); paint(c, '#2e2038', 1.4);
  C(c, 0, -8.5, 5); paint(c, RG(c, 0, -8.5, 5, '#e6ecd0', '#b8c4a0', '#6a7a5a'), 1.6);
  c.fillStyle = '#ff3a2a'; C(c, -1.9, -9, 1.1); c.fill(); C(c, 1.9, -9, 1.1); c.fill();
  c.fillStyle = '#3a0a10'; E(c, 0, -6, 1.3, 1); c.fill();
}
function drawSpartoi(c, f) {
  const ph = f * Math.PI / 2, d = Math.sin(ph) * 2.4, bone = '#ece4cf', boneD = '#a89a7a';
  for (const [s, k] of [[-1, d], [1, -d]]) {
    limb(c, bone, 1.8, [[s * 3, 4], [s * 3.6, 10 + k * 0.3], [s * 3.2, 16 + k * 0.5]]);
    C(c, s * 3.6, 10 + k * 0.3, 1.3); paint(c, bone, 1); E(c, s * 3.8, 16.5 + k * 0.5, 2.4, 1.3); paint(c, bone, 1.1);
  }
  E(c, 0, 3.5, 5.2, 2.6); paint(c, bone, 1.4);
  // spear
  c.save(); c.translate(9.5, -2); c.rotate(-Math.PI / 2 + 0.1); artSpear(c, 40); c.restore();
  E(c, 0, -4, 6.4, 6.6); paint(c, '#2b2430', 1.8);
  c.strokeStyle = bone; c.lineWidth = 1.5; c.beginPath();
  for (let i = 0; i < 4; i++) { const y = -8 + i * 2.6; c.moveTo(-5.2 + i * 0.4, y); c.quadraticCurveTo(0, y + 1.6, 5.2 - i * 0.4, y); } c.moveTo(0, -10); c.lineTo(0, 3); c.stroke();
  limb(c, bone, 1.6, [[6, -7], [9.5, -2], [9.5, 2]]);
  C(c, 0, -14, 5.6); paint(c, RG(c, 0, -14, 5.6, '#ffffff', bone, boneD), 1.7);
  c.fillStyle = '#120808'; E(c, -2.1, -14, 1.7, 1.9); c.fill(); E(c, 2.1, -14, 1.7, 1.9); c.fill();
  c.fillStyle = '#ff4a2a'; C(c, -2, -13.8, 0.7); c.fill(); C(c, 2, -13.8, 0.7); c.fill();
  c.fillStyle = '#2a2020'; for (let i = -2; i <= 2; i++) c.fillRect(i * 1.2 - 0.3, -10.3, 0.6, 1.4);
  c.beginPath(); c.moveTo(-6, -14); c.quadraticCurveTo(-6.5, -21, 0, -21.4); c.quadraticCurveTo(6.5, -21, 6, -14); c.lineTo(4, -16.5); c.lineTo(-4, -16.5); c.closePath();
  paint(c, LG(c, -6, -21, 6, -14, '#e8c070', '#a8702a', '#5a3a12'), 1.5);
  c.beginPath(); c.moveTo(-7, -19); c.quadraticCurveTo(0, -29, 7, -19); c.quadraticCurveTo(0, -22.5, -7, -19); c.closePath(); paint(c, LG(c, 0, -28, 0, -19, '#e85a3a', '#8a1a12'), 1.4);
  c.save(); c.translate(-8, 0); artAspis(c, 8.5, 'owl'); c.restore();
}
function drawCentaur(c, f) {
  const ph = f * Math.PI / 2, g = Math.sin(ph) * 0.5, g2 = Math.cos(ph) * 0.5, brown = '#8a5530';
  c.beginPath(); c.moveTo(-16, 0); c.quadraticCurveTo(-26, 2 + g2 * 6, -24, 12 + g * 4); c.quadraticCurveTo(-21, 6, -16, 4); c.closePath(); paint(c, '#2a1810', 1.4);
  const legs = [[-11, g], [-7, -g], [7, g2], [11, -g2]];
  for (const [lx, a] of legs.slice(0, 2)) { limb(c, '#5a3418', 2.6, [[lx, 5], [lx + a * 6, 11], [lx + a * 3, 17]]); E(c, lx + a * 3, 17.5, 1.9, 1.2); paint(c, '#1a100a', 1); }
  E(c, -2, 3, 15, 7.4); paint(c, LG(c, 0, -4, 0, 10, '#c08050', brown, '#4a2a14'));
  for (const [lx, a] of legs.slice(2)) { limb(c, '#6a4020', 2.6, [[lx, 5], [lx + a * 6, 11], [lx + a * 3, 17]]); E(c, lx + a * 3, 17.5, 1.9, 1.2); paint(c, '#1a100a', 1); }
  c.fillStyle = 'rgba(255,230,190,0.35)'; E(c, -4, -0.5, 8, 2); c.fill();
  // human torso
  RR(c, 6, -15, 9, 14, 3.5); paint(c, LG(c, 6, -15, 15, -1, '#f0b888', '#c98d5e', '#8a5530'), 1.8);
  c.save(); c.translate(19, -9); artBow(c, true); c.restore();
  limb(c, '#c98d5e', 2.4, [[13, -12], [18, -9]]);
  C(c, 10.5, -19, 5); paint(c, RG(c, 10.5, -19, 5, '#f4c294', '#c98d5e', '#8a5530'), 1.7);
  c.beginPath(); c.moveTo(5.5, -19); c.quadraticCurveTo(6, -25.5, 11, -24.5); c.quadraticCurveTo(15, -24, 15.5, -21); c.quadraticCurveTo(11, -22, 8, -17); c.quadraticCurveTo(7, -13, 4, -12); c.closePath(); paint(c, '#2a1810', 1.3);
  c.fillStyle = '#1a0e08'; C(c, 13, -19.5, 0.9); c.fill();
  c.beginPath(); c.moveTo(9, -16); c.quadraticCurveTo(11.5, -11, 14, -16); c.closePath(); paint(c, '#3a2414', 1);
}
function drawGigas(c, f) {
  const ph = f * Math.PI / 2, w = Math.sin(ph) * 3, scale = '#5a7a5a', scaleD = '#2a3e2a';
  for (const s of [-1, 1]) {
    limb(c, scale, 6, [[s * 5, 10], [s * 11, 17 + w * s * 0.5], [s * 7, 23], [s * 15 + w, 28]]);
    C(c, s * 15 + w, 28, 3.6); paint(c, '#6a8a6a', 1.4); c.fillStyle = '#ffd84a'; C(c, s * 16 + w, 27.4, 0.8); c.fill();
    c.strokeStyle = scaleD; c.lineWidth = 0.8; c.beginPath(); for (let i = 0; i < 4; i++) { const x = s * (7 + i * 1.6), y = 13 + i * 3.5; c.moveTo(x - 2, y); c.lineTo(x + 2, y + 1); } c.stroke();
  }
  c.beginPath(); c.moveTo(-12, 4); c.lineTo(-14, 13); c.lineTo(14, 13); c.lineTo(12, 4); c.closePath(); paint(c, LG(c, 0, 4, 0, 13, '#8a6a4a', '#4a3020'));
  c.strokeStyle = '#2a180c'; c.lineWidth = 1; c.beginPath(); for (let i = -11; i <= 11; i += 3.5) { c.moveTo(i, 9); c.lineTo(i + 1, 13); } c.stroke();
  c.save(); c.translate(19, -8); c.rotate(0.35 + w * 0.03); artClub(c, 1.5); c.restore();
  c.beginPath(); c.moveTo(-15, -14); c.quadraticCurveTo(-17, 0, -11, 5); c.lineTo(11, 5); c.quadraticCurveTo(17, 0, 15, -14); c.quadraticCurveTo(0, -20, -15, -14); c.closePath();
  paint(c, LG(c, -15, -18, 15, 5, '#a8b8cc', '#7d8aa0', '#4a566a'), 2.2);
  c.strokeStyle = 'rgba(30,40,60,0.5)'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(-8, -9); c.quadraticCurveTo(-3, -5, 0, -9); c.quadraticCurveTo(3, -5, 8, -9); c.moveTo(0, -9); c.lineTo(0, 2); c.moveTo(-5, -2); c.lineTo(5, -2); c.stroke();
  E(c, -17, -6, 4.6, 8.5, 0.2); paint(c, LG(c, -20, -14, -14, 2, '#a8b8cc', '#5a667a'), 2);
  E(c, 17, -8, 4.6, 7.5, -0.4); paint(c, LG(c, 14, -14, 20, 2, '#a8b8cc', '#5a667a'), 2);
  C(c, 0, -22, 7.6); paint(c, RG(c, 0, -22, 7.6, '#c8d4e2', '#7d8aa0', '#3a465a'), 2);
  c.beginPath(); c.moveTo(-5.5, -19); c.quadraticCurveTo(0, -9, 5.5, -19); c.quadraticCurveTo(0, -17, -5.5, -19); c.closePath(); paint(c, '#2a2a3a', 1.2);
  line(c, '#1a1a2a', 1.6, [[-5.5, -25], [-1.5, -23.6]]); line(c, '#1a1a2a', 1.6, [[5.5, -25], [1.5, -23.6]]);
  c.fillStyle = '#ffb02a'; C(c, -3, -22.6, 1.2); c.fill(); C(c, 3, -22.6, 1.2); c.fill();
}
function drawShade(c, f) {
  const ph = f * Math.PI / 2;
  c.beginPath(); c.moveTo(0, -17);
  c.bezierCurveTo(9, -17, 11, -6, 10, 2);
  for (let i = 0; i < 3; i++) { const x = 10 - (i + 1) * 6.6, y = 12 + Math.sin(ph + i * 1.7) * 3 + (i === 1 ? 4 : 0); c.quadraticCurveTo(x + 4, y - 6, x, y); }
  c.bezierCurveTo(-11, -6, -9, -17, 0, -17); c.closePath();
  c.strokeStyle = 'rgba(160,240,255,0.9)'; c.lineWidth = 1.6; c.stroke();
  c.fillStyle = LG(c, 0, -17, 0, 16, 'rgba(170,230,255,0.95)', 'rgba(70,150,200,0.8)', 'rgba(30,60,110,0.1)'); c.fill();
  E(c, 0, -9, 5.4, 6); c.fillStyle = '#081220'; c.fill();
  c.fillStyle = '#9ff6ff'; C(c, -2, -9.5, 1.3); c.fill(); C(c, 2, -9.5, 1.3); c.fill();
  c.strokeStyle = 'rgba(170,230,255,0.85)'; c.lineWidth = 2.2;
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 7, -3); c.quadraticCurveTo(s * 13, 0 + Math.sin(ph) * 2, s * 12, 6); c.stroke(); }
}
function drawCyclops(c, f) {
  const sw = f ? 1.6 : -1.6, skin = '#b58a62';
  for (const s of [-1, 1]) { limb(c, '#a07650', 8, [[s * 9, 18], [s * 11, 30 + (s * sw)], [s * 10, 40 + s * sw * 0.5]]); E(c, s * 10.5, 41 + s * sw * 0.5, 6, 3.2); paint(c, '#5a3a22', 1.8); }
  // fleece loincloth
  c.beginPath(); for (let i = 0; i <= 14; i++) { const x = -20 + i * 40 / 14, y = i % 2 ? 26 : 30; c.lineTo(x, y); } c.lineTo(19, 12); c.lineTo(-19, 12); c.closePath(); paint(c, LG(c, 0, 12, 0, 30, '#fffaf0', '#d8cfbc'), 2);
  // club over shoulder
  c.save(); c.translate(26, -24 + sw); c.rotate(-0.55); c.scale(1.7, 1.9);
  c.beginPath(); c.moveTo(-3, 16); c.lineTo(-7, -14); c.quadraticCurveTo(0, -22, 7, -14); c.lineTo(3, 16); c.closePath(); paint(c, LG(c, -6, 0, 6, 0, '#9a6a3a', '#6a4220', '#3a2210'), 1.4);
  c.fillStyle = '#2a1608'; E(c, -2, -8, 1.8, 1.2); c.fill(); E(c, 3, -2, 1.6, 1.1); c.fill(); E(c, -1, 6, 1.4, 1); c.fill();
  c.restore();
  c.beginPath(); c.moveTo(-22, -16); c.quadraticCurveTo(-26, 4, -18, 14); c.lineTo(18, 14); c.quadraticCurveTo(26, 4, 22, -16); c.quadraticCurveTo(0, -24, -22, -16); c.closePath();
  paint(c, LG(c, -22, -22, 22, 14, '#e2b48a', skin, '#6a4626'), 2.4);
  c.strokeStyle = 'rgba(80,40,20,0.45)'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(-12, -8); c.quadraticCurveTo(-5, -3, 0, -9); c.quadraticCurveTo(5, -3, 12, -8); c.moveTo(0, -9); c.lineTo(0, 10); c.moveTo(-7, 1); c.lineTo(7, 1); c.moveTo(-6, 6); c.lineTo(6, 6); c.stroke();
  E(c, -25, -2, 6, 13, 0.15); paint(c, LG(c, -30, -14, -20, 10, '#d8a87a', '#7a5434'), 2.2);
  C(c, -27, 11, 5); paint(c, skin, 1.8);
  E(c, 24, -12 + sw, 6, 10, -0.6); paint(c, LG(c, 20, -22, 30, 0, '#d8a87a', '#7a5434'), 2.2);
  // head
  for (const s of [-1, 1]) { E(c, s * 17, -36, 3.6, 5); paint(c, skin, 1.8); }
  C(c, 0, -36, 17); paint(c, RG(c, 0, -36, 17, '#f2c8a0', skin, '#7a5434'), 2.4);
  c.fillStyle = '#4a2a14'; c.beginPath(); c.moveTo(-14, -42); c.quadraticCurveTo(0, -48, 14, -42); c.quadraticCurveTo(0, -44, -14, -42); c.fill();
  C(c, 0, -37, 9); paint(c, RG(c, 0, -37, 9, '#ffffff', '#f2e6d8', '#c8a8a0'), 2);
  c.strokeStyle = 'rgba(200,40,40,0.55)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-8, -38); c.lineTo(-5, -37); c.moveTo(8, -35); c.lineTo(5, -36); c.moveTo(-6, -32); c.lineTo(-4, -34); c.stroke();
  c.beginPath(); c.moveTo(-9, -24); c.quadraticCurveTo(0, -18, 9, -24); c.quadraticCurveTo(0, -21.5, -9, -24); c.closePath(); paint(c, '#3a1410', 1.6);
  c.fillStyle = '#fff6e0'; c.beginPath(); c.moveTo(-6, -23); c.lineTo(-4.5, -19.5); c.lineTo(-3, -22.4); c.closePath(); c.fill(); c.beginPath(); c.moveTo(6, -23); c.lineTo(4.5, -19.5); c.lineTo(3, -22.4); c.closePath(); c.fill();
}
function drawMinotaur(c, f) {
  const sw = f ? 1.6 : -1.6, fur = '#4a2c1c', skin = '#8a5a3c';
  for (const s of [-1, 1]) { limb(c, fur, 8, [[s * 8, 16], [s * 11, 27 + s * sw], [s * 9, 38 + s * sw * 0.5]]); E(c, s * 9.5, 39 + s * sw * 0.5, 5, 3); paint(c, '#1a100a', 1.6); }
  c.beginPath(); c.moveTo(-17, 8); c.lineTo(-19, 26); c.lineTo(19, 26); c.lineTo(17, 8); c.closePath(); paint(c, LG(c, 0, 8, 0, 26, '#7a4a28', '#3a2010'), 2);
  c.fillStyle = '#e2b54a'; for (let i = -14; i <= 14; i += 7) { C(c, i, 12, 1.3); c.fill(); C(c, i * 1.08, 21, 1.3); c.fill(); }
  // labrys
  c.save(); c.translate(24, -6 + sw); c.rotate(0.3);
  limb(c, '#6a4220', 3, [[0, 26], [0, -26]]);
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(0, -20); c.quadraticCurveTo(s * 9, -27, s * 15, -30); c.quadraticCurveTo(s * 11, -19, s * 15, -8); c.quadraticCurveTo(s * 9, -11, 0, -14); c.closePath();
    paint(c, LG(c, s * 15, -30, 0, -10, '#ffffff', '#c8ccd6', '#6a6e7a'), 1.8);
  }
  c.restore();
  c.beginPath(); c.moveTo(-20, -14); c.quadraticCurveTo(-24, 2, -16, 10); c.lineTo(16, 10); c.quadraticCurveTo(24, 2, 20, -14); c.quadraticCurveTo(0, -22, -20, -14); c.closePath();
  paint(c, LG(c, -20, -20, 20, 10, '#b88262', skin, '#4a2c1a'), 2.4);
  c.strokeStyle = 'rgba(40,20,10,0.5)'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(-11, -8); c.quadraticCurveTo(-5, -3, 0, -9); c.quadraticCurveTo(5, -3, 11, -8); c.moveTo(0, -9); c.lineTo(0, 8); c.moveTo(-6, 0); c.lineTo(6, 0); c.stroke();
  E(c, -23, -3, 5.6, 12, 0.2); paint(c, LG(c, -27, -14, -18, 10, '#a87252', '#4a2c1a'), 2.2);
  E(c, 22, -8 + sw, 5.6, 10, -0.5); paint(c, LG(c, 18, -18, 26, 0, '#a87252', '#4a2c1a'), 2.2);
  // bull head
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(s * 9, -38); c.bezierCurveTo(s * 22, -38, s * 30, -46, s * 27, -60); c.bezierCurveTo(s * 24, -50, s * 18, -44, s * 8, -43); c.closePath();
    paint(c, LG(c, s * 8, -40, s * 27, -60, '#d8c8a8', '#f8f0e0', '#fffaf0'), 2);
    c.beginPath(); c.moveTo(s * 11, -37); c.lineTo(s * 20, -35); c.lineTo(s * 12, -32); c.closePath(); paint(c, fur, 1.6);
  }
  E(c, 0, -34, 12.5, 14); paint(c, RG(c, 0, -36, 14, '#7a4a32', fur, '#22140c'), 2.4);
  E(c, 0, -24, 8.5, 6.5); paint(c, LG(c, 0, -30, 0, -18, '#9a7262', '#6a4a3a'), 2);
  c.fillStyle = '#1a0a08'; E(c, -3.4, -24, 1.6, 1.2); c.fill(); E(c, 3.4, -24, 1.6, 1.2); c.fill();
  c.strokeStyle = OUT; c.lineWidth = 3.4; c.beginPath(); c.arc(0, -20, 3.6, 0.2, Math.PI - 0.2); c.stroke();
  c.strokeStyle = '#f2c55a'; c.lineWidth = 1.8; c.stroke();
  c.fillStyle = '#ff3020'; E(c, -6.4, -37, 2.2, 1.6, 0.3); c.fill(); E(c, 6.4, -37, 2.2, 1.6, -0.3); c.fill();
  c.fillStyle = '#fff0a0'; C(c, -6.2, -37.3, 0.6); c.fill(); C(c, 6.6, -37.3, 0.6); c.fill();
}
function drawMedusa(c, f) {
  const ph = f * Math.PI / 2;
  // serpent tail
  c.beginPath(); c.moveTo(-14, 6); c.bezierCurveTo(-22, 22, 10, 22, 16, 32); c.bezierCurveTo(20, 40, 4, 44, -12, 40); c.quadraticCurveTo(-22, 38, -26, 34 + Math.sin(ph) * 2);
  c.quadraticCurveTo(-18, 36, -8, 35); c.bezierCurveTo(6, 36, 6, 30, -2, 26); c.bezierCurveTo(-10, 22, 2, 16, 14, 6); c.closePath();
  paint(c, LG(c, -20, 6, 20, 40, '#7ac06a', '#3e7a4a', '#1e4a2a'), 2.4);
  c.strokeStyle = 'rgba(240,230,170,0.55)'; c.lineWidth = 1; c.beginPath(); for (let i = 0; i < 8; i++) { const y = 12 + i * 3.5; c.moveTo(-6 + i, y); c.lineTo(4 + i * 0.5, y + 1); } c.stroke();
  c.fillStyle = 'rgba(10,40,20,0.35)'; for (let i = 0; i < 10; i++) { C(c, -14 + i * 3, 30 + Math.sin(i) * 3, 1.1); c.fill(); }
  // torso
  c.beginPath(); c.moveTo(-12, -14); c.quadraticCurveTo(-15, 0, -13, 8); c.lineTo(13, 8); c.quadraticCurveTo(15, 0, 12, -14); c.quadraticCurveTo(0, -19, -12, -14); c.closePath();
  paint(c, LG(c, -12, -18, 12, 8, '#c4dcb0', '#9ab88a', '#5a7a4a'), 2.2);
  c.beginPath(); c.moveTo(-11, -6); c.quadraticCurveTo(0, -1, 11, -6); c.lineTo(11, 0); c.quadraticCurveTo(0, 4, -11, 0); c.closePath(); paint(c, LG(c, 0, -6, 0, 4, '#f6d580', '#b97d2c'), 1.4);
  c.strokeStyle = '#f2c55a'; c.lineWidth = 1.2; c.beginPath(); c.arc(0, -16, 6, 0.3, Math.PI - 0.3); c.stroke();
  for (const s of [-1, 1]) {
    limb(c, '#9ab88a', 4, [[s * 12, -12], [s * 20, -4], [s * 25, -8 + Math.sin(ph + s) * 2]]);
    for (let k = -1; k <= 1; k++) line(c, '#2a3a20', 1, [[s * 25, -8 + Math.sin(ph + s) * 2], [s * 28, -10 + k * 2.6]]);
  }
  // snake hair
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI * 0.95 + i * Math.PI * 0.9 / 8, w = Math.sin(ph * 1 + i * 1.3) * 4;
    const bx = Math.cos(a) * 9, by = -26 + Math.sin(a) * 9, ex = Math.cos(a) * 21 + Math.sin(a) * w, ey = -26 + Math.sin(a) * 21 - Math.cos(a) * w;
    limb(c, i % 2 ? '#4f9a4a' : '#3e7a3a', 2.6, [[bx, by], [(bx + ex) / 2 + Math.sin(a) * w, (by + ey) / 2 - Math.cos(a) * w], [ex, ey]]);
    E(c, ex, ey, 2.6, 2, a); paint(c, '#5aaa50', 1.2);
    c.fillStyle = '#ff3020'; C(c, ex + Math.cos(a) * 0.8, ey + Math.sin(a) * 0.8, 0.6); c.fill();
  }
  C(c, 0, -26, 9.5); paint(c, RG(c, 0, -26, 9.5, '#d8ecc8', '#9ab88a', '#4a6a3a'), 2.2);
  c.fillStyle = '#fff36a'; E(c, -3.6, -27, 2.2, 1.5, 0.2); c.fill(); E(c, 3.6, -27, 2.2, 1.5, -0.2); c.fill();
  c.fillStyle = '#1a0a08'; c.fillRect(-3.9, -28.2, 0.7, 2.4); c.fillRect(3.3, -28.2, 0.7, 2.4);
  c.beginPath(); c.moveTo(-3.5, -21.5); c.quadraticCurveTo(0, -18.5, 3.5, -21.5); c.closePath(); paint(c, '#4a0a10', 1.2);
  c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-2, -21); c.lineTo(-1.4, -19.2); c.lineTo(-0.8, -20.7); c.closePath(); c.fill(); c.beginPath(); c.moveTo(2, -21); c.lineTo(1.4, -19.2); c.lineTo(0.8, -20.7); c.closePath(); c.fill();
}
function drawAmphora(c) {
  for (const s of [-1, 1]) { limb(c, '#b5582a', 1.8, [[s * 3, -10.5], [s * 8.4, -10], [s * 6.6, -3]]); }
  c.beginPath(); c.moveTo(-3, -13); c.lineTo(-3.2, -9); c.bezierCurveTo(-11, -6, -10, 8, -2.2, 13); c.lineTo(2.2, 13); c.bezierCurveTo(10, 8, 11, -6, 3.2, -9); c.lineTo(3, -13); c.closePath();
  paint(c, LG(c, -9, 0, 9, 0, '#f0a060', '#c8682e', '#7a3614'), 1.8);
  E(c, 0, -13, 4.2, 1.6); paint(c, '#d87a3a', 1.4);
  c.fillStyle = '#1b110c'; c.fillRect(-8.6, -2.5, 17.2, 5);
  c.fillStyle = '#c8682e'; for (let i = -7; i <= 6; i += 3.4) c.fillRect(i, -1.2, 1.8, 2.4);
  c.fillStyle = 'rgba(255,240,210,0.5)'; E(c, -4.5, -4.5, 1.2, 3.5, 0.3); c.fill();
}

/* ---------- Props ---------- */
function drawColumn(c, broken) {
  const top = broken ? -36 : -84;
  c.fillStyle = 'rgba(70,90,40,0.6)'; E(c, 0, 1, 15, 4); c.fill();
  RR(c, -13, -6, 26, 7, 1.5); paint(c, LG(c, -13, 0, 13, 0, '#f6efe2', '#cfc4b0', '#8a7e6a'), 1.6);
  c.beginPath(); c.moveTo(-9, -6);
  if (broken) { c.lineTo(-9.5, top + 4); c.lineTo(-5, top); c.lineTo(-1, top + 6); c.lineTo(3, top - 1); c.lineTo(9.5, top + 5); }
  else { c.lineTo(-8, top + 8); c.lineTo(8, top + 8); }
  c.lineTo(9, -6); c.closePath();
  paint(c, LG(c, -9, 0, 9, 0, '#fffaf0', '#e8dfcc', '#b8ac94', '#8a7e6a'), 1.8);
  c.strokeStyle = 'rgba(110,95,70,0.45)'; c.lineWidth = 0.8; c.beginPath();
  for (let x = -6; x <= 6; x += 3) { c.moveTo(x, -6); c.lineTo(x * 0.95, broken ? top + 6 : top + 8); } c.stroke();
  c.fillStyle = 'rgba(80,110,50,0.55)'; E(c, -5, -9, 4, 2.5); c.fill(); E(c, 4, -7.5, 3, 1.8); c.fill();
  if (!broken) {
    RR(c, -12, top + 2, 24, 6, 2); paint(c, LG(c, -12, 0, 12, 0, '#fffaf0', '#cfc4b0', '#8a7e6a'), 1.6);
    for (const s of [-1, 1]) {
      C(c, s * 11, top + 6, 4.2); paint(c, '#ece3d0', 1.5);
      c.strokeStyle = '#8a7e6a'; c.lineWidth = 1; c.beginPath(); c.arc(s * 11, top + 6, 2.2, 0, TAU * 0.8); c.stroke();
    }
    RR(c, -14, top - 2, 28, 4.5, 1); paint(c, LG(c, -14, 0, 14, 0, '#fffaf0', '#d8cdb8', '#8a7e6a'), 1.5);
  }
}
function drawDrum(c) {
  c.fillStyle = 'rgba(60,80,30,0.45)'; E(c, 0, 6, 22, 5); c.fill();
  RR(c, -18, -6, 34, 13, 3); paint(c, LG(c, 0, -6, 0, 7, '#fffaf0', '#d8cdb8', '#8a7e6a'), 1.6);
  c.strokeStyle = 'rgba(110,95,70,0.45)'; c.lineWidth = 0.8; c.beginPath(); for (let y = -3; y <= 4; y += 3) { c.moveTo(-16, y); c.lineTo(15, y); } c.stroke();
  E(c, 16, 0.5, 4, 6.5); paint(c, LG(c, 12, 0, 20, 0, '#f6efe2', '#cfc4b0'), 1.5);
  c.strokeStyle = 'rgba(110,95,70,0.5)'; C(c, 16, 0.5, 2.5); c.stroke();
}
function drawStatue(c) {
  c.fillStyle = 'rgba(60,80,30,0.45)'; E(c, 0, 1, 17, 4.5); c.fill();
  RR(c, -14, -16, 28, 17, 2); paint(c, LG(c, -14, 0, 14, 0, '#efe6d4', '#c8bca4', '#7a6e5a'), 1.8);
  c.strokeStyle = 'rgba(110,95,70,0.5)'; c.lineWidth = 1; c.strokeRect(-11, -13, 22, 11);
  const m = LG(c, -10, -70, 10, -16, '#ffffff', '#e2dacb', '#a89c86');
  limb(c, '#e2dacb', 2, [[8, -58], [10, -78]]);
  c.beginPath(); c.moveTo(10, -78); c.lineTo(8.5, -84); c.lineTo(11.5, -84); c.closePath(); paint(c, '#e2dacb', 1.2);
  c.beginPath(); c.moveTo(-6, -16); c.quadraticCurveTo(-9, -36, -6, -52); c.lineTo(6, -52); c.quadraticCurveTo(9, -36, 7, -16); c.closePath(); paint(c, m, 1.8);
  c.strokeStyle = 'rgba(110,95,70,0.5)'; c.lineWidth = 0.8; c.beginPath(); for (let i = -4; i <= 4; i += 2) { c.moveTo(i, -48); c.quadraticCurveTo(i * 1.4, -32, i * 1.2, -17); } c.stroke();
  E(c, 6, -54, 3, 5, -0.5); paint(c, m, 1.5);
  E(c, -7.5, -44, 2.6, 7, 0.15); paint(c, m, 1.5);
  C(c, 0, -60, 5.4); paint(c, RG(c, 0, -60, 5.4, '#ffffff', '#e2dacb', '#9a8e78'), 1.6);
  c.beginPath(); c.moveTo(-5.4, -62); c.quadraticCurveTo(-5, -70, 0, -70); c.quadraticCurveTo(5, -70, 5.4, -62); c.quadraticCurveTo(0, -66, -5.4, -62); c.closePath(); paint(c, '#d8cdb8', 1.4);
  c.fillStyle = 'rgba(80,110,50,0.5)'; E(c, -3, -18, 4, 2); c.fill(); E(c, 5, -40, 1.6, 2.6); c.fill();
}
function drawOlive(c, v) {
  const r = rng(v + 0.17);
  c.fillStyle = 'rgba(20,30,10,0.28)'; E(c, 0, 0, 30, 9); c.fill();
  c.beginPath(); c.moveTo(-5, 0); c.bezierCurveTo(-3, -12, -9, -18, -5, -30); c.lineTo(3, -32); c.bezierCurveTo(1, -20, 7, -12, 5, 0); c.closePath();
  paint(c, LG(c, -6, 0, 6, 0, '#8a7a62', '#5e5040', '#3a3024'), 2);
  line(c, '#3a3024', 1, [[-2, -4], [0, -14], [-2, -24]]);
  const blobs = [];
  for (let i = 0; i < 9; i++) blobs.push([(r() - 0.5) * 50, -46 + (r() - 0.5) * 26, 11 + r() * 7]);
  blobs.sort((a, b) => a[1] - b[1]);
  for (const [x, y, s] of blobs) { C(c, x, y + 3, s); c.fillStyle = '#3e4a24'; c.fill(); }
  for (const [x, y, s] of blobs) { C(c, x, y, s); paint(c, RG(c, x, y, s, '#c8d49a', '#8a9a5a', '#56662e'), 1.6); }
  c.fillStyle = 'rgba(255,255,230,0.5)';
  for (let i = 0; i < 30; i++) { const b = blobs[i % blobs.length]; E(c, b[0] + (r() - 0.5) * b[2], b[1] + (r() - 0.5) * b[2], 1.8, 0.8, r() * 3); c.fill(); }
  c.fillStyle = '#3a2440'; for (let i = 0; i < 9; i++) { const b = blobs[i % blobs.length]; C(c, b[0] + (r() - 0.5) * b[2], b[1] + r() * b[2] * 0.6, 1.2); c.fill(); }
}
function drawCypress(c) {
  c.fillStyle = 'rgba(20,30,10,0.3)'; E(c, 0, 0, 10, 4); c.fill();
  c.fillStyle = '#4a3020'; c.fillRect(-1.5, -6, 3, 6);
  c.beginPath(); c.moveTo(0, -78); c.bezierCurveTo(10, -60, 13, -20, 6, -4); c.lineTo(-6, -4); c.bezierCurveTo(-13, -20, -10, -60, 0, -78); c.closePath();
  paint(c, LG(c, -10, 0, 10, 0, '#4a7a3a', '#2a4a24', '#16281a'), 2);
  c.strokeStyle = 'rgba(140,190,100,0.35)'; c.lineWidth = 1; c.beginPath(); for (let i = 0; i < 12; i++) { const y = -70 + i * 5.5, w = 2 + Math.sin(i * 1.3) * 2; c.moveTo(-w - 2, y); c.quadraticCurveTo(-1, y - 3, w, y + 1); } c.stroke();
}
function drawRock(c, v) {
  const r = rng(v + 0.31), n = 9, pts = [];
  for (let i = 0; i < n; i++) { const a = Math.PI + i * Math.PI / (n - 1), rr = 10 + r() * 6; pts.push([Math.cos(a) * rr * 1.3, Math.sin(a) * rr * 0.9]); }
  c.fillStyle = 'rgba(20,20,10,0.3)'; E(c, 0, 1, 18, 5); c.fill();
  c.beginPath(); c.moveTo(-15, 2); pts.forEach(p => c.lineTo(p[0], p[1])); c.lineTo(15, 2); c.closePath();
  paint(c, LG(c, -10, -14, 10, 2, '#d0cabc', '#9a948a', '#5e5a52'), 1.8);
  c.strokeStyle = 'rgba(50,45,40,0.5)'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(-4, -10); c.lineTo(-1, -4); c.lineTo(-5, 0); c.moveTo(5, -8); c.lineTo(8, -3); c.stroke();
  c.fillStyle = 'rgba(100,130,60,0.6)'; E(c, -6, -1, 5, 2); c.fill();
}
function drawBush(c, v) {
  const r = rng(v + 0.53);
  c.fillStyle = 'rgba(20,30,10,0.28)'; E(c, 0, 1, 18, 5); c.fill();
  const bl = [[-8, -6, 8], [8, -6, 8], [0, -11, 9], [-3, -3, 7], [5, -2, 7]];
  for (const [x, y, s] of bl) { C(c, x, y, s); paint(c, RG(c, x, y, s, '#8ab85a', '#4a7a32', '#24461c'), 1.6); }
  const col = r() < 0.5 ? '#ff8ab0' : '#fff2f6';
  for (let i = 0; i < 9; i++) { c.fillStyle = col; C(c, (r() - 0.5) * 24, -4 - r() * 12, 1.6); c.fill(); }
}
function drawBrazier(c) {
  c.fillStyle = 'rgba(20,20,10,0.35)'; E(c, 0, 1, 11, 3.5); c.fill();
  for (const s of [-1, 0, 1]) limb(c, '#8a5a24', 1.6, [[s * 3, -14], [s * 9, 0]]);
  c.beginPath(); c.moveTo(-10, -20); c.quadraticCurveTo(0, -8, 10, -20); c.closePath(); paint(c, LG(c, 0, -20, 0, -12, '#f6d580', '#a86b25', '#5a3612'), 1.8);
  E(c, 0, -20, 10, 2.6); paint(c, '#2a1408', 1.4);
  c.fillStyle = '#ff7a2a'; E(c, 0, -20.4, 7, 1.6); c.fill();
}

/* ---------- Pickups & missiles ---------- */
const GEM_COLS = [['#bfe6ff', '#4fb3ff', '#1f5fb0'], ['#c6ffd8', '#4fd884', '#1a7a42'], ['#ffd0c8', '#ff5a4a', '#9a1a1a'], ['#f2d6ff', '#c07cff', '#5a2a9a']];
function drawGem(c, t) {
  const [l, m, d] = GEM_COLS[t], s = 1 + t * 0.12;
  c.beginPath(); c.moveTo(0, -8 * s); c.lineTo(5.5 * s, -1.5 * s); c.lineTo(0, 8 * s); c.lineTo(-5.5 * s, -1.5 * s); c.closePath(); paint(c, LG(c, -5, -8, 5, 8, l, m, d), 1.6);
  c.fillStyle = 'rgba(255,255,255,0.75)'; c.beginPath(); c.moveTo(0, -8 * s); c.lineTo(-5.5 * s, -1.5 * s); c.lineTo(0, -1 * s); c.closePath(); c.fill();
  c.fillStyle = 'rgba(0,0,0,0.18)'; c.beginPath(); c.moveTo(0, 8 * s); c.lineTo(5.5 * s, -1.5 * s); c.lineTo(0, -1 * s); c.closePath(); c.fill();
}
function drawCoin(c) {
  C(c, 0, 0, 5.5); paint(c, RG(c, 0, 0, 5.5, '#fff6c0', '#f2c040', '#a8701a'), 1.4);
  c.strokeStyle = '#a8701a'; c.lineWidth = 0.7; C(c, 0, 0, 4); c.stroke();
  c.fillStyle = '#8a5a12'; E(c, 0, 0.6, 1.8, 2.2); c.fill(); c.fillStyle = '#fff2b0'; C(c, -0.7, -0.4, 0.5); c.fill(); C(c, 0.7, -0.4, 0.5); c.fill();
}
function drawFig(c) {
  c.beginPath(); c.moveTo(0, -6); c.bezierCurveTo(7, -4, 8, 7, 0, 7.5); c.bezierCurveTo(-8, 7, -7, -4, 0, -6); c.closePath(); paint(c, RG(c, 0, 1, 8, '#b06aa8', '#6a2a62', '#3a1236'), 1.5);
  c.beginPath(); c.moveTo(0, -6); c.quadraticCurveTo(6, -11, 9, -7); c.quadraticCurveTo(5, -5, 0, -6); c.closePath(); paint(c, '#5a9a3a', 1.2);
  c.fillStyle = 'rgba(255,220,255,0.45)'; E(c, -2.2, -0.5, 1.4, 2.6, 0.3); c.fill();
}
function drawChest(c) {
  RR(c, -14, -6, 28, 15, 2); paint(c, LG(c, 0, -6, 0, 9, '#a8682e', '#6a3a14'), 2);
  c.beginPath(); c.moveTo(-14, -6); c.quadraticCurveTo(-14, -15, 0, -15); c.quadraticCurveTo(14, -15, 14, -6); c.closePath(); paint(c, LG(c, 0, -15, 0, -6, '#c8803a', '#7a4418'), 2);
  c.fillStyle = '#f2c040'; for (const x of [-10, 8]) { c.fillRect(x, -14, 2.4, 23); } c.fillRect(-14, -7, 28, 2.4);
  RR(c, -3, -9, 6, 7, 1); paint(c, '#f6d580', 1.2); c.fillStyle = '#2a1408'; c.fillRect(-0.6, -6.5, 1.2, 2.5);
}
function drawHorn(c) {
  c.beginPath(); c.moveTo(-10, 2); c.quadraticCurveTo(-4, -2, 6, -7); c.lineTo(10, 0); c.quadraticCurveTo(0, 4, -9, 5); c.closePath(); paint(c, LG(c, -10, 0, 10, 0, '#a8701a', '#f6d580', '#fff6c8'), 1.6);
  E(c, 8.4, -3.4, 2.6, 4.4, -0.5); paint(c, '#f2c040', 1.4); c.fillStyle = '#5a3612'; E(c, 8.6, -3.4, 1.4, 2.8, -0.5); c.fill();
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(-3, 0); c.quadraticCurveTo(-6, -8 * s - 2, 0, -9 * s - 1); c.quadraticCurveTo(-2, -4 * s, 1, -3 * s); c.closePath(); paint(c, '#ffffff', 1); }
}
function drawOrb(c) {
  C(c, 0, 0, 8); paint(c, RG(c, 0, 0, 8, '#ffffff', '#8fd0ff', '#2a5ab0'), 1.6);
  c.beginPath(); c.moveTo(1.5, -6); c.lineTo(-3, 0.5); c.lineTo(0.5, 0.5); c.lineTo(-1.5, 6); c.lineTo(3.5, -1); c.lineTo(0, -1); c.closePath(); c.fillStyle = '#fff8c0'; c.fill(); c.strokeStyle = '#a8701a'; c.lineWidth = 0.7; c.stroke();
}
function drawBoulder(c) {
  c.beginPath(); for (let i = 0; i < 10; i++) { const a = i * TAU / 10, r = 11 + Math.sin(i * 2.7) * 2; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath();
  paint(c, RG(c, 0, 0, 13, '#c8c0b0', '#8a8278', '#4a4640'), 2);
  c.strokeStyle = 'rgba(40,36,30,0.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-5, -4); c.lineTo(0, 1); c.lineTo(6, -2); c.moveTo(-3, 6); c.lineTo(1, 3); c.stroke();
}
function drawVenom(c) {
  E(c, 0, 0, 7, 5.5); paint(c, RG(c, 0, 0, 7, '#e8ffb0', '#7ad040', '#2a6a1a'), 1.4);
  c.fillStyle = 'rgba(255,255,255,0.7)'; E(c, -2.4, -1.6, 1.8, 1.1, -0.4); c.fill();
}
function softDot(size, rgb) {
  return mk(size, size, size / 2, size / 2, c => {
    const g = c.createRadialGradient(0, 0, 0, 0, 0, size / 2);
    g.addColorStop(0, 'rgba(' + rgb + ',1)'); g.addColorStop(0.35, 'rgba(' + rgb + ',0.55)'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
    c.fillStyle = g; c.fillRect(-size / 2, -size / 2, size, size);
  }, 1);
}

/* ---------- Build all sprites ---------- */
const SPR = {};
function buildSprites() {
  for (const k in HERO_LOOK) SPR['hero_' + k] = [0, 1, 2, 3].map(f => mk(48, 68, 24, 38, c => drawHero(c, k, f)));
  SPR.satyr = [0, 1, 2, 3].map(f => mk(40, 54, 20, 32, c => drawSatyr(c, f)));
  SPR.harpy = [0, 1, 2, 3].map(f => mk(60, 44, 30, 24, c => drawHarpy(c, f)));
  SPR.spartoi = [0, 1, 2, 3].map(f => mk(44, 60, 22, 34, c => drawSpartoi(c, f)));
  SPR.centaur = [0, 1, 2, 3].map(f => mk(64, 54, 32, 30, c => drawCentaur(c, f)));
  SPR.gigas = [0, 1, 2, 3].map(f => mk(72, 72, 34, 40, c => drawGigas(c, f)));
  SPR.shade = [0, 1, 2, 3].map(f => mk(36, 40, 18, 20, c => drawShade(c, f)));
  SPR.cyclops = [0, 1].map(f => mk(110, 112, 52, 64, c => drawCyclops(c, f)));
  SPR.minotaur = [0, 1].map(f => mk(104, 112, 50, 68, c => drawMinotaur(c, f)));
  SPR.medusa = [0, 1, 2, 3].map(f => mk(96, 96, 48, 52, c => drawMedusa(c, f)));
  SPR.amphora = [mk(26, 32, 13, 16, drawAmphora)];
  SPR.column = mk(34, 96, 17, 92, c => drawColumn(c, false));
  SPR.columnBroken = mk(34, 50, 17, 46, c => drawColumn(c, true));
  SPR.drum = mk(48, 22, 24, 12, drawDrum);
  SPR.statue = mk(34, 92, 17, 88, drawStatue);
  SPR.olive = [0, 1, 2].map(v => mk(92, 88, 46, 80, c => drawOlive(c, v)));
  SPR.cypress = mk(30, 84, 15, 80, drawCypress);
  SPR.rock = [0, 1, 2].map(v => mk(40, 24, 20, 18, c => drawRock(c, v)));
  SPR.bush = [0, 1].map(v => mk(40, 30, 20, 22, c => drawBush(c, v)));
  SPR.brazier = mk(26, 28, 13, 24, drawBrazier);
  SPR.gem = [0, 1, 2, 3].map(t => mk(18, 24, 9, 12, c => drawGem(c, t)));
  SPR.coin = mk(14, 14, 7, 7, drawCoin);
  SPR.fig = mk(20, 18, 9, 10, drawFig);
  SPR.chest = mk(34, 30, 17, 17, drawChest);
  SPR.horn = mk(26, 22, 13, 11, drawHorn);
  SPR.orb = mk(20, 20, 10, 10, drawOrb);
  SPR.spear = mk(48, 10, 24, 5, c => artSpear(c, 40));
  SPR.arrow = mk(26, 9, 13, 4.5, c => artArrow(c));
  SPR.arrowE = mk(26, 9, 13, 4.5, c => artArrow(c, true));
  SPR.trident = mk(44, 18, 22, 9, artTrident);
  SPR.aspis = mk(28, 28, 14, 14, c => artAspis(c, 12, 'owl'));
  SPR.boulder = mk(30, 30, 15, 15, drawBoulder);
  SPR.venom = mk(18, 14, 9, 7, drawVenom);
  SPR.flame = mk(24, 36, 12, 25, c => artFlame(c, 0.85));
  SPR.light = softDot(128, '0,0,0');
  SPR.glowWarm = softDot(128, '255,150,60');
  SPR.glowBlue = softDot(128, '120,190,255');
  SPR.glowGreen = softDot(128, '140,255,120');
  SPR.glowGold = softDot(64, '255,215,120');
  SPR.glowCyan = softDot(64, '140,240,255');
}

/* ---------- UI icons (data URLs) ---------- */
const ICON = {};
function icon(key, fn) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'); x.scale(2, 2); x.translate(32, 32); x.lineJoin = 'round'; x.lineCap = 'round'; fn(x);
  ICON[key] = c.toDataURL();
}
function buildIcons() {
  icon('spear', c => { c.rotate(-Math.PI / 4); c.scale(1.25, 1.25); artSpear(c, 38); });
  icon('arrows', c => { for (const a of [-0.35, 0, 0.35]) { c.save(); c.rotate(-Math.PI / 4 + a); c.translate(4, 0); c.scale(1.5, 1.5); artArrow(c); c.restore(); } });
  icon('club', c => { c.rotate(0.6); artClub(c, 1.5); });
  icon('shield', c => artAspis(c, 22, 'owl'));
  icon('bolt', c => {
    c.beginPath(); c.moveTo(6, -24); c.lineTo(-12, 3); c.lineTo(0, 3); c.lineTo(-6, 24); c.lineTo(14, -5); c.lineTo(2, -5); c.lineTo(10, -24); c.closePath();
    c.shadowColor = '#6ac0ff'; c.shadowBlur = 10; paint(c, LG(c, 0, -24, 0, 24, '#ffffff', '#ffe27a', '#e8a22a'), 2.2); c.shadowBlur = 0;
  });
  icon('fire', c => { c.translate(0, 8); artFlame(c, 1.5); });
  icon('trident', c => { c.rotate(-Math.PI / 4); c.scale(1.4, 1.4); artTrident(c); });
  icon('hermes', c => {
    c.beginPath(); c.moveTo(-18, 10); c.quadraticCurveTo(-20, 16, -10, 16); c.lineTo(18, 16); c.quadraticCurveTo(22, 12, 14, 9); c.lineTo(-4, 6); c.quadraticCurveTo(-8, 0, -12, 2); c.closePath(); paint(c, LG(c, 0, 0, 0, 16, '#c8823a', '#6a3a14'), 2);
    line(c, '#f2c55a', 2, [[-12, 4], [-2, 12]]); line(c, '#f2c55a', 2, [[-4, 3], [6, 12]]);
    for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-12, 2); c.quadraticCurveTo(-18 - i * 3, -10 - i * 4, -4 - i * 5, -22 + i * 3); c.quadraticCurveTo(-6, -8, -8, 1); c.closePath(); paint(c, i === 0 ? '#ffffff' : '#e6ecf6', 1.6); }
  });
  icon('ambrosia', c => {
    c.beginPath(); c.moveTo(-20, -8); c.quadraticCurveTo(0, 12, 20, -8); c.closePath(); paint(c, LG(c, 0, -8, 0, 6, '#fff0a8', '#e2a840', '#8a5a1a'), 2);
    E(c, 0, -8, 20, 4); paint(c, RG(c, 0, -8, 20, '#fff8e0', '#ffd27a', '#e8902a'), 1.8);
    limb(c, '#d39a3e', 3, [[0, 4], [0, 14]]); E(c, 0, 16, 9, 3); paint(c, '#e2a840', 1.8);
    for (const s of [-1, 1]) { c.beginPath(); c.arc(s * 22, -4, 4, 0, TAU); c.strokeStyle = OUT; c.lineWidth = 4; c.stroke(); c.strokeStyle = '#e2a840'; c.lineWidth = 2; c.stroke(); }
  });
  icon('armor', c => {
    c.beginPath(); c.moveTo(-16, -18); c.quadraticCurveTo(-8, -14, 0, -16); c.quadraticCurveTo(8, -14, 16, -18); c.lineTo(18, -4); c.quadraticCurveTo(14, 12, 12, 20); c.lineTo(-12, 20); c.quadraticCurveTo(-14, 12, -18, -4); c.closePath();
    paint(c, LG(c, -18, -18, 18, 20, '#fff0b0', '#d9a040', '#7a4a17'), 2.2);
    c.strokeStyle = 'rgba(80,40,10,0.55)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, -12); c.lineTo(0, 16); c.moveTo(-10, -4); c.quadraticCurveTo(-4, 0, 0, -5); c.quadraticCurveTo(4, 0, 10, -4); c.moveTo(-8, 8); c.quadraticCurveTo(0, 12, 8, 8); c.stroke();
  });
  icon('ares', c => {
    c.scale(1.8, 1.8); c.translate(0, 14);
    c.beginPath(); c.moveTo(-7.6, -13); c.quadraticCurveTo(-8.6, -23.5, 0, -24); c.quadraticCurveTo(8.6, -23.5, 7.6, -13); c.lineTo(7, -6); c.lineTo(3.6, -7); c.lineTo(3, -13.6); c.lineTo(-3, -13.6); c.lineTo(-3.6, -7); c.lineTo(-7, -6); c.closePath();
    paint(c, LG(c, -8, -24, 8, -6, '#fff0b0', '#d9a040', '#7a4a17'), 1.4);
    c.fillStyle = '#1a0e08'; c.fillRect(-6.2, -17, 4.4, 2.2); c.fillRect(1.8, -17, 4.4, 2.2);
    c.beginPath(); c.moveTo(-10, -21); c.quadraticCurveTo(0, -35, 10, -21); c.quadraticCurveTo(0, -26, -10, -21); c.closePath(); paint(c, LG(c, 0, -33, 0, -21, '#ff8a5a', '#d8352a', '#6a1010'), 1.4);
  });
  icon('kronos', c => {
    for (const y of [-20, 20]) { RR(c, -16, y - 3, 32, 6, 2); paint(c, LG(c, -16, 0, 16, 0, '#fff0b0', '#d9a040', '#7a4a17'), 1.8); }
    c.beginPath(); c.moveTo(-11, -17); c.quadraticCurveTo(-10, -2, -2, 0); c.quadraticCurveTo(-10, 2, -11, 17); c.lineTo(11, 17); c.quadraticCurveTo(10, 2, 2, 0); c.quadraticCurveTo(10, -2, 11, -17); c.closePath();
    paint(c, 'rgba(210,235,255,0.55)', 1.8);
    c.fillStyle = '#f2c55a'; c.beginPath(); c.moveTo(-6, -10); c.lineTo(6, -10); c.lineTo(0, -1); c.closePath(); c.fill(); c.beginPath(); c.moveTo(-9, 16); c.quadraticCurveTo(0, 6, 9, 16); c.closePath(); c.fill();
    for (const x of [-15, 15]) limb(c, '#a86b25', 2.2, [[x, -17], [x, 17]]);
  });
  icon('fleece', c => {
    limb(c, '#6a4a2a', 2.4, [[-20, -18], [20, -18]]);
    c.beginPath(); c.moveTo(-14, -18); for (let i = 0; i <= 8; i++) { const x = -14 + i * 3.5; c.lineTo(x, -18 + (i % 2 ? 2 : 0)); }
    c.lineTo(16, 4); for (let i = 0; i < 6; i++) { const x = 16 - i * 6; c.quadraticCurveTo(x - 3, 22 - (i % 2) * 4, x - 6, 14 + (i % 2) * 4); } c.closePath();
    paint(c, LG(c, -14, -18, 16, 20, '#fff6c0', '#f2c040', '#a8701a'), 2);
    c.strokeStyle = 'rgba(140,90,20,0.6)'; c.lineWidth = 1.2; for (let i = 0; i < 7; i++) { c.beginPath(); c.arc(-9 + (i % 4) * 7, -8 + Math.floor(i / 4) * 10, 3, 0, Math.PI * 1.5); c.stroke(); }
  });
  icon('owl', c => {
    E(c, 0, 4, 16, 19); paint(c, LG(c, 0, -15, 0, 23, '#c8a888', '#8a6a4a', '#4a3424'), 2);
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 6, -12); c.lineTo(s * 14, -22); c.lineTo(s * 15, -8); c.closePath(); paint(c, '#8a6a4a', 1.6); }
    for (const s of [-1, 1]) { C(c, s * 7, -4, 7); paint(c, '#f6ecd8', 1.6); C(c, s * 7, -4, 4); c.fillStyle = '#f2b02a'; c.fill(); C(c, s * 7, -4, 2.2); c.fillStyle = '#1a0e08'; c.fill(); }
    c.beginPath(); c.moveTo(-2.5, 2); c.lineTo(0, 8); c.lineTo(2.5, 2); c.closePath(); paint(c, '#e8a22a', 1.2);
    c.strokeStyle = 'rgba(60,40,20,0.6)'; c.lineWidth = 1.2; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(0, 12 + i * 4, 6 - i, 0.3, Math.PI - 0.3); c.stroke(); }
  });
  icon('coin', c => { c.scale(4, 4); drawCoin(c); });
  icon('fates', c => {
    limb(c, '#8a5a2b', 3, [[0, -24], [0, 24]]);
    E(c, 0, 2, 13, 16); paint(c, LG(c, -13, 0, 13, 0, '#fff6c8', '#f2c040', '#a8701a'), 2);
    c.strokeStyle = 'rgba(140,90,20,0.6)'; c.lineWidth = 1.2; for (let y = -10; y <= 14; y += 4) { c.beginPath(); c.moveTo(-12 + Math.abs(y) * 0.2, y); c.quadraticCurveTo(0, y + 3, 12 - Math.abs(y) * 0.2, y); c.stroke(); }
    c.strokeStyle = '#ffe27a'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(12, 0); c.bezierCurveTo(24, 4, 18, 18, 26, 24); c.stroke();
    C(c, 0, 24, 5); paint(c, '#a86b25', 1.6);
  });
  icon('phoenix', c => {
    c.rotate(0.5);
    c.beginPath(); c.moveTo(0, 26); c.quadraticCurveTo(-4, 0, 0, -26); c.quadraticCurveTo(16, -8, 4, 26); c.closePath(); paint(c, LG(c, 0, -26, 0, 26, '#fff6c8', '#ffb02a', '#e84a1a', '#8a1a10'), 2);
    c.strokeStyle = 'rgba(120,20,10,0.55)'; c.lineWidth = 1.2; c.beginPath(); for (let i = 0; i < 7; i++) { const y = -18 + i * 6; c.moveTo(1, y); c.lineTo(9 - i * 0.4, y - 5); } c.stroke();
    limb(c, '#8a2a10', 1.6, [[1, 26], [0.5, -20]]);
  });
  icon('skull', c => {
    c.beginPath(); c.arc(0, -4, 16, Math.PI * 0.85, Math.PI * 0.15); c.lineTo(9, 14); c.lineTo(-9, 14); c.closePath(); paint(c, RG(c, 0, -4, 18, '#ffffff', '#ece4cf', '#a89a7a'), 2.4);
    c.fillStyle = '#1a0e08'; E(c, -6.5, -3, 5, 5.5); c.fill(); E(c, 6.5, -3, 5, 5.5); c.fill();
    c.beginPath(); c.moveTo(0, 3); c.lineTo(-2.5, 8); c.lineTo(2.5, 8); c.closePath(); c.fill();
    for (let i = -1; i <= 1; i++) c.fillRect(i * 4.5 - 1, 10, 2, 4);
  });
  icon('heart', c => {
    c.beginPath(); c.moveTo(0, 20); c.bezierCurveTo(-26, 2, -16, -22, 0, -8); c.bezierCurveTo(16, -22, 26, 2, 0, 20); c.closePath(); paint(c, RG(c, 0, -2, 22, '#ff9a8a', '#d8352a', '#7a1010'), 2.4);
  });
  icon('speed', c => { c.scale(1, 1); for (let i = 0; i < 3; i++) limb(c, '#9fd6ff', 3, [[-20 + i * 4, -10 + i * 10], [6 + i * 4, -10 + i * 10]]); c.beginPath(); c.moveTo(6, -18); c.lineTo(22, 0); c.lineTo(6, 18); c.closePath(); paint(c, LG(c, 0, -18, 0, 18, '#e6f4ff', '#6ab0f0'), 2); });
  icon('sword', c => { c.rotate(Math.PI / 4); c.beginPath(); c.moveTo(-3, 8); c.lineTo(-3, -20); c.lineTo(0, -26); c.lineTo(3, -20); c.lineTo(3, 8); c.closePath(); paint(c, LG(c, -3, 0, 3, 0, '#ffffff', '#b8c6dc', '#6a7a96'), 2); RR(c, -10, 8, 20, 4, 1.5); paint(c, '#d9a040', 1.6); limb(c, '#6a3a14', 3.4, [[0, 12], [0, 22]]); });
  icon('clock', c => { C(c, 0, 0, 20); paint(c, RG(c, 0, 0, 20, '#ffffff', '#efe6d4', '#a89c86'), 2.4); line(c, OUT, 3, [[0, 0], [0, -13]]); line(c, OUT, 3, [[0, 0], [9, 4]]); C(c, 0, 0, 2.2); c.fillStyle = OUT; c.fill(); });
  icon('star', c => { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 9 : 22; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); paint(c, LG(c, 0, -22, 0, 20, '#fff6c8', '#f2c040', '#a8701a'), 2.2); });
  icon('crown', c => { c.beginPath(); c.moveTo(-20, 14); c.lineTo(-22, -10); c.lineTo(-10, 0); c.lineTo(0, -16); c.lineTo(10, 0); c.lineTo(22, -10); c.lineTo(20, 14); c.closePath(); paint(c, LG(c, 0, -16, 0, 14, '#fff6c8', '#f2c040', '#a8701a'), 2.2); c.fillStyle = '#d8352a'; C(c, 0, 6, 3); c.fill(); });
}
function spriteURL(s, w, h, fit, post) {
  const c = document.createElement('canvas'), k = 2; c.width = w * k; c.height = h * k;
  const x = c.getContext('2d'); const sc = Math.min(w / s.w, h / s.h) * (fit || 0.92);
  x.scale(k, k); x.translate(w / 2, h / 2); x.scale(sc, sc);
  x.drawImage(s.c, -s.w / 2, -s.h / 2, s.w, s.h);
  if (post) { x.translate(s.ax - s.w / 2, s.ay - s.h / 2); post(x); }
  return c.toDataURL();
}
