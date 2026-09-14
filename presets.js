// Preset tone libraries for the AllStar Courtesy/Telemetry Tone Builder.
// Each preset segment is {f1, f2, dur, gain} matching Asterisk's t(f1,f2,dur,gain) tuple.
// gain is the Asterisk amplitude parameter (0-4096), not the web-preview volume.

const GAIN = 2048;

function seg(f1, f2, dur, gain) {
  return { f1, f2, dur, gain: gain === undefined ? GAIN : gain };
}

// Source: https://www.allstarlink.org/telemetry-builder/ "Stock Tone Configurations" table.
// These are the actual default app_rpt telemetry strings shipped with AllStarLink.
const ALLSTARLINK_STOCK_PRESETS = [
  { name: 'ct1 (default courtesy tone)', key: 'ct1', segments: [seg(350, 0, 100), seg(500, 0, 100), seg(660, 0, 100)] },
  { name: 'ct2', key: 'ct2', segments: [seg(660, 880, 150)] },
  { name: 'ct3', key: 'ct3', segments: [seg(440, 0, 150, 4096)] },
  { name: 'ct4', key: 'ct4', segments: [seg(550, 0, 150)] },
  { name: 'ct5', key: 'ct5', segments: [seg(660, 0, 150)] },
  { name: 'ct6', key: 'ct6', segments: [seg(880, 0, 150)] },
  { name: 'ct7', key: 'ct7', segments: [seg(660, 440, 150)] },
  { name: 'ct8', key: 'ct8', segments: [seg(700, 1100, 150)] },
  { name: 'ct9 (DTMF-style *)', key: 'ct9', segments: [seg(1633, 0, 50, 1000), seg(0, 0, 30, 0), seg(1209, 0, 50, 1000)] },
  { name: 'remotemon', key: 'remotemon', segments: [seg(1209, 0, 50)] },
  { name: 'remotetx', key: 'remotetx', segments: [seg(1633, 0, 50, 3000), seg(0, 0, 80, 0), seg(1209, 0, 50, 3000)] },
  { name: 'cmdmode', key: 'cmdmode', segments: [seg(900, 903, 200)] },
  { name: 'functcomplete', key: 'functcomplete', segments: [seg(1000, 0, 100), seg(0, 0, 100, 0), seg(1000, 0, 100)] },
  { name: 'remcomplete', key: 'remcomplete', segments: [seg(650, 0, 100), seg(0, 0, 100, 0), seg(650, 0, 100), seg(0, 0, 100, 0), seg(650, 0, 100)] },
  { name: 'pfxtone', key: 'pfxtone', segments: [seg(350, 440, 5000, 3072)] },
];

// Source: https://www.repeater-builder.com/tech-info/courtesy-tones.html
// Named courtesy tones traditionally used on repeater controllers, reproduced as
// Asterisk-style tone tuples. "ACC" tones include the classic 640ms delay from squelch
// close to first tone, represented here as a leading (0,0,640,0) silence tuple.
const REPEATER_BUILDER_PRESETS = [
  { name: 'Bumble Bee', key: 'ct1', segments: [seg(0, 0, 640, 0), seg(330, 0, 100), seg(495, 0, 100), seg(660, 0, 100)] },
  { name: 'ACC Courtesy Tone #2', key: 'ct1', segments: [seg(0, 0, 640, 0), seg(330, 0, 75), seg(495, 0, 75), seg(660, 0, 75)] },
  { name: 'Piano Chord (ACC #3)', key: 'ct1', segments: [seg(0, 0, 640, 0), seg(660, 880, 100)] },
  { name: 'ACC #8', key: 'ct1', segments: [seg(0, 0, 640, 0), seg(660, 0, 580)] },
  { name: 'ACC #9', key: 'ct1', segments: [seg(0, 0, 640, 0), seg(660, 0, 120)] },
  { name: 'ACC #10', key: 'ct1', segments: [seg(0, 0, 640, 0), seg(660, 250, 100)] },
  { name: 'Yellow Jacket', key: 'ct1', segments: [seg(330, 0, 50), seg(495, 0, 50), seg(660, 0, 50)] },
  { name: 'Shooting Star', key: 'ct1', segments: [seg(800, 0, 100), seg(800, 0, 100), seg(540, 0, 100)] },
  { name: 'Comet', key: 'ct1', segments: [seg(500, 0, 100), seg(500, 0, 100), seg(750, 0, 100)] },
  { name: 'Stardust', key: 'ct1', segments: [seg(750, 0, 125), seg(880, 0, 80), seg(880, 1200, 80)] },
  { name: 'Hornet', key: 'ct1', segments: [seg(660, 0, 50), seg(500, 0, 50), seg(385, 0, 50)] },
  { name: 'Wasp', key: 'ct1', segments: [seg(660, 0, 100), seg(500, 0, 100), seg(385, 0, 100)] },
  { name: 'Tumbleweed', key: 'ct1', segments: [seg(1000, 0, 20), seg(800, 0, 20), seg(600, 0, 20)] },
  { name: 'Fire Fly', key: 'ct1', segments: [seg(1000, 1200, 120), seg(1200, 1400, 80), seg(600, 800, 100)] },
  { name: 'Chirp-Chomp', key: 'ct1', segments: [seg(1500, 0, 20), seg(1250, 0, 20), seg(1000, 0, 20), seg(750, 0, 20), seg(500, 0, 20), seg(2550, 0, 20)] },
  { name: 'Moonbounce', key: 'ct1', segments: [seg(1000, 800, 50), seg(800, 0, 50), seg(600, 0, 50), seg(1500, 0, 50)] },
  { name: 'Dunce Cap', key: 'ct1', segments: [seg(440, 500, 200), seg(440, 350, 200)] },
  { name: 'Honk', key: 'ct1', segments: [seg(500, 700, 100)] },
  { name: 'Beep', key: 'ct1', segments: [seg(880, 0, 100)] },
  { name: 'Boop', key: 'ct1', segments: [seg(440, 0, 100)] },
  { name: 'Bloop', key: 'ct1', segments: [seg(840, 500, 100)] },
  { name: 'Doorbell', key: 'ct1', segments: [seg(800, 0, 75), seg(400, 0, 50)] },
  { name: 'Doorbell Chord', key: 'ct1', segments: [seg(1450, 725, 75), seg(725, 360, 50)] },
  { name: 'Descending', key: 'ct1', segments: [seg(1000, 500, 50), seg(750, 750, 50), seg(500, 1000, 50)] },
  { name: 'Ascending', key: 'ct1', segments: [seg(500, 1000, 50), seg(750, 750, 50), seg(1000, 500, 50)] },
  { name: 'Rolm', key: 'ct1', segments: [seg(525, 660, 150)] },
  { name: 'Nextel Beep', key: 'ct1', segments: [seg(1760, 0, 30), seg(0, 0, 30, 0), seg(1760, 0, 30), seg(0, 0, 30, 0), seg(1760, 0, 30)] },
  { name: 'Function Complete (generic)', key: 'ct1', segments: [seg(480, 1200, 40), seg(0, 0, 40, 0), seg(480, 1200, 40)] },
  { name: 'NASA "Over" Beep', key: 'ct1', segments: [seg(2450, 0, 200)] },
];

const PRESET_LIBRARIES = [
  { label: 'AllStarLink Stock Telemetry Tones', source: 'https://www.allstarlink.org/telemetry-builder/', presets: ALLSTARLINK_STOCK_PRESETS },
  { label: 'Repeater-Builder Named Courtesy Tones', source: 'https://www.repeater-builder.com/tech-info/courtesy-tones.html', presets: REPEATER_BUILDER_PRESETS },
];
