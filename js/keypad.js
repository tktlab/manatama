/* まなたま: うって こたえる キーボード
 * こたえの かたちを みて、さんすう(すうじ)・えいご(アルファベット)・こくご(ひらがな) の
 * せんようキーボードを だす。こたえあわせは アプリが する(じぶんで まるを つけない)。 */
(function () {
  "use strict";
  var A = window.A, h = A.h;

  /* えらぶ ことが まえていの もんだい(「どれ?」など)は うてないので えらぶ だけに する */
  var CHOICE_Q = /どれ|どちら|どっち|えらぼう|えらんで|えらぶ|どの|あてはまる|ただしい|まちがい|なかま|ちがう\s*もの|いない\s*もの|ない\s*もの|ならべ/;

  /* ひらがなで うつのは「よみ」「□に はいる ことば」など、こたえが ひとつに きまる もんだい だけ */
  var KANA_Q = /よみ|読み|ひらがなで|□は\?|はんたい|まとめて|ローマ字|じゅつ語|述語|主語|「なにが」|「どうする」|「だれが」|だれが は/;
  function z2h(s) {
    return String(s)
      .replace(/[０-９]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xfee0); })
      .replace(/[．]/g, ".").replace(/[／]/g, "/").replace(/[：]/g, ":").replace(/[−－]/g, "-");
  }
  function numSegs(a) {
    // "2時50分" → ["2","時","50","分"]
    var t = z2h(a).replace(/\s+/g, "");
    return t.split(/([0-9]+)/).filter(function (x) { return x !== ""; });
  }
  function numOk(a) {
    if (/[。、]/.test(a)) return false;
    var t = z2h(a).trim();
    if (!/^[0-9]/.test(t) || t.replace(/\s/g, "").length > 12) return false;
    // ことばの まじった こたえ(「3つ とも おなじ」など)は えらぶ
    var words = t.split(/\s+/);
    if (words.length > 2) return false;
    var segs = numSegs(t).filter(function (x) { return !/^[0-9]+$/.test(x); });
    if (segs.length > 3) return false;
    return segs.every(function (x) { return x.length <= 3; });
  }
  function enOk(a) { return /^[A-Za-z][A-Za-z .,'’!?-]*$/.test(a) && a.length <= 26 && a.trim().split(/\s+/).length <= 5; }
  function kanaOk(a) { return /^[ぁ-んー]+$/.test(a) && a.length <= 7; }

  function normNum(s) { return z2h(s).replace(/\s+/g, ""); }
  function normEn(s, single) {
    var t = String(s).replace(/[’`]/g, "'").replace(/[.,!?]/g, "").replace(/\s+/g, " ").trim();
    return single ? t : t.toLowerCase();
  }

  /* もんだいに あう キーボードを きめる。だめなら null(えらぶ だけ) */
  A.keypadMode = function (p, sk) {
    var q = A.plain(p.question), a = A.plain(p.answer).trim();
    if (CHOICE_Q.test(q)) return null;
    var subj = sk && sk.subject;
    // さんすう・えいごの すうじ(りか・しゃかいの「おぼえる」もんだいは えらぶ まま)
    if ((subj === "算数" || subj === "英語") && numOk(a) && !/から|ごろ|約/.test(a)) {
      var toks = [];
      var hasUnit = numSegs(a).some(function (x) { return !/^[0-9]+$/.test(x) && !/^[.\/:]$/.test(x); });
      var add = function (x) {
        if (/^[.\/]$/.test(x) || toks.indexOf(x) >= 0 || toks.length >= 8) return;
        if (!/^[a-zA-Z²³°%:]+$/.test(x) && !/^[ぁ-ん一-龥]+$/.test(x)) return;
        toks.push(x);
      };
      numSegs(a).forEach(function (x) { if (!/^[0-9]+$/.test(x)) add(x); });
      // おなじ たんげんの ほかの たんい(cm と mm など)も ならべて、かたちを じぶんで えらぶ
      if (hasUnit) (A.keypadSiblings ? A.keypadSiblings(p) : []).forEach(function (b) {
        b = A.plain(b);
        if (numOk(b)) numSegs(b).forEach(function (x) { if (!/^[0-9]+$/.test(x) && x.length <= 3) add(x); });
      });
      // キーにも ふりがなを つける(「時」→ じ)
      var labels = {};
      [p.answer].concat(A.keypadSiblings ? A.keypadSiblings(p) : []).forEach(function (raw) {
        String(raw).replace(/\{([^{}|]+)\|([^{}|]+)\}/g, function (all, base) { if (!labels[base]) labels[base] = all; return all; });
      });
      return { type: "num", answer: a, tokens: toks.sort(function (x, y) { return x.length - y.length; }), labels: labels };
    }
    if ((subj === "英語" || subj === "国語") && enOk(a)) return { type: "en", answer: a, single: a.length === 1 };
    if (subj === "国語" && kanaOk(a) && KANA_Q.test(q)) return { type: "kana", answer: a, alt: /が$/.test(a) && a.length > 2 ? a.slice(0, -1) : null };
    return null;
  };
  A.keypadCheck = function (m, input) {
    if (m.type === "num") return normNum(input) === normNum(m.answer);
    if (m.type === "en") return normEn(input, m.single) === normEn(m.answer, m.single);
    var t = String(input).replace(/\s/g, "");
    return t === m.answer || (!!m.alt && t === m.alt);
  };

  /* ---------- ひらがなの ゛゜小 ---------- */
  var DAK = { "か": "が", "き": "ぎ", "く": "ぐ", "け": "げ", "こ": "ご", "さ": "ざ", "し": "じ", "す": "ず", "せ": "ぜ", "そ": "ぞ", "た": "だ", "ち": "ぢ", "つ": "づ", "て": "で", "と": "ど", "は": "ば", "ひ": "び", "ふ": "ぶ", "へ": "べ", "ほ": "ぼ" };
  var HAN = { "は": "ぱ", "ひ": "ぴ", "ふ": "ぷ", "へ": "ぺ", "ほ": "ぽ", "ば": "ぱ", "び": "ぴ", "ぶ": "ぷ", "べ": "ぺ", "ぼ": "ぽ" };
  var SML = { "あ": "ぁ", "い": "ぃ", "う": "ぅ", "え": "ぇ", "お": "ぉ", "つ": "っ", "や": "ゃ", "ゆ": "ゅ", "よ": "ょ" };
  function inv(m) { var o = {}; Object.keys(m).forEach(function (k) { o[m[k]] = k; }); return o; }
  var DAKr = inv(DAK), SMLr = inv(SML), HANr = { "ぱ": "は", "ぴ": "ひ", "ぷ": "ふ", "ぺ": "へ", "ぽ": "ほ" };
  function modLast(s, kind) {
    if (!s) return s;
    var c = s.slice(-1), r = c;
    if (kind === "dak") r = DAK[c] || DAKr[c] || (HANr[c] ? DAK[HANr[c]] : c);
    if (kind === "han") r = HAN[c] || HANr[c] || c;
    if (kind === "sml") r = SML[c] || SMLr[c] || (c === "づ" ? "っ" : c);
    return s.slice(0, -1) + r;
  }
  var KANA = ["あいうえお", "かきくけこ", "さしすせそ", "たちつてと", "なにぬねの", "はひふへほ", "まみむめも", "や ゆ よ", "らりるれろ", "わ   を", "ん    "];

  /* o: {mode, onSubmit(text), say(bool)} */
  A.keypad = function (o) {
    var m = o.mode, val = "", shift = !!(m.single && /[A-Z]/.test(m.answer));
    var disp = h("div", { class: "kp-disp kp-" + m.type, "aria-live": "polite" });
    var root = h("section", { class: "keypad kp-" + m.type });
    function paint() {
      disp.textContent = "";
      disp.appendChild(val ? h("span", { class: "kp-val" }, val) : h("span", { class: "kp-ph" }, m.type === "num" ? "ここに すうじが でるよ" : m.type === "en" ? "type here" : "ここに もじが でるよ"));
      disp.appendChild(h("span", { class: "kp-caret" }, ""));
      go.disabled = val.trim() ? null : true;
    }
    function put(t) {
      if (val.length >= 30) return;
      val += t; A.sfx("tap"); paint();
      if (o.say && m.type === "kana" && t.trim()) A.speak(t, true);
    }
    function key(label, fn, cls, t) {
      return h("button", { class: "kp-key" + (cls ? " " + cls : ""), type: "button", "data-t": t || null, onclick: fn }, label);
    }
    var go = h("button", { class: "btn big go kp-go", onclick: function () { if (val.trim()) o.onSubmit(val); } }, "✅ こたえる");
    var del = key("⌫", function () { val = val.slice(0, -1); A.sfx("tap"); paint(); }, "fn");
    var rows = [];
    if (m.type === "num") {
      rows.push(h("div", { class: "kp-grid num" },
        ["7", "8", "9", "4", "5", "6", "1", "2", "3"].map(function (d) { return key(d, function () { put(d); }); }),
        key("0", function () { put("0"); }), key(".", function () { put("."); }, "sym"), key("/", function () { put("/"); }, "sym")));
      if (m.tokens.length) rows.push(h("div", { class: "kp-row toks" }, m.tokens.map(function (t) { return key((m.labels && m.labels[t]) || t, function () { put(t); }, "tok", t); })));
      rows.push(h("div", { class: "kp-row" }, key("ぜんぶ けす", function () { val = ""; paint(); }, "fn wide"), del));
    } else if (m.type === "en") {
      var letters = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
      var draw = function () {
        letterBox.textContent = "";
        letters.forEach(function (r) {
          letterBox.appendChild(h("div", { class: "kp-row" }, r.split("").map(function (c) {
            var ch = shift ? c.toUpperCase() : c;
            return key(ch, function () { put(ch); if (shift && !m.single) { shift = false; draw(); } });
          })));
        });
        letterBox.appendChild(h("div", { class: "kp-row" },
          key(shift ? "⇧ ABC" : "⇧ abc", function () { shift = !shift; draw(); }, "fn" + (shift ? " on" : "")),
          key("'", function () { put("'"); }, "sym"),
          key("␣ space", function () { put(" "); }, "fn wide"),
          key("?", function () { put("?"); }, "sym"),
          del));
      };
      var letterBox = h("div", { class: "kp-letters" });
      draw();
      rows.push(letterBox);
    } else {
      rows.push(h("div", { class: "kp-kana-grid" }, KANA.map(function (r) {
        return h("div", { class: "kp-col" }, r.split("").map(function (c) {
          return c === " " ? h("span", { class: "kp-key blank" }) : key(c, function () { put(c); });
        }));
      })));
      rows.push(h("div", { class: "kp-row" },
        key("゛", function () { val = modLast(val, "dak"); A.sfx("tap"); paint(); }, "sym"),
        key("゜", function () { val = modLast(val, "han"); A.sfx("tap"); paint(); }, "sym"),
        key("小", function () { val = modLast(val, "sml"); A.sfx("tap"); paint(); }, "sym"),
        key("ー", function () { put("ー"); }, "sym"),
        del));
    }
    var sayBtn = h("button", { class: "btn-ghost icon say", "aria-label": "うった もじを よむ", onclick: function () { if (val) A.speak(val, true); } }, "🔊");
    root.appendChild(h("div", { class: "kp-top" }, disp, sayBtn));
    rows.forEach(function (r) { root.appendChild(r); });
    root.appendChild(go);
    paint();
    root.clear = function () { val = ""; paint(); };
    return root;
  };
  A.keypadModLast = modLast;
})();
