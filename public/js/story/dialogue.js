// All NPC dialogue, keyed by NPC id. Entries are checked in order; the first
// whose `when` matches (or has no `when`) is used. onDone runs after the
// dialog closes; `choice` is the selected index when choices are present.

import { hasFlag, setFlag } from '../engine/save.js';
import { relicCount } from './flags.js';
import { sfx } from '../audio/sfx.js';

const D = {
  // ---------------- Bramblewick ----------------
  elder: [
    {
      when: s => !hasFlag(s, 'sword_given'),
      speaker: 'ELDER ROWAN',
      pages: [
        'Rin! You felt it too, did you not? The whole glade shivered in its sleep last night.',
        'The old shrine north of the village has been crying like a kettle since dawn. Something is terribly wrong.',
        'You were always the bravest sapling of this village. Take the Glade Sword from our keeping - it is yours now.',
        'Press A to swing it. Hold A and release to spin. Now go - the shrine waits north of the village!',
      ],
      onDone: (play) => {
        play.setFlag('sword_given');
        play.acquireItem('sword');
      },
    },
    {
      when: s => !hasFlag(s, 'whistle_given'),
      speaker: 'ELDER ROWAN',
      pages: ['The shrine lies through the north path. Hurry, Rin - the spirit Lumen guards it, and her light grows dim.'],
    },
    {
      when: s => !hasFlag(s, 'd1_clear'),
      speaker: 'ELDER ROWAN',
      pages: ['The Verdant Hollow... so the rot has reached even there. Cut through what blocks you, and trust the Galewing when your sword cannot reach.'],
    },
    {
      when: s => s.duskfall && !hasFlag(s, 'vhorrun_defeated'),
      speaker: 'ELDER ROWAN',
      pages: ['So this is Duskfall. The old stories were true. Listen, Rin: a king who cannot sleep fears music above all. Remember everything Ash taught you.'],
    },
    {
      when: s => hasFlag(s, 'vhorrun_defeated'),
      speaker: 'ELDER ROWAN',
      pages: ['The glade breathes again, and it breathes your name, Rin. Rest now. You have earned a long, sweet sleep.'],
    },
    {
      speaker: 'ELDER ROWAN',
      pages: ['Three relics keep this land in balance: Verdant, Cinder, Tide. Guard them with your life.'],
    },
  ],

  spirit: [
    {
      when: s => !hasFlag(s, 'whistle_given'),
      speaker: 'LUMEN',
      pages: [
        '...closer, little one. My light... is almost spent.',
        'Vhorrun, the exiled chancellor... he digs beneath Castle Nocturne, where the Sleeping Dark turns in its slumber.',
        'He hunts the three Embertide Relics. With them he would wake what must never wake.',
        'Princess Liora fled the castle before it fell quiet. She left this with the wind, and the wind left it with me.',
        'Take the Whistle of Eras. And take my last song: the SONG OF ROUSING. What sleeps... it wakes.',
        'The Verdant Hollow, west of the great field... its door sleeps like stone. Wake it. Claim the relic before his servants do...',
      ],
      onDone: (play) => {
        play.setFlag('whistle_given');
        play.acquireItem('whistle');
        play.learnMelody('rousing');
      },
    },
    {
      speaker: 'LUMEN',
      pages: ['...the door of the Hollow sleeps... stand before it... and play my song... up, left, right, up...'],
    },
  ],

  // ---------------- Ash (Liora in disguise) ----------------
  ash: [
    {
      when: s => hasFlag(s, 'd1_clear') && !hasFlag(s, 'melody_ember'),
      speaker: 'ASH',
      pages: [
        'Well fought in the Hollow, stranger. Word travels fast when the trees do the talking.',
        'I am Ash. A minstrel, a wanderer... call it what you like. I collect old songs, and you look like someone who needs them.',
        'The mountain path of Scorchpeak hides a door behind heat-shimmer. This tune cools the air itself.',
        'Listen well. The EMBER ROUND: down, right, right, down.',
      ],
      onDone: (play) => {
        play.setFlag('met_ash_1');
        play.learnMelody('ember');
      },
    },
    {
      when: s => hasFlag(s, 'd2_clear') && !hasFlag(s, 'melody_tide'),
      speaker: 'ASH',
      pages: [
        'Twice now. The princess chose her champion well... if she chose at all. Forget I said that.',
        'Lake Lumen swallowed an old sanctum whole. At the stone basin on its shore, this song commands the waters.',
        'The TIDEWALKER\'S AIR: left, up, down, left. Mind your breath down there.',
      ],
      onDone: (play) => {
        play.setFlag('met_ash_2');
        play.learnMelody('tide');
      },
    },
    {
      when: s => hasFlag(s, 'd3_clear') && !hasFlag(s, 'melody_lament'),
      speaker: 'ASH',
      pages: [
        'So you have all three... Rin. I am sorry. I am so sorry.',
        'He let you gather them. The moment you carried all three relics past the Hollow, his shadows marked the road home.',
        'The relics are taken. Look at the sky - he has begun. This... this is Duskfall.',
        'No more masks. My name is Liora. The castle was my home, and its gate still knows my grief.',
        'Take my song. LIORA\'S LAMENT: up, down, up, down. It will carry you home to Eldermere from anywhere... and it will open the gates of Castle Nocturne.',
        'End this, Rin. I will be close behind you. I promise.',
      ],
      onDone: (play) => {
        play.setFlag('met_ash_3');
        play.learnMelody('lament');
        play.startDuskfall();
      },
    },
    {
      speaker: 'ASH',
      pages: ['Go on, hero. The road knows your name now.'],
    },
  ],

  // ---------------- Eldermere Town ----------------
  shopkeep: [
    {
      speaker: 'MARLO\'S GOODS',
      pages: ['Welcome, welcome! Gems for goods, goods for gems! What catches your eye?'],
      shop: true,
    },
  ],

  innkeep: [
    {
      when: s => s.duskfall,
      speaker: 'INNKEEPER POSY',
      pages: ['Curfew or no curfew, my hearth stays warm. Rest a moment, dear.', 'There. Hearts full. Now go put the sky back, would you?'],
      onDone: (play) => { play.player.heal(99); sfx('heart'); },
    },
    {
      speaker: 'INNKEEPER POSY',
      pages: ['You look ragged, dear! Sit by the hearth, no charge for heroes.', 'There. Hearts full. Mind the marsh - things bite.'],
      onDone: (play) => { play.player.heal(99); sfx('heart'); },
    },
  ],

  kid1: [
    {
      when: s => s.duskfall,
      speaker: 'PIP',
      pages: ['Mama says the purple sky is just weather. It is NOT just weather. I am eight, not stupid.'],
    },
    {
      when: s => !hasFlag(s, 'd1_clear'),
      speaker: 'PIP',
      pages: ['A grown-up went into the west woods and came back all scratched! He said the Hollow has a door that SNORES!'],
    },
    {
      speaker: 'PIP',
      pages: ['When I grow up I want a sword AND a whistle AND a... what else do you have? I want that too.'],
    },
  ],

  kid2: [
    {
      speaker: 'NELL',
      pages: ['Wanna know a secret? Some walls sound HOLLOW when you knock. Daddy says never play with bombs. So you do it!'],
    },
  ],

  woman1: [
    {
      when: s => s.duskfall,
      speaker: 'MIRA',
      pages: ['The flowers all closed at noon. At NOON. I have kept this garden thirty years and flowers do not lie.'],
    },
    {
      when: s => relicCount(s) >= 2,
      speaker: 'MIRA',
      pages: ['Twice now the well water has gone sweet overnight. Whatever you are doing out there, the land has noticed.'],
    },
    {
      speaker: 'MIRA',
      pages: ['Travelers say the marsh fog hums old lullabies. Romantic, until something in the fog hums back.'],
    },
  ],

  man1: [
    {
      when: s => !s.items.includes('bow'),
      speaker: 'OLD TAM',
      pages: ['Marlo got a sylvan bow in stock. Pricey, but those castle eye-wards only answer to arrows. Mark my words.'],
    },
    {
      speaker: 'OLD TAM',
      pages: ['I fished Lake Lumen for forty years. Caught boots, crowns, one angry turtle. Never caught the bottom, though.'],
    },
  ],

  guard1: [
    {
      when: s => s.duskfall,
      speaker: 'GUARD BRAN',
      pages: ['Curfew at dusk by order of... well. Of nobody, anymore. Of common sense. Stay armed, citizen.'],
    },
    {
      when: s => hasFlag(s, 'castle_open'),
      speaker: 'GUARD BRAN',
      pages: ['The castle gate stands open?! Then it is true. Give the Sleepless King one for Eldermere, hero.'],
    },
    {
      speaker: 'GUARD BRAN',
      pages: ['The road to Castle Nocturne is sealed. Chancellor\'s orders, years ago. Strange how he sealed it from the INSIDE.'],
    },
  ],

  // ---------------- Ending ----------------
  liora: [
    {
      speaker: 'LIORA',
      pages: ['It is over. Truly over. The Dark sleeps, and at last... so can he.', 'Eldermere will want a festival. Heroes do not get to skip festivals, Rin. Royal decree.'],
    },
  ],
};

export function dialogueFor(id, play) {
  const entries = D[id];
  if (!entries) return null;
  for (const e of entries) {
    if (e.when && !e.when(play.state)) continue;
    if (e.shop) {
      return {
        pages: e.pages,
        speaker: e.speaker,
        onDone: () => play.openShop(),
      };
    }
    return {
      pages: e.pages,
      speaker: e.speaker,
      choices: e.choices,
      onDone: e.onDone ? (choice) => e.onDone(play, choice) : undefined,
    };
  }
  return null;
}
