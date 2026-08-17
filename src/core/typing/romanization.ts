export interface RomanToken {
  kana: string;
  options: string[];
}

const kanaOptions: Record<string, string[]> = {
  あ: ["a"], い: ["i", "yi"], う: ["u", "wu"], え: ["e"], お: ["o"],
  か: ["ka"], き: ["ki"], く: ["ku", "cu", "qu"], け: ["ke"], こ: ["ko"],
  さ: ["sa"], し: ["shi", "si", "ci"], す: ["su"], せ: ["se", "ce"], そ: ["so"],
  た: ["ta"], ち: ["chi", "ti"], つ: ["tsu", "tu"], て: ["te"], と: ["to"],
  な: ["na"], に: ["ni"], ぬ: ["nu"], ね: ["ne"], の: ["no"],
  は: ["ha"], ひ: ["hi"], ふ: ["fu", "hu"], へ: ["he"], ほ: ["ho"],
  ま: ["ma"], み: ["mi"], む: ["mu"], め: ["me"], も: ["mo"],
  や: ["ya"], ゆ: ["yu"], よ: ["yo"],
  ら: ["ra"], り: ["ri"], る: ["ru"], れ: ["re"], ろ: ["ro"],
  わ: ["wa"], ゐ: ["wi"], ゑ: ["we"], を: ["wo"],
  が: ["ga"], ぎ: ["gi"], ぐ: ["gu"], げ: ["ge"], ご: ["go"],
  ざ: ["za"], じ: ["ji", "zi"], ず: ["zu"], ぜ: ["ze"], ぞ: ["zo"],
  だ: ["da"], ぢ: ["di", "ji"], づ: ["du", "zu"], で: ["de"], ど: ["do"],
  ば: ["ba"], び: ["bi"], ぶ: ["bu"], べ: ["be"], ぼ: ["bo"],
  ぱ: ["pa"], ぴ: ["pi"], ぷ: ["pu"], ぺ: ["pe"], ぽ: ["po"],
  ゔ: ["vu"],
  ぁ: ["xa", "la"], ぃ: ["xi", "li"], ぅ: ["xu", "lu"], ぇ: ["xe", "le"], ぉ: ["xo", "lo"],
  ゃ: ["xya", "lya"], ゅ: ["xyu", "lyu"], ょ: ["xyo", "lyo"],
  ー: ["-"], "、": [","], "。": ["."], "！": ["!"], "？": ["?"],
  "・": ["/"], " ": [" "], "　": [" "],
  "0": ["0"], "1": ["1"], "2": ["2"], "3": ["3"], "4": ["4"],
  "5": ["5"], "6": ["6"], "7": ["7"], "8": ["8"], "9": ["9"],
};

const compoundOptions: Record<string, string[]> = {
  きゃ: ["kya"], きゅ: ["kyu"], きょ: ["kyo"],
  しゃ: ["sha", "sya"], しゅ: ["shu", "syu"], しょ: ["sho", "syo"],
  ちゃ: ["cha", "tya"], ちゅ: ["chu", "tyu"], ちょ: ["cho", "tyo"],
  にゃ: ["nya"], にゅ: ["nyu"], にょ: ["nyo"],
  ひゃ: ["hya"], ひゅ: ["hyu"], ひょ: ["hyo"],
  みゃ: ["mya"], みゅ: ["myu"], みょ: ["myo"],
  りゃ: ["rya"], りゅ: ["ryu"], りょ: ["ryo"],
  ぎゃ: ["gya"], ぎゅ: ["gyu"], ぎょ: ["gyo"],
  じゃ: ["ja", "jya", "zya"], じゅ: ["ju", "jyu", "zyu"], じょ: ["jo", "jyo", "zyo"],
  びゃ: ["bya"], びゅ: ["byu"], びょ: ["byo"],
  ぴゃ: ["pya"], ぴゅ: ["pyu"], ぴょ: ["pyo"],
  ふぁ: ["fa", "fwa"], ふぃ: ["fi", "fwi"], ふぇ: ["fe", "fwe"], ふぉ: ["fo", "fwo"],
  てぃ: ["thi", "ti"], でぃ: ["dhi", "di"], とぅ: ["twu", "tu"], どぅ: ["dwu", "du"],
  うぃ: ["wi"], うぇ: ["we"], うぉ: ["who", "wo"],
  くぁ: ["qa", "kwa"], くぃ: ["qi", "kwi"], くぇ: ["qe", "kwe"], くぉ: ["qo", "kwo"],
  つぁ: ["tsa"], つぃ: ["tsi"], つぇ: ["tse"], つぉ: ["tso"],
  しぇ: ["she", "sye"], じぇ: ["je", "jye", "zye"], ちぇ: ["che", "tye"],
};

const katakanaToHiragana = (value: string): string =>
  Array.from(value)
    .map((character) => {
      const code = character.charCodeAt(0);
      return code >= 0x30a1 && code <= 0x30f6 ? String.fromCharCode(code - 0x60) : character;
    })
    .join("");

const unique = (items: string[]): string[] => [...new Set(items)];

export function tokenizeReading(value: string): RomanToken[] {
  const reading = katakanaToHiragana(value.toLowerCase());
  const base: RomanToken[] = [];

  for (let index = 0; index < reading.length; index += 1) {
    const current = reading[index];
    if (!current) continue;
    const compound = reading.slice(index, index + 2);
    if (compoundOptions[compound]) {
      base.push({ kana: compound, options: compoundOptions[compound] });
      index += 1;
      continue;
    }
    if (current === "っ") {
      base.push({ kana: current, options: ["__SMALL_TSU__"] });
      continue;
    }
    if (current === "ん") {
      base.push({ kana: current, options: ["__N__"] });
      continue;
    }
    const options = kanaOptions[current];
    if (!options) {
      throw new Error(`ローマ字変換できない文字です: ${current} (${value})`);
    }
    base.push({ kana: current, options });
  }

  return base.map((token, index) => {
    const next = base[index + 1];
    const nextInitials = next?.options
      .filter((option) => !option.startsWith("__"))
      .map((option) => option[0] ?? "")
      .filter((key) => /^[bcdfghjklmpqrstvwxyz]$/.test(key)) ?? [];

    if (token.options[0] === "__SMALL_TSU__") {
      return { ...token, options: unique([...nextInitials, "xtu", "ltu"]) };
    }
    if (token.options[0] === "__N__") {
      const nextOptions = next?.options.filter((option) => !option.startsWith("__")) ?? [];
      const ambiguous = nextOptions.some((option) => /^[aiueoyn]/.test(option));
      return { ...token, options: ambiguous ? ["nn", "n'", "xn"] : ["n", "nn", "xn"] };
    }
    return token;
  });
}

export function toCanonicalRoman(reading: string): string {
  return tokenizeReading(reading)
    .map((token) => token.options[0])
    .join("");
}
