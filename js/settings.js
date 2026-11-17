/* まなたま: がくねん えらび・みやすさ(文字・ふりがな・こえ・こたえの数)
 * 学年は「どの単元が出るか」だけを決める。見やすさ・読み上げは学年に関係なく、ひとりずつ変えられる。 */
(function () {
  "use strict";
  var A = window.A, h = A.h;
  function S() { return A.S; }

  A.applyView = function () {
    var z = S().settings.zoom || 1;
    try { document.body.style.zoom = z === 1 ? "" : String(z); } catch (e) {}
    document.documentElement.setAttribute("data-kana", S().settings.kana || "ruby");
  };

  /* ---------- がくねん ---------- */
  A.gradePick = function (next, first) {
    var C = A.core;
    var btns = [1, 2, 3, 4, 5, 6].map(function (g) {
      return h("button", { class: "grade-btn" + (S().grade === g ? " on" : ""), onclick: function () {
        S().grade = g; A.save(); A.sfx("good");
        A.speak(g + "ねんせい だね!");
        next();
      } }, h("b", null, String(g)), h("small", null, "ねんせい"));
    });
    var say = "なんねんせい かな? ボタンを おしてね。";
    C.view(first ? null : C.topbar("がくねん", next),
      h("section", { class: "welcome" },
        h("div", { class: "egg", "aria-hidden": "true" }, A.petEmoji()),
        h("h1", null, "なんねんせい かな?"),
        h("button", { class: "btn small", onclick: function () { A.speak(say, true); } }, "🔊 よんで"),
        h("div", { class: "grade-grid" }, btns),
        h("p", { class: "muted" }, "あとから「みやすさ」や「おとなのへや」で かえられるよ。")));
    if (first) setTimeout(function () { if (S().settings.voice) A.speak(say); }, 300);
  };

  /* ---------- みやすさ ---------- */
  function row(title, sayText, options, key, after) {
    var cur = S().settings[key];
    return h("section", { class: "set-row" },
      h("div", { class: "set-title" }, title,
        h("button", { class: "btn-ghost icon say", "aria-label": "よむ", onclick: function () { A.speak(sayText, true); } }, "🔊")),
      h("div", { class: "set-opts" }, options.map(function (o) {
        return h("button", { class: "set-opt" + (cur === o[0] ? " on" : ""), onclick: function () {
          S().settings[key] = o[0]; A.save(); A.sfx("tap");
          if (after) after(o[0]);
          A.applyView(); A.settingsRoom(A._setBack);
          if (o[2]) A.speak(o[2], true);
        } }, o[1]);
      })));
  }
  A.settingsRoom = function (back) {
    A._setBack = back;
    var C = A.core, st = S().settings;
    var sample = "{学校|がっこう}で {本|ほん}を {読|よ}む。";
    C.view(C.topbar("👀 みやすさ・こえ", back),
      h("p", { class: "note" }, "じぶんに あう ように えらんでね。いつでも かえて いいよ。"),
      row("🗣️ こえ", "こえを つかうか えらぶよ", [[true, "つかう", "こえを つかうよ"], [false, "つかわない"]], "voice", function (v) { if (!v) A.stopSpeak(); }),
      row("📢 もんだいを じどうで よむ", "もんだいが でたら じどうで よむか えらぶよ", [[true, "じどうで よむ", "もんだいが でたら よむね"], [false, "ボタンを おしたら よむ"]], "autoRead"),
      row("🐢 こえの はやさ", "こえの はやさを えらぶよ", [[0.75, "ゆっくり", "ゆっくり よむね"], [1, "ふつう", "ふつうの はやさで よむね"], [1.2, "はやめ", "すこし はやく よむね"]], "rate"),
      row("🈶 じの かきかた", "じの かきかたを えらぶよ", [["ruby", h("span", null, "かんじ＋ふりがな")], ["kana", "ひらがなだけ"], ["kanji", "かんじだけ"]], "kana"),
      h("div", { class: "set-sample" }, "れい: ", sample),
      row("🔍 じの おおきさ", "じの おおきさを えらぶよ", [[1, "ふつう"], [1.15, "おおきい"], [1.3, "とても おおきい"]], "zoom"),
      row("⌨️ こたえかた", "さいしょに でる こたえかたを えらぶよ。どちらでも、もんだいの とちゅうで かえられるよ。", [["type", "うって こたえる", "キーボードで うって こたえるよ"], ["choice", "えらんで こたえる", "えらんで こたえるよ"]], "answerMode"),
      row("🔢 こたえの かず", "えらぶ こたえの かずを えらぶよ。すくないと えらびやすいよ。", [[2, "2つ"], [3, "3つ"], [4, "4つ"]], "nChoice"),
      row("🔊 こうかおん", "ピコピコ なる おとを つかうか えらぶよ", [[true, "ならす"], [false, "ならさない"]], "sound"),
      h("button", { class: "btn big alt", onclick: function () { A.gradePick(function () { A.settingsRoom(back); }); } }, "🎒 がくねん: " + (S().grade || "?") + "ねんせい(かえる)"),
      h("button", { class: "btn big go", onclick: back }, "これで OK!"));
  };
})();
