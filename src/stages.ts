import { BubbleColor, StageData } from './types';

// Helper to define layouts using color letters:
// R = red, B = blue, G = green, Y = yellow, P = purple, O = orange, . = empty
function parseLayout(lines: string[]): (BubbleColor | null)[][] {
  const map: Record<string, BubbleColor> = {
    R: 'red',
    B: 'blue',
    G: 'green',
    Y: 'yellow',
    P: 'purple',
    O: 'orange'
  };

  return lines.map((line) => {
    const chars = line.trim().split(/\s+/);
    return chars.map((ch) => (ch in map ? map[ch] : null));
  });
}

export const STAGES: StageData[] = [
  // ==========================================
  // BRACKET 1: BEGINNER (Stages 1 - 6)
  // 3 Colors, 7 - 8 shots before drop, 4 - 5 rows
  // Smooth, welcoming, easy matches & orphan drops
  // ==========================================

  // Stage 1: Warm Up (3 colors: R, B, G) - 8 shots
  {
    id: 1,
    name: 'STAGE 1: WARM UP',
    colors: ['red', 'blue', 'green'],
    shotsBeforeDrop: 8,
    layout: parseLayout([
      'R R B B G G R R', // 8
      'R B B G G R R',   // 7
      'B B G G R R B B', // 8
      'B G G R R B B'    // 7
    ])
  },
  // Stage 2: Twin Stripes (3 colors: R, B, G) - 8 shots
  {
    id: 2,
    name: 'STAGE 2: TWIN STRIPES',
    colors: ['red', 'blue', 'green'],
    shotsBeforeDrop: 8,
    layout: parseLayout([
      'R R R R B B B B',
      'R R R G B B B',
      'G G G G G G G G',
      'G G R R R G G'
    ])
  },
  // Stage 3: Triangle Peak (3 colors: R, B, G) - 8 shots
  {
    id: 3,
    name: 'STAGE 3: TRIANGLE PEAK',
    colors: ['red', 'blue', 'green'],
    shotsBeforeDrop: 8,
    layout: parseLayout([
      'G G G G G G G G',
      '. B B B B B .',
      '. . R R R R . .',
      '. . . G G . .',
      '. . . B . . .'
    ])
  },
  // Stage 4: Sunny Meadow (3 colors: B, G, Y) - 7 shots
  {
    id: 4,
    name: 'STAGE 4: SUNNY MEADOW',
    colors: ['blue', 'green', 'yellow'],
    shotsBeforeDrop: 7,
    layout: parseLayout([
      'B B Y Y Y Y B B',
      'B B G G G B B',
      'G G G Y Y G G G',
      'G Y Y Y Y G',
      'Y Y . . . . Y Y'
    ])
  },
  // Stage 5: Ruby Diamond (3 colors: R, B, Y) - 7 shots
  {
    id: 5,
    name: 'STAGE 5: RUBY DIAMOND',
    colors: ['red', 'blue', 'yellow'],
    shotsBeforeDrop: 7,
    layout: parseLayout([
      'B B R R R R B B',
      'B R Y Y Y R B',
      'R Y Y B Y Y R R',
      'R Y Y Y Y R',
      '. R R . . R R .'
    ])
  },
  // Stage 6: Triple Crescent (3 colors: R, G, Y) - 7 shots
  // Gently closes Bracket 1 with multiple open colors on the bottom
  {
    id: 6,
    name: 'STAGE 6: TRIPLE CRESCENT',
    colors: ['red', 'green', 'yellow'],
    shotsBeforeDrop: 7,
    layout: parseLayout([
      'R R Y Y Y Y R R',
      'R Y G G G Y R',
      'Y G G R R G G Y',
      'Y G R R R G Y',
      'G G . Y Y . G G'
    ])
  },

  // ==========================================
  // BRACKET 2: NOVICE (Stages 7 - 14)
  // 4 Colors, 6 - 7 shots before drop, 5 - 6 rows
  // Richer shapes, introducing Yellow & Purple
  // ==========================================

  // Stage 7: Rainbow Arch (4 colors: R, B, G, Y) - 7 shots
  {
    id: 7,
    name: 'STAGE 7: RAINBOW ARCH',
    colors: ['red', 'blue', 'green', 'yellow'],
    shotsBeforeDrop: 7,
    layout: parseLayout([
      'R R Y Y Y Y R R',
      'R Y G G G Y R',
      'Y G B B B G Y',
      'G B R R B G',
      'B R . . R B'
    ])
  },
  // Stage 8: Sweet Heart (4 colors: R, P, Y, G) - 7 shots
  // Redesigned with open bottom and multiple matching paths
  {
    id: 8,
    name: 'STAGE 8: SWEET HEART',
    colors: ['red', 'purple', 'yellow', 'green'],
    shotsBeforeDrop: 7,
    layout: parseLayout([
      '. R R . . R R .',
      'R R P P P R R',
      'P P Y Y Y Y P P',
      'P Y G G G Y P',
      'Y Y G . G Y Y',
      '. Y . . . Y .'
    ])
  },
  // Stage 9: Twin Peaks (4 colors: B, G, Y, R) - 7 shots
  {
    id: 9,
    name: 'STAGE 9: TWIN PEAKS',
    colors: ['blue', 'green', 'yellow', 'red'],
    shotsBeforeDrop: 7,
    layout: parseLayout([
      'B B . . . . B B',
      'B G B . B G B',
      'G G G . G G G .',
      'G Y Y G Y Y G',
      'Y Y R R R R Y Y',
      'R R . . . R R'
    ])
  },
  // Stage 10: Diamond Fort (4 colors: R, B, G, Y) - 6 shots
  {
    id: 10,
    name: 'STAGE 10: DIAMOND FORT',
    colors: ['red', 'blue', 'green', 'yellow'],
    shotsBeforeDrop: 6,
    layout: parseLayout([
      'R R B B B B R R',
      'R G G G G R R',
      'B G Y Y Y G B',
      'B Y R R Y B',
      'G Y R R Y G',
      'G B . B G'
    ])
  },
  // Stage 11: Bubble Invader (4 colors: R, B, Y, P) - 6 shots
  {
    id: 11,
    name: 'STAGE 11: BUBBLE INVADER',
    colors: ['red', 'blue', 'yellow', 'purple'],
    shotsBeforeDrop: 6,
    layout: parseLayout([
      '. P . P P . P .',
      '. . P P P . .',
      'P P Y P Y P P',
      'P P P P P P P',
      'P . P . P . P',
      'R . . . . . R',
      'R B . . . B R'
    ])
  },
  // Stage 12: Crown Jewel (4 colors: Y, R, B, P) - 6 shots
  {
    id: 12,
    name: 'STAGE 12: CROWN JEWEL',
    colors: ['yellow', 'red', 'blue', 'purple'],
    shotsBeforeDrop: 6,
    layout: parseLayout([
      'Y . . Y Y . . Y',
      'Y R . Y . R Y',
      'Y R B Y B R Y Y',
      'P P P P P P P',
      'B B B B B B B B',
      'R R . R R . R'
    ])
  },
  // Stage 13: Pac-Chomp (4 colors: Y, R, B, G) - 6 shots
  {
    id: 13,
    name: 'STAGE 13: PAC-CHOMP',
    colors: ['yellow', 'red', 'blue', 'green'],
    shotsBeforeDrop: 6,
    layout: parseLayout([
      '. Y Y Y Y Y . .',
      'Y Y Y Y Y Y .',
      'Y Y B B . . . .',
      'Y Y B . . . .',
      'Y Y G G . . . .',
      'Y Y G G G Y .',
      '. R R R R R . .'
    ])
  },
  // Stage 14: Hourglass (4 colors: B, Y, R, G) - 6 shots
  {
    id: 14,
    name: 'STAGE 14: HOURGLASS',
    colors: ['blue', 'yellow', 'red', 'green'],
    shotsBeforeDrop: 6,
    layout: parseLayout([
      'B B B B B B B B',
      'Y Y Y Y Y Y Y',
      '. R R R R R .',
      '. . G G G . .',
      '. R R R R R .',
      'Y Y . . . Y Y',
      'B B . . . . B B'
    ])
  },

  // ==========================================
  // BRACKET 3: ADVANCED (Stages 15 - 22)
  // 5 Colors, 5 - 6 shots before drop, 6 - 7 rows
  // Tactical bank shots, introducing Orange
  // ==========================================

  // Stage 15: Butterfly (5 colors: P, B, G, Y, R) - 6 shots
  {
    id: 15,
    name: 'STAGE 15: BUTTERFLY',
    colors: ['purple', 'blue', 'green', 'yellow', 'red'],
    shotsBeforeDrop: 6,
    layout: parseLayout([
      'P P . Y Y . P P',
      'P B . Y . B P',
      'B B G Y G B B B',
      'B G R R G B',
      '. G R R R G .',
      '. . G R G . .',
      '. . . R . . .'
    ])
  },
  // Stage 16: Solar Burst (5 colors: R, B, G, Y, P) - 6 shots
  {
    id: 16,
    name: 'STAGE 16: SOLAR BURST',
    colors: ['red', 'blue', 'green', 'yellow', 'purple'],
    shotsBeforeDrop: 6,
    layout: parseLayout([
      'R R Y Y Y Y R R',
      'R Y P P P Y R',
      'Y P G G G P Y Y',
      'P G B B G P',
      'P B G G B P P',
      'B . B . B'
    ])
  },
  // Stage 17: Anchor Dive (5 colors: B, G, Y, P, O) - 6 shots
  {
    id: 17,
    name: 'STAGE 17: ANCHOR DIVE',
    colors: ['blue', 'green', 'yellow', 'purple', 'orange'],
    shotsBeforeDrop: 6,
    layout: parseLayout([
      '. . . B B . . .',
      '. . . B . . .',
      'G G . B . G G .',
      'G G G B G G G',
      'Y . . B . . Y .',
      'P P . B . P P',
      '. O O O O O .'
    ])
  },
  // Stage 18: Spider Web (5 colors: P, G, R, Y, B) - 6 shots
  {
    id: 18,
    name: 'STAGE 18: SPIDER WEB',
    colors: ['purple', 'green', 'red', 'yellow', 'blue'],
    shotsBeforeDrop: 6,
    layout: parseLayout([
      'P . P P P P . P',
      '. G . G . G .',
      'P G R R R R G P',
      '. G R Y R G .',
      'P G R R R R G P',
      '. G . G . G .',
      'B . . B B . . B'
    ])
  },
  // Stage 19: Arrow Head (5 colors: R, Y, G, B, O) - 5 shots
  {
    id: 19,
    name: 'STAGE 19: ARROW HEAD',
    colors: ['red', 'yellow', 'green', 'blue', 'orange'],
    shotsBeforeDrop: 5,
    layout: parseLayout([
      'R R R R R R R R',
      '. Y Y Y Y Y .',
      '. . G G G G . .',
      '. . . B B . .',
      '. . . O O . . .',
      '. . . . O . .',
      '. . . . . O . .'
    ])
  },
  // Stage 20: Cherry Blossom (5 colors: R, P, G, Y, B) - 5 shots
  {
    id: 20,
    name: 'STAGE 20: CHERRY BLOSSOM',
    colors: ['red', 'purple', 'green', 'yellow', 'blue'],
    shotsBeforeDrop: 5,
    layout: parseLayout([
      'R R . P P . R R',
      'R P P P P P R',
      '. P Y Y Y P . .',
      '. P Y G Y P .',
      '. P Y Y Y P . .',
      'R P P P P P R',
      'B . . . . . . B'
    ])
  },
  // Stage 21: Knight Shield (5 colors: B, Y, R, P, G) - 5 shots
  {
    id: 21,
    name: 'STAGE 21: KNIGHT SHIELD',
    colors: ['blue', 'yellow', 'red', 'purple', 'green'],
    shotsBeforeDrop: 5,
    layout: parseLayout([
      'B B B B B B B B',
      'B Y Y Y Y Y B',
      'B Y R R R Y B B',
      'B Y R P R Y B',
      '. B Y R Y B . .',
      '. B Y Y B .',
      '. . G G . . .'
    ])
  },
  // Stage 22: Temple Pillars (5 colors: Y, B, R, G, P) - 5 shots
  {
    id: 22,
    name: 'STAGE 22: TEMPLE PILLARS',
    colors: ['yellow', 'blue', 'red', 'green', 'purple'],
    shotsBeforeDrop: 5,
    layout: parseLayout([
      'Y Y Y Y Y Y Y Y',
      'Y Y Y Y Y Y Y',
      'B B . R R . B B',
      'B B . R R . B',
      'G G . P P . G G',
      'G G . P P . G',
      'Y Y . Y Y . Y Y'
    ])
  },

  // ==========================================
  // BRACKET 4: MASTER (Stages 23 - 30)
  // 6 Colors, 4 - 5 shots before drop, 6 - 7 rows
  // Full rainbow spectrum, high-combo formations
  // ==========================================

  // Stage 23: Tropical Pine (6 colors: G, Y, O, R, B, P) - 5 shots
  {
    id: 23,
    name: 'STAGE 23: TROPICAL PINE',
    colors: ['green', 'yellow', 'orange', 'red', 'blue', 'purple'],
    shotsBeforeDrop: 5,
    layout: parseLayout([
      'G . G G G G . G',
      '. G G G G G .',
      '. . G G G . . .',
      '. Y Y Y Y Y .',
      'O O O O O O O O',
      'O Y O Y O Y O',
      '. R R R R R . .'
    ])
  },
  // Stage 24: Zig-Zag Canyon (6 colors: G, B, P, Y, R, O) - 5 shots
  {
    id: 24,
    name: 'STAGE 24: ZIG-ZAG CANYON',
    colors: ['green', 'blue', 'purple', 'yellow', 'red', 'orange'],
    shotsBeforeDrop: 5,
    layout: parseLayout([
      'G G G G . . . .',
      '. G G G G . .',
      '. . . . B B B B',
      '. . . B B B B',
      'P P P P . . . .',
      '. P P P P . .',
      '. . . . Y Y Y Y'
    ])
  },
  // Stage 25: Phoenix Wings (6 colors: R, O, Y, P, B, G) - 5 shots
  {
    id: 25,
    name: 'STAGE 25: PHOENIX WINGS',
    colors: ['red', 'orange', 'yellow', 'purple', 'blue', 'green'],
    shotsBeforeDrop: 5,
    layout: parseLayout([
      'R R . . . . R R',
      'R O R . R O R',
      'O O Y Y Y Y O O',
      'O Y P P P Y O',
      '. Y P B P Y . .',
      '. . P B P . .',
      '. . . G . . .'
    ])
  },
  // Stage 26: Clockwork Gear (6 colors: B, P, G, Y, O, R) - 5 shots
  {
    id: 26,
    name: 'STAGE 26: CLOCKWORK GEAR',
    colors: ['blue', 'purple', 'green', 'yellow', 'orange', 'red'],
    shotsBeforeDrop: 5,
    layout: parseLayout([
      'B . B B B B . B',
      '. P P P P P .',
      'B P G G G P B B',
      'B P G Y G P B',
      'B P G G G P B B',
      '. P P P P P .',
      'B . B B B B . B'
    ])
  },
  // Stage 27: Chessboard (6 colors: R, B, G, Y, P, O) - 5 shots
  {
    id: 27,
    name: 'STAGE 27: CHESSBOARD',
    colors: ['red', 'blue', 'green', 'yellow', 'purple', 'orange'],
    shotsBeforeDrop: 5,
    layout: parseLayout([
      'R B R B R B R B',
      'B R B R B R B',
      'G Y G Y G Y G Y',
      'Y G Y G Y G Y',
      'P O P O P O P O',
      'O P O P O P O',
      'R B G Y P O R B'
    ])
  },
  // Stage 28: Dragon Eye (6 colors: G, Y, O, R, P, B) - 5 shots
  {
    id: 28,
    name: 'STAGE 28: DRAGON EYE',
    colors: ['green', 'yellow', 'orange', 'red', 'purple', 'blue'],
    shotsBeforeDrop: 5,
    layout: parseLayout([
      '. G G G G G G .',
      'G Y Y Y Y Y G',
      'G Y O O O O Y G',
      'G Y O R O Y G',
      'G Y O O O O Y G',
      'G Y Y Y Y Y G',
      '. G G G G G G .'
    ])
  },
  // Stage 29: Chaos Vortex (6 colors: O, R, P, B, G, Y) - 4 shots
  {
    id: 29,
    name: 'STAGE 29: CHAOS VORTEX',
    colors: ['orange', 'red', 'purple', 'blue', 'green', 'yellow'],
    shotsBeforeDrop: 4,
    layout: parseLayout([
      'O O R R P P B B',
      'Y O R P B G G',
      'Y Y O R P B G G',
      'G Y O P B G Y',
      'G G B P R O Y Y',
      'P B G Y O R R',
      'P P B G Y O R R'
    ])
  },
  // Stage 30: The Final Clash (6 colors: R, B, G, Y, P, O) - 4 shots
  {
    id: 30,
    name: 'STAGE 30: THE FINAL CLASH',
    colors: ['red', 'blue', 'green', 'yellow', 'purple', 'orange'],
    shotsBeforeDrop: 4,
    layout: parseLayout([
      'R R B B G G Y Y',
      'P P O O R R B',
      'B G G Y Y P P O',
      'O R R B B G G',
      'Y Y P P O O R R',
      'R B G Y P O R',
      'P O Y G B R P O'
    ])
  }
];

export function getStage(id: number): StageData {
  const index = (id - 1) % STAGES.length;
  const base = STAGES[index];
  // If looping after beating all 30 stages, slightly increase difficulty
  const loopCount = Math.floor((id - 1) / STAGES.length);
  return {
    ...base,
    id,
    shotsBeforeDrop: Math.max(3, base.shotsBeforeDrop - loopCount)
  };
}
