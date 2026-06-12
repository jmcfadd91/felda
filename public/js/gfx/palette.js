// Shared SNES-ish color ramps. Sprite definitions reference these by name so
// palette swaps (Duskfall world, enemy recolors, tunic upgrade) stay cheap.

export const COLORS = {
  // hero
  heroTunic: '#3aa655', heroTunicDark: '#26763c', heroTunic2: '#4a78d0', heroTunic2Dark: '#2e4f96',
  skin: '#f0c8a0', skinDark: '#c89870', hair: '#a06830', hairDark: '#7a4c20',
  // common
  white: '#f8f8f8', black: '#101018', gray: '#9098a0', grayDark: '#50585f',
  red: '#d04848', redDark: '#902830', orange: '#e88838', yellow: '#f0d048',
  green: '#48a048', greenDark: '#2a702e', blue: '#4878d0', blueDark: '#2c4a90',
  purple: '#8858b0', purpleDark: '#5c3880', brown: '#8a5c34', brownDark: '#5e3c20',
  tan: '#d8b078', cream: '#f0e0b8',
  // terrain ramps
  grass: '#58a83c', grassDark: '#3c7c2c', grassLight: '#7cc454',
  dirt: '#b08850', dirtDark: '#8a6638',
  water: '#3868c8', waterLight: '#5890e0', waterDeep: '#24449c',
  lava: '#e85020', lavaLight: '#f8a030', lavaDark: '#a02818',
  stone: '#8890a0', stoneDark: '#5a6272', stoneLight: '#b0b8c4',
  sand: '#e0c888', wood: '#9a6c3c', woodDark: '#6e4a26',
  // dusk (blighted world tints)
  duskGrass: '#5c6450', duskSky: '#2c2440',
};

// Palette-swap tables: map source colors to replacements at bake time.
export const SWAPS = {
  dusk: {
    [COLORS.grass]: COLORS.duskGrass, [COLORS.grassDark]: '#404838',
    [COLORS.grassLight]: '#747c64', [COLORS.water]: '#383858',
    [COLORS.waterLight]: '#50507a', [COLORS.waterDeep]: '#242440',
  },
  tunic2: {
    [COLORS.heroTunic]: COLORS.heroTunic2, [COLORS.heroTunicDark]: COLORS.heroTunic2Dark,
  },
  redEnemy: {
    [COLORS.green]: COLORS.red, [COLORS.greenDark]: COLORS.redDark,
    [COLORS.blue]: COLORS.red, [COLORS.blueDark]: COLORS.redDark,
  },
};
