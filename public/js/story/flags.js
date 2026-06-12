// Story flag reference. Flags are plain strings in state.flags; this file
// documents them and provides progress helpers.
//
//   intro_done        woke up, saw the opening text
//   sword_given       Elder Rowan gave the Glade Sword
//   whistle_given     Lumen the glade-spirit gave the Whistle of Eras
//   melody_rousing / melody_ember / melody_tide / melody_lament
//   d1_open           Verdant Hollow unsealed
//   d1_clear d2_clear d3_clear
//   relic_verdant relic_cinder relic_tide
//   met_ash_1 met_ash_2 met_ash_3   (minstrel encounters)
//   d2_open d3_open castle_open
//   duskfall_seen     watched the Duskfall cutscene
//   bow_bought bottle_bought
//   vhorrun_defeated  game complete

export function relicCount(state) {
  return ['relic_verdant', 'relic_cinder', 'relic_tide']
    .filter(f => state.flags.includes(f)).length;
}

export function nextGoalText(state) {
  const f = (x) => state.flags.includes(x);
  if (f('vhorrun_defeated')) return 'The kingdom is saved. Wander as you will.';
  if (f('castle_open')) return 'Storm Castle Nocturne and face Vhorrun.';
  if (f('melody_lament')) return 'Play Liora\'s Lament at the castle gates.';
  if (f('d3_clear')) return 'Find Ash near the town square.';
  if (f('d3_open')) return 'Brave the Sunken Sanctum beneath Lake Lumen.';
  if (f('melody_tide')) return 'Play the Tidewalker\'s Air at the lake basin.';
  if (f('d2_clear')) return 'Seek the minstrel Ash in Eldermere Town.';
  if (f('d2_open')) return 'Descend into the Cinder Depths.';
  if (f('melody_ember')) return 'Play the Ember Round at the shimmering door on Scorchpeak.';
  if (f('d1_clear')) return 'Find the minstrel Ash in Heartfield.';
  if (f('d1_open')) return 'Enter the Verdant Hollow in the western glade.';
  if (f('melody_rousing')) return 'Wake the sealed door at the Verdant Hollow.';
  if (f('whistle_given')) return 'Practice the Song of Rousing (equip the Whistle to B).';
  if (f('sword_given')) return 'Visit the glade shrine north of Bramblewick.';
  if (f('intro_done')) return 'Speak with Elder Rowan in Bramblewick.';
  return 'Step outside and meet the village.';
}
