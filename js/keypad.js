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

  function normNum(s) { return z2h(s).replace(/\s+/g, "").replace(/度/g, "°"); }

  /* ---------- 「これも せいかい」の しくみ ---------- */
  // たんい(おなじ なかまの たんいは かんさん できる)
  var UNIT = {
    mm: ["len", 1], cm: ["len", 10], m: ["len", 1000], km: ["len", 1e6],
    g: ["wt", 1], kg: ["wt", 1000], t: ["wt", 1e6],
    mL: ["vol", 1], dL: ["vol", 100], L: ["vol", 1000],
  };
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  // こたえの「あたい」と「かたち」を しらべる
  function parseNum(s) {
    var t = normNum(s), m;
    if ((m = t.match(/^(\d+)と(\d+)\/(\d+)$/))) return { kind: "frac", n: +m[1] * +m[3] + +m[2], d: +m[3], mixed: true, red: gcd(+m[2], +m[3]) === 1 && +m[2] < +m[3] };
    if ((m = t.match(/^(\d+)\/(\d+)$/))) return { kind: "frac", n: +m[1], d: +m[2], mixed: false, red: gcd(+m[1], +m[2]) === 1 };
    if ((m = t.match(/^(\d+):(\d+)$/))) return { kind: "ratio", a: +m[1], b: +m[2], red: gcd(+m[1], +m[2]) === 1 };
    if ((m = t.match(/^(\d+(?:\.\d+)?)$/))) return { kind: "dec", v: +m[1], unit: "" };
    if ((m = t.match(/^(\d+(?:\.\d+)?)([^0-9.]+)$/))) {
      var u = UNIT[m[2]];
      return u ? { kind: "q", dim: u[0], v: +m[1] * u[1], unit: m[2] } : { kind: "dec", v: +m[1], unit: m[2] };
    }
    // 1cm 6mm / 8km300m / 1kg 200g のような ふたつの たんい
    if ((m = t.match(/^(\d+)([a-zA-Z]+)(\d+)([a-zA-Z]+)$/)) && UNIT[m[2]] && UNIT[m[4]] && UNIT[m[2]][0] === UNIT[m[4]][0]) {
      return { kind: "q", dim: UNIT[m[2]][0], v: +m[1] * UNIT[m[2]][1] + +m[3] * UNIT[m[4]][1], unit: m[2] + m[4] };
    }
    return null;
  }
  function shapeOf(s) { return normNum(s).replace(/\d+(\.\d+)?/g, "#"); }
  function numEquiv(input, m) {
    if (normNum(input) === normNum(m.answer)) return true;
    var A1 = parseNum(m.answer), B = parseNum(input), q = m.question || "";
    if (!A1 || !B) return false;
    // もんだいが かたちを きめている とき(「約分すると?」「仮分数に」「何mm?」「かんたんな比」など)は かたちも あわせる
    var needShape = /約分|かんたんな|簡単な|仮分数|帯分数|小数で|分数で|[何なん]\s*(mm|cm|m|km|g|kg|t|mL|dL|L)|何\s*[gm]|あまり/.test(q);
    var needReduced = /約分|かんたんな|簡単な/.test(q);
    if (A1.kind === "frac" && B.kind === "frac") {
      if (A1.n * B.d !== B.n * A1.d) return false;
      if (/仮分数/.test(q) && B.mixed) return false;
      if (/帯分数/.test(q) && !B.mixed) return false;
      if (needReduced && !B.red) return false;
      return true;
    }
    if (A1.kind === "ratio" && B.kind === "ratio") {
      if (A1.a * B.b !== B.a * A1.b) return false;
      return needReduced ? B.red : true;
    }
    if (A1.kind === "q" && B.kind === "q") {
      if (A1.dim !== B.dim || Math.abs(A1.v - B.v) > 1e-9) return false;
      return needShape ? shapeOf(input) === shapeOf(m.answer) : true;
    }
    if (A1.kind === "dec" && B.kind === "dec") return A1.unit === B.unit && Math.abs(A1.v - B.v) < 1e-9; // 0.50 と 0.5、05 と 5
    // 分数の こたえに 小数(1/2 と 0.5)は、もんだいが かたちを きめていなければ 〇
    if (!needShape && ((A1.kind === "frac" && B.kind === "dec" && !B.unit) || (A1.kind === "dec" && !A1.unit && B.kind === "frac"))) {
      var va = A1.kind === "frac" ? A1.n / A1.d : A1.v, vb = B.kind === "frac" ? B.n / B.d : B.v;
      return Math.abs(va - vb) < 1e-9;
    }
    return false;
  }
  var CONTRA = { "i'm": "i am", "you're": "you are", "we're": "we are", "they're": "they are", "he's": "he is", "she's": "she is", "it's": "it is", "that's": "that is",
    "what's": "what is", "where's": "where is", "who's": "who is", "i'd": "i would", "i'll": "i will", "let's": "let us", "don't": "do not", "doesn't": "does not",
    "didn't": "did not", "can't": "cannot", "isn't": "is not", "aren't": "are not", "wasn't": "was not", "won't": "will not", "haven't": "have not" };
  function normEn(s, single) {
    var t = String(s).replace(/[’`]/g, "'").replace(/[.,!?]/g, "").replace(/\s+/g, " ").trim();
    if (single) return t;
    t = t.toLowerCase().replace(/\bcan not\b/g, "cannot");
    return t.split(" ").map(function (w) { return CONTRA[w] || w; }).join(" ");
  }
  function hira(s) { return String(s).replace(/[ァ-ヶ]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0x60); }); }

  /* もんだいに あう キーボードを きめる。だめなら null(えらぶ だけ) */
  // こたえが いくつも ありうる もんだい(気もち・わけ・ようす など)は ひらがなで うたない
  var OPEN_Q = /どう\s|いえる|なるのは|特ちょう|とくちょう|次の\s*日|変化は|気持|気もち|きもち|どんな|なぜ|どうして|わけ|理由|りゆう|どう\s*なる|どうなる|どう\s*する|どうする|どうした|どう\s*した|様子|ようす|意味|いみ|考え|思い|おもい|ちがい|くふう|工夫|ため|よい|いい|大切|だいじ|気をつけ|しか|なに\s*を\s*する|何を\s*する/;
  var DEF_Q = /何と\s*いう|なんと\s*いう|何という|を\s*何|何性|方位|所在地|県は|市は|器官|名前|よぶ|呼ぶ|どこ|いつ|季節は|何曜日|何色|何月|将軍は|天皇は|したのは|建てた|つくりは|制度は|改革は|機関は|機械は|しせつは|気体は|島は|国は|工芸品は|重いのは|あたたかいのは|向きは|番号は/;
  A.keypadMode = function (p, sk) {
    var q = A.plain(p.question), a = A.plain(p.answer).trim();
    if (CHOICE_Q.test(q)) return null;
    var subj = sk && sk.subject;
    if (numOk(a) && !/から|ごろ|約/.test(a)) {
      var toks = [];
      var hasUnit = numSegs(a).some(function (x) { return !/^[0-9]+$/.test(x) && !/^[.\/:]$/.test(x); });
      var add = function (x) {
        if (/^[.\/]$/.test(x) || toks.indexOf(x) >= 0 || toks.length >= 8) return;
        if (!/^[a-zA-Z²³°%:]+$/.test(x) && !/^[ぁ-ん一-龥]+$/.test(x)) return;
        toks.push(x);
      };
      numSegs(a).forEach(function (x) { if (!/^[0-9]+$/.test(x)) add(x); });
      if (/と\d+\//.test(a) || /仮分数|帯分数/.test(q)) add("と");
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
      return { type: "num", answer: a, question: q, tokens: toks.sort(function (x, y) { return x.length - y.length; }), labels: labels };
    }
    if (enOk(a) && (subj === "英語" || subj === "国語" || /^[A-Z]{2,}[a-z]*$/.test(a))) return { type: "en", answer: a, single: a.length === 1 };
    // ひらがなで うつ: こたえの「よみ」を うつ(漢字の こたえも よみで OK)
    var yomi = hira(A.kana(p.answer).replace(/\s+/g, ""));
    if (/\s/.test(a) || !/^[ぁ-んー]+$/.test(yomi) || yomi.length > 8) return null;
    var kq = KANA_Q.test(q);
    // 国語は「よみ」など こたえが 1つの もんだいだけ。ほかの 教科は「何と いう?」のように 名前を きく もんだいだけ
    if (subj === "国語" ? !kq : !(kq || (DEF_Q.test(q) && !OPEN_Q.test(q)))) return null;
    if (yomi.length < 2 && !kq) return null;
    // これも せいかい: 「よこはまし」→「よこはま」、「くまもとけん」→「くまもと」、「しろ」→「しろいろ」、「にちようび」→「にちよう」
    var alts = [];
    if (/所在地|市は/.test(q) && /し$/.test(yomi)) alts.push(yomi.slice(0, -1));
    if (/県は/.test(q) && /けん$/.test(yomi)) alts.push(yomi.slice(0, -2));
    if (/何色/.test(q)) { alts.push(yomi + "いろ"); if (/いろ$/.test(yomi)) alts.push(yomi.slice(0, -2)); if (yomi === "おれんじ") alts.push("だいだい", "だいだいいろ"); }
    if (/何曜日/.test(q) && /び$/.test(yomi)) alts.push(yomi.slice(0, -1));
    return { type: "kana", answer: yomi, shown: a, alts: alts };
  };
  A.keypadCheck = function (m, input) {
    if (m.type === "num") return numEquiv(input, m);
    if (m.type === "en") return normEn(input, m.single) === normEn(m.answer, m.single);
    var t = hira(String(input).replace(/\s/g, ""));
    return t === m.answer || (m.alts || []).indexOf(t) >= 0;
  };
  A.keypadSame = function (m, input) { // うった ものが こたえと まったく おなじか(ちがう かきかたで 〇の とき 知らせる)
    if (m.type === "num") return normNum(input) === normNum(m.answer);
    if (m.type === "en") return String(input).replace(/[’`]/g, "'").replace(/[.,!?\s]/g, "").toLowerCase() === m.answer.replace(/[’`]/g, "'").replace(/[.,!?\s]/g, "").toLowerCase();
    return hira(String(input).replace(/\s/g, "")) === m.answer;
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
