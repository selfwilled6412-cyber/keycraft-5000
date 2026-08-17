import { toCanonicalRoman } from "../src/core/typing/romanization";
import { missionStages, zoneSources } from "../src/content/source";
import type { ContentCatalog, District, Mission, Phrase, TextReading } from "../src/content/types";

const join = (...parts: TextReading[]): TextReading => ({
  text: parts.map((part) => part.text).join(""),
  reading: parts.map((part) => part.reading).join(""),
});

const literal = (text: string, reading = text): TextReading => ({ text, reading });

function buildPhrases(level: number, focus: TextReading, a: TextReading, b: TextReading): TextReading[] {
  const f = focus;
  const templates: Record<number, TextReading[]> = {
    1: [
      f,
      join(f, literal("へ行く", "へいく")),
      join(f, literal("を見る", "をみる")),
      join(f, literal("を作る", "をつくる")),
      join(f, literal("を選ぶ", "をえらぶ")),
      join(f, literal("を飾る", "をかざる")),
      join(f, literal("を調べる", "をしらべる")),
      join(f, literal("で休む", "でやすむ")),
      join(a, literal("と"), f),
      join(f, literal("に"), a),
      join(literal("朝の", "あさの"), f),
      join(literal("昼の", "ひるの"), f),
      join(literal("夜の", "よるの"), f),
      join(f, literal("は明るい", "はあかるい")),
      join(f, literal("は楽しい", "はたのしい")),
      join(f, literal("ができた")),
      join(f, literal("へ進む", "へすすむ")),
      join(f, literal("で会おう", "であおう")),
      join(f, literal("を大切にする", "をたいせつにする")),
      join(literal("みんなの"), f),
    ],
    2: [
      join(f, literal("の準備をしよう", "のじゅんびをしよう")),
      join(a, literal("を持って", "をもって"), f, literal("へ行こう", "へいこう")),
      join(f, literal("で"), b, literal("を見つけよう", "をみつけよう")),
      join(f, literal("の入口を確かめる", "のいりぐちをたしかめる")),
      join(f, literal("に新しい道をつなぐ", "にあたらしいみちをつなぐ")),
      join(f, literal("では、"), a, literal("と"), b, literal("をきれいに並べる", "をきれいにならべる")),
      join(f, literal("の看板を読みやすくする", "のかんばんをよみやすくする")),
      join(f, literal("で楽しい時間を過ごす", "でたのしいじかんをすごす")),
      join(literal("今日も", "きょうも"), f, literal("を少し育てる", "をすこしそだてる")),
      join(f, literal("から次の場所へ向かう", "からつぎのばしょへむかう")),
      join(f, literal("の灯りをつけよう", "のあかりをつけよう")),
      join(a, literal("の案内を", "のあんないを"), f, literal("に置く", "におく")),
      join(f, literal("では笑顔で挨拶する", "ではえがおであいさつする")),
      join(f, literal("の道具を丁寧に使う", "のどうぐをていねいにつかう")),
      join(f, literal("に小さなベンチを置く", "にちいさなべんちをおく")),
      join(f, literal("の予定をノートに書く", "のよていをのーとにかく")),
      join(b, literal("の近くで", "のちかくで"), f, literal("を探す", "をさがす")),
      join(f, literal("をみんなで完成させる", "をみんなでかんせいさせる")),
      join(f, literal("の写真を一枚残す", "のしゃしんをいちまいのこす")),
      join(f, literal("が今日の目的地です", "がきょうのもくてきちです")),
    ],
    3: [
      join(f, literal("の計画を、みんなで確かめました。", "のけいかくを、みんなでたしかめました。")),
      join(f, literal("では、"), a, literal("を観察して、気づいたことを記録します。", "をかんさつして、きづいたことをきろくします。")),
      join(f, literal("には、"), b, literal("を紹介する場所があります。", "をしょうかいするばしょがあります。")),
      join(literal("新しい発見を", "あたらしいはっけんを"), f, literal("の地図に書き込みます。", "のちずにかきこみます。")),
      join(f, literal("の入口で、安全のための約束を確認します。", "のいりぐちで、あんぜんのためのやくそくをかくにんします。")),
      join(f, literal("では、"), a, literal("と"), b, literal("の違いを、ゆっくり比べてみましょう。", "のちがいを、ゆっくりくらべてみましょう。")),
      join(f, literal("で集めた情報を、見やすい表にまとめます。", "であつめたじょうほうを、みやすいひょうにまとめます。")),
      join(literal("分からない言葉は、", "わからないことばは、"), f, literal("の案内で調べられます。", "のあんないでしらべられます。")),
      join(f, literal("を完成させるため、作業の順番を決めました。", "をかんせいさせるため、さぎょうのじゅんばんをきめました。")),
      join(a, literal("を使った実験を、", "をつかったじっけんを、"), f, literal("で始めます。", "ではじめます。")),
      join(f, literal("から見える景色を、短い文章で伝えます。", "からみえるけしきを、みじかいぶんしょうでつたえます。")),
      join(b, literal("の仕組みを知ると、", "のしくみをしると、"), f, literal("がもっと身近になります。", "がもっとみぢかになります。")),
      join(f, literal("の記録は、次の調査にも役立ちます。", "のきろくは、つぎのちょうさにもやくだちます。")),
      join(literal("観察した後は、", "かんさつしたあとは、"), f, literal("の道具を元の場所へ戻します。", "のどうぐをもとのばしょへもどします。")),
      join(f, literal("の新しい展示に、分かりやすい名前を付けます。", "のあたらしいてんじに、わかりやすいなまえをつけます。")),
      join(a, literal("について考えた予想を、", "についてかんがえたよそうを、"), f, literal("で確かめます。", "でたしかめます。")),
      join(f, literal("では、小さな疑問から大きな発見が生まれます。", "では、ちいさなぎもんからおおきなはっけんがうまれます。")),
      join(f, literal("で"), b, literal("の変化を見逃さないよう、丁寧に観察します。", "のへんかをみのがさないよう、ていねいにかんさつします。")),
      join(f, literal("に集まった発見を、みんなで共有しましょう。", "にあつまったはっけんを、みんなできょうゆうしましょう。")),
      join(f, literal("が完成し、次の研究へ進めるようになりました。", "がかんせいし、つぎのけんきゅうへすすめるようになりました。")),
    ],
    4: [
      join(f, literal("の作業予定を確認し、担当ごとの順番を整理します。", "のさぎょうよていをかくにんし、たんとうごとのじゅんばんをせいりします。")),
      join(f, literal("で使う", "でつかう"), a, literal("に関する資料は、午後3時までに共有してください。", "にかんするしりょうは、ごご3じまでにきょうゆうしてください。")),
      join(f, literal("をご利用の方へ、入口と受付の場所をご案内します。", "をごりようのかたへ、いりぐちとうけつけのばしょをごあんないします。")),
      join(f, literal("で扱う", "であつかう"), b, literal("の内容に変更がないか、公開する前に確認しましょう。", "のないようにへんこうがないか、こうかいするまえにかくにんしましょう。")),
      join(f, literal("の改善案について、短い打ち合わせを行います。", "のかいぜんあんについて、みじかいうちあわせをおこないます。")),
      join(literal("ご質問がある場合は、", "ごしつもんがあるばあいは、"), f, literal("の担当者までお知らせください。", "のたんとうしゃまでおしらせください。")),
      join(f, literal("では、"), a, literal("と"), b, literal("の数を確認し、不足分を準備します。", "のかずをかくにんし、ふそくぶんをじゅんびします。")),
      join(f, literal("の案内文は、初めての方にも伝わる表現にします。", "のあんないぶんは、はじめてのかたにもつたわるひょうげんにします。")),
      join(literal("作業が終わったら、", "さぎょうがおわったら、"), f, literal("の進み具合を記録します。", "のすすみぐあいをきろくします。")),
      join(f, literal("では、相手の話を最後まで聞いてから返事をします。", "では、あいてのはなしをさいごまできいてからへんじをします。")),
      join(f, literal("に掲載する", "にけいさいする"), a, literal("の写真には、内容が分かる説明を添えてください。", "のしゃしんには、ないようがわかるせつめいをそえてください。")),
      join(f, literal("の会議は10時開始です。5分前にお集まりください。", "のかいぎは10じかいしです。5ふんまえにおあつまりください。")),
      join(f, literal("で使う", "でつかう"), b, literal("の在庫を確かめ、必要な数だけ注文します。", "のざいこをたしかめ、ひつようなかずだけちゅうもんします。")),
      join(f, literal("の情報は、日付と出典を確認してから更新します。", "のじょうほうは、ひづけとしゅってんをかくにんしてからこうしんします。")),
      join(literal("いただいたご意見を、", "いただいたごいけんを、"), f, literal("の次の改善に生かします。", "のつぎのかいぜんにいかします。")),
      join(f, literal("の受付では、お名前ではなく受付番号を確認します。", "のうけつけでは、おなまえではなくうけつけばんごうをかくにんします。")),
      join(f, literal("で扱う", "であつかう"), a, literal("の担当が変わるため、連絡先を更新しました。", "のたんとうがかわるため、れんらくさきをこうしんしました。")),
      join(f, literal("の共有資料を読み、要点を3つにまとめます。", "のきょうゆうしりょうをよみ、ようてんを3つにまとめます。")),
      join(f, literal("で使う", "でつかう"), b, literal("の準備が整ったら、担当者へ完了を報告します。", "のじゅんびがととのったら、たんとうしゃへかんりょうをほうこくします。")),
      join(f, literal("が完成しました。協力してくれた方へ感謝を伝えます。", "がかんせいしました。きょうりょくしてくれたかたへかんしゃをつたえます。")),
    ],
    5: [
      join(f, literal("を未来へ残すため、使いやすさと環境への配慮を両立させた計画を考えます。", "をみらいへのこすため、つかいやすさとかんきょうへのはいりょをりょうりつさせたけいかくをかんがえます。")),
      join(a, literal("から得た知恵を生かし、", "からえたちえをいかし、"), f, literal("を長く利用できる仕組みに整えましょう。", "をながくりようできるしくみにととのえましょう。")),
      join(f, literal("の運営では、安全を最優先にしながら、新しい挑戦を少しずつ取り入れます。", "のうんえいでは、あんぜんをさいゆうせんにしながら、あたらしいちょうせんをすこしずつとりいれます。")),
      join(b, literal("の変化を定期的に記録すると、", "のへんかをていきてきにきろくすると、"), f, literal("の改善点を客観的に見つけられます。", "のかいぜんてんをきゃっかんてきにみつけられます。")),
      join(literal("異なる意見が集まったときは、", "ことなるいけんがあつまったときは、"), f, literal("の目的に戻って優先順位を話し合います。", "のもくてきにもどってゆうせんじゅんいをはなしあいます。")),
      join(f, literal("を訪れる人が迷わないよう、案内の言葉と図の両方を分かりやすく配置します。", "をおとずれるひとがまよわないよう、あんないのことばとずのりょうほうをわかりやすくはいちします。")),
      join(f, literal("の計画では、", "のけいかくでは、"), a, literal("と"), b, literal("を組み合わせ、これまでになかった便利な道具を設計します。", "をくみあわせ、これまでになかったべんりなどうぐをせっけいします。")),
      join(f, literal("のデータは目的を明確にして集め、必要のない個人情報は保存しません。", "のでーたはもくてきをめいかくにしてあつめ、ひつようのないこじんじょうほうはほぞんしません。")),
      join(literal("今日の小さな改善が、", "きょうのちいさなかいぜんが、"), f, literal("を利用する多くの人の安心につながります。", "をりようするおおくのひとのあんしんにつながります。")),
      join(f, literal("の完成後も3か月ごとに点検し、見つかった課題を次の計画へ反映します。", "のかんせいごも3かげつごとにてんけんし、みつかったかだいをつぎのけいかくへはんえいします。")),
      join(f, literal("で"), b, literal("を紹介する文章には、初めて読む人が知りたい情報から順番に書きます。", "をしょうかいするぶんしょうには、はじめてよむひとがしりたいじょうほうからじゅんばんにかきます。")),
      join(f, literal("で起きる小さな変化にも気づけるよう、1日1回、日時と状況を記録します。", "でおきるちいさなへんかにもきづけるよう、1にち1かい、にちじとじょうきょうをきろくします。")),
      join(f, literal("では、"), a, literal("を受け継ぐだけでなく、現代の暮らしに合う新しい使い方も提案します。", "をうけつぐだけでなく、げんだいのくらしにあうあたらしいつかいかたもていあんします。")),
      join(f, literal("のエネルギーを無駄なく使うため、利用時間と必要量を丁寧に見直します。", "のえねるぎーをむだなくつかうため、りようじかんとひつようりょうをていねいにみなおします。")),
      join(literal("予想と違う結果が出ても、", "よそうとちがうけっかがでても、"), f, literal("の失敗とは考えず、新しい発見として記録します。", "のしっぱいとはかんがえず、あたらしいはっけんとしてきろくします。")),
      join(f, literal("に関わる全員が同じ目標を共有できるよう、計画を短い言葉で説明します。", "にかかわるぜんいんがおなじもくひょうをきょうゆうできるよう、けいかくをみじかいことばでせつめいします。")),
      join(f, literal("で"), b, literal("の魅力を守りながら、誰もが参加しやすい新しい催しを準備しましょう。", "のみりょくをまもりながら、だれもがさんかしやすいあたらしいもよおしをじゅんびしましょう。")),
      join(f, literal("の仕組みを公開するときは、正確さを確認し、専門用語に短い説明を添えます。", "のしくみをこうかいするときは、せいかくさをかくにんし、せんもんようごにみじかいせつめいをそえます。")),
      join(a, literal("から始まった一つの工夫が、", "からはじまったひとつのくふうが、"), f, literal("の新しい文化として街全体へ広がりました。", "のあたらしいぶんかとしてまちぜんたいへひろがりました。")),
      join(f, literal("が完成しました。積み重ねた5000の言葉が、自分だけの世界を動かします。", "がかんせいしました。つみかさねた5000のことばが、じぶんだけのせかいをうごかします。")),
    ],
  };

  return templates[level] ?? templates[1] ?? [];
}

export function buildCatalog(): ContentCatalog {
  const districts: District[] = [];
  const missions: Mission[] = [];
  const phrases: Phrase[] = [];
  let districtNumber = 0;
  let missionNumber = 0;

  for (const zone of zoneSources) {
    for (const districtSource of zone.districts) {
      districtNumber += 1;
      const districtId = `d${String(districtNumber).padStart(2, "0")}`;
      districts.push({
        id: districtId,
        zoneId: zone.id,
        number: districtNumber,
        name: districtSource.name,
        reading: districtSource.reading,
        genre: districtSource.genre,
        description: districtSource.description,
      });

      for (let stageIndex = 0; stageIndex < missionStages.length; stageIndex += 1) {
        missionNumber += 1;
        const stage = missionStages[stageIndex];
        if (!stage) throw new Error("ミッション段階が不足しています");
        const missionId = `m${String(missionNumber).padStart(3, "0")}`;
        const focus = {
          text: `${districtSource.name}の${stage.rewardSuffix.text}`,
          reading: `${districtSource.reading}の${stage.rewardSuffix.reading}`,
        };
        const phraseIds: string[] = [];
        const missionPhrases = buildPhrases(
          zone.level,
          focus,
          districtSource.words[(stageIndex * 2) % districtSource.words.length] ?? districtSource.words[0]!,
          districtSource.words[(stageIndex * 2 + 3) % districtSource.words.length] ?? districtSource.words[1]!,
        );

        for (let phraseIndex = 0; phraseIndex < missionPhrases.length; phraseIndex += 1) {
          const source = missionPhrases[phraseIndex];
          if (!source) continue;
          const phraseId = `p${String(missionNumber).padStart(3, "0")}-${String(phraseIndex + 1).padStart(2, "0")}`;
          phraseIds.push(phraseId);
          phrases.push({
            id: phraseId,
            missionId,
            order: phraseIndex + 1,
            text: source.text,
            reading: source.reading,
            romanization: toCanonicalRoman(source.reading),
            level: zone.level,
            genre: districtSource.genre,
          });
        }

        const column = stageIndex % 5;
        const row = Math.floor(stageIndex / 5);
        missions.push({
          id: missionId,
          number: missionNumber,
          zoneId: zone.id,
          districtId,
          title: stage.title(districtSource.name),
          description: stage.description(districtSource.name),
          level: zone.level,
          genre: districtSource.genre,
          reward: {
            id: `reward-${missionId}`,
            name: focus.text,
            kind: stage.kind,
          },
          coordinates: {
            x: 11 + column * 19 + ((districtNumber * 7 + stageIndex * 3) % 5),
            y: 17 + row * 45 + ((districtNumber * 11 + stageIndex * 5) % 8),
          },
          phraseIds,
        });
      }
    }
  }

  return {
    generatedAt: "2026-08-17T00:00:00.000Z",
    version: 1,
    zones: zoneSources.map((zone) => ({
      id: zone.id,
      number: zone.number,
      name: zone.name,
      japaneseName: zone.japaneseName,
      description: zone.description,
      level: zone.level,
      accent: zone.accent,
    })),
    districts,
    missions,
    phrases,
  };
}
