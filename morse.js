// International Morse code table + helpers to turn text into Asterisk-style
// tone tuples, using standard PARIS-method WPM timing:
//   unit (ms) = 1200 / wpm
//   dit = 1 unit tone, dah = 3 units tone
//   gap within a character = 1 unit, gap between characters = 3 units, gap between words = 7 units

const MORSE_CODE = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
  I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.',
  Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--',
  '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...',
  ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-',
  '"': '.-..-.', '$': '...-..-', '@': '.--.-.',
};

function morseWords(text) {
  return text
    .toUpperCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.split('').filter((ch) => MORSE_CODE[ch]))
    .filter((letters) => letters.length > 0);
}

function morseUnsupportedChars(text) {
  const seen = new Set();
  text
    .toUpperCase()
    .split('')
    .forEach((ch) => {
      if (ch !== ' ' && !/\s/.test(ch) && !MORSE_CODE[ch]) seen.add(ch);
    });
  return [...seen];
}

function morseToReadable(text) {
  return morseWords(text)
    .map((letters) => letters.map((ch) => MORSE_CODE[ch]).join(' '))
    .join(' / ');
}

function morseToSegments(text, wpm, freq, gain) {
  const unit = 1200 / Math.max(1, Number(wpm) || 1);
  const words = morseWords(text);
  const segments = [];

  words.forEach((letters, wordIndex) => {
    letters.forEach((ch, letterIndex) => {
      const code = MORSE_CODE[ch];
      code.split('').forEach((sym, symIndex) => {
        segments.push({ f1: freq, f2: 0, dur: Math.round(unit * (sym === '.' ? 1 : 3)), gain });
        if (symIndex < code.length - 1) {
          segments.push({ f1: 0, f2: 0, dur: Math.round(unit), gain: 0 });
        }
      });
      if (letterIndex < letters.length - 1) {
        segments.push({ f1: 0, f2: 0, dur: Math.round(unit * 3), gain: 0 });
      }
    });
    if (wordIndex < words.length - 1) {
      segments.push({ f1: 0, f2: 0, dur: Math.round(unit * 7), gain: 0 });
    }
  });

  return segments;
}
