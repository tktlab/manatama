/* まなたま 教材ビルド: src/*.js を読み込み、ふりがなを付けて js/data.js を作る。
 *   cd tools && npm i kuromoji && node build.js
 * ふりがな: {漢字|かんじ}  /  ふりがなを付けない所: «…»  /  ひらがなモードで空白になる区切り: ¦
 */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const kuromoji = require("kuromoji");
const ROOT = path.join(__dirname, "..");
const SRC = ["lib.js", "curriculum.js", "sansu12.js", "sansu36.js", "sansu_more.js", "kokugo12.js", "kokugo36.js", "seikatsu_rika.js", "shakai.js", "eigo.js"];

const KANJI = /[一-鿿々〆]/;
const hira = (s) => s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
// 1字だけで 出てきた ときの 読み(形態素解析が まちがえやすい もの)
const SINGLE = { 土: "つち", 実: "み", 目: "め", 素: "そ", 犬: "いぬ", 阿: "あ", 言: "ごん", 翁: "おきな" };
const OVERRIDE = { "一年生": "いちねんせい", "二年生": "にねんせい", "昼ごはん": null };

function rubyFor(surface, reading) {
  // 送りがな・前後のかなを取り除いて、漢字の部分だけに読みを付ける
  const runs = surface.match(/[一-鿿々〆]+|[^一-鿿々〆]+/g);
  const re = new RegExp("^" + runs.map((r) => (KANJI.test(r) ? "(.+?)" : "(" + hira(r).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")")).join("") + "$");
  const m = hira(reading).match(re);
  if (!m) return "{" + surface + "|" + hira(reading) + "}";
  return runs.map((r, i) => (KANJI.test(r) ? "{" + r + "|" + m[i + 1] + "}" : r)).join("");
}
function funReading(prevNum) {
  const d = prevNum.slice(-1);
  return "1346890".indexOf(d) >= 0 && prevNum !== "" ? "ぷん" : "ふん";
}
const CONTENT = new Set(["名詞", "動詞", "形容詞", "副詞", "連体詞", "接続詞", "感動詞", "接頭詞"]);
function bunsetsu(prev, t) {
  if (!prev || !CONTENT.has(t.pos)) return false;
  // ひらがなで はじまる ことばの まえでは 区切らない(「が¦い数」「じ¦しゃく」「た¦しざん」の ような まちがいを ふせぐ)
  if (/^[ぁ-ゖ]/.test(t.surface_form)) return false;
  if (!(prev.pos === "助詞" || prev.pos === "助動詞" || /[一-鿿々ァ-ヶ]/.test(prev.surface_form))) return false;
  if (t.pos_detail_1 === "接尾" || t.pos_detail_1 === "非自立" || t.pos_detail_1 === "数") return false;
  if (prev.pos === "接頭詞" || prev.pos === "記号") return false;
  if (prev.pos === "名詞" && t.pos === "名詞") return false;
  if (/[\s「『(（【]$/.test(prev.surface_form) || /^[\s」』)）】、。]/.test(t.surface_form)) return false;
  if (prev.pos === "名詞" && prev.pos_detail_1 === "数") return false;
  if (!/^[ぁ-んァ-ヶー\u4e00-\u9fff々a-zA-Z0-9]/.test(t.surface_form)) return false;
  return true;
}

function build(tok) {
  const cache = new Map();
  const usage = new Map();
  function auto(text) {
    const toks = tok.tokenize(text);
    // すでに 分かち書き してある 文・かんじの ない ことば(こたえの ひらがな など)には 区切りを 足さない
    const spaced = /[ 　]/.test(text) || !KANJI.test(text);
    let out = "";
    toks.forEach((t, i) => {
      const s = t.surface_form, prev = toks[i - 1], next = toks[i + 1];
      if (!spaced && bunsetsu(prev, t) && out && !/\s$/.test(out)) out += "¦";
      if (!KANJI.test(s)) { out += s; return; }
      let r = t.reading ? hira(t.reading) : null;
      if (s === "何") r = next && /^[をがもかに]/.test(next.surface_form) ? "なに" : "なん";
      if (s === "分" && prev && /^\d+$/.test(prev.surface_form) && !(next && next.surface_form === "の")) r = funReading(prev.surface_form);
      if (s === "分" && next && next.surface_form === "の" && prev && /^\d+$/.test(prev.surface_form)) r = "ぶん";
      if (OVERRIDE[s] !== undefined) r = OVERRIDE[s];
      if (SINGLE[s] && toks.length) r = SINGLE[s];
      if (s === "正" && next && /^し/.test(next.surface_form)) r = "ただ";
      // 「後」:「20分後」「戦後」は ご、「〜の 後」「その 後」「した 後」は あと
      if (s === "後") r = prev && /[0-9０-９分時年日週月間]$/.test(prev.surface_form) ? "ご" : "あと";
      if (!r || r === "*") { out += s; return; }
      const rb = rubyFor(s, r);
      usage.set(s + "→" + r, (usage.get(s + "→" + r) || 0) + 1);
      out += rb;
    });
    return out;
  }

  /* 形態素解析の 読みまちがいを 文脈で なおす(ルビが ついた あとの 文字列に かける) */
  const R = (b, y) => "{" + b + "|" + y + "}";
  /* 数字の あとの 読み(ひとり・ふたり / いっぽん・さんぼん / みっか / 5がつ) */
  const DAYS = { 1: "ついたち", 2: "ふつか", 3: "みっか", 4: "よっか", 5: "いつか", 6: "むいか", 7: "なのか", 8: "ようか", 9: "ここのか", 10: "とおか", 14: "じゅうよっか", 20: "はつか", 24: "にじゅうよっか" };
  const pon = (n, base) => { const d = n % 10; return base[(d === 1 || d === 6 || d === 8 || d === 0) ? 1 : d === 3 ? 2 : 0]; };
  const COUNTER = [
    [/(\d+)\{人\|にん\}/g, (m, n) => n === "1" ? R("1人", "ひとり") : n === "2" ? R("2人", "ふたり") : m],
    [/(\d+)\{本\|[^}]+\}/g, (m, n) => n + R("本", pon(+n, ["ほん", "ぽん", "ぼん"]))],
    [/(\d+)\{匹\|[^}]+\}/g, (m, n) => n + R("匹", pon(+n, ["ひき", "ぴき", "びき"]))],
    [/(\d+)\{杯\|[^}]+\}/g, (m, n) => n + R("杯", pon(+n, ["はい", "ぱい", "ばい"]))],
    [/(\d+)\{月\|つき\}/g, (m, n) => n + R("月", "がつ")],
    // 「5月3日」は ひにち(みっか)、「1日の 気温」は いちにち
    [/(\{月\|がつ\})(\d+)\{日\|にち\}/g, (m, g, n) => g + (DAYS[+n] ? R(n + "日", DAYS[+n]) : m.slice(g.length))],
    [/(^|[^\d}])(\d+)\{日\|にち\}/g, (m, pre, n) => pre + (n === "1" ? R("1日", "いちにち") : DAYS[+n] && +n !== 1 ? R(n + "日", DAYS[+n]) : n + R("日", "にち"))],
  ];
  const POST = [
    [/\{何\|なん\}\{月\|つき\}/g, R("何月", "なんがつ")], [/\{色\|しょく\}/g, R("色", "いろ")], [/\{何\|なん\}\{色\|いろ\}/g, R("何", "なに") + R("色", "いろ")],
    [/\{辺\|あたり\}/g, R("辺", "へん")],
    [/\{時\|とき\}¦?こく/g, R("時", "じ") + "こく"], [/\{時\|とき\}を 1/g, R("時", "じ") + "を 1"], [/\{時計\|とけい\}の \{時\|とき\}/g, R("時計", "とけい") + "の " + R("時", "じ")],
    [/\{上\|じょう\}/g, R("上", "うえ")], [/\{下\|か\}/g, R("下", "した")],
    [/\{米\|べい\}/g, R("米", "こめ")], [/\{物\|ぶつ\}/g, R("物", "もの")], [/\{極\|ごく\}/g, R("極", "きょく")],
    [/\{語\|かたり\}/g, R("語", "ご")], [/\{正\|まさ\}しく/g, R("正", "ただ") + "しく"], [/\{毛\|もう\}/g, R("毛", "け")],
    [/\{柿\|かぎ\}/g, R("柿", "かき")], [/\{雨\|う\}/g, R("雨", "あめ")], [/\{雪\|せつ\}のように/g, R("雪", "ゆき") + "のように"],
    [/\{一\|いち\}\{首\|しゅ\}/g, R("一首", "いっしゅ")], [/\{火水\|ひみず\}/g, R("火", "か") + R("水", "すい")],
    [/\{角\|すみ\}ばった/g, R("角", "かど") + "ばった"], [/\{結\|ゆい\}¦?しょう/g, R("結", "けっ") + "しょう"],
    [/\{次\|じ\}の\{朝\|あさ\}/g, R("次", "つぎ") + "の" + R("朝", "あさ")], [/ねぶた\{祭\|さい\}/g, "ねぶた" + R("祭", "まつり")],
    [/\{草\|そう\}/g, R("草", "くさ")], [/\{世論\|せろん\}/g, R("世論", "よろん")], [/\{大雪山\|たいせつざん\}/g, R("大雪山", "だいせつざん")],
    [/\{沖縄\|おきなわ\}\{島\|とう\}/g, R("沖縄島", "おきなわじま")], [/\{流\|ながれ\}いき/g, R("流", "りゅう") + "いき"],
    [/\{積\|つむ\}/g, R("積", "せき")], [/\{通\|かよ\}って/g, R("通", "とお") + "って"], [/\(\{魚\|ぎょ\}\)/g, "(" + R("魚", "さかな") + ")"],
    [/\{龍\|りゅう\}\{馬\|ば\}/g, R("龍馬", "りょうま")], [/\{顔\|がお\}・/g, R("顔", "かお") + "・"], [/\{藤原\|ふじわら\}\{京\|みやこ\}/g, R("藤原京", "ふじわらきょう")],
    [/\{位\|い\}が 1つ/g, R("位", "くらい") + "が 1つ"], [/\{力\|りょく\}を \{加\|くわ\}/g, R("力", "ちから") + "を " + R("加", "くわ")],
    [/\{領地\|りょうち\}を \{守\|も\}り/g, R("領地", "りょうち") + "を " + R("守", "まも") + "り"],
    [/\{本\|ほん\}\{居\|きょ\}\{宣長\|のりなが\}/g, R("本居宣長", "もとおりのりなが")], [/\{御馬\|おんま\}/g, R("御馬", "おうま")],
    [/\{注\|さ\}しゃ\{器\|うつわ\}/g, R("注", "ちゅう") + "しゃ" + R("器", "き")], [/\{手\|て\}の \{中\|ちゅう\}/g, R("手", "て") + "の " + R("中", "なか")],
    [/\(\{人\|じん\}/g, "(" + R("人", "ひと")], [/\{料理\|りょうり\}\{人\|じん\}/g, R("料理人", "りょうりにん")],
    [/\{今\|こん\}:/g, R("今", "いま") + ":"], [/\(\{光\|こう\}・/g, "(" + R("光", "ひかり") + "・"], [/\{将軍家\|しょうぐんけ\}\{光\|こう\}/g, R("将軍", "しょうぐん") + R("家光", "いえみつ")],
    [/\{所\|しょ\}を \{何\|なん\}/g, R("所", "ところ") + "を " + R("何", "なん")], [/\{音\|おん\}なので/g, R("音", "おと") + "なので"],
    [/\{木\|き\}・\{紙\|し\}/g, R("木", "き") + "・" + R("紙", "かみ")], [/いくつ\{分\|ふん\}/g, "いくつ" + R("分", "ぶん")],
    [/\{風\|ふう\}([がは])/g, R("風", "かぜ") + "$1"], [/\{楽\|らく\}¦?ふ/g, R("楽", "がく") + "ふ"],
    [/\{条件\|じょうけん\}:\{水\|すい\}/g, R("条件", "じょうけん") + ":" + R("水", "みず")], [/さんずい\(\{水\|すい\}/g, "さんずい(" + R("水", "みず")],
    [/\{色\|いろ\}\{水\|すい\}/g, R("色水", "いろみず")], [/\(\{水\|すい\}の/g, "(" + R("水", "みず") + "の"], [/:\{水\|すい\}・\{食料/g, ":" + R("水", "みず") + "・{食料"],
    [/さとう\{水\|すい\}/g, "さとう" + R("水", "みず")], [/\{塩水\|えんすい\}/g, R("塩水", "しおみず")],
    [/わる\{数\|すう\}/g, "わる" + R("数", "かず")], [/\{下\|した\}の\{数\|すう\}/g, R("下", "した") + "の" + R("数", "かず")],
    [/\(\{国\|こく\}の/g, "(" + R("国", "くに") + "の"],
    [/の\{数\|すう\}/g, "の" + R("数", "かず")], [/られる\{数\|すう\}/g, "られる" + R("数", "かず")], [/\{着\|ちゃく\}がえ/g, R("着", "き") + "がえ"],
    // まぜ書き(漢字＋ひらがなで 1つの ことば)で 漢字だけ 別の 読みに なっていた もの
    [/\{砂\|すな\}ばく/g, R("砂", "さ") + "ばく"], [/\{日\|にち\}(あたり|かげ)/g, R("日", "ひ") + "$1"], [/\{角\|(?:かく|すみ)\}ば([っる])/g, R("角", "かど") + "ば$1"],
    [/\{水\|みず\}じょう/g, R("水", "すい") + "じょう"], [/\{牛\|うし\}にゅう/g, R("牛", "ぎゅう") + "にゅう"], [/\{冬\|ふゆ\}みん/g, R("冬", "とう") + "みん"],
    [/\{来\|らい\}に/g, R("来", "き") + "に"],
  ];
  const PRE = [["樹形図", "{樹形図|じゅけいず}"], ["帯分数", "{帯|たい}分数"], ["帯グラフ", "{帯|たい}グラフ"], ["仮分数", "{仮|か}分数"], ["大文字", "{大文字|おおもじ}"], ["小文字", "{小文字|こもじ}"],
    ["日本", "{日本|にほん}"], ["図形", "{図形|ずけい}"], ["米づくり", "{米|こめ}づくり"], ["球", "{球|きゅう}"], ["値", "{値|あたい}"], ["何分", "{何分|なんぷん}"], ["何時", "{何時|なんじ}"],
    ["通り", "{通|とお}り"], ["通り道", "{通|とお}り{道|みち}"], ["何人", "{何人|なんにん}"], ["何倍", "{何|なん}倍"],
    ["公助", "{公助|こうじょ}"], ["自助", "{自助|じじょ}"], ["共助", "{共助|きょうじょ}"], ["二酸化炭素", "{二酸化炭素|にさんかたんそ}"], ["酸素", "{酸素|さんそ}"], ["ちっ素", "ちっ{素|そ}"], ["ヨウ素", "ヨウ{素|そ}"],
    ["令和", "{令和|れいわ}"], ["狩野永徳", "{狩野永徳|かのうえいとく}"], ["日清", "{日清|にっしん}"], ["日露", "{日露|にちろ}"], ["最頻値", "{最頻値|さいひんち}"], ["梅雨", "{梅雨|つゆ}"],
    ["雪舟", "{雪舟|せっしゅう}"], ["清少納言", "{清少納言|せいしょうなごん}"], ["孟浩然", "{孟浩然|もうこうねん}"], ["持統天皇", "{持統|じとう}天皇"], ["翁", "{翁|おきな}"], ["柿食へば", "{柿|かき}{食|く}へば"],
    ["遣隋使", "{遣隋使|けんずいし}"], ["遣唐使", "{遣唐使|けんとうし}"], ["野球", "{野球|やきゅう}"], ["結ろ", "{結|けつ}ろ"], ["永久", "{永久|えいきゅう}"], ["発ぽう", "{発|はっ}ぽう"],
    ["目もり", "{目|め}もり"], ["日本国憲法", "{日本国憲法|にほんこくけんぽう}"], ["平家", "{平家|へいけ}"], ["伊能忠敬", "{伊能忠敬|いのうただたか}"], ["一目で", "{一目|ひとめ}で"], ["五音", "{五音|ごおん}"],
    ["半月", "{半月|はんげつ}"], ["何等星", "{何等星|なんとうせい}"], ["卑弥呼", "{卑弥呼|ひみこ}"], ["時代", "{時代|じだい}"], ["北条時宗", "{北条時宗|ほうじょうときむね}"], ["金星", "{金星|きんせい}"],
    ["福沢諭吉", "{福沢諭吉|ふくざわゆきち}"], ["緑色", "{緑色|みどりいろ}"], ["香具山", "{香具山|かぐやま}"], ["附子", "{附子|ぶす}"], ["後継者", "{後継者|こうけいしゃ}"], ["四角形", "{四角形|しかくけい}"], ["三角形", "{三角形|さんかくけい}"]];
  PRE.sort((a, b) => b[0].length - a[0].length); // ながい ものから(「日本国憲法」を「日本」より さきに)
  const PRE_MAP = {}; PRE.forEach((p) => { PRE_MAP[p[0]] = p[1]; });
  const PRE_RE = new RegExp(PRE.map((p) => p[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "g");
  function conv(str) {
    if (typeof str !== "string" || !str) return str;
    if (cache.has(str)) return cache.get(str);
    const key = str;
    // PRE は 1かいで おきかえる(おきかえた ルビの 中を もう一度 おきかえない)
    str = str.split(/(«[^»]*»|\{[^{}|]+\|[^{}|]+\})/).map((seg) => seg[0] === "«" || seg[0] === "{" ? seg : seg.replace(PRE_RE, (m) => PRE_MAP[m])).join("");
    // {手動|ルビ} と «保護» を残して、その他を自動
    let out = "";
    str.split(/(\{[^{}|]+\|[^{}|]+\}|«[^»]*»)/).forEach((seg) => {
      if (!seg) return;
      if (seg[0] === "{" && seg.indexOf("|") > 0) out += seg;
      else if (seg[0] === "«") out += seg; // 表示はそのまま・読み上げでは「この字」
      // 絵文字・改行は 形態素解析に通さない(サロゲートペアが崩れるため)
      else seg.split(/((?:[\u{1F000}-\u{1FFFF}\u2600-\u27BF\uFE0F\u200D\u20E3]|\n)+)/u).forEach((x) => {
        if (!x) return;
        out += /^(?:[\u{1F000}-\u{1FFFF}\u2600-\u27BF\uFE0F\u200D\u20E3]|\n)+$/u.test(x) ? x : auto(x);
      });
    });
    out = POST.concat(COUNTER).reduce((a, p) => a.replace(p[0], p[1]), out)
      .replace(/¦(?=[ぁぃぅぇぉゃゅょっゎー])/g, ""); // 「じ¦ょう」のような ことばの とちゅうの 区切りを けす
    cache.set(key, out);
    return out;
  }
  return { conv, usage };
}

kuromoji.builder({ dicPath: path.join(path.dirname(require.resolve("kuromoji")), "..", "dict") }).build((err, tok) => {
  if (err) throw err;
  const ctx = { window: {}, console };
  vm.createContext(ctx);
  ctx.window.window = ctx.window;
  SRC.forEach((f) => {
    const code = fs.readFileSync(path.join(ROOT, "src", f), "utf8");
    vm.runInContext("(function(window){var M=window.M;" + code + "\n})(window);", ctx, { filename: f });
  });
  const D = ctx.window.AOTO_DATA, C = ctx.window.AOTO_CURRICULUM;
  const { conv, usage } = build(tok);
  /* ---------- ヒントで こたえを 言わない(こたえの ところを □ に する。意味が なくなる ときは にた れいに) ---------- */
  const plainS = (t) => String(t).replace(/\{([^{}|]+)\|[^{}|]+\}/g, "$1").replace(/[¦«»]/g, "");
  const squash = (t) => plainS(t).replace(/[\s。、．.,!！?？=＝→:：・「」()（）□]/g, "");
  const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  function leaks(text, ans) {
    const a = plainS(ans).replace(/\s/g, ""), t = plainS(text).replace(/\s/g, "");
    if (!a) return false;
    if (/^[0-9.]{1,6}$/.test(a)) return new RegExp("(^|[^0-9.])" + esc(a) + "($|[^0-9])").test(t);
    if (/^[0-9A-Za-z.]{1,3}$/.test(a)) return new RegExp("(^|[^0-9A-Za-z.])" + esc(a) + "($|[^0-9A-Za-z])").test(t);
    if (a.length === 1) return /[一-鿿]/.test(a) ? t.indexOf(a) >= 0 : new RegExp("「" + esc(a) + "」").test(t);
    if (t.indexOf(a) >= 0) return true;
    // かたかな・ひらがなの ちがいや「の/との」の ちがい だけの ときも こたえを 言っている とみなす
    const ha = hira(a), ht = hira(t);
    if (ha.length >= 3 && ht.indexOf(ha) >= 0) return true;
    if (a.length >= 4) { // こたえの 半分いじょうが そのまま 入っている / みじかい ヒントが こたえと ほぼ おなじ
      let best = 0;
      for (let i = 0; i < a.length; i++) for (let j = i + best + 1; j <= a.length; j++) { if (t.indexOf(a.slice(i, j)) >= 0) best = j - i; else break; }
      if (best >= Math.max(3, a.length * 0.5)) return true;
      if (squash(text).length <= a.length * 1.6 && best >= Math.max(3, a.length * 0.35)) return true;
    }
    return false;
  }
  function maskAns(text, ans) {
    const a = plainS(ans).trim();
    let t = plainS(text); // ヒントは あとで ふりがなを つけなおす
    const forms = [a, a.replace(/\s+/g, "")].filter((x, i, arr) => x && arr.indexOf(x) === i);
    forms.forEach((f) => {
      if (/^[0-9.]{1,6}$/.test(f)) t = t.replace(new RegExp("(^|[^0-9.])" + esc(f) + "(?=$|[^0-9])", "g"), "$1□");
      else if (/^[0-9A-Za-z.]{1,3}$/.test(f)) t = t.replace(new RegExp("(^|[^0-9A-Za-z.])" + esc(f) + "(?=$|[^0-9A-Za-z])", "g"), "$1□");
      else if (f.length === 1) t = /[一-鿿]/.test(f) ? t.split(f).join("□") : t.replace(new RegExp("「" + esc(f) + "」", "g"), "「□」");
      else t = t.split(f).join("□");
    });
    return t;
  }
  const conceptOf = {}; D.concepts.forEach((c) => { conceptOf[c.id] = c; });
  let hintFixed = 0, hintFallback = 0;
  D.problems.forEach((p) => {
    const c = conceptOf[D.skillConcept[p.skill]];
    // 「«研究»の 読みは?」のような 問題では、ヒントの 中の その漢字にも ふりがなを つけない(ふりがなで こたえが わかる ため)
    const targets = (String(p.question).match(/«([^»]+)»/g) || []).map((x) => x.slice(1, -1));
    const wrapT = (hn) => targets.reduce((t, k) => String(t).split(k).join("«" + k + "»").replace(/««/g, "«").replace(/»»/g, "»"), hn);
    const dropT = (hn) => targets.reduce((t, k) => String(t).split(k).join(""), plainS(hn));
    const qs = squash(p.question);
    const useful = (t) => { const z = squash(dropT(t)); return z.length >= 3 && qs.indexOf(squash(t)) < 0 && !leaks(t, p.answer); };
    const fallback = (used) => {
      const cands = [];
      if (c) { c.examples.forEach((e) => cands.push("にた れい: " + e)); c.steps.forEach((st) => cands.push("やりかた: " + st)); }
      return cands.find((x) => !leaks(x, p.answer) && used.indexOf(plainS(x)) < 0 && squash(x).indexOf(qs) < 0) || null;
    };
    const out = [];
    p.hints.forEach((hnt, i) => {
      if (i > 0 && plainS(hnt) === plainS(p.hints[0])) return;
      if (!leaks(hnt, p.answer)) { out.push(hnt); return; }
      hintFixed++;
      const m = maskAns(hnt, p.answer);
      if (useful(m)) { out.push(m.replace(/(^|。)\s*□。?\s*$/, "$1 さあ、こたえの □ は?")); return; }
      const fb = fallback(out.map(plainS)); hintFallback++;
      if (fb) out.push(fb);
    });
    if (!out.length) { const fb = fallback([]); out.push(fb || "もんだいを もういちど ゆっくり 読んでみよう。"); }
    p.hints = targets.length ? out.map(wrapT) : out;
  });
  console.log("ヒントの こたえ かくし: " + hintFixed + " (にた れいに: " + hintFallback + ")");

  const deep = (o) => {
    if (typeof o === "string") return conv(o);
    if (Array.isArray(o)) return o.map(deep);
    if (o && typeof o === "object") { const r = {}; Object.keys(o).forEach((k) => { r[k] = ["id", "skill", "subject", "kind", "picture", "sub", "conf", "role"].indexOf(k) >= 0 ? o[k] : deep(o[k]); }); return r; }
    return o;
  };
  const out = { skills: deep(D.skills), concepts: deep(D.concepts), problems: deep(D.problems), skillConcept: D.skillConcept };
  // id類は変換しない(上の deep で除外)。skills.subject / problems.skill もそのまま。
  const cur = { subjects: C.subjects, units: C.units.map((u) => Object.assign({}, u, { name: conv(u.name), topics: u.topics.map(conv) })) };
  // 確認: 問題ごとに こたえが選択肢に入っているか
  out.problems.forEach((p) => { if (p.choices.indexOf(p.answer) < 0) throw new Error("answer not in choices: " + p.id); if (p.choices.length < 2) throw new Error("choices<2: " + p.id); });
  out.concepts.forEach((c) => c.checks.forEach((q) => { if (q.choices.indexOf(q.answer) < 0) throw new Error("check: " + c.id); }));
  const js = "/* 自動生成: tools/build.js (src/ を編集して作りなおす) */\nwindow.AOTO_DATA=" + JSON.stringify(out) + ";\nwindow.AOTO_CURRICULUM=" + JSON.stringify(cur) + ";\n";
  fs.writeFileSync(path.join(ROOT, "js", "data.js"), js);
  fs.writeFileSync(path.join(__dirname, "readings.txt"), [...usage.entries()].sort().map((e) => e[0] + "\t" + e[1]).join("\n"));
  console.log("skills", out.skills.length, "problems", out.problems.length, "concepts", out.concepts.length, "units", cur.units.length, "with content", cur.units.filter((u) => u.skills.length).length);
});
