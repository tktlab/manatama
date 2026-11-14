/* まなたま 教材チェック: node check.js
 * - こたえが選択肢にあるか / 選択肢がかぶっていないか / 3つ以上あるか
 * - かんたんな計算問題(a＋b＝? など)の こたえが正しいか 計算して確かめる
 * - 説明(concept)・確かめ・前提がそろっているか、スキルに問題が4つ以上あるか
 * - 「わからない」で出る説明に、その問題のヒントがあるか
 */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "js", "data.js"), "utf8"), ctx);
const D = ctx.window.AOTO_DATA, C = ctx.window.AOTO_CURRICULUM;
const plain = (t) => String(t).replace(/\{([^{}|]+)\|[^{}|]+\}/g, "$1").replace(/[¦«»]/g, "");
const errs = [], warns = [], give = [];
const KATA = /[\u30a1-\u30f6]/, KAN = /[\u4e00-\u9fff]/, LAT = /[A-Za-z]/;
const concepts = {}; D.concepts.forEach((c) => (concepts[c.id] = c));
const bySkill = {};
D.problems.forEach((p) => {
  (bySkill[p.skill] = bySkill[p.skill] || []).push(p);
  const ch = p.choices.map(plain), ans = plain(p.answer);
  if (ch.indexOf(ans) < 0) errs.push(p.id + " こたえが選択肢にない");
  if (new Set(ch).size !== ch.length) errs.push(p.id + " 選択肢がかぶっている: " + ch.join(" / "));
  if (ch.length < 3) warns.push(p.id + " 選択肢が" + ch.length + "つ");
  if (!p.hints || !p.hints[0]) errs.push(p.id + " ヒントがない");
  // 見ただけで答えが わかってしまわないか(答えだけ 文字の種類が ちがう・答えだけ 長すぎる)
  const others = ch.filter((c) => c !== ans);
  [["カタカナ", KATA], ["漢字", KAN], ["英字", LAT]].forEach(([nm, re]) => {
    if (others.length >= 2 && re.test(ans) !== re.test(others[0]) && others.every((o) => re.test(o) === re.test(others[0]))) give.push(p.id + " 答えだけ" + nm + (re.test(ans) ? "あり" : "なし") + ": " + ans + " / " + others.join(","));
  });
  if (others.length && ans.length >= 2 * Math.max.apply(null, others.map((o) => o.length)) && ans.length > 6) give.push(p.id + " 答えだけ長い: " + ans);
  if (!p.explanation) errs.push(p.id + " 解説がない");
  const q = plain(p.question).replace(/\s/g, "");
  let m = q.match(/^(\d+(?:\.\d+)?)([＋−×÷])(\d+(?:\.\d+)?)＝\?$/);
  if (m) {
    const a = +m[1], b = +m[3], op = m[2];
    let v;
    if (op === "＋") v = a + b; else if (op === "−") v = a - b; else if (op === "×") v = a * b;
    else { const q0 = Math.floor(a / b), r = Math.round((a - q0 * b) * 1000) / 1000; v = Number.isInteger(a) && Number.isInteger(b) && r ? q0 + "あまり" + r : a / b; }
    v = typeof v === "number" ? String(Math.round(v * 1000) / 1000) : v;
    if (v !== ans) errs.push(p.id + " 計算ちがい? " + q + " こたえ=" + ans + " 計算=" + v);
  }
});
D.skills.forEach((s) => {
  const n = (bySkill[s.id] || []).length;
  if (n < 4) errs.push(s.id + " 問題が" + n + "こ");
  const c = concepts[D.skillConcept[s.id]];
  if (!c) { errs.push(s.id + " 説明がない"); return; }
});
D.concepts.forEach((c) => {
  if (!c.meaning || !c.examples.length || !c.steps.length) errs.push(c.id + " 説明が足りない");
  if (!c.checks.length) errs.push(c.id + " 確かめがない");
  c.checks.forEach((k) => { if (k.choices.map(plain).indexOf(plain(k.answer)) < 0) errs.push(c.id + " 確かめのこたえ"); });
  c.prerequisites.forEach((id) => { if (!concepts[id]) errs.push(c.id + " 前提が見つからない: " + id); });
});
const units = C.units.length, filled = C.units.filter((u) => u.skills.length).length;
const empty = C.units.filter((u) => !u.skills.length).map((u) => u.id + " " + plain(u.name));
console.log("単元 " + filled + "/" + units + "  スキル " + D.skills.length + "  問題 " + D.problems.length);
if (empty.length) console.log("教材のない単元:\n  " + empty.join("\n  "));
if (give.length) console.log("見た目で答えが わかるかも " + give.length + ":\n  " + give.join("\n  "));
if (warns.length) console.log("注意 " + warns.length + ":\n  " + warns.slice(0, 30).join("\n  "));
if (errs.length) { console.log("エラー " + errs.length + ":\n  " + errs.join("\n  ")); process.exit(1); }
console.log("OK");
