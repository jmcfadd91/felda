// Boot: create the game, start at the title screen.

import { Game } from './engine/game.js';
import { TitleScene } from './scenes/title.js';

const game = new Game(document.getElementById('game'));

// ?dev=1: expose state for debugging and start in the sandbox map
const params = new URLSearchParams(location.search);
if (params.get('dev') === '1') {
  window.felda = game;
  import('./engine/save.js').then(async ({ newGameState }) => {
    const { PlayScene } = await import('./scenes/play.js');
    await import('./world/index.js');
    const state = newGameState();
    state.items = ['sword', 'galewing', 'bombs', 'grapple', 'bow', 'whistle'];
    state.swordLevel = 1;
    state.equippedB = 'galewing';
    state.bombs = 10;
    state.arrows = 30;
    state.gems = 100;
    state.melodies = ['rousing', 'ember', 'tide', 'lament'];
    state.checkpoint = { map: params.get('map') || 'devroom', x: 4 * 16, y: 4 * 16 };
    game.replace(new PlayScene(state, 3));
    game.start();
  });
} else {
  import('./world/index.js').then(() => {
    game.push(new TitleScene());
    game.start();
  });
}
