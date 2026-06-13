// Dungeon room factory. Every room is a single 20x13 map; doors are wall
// gaps with a Door entity (locked/boss/shutter) plus a Warp on the same
// tile. Locked doors share an id between both sides so opening persists.

import { defineMap } from '../engine/tilemap.js';

const DOOR_POS = { n: [9, 0], s: [9, 12], w: [0, 6], e: [19, 6] };
const ARRIVE = { n: [9, 1], s: [9, 11], w: [1, 6], e: [18, 6] };
const OPPOSITE = { n: 's', s: 'n', w: 'e', e: 'w' };

export function dungeonRooms({ prefix, theme, music, dungeon }) {
  return function room(n, { grid, entities = [], doors = {}, dark = false, name, onEnter, melodies, exit }) {
    const g = grid.map(r => r.split(''));
    const ents = [...entities];
    for (const [side, spec0] of Object.entries(doors)) {
      const spec = typeof spec0 === 'string' ? { to: spec0 } : spec0;
      const [dx, dy] = DOOR_POS[side];
      g[dy][dx] = '.';
      const [ax, ay] = ARRIVE[OPPOSITE[side]];
      if (spec.kind) {
        ents.push({ type: 'door', kind: spec.kind, id: spec.id, channel: spec.channel, x: dx, y: dy });
      }
      ents.push({ type: 'warp', x: dx, y: dy, to: { map: `${prefix}_${spec.to}`, x: ax, y: ay } });
    }
    if (exit) {
      // dungeon entrance room: south gap leads back outside
      const [dx, dy] = DOOR_POS.s;
      g[dy][dx] = '>';
      ents.push({ type: 'warp', x: dx, y: dy, to: exit, kind: 'stairs' });
    }
    defineMap({
      id: `${prefix}_r${n}`,
      name, theme, music, dungeon, dark,
      grid: g.map(r => r.join('')),
      entities: ents,
      onEnter, melodies,
    });
  };
}
