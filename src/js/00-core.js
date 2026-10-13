/* ============================================================
   Core: helpers, save data, game content
   ============================================================ */
const TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const $ = id => document.getElementById(id);
const fmt = s => { s = Math.max(0, Math.floor(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
const num = n => Math.floor(n).toLocaleString('en-US');
function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function rng(seed) {
  let a = (seed * 4294967296) >>> 0 || 1;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const GAME_LEN = 600;
const MAXE = 300;

/* ---------- Save data ---------- */
const SAVE_KEY = 'godbusters_save_v2';
const defaultSave = () => ({
  gold: 0,
  meta: {},
  heroes: { achilles: true },
  hero: 'achilles',
  settings: { music: 0.5, sfx: 0.8, vibration: true, shake: true, numbers: true, quality: 'high' },
  rec: { bestTime: 0, bestKills: 0, bestLevel: 0, totalKills: 0, runs: 0, wins: 0, bosses: 0, goldEarned: 0, playTime: 0 },
});
function loadSave() {
  const d = defaultSave();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return { ...d, ...s, settings: { ...d.settings, ...(s.settings || {}) }, rec: { ...d.rec, ...(s.rec || {}) }, meta: s.meta || {}, heroes: { ...d.heroes, ...(s.heroes || {}) } };
    }
  } catch (e) {}
  return d;
}
let SAVE = loadSave();
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) {} }

/* ---------- Heroes ---------- */
const HEROES = {
  achilles: { name: 'Achilles', title: 'The Swift-Footed', hp: 100, speed: 1.08, dmg: 1, pick: 1, weapon: 'spear', cost: 0,
    perk: 'Moves 8% faster than most mortals.' },
  atalanta: { name: 'Atalanta', title: 'Huntress of Arcadia', hp: 80, speed: 1.16, dmg: 1, pick: 1.3, weapon: 'arrows', cost: 400,
    perk: 'Fastest hero. Gathers from 30% farther away.' },
  heracles: { name: 'Heracles', title: 'Son of Zeus', hp: 140, speed: 0.92, dmg: 1.15, pick: 1, armor: 1, weapon: 'club', cost: 900,
    perk: '+40 health, +15% damage and 1 armor, but slower.' },
  perseus: { name: 'Perseus', title: 'Gorgon-Slayer', hp: 100, speed: 1, dmg: 1, pick: 1, cd: 0.9, weapon: 'bolt', cost: 1600,
    perk: 'Favoured by the gods: weapons recharge 10% faster.' },
};

/* ---------- Weapons ---------- */
const WEAPONS = {
  spear: { name: 'Spear of Achilles', short: 'Spear',
    info: ['Hurls a spear at the nearest enemy.', 'Pierces one more enemy.', 'Throws two spears.', '+50% damage, pierces one more.', 'Three spears, thrown faster.'],
    L: { cd: [1.1, 1.1, 1.0, 1.0, 0.8], dmg: [12, 12, 13, 19, 20], n: [1, 1, 2, 2, 3], pierce: [1, 2, 2, 3, 3] } },
  arrows: { name: 'Bow of Apollo', short: 'Bow',
    info: ['Looses a fan of arrows at the nearest foe.', '+25% damage.', 'Five arrows.', 'Faster volleys, +20% damage.', 'Seven arrows.'],
    L: { cd: [1.0, 1.0, 0.95, 0.8, 0.75], dmg: [8, 10, 10, 12, 13], n: [3, 3, 5, 5, 7] } },
  club: { name: 'Club of Heracles', short: 'Club',
    info: ['Sweeps a crushing arc at nearby foes.', '+25% damage.', 'Wider, longer sweep.', '+25% damage, swings faster.', 'Sweeps behind you as well.'],
    L: { cd: [1.3, 1.3, 1.2, 1.05, 1.0], dmg: [24, 30, 32, 40, 44], arc: [2.2, 2.2, 2.6, 2.6, 2.8], r: [86, 86, 98, 100, 108], both: [0, 0, 0, 0, 1] } },
  shield: { name: 'Shield of Athena', short: 'Aspis',
    info: ['A bronze shield circles you, striking foes.', 'Two shields.', 'Three shields in a wider orbit.', '+40% damage, faster spin.', 'Four shields.'],
    L: { n: [1, 2, 3, 3, 4], dmg: [9, 10, 11, 15, 16], rad: [60, 64, 72, 74, 82], spin: [3, 3.2, 3.4, 4, 4.2] } },
  bolt: { name: 'Thunderbolt of Zeus', short: 'Bolt',
    info: ['Calls lightning down on a random foe.', 'Two bolts.', 'Three bolts with a wider blast.', 'Four bolts, more often.', 'Five bolts, +20% damage.'],
    L: { cd: [2.4, 2.2, 2.0, 1.7, 1.5], n: [1, 2, 3, 4, 5], dmg: [28, 30, 34, 36, 44], aoe: [38, 40, 48, 50, 58] } },
  fire: { name: 'Flame of Prometheus', short: 'Flame',
    info: ['A ring of stolen fire burns nearby foes.', 'Larger ring of fire.', '+30% damage.', 'Larger ring of fire.', 'Double damage.'],
    L: { r: [56, 68, 70, 84, 90], dmg: [5, 6, 8, 9, 16] } },
  trident: { name: 'Trident of Poseidon', short: 'Trident',
    info: ['Thrown out and back, piercing everything.', '+30% damage.', 'Two tridents.', 'Thrown more often, +20% damage.', 'Three tridents.'],
    L: { cd: [2.6, 2.6, 2.4, 2.0, 1.9], dmg: [22, 28, 28, 34, 36], n: [1, 1, 2, 2, 3] } },
};
const MAX_WEAPONS = 4;

/* ---------- Passive blessings ---------- */
const PASSIVES = {
  hermes:   { name: 'Sandals of Hermes', info: '+10% movement speed.' },
  ambrosia: { name: 'Ambrosia', info: '+20 max health and slowly regenerate.' },
  armor:    { name: 'Armor of Hephaestus', info: 'Take 1 less damage from every hit.' },
  ares:     { name: 'Fury of Ares', info: '+10% damage with all weapons.' },
  kronos:   { name: 'Hourglass of Kronos', info: 'Weapons recharge 8% faster.' },
  fleece:   { name: 'Golden Fleece', info: 'Gather gems from 35% farther away.' },
  owl:      { name: 'Owl of Athena', info: '+10% area for blasts, sweeps and orbits.' },
};

/* ---------- Temple (permanent upgrades) ---------- */
const META = {
  might:   { name: 'Might', desc: '+5% damage', max: 5, base: 150, icon: 'ares' },
  vigor:   { name: 'Vigor', desc: '+10 max health', max: 5, base: 120, icon: 'ambrosia' },
  swift:   { name: 'Swiftness', desc: '+4% move speed', max: 3, base: 200, icon: 'hermes' },
  haste:   { name: 'Haste', desc: '-3% weapon recharge', max: 5, base: 180, icon: 'kronos' },
  wisdom:  { name: 'Wisdom', desc: '+8% experience', max: 5, base: 160, icon: 'owl' },
  greed:   { name: 'Greed', desc: '+12% gold', max: 5, base: 140, icon: 'coin' },
  reach:   { name: 'Reach', desc: '+10% pickup range', max: 3, base: 120, icon: 'fleece' },
  fates:   { name: 'Thread of Fate', desc: '+1 reroll each run', max: 3, base: 300, icon: 'fates' },
  phoenix: { name: 'Phoenix Feather', desc: 'Revive once at half health', max: 1, base: 1200, icon: 'phoenix' },
};
const metaCost = k => Math.round(META[k].base * (1 + (SAVE.meta[k] || 0) * 0.8));

/* ---------- Enemies ---------- */
const ED = {
  satyr:    { name: 'Satyr', hp: 10, sp: 52, r: 12, dmg: 7, xp: 1, lore: 'Drunken woodland tricksters. Weak alone, dangerous in herds.' },
  harpy:    { name: 'Harpy', hp: 7, sp: 90, r: 11, dmg: 5, xp: 1, fly: true, lore: 'Shrieking storm-spirits. Fast, frail and erratic.' },
  spartoi:  { name: 'Spartoi', hp: 36, sp: 42, r: 13, dmg: 11, xp: 2, lore: 'Skeleton warriors sprung from dragon teeth. Slow and sturdy.' },
  centaur:  { name: 'Centaur', hp: 30, sp: 100, r: 15, dmg: 10, xp: 3, lore: 'Wild archers of Thessaly. They gallop close and loose arrows.' },
  gigas:    { name: 'Gigas', hp: 150, sp: 34, r: 22, dmg: 16, xp: 6, lore: 'Earth-born giants who once stormed Olympus itself.' },
  shade:    { name: 'Shade', hp: 40, sp: 82, r: 12, dmg: 12, xp: 3, fly: true, lore: 'Restless souls of the Underworld, drawn out by the night.' },
  cyclops:  { name: 'Polyphemus', title: 'the Cyclops', hp: 1500, sp: 46, r: 36, dmg: 22, boss: true, at: 180, lore: 'Arrives at 3:00. Hurls boulders from afar.' },
  minotaur: { name: 'The Minotaur', title: 'of the Labyrinth', hp: 3800, sp: 56, r: 32, dmg: 26, boss: true, at: 360, lore: 'Arrives at 6:00. Lowers his horns and charges.' },
  medusa:   { name: 'Medusa', title: 'the Gorgon', hp: 7200, sp: 44, r: 30, dmg: 26, boss: true, at: 540, lore: 'Arrives at 9:00. Her serpents spit venom in every direction.' },
  amphora:  { name: 'Amphora', hp: 1, sp: 0, r: 11, dmg: 0, xp: 0, prop: true },
};
const BOSSES = ['cyclops', 'minotaur', 'medusa'];
const xpNeed = l => Math.floor(5 + l * 2.6 + l * l * 0.14);
const spawnRate = t => 1.1 + t / 60 * 1.15 + (t > 480 ? 3 : 0);
const hpMul = t => 1 + (t / 60) * 0.26 + Math.max(0, t - 420) / 60 * 0.3;
function pickType(t) {
  const m = t / 60, w = [['satyr', m < 6 ? 6 : 2.5]];
  if (m >= 0.75) w.push(['harpy', 4]);
  if (m >= 2) w.push(['spartoi', m < 4 ? 3 : 4]);
  if (m >= 3.5) w.push(['centaur', 2.5]);
  if (m >= 5) w.push(['gigas', 1.3]);
  if (m >= 7) w.push(['shade', 3.5]);
  let s = 0; for (const x of w) s += x[1];
  let r = Math.random() * s;
  for (const x of w) if ((r -= x[1]) <= 0) return x[0];
  return 'satyr';
}
