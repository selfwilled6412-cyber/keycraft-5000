import { toCanonicalRoman } from "../src/core/typing/romanization";
import { missionStages, zoneSources } from "../src/content/source";
import type { ContentCatalog, TextReading } from "../src/content/types";

interface PhraseContext {
  district: TextReading;
  focus: TextReading;
  words: TextReading[];
}

const phrase = (text: string, reading: string): TextReading => ({ text, reading });
const at = (context: PhraseContext, index: number): TextReading =>
  context.words[index % context.words.length] ?? context.words[0]!;

function levelOne(context: PhraseContext): TextReading[] {
  const d = context.district;
  const f = context.focus;
  const w = (index: number) => at(context, index);
  return [
    phrase(`${d.text}で${w(0).text}を見つける`, `${d.reading}で${w(0).reading}をみつける`),
    phrase(`${w(1).text}の名前を覚える`, `${w(1).reading}のなまえをおぼえる`),
    phrase(`${w(2).text}と${w(3).text}を比べる`, `${w(2).reading}と${w(3).reading}をくらべる`),
    phrase(`朝に${w(4).text}を確かめる`, `あさに${w(4).reading}をたしかめる`),
    phrase(`${w(5).text}を友達に見せる`, `${w(5).reading}をともだちにみせる`),
    phrase(`${w(6).text}を探しながら${d.text}を歩く`, `${w(6).reading}をさがしながら${d.reading}をあるく`),
    phrase(`${w(7).text}を目印に進む`, `${w(7).reading}をめじるしにすすむ`),
    phrase(`${w(8).text}の近くで休む`, `${w(8).reading}のちかくでやすむ`),
    phrase(`${w(9).text}について話す`, `${w(9).reading}についてはなす`),
    phrase(`${w(0).text}をノートに書く`, `${w(0).reading}をのーとにかく`),
    phrase(`昼に${w(1).text}をもう一度見る`, `ひるに${w(1).reading}をもういちどみる`),
    phrase(`${w(2).text}を大切に使う`, `${w(2).reading}をたいせつにつかう`),
    phrase(`${w(3).text}の場所を覚える`, `${w(3).reading}のばしょをおぼえる`),
    phrase(`${w(4).text}を見つけて笑顔になる`, `${w(4).reading}をみつけてえがおになる`),
    phrase(`${w(5).text}をみんなに紹介する`, `${w(5).reading}をみんなにしょうかいする`),
    phrase(`${w(6).text}と${w(7).text}を探しに行く`, `${w(6).reading}と${w(7).reading}をさがしにいく`),
    phrase(`${w(8).text}を見ながら帰る`, `${w(8).reading}をみながらかえる`),
    phrase(`${f.text}の場所を確かめる`, `${f.reading}のばしょをたしかめる`),
    phrase(`${w(9).text}を覚えて${f.text}へ進む`, `${w(9).reading}をおぼえて${f.reading}へすすむ`),
    phrase(`${f.text}ができたら${w(0).text}を見に行く`, `${f.reading}ができたら${w(0).reading}をみにいく`),
  ];
}

function levelTwo(context: PhraseContext): TextReading[] {
  const d = context.district;
  const f = context.focus;
  const w = (index: number) => at(context, index);
  return [
    phrase(`${w(0).text}を手がかりに次の場所を探そう`, `${w(0).reading}をてがかりにつぎのばしょをさがそう`),
    phrase(`${w(1).text}と${w(2).text}を比べて好きな方を選ぶ`, `${w(1).reading}と${w(2).reading}をくらべてすきなほうをえらぶ`),
    phrase(`${w(3).text}を忘れずに${d.text}へ出発する`, `${w(3).reading}をわすれずに${d.reading}へしゅっぱつする`),
    phrase(`${w(4).text}を見つけたら仲間に知らせる`, `${w(4).reading}をみつけたらなかまにしらせる`),
    phrase(`${d.text}の地図に${w(5).text}の場所を書き込む`, `${d.reading}のちずに${w(5).reading}のばしょをかきこむ`),
    phrase(`${w(6).text}と${w(7).text}を組み合わせて新しい遊びを考える`, `${w(6).reading}と${w(7).reading}をくみあわせてあたらしいあそびをかんがえる`),
    phrase(`${w(8).text}を見つけるまで別の道も試す`, `${w(8).reading}をみつけるまでべつのみちもためす`),
    phrase(`${w(9).text}の特徴を覚えて次へ進む`, `${w(9).reading}のとくちょうをおぼえてつぎへすすむ`),
    phrase(`${w(0).text}の情報を短くまとめる`, `${w(0).reading}のじょうほうをみじかくまとめる`),
    phrase(`${w(1).text}について友達と話してみる`, `${w(1).reading}についてともだちとはなしてみる`),
    phrase(`${w(2).text}と${w(3).text}の違いを探す`, `${w(2).reading}と${w(3).reading}のちがいをさがす`),
    phrase(`${w(4).text}を目印に知らない道へ進む`, `${w(4).reading}をめじるしにしらないみちへすすむ`),
    phrase(`${w(5).text}の使い方をみんなで決める`, `${w(5).reading}のつかいかたをみんなできめる`),
    phrase(`${w(6).text}の写真を今日の記録に残す`, `${w(6).reading}のしゃしんをきょうのきろくにのこす`),
    phrase(`${w(7).text}について調べたことを案内に加える`, `${w(7).reading}についてしらべたことをあんないにくわえる`),
    phrase(`${w(8).text}を探して現在地を確かめる`, `${w(8).reading}をさがしてげんざいちをたしかめる`),
    phrase(`${w(9).text}をもう一度見て気づきを増やす`, `${w(9).reading}をもういちどみてきづきをふやす`),
    phrase(`${f.text}に合うアイデアを一つ選ぶ`, `${f.reading}にあうあいであをひとつえらぶ`),
    phrase(`${w(0).text}と${w(4).text}から思いついたことを${f.text}で試す`, `${w(0).reading}と${w(4).reading}からおもいついたことを${f.reading}でためす`),
    phrase(`${f.text}が完成したら次の景色を見に行こう`, `${f.reading}がかんせいしたらつぎのけしきをみにいこう`),
  ];
}

function levelThree(context: PhraseContext): TextReading[] {
  const d = context.district;
  const f = context.focus;
  const w = (index: number) => at(context, index);
  return [
    phrase(`${d.text}で${w(0).text}を観察し、最初に気づいた特徴を記録します。`, `${d.reading}で${w(0).reading}をかんさつし、さいしょにきづいたとくちょうをきろくします。`),
    phrase(`${w(1).text}と${w(2).text}を同じ条件で比べ、違いを表にまとめます。`, `${w(1).reading}と${w(2).reading}をおなじじょうけんでくらべ、ちがいをひょうにまとめます。`),
    phrase(`${w(3).text}がどのように変化するか、時間を決めて確かめます。`, `${w(3).reading}がどのようにへんかするか、じかんをきめてたしかめます。`),
    phrase(`${w(4).text}について分からない言葉を調べ、意味をメモします。`, `${w(4).reading}についてわからないことばをしらべ、いみをめもします。`),
    phrase(`${w(5).text}から予想したことを、実際の結果と比べます。`, `${w(5).reading}からよそうしたことを、じっさいのけっかとくらべます。`),
    phrase(`${d.text}で集めた${w(6).text}の情報を、見やすい順番に並べます。`, `${d.reading}であつめた${w(6).reading}のじょうほうを、みやすいじゅんばんにならべます。`),
    phrase(`${w(7).text}の仕組みを知るため、小さな疑問を一つ選びます。`, `${w(7).reading}のしくみをしるため、ちいさなぎもんをひとつえらびます。`),
    phrase(`${w(8).text}を安全に確かめる方法を、始める前に考えます。`, `${w(8).reading}をあんぜんにたしかめるほうほうを、はじめるまえにかんがえます。`),
    phrase(`${w(9).text}の様子を、短い文章で分かりやすく伝えます。`, `${w(9).reading}のようすを、みじかいぶんしょうでわかりやすくつたえます。`),
    phrase(`${w(0).text}について調べた結果を、新しい展示に反映します。`, `${w(0).reading}についてしらべたけっかを、あたらしいてんじにはんえいします。`),
    phrase(`${w(1).text}をもう一度観察し、最初の予想と違う点を探します。`, `${w(1).reading}をもういちどかんさつし、さいしょのよそうとちがうてんをさがします。`),
    phrase(`${w(2).text}と${w(5).text}の関係を考え、地図にメモを残します。`, `${w(2).reading}と${w(5).reading}のかんけいをかんがえ、ちずにめもをのこします。`),
    phrase(`${w(3).text}の特徴を、初めて見る人にも伝わる言葉に直します。`, `${w(3).reading}のとくちょうを、はじめてみるひとにもつたわることばになおします。`),
    phrase(`${w(4).text}を調べる手順を決め、順番どおりに試します。`, `${w(4).reading}をしらべるてじゅんをきめ、じゅんばんどおりにためします。`),
    phrase(`${w(6).text}の記録から、${d.text}で起きている変化を考えます。`, `${w(6).reading}のきろくから、${d.reading}でおきているへんかをかんがえます。`),
    phrase(`${w(7).text}について仲間と話し、それぞれの予想を比べます。`, `${w(7).reading}についてなかまとはなし、それぞれのよそうをくらべます。`),
    phrase(`${w(8).text}の情報を選び、必要な内容だけに整理します。`, `${w(8).reading}のじょうほうをえらび、ひつようなないようだけにせいりします。`),
    phrase(`${w(9).text}を観察した記録を、次の調査にも使える形で残します。`, `${w(9).reading}をかんさつしたきろくを、つぎのちょうさにもつかえるかたちでのこします。`),
    phrase(`${f.text}の説明に${w(0).text}の発見を加え、読みやすく整えます。`, `${f.reading}のせつめいに${w(0).reading}のはっけんをくわえ、よみやすくととのえます。`),
    phrase(`${f.text}が完成したら、新しく生まれた疑問を次の課題にします。`, `${f.reading}がかんせいしたら、あたらしくうまれたぎもんをつぎのかだいにします。`),
  ];
}

function levelFour(context: PhraseContext): TextReading[] {
  const d = context.district;
  const f = context.focus;
  const w = (index: number) => at(context, index);
  return [
    phrase(`${d.text}の今日の予定を確認し、${w(0).text}に関する作業から進めます。`, `${d.reading}のきょうのよていをかくにんし、${w(0).reading}にかんするさぎょうからすすめます。`),
    phrase(`${w(1).text}の資料は午後3時までに共有し、担当者にも知らせます。`, `${w(1).reading}のしりょうはごご3じまでにきょうゆうし、たんとうしゃにもしらせます。`),
    phrase(`初めて利用する方へ、${w(2).text}の場所と使い方を案内します。`, `はじめてりようするかたへ、${w(2).reading}のばしょとつかいかたをあんないします。`),
    phrase(`${w(3).text}の内容に変更がないか、公開前にもう一度確認します。`, `${w(3).reading}のないようにへんこうがないか、こうかいまえにもういちどかくにんします。`),
    phrase(`${w(4).text}について届いた意見を整理し、次の改善案に反映します。`, `${w(4).reading}についてとどいたいけんをせいりし、つぎのかいぜんあんにはんえいします。`),
    phrase(`質問を受けたときは、${w(5).text}の内容を確かめてから返答します。`, `しつもんをうけたときは、${w(5).reading}のないようをたしかめてからへんとうします。`),
    phrase(`${w(6).text}の数を確認し、不足している分だけ準備します。`, `${w(6).reading}のかずをかくにんし、ふそくしているぶんだけじゅんびします。`),
    phrase(`${w(7).text}を紹介する文章は、初めての人にも伝わる表現に直します。`, `${w(7).reading}をしょうかいするぶんしょうは、はじめてのひとにもつたわるひょうげんになおします。`),
    phrase(`作業が終わったら、${w(8).text}の進み具合を記録して報告します。`, `さぎょうがおわったら、${w(8).reading}のすすみぐあいをきろくしてほうこくします。`),
    phrase(`${w(9).text}について話すときは、相手の話を最後まで聞きます。`, `${w(9).reading}についてはなすときは、あいてのはなしをさいごまでききます。`),
    phrase(`${w(0).text}の写真には、内容が分かる短い説明を添えます。`, `${w(0).reading}のしゃしんには、ないようがわかるみじかいせつめいをそえます。`),
    phrase(`会議は10時開始です。${w(1).text}の資料を確認して5分前に準備を終えます。`, `かいぎは10じかいしです。${w(1).reading}のしりょうをかくにんして5ふんまえにじゅんびをおえます。`),
    phrase(`${w(2).text}の在庫を確かめ、必要な数だけ追加で注文します。`, `${w(2).reading}のざいこをたしかめ、ひつようなかずだけついかでちゅうもんします。`),
    phrase(`${w(3).text}の情報は、日付と出典を確認してから更新します。`, `${w(3).reading}のじょうほうは、ひづけとしゅってんをかくにんしてからこうしんします。`),
    phrase(`${w(4).text}についていただいた意見を、使いやすさの改善に生かします。`, `${w(4).reading}についていただいたいけんを、つかいやすさのかいぜんにいかします。`),
    phrase(`受付では、${w(5).text}に関する確認事項を一つずつ案内します。`, `うけつけでは、${w(5).reading}にかんするかくにんじこうをひとつずつあんないします。`),
    phrase(`${w(6).text}の担当が変わったため、連絡先と引き継ぎ内容を更新しました。`, `${w(6).reading}のたんとうがかわったため、れんらくさきとひきつぎないようをこうしんしました。`),
    phrase(`${w(7).text}に関する要点を3つ選び、共有資料に短くまとめます。`, `${w(7).reading}にかんするようてんを3つえらび、きょうゆうしりょうにみじかくまとめます。`),
    phrase(`${w(8).text}の準備が整ったら、${f.text}の担当者へ完了を報告します。`, `${w(8).reading}のじゅんびがととのったら、${f.reading}のたんとうしゃへかんりょうをほうこくします。`),
    phrase(`${f.text}が完成した後も、${w(9).text}を使う人の声を集めて改善を続けます。`, `${f.reading}がかんせいしたあとも、${w(9).reading}をつかうひとのこえをあつめてかいぜんをつづけます。`),
  ];
}

function levelFive(context: PhraseContext): TextReading[] {
  const d = context.district;
  const f = context.focus;
  const w = (index: number) => at(context, index);
  return [
    phrase(`${d.text}の未来を考えるため、${w(0).text}が暮らしに与える変化を整理します。`, `${d.reading}のみらいをかんがえるため、${w(0).reading}がくらしにあたえるへんかをせいりします。`),
    phrase(`${w(1).text}を長く使い続ける方法を考え、環境への配慮も加えます。`, `${w(1).reading}をながくつかいつづけるほうほうをかんがえ、かんきょうへのはいりょもくわえます。`),
    phrase(`${w(2).text}を導入する前に、便利さだけでなく安全性と管理方法も確認します。`, `${w(2).reading}をどうにゅうするまえに、べんりさだけでなくあんぜんせいとかんりほうほうもかくにんします。`),
    phrase(`${w(3).text}を多くの人が使えるよう、案内を短い言葉で整えます。`, `${w(3).reading}をおおくのひとがつかえるよう、あんないをみじかいことばでととのえます。`),
    phrase(`${w(4).text}について集めたデータを比較し、次に優先する課題を決めます。`, `${w(4).reading}についてあつめたでーたをひかくし、つぎにゆうせんするかだいをきめます。`),
    phrase(`${w(5).text}を試すときは、詳しい人と利用する人の両方から意見を集めます。`, `${w(5).reading}をためすときは、くわしいひととりようするひとのりょうほうからいけんをあつめます。`),
    phrase(`${w(6).text}を3つの視点から確認し、問題が起きた場合の対応も準備します。`, `${w(6).reading}を3つのしてんからかくにんし、もんだいがおきたばあいのたいおうもじゅんびします。`),
    phrase(`${w(7).text}の価値を未来へ残すため、今できることと長く続けることを分けます。`, `${w(7).reading}のかちをみらいへのこすため、いまできることとながくつづけることをわけます。`),
    phrase(`${w(8).text}を利用する人の動きを想像し、分かりにくい表示を改善します。`, `${w(8).reading}をりようするひとのうごきをそうぞうし、わかりにくいひょうじをかいぜんします。`),
    phrase(`${w(9).text}の記録を、誰でも確認できる形で残す方法を決めます。`, `${w(9).reading}のきろくを、だれでもかくにんできるかたちでのこすほうほうをきめます。`),
    phrase(`${w(0).text}と${w(1).text}を組み合わせた案を説明し、利用者の意見を聞きます。`, `${w(0).reading}と${w(1).reading}をくみあわせたあんをせつめいし、りようしゃのいけんをききます。`),
    phrase(`${w(2).text}の費用、効果、続けやすさを比べ、判断材料をそろえます。`, `${w(2).reading}のひよう、こうか、つづけやすさをくらべ、はんだんざいりょうをそろえます。`),
    phrase(`${w(3).text}を活用するときは、便利な点と注意点を同じ資料にまとめます。`, `${w(3).reading}をかつようするときは、べんりなてんとちゅういてんをおなじしりょうにまとめます。`),
    phrase(`${w(4).text}について意見が分かれたときは、目的に戻って共通点から整理します。`, `${w(4).reading}についていけんがわかれたときは、もくてきにもどってきょうつうてんからせいりします。`),
    phrase(`${w(5).text}の変化を予測するため、過去の記録と現在のデータを比べます。`, `${w(5).reading}のへんかをよそくするため、かこのきろくとげんざいのでーたをくらべます。`),
    phrase(`${w(6).text}を次の世代へ引き継ぐため、使い方と判断した理由を残します。`, `${w(6).reading}をつぎのせだいへひきつぐため、つかいかたとはんだんしたりゆうをのこします。`),
    phrase(`${w(7).text}の新しい可能性を考え、守るルールと試せる範囲を決めます。`, `${w(7).reading}のあたらしいかのうせいをかんがえ、まもるるーるとためせるはんいをきめます。`),
    phrase(`${w(8).text}に関する小さな不便を集め、優先度の高いものから改善します。`, `${w(8).reading}にかんするちいさなふべんをあつめ、ゆうせんどのたかいものからかいぜんします。`),
    phrase(`${f.text}を公開する前に、${w(9).text}を初めて知る人にも伝わるか確認します。`, `${f.reading}をこうかいするまえに、${w(9).reading}をはじめてしるひとにもつたわるかかくにんします。`),
    phrase(`${f.text}が完成したら、${d.text}で得た学びを次に作る世界へ生かします。`, `${f.reading}がかんせいしたら、${d.reading}でえたまなびをつぎにつくるせかいへいかします。`),
  ];
}

const builders = [levelOne, levelTwo, levelThree, levelFour, levelFive] as const;

export function diversifyPhrases(catalog: ContentCatalog): ContentCatalog {
  const used = new Set<string>();
  const phrases = catalog.phrases.map((currentPhrase) => {
    const mission = catalog.missions.find((item) => item.id === currentPhrase.missionId);
    if (!mission) throw new Error(`Mission not found for ${currentPhrase.id}`);
    const district = catalog.districts.find((item) => item.id === mission.districtId);
    if (!district) throw new Error(`District not found for ${currentPhrase.id}`);
    const zoneSource = zoneSources.find((zone) => zone.id === mission.zoneId);
    const districtSource = zoneSource?.districts.find((item) => item.name === district.name);
    if (!districtSource) throw new Error(`District source not found for ${currentPhrase.id}`);

    const stageIndex = (mission.number - 1) % missionStages.length;
    const stage = missionStages[stageIndex];
    if (!stage) throw new Error(`Mission stage not found for ${currentPhrase.id}`);
    const offset = (stageIndex * 3) % districtSource.words.length;
    const rotatedWords = districtSource.words.map((_, index) =>
      districtSource.words[(offset + index) % districtSource.words.length]!,
    );
    const context: PhraseContext = {
      district: { text: district.name, reading: district.reading },
      focus: {
        text: `${district.name}の${stage.rewardSuffix.text}`,
        reading: `${district.reading}の${stage.rewardSuffix.reading}`,
      },
      words: rotatedWords,
    };
    const builder = builders[mission.level - 1];
    if (!builder) throw new Error(`Phrase builder not found for level ${mission.level}`);
    const replacements = builder(context);
    const replacement = replacements[currentPhrase.order - 1];
    if (!replacement) throw new Error(`Replacement phrase not found for ${currentPhrase.id}`);

    let finalText = replacement.text;
    let finalReading = replacement.reading;
    if (used.has(finalText)) {
      finalText = `${district.name}で${finalText}`;
      finalReading = `${district.reading}で${finalReading}`;
    }
    if (used.has(finalText)) {
      finalText = `${context.focus.text}で${finalText}`;
      finalReading = `${context.focus.reading}で${finalReading}`;
    }
    if (used.has(finalText)) throw new Error(`Duplicate diversified phrase: ${finalText}`);
    used.add(finalText);

    return {
      ...currentPhrase,
      text: finalText,
      reading: finalReading,
      romanization: toCanonicalRoman(finalReading),
    };
  });

  return { ...catalog, version: 2, phrases };
}
