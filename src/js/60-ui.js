/* ============================================================
   UI: screens, HUD, input, loop, boot
   ============================================================ */
const SCREENS = ['title', 'heroes', 'temple', 'records', 'settings', 'howto', 'levelup', 'pause', 'confirm', 'over'];
const PORTRAIT = {}, BEAST = {};
let current = null, navStack = [], selHero = SAVE.hero, lastT = performance.now();

function show(name) { for (const s of SCREENS) $('scr-' + s).hidden = s !== name; current = name; }
function open(name) {
  if (name === 'heroes') renderHeroes();
  else if (name === 'temple') renderTemple();
  else if (name === 'records') renderRecords();
  else if (name === 'settings') renderSettings();
  else if (name === 'title') renderTitle();
  show(name);
}
function go(name) { navStack.push(current); open(name); }
function back() { open(navStack.pop() || 'title'); }
function fillIcons(root) { root.querySelectorAll('img[data-icon]').forEach(img => { img.src = ICON[img.dataset.icon]; }); }
function updateGold() { document.querySelectorAll('.goldTotal').forEach(el => { el.textContent = num(SAVE.gold); }); }
const pips = (lv, max) => '<span class="pips">' + Array.from({ length: max }, (_, i) => '<i class="' + (i < lv ? 'on' : '') + '"></i>').join('') + '</span>';
const coinImg = () => '<img src="' + ICON.coin + '" alt="">';

let confirmPrev = null, confirmYes = null;
function confirmDialog(title, textStr, yes, onYes) {
  confirmPrev = current; confirmYes = onYes;
  $('cfTitle').textContent = title; $('cfText').textContent = textStr; $('cfYes').textContent = yes;
  show('confirm');
}

/* ---------- Title ---------- */
function renderTitle() {
  updateGold();
  const r = SAVE.rec;
  $('titleFoot').textContent = r.runs ? 'Best run ' + fmt(r.bestTime) + ' · ' + r.wins + (r.wins === 1 ? ' victory' : ' victories') : 'Ten minutes. One hero. Every monster in Greece.';
}

/* ---------- Heroes ---------- */
function renderHeroes() {
  updateGold();
  const g = $('heroGrid'); g.innerHTML = '';
  for (const k in HEROES) {
    const h = HEROES[k], owned = SAVE.heroes[k];
    const b = document.createElement('button');
    b.className = 'hero-card' + (k === selHero ? ' sel' : '') + (owned ? '' : ' locked');
    b.innerHTML = '<img src="' + PORTRAIT[k] + '" alt=""><span class="hc-name">' + h.name + '</span>' + (owned ? '' : '<span class="hc-price">' + coinImg() + num(h.cost) + '</span>');
    b.addEventListener('click', () => { selHero = k; renderHeroes(); });
    g.appendChild(b);
  }
  const h = HEROES[selHero], wk = h.weapon;
  const bar = (label, v, max) => '<div class="stat"><span>' + label + '</span><div class="stat-track"><i style="width:' + Math.round(clamp(v / max, 0.1, 1) * 100) + '%"></i></div></div>';
  $('heroDetail').innerHTML =
    '<div class="hd-top"><span class="hd-name">' + h.name + '</span><span class="hd-title">' + h.title + '</span></div>' +
    '<p class="hd-perk">' + h.perk + '</p>' +
    '<div class="hd-stats">' + bar('Health', h.hp, 140) + bar('Speed', h.speed, 1.16) + bar('Damage', h.dmg, 1.15) + '</div>' +
    '<div class="hd-weapon"><span class="medal"><img src="' + ICON[wk] + '" alt=""></span><div><b>' + WEAPONS[wk].name + '</b><span>' + WEAPONS[wk].info[0] + '</span></div></div>';
  const btn = $('heroGo'), owned = SAVE.heroes[selHero];
  if (owned) { btn.textContent = 'Begin'; btn.disabled = false; }
  else if (SAVE.gold >= h.cost) { btn.innerHTML = 'Unlock ' + coinImg() + num(h.cost); btn.disabled = false; }
  else { btn.innerHTML = 'Needs ' + coinImg() + num(h.cost); btn.disabled = true; }
}
function heroGo() {
  const h = HEROES[selHero];
  if (SAVE.heroes[selHero]) { SAVE.hero = selHero; persist(); startRun(); return; }
  if (SAVE.gold < h.cost) return;
  SAVE.gold -= h.cost; SAVE.heroes[selHero] = true; persist(); audio.buy();
  renderHeroes();
}

/* ---------- Temple ---------- */
function renderTemple() {
  updateGold();
  const g = $('metaGrid'); g.innerHTML = '';
  for (const k in META) {
    const m = META[k], lv = SAVE.meta[k] || 0, maxed = lv >= m.max, cost = metaCost(k);
    const d = document.createElement('div'); d.className = 'meta-card' + (maxed ? ' maxed' : ''); d.id = 'meta-' + k;
    d.innerHTML = '<span class="medal"><img src="' + ICON[m.icon] + '" alt=""></span><div class="mc-body"><b>' + m.name + '</b><span>' + m.desc + '</span>' + pips(lv, m.max) + '</div>';
    const b = document.createElement('button');
    b.className = 'btn small' + (maxed ? ' ghost' : ' primary');
    b.innerHTML = maxed ? 'Max' : coinImg() + num(cost);
    b.disabled = maxed || SAVE.gold < cost;
    b.setAttribute('aria-label', maxed ? m.name + ' fully upgraded' : 'Buy ' + m.name + ' for ' + cost + ' gold');
    b.addEventListener('click', () => {
      if (SAVE.gold < cost || maxed) return;
      SAVE.gold -= cost; SAVE.meta[k] = lv + 1; persist(); audio.buy();
      renderTemple(); const c = $('meta-' + k); if (c) c.classList.add('flash');
    });
    d.appendChild(b); g.appendChild(d);
  }
}

/* ---------- Records ---------- */
function renderRecords() {
  const r = SAVE.rec;
  const rows = [['clock', 'Longest survival', fmt(r.bestTime)], ['skull', 'Most kills in a run', num(r.bestKills)], ['star', 'Highest level', r.bestLevel],
    ['crown', 'Victories', r.wins], ['sword', 'Titans slain', r.bosses], ['skull', 'Monsters slain', num(r.totalKills)],
    ['ares', 'Runs played', r.runs], ['coin', 'Gold earned', num(r.goldEarned)], ['kronos', 'Time on Olympus', fmt(r.playTime).replace(':', 'm ') + 's']];
  $('recList').innerHTML = rows.map(([i, l, v]) => '<div class="rec"><img src="' + ICON[i] + '" alt=""><span>' + l + '</span><b>' + v + '</b></div>').join('');
}

/* ---------- Settings ---------- */
function renderSettings() {
  const s = SAVE.settings;
  $('setMusic').value = Math.round(s.music * 100); $('setSfx').value = Math.round(s.sfx * 100);
  $('setVib').checked = s.vibration; $('setShake').checked = s.shake; $('setNums').checked = s.numbers;
  document.querySelectorAll('#setQuality button').forEach(b => b.classList.toggle('on', b.dataset.q === s.quality));
}
function bindSettings() {
  const s = () => SAVE.settings;
  $('setMusic').addEventListener('input', e => { s().music = e.target.value / 100; audio.setVolumes(); persist(); });
  $('setSfx').addEventListener('input', e => { s().sfx = e.target.value / 100; audio.setVolumes(); persist(); });
  $('setSfx').addEventListener('change', () => audio.coin());
  $('setVib').addEventListener('change', e => { s().vibration = e.target.checked; persist(); if (e.target.checked) { try { navigator.vibrate && navigator.vibrate(40); } catch (er) {} } });
  $('setShake').addEventListener('change', e => { s().shake = e.target.checked; persist(); });
  $('setNums').addEventListener('change', e => { s().numbers = e.target.checked; persist(); });
  document.querySelectorAll('#setQuality button').forEach(b => b.addEventListener('click', () => { s().quality = b.dataset.q; persist(); renderSettings(); }));
  $('resetBtn').addEventListener('click', () => confirmDialog('Reset progress?', 'This erases your gold, heroes, Temple blessings and records. It cannot be undone.', 'Erase', () => {
    const keep = SAVE.settings; SAVE = defaultSave(); SAVE.settings = keep; persist(); selHero = 'achilles'; navStack = []; toMenu();
  }));
}

/* ---------- How to ---------- */
function renderBestiary() {
  $('bestiary').innerHTML = Object.keys(ED).filter(k => !ED[k].prop).map(k => {
    const d = ED[k];
    return '<div class="beast' + (d.boss ? ' boss' : '') + '"><img src="' + BEAST[k] + '" alt=""><b>' + d.name + (d.title ? ' ' + d.title : '') + '</b><span>' + d.lore + '</span></div>';
  }).join('');
}

/* ---------- HUD & announcements ---------- */
const hc = {};
function setT(id, v) { v = String(v); if (hc[id] !== v) { hc[id] = v; $(id).textContent = v; } }
function updateHud() {
  if (!G || G.demo || G.state === 'over') return;
  const P = G.P;
  setT('hLvl', P.lvl); setT('hTime', fmt(Math.min(G.t, GAME_LEN))); setT('hKills', num(P.kills)); setT('hGold', num(G.gold));
  const xs = (G.dawnT >= 0 ? 1 : Math.min(1, P.xp / P.next)).toFixed(3);
  if (hc.xp !== xs) { hc.xp = xs; $('hXp').style.transform = 'scaleX(' + xs + ')'; }
  const key = JSON.stringify([P.w, P.p]);
  if (hc.slots !== key) {
    hc.slots = key;
    $('hSlots').innerHTML = Object.keys(P.w).map(k => '<span class="slot"><img src="' + ICON[k] + '" alt=""><i>' + P.w[k] + '</i></span>').join('') +
      Object.keys(P.p).map(k => '<span class="slot passive"><img src="' + ICON[k] + '" alt=""><i>' + P.p[k] + '</i></span>').join('');
  }
  const boss = G.E.find(e => e.boss && !e.dead);
  $('bossbar').hidden = !boss;
  if (boss) {
    setT('bossName', ED[boss.type].name);
    const bs = Math.max(0, boss.hp / boss.maxHp).toFixed(3);
    if (hc.boss !== bs) { hc.boss = bs; $('bossFill').style.transform = 'scaleX(' + bs + ')'; }
  }
}
function banner(title, eyebrow, boss) {
  const b = $('banner');
  $('bannerTitle').textContent = title; $('bannerEyebrow').textContent = eyebrow || '';
  b.classList.toggle('boss', !!boss); b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
}
function bossBanner(name, title) { banner(name + ' ' + title, 'A titan approaches', true); }
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.remove('show'); void t.offsetWidth; t.classList.add('show'); }
function clearAnnouncements() { $('banner').classList.remove('show'); $('toast').classList.remove('show'); }
let hintTimer = 0;
function hideHint() { $('hint').hidden = true; clearTimeout(hintTimer); }

/* ---------- Run flow ---------- */
function startRun() {
  audio.init();
  newRun(SAVE.hero, false); render.warm = false;
  for (const k in hc) delete hc[k];
  navStack = []; show(null);
  $('hud').hidden = false; $('bossbar').hidden = true;
  $('hint').hidden = false; clearTimeout(hintTimer); hintTimer = setTimeout(hideHint, 7000);
  audio.music.intensity = 1;
  banner(HEROES[G.hero].name, 'Survive until dawn');
  wake();
}
function toMenu() {
  newRun(SAVE.hero, true); render.warm = false;
  $('hud').hidden = true; hideHint(); clearAnnouncements();
  navStack = []; open('title');
  audio.music.intensity = 0;
  releaseWake();
}
function resume() { G.state = 'play'; show(null); $('hud').hidden = false; lastT = performance.now(); }
function openPause() {
  if (!G || G.state !== 'play') return;
  G.state = 'pause'; joyRelease(); keys.clear();
  const P = G.P;
  $('pauseStats').innerHTML = [['Time', fmt(G.t)], ['Level', P.lvl], ['Kills', num(P.kills)], ['Gold', num(G.gold)]].map(([l, v]) => '<div><b>' + v + '</b><span>' + l + '</span></div>').join('');
  $('pauseInv').innerHTML = Object.keys(P.w).map(k => '<div class="inv-item"><span class="medal"><img src="' + ICON[k] + '" alt=""></span><div>' + WEAPONS[k].short + pips(P.w[k], 5) + '</div></div>').join('') +
    Object.keys(P.p).map(k => '<div class="inv-item"><span class="medal"><img src="' + ICON[k] + '" alt=""></span><div>' + PASSIVES[k].name + pips(P.p[k], 5) + '</div></div>').join('');
  navStack = []; show('pause');
}
function openLevelUp() {
  G.state = 'levelup'; G.pendingLv--; joyRelease();
  const chest = G.chestLv > 0; if (chest) G.chestLv--;
  audio.level(); vibrate(20);
  burst(G.P.x, G.P.y, 24, '#ffe08a', 180, 0.7, 2.2, { add: true, up: 30 });
  $('luEyebrow').textContent = chest ? 'Gift of the Gods' : 'Level ' + G.P.lvl;
  renderOptions(buildOptions());
  show('levelup');
}
function renderOptions(opts) {
  const box = $('luCards'); box.innerHTML = '';
  for (const o of opts) {
    let ic, name, tag, desc;
    if (o.t === 'w') { const w = WEAPONS[o.k]; ic = ICON[o.k]; name = w.name; desc = w.info[o.lv]; tag = o.lv ? pips(o.lv + 1, 5) + ' Level ' + (o.lv + 1) : '<span class="new">New weapon</span>'; }
    else if (o.t === 'p') { const p = PASSIVES[o.k]; ic = ICON[o.k]; name = p.name; desc = p.info; tag = o.lv ? pips(o.lv + 1, 5) + ' Level ' + (o.lv + 1) : '<span class="new">New blessing</span>'; }
    else if (o.t === 'heal') { ic = ICON.ambrosia; name = 'Nectar'; desc = 'Restore 50 health.'; tag = 'Heal'; }
    else { ic = ICON.coin; name = 'Offering'; desc = 'Gain 50 gold.'; tag = 'Gold'; }
    const b = document.createElement('button'); b.className = 'card';
    b.innerHTML = '<span class="medal"><img src="' + ic + '" alt=""></span><span class="c-body"><span class="c-tag">' + tag + '</span><span class="c-name">' + name + '</span><span class="c-desc">' + desc + '</span></span>';
    b.addEventListener('click', () => { audio.pickCard(); applyOption(o); afterChoice(); });
    box.appendChild(b);
  }
  // a finger that was steering should not pick a card by accident
  box.classList.add('locked'); setTimeout(() => box.classList.remove('locked'), 450);
  const rr = $('luReroll'); rr.textContent = 'Reroll · ' + G.rerolls; rr.disabled = G.rerolls <= 0;
}
function afterChoice() { if (G.pendingLv > 0) openLevelUp(); else resume(); }

function endRun(won, abandoned) {
  G.state = 'over'; joyRelease(); keys.clear(); audio.music.intensity = 0;
  const P = G.P, mult = MD.gold;
  const collected = Math.floor(G.gold);
  const survival = abandoned ? 0 : Math.floor(Math.min(G.t, GAME_LEN) / 4 * mult);
  const bossB = abandoned ? 0 : Math.round(G.bossesSlain * 80 * mult);
  const winB = won ? Math.round(300 * mult) : 0;
  const total = collected + survival + bossB + winB;
  const r = SAVE.rec, badges = [];
  if (r.runs > 0 && G.t > r.bestTime + 0.5) badges.push('New best time');
  if (r.runs > 0 && P.kills > r.bestKills) badges.push('Most kills');
  if (r.runs > 0 && P.lvl > r.bestLevel) badges.push('Highest level');
  if (won && r.wins === 0) badges.push('First victory');
  r.bestTime = Math.max(r.bestTime, Math.min(G.t, GAME_LEN)); r.bestKills = Math.max(r.bestKills, P.kills); r.bestLevel = Math.max(r.bestLevel, P.lvl);
  r.totalKills += P.kills; r.runs++; if (won) r.wins++; r.bosses += G.bossesSlain; r.goldEarned += total; r.playTime += G.t;
  SAVE.gold += total; persist();
  if (!won) audio.defeat();
  const scr = $('scr-over');
  scr.classList.toggle('lost', !won);
  $('resEyebrow').textContent = won ? 'Victory' : abandoned ? 'Run abandoned' : 'Defeat';
  $('resTitle').textContent = won ? 'Dawn Breaks' : 'You Have Fallen';
  $('resSub').textContent = won ? HEROES[G.hero].name + ' held Olympus through the night.' : 'The monsters of Olympus claimed ' + HEROES[G.hero].name + ' at ' + fmt(Math.min(G.t, GAME_LEN)) + '.';
  $('resHero').src = PORTRAIT[G.hero];
  $('resBadges').innerHTML = badges.map(b => '<span>' + b + '</span>').join('');
  $('resStats').innerHTML = [['clock', fmt(Math.min(G.t, GAME_LEN)), 'Time'], ['star', P.lvl, 'Level'], ['skull', num(P.kills), 'Kills'], ['sword', num(G.dmgDealt), 'Damage']]
    .map(([i, v, l]) => '<div><img src="' + ICON[i] + '" alt=""><b>' + v + '</b><span>' + l + '</span></div>').join('');
  const rows = [['Gold collected', collected], ['Survival bonus', survival], ['Titans slain', bossB]];
  if (won) rows.push(['Victory', winB]);
  $('resGold').innerHTML = rows.map(([l, v]) => '<div class="gold-row"><span>' + l + '</span><b>+' + num(v) + '</b></div>').join('') +
    '<div class="gold-row total"><span>Total</span><b>' + coinImg() + '<span id="resTotal">0</span></b></div>';
  const t0 = performance.now(), el = $('resTotal');
  const count = now => { const k = Math.min(1, (now - t0) / 1100); el.textContent = num(total * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(count); else if (total > 0) audio.coin(); };
  requestAnimationFrame(count);
  $('hud').hidden = true; hideHint(); clearAnnouncements();
  navStack = []; show('over');
  releaseWake();
}

/* ---------- Input ---------- */
const joy = { active: false, id: null, ox: 0, oy: 0, dx: 0, dy: 0 };
const JOY_R = 56, keys = new Set();
function joyRelease() { joy.active = false; joy.id = null; joy.dx = joy.dy = 0; }
function inputVector() {
  let x = 0, y = 0;
  if (joy.active) { x = joy.dx; y = joy.dy; }
  if (keys.size) { x += (keys.has('r') ? 1 : 0) - (keys.has('l') ? 1 : 0); y += (keys.has('d') ? 1 : 0) - (keys.has('u') ? 1 : 0); }
  const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
  return [x, y];
}
cv.addEventListener('pointerdown', e => {
  if (!G || G.state !== 'play' || joy.active) return;
  joy.active = true; joy.id = e.pointerId; joy.ox = e.clientX; joy.oy = e.clientY; joy.dx = joy.dy = 0;
  try { cv.setPointerCapture(e.pointerId); } catch (er) {}
  hideHint();
});
cv.addEventListener('pointermove', e => {
  if (!joy.active || e.pointerId !== joy.id) return;
  let dx = e.clientX - joy.ox, dy = e.clientY - joy.oy; const len = Math.hypot(dx, dy);
  if (len > JOY_R) { joy.ox = e.clientX - dx / len * JOY_R; joy.oy = e.clientY - dy / len * JOY_R; dx = dx / len * JOY_R; dy = dy / len * JOY_R; }
  joy.dx = dx / JOY_R; joy.dy = dy / JOY_R;
});
const endJoy = e => { if (e.pointerId === joy.id) joyRelease(); };
cv.addEventListener('pointerup', endJoy);
cv.addEventListener('pointercancel', endJoy);
document.addEventListener('gesturestart', e => e.preventDefault());
const KEYMAP = { ArrowUp: 'u', KeyW: 'u', ArrowDown: 'd', KeyS: 'd', ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r' };
window.addEventListener('keydown', e => {
  if (KEYMAP[e.code] && G && G.state === 'play') { keys.add(KEYMAP[e.code]); hideHint(); e.preventDefault(); }
  if (e.code === 'Escape' || e.code === 'KeyP') {
    if (G && G.state === 'play') openPause();
    else if (G && G.state === 'pause' && current === 'pause') resume();
  }
});
window.addEventListener('keyup', e => { if (KEYMAP[e.code]) keys.delete(KEYMAP[e.code]); });
window.addEventListener('blur', () => keys.clear());
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (G && G.state === 'play') openPause(); audio.suspend(); }
  else { audio.resume(); if (G && G.state !== 'menu' && G.state !== 'over') wake(); }
});
document.addEventListener('pointerdown', () => audio.init(), { passive: true });

let wakeLock = null;
function wake() { try { navigator.wakeLock && navigator.wakeLock.request('screen').then(l => { wakeLock = l; }).catch(() => {}); } catch (e) {} }
function releaseWake() { try { wakeLock && wakeLock.release(); } catch (e) {} wakeLock = null; }

/* ---------- Wiring ---------- */
function initUI() {
  fillIcons(document);
  document.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (!b.classList.contains('card')) audio.click();
    if (b.dataset.go) go(b.dataset.go);
    else if (b.hasAttribute('data-back')) back();
  });
  $('heroGo').addEventListener('click', heroGo);
  $('pauseBtn').addEventListener('click', openPause);
  $('resumeBtn').addEventListener('click', resume);
  $('quitBtn').addEventListener('click', () => confirmDialog('Abandon this run?', 'You keep the gold you have collected, but earn no survival bonus.', 'Abandon', () => endRun(false, true)));
  $('cfNo').addEventListener('click', () => show(confirmPrev));
  $('cfYes').addEventListener('click', () => { const f = confirmYes; confirmYes = null; f && f(); });
  $('luReroll').addEventListener('click', () => { if (G.rerolls > 0) { G.rerolls--; renderOptions(buildOptions()); } });
  $('luSkip').addEventListener('click', afterChoice);
  $('againBtn').addEventListener('click', startRun);
  $('menuBtn').addEventListener('click', toMenu);
  bindSettings();
  renderBestiary();
}

/* ---------- Loop & boot ---------- */
function frame(now) {
  const dt = clamp((now - lastT) / 1000, 0, 0.05); lastT = now;
  try {
    if (G.state === 'play' || G.state === 'menu') update(dt);
    render();
    updateHud();
  } catch (err) { console.error(err); }
  requestAnimationFrame(frame);
}
function boot(data) {
  buildSprites(); buildIcons();
  for (const k in HEROES) PORTRAIT[k] = spriteURL(SPR['hero_' + k][0], 96, 120, 0.95);
  for (const k in ED) if (!ED[k].prop) BEAST[k] = spriteURL(SPR[k][0], 96, 96, 0.95, k === 'cyclops' ? c => { c.fillStyle = '#7a3a1a'; c.beginPath(); c.arc(0, -36, 4.8, 0, TAU); c.fill(); c.fillStyle = '#0e0606'; c.beginPath(); c.arc(0.6, -35.4, 2.6, 0, TAU); c.fill(); } : null);
  resize(); window.addEventListener('resize', resize);
  initUI();
  const snap = data && data.G;
  if (snap && snap.state && !snap.demo && snap.state !== 'over') {
    G = snap; MD = mods(); render.warm = false;
    $('hud').hidden = false; G.state = 'play'; openPause();
  } else toMenu();
  $('loading').hidden = true;
  lastT = performance.now();
  requestAnimationFrame(frame);
}
try { window.claude && window.claude.hot && window.claude.hot.snapshot && window.claude.hot.snapshot(() => ({ G: G && !G.demo && G.state !== 'over' ? G : null })); } catch (e) {}
const HOT = window.claude && window.claude.hot;
if (HOT && HOT.ready) HOT.ready(boot); else setTimeout(() => boot((HOT && HOT.data) || {}), 30);
