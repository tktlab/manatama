/* 英語 3〜6年(3・4年 外国語活動 / 5・6年 外国語)
 * 英語の 部分は 英語の 声で 読み上げる(util.js の A.speak が 自動で 切りかえる) */
(function () {
  "use strict";
  var S = M.skill, near = M.near;
  var NUM = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
  var COL = [["red", "赤", "🔴"], ["blue", "青", "🔵"], ["yellow", "黄色", "🟡"], ["green", "緑", "🟢"], ["white", "白", "⚪"], ["black", "黒", "⚫"], ["pink", "ピンク", "🩷"], ["orange", "オレンジ", "🟠"], ["purple", "むらさき", "🟣"], ["brown", "茶色", "🟤"]];
  var DAY = [["Sunday", "日曜日"], ["Monday", "月曜日"], ["Tuesday", "火曜日"], ["Wednesday", "水曜日"], ["Thursday", "木曜日"], ["Friday", "金曜日"], ["Saturday", "土曜日"]];
  var MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  function others(list, i, k) { var o = []; for (var j = 1; o.length < k; j++) o.push(list[(i + j * 3) % list.length]); return o; }

  /* ---------- 3年 ---------- */
  S({ unit: "en3-01", sub: "英語", id: "e3-hello", name: "あいさつ", title: "英語で あいさつしよう",
    meaning: "英語の あいさつ。Hello.(こんにちは)、Good morning.(おはよう)、Goodbye. / See you.(さようなら・またね)、Thank you.(ありがとう)。How are you?(元気?)と 聞かれたら I'm fine. / I'm happy. などと 答えるよ。",
    examples: ["A: How are you? B: I'm fine, thank you.", "朝 会ったら Good morning."],
    steps: ["場面(朝・会った とき・別れる とき)を 考える。", "合う あいさつを えらぶ。", "声に 出して 言って みる。"],
    checks: [["「ありがとう」は 英語で?", ["Thank you.", "Hello.", "Goodbye."], "Thank you."], ["朝の あいさつは?", ["Good morning.", "Good night.", "See you."], "朝は morning。"]],
    probs: [
      ["「こんにちは」は 英語で?", ["Hello.", "Goodbye.", "Thank you.", "Sorry."], "会った ときの あいさつ。", "Hello."],
      ["「さようなら」は 英語で?", ["Goodbye.", "Hello.", "Good morning.", "Thank you."], "別れる ときの あいさつ。", "Goodbye."],
      ["How are you? と 聞かれたら?", ["I'm fine.", "I'm ten.", "Thank you.", "Goodbye."], "元気? と 聞かれている。", "I'm fine.(元気です)"],
      ["夜 ねる 前の あいさつは?", ["Good night.", "Good morning.", "Hello.", "See you."], "night は 夜。", "Good night.(おやすみ)"],
      ["「ごめんなさい」は 英語で?", ["I'm sorry.", "I'm fine.", "Thank you.", "Hello."], "あやまる ことば。", "I'm sorry."],
      ["I'm happy. の 意味は?", ["うれしいです。", "おなかが すいた。", "ねむいです。", "かなしいです。"], "happy は うれしい。", "うれしいです。"],
    ] });

  S({ unit: "en3-02", sub: "英語", id: "e3-number", name: "かずを かぞえよう", title: "1〜20 を 英語で",
    meaning: "英語の かず:one(1)、two(2)、three(3)、four(4)、five(5)、six(6)、seven(7)、eight(8)、nine(9)、ten(10)、eleven(11)、twelve(12)、13〜19 は -teen(thirteen…)、twenty(20)。いくつ? は How many?",
    examples: ["How many apples? — Five.", "twelve は 12。"],
    steps: ["1〜10 を おぼえる。", "11・12 は とくべつ。", "13〜19 は おしりが -teen。"],
    checks: [["three は いくつ?", [3, 2, 8], "three = 3。"], ["「10」は 英語で?", ["ten", "two", "twelve"], "ten。"]],
    gen: function (r) {
      var n = r.int(1, 20);
      if (r() < 0.5) return [NUM[n] + " は いくつ?", near(n, [n === 13 ? 30 : n + 10, n + 1, n - 1]), "かずの 英語を 思い出そう。", NUM[n] + " = " + n + "。"];
      return ["「" + n + "」は 英語で?", [NUM[n]].concat(others(NUM.slice(1), n - 1, 3)), "1〜10、11・12、-teen の じゅんで 考えよう。", n + " = " + NUM[n] + "。"];
    } });

  S({ unit: "en3-03", sub: "英語", id: "e3-color", name: "いろ", title: "色を 英語で",
    meaning: "色の 英語:red(赤)、blue(青)、yellow(黄色)、green(緑)、white(白)、black(黒)、pink(ピンク)、orange(オレンジ)、purple(むらさき)、brown(茶色)。What color do you like?(何色が すき?)— I like blue.",
    examples: ["🍎 は red。", "What color do you like? — I like green."],
    steps: ["色を 見る。", "その 色の 英語を 思い出す。", "I like ___. で 言って みる。"],
    checks: [["red は 何色?", ["赤", "青", "黄色"], "red = 赤。"], ["「緑」は 英語で?", ["green", "blue", "brown"], "green。"]],
    gen: function (r) {
      var i = r.int(0, COL.length - 1), c = COL[i];
      if (r() < 0.5) return [c[0] + " は 何色?", [c[1]].concat(others(COL.map(function (x) { return x[1]; }), i, 3)), "色の 英語を 思い出そう。", c[0] + " = " + c[1] + "。"];
      return [c[2] + " この 色は 英語で?", [c[0]].concat(others(COL.map(function (x) { return x[0]; }), i, 3)), "色を 見て 英語を 思い出そう。", c[2] + " は " + c[0] + "。"];
    } });

  S({ unit: "en3-04", sub: "英語", id: "e3-like", name: "すきな もの", title: "I like ___. / Do you like ___?",
    meaning: "すきな ものを 言う ときは I like ___.(___が すき)。相手に 聞く ときは Do you like ___?(___は すき?)。答えは Yes, I do.(うん、すき)/ No, I don't.(ううん、すきじゃない)。",
    examples: ["I like dogs.(犬が すき)", "Do you like soccer? — Yes, I do."],
    steps: ["自分の ことなら I like ___.", "相手に 聞くなら Do you like ___?", "答えは Yes, I do. / No, I don't."],
    prereq: ["e3-hello"],
    checks: [["Do you like cats? の 意味は?", ["ねこは すき?", "ねこを かっている?", "ねこは どこ?"], "Do you like ~? = すき?"], ["すきな ときの 答えは?", ["Yes, I do.", "No, I don't.", "I'm fine."], "Yes, I do."]],
    probs: [
      ["I like apples. の 意味は?", ["りんごが すきです。", "りんごを 食べます。", "りんごが ほしいです。", "りんごは 赤い。"], "like は すき。", "りんごが すきです。"],
      ["「ぼくは サッカーが すき」は?", ["I like soccer.", "I am soccer.", "Do you like soccer?", "I want soccer."], "I like ___.", "I like soccer."],
      ["Do you like bananas? に「うん、すき」と 答えると?", ["Yes, I do.", "No, I don't.", "I'm fine.", "Thank you."], "Yes で はじまる。", "Yes, I do."],
      ["Do you like snakes? に「すきじゃない」と 答えると?", ["No, I don't.", "Yes, I do.", "I'm happy.", "Hello."], "No で はじまる。", "No, I don't."],
      ["相手に「犬は すき?」と 聞くと?", ["Do you like dogs?", "I like dogs.", "I'm a dog.", "How are you?"], "Do you で はじまる。", "Do you like dogs?"],
    ] });

  S({ unit: "en3-05", sub: "英語", id: "e3-abc", name: "アルファベット(大文字)", title: "A から Z まで",
    meaning: "アルファベットは 26文字。A B C D E F G H I J K L M N O P Q R S T U V W X Y Z の じゅんばん。歌で おぼえると 楽しいよ。",
    examples: ["A の つぎは B。", "X Y Z で おわり。"],
    steps: ["じゅんばんに 声に 出して 言う。", "まよったら はじめから 歌って みる。"],
    checks: [["C の つぎは?", ["D", "E", "B"], "A B C D。"], ["アルファベットは 何文字?", ["26", "24", "20"], "26文字。"]],
    gen: function (r) {
      var i = r.int(0, 24), t = r.int(0, 1);
      if (t === 0) return [ABC[i] + " の つぎの 文字は?", [ABC[i + 1], ABC[(i + 2) % 26], ABC[(i + 25) % 26], ABC[(i + 5) % 26]], "A から じゅんに 言って みよう。", ABC[i] + " の つぎは " + ABC[i + 1] + "。"];
      var j = r.int(1, 25);
      return [ABC[j] + " の まえの 文字は?", [ABC[j - 1], ABC[(j + 1) % 26], ABC[(j + 24) % 26], ABC[(j + 4) % 26]], "A から じゅんに 言って みよう。", ABC[j] + " の まえは " + ABC[j - 1] + "。"];
    } });

  /* ---------- 4年 ---------- */
  S({ unit: "en4-01", sub: "英語", id: "e4-day", name: "曜日", title: "曜日を 英語で",
    meaning: "曜日:Sunday(日)、Monday(月)、Tuesday(火)、Wednesday(水)、Thursday(木)、Friday(金)、Saturday(土)。What day is it?(何曜日?)— It's Monday.",
    examples: ["What day is it today? — It's Friday.", "週末は Saturday と Sunday。"],
    steps: ["Sunday から じゅんに おぼえる。", "おしりは みんな -day。", "It's ___. で 答える。"],
    prereq: ["e3-number"],
    checks: [["Monday は 何曜日?", ["月曜日", "日曜日", "水曜日"], "Monday = 月曜日。"], ["「土曜日」は?", ["Saturday", "Sunday", "Thursday"], "Saturday。"]],
    gen: function (r) {
      var i = r.int(0, 6), d = DAY[i];
      if (r() < 0.5) return [d[0] + " は 何曜日?", [d[1]].concat(others(DAY.map(function (x) { return x[1]; }), i, 3)), "曜日の 英語を 思い出そう。", d[0] + " = " + d[1] + "。"];
      return ["「" + d[1] + "」は 英語で?", [d[0]].concat(others(DAY.map(function (x) { return x[0]; }), i, 3)), "Sunday から じゅんに。", d[1] + " = " + d[0] + "。"];
    } });

  S({ unit: "en4-02", sub: "英語", id: "e4-weather", name: "天気", title: "How's the weather?",
    meaning: "天気を 聞く ときは How's the weather?。答えは It's sunny.(晴れ)、It's rainy.(雨)、It's cloudy.(くもり)、It's snowy.(雪)。",
    examples: ["How's the weather? — It's sunny. ☀️", "雨の 日は rainy ☔"],
    steps: ["空の 様子を 見る。", "合う 天気の 言葉を えらぶ。", "It's ___. で 答える。"],
    prereq: ["e3-hello"],
    checks: [["sunny は?", ["晴れ", "雨", "雪"], "sun は 太陽。"], ["「雨」は?", ["rainy", "cloudy", "snowy"], "rain は 雨。"]],
    probs: [
      ["☀️ の 天気は 英語で?", ["sunny", "rainy", "cloudy", "snowy"], "sun(太陽)。", "sunny(晴れ)。"],
      ["☔ の 天気は 英語で?", ["rainy", "sunny", "snowy", "windy"], "rain(雨)。", "rainy(雨)。"],
      ["☁️ の 天気は 英語で?", ["cloudy", "sunny", "rainy", "snowy"], "cloud(雲)。", "cloudy(くもり)。"],
      ["⛄ の 天気は 英語で?", ["snowy", "cloudy", "sunny", "rainy"], "snow(雪)。", "snowy(雪)。"],
      ["天気を たずねる 文は?", ["How's the weather?", "How are you?", "What day is it?", "What time is it?"], "weather は 天気。", "How's the weather?"],
    ] });

  S({ unit: "en4-03", sub: "英語", id: "e4-time", name: "時こく", title: "What time is it?",
    meaning: "時こくを 聞く ときは What time is it?。答えは It's ___ o'clock.(___時ちょうど)。8時なら It's eight o'clock.",
    examples: ["What time is it? — It's seven o'clock.", "It's three thirty.(3時30分)"],
    steps: ["時計の 時を 読む。", "かずの 英語に する。", "It's ___ o'clock. で 答える。"],
    prereq: ["e3-number", "s1-clock"],
    checks: [["It's six o'clock. は 何時?", ["6時", "7時", "12時"], "six = 6。"], ["時こくを 聞く 文は?", ["What time is it?", "How are you?", "What day is it?"], "time は 時間。"]],
    gen: function (r) {
      var hh = r.int(1, 12);
      if (r() < 0.5) return ["It's " + NUM[hh] + " o'clock. は 何時?", [hh + "時", (hh % 12 + 1) + "時", (hh + 5) % 12 + 1 + "時", (hh === 10 ? 2 : 10) + "時"], NUM[hh] + " は いくつ?", NUM[hh] + " = " + hh + "。" + hh + "時ちょうど。", M.clock(hh, 0)];
      return ["この とけいを 英語で 言うと?", ["It's " + NUM[hh] + " o'clock.", "It's " + NUM[hh % 12 + 1] + " o'clock.", "It's " + NUM[(hh + 5) % 12 + 1] + " o'clock.", "It's " + NUM[hh === 12 ? 6 : 12] + " o'clock."], "みじかい はりを 見て、かずを 英語に。", hh + "時 = It's " + NUM[hh] + " o'clock.", M.clock(hh, 0)];
    } });

  S({ unit: "en4-04", sub: "英語", id: "e4-abc", name: "アルファベット(小文字)", title: "大文字と 小文字",
    meaning: "アルファベットには 大文字(A B C)と 小文字(a b c)が ある。b と d、p と q は 形が にているので 気を つけよう。",
    examples: ["A → a、B → b、G → g", "b と d は 向きが 反対。"],
    steps: ["大文字を 見る。", "その 小文字の 形を 思い出す。", "b・d・p・q は 向きに 注意。"],
    prereq: ["e3-abc"],
    checks: [["B の 小文字は?", ["b", "d", "p"], "b。"], ["Q の 小文字は?", ["q", "p", "g"], "q。"]],
    gen: function (r) {
      var i = r.int(0, 25), L = ABC[i], l = L.toLowerCase();
      var sim = { b: ["d", "p", "q"], d: ["b", "q", "p"], p: ["q", "b", "d"], q: ["p", "d", "b"], m: ["n", "w", "u"], n: ["m", "h", "u"], u: ["n", "v", "w"], g: ["q", "j", "p"], i: ["j", "l", "t"], j: ["i", "g", "y"], l: ["i", "t", "j"] }[l];
      var w = sim || [ABC[(i + 1) % 26].toLowerCase(), ABC[(i + 13) % 26].toLowerCase(), ABC[(i + 7) % 26].toLowerCase()];
      if (r() < 0.6) return [L + " の 小文字は?", [l].concat(w), "形を よく 見よう。", L + " の 小文字は " + l + "。"];
      return [l + " の 大文字は?", [L].concat(w.map(function (x) { return x.toUpperCase(); })), "形を よく 見よう。", l + " の 大文字は " + L + "。"];
    } });

  S({ unit: "en4-05", sub: "英語", id: "e4-want", name: "ほしい もの", title: "I want ___. / What do you want?",
    meaning: "ほしい ものを 言う ときは I want ___.。相手に 聞く ときは What do you want?(何が ほしい?)。ものを わたす ときは Here you are.(はい、どうぞ)、もらったら Thank you.",
    examples: ["What do you want? — I want a banana, please.", "Here you are. — Thank you."],
    steps: ["ほしい ものを I want ___. で 言う。", "ていねいに するなら おしりに please。", "わたす ときは Here you are."],
    prereq: ["e3-like"],
    checks: [["I want an apple. の 意味は?", ["りんごが ほしい。", "りんごが すき。", "りんごを 食べた。"], "want は ほしい。"], ["「はい、どうぞ」は?", ["Here you are.", "Thank you.", "Hello."], "Here you are."]],
    probs: [
      ["I want a pencil. の 意味は?", ["えんぴつが ほしいです。", "えんぴつが すきです。", "えんぴつを もっています。", "えんぴつは 長い。"], "want は ほしい。", "えんぴつが ほしいです。"],
      ["相手に「何が ほしい?」と 聞くと?", ["What do you want?", "What time is it?", "How are you?", "Do you like it?"], "What で はじまる。", "What do you want?"],
      ["ものを わたす ときの ことばは?", ["Here you are.", "I'm sorry.", "Good night.", "See you."], "はい、どうぞ。", "Here you are."],
      ["「バナナが ほしい」は?", ["I want a banana.", "I like a banana.", "I'm a banana.", "Do you want a banana?"], "I want ___.", "I want a banana."],
      ["ていねいに たのむ ときに つける ことばは?", ["please", "sorry", "hello", "goodbye"], "おねがいします。", "please。"],
    ] });

  /* ---------- 5年 ---------- */
  S({ unit: "en5-01", sub: "英語", id: "e5-intro", name: "自己しょうかい", title: "My name is ___.",
    meaning: "自己しょうかい:My name is ___.(わたしの 名前は ___です)、I'm from ___.(___ 出身です)、I like ___.(___が すきです)。最初に Nice to meet you.(はじめまして)と 言おう。",
    examples: ["Hello. My name is Ken. I'm from Osaka. Nice to meet you.", "Nice to meet you, too.(こちらこそ)"],
    steps: ["Hello. で あいさつ。", "My name is ___. と 名前を 言う。", "すきな ものなどを つけ足す。"],
    prereq: ["e3-like"],
    checks: [["Nice to meet you. の 意味は?", ["はじめまして。", "さようなら。", "ありがとう。"], "はじめて 会った とき。"], ["名前を 言う 文は?", ["My name is Yuki.", "I like Yuki.", "I want Yuki."], "My name is ___."]],
    probs: [
      ["「わたしの 名前は アオイです」は?", ["My name is Aoi.", "I like Aoi.", "I want Aoi.", "Aoi is fine."], "My name is ___.", "My name is Aoi."],
      ["I'm from Hokkaido. の 意味は?", ["北海道 出身です。", "北海道へ 行きたい。", "北海道が すき。", "北海道は 寒い。"], "from は 〜から。", "北海道 出身です。"],
      ["Nice to meet you. と 言われたら?", ["Nice to meet you, too.", "Good night.", "I'm sorry.", "Here you are."], "こちらこそ。", "Nice to meet you, too."],
      ["What's your name? の 意味は?", ["あなたの 名前は 何?", "何が すき?", "何時?", "どこから 来たの?"], "name は 名前。", "あなたの 名前は 何ですか。"],
      ["自己しょうかいで さいしょに 言うと よいのは?", ["Hello.", "Goodbye.", "Good night.", "See you."], "あいさつから。", "Hello."],
    ] });

  S({ unit: "en5-02", sub: "英語", id: "e5-month", name: "たんじょう日(月)", title: "When is your birthday?",
    meaning: "月の 英語:January(1月)、February(2月)、March(3月)、April(4月)、May(5月)、June(6月)、July(7月)、August(8月)、September(9月)、October(10月)、November(11月)、December(12月)。たんじょう日を 聞く:When is your birthday? — My birthday is May 5th.",
    examples: ["My birthday is April 10th.", "12月は December。"],
    steps: ["1月から じゅんに おぼえる。", "My birthday is ___. で 言う。"],
    prereq: ["e4-day"],
    checks: [["April は 何月?", ["4月", "8月", "6月"], "April = 4月。"], ["「12月」は?", ["December", "November", "October"], "December。"]],
    gen: function (r) {
      var i = r.int(0, 11);
      if (r() < 0.5) return [MON[i] + " は 何月?", [i + 1 + "月"].concat(others([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(function (x) { return x + "月"; }), i, 3)), "月の 英語を 思い出そう。", MON[i] + " = " + (i + 1) + "月。"];
      return ["「" + (i + 1) + "月」は 英語で?", [MON[i]].concat(others(MON, i, 3)), "January から じゅんに。", (i + 1) + "月 = " + MON[i] + "。"];
    } });

  S({ unit: "en5-03", sub: "英語", id: "e5-can", name: "できること", title: "I can ___. / Can you ___?",
    meaning: "できる ことは I can ___.、できない ことは I can't ___.。相手に 聞く ときは Can you ___?、答えは Yes, I can. / No, I can't.",
    examples: ["I can swim.(泳げる)", "Can you play the piano? — No, I can't."],
    steps: ["できる → can、できない → can't。", "聞く ときは Can you で はじめる。", "答えは Yes, I can. / No, I can't."],
    prereq: ["e3-like"],
    checks: [["I can run fast. の 意味は?", ["速く 走れる。", "速く 走りたい。", "速く 走るのが すき。"], "can は できる。"], ["「泳げない」は?", ["I can't swim.", "I can swim.", "I like swimming."], "can't。"]],
    probs: [
      ["I can cook. の 意味は?", ["料理が できます。", "料理が すきです。", "料理が ほしいです。", "料理を しました。"], "can = できる。", "料理が できます。"],
      ["Can you sing? に「できる」と 答えると?", ["Yes, I can.", "No, I can't.", "Yes, I do.", "I'm fine."], "can で 聞かれたら can で 答える。", "Yes, I can."],
      ["「一輪車に 乗れない」は?", ["I can't ride a unicycle.", "I can ride a unicycle.", "I like a unicycle.", "I want a unicycle."], "できない = can't。", "I can't ride a unicycle."],
      ["相手に「スキーできる?」と 聞くと?", ["Can you ski?", "Do you like ski?", "I can ski.", "What do you want?"], "Can you で はじめる。", "Can you ski?"],
      ["can't の 意味は?", ["できない", "できる", "すき", "ほしい"], "can に not。", "できない。"],
    ] });

  S({ unit: "en5-04", sub: "英語", id: "e5-way", name: "道案内", title: "Where is ___? / Go straight.",
    meaning: "場所を 聞く:Where is the station?(駅は どこ?)。道案内:Go straight.(まっすぐ 行く)、Turn right.(右に 曲がる)、Turn left.(左に 曲がる)、It's on your right.(右手に あります)。",
    examples: ["Go straight. Turn left at the corner.", "Where is the library? — It's next to the park."],
    steps: ["Where is ___? で 場所を 聞く。", "Go straight / Turn right / Turn left で 案内する。"],
    prereq: ["e4-want"],
    checks: [["Turn right. の 意味は?", ["右に 曲がる。", "左に 曲がる。", "まっすぐ 行く。"], "right は 右。"], ["Go straight. の 意味は?", ["まっすぐ 行く。", "止まる。", "もどる。"], "straight は まっすぐ。"]],
    probs: [
      ["Turn left. の 意味は?", ["左に 曲がる。", "右に 曲がる。", "まっすぐ 行く。", "止まる。"], "left は 左。", "左に 曲がる。"],
      ["「駅は どこ?」は?", ["Where is the station?", "What is the station?", "When is the station?", "How is the station?"], "場所は Where。", "Where is the station?"],
      ["「まっすぐ 行って」は?", ["Go straight.", "Turn right.", "Turn left.", "Stop."], "straight。", "Go straight."],
      ["It's on your right. の 意味は?", ["右手に あります。", "左手に あります。", "うしろに あります。", "ありません。"], "right は 右。", "右手に あります。"],
      ["「右に 曲がって」は?", ["Turn right.", "Turn left.", "Go straight.", "Go back."], "right。", "Turn right."],
    ] });

  S({ unit: "en5-05", sub: "英語", id: "e5-order", name: "注文しよう", title: "What would you like?",
    meaning: "お店で 注文を 聞く:What would you like?(何に しますか)。答える:I'd like ___.(___を ください)。ねだんを 聞く:How much is it?(いくら?)— It's 500 yen.",
    examples: ["What would you like? — I'd like a hamburger and orange juice.", "How much? — It's 300 yen."],
    steps: ["店員は What would you like?", "お客は I'd like ___.", "ねだんは How much is it?"],
    prereq: ["e4-want", "e3-number"],
    checks: [["I'd like pizza. の 意味は?", ["ピザを ください。", "ピザが すき。", "ピザを 作れる。"], "ていねいな ほしい。"], ["ねだんを 聞く 文は?", ["How much is it?", "How are you?", "What time is it?"], "much。"]],
    probs: [
      ["What would you like? の 意味は?", ["何に しますか。", "何時ですか。", "元気ですか。", "どこですか。"], "注文を 聞く。", "何に しますか。"],
      ["「サラダを ください」は?", ["I'd like a salad.", "I like salad.", "I can salad.", "Where is salad?"], "I'd like ___.", "I'd like a salad."],
      ["How much is it? と 聞かれて「300円です」は?", ["It's 300 yen.", "I'm 300 yen.", "Yes, I can.", "I'd like 300."], "It's ___ yen.", "It's 300 yen."],
      ["「いくらですか」は?", ["How much is it?", "How many?", "What's this?", "Where is it?"], "ねだん = much。", "How much is it?"],
      ["I'd like は 何を あらわす?", ["ていねいに ほしいと 言う", "できると 言う", "きらいだと 言う", "あいさつを する"], "would like。", "ていねいに「ほしい」と 言う。"],
    ] });

  /* ---------- 6年 ---------- */
  S({ unit: "en6-01", sub: "英語", id: "e6-town", name: "わたしの町", title: "We have ___. / We don't have ___.",
    meaning: "町に ある ものを 紹介する:We have a big park.(大きな 公園が あります)。ない ものは We don't have a zoo.(動物園は ありません)。I want a ___.(___が ほしい)で 願いも 言える。",
    examples: ["We have a nice library in our town.", "We don't have an aquarium. I want an aquarium."],
    steps: ["ある → We have ___.", "ない → We don't have ___.", "ほしい → I want ___."],
    prereq: ["e5-way"],
    checks: [["We have a hospital. の 意味は?", ["病院が あります。", "病院が ありません。", "病院へ 行きます。"], "have = ある・もつ。"], ["「動物園は ありません」は?", ["We don't have a zoo.", "We have a zoo.", "I like a zoo."], "don't have。"]],
    probs: [
      ["We have a big park. の 意味は?", ["大きな 公園が あります。", "大きな 公園が ありません。", "大きな 公園へ 行った。", "公園が すき。"], "have = ある。", "大きな 公園が あります。"],
      ["We don't have a station. の 意味は?", ["駅が ありません。", "駅が あります。", "駅へ 行きます。", "駅が すき。"], "don't = ない。", "駅が ありません。"],
      ["「わたしたちの 町には 図書館が あります」は?", ["We have a library.", "We don't have a library.", "I can library.", "Where is a library?"], "We have ___.", "We have a library."],
      ["「水族館が ほしい」は?", ["I want an aquarium.", "I have an aquarium.", "I can aquarium.", "I'm an aquarium."], "I want ___.", "I want an aquarium."],
    ] });

  S({ unit: "en6-02", sub: "英語", id: "e6-summer", name: "夏休みの思い出", title: "I went to ___. (した こと)",
    meaning: "した ことを 言う ときは 動作の 言葉の 形が 変わる。go(行く)→ went、eat(食べる)→ ate、see(見る)→ saw、enjoy(楽しむ)→ enjoyed。It was fun.(楽しかった)。",
    examples: ["I went to the sea. I enjoyed swimming. It was fun.", "I ate watermelon."],
    steps: ["した こと(過去)か 考える。", "go → went、eat → ate、see → saw。", "感想を It was ___. で 言う。"],
    prereq: ["e6-town"],
    checks: [["I went to Kyoto. の 意味は?", ["京都へ 行きました。", "京都へ 行きたい。", "京都が すき。"], "went は go の 過去。"], ["eat の 過去の 形は?", ["ate", "eated", "eats"], "ate。"]],
    probs: [
      ["I saw fireworks. の 意味は?", ["花火を 見ました。", "花火を 見たい。", "花火が すき。", "花火を 作れる。"], "saw は see の 過去。", "花火を 見ました。"],
      ["go の 過去の 形は?", ["went", "goed", "going", "goes"], "形が 大きく 変わる。", "went。"],
      ["It was fun. の 意味は?", ["楽しかったです。", "楽しいです。", "つまらない。", "おもしろく なる。"], "was は 過去。", "楽しかったです。"],
      ["「すいかを 食べました」は?", ["I ate watermelon.", "I eat watermelon.", "I want watermelon.", "I like watermelon."], "eat の 過去は ate。", "I ate watermelon."],
      ["I enjoyed camping. の 意味は?", ["キャンプを 楽しみました。", "キャンプが したい。", "キャンプが できる。", "キャンプに 行く。"], "enjoyed は 楽しんだ。", "キャンプを 楽しみました。"],
    ] });

  S({ unit: "en6-03", sub: "英語", id: "e6-dream", name: "将来の夢", title: "I want to be a ___.",
    meaning: "将来の 夢を 言う ときは I want to be a ___.(___に なりたい)。teacher(先生)、doctor(医者)、nurse(看護師)、cook(料理人)、soccer player(サッカー選手)、vet(じゅう医)など。",
    examples: ["I want to be a doctor. I want to help people.", "What do you want to be? — I want to be a teacher."],
    steps: ["なりたい 職業の 英語を 思い出す。", "I want to be a ___. で 言う。", "理由を つけ足す。"],
    prereq: ["e5-can"],
    checks: [["I want to be a teacher. の 意味は?", ["先生に なりたい。", "先生が すき。", "先生です。"], "want to be = なりたい。"], ["「医者」は?", ["doctor", "cook", "nurse"], "doctor。"]],
    probs: [
      ["I want to be a cook. の 意味は?", ["料理人に なりたい。", "料理が すき。", "料理が できる。", "料理を 食べた。"], "want to be。", "料理人に なりたい。"],
      ["「サッカー選手に なりたい」は?", ["I want to be a soccer player.", "I like soccer.", "I can play soccer.", "I played soccer."], "I want to be a ___.", "I want to be a soccer player."],
      ["vet は どんな 仕事?", ["じゅう医", "パイロット", "歌手", "大工"], "動物の お医者さん。", "じゅう医(動物の 医者)。"],
      ["What do you want to be? の 意味は?", ["何に なりたい?", "何が ほしい?", "何が すき?", "何を した?"], "want to be。", "何に なりたいですか。"],
      ["「看護師」は?", ["nurse", "doctor", "teacher", "farmer"], "病院で はたらく。", "nurse。"],
    ] });

  S({ unit: "en6-04", sub: "英語", id: "e6-jhs", name: "中学校でしたいこと", title: "I want to join the ___ club.",
    meaning: "中学校で したい ことを 言う:I want to join the ___ club.(___部に 入りたい)、I want to study ___.(___を 勉強したい)、I want to enjoy ___.(___を 楽しみたい)。",
    examples: ["I want to join the tennis club.", "I want to study English hard."],
    steps: ["入りたい 部活・したい 勉強を きめる。", "I want to join / study / enjoy ___. で 言う。"],
    prereq: ["e6-dream"],
    checks: [["I want to join the art club. の 意味は?", ["美術部に 入りたい。", "美術が すき。", "美術部です。"], "join は 入る。"], ["「英語を 勉強したい」は?", ["I want to study English.", "I like English.", "I can English."], "study。"]],
    probs: [
      ["I want to join the brass band. の 意味は?", ["吹奏楽部に 入りたい。", "吹奏楽が すき。", "吹奏楽部を 見た。", "楽器が ほしい。"], "join = 入る。", "吹奏楽部に 入りたい。"],
      ["「科学を 勉強したい」は?", ["I want to study science.", "I like science.", "I studied science.", "I can science."], "want to study。", "I want to study science."],
      ["I want to enjoy the school festival. の 意味は?", ["文化祭を 楽しみたい。", "文化祭が すき。", "文化祭に 行った。", "文化祭が ない。"], "enjoy = 楽しむ。", "文化祭を 楽しみたい。"],
      ["「野球部に 入りたい」は?", ["I want to join the baseball club.", "I like baseball.", "I played baseball.", "I can play baseball."], "join the ___ club。", "I want to join the baseball club."],
    ] });
})();
