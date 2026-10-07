// Fancy text styles made from Unicode characters, so they work anywhere you paste them.
// Runs on the phone; no server, no cost.

type Style = { id: string; convert: (text: string) => string };

const A = 65;
const a = 97;
const ZERO = 48;

// Maps A-Z, a-z (and 0-9 when the block has digits) into a Unicode block.
// Letters with diacritics (č, ć, š, ž) keep their accent: the base letter is styled and the accent added back.
function block(upper: number, lower: number | null, digits: number | null, holes: Record<string, number> = {}) {
  return (text: string) =>
    Array.from(text.normalize('NFD'))
      .map((ch) => {
        if (holes[ch]) return String.fromCodePoint(holes[ch]);
        const code = ch.codePointAt(0)!;
        if (code >= A && code < A + 26) return String.fromCodePoint(upper + code - A);
        if (code >= a && code < a + 26) {
          return lower === null ? String.fromCodePoint(upper + code - a) : String.fromCodePoint(lower + code - a);
        }
        if (digits !== null && code >= ZERO && code < ZERO + 10) return String.fromCodePoint(digits + code - ZERO);
        return ch;
      })
      .join('')
      .normalize('NFC');
}

function mapLetters(map: string) {
  const chars = Array.from(map);
  return (text: string) =>
    Array.from(text.normalize('NFD'))
      .map((ch) => {
        const code = ch.toLowerCase().codePointAt(0)!;
        return code >= a && code < a + 26 ? chars[code - a] : ch;
      })
      .join('')
      .normalize('NFC');
}

const combine = (mark: string) => (text: string) =>
  Array.from(text)
    .map((ch) => (ch === ' ' ? ch : ch + mark))
    .join('');

const circledDigits = (text: string) =>
  text.replace(/[0-9]/g, (d) => (d === '0' ? '⓪' : String.fromCodePoint(0x2460 + Number(d) - 1)));

const fullwidth = (text: string) =>
  Array.from(text)
    .map((ch) => {
      const code = ch.codePointAt(0)!;
      if (ch === ' ') return '\u3000';
      return code >= 33 && code <= 126 ? String.fromCodePoint(code + 0xfee0) : ch;
    })
    .join('');

export const FANCY_STYLES: Style[] = [
  { id: 'script', convert: block(0x1d4d0, 0x1d4ea, null) },
  { id: 'bold', convert: block(0x1d400, 0x1d41a, 0x1d7ce) },
  { id: 'italic', convert: block(0x1d434, 0x1d44e, null, { h: 0x210e }) },
  { id: 'boldItalic', convert: block(0x1d468, 0x1d482, null) },
  { id: 'sans', convert: block(0x1d5d4, 0x1d5ee, 0x1d7ec) },
  { id: 'sansItalic', convert: block(0x1d608, 0x1d622, null) },
  { id: 'gothic', convert: block(0x1d56c, 0x1d586, null) },
  {
    id: 'double',
    convert: block(0x1d538, 0x1d552, 0x1d7d8, { C: 0x2102, H: 0x210d, N: 0x2115, P: 0x2119, Q: 0x211a, R: 0x211d, Z: 0x2124 }),
  },
  { id: 'mono', convert: block(0x1d670, 0x1d68a, 0x1d7f6) },
  { id: 'bubble', convert: (t) => circledDigits(block(0x24b6, 0x24d0, null)(t)) },
  { id: 'bubbleDark', convert: block(0x1f150, null, null) },
  { id: 'square', convert: block(0x1f130, null, null) },
  { id: 'smallCaps', convert: mapLetters('ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ') },
  { id: 'wide', convert: fullwidth },
  { id: 'strike', convert: combine('\u0336') },
  { id: 'underline', convert: combine('\u0332') },
  { id: 'spaced', convert: (t) => Array.from(t).join(' ') },
  { id: 'cute', convert: (t) => `˚₊‧꒰ა ${t} ໒꒱ ‧₊˚` },
  { id: 'sparkle', convert: (t) => `✧･ﾟ: ${t} :･ﾟ✧` },
  { id: 'hearts', convert: (t) => `♡ ${t} ♡` },
  { id: 'stars', convert: (t) => `⋆｡°✩ ${t} ✩°｡⋆` },
];

// Copy-paste symbols, grouped. Group names come from i18n.
export const SYMBOL_GROUPS: { id: 'hearts' | 'stars' | 'dividers' | 'kaomoji' | 'shapes'; items: string[] }[] = [
  { id: 'hearts', items: ['♡', '♥', '❤', '❣', 'ღ', '❥', '💗', '🤍', '🫶', '༺♡༻', '♡⃛', '꒰ა ♡ ໒꒱'] },
  { id: 'stars', items: ['✧', '✦', '★', '☆', '✩', '✪', '⋆', '✰', '✶', '˚₊‧', '⊹', '✨'] },
  {
    id: 'dividers',
    items: ['⋆｡°✩ ⋆｡°✩', '˗ˏˋ ★ ˎˊ˗', '・‥…━━━☞', '━━━━━━━━', '‧₊˚ ☁️⋅♡𓂃 ࣪ ִֶָ☾.', '✿ ❀ ✿ ❀', '┊ ┊ ┊ ┊', '⊹ ࣪ ˖ ⊹ ࣪ ˖', '▪︎▪︎▪︎▪︎▪︎', '➳ ➳ ➳'],
  },
  {
    id: 'kaomoji',
    items: ['(˶ᵔ ᵕ ᵔ˶)', 'ʕ•ᴥ•ʔ', '(っ◔◡◔)っ ♥', '(◕‿◕✿)', '( ˘ ³˘)♥', '(｡•́︿•̀｡)', '\\(^o^)/', '¯\\_(ツ)_/¯', 'ᕙ(⇀‸↼‶)ᕗ', '(╯°□°)╯︵ ┻━┻', '(≧◡≦)', '(•‿•)'],
  },
  { id: 'shapes', items: ['➜', '➤', '↳', '⇢', '⟡', '◇', '◆', '●', '○', '✿', '❀', '☁', '☾', '☼', '⚘', '⌗', '📍', '🔗'] },
];
