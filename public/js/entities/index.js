// Entity factory: map definition entries -> entity instances.
// Modules register their types here; maps refer to them by name.

import {
  Chest, Sign, SaveStatue, Pot, Door, FloorSwitch, CrystalSwitch,
  EyeSwitch, Torch, PushBlock, Warp, Gate, HeartPiece, TileSwapper,
} from '../world/puzzles.js';
import { NPC } from './npcs.js';
import { registerEnemies } from './enemies.js';
import { registerBosses } from './bosses.js';

const TYPES = {
  chest: Chest,
  sign: Sign,
  savestatue: SaveStatue,
  pot: Pot,
  door: Door,
  floorswitch: FloorSwitch,
  crystal: CrystalSwitch,
  eyeswitch: EyeSwitch,
  torch: Torch,
  block: PushBlock,
  warp: Warp,
  gate: Gate,
  heartpiece: HeartPiece,
  tileswap: TileSwapper,
  npc: NPC,
};

export function registerType(name, cls) {
  TYPES[name] = cls;
}

export function knownTypes() {
  return Object.keys(TYPES);
}

registerEnemies(registerType);
registerBosses(registerType);

export function createEntity(def, play) {
  const Cls = TYPES[def.type];
  if (!Cls) {
    console.warn(`Unknown entity type: ${def.type}`);
    return null;
  }
  return new Cls(def, play);
}
