// World content validation: every map loads, grids are rectangular and use
// only known legend chars, exits/warps point at real maps, and every entity
// type is registered. Runs in Node (no DOM needed at import time).

import { test } from 'node:test';
import assert from 'node:assert/strict';

const tilemap = await import('../public/js/engine/tilemap.js');
const { getMapDef, allMapIds, DEFAULT_LEGEND } = tilemap;
const { TILE_TYPES } = await import('../public/js/gfx/tiles.js');
const entities = await import('../public/js/entities/index.js');
await import('../public/js/world/index.js');

test('all maps have rectangular grids and known tiles', () => {
  for (const id of allMapIds()) {
    const def = getMapDef(id);
    const legend = { ...DEFAULT_LEGEND, ...(def.legend || {}) };
    const w = def.grid[0].length;
    def.grid.forEach((row, y) => {
      assert.equal(row.length, w, `${id} row ${y}: ${row.length} chars, expected ${w}`);
      for (const ch of row) {
        const type = legend[ch];
        assert.ok(type, `${id} row ${y}: unknown tile char ${JSON.stringify(ch)}`);
        assert.ok(TILE_TYPES[type], `${id}: legend maps ${JSON.stringify(ch)} to unknown type ${type}`);
      }
    });
  }
});

test('exits and warps reference existing maps with in-bounds targets', () => {
  for (const id of allMapIds()) {
    const def = getMapDef(id);
    for (const [side, exit] of Object.entries(def.exits || {})) {
      const target = typeof exit === 'string' ? exit : exit.map;
      assert.doesNotThrow(() => getMapDef(target), `${id} exit ${side} -> missing map ${target}`);
    }
    for (const e of def.entities || []) {
      if (e.type !== 'warp') continue;
      const t = getMapDef(e.to.map);
      assert.ok(t, `${id}: warp to missing map ${e.to.map}`);
      assert.ok(e.to.x >= 0 && e.to.x < t.grid[0].length && e.to.y >= 0 && e.to.y < t.grid.length,
        `${id}: warp to ${e.to.map} (${e.to.x},${e.to.y}) out of bounds`);
    }
  }
});

test('all entity types in maps are registered', () => {
  const known = entities.knownTypes();
  for (const id of allMapIds()) {
    const def = getMapDef(id);
    for (const e of def.entities || []) {
      assert.ok(known.includes(e.type), `${id}: unknown entity type ${e.type}`);
    }
  }
});

test('door/chest ids are unique within each dungeon', () => {
  const seen = new Map();
  for (const id of allMapIds()) {
    const def = getMapDef(id);
    const scope = def.dungeon || 'world';
    for (const e of def.entities || []) {
      if (!e.id || !['chest', 'heartpiece'].includes(e.type)) continue;
      const key = `${scope}:${e.id}`;
      assert.ok(!seen.has(key), `duplicate id ${e.id} in ${id} (also in ${seen.get(key)})`);
      seen.set(key, id);
    }
  }
});

test('required story maps exist', () => {
  for (const id of ['bramblewick_home', 'bramblewick', 'shrine_glade', 'verdant_approach',
    'heartfield', 'town', 'scorch_trail', 'marsh', 'lake', 'nocturne_approach',
    'd1_r1', 'd2_r1', 'd3_r1', 'c_r1', 'devroom']) {
    assert.doesNotThrow(() => getMapDef(id), `missing map: ${id}`);
  }
});
