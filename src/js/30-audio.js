/* ============================================================
   Audio: synthesized effects and a generative lyre score
   ============================================================ */
const audio = (() => {
  let ac = null, master, sfxG, musG, noiseBuf;
  const last = {};
  let gemPitch = 0, lastGem = 0;
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume().catch(() => {}); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; return; }
    master = ac.createGain(); master.connect(ac.destination);
    sfxG = ac.createGain(); sfxG.connect(master);
    musG = ac.createGain(); musG.connect(master);
    const len = ac.sampleRate; noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    setVolumes();
    music.start();
  }
  function setVolumes() {
    if (!ac) return;
    sfxG.gain.value = SAVE.settings.sfx * 0.9;
    musG.gain.value = SAVE.settings.music * 0.55;
  }
  function gate(key, ms) { const n = performance.now(); if (n - (last[key] || 0) < ms) return false; last[key] = n; return true; }
  function tone(f, d, type, v, f2, when, dest) {
    if (!ac) return;
    const t = when || ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(dest || sfxG); o.start(t); o.stop(t + d + 0.03);
  }
  function noise(d, v, freq, type, when, dest, q) {
    if (!ac) return;
    const t = when || ac.currentTime, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; s.loop = true; f.type = type || 'lowpass'; f.frequency.value = freq; if (q) f.Q.value = q;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f); f.connect(g); g.connect(dest || sfxG); s.start(t, Math.random() * 0.5); s.stop(t + d + 0.03);
  }
  function pluck(f, t, v, dur) {
    if (!ac) return;
    const o = ac.createOscillator(), o2 = ac.createOscillator(), lp = ac.createBiquadFilter(), g = ac.createGain();
    o.type = 'triangle'; o2.type = 'sawtooth'; o.frequency.value = f; o2.frequency.value = f * 1.003;
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(f * 6, t); lp.frequency.exponentialRampToValueAtTime(f * 1.2, t + dur);
    const g2 = ac.createGain(); g2.gain.value = 0.25;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); g.connect(musG);
    o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }

  /* generative score in D dorian */
  const music = {
    on: false, step: 0, next: 0, timer: null, intensity: 0,
    start() { if (!ac || this.on) return; this.on = true; this.next = ac.currentTime + 0.15; this.timer = setInterval(() => this.tick(), 30); },
    tick() {
      if (!ac || ac.state !== 'running') return;
      const spb = 60 / (84 + this.intensity * 14) / 2;
      while (this.next < ac.currentTime + 0.15) { this.play(this.step, this.next, spb); this.next += spb; this.step++; }
    },
    play(s, t, spb) {
      const SC = [0, 2, 3, 5, 7, 9, 10], PROG = [0, 0, 3, 4, 5, 3, 4, 4];
      const note = (deg, oct) => 146.83 * Math.pow(2, (SC[((deg % 7) + 7) % 7] + 12 * (Math.floor(deg / 7) + oct)) / 12);
      const bar = Math.floor(s / 16), root = PROG[bar % PROG.length], st = s % 16;
      if (st === 0 || st === 8) { pluck(note(root, -1), t, 0.16, spb * 7); pluck(note(root + 4, -1), t + 0.01, 0.08, spb * 6); }
      const ARP = [0, 2, 4, 7, 4, 2, 4, 6, 0, 2, 4, 7, 9, 7, 4, 2];
      const h = hash2(s, 7 + bar);
      if (h < 0.78 || st % 4 === 0) pluck(note(root + ARP[st], h < 0.2 ? 1 : 0), t, st % 4 === 0 ? 0.12 : 0.07, spb * 3);
      if (this.intensity >= 1 && (st === 0 || st === 6 || st === 10)) { tone(95, 0.22, 'sine', 0.22, 48, t, musG); noise(0.06, 0.05, 900, 'lowpass', t, musG); }
      if (this.intensity >= 1.5 && st % 2 === 1) noise(0.04, 0.035, 6000, 'highpass', t, musG);
      if (this.intensity >= 2 && st % 4 === 2) tone(note(root, -2), spb * 2, 'sawtooth', 0.05, null, t, musG);
    },
  };

  return {
    init, setVolumes, music,
    get ready() { return !!ac; },
    suspend() { if (ac && ac.state === 'running') ac.suspend().catch(() => {}); },
    resume() { if (ac && ac.state === 'suspended') ac.resume().catch(() => {}); },
    click() { tone(880, 0.06, 'triangle', 0.08, 660); },
    hit() { if (gate('hit', 55)) tone(190 + Math.random() * 70, 0.06, 'square', 0.035, 90); },
    crit() { if (gate('crit', 90)) { tone(520, 0.09, 'square', 0.04, 260); noise(0.08, 0.06, 3000, 'highpass'); } },
    kill() { if (gate('kill', 45)) noise(0.12, 0.07, 700 + Math.random() * 400, 'bandpass', null, null, 1.2); },
    gem() {
      const n = performance.now(); if (n - lastGem > 450) gemPitch = 0; if (n - lastGem < 38) return; lastGem = n;
      gemPitch = Math.min(gemPitch + 1, 16); tone(640 * Math.pow(1.0595, gemPitch), 0.09, 'sine', 0.06); tone(1280 * Math.pow(1.0595, gemPitch), 0.05, 'triangle', 0.02);
    },
    coin() { if (gate('coin', 60)) { tone(1320, 0.07, 'square', 0.03); tone(1760, 0.12, 'square', 0.03, null, ac && ac.currentTime + 0.06); } },
    level() { if (!ac) return; const t = ac.currentTime; [0, 4, 7, 12].forEach((n, i) => { tone(392 * Math.pow(2, n / 12), 0.35, 'triangle', 0.09, null, t + i * 0.08); tone(784 * Math.pow(2, n / 12), 0.2, 'sine', 0.03, null, t + i * 0.08); }); },
    pickCard() { tone(660, 0.12, 'triangle', 0.08, 990); },
    hurt() { if (gate('hurt', 120)) { tone(160, 0.18, 'sawtooth', 0.07, 60); noise(0.1, 0.06, 500); } },
    swing() { noise(0.18, 0.12, 900, 'bandpass', null, null, 0.8); },
    throw_() { if (gate('throw', 80)) noise(0.08, 0.05, 2400, 'bandpass', null, null, 2); },
    bolt() { noise(0.35, 0.22, 3000, 'lowpass'); tone(80, 0.4, 'sawtooth', 0.08, 40); },
    break_() { noise(0.15, 0.14, 1800, 'bandpass', null, null, 0.7); tone(300, 0.08, 'triangle', 0.05, 180); },
    boss() { if (!ac) return; tone(70, 1.4, 'sawtooth', 0.14, 38); tone(105, 1.2, 'sawtooth', 0.08, 52); noise(1.1, 0.1, 300); },
    heal() { tone(523, 0.18, 'sine', 0.08, 1046); },
    magnet() { tone(300, 0.5, 'sine', 0.08, 1200); },
    wrath() { noise(0.8, 0.3, 2000); tone(60, 0.9, 'sawtooth', 0.15, 30); },
    revive() { if (!ac) return; const t = ac.currentTime; [0, 7, 12, 16, 19].forEach((n, i) => tone(330 * Math.pow(2, n / 12), 0.5, 'triangle', 0.08, null, t + i * 0.07)); },
    victory() { if (!ac) return; const t = ac.currentTime; [0, 4, 7, 12, 7, 12, 16, 19, 24].forEach((n, i) => tone(294 * Math.pow(2, n / 12), 0.5, 'triangle', 0.09, null, t + i * 0.13)); },
    defeat() { if (!ac) return; const t = ac.currentTime; [7, 5, 3, 0].forEach((n, i) => tone(220 * Math.pow(2, n / 12), 0.7, 'triangle', 0.08, null, t + i * 0.22)); },
    buy() { if (!ac) return; const t = ac.currentTime; [0, 7, 12].forEach((n, i) => tone(660 * Math.pow(2, n / 12), 0.18, 'square', 0.03, null, t + i * 0.05)); },
  };
})();
