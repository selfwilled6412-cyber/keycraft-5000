import { toCanonicalRoman } from "../src/core/typing/romanization";
import { zoneSources } from "../src/content/source";
import type { ContentCatalog, TextReading } from "../src/content/types";
import { buildAlternateScene } from "./alternate-scenes";

type Replacement = readonly [textFrom: string, textTo: string, readingFrom: string, readingTo: string];

const prefixReplacements: Replacement[] = [
  ["朝の支度が終わったら", "まず、", "あさのしたくがおわったら", "まず、"],
  ["出かける前に", "次に、", "でかけるまえに", "つぎに、"],
  ["帰る前に", "辺りを見回しながら", "かえるまえに", "あたりをみまわしながら"],
  ["今日の最後に", "今日は", "きょうのさいごに", "きょうは"],
  ["朝日を浴びながら", "朝のうちに", "あさひをあびながら", "あさのうちに"],

  ["3つの確認項目を見ながら", "3分だけ時間を取り、", "3つのかくにんこうもくをみながら", "3ふんだけじかんをとり、"],
  ["相手の立場を考えて", "落ち着いて", "あいてのたちばをかんがえて", "おちついて"],
  ["公開や提出の前に", "作業の途中で一度見直し、", "こうかいやていしゅつのまえに", "さぎょうのとちゅうでいちどみなおし、"],
  ["必要な人へ連絡したあと", "手順を確認してから", "ひつようなひとへれんらくしたあと", "てじゅんをかくにんしてから"],
  ["初めての人にも伝わるよう", "ていねいに", "はじめてのひとにもつたわるよう", "ていねいに"],
  ["共有する前に", "もう一度", "きょうゆうするまえに", "もういちど"],
  ["担当が変わっても困らないよう", "必要な情報をそろえて", "たんとうがかわってもこまらないよう", "ひつようなじょうほうをそろえて"],
  ["相手の話を最後まで聞いてから", "一つずつ", "あいてのはなしをさいごまできいてから", "ひとつずつ"],
  ["次の担当へ引き継ぐために", "次へ進む前に", "つぎのたんとうへひきつぐために", "つぎへすすむまえに"],

  ["利用する人の立場を考えながら", "目的を確かめながら", "りようするひとのたちばをかんがえながら", "もくてきをたしかめながら"],
  ["3年後の変化も想像して", "3年後を想像しながら", "3ねんごのへんかもそうぞうして", "3ねんごをそうぞうしながら"],
  ["安全性と続けやすさを比べながら", "安全を意識しながら", "あんぜんせいとつづけやすさをくらべながら", "あんぜんをいしきしながら"],
  ["費用と効果の両方を考えて", "別の方法も考えながら", "ひようとこうかのりょうほうをかんがえて", "べつのほうほうもかんがえながら"],
  ["10年先にも役立つよう", "10年先を想像しながら", "10ねんさきにもやくだつよう", "10ねんさきをそうぞうしながら"],
  ["誰でも使いやすい形を目指して", "より良い形を目指して", "だれでもつかいやすいかたちをめざして", "よりよいかたちをめざして"],
  ["地域の人の意見も取り入れて", "周りの意見も聞きながら", "ちいきのひとのいけんもとりいれて", "まわりのいけんもききながら"],
  ["環境への負担を減らすため", "無理なく続けられるように", "かんきょうへのふたんをへらすため", "むりなくつづけられるように"],
  ["次の世代へ引き継げるよう", "次の人へ引き継げるように", "つぎのせだいへひきつげるよう", "つぎのひとへひきつげるように"],
  ["一番困っている人を想像して", "一番困る場面を想像して", "いちばんこまっているひとをそうぞうして", "いちばんこまるばめんをそうぞうして"],
  ["仕組みを長く続けるために", "長く続ける方法を考えながら", "しくみをながくつづけるために", "ながくつづけるほうほうをかんがえながら"],
];

const suffixReplacements: Replacement[] = [
  ["。気づいた点をノートに残します。", "。", "。きづいたてんをのーとにのこします。", "。"],
  ["。結果をもう一度確かめます。", "。", "。けっかをもういちどたしかめます。", "。"],
  ["。時刻も一緒に記録します。", "。", "。じこくもいっしょにきろくします。", "。"],
  ["。違いが出た理由を考えます。", "。", "。ちがいがでたりゆうをかんがえます。", "。"],
  ["。使い終わったら元へ戻します。", "。", "。つかいおわったらもとへもどします。", "。"],
  ["。変化がないか確かめます。", "。", "。へんかがないかたしかめます。", "。"],
  ["。条件は変えません。", "。", "。じょうけんはかえません。", "。"],
  ["。結果を短くまとめます。", "。", "。けっかをみじかくまとめます。", "。"],
  ["。気づきを一つ残します。", "。", "。きづきをひとつのこします。", "。"],

  ["。終わったら担当者へ共有します。", "。", "。おわったらたんとうしゃへきょうゆうします。", "。"],
  ["。記録も残します。", "。", "。きろくものこします。", "。"],
  ["。もう一度見直します。", "。", "。もういちどみなおします。", "。"],
  ["。日付も確認します。", "。", "。ひづけもかくにんします。", "。"],
  ["。結果を報告します。", "。", "。けっかをほうこくします。", "。"],
  ["。要点をメモします。", "。", "。ようてんをめもします。", "。"],

  ["。その理由も記録します。", "。", "。そのりゆうもきろくします。", "。"],
  ["。結果を次の案へ反映します。", "。", "。けっかをつぎのあんへはんえいします。", "。"],
  ["。判断した理由も残します。", "。", "。はんだんしたりゆうものこします。", "。"],
  ["。学んだことを一つ残します。", "。", "。まなんだことをひとつのこします。", "。"],
];

function replacePrefix(text: string, reading: string): [string, string] {
  for (const [textFrom, textTo, readingFrom, readingTo] of prefixReplacements) {
    if (text.startsWith(textFrom) && reading.startsWith(readingFrom)) {
      return [textTo + text.slice(textFrom.length), readingTo + reading.slice(readingFrom.length)];
    }
  }
  return [text, reading];
}

function replaceSuffix(text: string, reading: string): [string, string] {
  for (const [textFrom, textTo, readingFrom, readingTo] of suffixReplacements) {
    if (text.endsWith(textFrom) && reading.endsWith(readingFrom)) {
      return [
        text.slice(0, -textFrom.length) + textTo,
        reading.slice(0, -readingFrom.length) + readingTo,
      ];
    }
  }
  return [text, reading];
}

function findPhraseContext(catalog: ContentCatalog, missionId: string) {
  const mission = catalog.missions.find((item) => item.id === missionId);
  if (!mission) throw new Error(`Mission not found for ${missionId}`);
  const district = catalog.districts.find((item) => item.id === mission.districtId);
  if (!district) throw new Error(`District not found for ${missionId}`);
  const zoneSource = zoneSources.find((zone) => zone.id === mission.zoneId);
  const districtSource = zoneSource?.districts.find((item) => item.name === district.name);
  if (!districtSource) throw new Error(`District source not found for ${missionId}`);
  return { mission, district, districtSource };
}

function replaceWithAlternateScene(
  catalog: ContentCatalog,
  currentPhrase: ContentCatalog["phrases"][number],
  text: string,
  reading: string,
): [string, string] {
  if (currentPhrase.order <= 10) return [text, reading];

  const { mission, district, districtSource } = findPhraseContext(catalog, currentPhrase.missionId);
  const stageIndex = (mission.number - 1) % 10;
  const localOrderIndex = (currentPhrase.order - 1) % 10;
  const wordIndex = (stageIndex + localOrderIndex) % districtSource.words.length;
  const word: TextReading | undefined = districtSource.words[wordIndex];
  if (!word) throw new Error(`Source word not found for ${currentPhrase.id}`);

  const textWordIndex = text.lastIndexOf(word.text);
  const readingWordIndex = reading.lastIndexOf(word.reading);
  if (textWordIndex < 0 || readingWordIndex < 0) {
    throw new Error(`Cannot locate source word for alternate scene: ${currentPhrase.id} / ${word.text}`);
  }

  const alternate = buildAlternateScene(district.name, word, wordIndex);
  const punctuation = mission.level >= 3 ? "。" : "";
  return [
    `${text.slice(0, textWordIndex)}${alternate.text}${punctuation}`,
    `${reading.slice(0, readingWordIndex)}${alternate.reading}${punctuation}`,
  ];
}

export function polishPhrases(catalog: ContentCatalog): ContentCatalog {
  const phrases = catalog.phrases.map((currentPhrase) => {
    let [text, reading] = replacePrefix(currentPhrase.text, currentPhrase.reading);
    [text, reading] = replaceSuffix(text, reading);
    [text, reading] = replaceWithAlternateScene(catalog, currentPhrase, text, reading);
    return {
      ...currentPhrase,
      text,
      reading,
      romanization: toCanonicalRoman(reading),
    };
  });
  return { ...catalog, phrases };
}
