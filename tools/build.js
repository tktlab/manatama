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
    const spaced = /[ 　]/.test(text); // すでに 分かち書き してある 文には 区切りを 足さない
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
  const PRE = [["樹形図", "{樹形図|じゅけいず}"], ["帯分数", "{帯|たい}分数"], ["帯グラフ", "{帯|たい}グラフ"], ["仮分数", "{仮|か}分数"], ["大文字", "{大文字|おおもじ}"], ["小文字", "{小文字|こもじ}"],
    ["日本", "{日本|にほん}"], ["図形", "{図形|ずけい}"], ["米づくり", "{米|こめ}づくり"], ["球", "{球|きゅう}"], ["値", "{値|あたい}"], ["何分", "{何分|なんぷん}"], ["何時", "{何時|なんじ}"],
    ["通り", "{通|とお}り"], ["何人", "{何人|なんにん}"], ["何倍", "{何|なん}倍"],
    ["公助", "{公助|こうじょ}"], ["自助", "{自助|じじょ}"], ["共助", "{共助|きょうじょ}"], ["二酸化炭素", "{二酸化炭素|にさんかたんそ}"], ["酸素", "{酸素|さんそ}"], ["ちっ素", "ちっ{素|そ}"], ["ヨウ素", "ヨウ{素|そ}"],
    ["令和", "{令和|れいわ}"], ["狩野永徳", "{狩野永徳|かのうえいとく}"], ["日清", "{日清|にっしん}"], ["日露", "{日露|にちろ}"], ["最頻値", "{最頻値|さいひんち}"], ["梅雨", "{梅雨|つゆ}"],
    ["雪舟", "{雪舟|せっしゅう}"], ["清少納言", "{清少納言|せいしょうなごん}"], ["孟浩然", "{孟浩然|もうこうねん}"], ["持統天皇", "{持統|じとう}天皇"], ["翁", "{翁|おきな}"], ["柿食へば", "{柿|かき}{食|く}へば"],
    ["遣隋使", "{遣隋使|けんずいし}"], ["遣唐使", "{遣唐使|けんとうし}"], ["野球", "{野球|やきゅう}"], ["結ろ", "{結|けつ}ろ"], ["永久", "{永久|えいきゅう}"], ["発ぽう", "{発|はっ}ぽう"],
    ["目もり", "{目|め}もり"], ["日本国憲法", "{日本国憲法|にほんこくけんぽう}"], ["平家", "{平家|へいけ}"], ["伊能忠敬", "{伊能忠敬|いのうただたか}"], ["一目で", "{一目|ひとめ}で"], ["五音", "{五音|ごおん}"],
    ["半月", "{半月|はんげつ}"], ["何等星", "{何等星|なんとうせい}"], ["卑弥呼", "{卑弥呼|ひみこ}"], ["時代", "{時代|じだい}"], ["北条時宗", "{北条時宗|ほうじょうときむね}"], ["金星", "{金星|きんせい}"],
    ["福沢諭吉", "{福沢諭吉|ふくざわゆきち}"], ["緑色", "{緑色|みどりいろ}"], ["香具山", "{香具山|かぐやま}"], ["附子", "{附子|ぶす}"], ["後継者", "{後継者|こうけいしゃ}"], ["四角形", "{四角形|しかくけい}"], ["三角形", "{三角形|さんかくけい}"]];
  function conv(str) {
    if (typeof str !== "string" || !str) return str;
    if (cache.has(str)) return cache.get(str);
    const key = str;
    str = str.split(/(«[^»]*»)/).map((seg) => seg[0] === "«" ? seg : PRE.reduce((a, p) => a.split(p[0]).join(p[1]), seg)).join("");
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
