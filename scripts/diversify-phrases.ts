import { toCanonicalRoman } from "../src/core/typing/romanization";
import { missionStages, zoneSources } from "../src/content/source";
import type { ContentCatalog, TextReading } from "../src/content/types";

const literal = (text: string, reading = text): TextReading => ({ text, reading });
const join = (...parts: TextReading[]): TextReading => ({
  text: parts.map((part) => part.text).join(""),
  reading: parts.map((part) => part.reading).join(""),
});

interface PhraseContext {
  district: TextReading;
  focus: TextReading;
  words: TextReading[];
}

const at = (context: PhraseContext, index: number): TextReading =>
  context.words[index % context.words.length] ?? context.words[0]!;

function levelOne(context: PhraseContext): TextReading[] {
  const d = context.district;
  const f = context.focus;
  const w = (index: number) => at(context, index);
  return [
    join(d, literal("で"), w(0), literal("を見つける", "をみつける")),
    join(w(1), literal("の名前を覚えて", "のなまえをおぼえて"), d, literal("を歩く", "をあるく")),
    join(d, literal("で"), w(2), literal("と"), w(3), literal("を比べる", "をくらべる")),
    join(f, literal("の近くで", "のちかくで"), w(4), literal("を探す", "をさがす")),
    join(w(5), literal("をノートに書いて", "をのーとにかいて"), d, literal("へ戻る", "へもどる")),
    join(d, literal("で"), w(6), literal("の写真を残す", "のしゃしんをのこす")),
    join(w(7), literal("を目印に", "をめじるしに"), f, literal("へ進む", "へすすむ")),
    join(d, literal("の"), w(8), literal("をみんなに紹介する", "をみんなにしょうかいする")),
    join(w(9), literal("を大切にして", "をたいせつにして"), d, literal("で過ごす", "ですごす")),
    join(f, literal("で"), w(0), literal("について話す", "についてはなす")),
    join(literal("朝は", "あさは"), d, literal("で"), w(1), literal("を確かめる", "をたしかめる")),
    join(w(2), literal("を見ながら", "をみながら"), f, literal("でひと休みする", "でひとやすみする")),
    join(d, literal("で"), w(3), literal("の新しい見方を考える", "のあたらしいみかたをかんがえる")),
    join(w(4), literal("について"), d, literal("で聞いてみる", "できいてみる")),
    join(f, literal("に"), w(5), literal("の案内を置く", "のあんないをおく")),
    join(d, literal("で"), w(6), literal("をもう一度探す", "をもういちどさがす")),
    join(w(7), literal("と"), w(8), literal("を覚えて", "をおぼえて"), f, literal("へ進む", "へすすむ")),
    join(d, literal("の帰りに", "のかえりに"), w(9), literal("を思い出す", "をおもいだす")),
    join(f, literal("ができたら友達に知らせる", "ができたらともだちにしらせる")),
    join(d, literal("で見つけた", "でみつけた"), w(1), literal("を友達に伝える", "をともだちにつたえる")),
  ];
}

function levelTwo(context: PhraseContext): TextReading[] {
  const d = context.district;
  const f = context.focus;
  const w = (index: number) => at(context, index);
  return [
    join(d, literal("で"), w(0), literal("を手がかりに次の場所を探そう", "をてがかりにつぎのばしょをさがそう")),
    join(d, literal("で"), w(1), literal("と"), w(2), literal("を比べて気になる方を選ぶ", "をくらべてきになるほうをえらぶ")),
    join(f, literal("へ向かう前に", "へむかうまえに"), w(3), literal("を忘れていないか確かめる", "をわすれていないかたしかめる")),
    join(w(4), literal("を見つけたら", "をみつけたら"), d, literal("の仲間に声をかける", "のなかまにこえをかける")),
    join(d, literal("の地図に", "のちずに"), w(5), literal("の場所を書き込む", "のばしょをかきこむ")),
    join(w(6), literal("と"), w(7), literal("を組み合わせて"), f, literal("のアイデアを考える", "のあいであをかんがえる")),
    join(d, literal("で"), w(8), literal("を見つけるまで別の道も試してみる", "をみつけるまでべつのみちもためしてみる")),
    join(w(9), literal("の特徴を覚えて", "のとくちょうをおぼえて"), f, literal("の近くまで進む", "のちかくまですすむ")),
    join(d, literal("で集めた", "であつめた"), w(0), literal("の情報を短くまとめる", "のじょうほうをみじかくまとめる")),
    join(f, literal("の前で"), w(1), literal("について友達と話してみる", "についてともだちとはなしてみる")),
    join(d, literal("を歩きながら", "をあるきながら"), w(2), literal("と"), w(3), literal("の違いを探す", "のちがいをさがす")),
    join(w(4), literal("を目印にして", "をめじるしにして"), d, literal("の知らない場所へ行ってみる", "のしらないばしょへいってみる")),
    join(f, literal("に合う", "にあう"), w(5), literal("の使い方をみんなで決める", "のつかいかたをみんなできめる")),
    join(d, literal("で"), w(6), literal("の写真を撮り今日の記録に残す", "のしゃしんをとりきょうのきろくにのこす")),
    join(w(7), literal("について調べたことを", "についてしらべたことを"), f, literal("の案内に加える", "のあんないにくわえる")),
    join(d, literal("で迷ったら", "でまよったら"), w(8), literal("を探して現在地を確かめる", "をさがしてげんざいちをたしかめる")),
    join(f, literal("が見えてきたら", "がみえてきたら"), w(9), literal("をもう一度確認する", "をもういちどかくにんする")),
    join(d, literal("のおすすめとして", "のおすすめとして"), w(0), literal("を一つ選んで紹介する", "をひとつえらんでしょうかいする")),
    join(w(1), literal("と"), w(4), literal("から思いついたことを", "からおもいついたことを"), f, literal("で試す", "でためす")),
    join(f, literal("を完成させたら", "をかんせいさせたら"), d, literal("の次の景色を見に行こう", "のつぎのけしきをみにいこう")),
  ];
}

function levelThree(context: PhraseContext): TextReading[] {
  const d = context.district;
  const f = context.focus;
  const w = (index: number) => at(context, index);
  return [
    join(d, literal("で"), w(0), literal("を観察し、最初に気づいた特徴を記録します。", "をかんさつし、さいしょにきづいたとくちょうをきろくします。")),
    join(w(1), literal("と"), w(2), literal("を同じ条件で比べ、違いを表にまとめます。", "をおなじじょうけんでくらべ、ちがいをひょうにまとめます。")),
    join(f, literal("の周りで", "のまわりで"), w(3), literal("がどのように変化するか確かめます。", "がどのようにへんかするかたしかめます。")),
    join(d, literal("の案内を読み、"), w(4), literal("について分からない言葉を調べます。", "についてわからないことばをしらべます。")),
    join(w(5), literal("から予想したことを、"), f, literal("で実際に確かめてみます。", "でじっさいにたしかめてみます。")),
    join(d, literal("で集めた", "であつめた"), w(6), literal("の情報を、見やすい順番に並べ直します。", "のじょうほうを、みやすいじゅんばんにならべなおします。")),
    join(w(7), literal("の仕組みを知るため、"), d, literal("で小さな疑問を一つ選びます。", "でちいさなぎもんをひとつえらびます。")),
    join(f, literal("を作る前に、"), w(8), literal("について安全に確かめる方法を考えます。", "についてあんぜんにたしかめるほうほうをかんがえます。")),
    join(d, literal("から見える", "からみえる"), w(9), literal("の様子を、短い文章で分かりやすく伝えます。", "のようすを、みじかいぶんしょうでわかりやすくつたえます。")),
    join(w(0), literal("について調べた結果を、"), f, literal("の新しい展示に反映します。", "のあたらしいてんじにはんえいします。")),
    join(d, literal("で"), w(1), literal("をもう一度観察し、最初の予想と違った点を探します。", "をもういちどかんさつし、さいしょのよそうとちがったてんをさがします。")),
    join(w(2), literal("と"), w(5), literal("の関係を考えながら、"), f, literal("の地図にメモを残します。", "のかんけいをかんがえながら、のちずにめもをのこします。")),
    join(d, literal("で見つけた", "でみつけた"), w(3), literal("の特徴を、別の人にも伝わる言葉に直します。", "のとくちょうを、べつのひとにもつたわることばになおします。")),
    join(f, literal("の近くで", "のちかくで"), w(4), literal("を調べる手順を決め、順番どおりに試します。", "をしらべるてじゅんをきめ、じゅんばんどおりにためします。")),
    join(w(6), literal("について集めた記録から、"), d, literal("で起きている変化を考えます。", "についてあつめたきろくから、でおきているへんかをかんがえます。")),
    join(d, literal("の仲間と", "のなかまと"), w(7), literal("について話し、それぞれの予想を比べます。", "についてはなし、それぞれのよそうをくらべます。")),
    join(f, literal("に必要な", "にひつような"), w(8), literal("の情報を選び、余分な内容を整理します。", "のじょうほうをえらび、よぶんなないようをせいりします。")),
    join(w(9), literal("を観察した記録を", "をかんさつしたきろくを"), d, literal("の次の調査にも使える形で残します。", "のつぎのちょうさにもつかえるかたちでのこします。")),
    join(d, literal("で得た発見を", "でえたはっけんを"), f, literal("の説明に加え、読みやすく整えます。", "のせつめいにくわえ、よみやすくととのえます。")),
    join(f, literal("が完成したら、"), w(0), literal("について新しく生まれた疑問を次の課題にします。", "がかんせいしたら、についてあたらしくうまれたぎもんをつぎのかだいにします。")),
  ];
}

function levelFour(context: PhraseContext): TextReading[] {
  const d = context.district;
  const f = context.focus;
  const w = (index: number) => at(context, index);
  return [
    join(d, literal("の今日の予定を確認し、"), w(0), literal("に関する作業から順番に進めます。", "のきょうのよていをかくにんし、にかんするさぎょうからじゅんばんにすすめます。")),
    join(w(1), literal("の資料は午後3時までに共有し、"), f, literal("の担当者にも知らせます。", "のしりょうはごご3じまでにきょうゆうし、のたんとうしゃにもしらせます。")),
    join(d, literal("を初めて利用する方へ、"), w(2), literal("の場所と使い方を分かりやすく案内します。", "をはじめてりようするかたへ、のばしょとつかいかたをわかりやすくあんないします。")),
    join(f, literal("で扱う", "であつかう"), w(3), literal("の内容に変更がないか、公開前にもう一度確認します。", "のないようにへんこうがないか、こうかいまえにもういちどかくにんします。")),
    join(w(4), literal("について届いた意見を整理し、"), d, literal("の次の改善案に反映します。", "についてとどいたいけんをせいりし、のつぎのかいぜんあんにはんえいします。")),
    join(d, literal("で質問を受けたときは、"), w(5), literal("の内容を確認してから正確に返答します。", "でしつもんをうけたときは、のないようをかくにんしてからせいかくにへんとうします。")),
    join(f, literal("に必要な", "にひつような"), w(6), literal("の数を確認し、不足している分だけ準備します。", "のかずをかくにんし、ふそくしているぶんだけじゅんびします。")),
    join(w(7), literal("を紹介する文章は、"), d, literal("を知らない人にも伝わる表現に直します。", "をしょうかいするぶんしょうは、をしらないひとにもつたわるひょうげんになおします。")),
    join(literal("作業が終わったら、", "さぎょうがおわったら、"), w(8), literal("の進み具合を記録し、"), f, literal("の担当へ報告します。", "のすすみぐあいをきろくし、のたんとうへほうこくします。")),
    join(d, literal("の打ち合わせでは、"), w(9), literal("について相手の話を最後まで聞いてから意見を伝えます。", "のうちあわせでは、についてあいてのはなしをさいごまできいてからいけんをつたえます。")),
    join(f, literal("に掲載する", "にけいさいする"), w(0), literal("の写真には、内容が分かる短い説明を添えます。", "のしゃしんには、ないようがわかるみじかいせつめいをそえます。")),
    join(d, literal("の会議は10時開始です。"), w(1), literal("の資料を確認して5分前に準備を終えます。", "のかいぎは10じかいしです。のしりょうをかくにんして5ふんまえにじゅんびをおえます。")),
    join(w(2), literal("の在庫を確かめ、"), f, literal("に必要な数だけ追加で注文します。", "のざいこをたしかめ、にひつようなかずだけついかでちゅうもんします。")),
    join(d, literal("で扱う", "であつかう"), w(3), literal("の情報は、日付と出典を確認してから更新します。", "のじょうほうは、ひづけとしゅってんをかくにんしてからこうしんします。")),
    join(w(4), literal("についていただいた意見を、"), f, literal("を使いやすくするための改善に生かします。", "についていただいたいけんを、をつかいやすくするためのかいぜんにいかします。")),
    join(d, literal("の受付では、"), w(5), literal("に関する確認事項を一つずつ順番に案内します。", "のうけつけでは、にかんするかくにんじこうをひとつずつじゅんばんにあんないします。")),
    join(f, literal("で使う", "でつかう"), w(6), literal("の担当が変わったため、連絡先と引き継ぎ内容を更新しました。", "のたんとうがかわったため、れんらくさきとひきつぎないようをこうしんしました。")),
    join(d, literal("の共有資料から", "のきょうゆうしりょうから"), w(7), literal("に関する要点を3つ選び、短くまとめます。", "にかんするようてんを3つえらび、みじかくまとめます。")),
    join(w(8), literal("の準備が整ったら、"), f, literal("の担当者へ完了した内容を具体的に報告します。", "のじゅんびがととのったら、のたんとうしゃへかんりょうしたないようをぐたいてきにほうこくします。")),
    join(f, literal("が完成した後も、"), d, literal("で"), w(9), literal("を使う人の声を集めて改善を続けます。", "がかんせいしたあとも、でをつかうひとのこえをあつめてかいぜんをつづけます。")),
  ];
}

function levelFive(context: PhraseContext): TextReading[] {
  const d = context.district;
  const f = context.focus;
  const w = (index: number) => at(context, index);
  return [
    join(d, literal("の未来を考えるため、"), w(0), literal("が暮らしに与える変化と必要な工夫を整理します。", "のみらいをかんがえるため、がくらしにあたえるへんかとひつようなくふうをせいりします。")),
    join(w(1), literal("を長く使い続ける方法を考え、"), f, literal("の設計に環境への配慮を加えます。", "をながくつかいつづけるほうほうをかんがえ、のせっけいにかんきょうへのはいりょをくわえます。")),
    join(d, literal("で"), w(2), literal("を導入する前に、便利さだけでなく安全性と管理方法も確認します。", "でをどうにゅうするまえに、べんりさだけでなくあんぜんせいとかんりほうほうもかくにんします。")),
    join(f, literal("を多くの人が使えるよう、"), w(3), literal("に関する案内を短い言葉と分かりやすい表示で整えます。", "をおおくのひとがつかえるよう、にかんするあんないをみじかいことばとわかりやすいひょうじでととのえます。")),
    join(w(4), literal("について集めたデータを比較し、"), d, literal("の次の計画で優先する課題を決めます。", "についてあつめたでーたをひかくし、のつぎのけいかくでゆうせんするかだいをきめます。")),
    join(d, literal("の新しい仕組みを試すときは、"), w(5), literal("に詳しい人と利用する人の両方から意見を集めます。", "のあたらしいしくみをためすときは、にくわしいひととりようするひとのりょうほうからいけんをあつめます。")),
    join(f, literal("に必要な", "にひつような"), w(6), literal("を3つの視点から確認し、問題が起きた場合の対応も準備します。", "を3つのしてんからかくにんし、もんだいがおきたばあいのたいおうもじゅんびします。")),
    join(w(7), literal("の価値を未来へ残すため、"), d, literal("で今できることと長期的に続けることを分けて考えます。", "のかちをみらいへのこすため、でいまできることとちょうきてきにつづけることをわけてかんがえます。")),
    join(d, literal("で"), w(8), literal("を利用する人の動きを想像し、迷いやすい場所や分かりにくい表示を改善します。", "でをりようするひとのうごきをそうぞうし、まよいやすいばしょやわかりにくいひょうじをかいぜんします。")),
    join(f, literal("の完成後を想定し、"), w(9), literal("に関する記録を誰でも確認できる形で残す方法を決めます。", "のかんせいごをそうていし、にかんするきろくをだれでもかくにんできるかたちでのこすほうほうをきめます。")),
    join(w(0), literal("と"), w(1), literal("を組み合わせた案について、"), d, literal("の利用者に分かりやすく説明して意見を聞きます。", "をくみあわせたあんについて、のりようしゃにわかりやすくせつめいしていけんをききます。")),
    join(d, literal("の計画を更新する前に、"), w(2), literal("の費用、効果、続けやすさを比べて判断材料をそろえます。", "のけいかくをこうしんするまえに、のひよう、こうか、つづけやすさをくらべてはんだんざいりょうをそろえます。")),
    join(f, literal("で"), w(3), literal("を活用する場合は、便利な点と注意すべき点を同じ資料にまとめます。", "でをかつようするばあいは、べんりなてんとちゅういすべきてんをおなじしりょうにまとめます。")),
    join(w(4), literal("について異なる意見が出たときは、"), d, literal("の目的に戻って共通する部分から整理します。", "についてことなるいけんがでたときは、のもくてきにもどってきょうつうするぶぶんからせいりします。")),
    join(d, literal("で起きる変化を予測するため、"), w(5), literal("に関する過去の記録と現在のデータを照らし合わせます。", "でおきるへんかをよそくするため、にかんするかこのきろくとげんざいのでーたをてらしあわせます。")),
    join(f, literal("を次の世代へ引き継ぐため、"), w(6), literal("の使い方だけでなく判断した理由も文章で残します。", "をつぎのせだいへひきつぐため、のつかいかただけでなくはんだんしたりゆうもぶんしょうでのこします。")),
    join(w(7), literal("の新しい可能性を考えながら、"), d, literal("で守るべきルールと自由に試せる範囲を決めます。", "のあたらしいかのうせいをかんがえながら、でまもるべきるーるとじゆうにためせるはんいをきめます。")),
    join(d, literal("の完成度を高めるため、"), w(8), literal("に関する小さな不便を集め、優先度の高いものから改善します。", "のかんせいどをたかめるため、にかんするちいさなふべんをあつめ、ゆうせんどのたかいものからかいぜんします。")),
    join(f, literal("を公開する前に、"), w(9), literal("について初めて知る人にも内容が伝わるか最終確認します。", "をこうかいするまえに、についてはじめてしるひとにもないようがつたわるかさいしゅうかくにんします。")),
    join(f, literal("が完成したら、"), d, literal("で得た学びを振り返り、次に作る世界へ生かすことを決めます。", "がかんせいしたら、でえたまなびをふりかえり、つぎにつくるせかいへいかすことをきめます。")),
  ];
}

const builders = [levelOne, levelTwo, levelThree, levelFour, levelFive] as const;

export function diversifyPhrases(catalog: ContentCatalog): ContentCatalog {
  const used = new Set<string>();
  const phrases = catalog.phrases.map((phrase) => {
    const mission = catalog.missions.find((item) => item.id === phrase.missionId);
    if (!mission) throw new Error(`Mission not found for ${phrase.id}`);
    const district = catalog.districts.find((item) => item.id === mission.districtId);
    if (!district) throw new Error(`District not found for ${phrase.id}`);
    const zoneSource = zoneSources.find((zone) => zone.id === mission.zoneId);
    const districtSource = zoneSource?.districts.find((item) => item.name === district.name);
    if (!districtSource) throw new Error(`District source not found for ${phrase.id}`);

    const stageIndex = (mission.number - 1) % missionStages.length;
    const stage = missionStages[stageIndex];
    if (!stage) throw new Error(`Mission stage not found for ${phrase.id}`);
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
    const replacement = replacements[phrase.order - 1];
    if (!replacement) throw new Error(`Replacement phrase not found for ${phrase.id}`);
    if (used.has(replacement.text)) throw new Error(`Duplicate diversified phrase: ${replacement.text}`);
    used.add(replacement.text);

    return {
      ...phrase,
      text: replacement.text,
      reading: replacement.reading,
      romanization: toCanonicalRoman(replacement.reading),
    };
  });

  return { ...catalog, version: 2, phrases };
}
