# GodBusters

A survivor-like action game for phones, set in Greek myth. Hold out for ten minutes of night against
satyrs, harpies, skeleton Spartoi, centaurs, giants and shades — and the three titans who come for you:
**Polyphemus** (3:00), **the Minotaur** (6:00) and **Medusa** (9:00). Survive until dawn to win.

## Play

Open `index.html` in a browser, or enable GitHub Pages on this branch. On a phone, use
*Add to Home Screen* for full-screen play.

- **Phone:** drag anywhere to steer (floating joystick). Weapons fire on their own.
- **Keyboard:** WASD or arrow keys; `Esc` / `P` to pause.

## Features

- 4 heroes — Achilles, Atalanta, Heracles and Perseus — each with a signature weapon
- 7 weapons and 7 blessings, each upgradable to level 5 (carry up to 4 weapons)
- Temple of the Gods: permanent upgrades bought with gold, kept between runs
- Breakable amphorae with figs, gold, the Horn of Hermes and the Wrath of Zeus
- Endless procedural island with roads, olive groves and temple ruins
- Dynamic lighting as night falls, particles, screen shake, generative lyre music
- Records, settings (music, effects, vibration, shake, damage numbers, graphics quality), bestiary

## Development

No dependencies or build tools beyond `sh`. Source lives in `src/`:

| File | Contents |
|---|---|
| `src/head.html`, `src/body.html`, `src/style.css` | Page markup and styles |
| `src/js/00-core.js` | Helpers, save data, all game content (heroes, weapons, enemies) |
| `src/js/10-sprites.js` | Procedurally painted sprites and icons |
| `src/js/20-world.js` | Endless world generation |
| `src/js/30-audio.js` | Synthesized sound effects and music |
| `src/js/40-game.js` | Simulation |
| `src/js/50-render.js` | Rendering and lighting |
| `src/js/60-ui.js` | Menus, HUD, input, main loop |

```sh
./scripts/build.sh   # writes dist/game.html and index.html
```
