/* まなたま 教材の書き方(ビルド時に使う)
 * - 漢字はふつうに書く。tools/build.js が自動でふりがな {漢字|かんじ} を付ける。
 * - 読みを自分で決めたいときは {何|なん} のように書く。
 * - 「この漢字の読みは?」の問題などで ふりがなを付けたくない所は «学校» のように囲む。
 * - 数の問題は gen(r, i) で作る(ビルドのたびに同じ問題になるよう、乱数は固定)。
 */
(function () {
  "use strict";
  var D = (window.AOTO_DATA = { skills: [], concepts: [], problems: [], skillConcept: {} });
  var C = (window.AOTO_CURRICULUM = { subjects: ["国語", "算数", "生活", "理科", "社会", "英語"], units: [] });
  var CODE = { 国語: "ko", 算数: "sa", 生活: "se", 理科: "ri", 社会: "sh", 英語: "en" };
  var counter = {};

  /* 単元(教科 × 学年)。skills は あとで skill() が足す */
  function unit(sub, g, name, topics, conf) {
    var key = CODE[sub] + g;
    counter[key] = (counter[key] || 0) + 1;
    var id = key + "-" + (counter[key] < 10 ? "0" : "") + counter[key];
    C.units.push({ id: id, sub: sub, g: g, name: name, topics: topics || [], skills: [], conf: conf || "typical", order: C.units.length });
    return id;
  }

  /* 乱数(シード固定) */
  function rng(seed) {
    var s = 0;
    for (var i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
    s = s || 1;
    var r = function () {
      s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
    r.int = function (a, b) { return a + Math.floor(r() * (b - a + 1)); };
    r.pick = function (arr) { return arr[Math.floor(r() * arr.length)]; };
    return r;
  }

  /* こたえ + まちがい を重複なく並べる(こたえが先頭) */
  function opts(ans, wrongs) {
    var out = [String(ans)];
    wrongs.forEach(function (w) {
      w = String(w);
      if (out.indexOf(w) < 0 && w !== "" && w !== "NaN" && !/^-/.test(w)) out.push(w);
    });
    return out;
  }
  /* 数のこたえの まちがい候補 */
  function near(ans, extra) {
    var a = Number(ans), c = (extra || []).slice();
    c.push(a + 1, a - 1, a + 10, a - 10, a + 2, a - 2);
    var o = opts(ans, c);
    return o.slice(0, 4).length >= 4 ? o.slice(0, 4) : opts(ans, c.concat([a + 3, a + 5, a + 4])).slice(0, 4);
  }

  function skill(o) {
    var id = o.id;
    D.skills.push({ id: id, subject: o.sub, name: o.name, prerequisites: [], stage: 1 });
    D.concepts.push({
      subject: o.sub, id: id, title: o.title || o.name, meaning: o.meaning,
      examples: o.examples, steps: o.steps, prerequisites: o.prereq || [],
      checks: o.checks.map(function (c) { return { question: c[0], choices: opts(c[1][0], c[1].slice(1)), answer: String(c[1][0]), explanation: c[2] }; }),
      visuals: o.visuals || null,
    });
    D.skillConcept[id] = id;
    var list = (o.probs || []).slice();
    if (o.gen) {
      var r = rng(id), seen = {}, tries = 0;
      while (list.length < (o.n || 12) && tries++ < 400) {
        var p = o.gen(r, list.length);
        if (!p || seen[p[0]]) continue;
        seen[p[0]] = 1; list.push(p);
      }
    }
    list.forEach(function (p, i) {
      var ch = opts(p[1][0], p[1].slice(1));
      D.problems.push({ id: id + "-" + (i + 1), skill: id, question: p[0], choices: ch, answer: ch[0], hints: [p[2], p[3] || p[2]], explanation: p[3] || p[2], visual: p[4] || null });
    });
    var u = C.units.filter(function (x) { return x.id === o.unit; })[0];
    if (!u) throw new Error("unit? " + o.unit + " for " + id);
    u.skills.push(id);
  }

  /* 図 */
  function dots(title, caption, groups, join) {
    return { kind: "objects", title: title || "ならべて 見よう", caption: caption, groups: groups.map(function (g) { return { label: g[0], count: g[1], removed: g[2] }; }), join: join || "" };
  }
  function line(caption, start, end, move, min, max) {
    return { kind: "number-line", title: "かずの みちで 見よう", caption: caption, start: start, end: end, move: move, min: min, max: max };
  }
  function flow(caption, nodes, title) {
    return { kind: "flow", title: title || "じゅんばんに 見よう", caption: caption, nodes: nodes.map(function (n) { return { label: n[0], detail: n[1] }; }), join: "↓" };
  }
  function frac(caption, bars, join) {
    return { kind: "fractions", title: "おなじ 大きさに 分けて 見よう", caption: caption, bars: bars.map(function (b) { return { label: b[0], parts: b[1], taken: b[2] }; }), join: join || "" };
  }
  function pics(caption, items, title) {
    return { kind: "pictures", title: title || "絵で 見よう", caption: caption, items: items.map(function (i) { return { picture: i[0], label: i[1], detail: i[2] || "" }; }) };
  }

  function clock(h, m, caption) {
    return { kind: "clock", title: "とけい", caption: caption || "", h: h, m: m };
  }
  window.M = { clock: clock, unit: unit, skill: skill, opts: opts, near: near, rng: rng, dots: dots, line: line, flow: flow, frac: frac, pics: pics, D: D, C: C };
})();
