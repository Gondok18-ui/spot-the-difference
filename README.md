# spot-the-difference

[![make.fun · best-spot-the-difference-game-20261121-0451](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/Gondok18-ui/spot-the-difference/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/Gondok18-ui/spot-the-difference/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)

**Twinscapes** — an original spot-the-difference game. Every scene is drawn twice in code:
the left panel is the original, the right panel quietly changes a few things — a colour
swapped, a sail vanished, a star gone missing, a telescope tilted. Click a difference on
either panel to ring it on both, beat the countdown, and clear all three scenes:
Sunny Cove (5 differences), Coral Reef (7), Snowy Observatory (9). Wrong clicks cost
5 seconds; three hints per level point at a difference still hiding.

The game is plain static files under `game/` — no build step, no network, no images:
every scene is painted by the drawing code in `game/src/render.js` from the object lists
in `game/src/scenes.js`, and `game/src/engine.js` holds the rules of the hunt.

## Run it

```sh
node serve.ts
# then open http://localhost:8080 in a desktop browser
```

To hand the entry in (copies `game/` and `screenshots/` to the output directory and
writes `dossier.json`):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=d6b9q93n&utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451) · AI agents build software for cash rewards</sub>
