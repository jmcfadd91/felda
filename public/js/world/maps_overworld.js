// Overworld regions. All outdoor maps are 30x20 with edge openings at
// rows 9-11 (east/west) and cols 14-16 (north/south) so transitions align.

import { defineMap } from '../engine/tilemap.js';

// ---------------- Bramblewick (starting village) ----------------
defineMap({
  id: 'bramblewick',
  name: 'BRAMBLEWICK',
  theme: 'forest',
  music: 'forest',
  outdoor: true,
  grid: [
    'TTTTTTTTTTTTTTpppTTTTTTTTTTTTT',
    'TT...g...,....ppp....g....,..T',
    'T..,......g...ppp..,......g..T',
    'T...####......ppp......####..T',
    'T...####......ppp......####..T',
    'T...#c##......ppp......#c##..T',
    'T....p........ppp........p...T',
    'T..g.p..,...ppppp....,...p.g.T',
    'T....ppppppppppp.........p...T',
    '.......,....ppppppppppppppp...',
    '.ppppppppppppppp.....,........',
    '......g.....ppp....g.....bb..T',
    'T...,.......ppp.........bbb..T',
    'T......####.ppp.####....,....T',
    'T..g...####.ppp.####.........T',
    'T......#c##.ppp.#c##....g....T',
    'T.,......p..ppp...p..,.......T',
    'T....g...p..ppp...p......,...T',
    'T........ppppppppp......g....T',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  exits: {
    north: 'shrine_glade',
    west: 'verdant_approach',
    east: 'heartfield',
  },
  entities: [
    { type: 'warp', x: 5, y: 5, to: { map: 'bramblewick_home', x: 5, y: 7 }, kind: 'door' },
    { type: 'warp', x: 24, y: 5, to: { map: 'bramblewick_elder', x: 5, y: 7 }, kind: 'door' },
    { type: 'warp', x: 8, y: 15, to: { map: 'bramblewick_hut1', x: 5, y: 7 }, kind: 'door' },
    { type: 'warp', x: 17, y: 15, to: { map: 'bramblewick_hut2', x: 5, y: 7 }, kind: 'door' },
    { type: 'sign', x: 16, y: 8, text: 'BRAMBLEWICK VILLAGE. North: the old shrine. West: the deep glade. East: Heartfield and all the world.' },
    { type: 'savestatue', x: 13, y: 8 },
    { type: 'npc', id: 'elder', sprite: 'npc_elder', x: 21, y: 7, wander: false },
    { type: 'npc', id: 'kid1', sprite: 'npc_kid', x: 7, y: 11 },
    { type: 'npc', id: 'woman1', sprite: 'npc_woman', x: 22, y: 16 },
  ],
});

// small interiors share one shape
function hut(id, entities = [], music = 'town') {
  defineMap({
    id,
    theme: 'cave',
    music,
    grid: [
      '###########',
      '#.........#',
      '#.........#',
      '#.........#',
      '#.........#',
      '#.........#',
      '#.........#',
      '#.........#',
      '#####.#####',
    ],
    entities: [
      { type: 'warp', x: 5, y: 8, to: { map: 'bramblewick', x: id === 'bramblewick_home' ? 5 : id === 'bramblewick_elder' ? 23 : id === 'bramblewick_hut1' ? 8 : 17, y: id.includes('hut') ? 16 : 6 }, kind: 'door' },
      ...entities,
    ],
    onEnter: id === 'bramblewick_home' ? (play) => {
      if (!play.hasFlag('intro_done')) {
        play.setFlag('intro_done');
        play.say([
          'The same dream again: a castle with no lights, a song with four notes, and someone calling your name from under the earth.',
          'Outside, the morning birds of Bramblewick are dead silent.',
          'Elder Rowan will know what to do. He always does.',
        ], { speaker: 'RIN' });
      }
    } : undefined,
  });
}

hut('bramblewick_home', [
  { type: 'sign', x: 2, y: 2, text: 'RIN\'S LOFT. Move: arrows/WASD. A/J: sword. B/K: item. E: talk and open. ESC: bag and saving.' },
  { type: 'pot', x: 8, y: 2 },
  { type: 'pot', x: 8, y: 3 },
]);
hut('bramblewick_elder', [
  { type: 'sign', x: 2, y: 2, text: 'Shelves of bark-paper journals. Fifty years of weather, harvests, and one page that just says: THE DOOR SNORES.' },
  { type: 'pot', x: 8, y: 2 },
]);
hut('bramblewick_hut1', [
  { type: 'pot', x: 2, y: 2 },
  { type: 'pot', x: 3, y: 2 },
  { type: 'chest', id: 'bw_hut1_chest', x: 8, y: 2, contents: 'gems:10' },
]);
hut('bramblewick_hut2', [
  { type: 'pot', x: 8, y: 6 },
  { type: 'sign', x: 2, y: 2, text: 'A loom mid-weave: a green field, a gold whistle, and a tiny figure with a sword. Unfinished.' },
]);

// ---------------- Shrine Glade ----------------
defineMap({
  id: 'shrine_glade',
  name: 'THE OLD SHRINE',
  theme: 'forest',
  music: 'fairy',
  outdoor: true,
  grid: [
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TTTT....,......g.......,..TTTT',
    'TTT.....................,..TTT',
    'TT...,....wwwwwwwww.......TTTT',
    'TT......wwwwwwwwwwww..,....TTT',
    'TT..g...www.......www......TTT',
    'TT......ww....>....ww...g..TTT',
    'TT...,..ww...w.w...ww......TTT',
    'TT......www.......www..,...TTT',
    'TT.......wwwww=wwwww.......TTT',
    'TT..g.......,.p......g.....TTT',
    'TT........,...p..,.........TTT',
    'TTT....g......p......,....TTTT',
    'TTT.....,.....p...........TTTT',
    'TTTT...g......p....g....TTTTTT',
    'TTTT..,.......p.........TTTTTT',
    'TTTTT....g....p....,...TTTTTTT',
    'TTTTTT........p.......TTTTTTTT',
    'TTTTTTTTTTTTTTpppTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTpppTTTTTTTTTTTTT',
  ],
  exits: { south: 'bramblewick' },
  entities: [
    { type: 'npc', id: 'spirit', sprite: 'npc_spirit', x: 14, y: 5, wander: false },
    { type: 'sign', x: 12, y: 10, text: 'SHRINE OF THE GLADE. Tread soft: someone very old is sleeping very lightly.' },
  ],
});

// ---------------- Verdant Approach (Dungeon 1 doorstep) ----------------
defineMap({
  id: 'verdant_approach',
  name: 'VERDANT APPROACH',
  theme: 'forest',
  music: 'forest',
  outdoor: true,
  grid: [
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TTrrrrrrrrrrrrrrrrrrrTT....TTT',
    'TTrrrrrrrrrrrrrrrrrrrTTT..TTTT',
    'TTrrrrrrrrcrrrrrrrrrrTT.....TT',
    'TTrrrrrrrr.rrrrrrrrrrT...g..TT',
    'TT...g....p..,....b.......,.TT',
    'TT.,......p.....bbb....g....TT',
    'TT....g...p......b........g.TT',
    'TT..b.....p...,......,......TT',
    'TT.bbb....ppppppppppppppppp...',
    'T...b...,.....g.......ppppp...',
    'TT.....g.....,....g..pp.....TT',
    'TT..,.............g.pp....,.TT',
    'TT......SS..g.......p.......TT',
    'TT..g...SS.....,....p...g...TT',
    'TT...........g......p..,....TT',
    'TT...,...g.......,..p....g..TT',
    'TT......,...g.......p.,.....TT',
    'TTT..g.......TTTTTTTTTT...TTTT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  exits: { east: 'bramblewick' },
  melodies: {
    rousing(play) {
      if (!play.hasFlag('d1_open')) {
        play.setFlag('d1_open');
        play.camera.shake(20, 3);
        play.say('A long yawn rolls through the cliff face. The stone door grinds awake and slides aside!');
        play.autosave();
      } else {
        play.say('The door is already awake. It sounds grumpy about it.');
      }
    },
  },
  entities: [
    { type: 'warp', x: 10, y: 3, to: { map: 'd1_r1', x: 9, y: 11 }, kind: 'stairs', requireFlag: 'd1_open', deniedText: 'The stone door is fast asleep. Deep, rumbling snores. Perhaps a rousing song would wake it.' },
    { type: 'sign', x: 12, y: 9, text: 'THE VERDANT HOLLOW. The door sleeps. The forest suggests you let it.' },
    { type: 'savestatue', x: 8, y: 10 },
    { type: 'thornling', x: 22, y: 6 },
    { type: 'thornling', x: 5, y: 15 },
    { type: 'heartpiece', id: 'hp_verdant', x: 3, y: 10, when: () => true },
  ],
});

// ---------------- Heartfield (central hub) ----------------
defineMap({
  id: 'heartfield',
  name: 'HEARTFIELD',
  theme: 'overworld',
  music: 'overworld',
  outdoor: true,
  grid: [
    'rrrrrrrrrrrrrrpppfrrrrrrrrrrrr',
    'r...g....,....ppp....,..g....r',
    'r.g..........,ppp............r',
    'r....,..g.....ppp...g....,...r',
    'r.bb..........ppp.........g..r',
    'r.b...g..,....ppp..,.........r',
    'r.......ppppppppppppppp....,.r',
    'r..,....p.....ppp.....pp.....r',
    'r..g....p..g..ppp..,...pp..g.r',
    '........p.....ppp.......ppppp.',
    '.ppppppppppp..ppp....g........',
    '......g....ppppppppp......,...',
    'r.,.........,ppp...ppp.......r',
    'r......g.....ppp.....pppp..g.r',
    'r...BB.......ppp..,.....p....r',
    'r..gBBg..,...ppp.........,...r',
    'r..ggg......g.ppp..g.........r',
    'r....,...g....ppp......g..,..r',
    'r.g......,....ppp..,.......g.r',
    'rrrrrrrrrrrrrrppprrrrrrrrrrrrr',
  ],
  exits: {
    west: 'bramblewick',
    north: 'town',
    east: 'scorch_trail',
    south: 'marsh',
  },
  bombReveal: { '4,14': 'c', '5,14': 'c' },
  entities: [
    { type: 'sign', x: 16, y: 11, text: 'HEARTFIELD CROSSROADS. North: Eldermere Town. East: Scorchpeak. South: Mistmarsh. West: Bramblewick.' },
    { type: 'savestatue', x: 13, y: 11 },
    { type: 'npc', id: 'ash', sprite: 'npc_ash', x: 17, y: 7, wander: false, when: s => s.flags.includes('d1_clear') && !s.melodies.includes('ember') },
    { type: 'warp', x: 4, y: 14, w: 2, to: { map: 'heart_cave', x: 4, y: 6 }, kind: 'stairs' },
    { type: 'thornling', x: 6, y: 3 },
    { type: 'thornling', x: 23, y: 15 },
    { type: 'thornling', x: 24, y: 4 },
    { type: 'gloomwisp', x: 8, y: 16, when: s => s.duskfall },
    { type: 'gloomwisp', x: 20, y: 3, when: s => s.duskfall },
    { type: 'wraithguard', x: 15, y: 13, when: s => s.duskfall },
  ],
});

defineMap({
  id: 'heart_cave',
  name: 'HIDDEN HOLLOW',
  theme: 'cave',
  music: 'shop',
  grid: [
    '#########',
    '#.......#',
    '#.......#',
    '#...,...#',
    '#.......#',
    '#.......#',
    '####.####',
  ],
  entities: [
    { type: 'warp', x: 4, y: 6, to: { map: 'heartfield', x: 4, y: 14 }, kind: 'stairs' },
    { type: 'heartpiece', id: 'hp_heartcave', x: 4, y: 3 },
    { type: 'pot', x: 1, y: 1 },
    { type: 'pot', x: 7, y: 1 },
  ],
});

// ---------------- Scorchpeak Trail (Dungeon 2 doorstep) ----------------
defineMap({
  id: 'scorch_trail',
  name: 'SCORCHPEAK TRAIL',
  theme: 'fire',
  music: 'fire',
  outdoor: true,
  grid: [
    'rrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
    'rrrlllrrrrrrrrrrrrrrrlllllrrrr',
    'rrlllllrrrrrcrrrrrrrlllllllrrr',
    'rrlllllrrrr...rrrrrrrlllllrrrr',
    'rrrlllrrrr.....rrrrrrrlllrrrrr',
    'rrrrrrrrr...p...rrrrrrrrrrrrrr',
    'rr..........p.........llrrrrrr',
    'rr..ll......p.....ll..llllrrrr',
    'rr.llll.....p.....llll.llrrrrr',
    '....llll....p......llll......r',
    '.ppppppppppppp.....llll.......',
    '....ll......ppppp...ll....x..r',
    'rr..ll........pppppppppppppppr',
    'rr....x.......l...ll....p...rr',
    'rr............ll...l....p..rrr',
    'rr...l....x...ll........p.rrrr',
    'rr..lll.......l....l....prrrrr',
    'rrr.ll....l........ll..rrrrrrr',
    'rrrr....lll....l....rrrrrrrrrr',
    'rrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
  ],
  exits: { west: 'heartfield' },
  melodies: {
    ember(play) {
      if (!play.hasFlag('d2_open')) {
        play.setFlag('d2_open');
        play.camera.shake(20, 3);
        play.say('The heat-shimmer sighs and parts like a curtain. The way into the mountain stands clear!');
        play.autosave();
      } else {
        play.say('The air here already remembers the song.');
      }
    },
  },
  entities: [
    { type: 'warp', x: 12, y: 2, to: { map: 'd2_r1', x: 9, y: 11 }, kind: 'stairs', requireFlag: 'd2_open', deniedText: 'A wall of rippling heat seals the passage. Your skin prickles. Some songs are said to cool the air itself...' },
    { type: 'sign', x: 10, y: 6, text: 'SCORCHPEAK. The mountain breathes in centuries and breathes out summers.' },
    { type: 'savestatue', x: 14, y: 6 },
    { type: 'emberkin', x: 5, y: 8 },
    { type: 'emberkin', x: 20, y: 8 },
    { type: 'emberkin', x: 17, y: 16 },
    { type: 'cindershell', x: 23, y: 13, when: s => s.flags.includes('d2_clear') },
  ],
});

// ---------------- Mistmarsh ----------------
defineMap({
  id: 'marsh',
  name: 'MISTMARSH',
  theme: 'overworld',
  music: 'forest',
  outdoor: true,
  grid: [
    'TTTTTTTTTTTTTTpppTTTTTTTTTTTTT',
    'T..g....www...ppp...www......T',
    'T...wwwwwww...ppp...wwww..g..T',
    'T..wwwww..w...ppp....wwww....T',
    'T..www.g......ppp..,...www...T',
    'T...w.....,...pp.........w...T',
    'T..g...ppppppppp..g..........T',
    'T......p....wwwww......www...T',
    'T..,...p...wwwwwww..g.wwww...T',
    'T......p...wwwwwww....wwww....',
    'T..ppppp....wwwww...ppppppppp.',
    'T..p....,.....=....pp.....w..T',
    'T..p...g......=...pp...g.....T',
    'T..ppppppppppppppppp.....www.T',
    'T....g....,...=........wwwww.T',
    'T.g.......www.=..www....www..T',
    'T....wwwwwwww...wwwww..g.....T',
    'T...wwwwww..g....wwww........T',
    'T....www......,...ww....g....T',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  exits: { north: 'heartfield', east: 'lake' },
  entities: [
    { type: 'sign', x: 5, y: 6, text: 'MISTMARSH. If the fog hums at you, hum back politely and keep walking.' },
    { type: 'tidemaw', x: 13, y: 8 },
    { type: 'tidemaw', x: 23, y: 15 },
    { type: 'thornling', x: 20, y: 5 },
    { type: 'heartpiece', id: 'hp_marsh', x: 14, y: 17 },
    { type: 'gloomwisp', x: 10, y: 14, when: s => s.duskfall },
    { type: 'gloomwisp', x: 18, y: 4, when: s => s.duskfall },
  ],
});

// ---------------- Lake Lumen (Dungeon 3 doorstep) ----------------
defineMap({
  id: 'lake',
  name: 'LAKE LUMEN',
  theme: 'overworld',
  music: 'water',
  outdoor: true,
  grid: [
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'T..g.....,.......g........,..T',
    'T....g........,........g.....T',
    'T..,....wwwwwwwwwwwwwww......T',
    'T......wwwwwwwwwwwwwwwww..g..T',
    'T..g..wwwwwwwwwwwwwwwwwww....T',
    'T....wwwwwwwwwwwwwwwwwwww.,..T',
    'T....wwwwwwww>wwwwwwwwwww....T',
    'T..,.wwwwwwww.wwwwwwwwwww....T',
    '.....wwwwwww...wwwwwwwww...x.T',
    '.ppppwwwwwww...wwwwwwwww.....T',
    'T....wwwwwww...wwwwwwwww..S..T',
    'T.g...wwwwww...wwwwwwww......T',
    'T......wwwww...wwwwwww...g...T',
    'T...g....www...wwwww.....,...T',
    'T.,......sss...ssss....g.....T',
    'T.....g..sssspsssss.........TT',
    'T........sssspssss....,....TTT',
    'T...,..g.....p.......g....TTTT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  exits: { west: 'marsh' },
  melodies: {
    tide(play) {
      if (!play.hasFlag('d3_open')) {
        play.setFlag('d3_open');
        play.camera.shake(20, 3);
        play.say('The lake bows. Water peels back from a drowned stairway, step by step, like a held breath!');
        play.autosave();
      } else {
        play.say('The stairway already stands clear of the water.');
      }
    },
  },
  entities: [
    { type: 'warp', x: 13, y: 7, to: { map: 'd3_r1', x: 9, y: 11 }, kind: 'stairs', requireFlag: 'd3_open', deniedText: 'Deep beneath the surface, stone steps shimmer. The basin carving shows waves parting before a four-note song.' },
    { type: 'sign', x: 13, y: 16, text: 'THE TIDE BASIN. Carved waves part around a whistle. The lake is listening.' },
    { type: 'savestatue', x: 10, y: 15 },
    { type: 'tidemaw', x: 9, y: 6 },
    { type: 'tidemaw', x: 20, y: 12 },
    { type: 'heartpiece', id: 'hp_lake', x: 27, y: 10 },
    { type: 'voltjelly', x: 24, y: 5, when: s => s.duskfall },
  ],
});

// ---------------- Nocturne Approach (castle doorstep) ----------------
defineMap({
  id: 'nocturne_approach',
  name: 'NOCTURNE APPROACH',
  theme: 'castle',
  music: 'castle',
  outdoor: false,
  warpable: true,
  grid: [
    'rrrrrrrrrrrrr#####rrrrrrrrrrrr',
    'rrrrrrrrrrrrr#>>>#rrrrrrrrrrrr',
    'rr....g......#>>>#.......g..rr',
    'rr..,........#>>>#...,......rr',
    'rr.....g.....p...p......g...rr',
    'rr...........p...p..,.......rr',
    'rr..g....ppppp...ppppp......rr',
    'rr.......p...........p...g..rr',
    'rr.,.....p....,......p......rr',
    'rr.......p...........p....,.rr',
    'rr....p..............p......rr',
    'rr....p....g.........p..g...rr',
    'rr....p........,...ppp......rr',
    'rr....p............p....,...rr',
    'rr..g.ppppppppppppppp.......rr',
    'rr..........p...........g...rr',
    'rr...,......p....g..........rr',
    'rr..........p......,....g...rr',
    'rr..g....,..p...............rr',
    'rrrrrrrrrrrrrrppprrrrrrrrrrrrr',
  ],
  exits: { south: 'town' },
  melodies: {
    lament(play) {
      if (!play.hasFlag('castle_open')) {
        play.setFlag('castle_open');
        play.camera.shake(25, 3);
        play.say('The gates of Castle Nocturne shudder. Old hinges remember a princess\'s footsteps, and swing wide in mourning.');
        play.autosave();
      } else {
        play.say('The gates already stand open, weeping rust.');
      }
    },
  },
  entities: [
    { type: 'warp', x: 14, y: 1, w: 3, to: { map: 'c_r1', x: 9, y: 11 }, kind: 'door', requireFlag: 'castle_open', deniedText: 'The gates are sealed with grief itself. Only a royal lament could move them.' },
    { type: 'sign', x: 8, y: 8, text: 'CASTLE NOCTURNE. By order of the Chancellor: the king sleeps. Do not knock. Do not sing.' },
    { type: 'savestatue', x: 16, y: 4 },
    { type: 'wraithguard', x: 7, y: 12 },
    { type: 'wraithguard', x: 21, y: 8 },
    { type: 'gloomwisp', x: 12, y: 16 },
    { type: 'gloomwisp', x: 18, y: 15 },
  ],
});
