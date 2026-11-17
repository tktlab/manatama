/* まなたま ゲーム本体: ホーム(育成)・ステージ・クイズ・ずかん・おとなのへや */
(function () {
  "use strict";
  var A = window.A, h = A.h, S = function () { return A.S; };
  var D = window.AOTO_DATA;
  var app = document.getElementById("app");

  /* ================= データ索引 ================= */
  var SUBJECTS = [
    { id: "国語", emoji: "📚", color: "#ff9f43", icons: ["🔤", "💬", "🧩", "📖", "✏️", "🔍", "💗", "📌", "📝"] },
    { id: "算数", emoji: "🧮", color: "#5b8def", icons: ["🔢", "🍎", "➕", "➖", "✖️", "➗", "🕒", "📏", "🍕", "🧮", "📐", "🎲"] },
    { id: "生活", emoji: "🌻", color: "#34c38f", icons: ["🏫", "🌱", "🌞", "🍁", "⛄", "🐞"] },
    { id: "理科", emoji: "🔬", color: "#2bb5c9", icons: ["🌱", "🐞", "☀️", "💡", "🧲", "🌡️", "🌙", "🧪", "⚖️"] },
    { id: "社会", emoji: "🌏", color: "#9b72e8", icons: ["🏘️", "🧭", "🏪", "🏭", "🚒", "🗾", "🍙", "🏯", "🌐"] },
    { id: "英語", emoji: "🗣️", color: "#e86ab0", icons: ["👋", "🔢", "🎨", "💗", "🔤", "📅", "☀️", "🕒", "🛍️"] },
  ];
  var skillMap = {}, bySubject = {}, probsBySkill = {};
  D.skills.forEach(function (s, i) { s._i = i; skillMap[s.id] = s; });
  SUBJECTS.forEach(function (sub) {
    bySubject[sub.id] = D.skills.filter(function (s) { return s.subject === sub.id; })
      .sort(function (a, b) { return a.stage - b.stage || a._i - b._i; });
    bySubject[sub.id].forEach(function (s, i) { s._icon = sub.icons[i % sub.icons.length]; });
  });
  D.problems.forEach(function (p) { (probsBySkill[p.skill] = probsBySkill[p.skill] || []).push(p); });
  /* ================= がくねん ================= */
  var CUR = window.AOTO_CURRICULUM;
  function grade() { return S().grade || 0; }
  /* その学年の 単元に ついている スキル(教材のじゅんばん) */
  function gradeSkills(sub, g) {
    g = g || grade();
    var seen = {}, out = [];
    CUR.units.forEach(function (u) {
      if (u.sub !== sub || u.g !== g) return;
      u.skills.forEach(function (id) { if (skillMap[id] && !seen[id]) { seen[id] = 1; out.push(skillMap[id]); } });
    });
    return out;
  }
  function gradeSubjects() {
    var g = grade();
    return SUBJECTS.filter(function (sub) { return CUR.units.some(function (u) { return u.sub === sub.id && u.g === g; }); });
  }
  function playableSubjects() { return gradeSubjects().filter(function (sub) { return gradeSkills(sub.id).length; }); }
  function skillGrade(id) { var u = CUR.units.filter(function (x) { return x.skills.indexOf(id) >= 0; })[0]; return u ? u.g : 0; }
  function subjectInfo(id) { return SUBJECTS.filter(function (s) { return s.id === id; })[0]; }
  var GOAL = 3; // 1日のミッション問題数

  /* ================= スキル進捗 ================= */
  function rec(id) {
    var s = S().skills;
    if (!s[id]) s[id] = { ok: 0, ng: 0, help: 0, probs: {} };
    return s[id];
  }
  function stars(id) {
    var r = S().skills[id];
    if (!r || !r.ok) return 0;
    var indep = Object.keys(r.probs).filter(function (k) { return r.probs[k].indep; }).length;
    return indep >= 2 ? 3 : indep >= 1 ? 2 : 1;
  }
  function prereqsOk(skill) {
    return (skill.prerequisites || []).every(function (id) { return !skillMap[id] || stars(id) >= 1; });
  }
  function totalStars(sub) {
    return bySubject[sub].reduce(function (n, s) { return n + stars(s.id); }, 0);
  }
  function recommendedFromList(list, ignorePrereq) {
    var i, r;
    for (i = 0; i < list.length; i++) {
      r = S().skills[list[i].id];
      if (stars(list[i].id) < 2 && (!r || r.ok < 3) && (ignorePrereq || prereqsOk(list[i]))) return list[i];
    }
    for (i = 0; i < list.length; i++) if (stars(list[i].id) < 3) return list[i];
    return list[Math.floor(Math.random() * list.length)];
  }
  function recommendedSkill(sub) {
    var list = gradeSkills(sub);
    if (!list.length) list = bySubject[sub];
    return recommendedFromList(list, true);
  }
  function pickProblem(skill, seen) {
    var list = probsBySkill[skill.id] || [];
    var r = S().skills[skill.id];
    var scored = list.map(function (p) {
      var pr = r && r.probs[p.id];
      var score = pr ? (pr.indep ? 3 : 1) + (pr.last || 0) / 1e13 : 0;
      if (seen && seen[p.id]) score += 10;
      return { p: p, s: score + Math.random() * 0.01 };
    }).sort(function (a, b) { return a.s - b.s; });
    return scored[0].p;
  }

  /* ================= なかま(育成) ================= */
  var CREATURES = A.creatures.list;
  var EVO = 11; // この ごはんの かずで しんか
  var THRESH = [0, 3, 8, 14]; // たまご / ひび / こども / おとな(そつぎょう)
  function activePet() {
    var s = S();
    if (!s.pets[s.active]) s.active = s.pets.length - 1;
    return s.pets[s.active];
  }
  function stageOf(p) {
    if (p.done) return 3;
    var st = 0;
    for (var i = 0; i < THRESH.length - 1; i++) if (p.food >= THRESH[i]) st = i;
    return st;
  }
  /* すがた: 0=たまご 1=ひび 2=こども 3=おとな(しんかごのすがた) */
  function formOf(p) {
    if (p.done || p.food >= EVO) return 3;
    return p.food >= THRESH[2] ? 2 : p.food >= THRESH[1] ? 1 : 0;
  }
  var FORM_BOUNDS = [0, THRESH[1], THRESH[2], EVO, THRESH[3]];
  var FORM_NEXT = ["ひびが はいるまで", "うまれるまで", "しんかまで", "そつぎょうまで"];
  function petArt(p, form) { return A.creatures.el(p.kind, form == null ? formOf(p) : form); }
  A.petEmoji = function () { var p = activePet(); return petArt(p); };
  function petName(p) {
    return p.name || CREATURES[p.kind % CREATURES.length].n;
  }
  /* つぎの たまごの しゅるい: まだ ずかんに ない子から えらぶ(レアは出にくい) */
  function nextKind() {
    var got = {};
    S().pets.forEach(function (q) { if (q.done) got[q.kind] = true; });
    var pool = CREATURES.filter(function (c) { return !got[c.kind]; });
    if (!pool.length) pool = CREATURES;
    var wsum = 0, ws = pool.map(function (c) { var w = c.r === 1 ? 4 : c.r === 2 ? 3 : 2; wsum += w; return w; });
    var x = Math.random() * wsum, i = 0;
    while (i < pool.length - 1 && x >= ws[i]) { x -= ws[i]; i++; }
    return pool[i].kind;
  }
  /* もんだいで ごはんを ゲット(ふくろに ためる) */
  function earn(n) {
    S().bag = (S().bag || 0) + n;
    return [];
  }
  /* ごはんを 1こ あげて、成長イベントを返す */
  function growBy(n) {
    var p = activePet(), fb = formOf(p), events = [];
    p.food += n;
    if (p.food >= THRESH[3]) {
      p.done = true;
      events.push({ t: "graduate", kind: p.kind, name: petName(p) });
      S().pets.push({ kind: nextKind(), name: "", food: 0, done: false });
      S().active = S().pets.length - 1;
      events.push({ t: "newegg" });
    } else {
      var fa = formOf(p);
      if (fa > fb) events.push({ t: fa === 1 ? "crack" : fa === 2 ? "hatch" : "evolve", kind: p.kind, name: petName(p), first: fa === 2 && !S().battleSeen });
    }
    return events;
  }
  function pet(size, cls) {
    var p = activePet(), f = formOf(p);
    return h("div", { class: "pet st" + f + " " + (cls || ""), style: { "font-size": (size || 96) + "px" }, role: "img", "aria-label": petName(p) },
      petArt(p, f));
  }

  /* ================= バトル(もんだい=てき。なかまが たおす) ================= */
  var ATTACK = {
    cute: { 2: ["ぽよぽよ たいあたり", ["⭐", "✨"]], 3: ["キラキラ ビーム", ["💖", "✨", "🌈"]] },
    cool: { 2: ["ガブッと こうげき", ["💥", "💢"]], 3: ["ひっさつ ほのお斬り", ["🔥", "⚡", "💥"]] },
  };
  var TAUNTS = ["とけるかな〜?", "ふふふ…", "わかるかな?", "かかってこい!", "この もんだい むずかしいぞ〜"];
  /* たたかう なかま: いま育てている子が うまれていれば その子、まだ たまごなら さいごに そつぎょうした子。だれも いなければ バトルなし */
  function fighterPet() {
    var gp = A.gacha && A.gacha.partner();
    if (gp) return { gacha: gp };
    var a = activePet();
    if (formOf(a) >= 2) return a;
    var ps = S().pets;
    for (var i = ps.length - 1; i >= 0; i--) if (ps[i].done) return ps[i];
    return null;
  }
  function burst(stage, emojis, n, rect) {
    var sr = stage.getBoundingClientRect();
    var cx = rect.left + rect.width / 2 - sr.left, cy = rect.top + rect.height / 2 - sr.top;
    for (var i = 0; i < n; i++) {
      var a = (i / n) * 6.28 + Math.random(), d = 40 + Math.random() * 40;
      var sp = h("span", { class: "fx-spark", style: { left: cx + "px", top: cy + "px", "--dx": Math.cos(a) * d + "px", "--dy": Math.sin(a) * d + "px" } }, emojis[i % emojis.length]);
      stage.appendChild(sp);
      setTimeout(function (x) { return function () { if (x.parentNode) x.parentNode.removeChild(x); }; }(sp), 1000);
    }
  }
  function runFx(stage, fighter, foe, talk, fx, c, form) {
    if (!stage.parentNode) return;
    var fr = fighter.getBoundingClientRect(), er = foe.getBoundingClientRect();
    if (fx === "counter") {
      fighter.classList.add("hurt"); foe.classList.add("jeer");
      burst(stage, ["💢"], 3, fr);
      return;
    }
    fighter.style.setProperty("--dx", Math.max(40, er.left - fr.left - fr.width * 0.4) + "px");
    fighter.classList.add("lunge");
    var atk = ATTACK[c.type === "cool" ? "cool" : "cute"][form >= 3 ? 3 : 2];
    var label = fx === "special" ? "💡 ひらめき " + atk[0] + "!" : fx === "crit" ? "かいしん! " + atk[0] : atk[0];
    setTimeout(function () {
      foe.classList.add("hit");
      burst(stage, fx === "special" ? atk[1].concat(["💡", "🌟"]) : atk[1], fx === "attack" ? 6 : 12, er);
      stage.appendChild(h("div", { class: "fx-banner" }, label));
      A.sfx("pop");
    }, 330);
    setTimeout(function () { foe.classList.remove("hit"); foe.classList.add("dead"); talk.textContent = "やられた〜!"; burst(stage, ["💨"], 4, er); }, 760);
  }
  function battleStage() {
    var f = fighterPet();
    if (!f || !Q || !Q.foe) { Q && (Q.fx = null); return null; }
    var fx = Q.fx; Q.fx = null;
    var form, c, fighter;
    if (f.gacha) { var gs = A.gacha.stageOf(f.gacha.id); form = gs >= 2 ? 3 : 2; c = f.gacha; fighter = h("div", { class: "fighter" }, A.gacha.el(f.gacha.id, gs)); }
    else { form = formOf(f); c = CREATURES[f.kind % CREATURES.length]; fighter = h("div", { class: "fighter" }, A.creatures.el(f.kind, form)); }
    var foe = h("div", { class: "foe" + (fx === "appear" ? " appear" : "") + (Q.done && !fx ? " gone" : "") }, A.enemies.el(Q.foe.e.id, Q.foe.hue));
    var talk = h("div", { class: "taunt" }, Q.done && !fx ? "やられた〜!" : Q.taunt);
    var stage = h("div", { class: "battle", "aria-label": Q.foe.e.n + "が あらわれた" }, fighter, foe, talk);
    var wrap = h("div", { class: "battle-wrap" }, stage);
    if (!S().battleSeen) {
      S().battleSeen = true; A.save();
      wrap.appendChild(h("div", { class: "note good" }, "⚔️ ここから なかまが たたかうよ! もんだいを とくと、てきを やっつけて ごはんを おとすよ!"));
    }
    if (fx && fx !== "appear") setTimeout(function () { runFx(stage, fighter, foe, talk, fx, c, form); }, 40);
    return wrap;
  }

  /* ================= ストリーク・記録 ================= */
  function touchDay(correct) {
    var s = S(), today = A.dayKey();
    if (!s.days[today]) s.days[today] = { n: 0, ok: 0 };
    s.days[today].n++;
    if (correct) s.days[today].ok++;
    var st = s.streak;
    if (st.last !== today) {
      var gap = st.last ? A.daysBetween(st.last, today) : 99;
      st.n = gap >= 1 && gap <= 2 ? st.n + 1 : 1; // 1日おやすみまでは続く
      st.last = today;
    }
  }
  function todayCount() { var d = S().days[A.dayKey()]; return d ? d.n : 0; }
  function logEvent(e) {
    var s = S();
    s.log.push(e);
    if (s.log.length > 300) s.log = s.log.slice(-300);
  }

  /* ================= 画面部品 ================= */
  function view() {
    A.clear(app);
    (function put(list) {
      for (var i = 0; i < list.length; i++) {
        if (Array.isArray(list[i])) put(list[i]);
        else if (list[i]) app.appendChild(list[i]);
      }
    })(arguments);
    window.scrollTo(0, 0);
  }
  A.toast = function (text) {
    var t = h("div", { class: "toast", role: "status" }, text);
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2400);
  };
  A.confetti = function (n) {
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var bits = ["✨", "⭐", "🎉", "🍙", "💖", "🌟"];
    var wrap = h("div", { class: "confetti", "aria-hidden": "true" });
    for (var i = 0; i < (n || 18); i++) {
      wrap.appendChild(h("span", { style: { left: Math.random() * 100 + "%", "animation-delay": Math.random() * 0.6 + "s", "font-size": 18 + Math.random() * 18 + "px" } }, bits[i % bits.length]));
    }
    document.body.appendChild(wrap);
    setTimeout(function () { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }, 2800);
  };
  function topbar(title, onBack) {
    return h("div", { class: "topbar" },
      onBack ? h("button", { class: "btn-ghost", onclick: onBack }, "← もどる") : h("span"),
      title ? h("div", { class: "topbar-title" }, title) : null,
      h("span"));
  }
  function overlay(face, title, text, btn, onClose) {
    A.sfx("levelup"); A.confetti(26);
    var box = h("div", { class: "overlay", role: "dialog", "aria-modal": "true" },
      h("div", { class: "overlay-card" },
        h("div", { class: "overlay-face" }, face),
        h("h2", null, title),
        h("p", null, text),
        h("button", { class: "btn big good", onclick: function () {
          if (box.parentNode) box.parentNode.removeChild(box);
          if (onClose) onClose();
        } }, btn || "やったー!")));
    document.body.appendChild(box);
    if (S().settings.voice) A.speak(title + "。" + text);
  }
  function showEvents(events, after) {
    if (!events.length) return after && after();
    var e = events.shift();
    var next = function () { showEvents(events, after); };
    var c = CREATURES[e.kind % CREATURES.length];
    var cool = c && c.type === "cool";
    if (e.t === "crack") overlay(A.creatures.el(e.kind, 1), "たまごに ひびが!", "もうすぐ うまれるよ!", "どきどき!", next);
    else if (e.t === "hatch") overlay(A.creatures.el(e.kind, 2), "うまれたよ!", e.name + "が なかまに なった! (" + c.n + ")" + (e.first ? " これから もんだいの てきが でてくるよ。なかまと いっしょに やっつけよう!" : ""), "よろしくね!", next);
    else if (e.t === "evolve") overlay(A.creatures.el(e.kind, 3), "しんかしたよ!", e.name + "が " + (cool ? "かっこよく" : "かわいく") + " しんかした!", "すごーい!", next);
    else if (e.t === "graduate") overlay(A.creatures.el(e.kind, 3), "りっぱに そだったよ!", e.name + "は ずかんに のったよ!", "すごい!", next);
    else if (e.t === "newegg") overlay(A.creatures.el(S().pets[S().active].kind, 0), "あたらしい たまご!", "つぎの なかまが やってきたよ", "わーい!", next);
    else next();
  }
  function petNameFor(e) { return e.name; }
  function renameDialog(p) {
    var input = h("input", { class: "name-input", maxlength: "8", placeholder: "あたらしい なまえ", "aria-label": "なまえ", value: p.name || "" });
    var box = h("div", { class: "overlay", role: "dialog", "aria-modal": "true" },
      h("div", { class: "overlay-card" },
        h("h2", null, "なまえを かえる"), input,
        h("button", { class: "btn big good", onclick: function () {
          p.name = (input.value || "").trim().slice(0, 8); A.save(); A.sfx("good");
          if (box.parentNode) box.parentNode.removeChild(box); home();
        } }, "これに する!"),
        h("button", { class: "btn-ghost", onclick: function () { if (box.parentNode) box.parentNode.removeChild(box); } }, "やめる")));
    document.body.appendChild(box);
  }

  /* ================= ホーム ================= */
  function homeMessage() {
    var s = S(), n = todayCount(), st = s.streak;
    if (s.first) return "たまごを みつけたよ!";
    if (n >= GOAL) return "きょうも ありがとう! ごはん たくさん もらったよ";
    if (n > 0) return "いいね! あと " + (GOAL - n) + "もんで ミッション クリア!";
    if (st.n >= 3) return st.n + "日 つづいてるね! すごい!";
    var talk = ["おなか すいた〜 もんだい ちょうだい!", "いっしょに あそぼう!", "きょうは なにを たべようかな", "ちょっとだけ やってみよう!"];
    return talk[Math.floor(Math.random() * talk.length)];
  }
  function home() {
    var s = S();
    if (s.first) return welcome();
    if (!s.grade) return A.gradePick(home, true);
    var p = activePet(), f = formOf(p);
    var b0 = FORM_BOUNDS[f], b1 = FORM_BOUNDS[f + 1];
    var pct = Math.max(0, Math.min(100, Math.round(((p.food - b0) / (b1 - b0)) * 100)));
    var bag = s.bag || 0;
    var n = todayCount();
    var dots = [];
    for (var i = 0; i < GOAL; i++) dots.push(h("span", { class: "mdot" + (i < n ? " on" : "") }, i < n ? "🍙" : ""));
    var petEl = pet(120, "tap");
    if (A._ate) { A._ate = false; petEl.classList.add("jump"); A.confetti(8); }
    var bubble = h("div", { class: "bubble big" }, homeMessage());
    petEl.addEventListener("click", function () {
      A.sfx("pop");
      petEl.classList.remove("jump"); void petEl.offsetWidth; petEl.classList.add("jump");
      var msgs = ["くすぐったい〜!", "だいすき!", "べんきょう たのしいね", "ごはん まってるよ"];
      var m = msgs[Math.floor(Math.random() * msgs.length)];
      A.clear(bubble); bubble.appendChild(document.createTextNode(m));
      A.speak(m);
    });
    var hold = null;
    var adultBtn = h("button", { class: "btn-ghost tiny", "aria-label": "おとなの人へ(長押し)" }, "おとなの人へ");
    var startHold = function () { hold = setTimeout(function () { hold = null; adultRoom(); }, 1500); };
    var endHold = function () {
      if (hold) { clearTimeout(hold); hold = null; A.toast("ながおしで ひらくよ(おとなのひと用)"); }
    };
    adultBtn.addEventListener("pointerdown", startHold);
    ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) { adultBtn.addEventListener(ev, endHold); });

    view(
      h("header", { class: "home-head" },
        h("div", null, h("div", { class: "hello" }, (s.name ? s.name + "、こんにちは!" : "こんにちは!")),
          h("div", { class: "streak" }, "🔥 " + s.streak.n + "日つづけてる   🎟️ " + A.gacha.state().tickets + "   🍙 " + (s.bag || 0))),
        h("div", { class: "toggles" },
          h("button", { class: "btn-ghost icon", "aria-label": "みやすさ・こえの せってい", onclick: function () { A.sfx("tap"); A.settingsRoom(home); } }, "👀"),
          h("button", { class: "btn-ghost icon", "aria-label": "こえ", onclick: function () { s.settings.voice = !s.settings.voice; A.save(); if (!s.settings.voice) A.stopSpeak(); home(); } }, s.settings.voice ? "🗣️" : "🤐"),
          h("button", { class: "btn-ghost icon", "aria-label": "おと", onclick: function () { s.settings.sound = !s.settings.sound; A.save(); home(); } }, s.settings.sound ? "🔊" : "🔇"))),
      h("section", { class: "pet-card" },
        bubble, petEl,
        h("div", { class: "pet-name" }, petName(p) + (f <= 1 ? "(たまご)" : ""),
          h("button", { class: "btn-ghost icon", "aria-label": "なまえを かえる", onclick: function () { renameDialog(p); } }, "✏️")),
        h("div", { class: "growbar", "aria-label": "せいちょう" }, h("div", { class: "growfill", style: { width: pct + "%" } })),
        h("div", { class: "growtext" }, "ごはん " + p.food + " / " + THRESH[3] + "   " + FORM_NEXT[f] + " あと " + Math.max(0, b1 - p.food)),
        h("button", { class: "btn big feed" + (bag ? " pulse" : ""), disabled: bag ? null : true, onclick: function () {
          if (!(s.bag > 0)) return;
          s.bag--; A.gacha.onFedPet(); var ev = growBy(1); A.save(); A.sfx("good"); A._ate = true;
          if (ev.length) showEvents(ev, home); else home();
        } }, "🍙 ごはんを あげる  ×" + bag),
        bag ? null : h("div", { class: "mission-sub" }, "もんだいを とくと ごはんが もらえるよ!")),
      h("section", { class: "mission" },
        h("div", { class: "mission-title" }, "✏️ もんだいで ごはんを ゲット"),
        h("div", { class: "mdots" }, dots),
        h("button", { class: "btn big go", onclick: quickStart }, n >= GOAL ? "もっと あそぶ ▶" : "あそぶ ▶"),
        h("div", { class: "mission-sub" }, grade() + "ねんせいの もんだいが でるよ"),
        h("button", { class: "btn big alt", style: { "margin-top": "10px" }, onclick: function () { A.sfx("tap"); A.write.home(); } }, "✍️ かく れんしゅう")),
      h("div", { class: "fun-row" },
        h("button", { class: "fun-btn gacha" + (A.gacha.state().tickets ? " pulse" : ""), onclick: function () { A.sfx("tap"); A.gacha.home(); } }, h("span", null, "🎰"), "ガチャ", h("b", { class: "badge" }, "🎟️" + A.gacha.state().tickets)),
        h("button", { class: "fun-btn", onclick: function () { A.sfx("tap"); A.gacha.room(); } }, h("span", null, "🐾"), "ガチャなかま", h("b", { class: "badge" }, String(A.gacha.ownedList().length))),
        h("button", { class: "fun-btn" + (A.gacha.reviewCount() ? " warn" : ""), onclick: function () { A.sfx("tap"); A.gacha.reviewHome(); } }, h("span", null, "📒"), "ふくしゅう", h("b", { class: "badge" }, String(A.gacha.reviewCount())))),
      A.gacha.missionCard(home),
      h("nav", { class: "bottom-nav" },
        h("button", { class: "nav-btn", onclick: stageSelect }, h("span", null, "🗺️"), "えらぶ"),
        h("button", { class: "nav-btn", onclick: function () { A.sfx("tap"); A.gacha.home(); } }, h("span", null, "🎰"), "ガチャ"),
        h("button", { class: "nav-btn", onclick: function () { A.sfx("tap"); A.gacha.reviewHome(); } }, h("span", null, "📒"), "ふくしゅう"),
        h("button", { class: "nav-btn", onclick: function () { zukan("pets"); } }, h("span", null, "📖"), "ずかん")),
      h("div", { class: "foot" }, h("button", { class: "btn alt save-btn", onclick: function () { A.sfx("tap"); saveRoom(); } }, "💾 きろくを ほぞん・ひきつぎ"), adultBtn));
    A.gacha.loginCheck(home);
  }

  function welcome() {
    var input = h("input", { class: "name-input", maxlength: "8", placeholder: "なまえ(あとで かえられるよ)", "aria-label": "なまえ" });
    view(
      h("section", { class: "welcome" },
        h("div", { class: "logo" }, h("span", { class: "logo-ma" }, "まな"), h("span", { class: "logo-ta" }, "たま")),
        h("div", { class: "logo-sub" }, "こたえて そだてる なかまたち"),
        h("div", { class: "egg wobble", "aria-hidden": "true" }, A.creatures.el(S().pets[0].kind, 0)),
        h("h1", null, "たまごを みつけたよ!"),
        h("p", null, "もんだいを とくと ごはんが もらえるよ。ごはんを あげると、たまごから なかまが うまれるよ!"),
        h("button", { class: "btn small", onclick: function () { A.speak("たまごを みつけたよ! もんだいを とくと ごはんが もらえるよ。ごはんを あげると、たまごから なかまが うまれるよ。なまえを つけてあげよう。", true); } }, "🔊 よんで"),
        h("label", null, "なまえを つけてあげよう", input),
        h("button", { class: "btn big good", onclick: function () {
          var p = S().pets[0];
          p.name = (input.value || "").trim().slice(0, 8);
          S().first = false; A.save(); A.sfx("good"); A.confetti(16);
          A.gradePick(home, true);
        } }, "はじめる!"),
        h("button", { class: "btn alt save-btn", onclick: function () { A.sfx("tap"); saveRoom(); } }, "💾 ひきつぎコードで つづきから")));
  }

  /* ================= ステージ(教科マップ) ================= */
  /* えらぶ: 教科 → 単元。いまの学年の 単元に くわえて、まえの 学年の 単元も ひらいて えらべる */
  function pastSkills(sub) { var out = []; for (var g = grade() - 1; g >= 1; g--) out = out.concat(gradeSkills(sub, g)); return out; }
  function stageSelect() {
    var cards = SUBJECTS.filter(function (sub) { return gradeSkills(sub.id).length || pastSkills(sub.id).length; }).map(function (sub) {
      var list = gradeSkills(sub.id), max = list.length * 3;
      var got = list.reduce(function (n, sk) { return n + stars(sk.id); }, 0);
      return h("button", { class: "subject-card", style: { "--c": sub.color }, onclick: function () { A.sfx("tap"); stageMap(sub.id); } },
        h("div", { class: "subject-emoji" }, sub.emoji),
        h("div", { class: "subject-name" }, sub.id),
        h("div", { class: "subject-stars" }, list.length ? "⭐ " + got + " / " + max : "まえに ならった ところ"));
    });
    view(topbar("どの ぼうけんに いく?", home),
      h("p", { class: "note" }, "きょうかを えらぶと、たんげんを えらべるよ。まえに ならった ところも ひらいて えらべるよ。"),
      h("div", { class: "subject-grid" }, cards),
      h("button", { class: "btn big alt", onclick: function () {
        var ps = playableSubjects(); if (!ps.length) return;
        startMission(ps[Math.floor(Math.random() * ps.length)].id, null);
      } }, "🎲 おまかせ"));
  }
  function nodeList(subId, list, rec0) {
    var sub = subjectInfo(subId);
    return list.map(function (sk, i) {
      var st = stars(sk.id), isRec = rec0 && rec0.id === sk.id;
      var starTxt = "⭐".repeat(st) + "☆".repeat(3 - st);
      return h("button", { class: "node" + (st ? " got" : "") + (isRec ? " rec" : "") + (i % 2 ? " right" : ""), style: { "--c": sub.color }, onclick: function () { A.sfx("tap"); startMission(subId, sk); } },
        h("span", { class: "node-icon num" }, String(i + 1)),
        h("span", { class: "node-body" }, h("b", null, sk.name), h("small", null, starTxt + (isRec ? "  ← いまここ" : ""))));
    });
  }
  function stageMap(subId, openG) {
    var sub = subjectInfo(subId), list = gradeSkills(subId), rec0 = list.length ? recommendedSkill(subId) : null;
    var parts = [topbar(sub.emoji + " " + subId, stageSelect)];
    if (list.length) {
      parts.push(h("div", { class: "unit-head" }, "📍 いま ならっている ところ(" + grade() + "ねんせい)"));
      parts.push(h("div", { class: "path" }, nodeList(subId, list, rec0)));
      parts.push(h("button", { class: "btn big go", onclick: function () { startMission(subId, null); } }, "おすすめで すすむ ▶"));
    }
    var past = [];
    for (var g = grade() - 1; g >= 1; g--) {
      var pl = gradeSkills(subId, g);
      if (!pl.length) continue;
      var got = pl.reduce(function (n, sk) { return n + stars(sk.id); }, 0);
      past.push(h("details", { class: "past-grade", open: openG === g ? true : null },
        h("summary", null, "📂 " + g + "ねんせいで ならう ところ", h("small", null, "  " + pl.length + "こ  ⭐" + got)),
        h("div", { class: "path" }, nodeList(subId, pl, null))));
    }
    if (past.length) {
      parts.push(h("div", { class: "unit-head" }, "🔙 まえに ならった ところも えらべるよ"));
      parts.push(h("p", { class: "muted" }, "わからない ところや、もういちど やりたい ところを タップしてね。"));
      parts = parts.concat(past);
    }
    view.apply(null, parts);
  }

  /* ================= ミッション(クイズ) ================= */
  var Q = null;
  function startMission(subjectId, skill, opts) {
    opts = opts || {};
    Q = { subject: subjectId, focus: skill, pool: opts.pool || null, label: opts.label || null, count: 0, target: GOAL, seen: {}, ok: 0, food: 0, newCards: [], helped: 0, events: [] };
    nextQuestion();
  }
  /* いきなりスタート: えらんだ学年の 教科を ぐるぐる回しながら 順に出す */
  function quickStart() {
    var n = (S().log || []).length, ps = playableSubjects();
    if (!ps.length) { A.toast("この がくねんの もんだいは じゅんびちゅう だよ"); return; }
    Q = { subject: ps[n % ps.length].id, mix: true, mixIdx: n, focus: null, pool: null, label: null, count: 0, target: GOAL, seen: {}, ok: 0, food: 0, newCards: [], helped: 0, events: [] };
    A.sfx("tap");
    nextQuestion();
  }
  /* ふくしゅう: まちがえた もんだいを そのまま もういちど */
  function startReviewMission(ids) {
    Q = { review: true, reviewIds: ids, learned: 0, subject: null, focus: null, pool: null, label: "ふくしゅう", count: 0, target: ids.length, seen: {}, ok: 0, food: 0, newCards: [], helped: 0, events: [] };
    nextQuestion();
  }
  /* おなじ たんげんの こたえ(キーボードの たんいキーを つくる ため) */
  A.keypadSiblings = function (p) { return (probsBySkill[p.skill] || []).map(function (x) { return x.answer; }); };
  function nextQuestion() {
    if (Q.mix && Q.count > 0) { var ps = playableSubjects(); Q.mixIdx++; Q.subject = ps[Q.mixIdx % ps.length].id; }
    var sk, p;
    if (Q.review) {
      var pid = Q.reviewIds[Q.count];
      p = D.problems.filter(function (x) { return x.id === pid; })[0];
      sk = skillMap[p.skill]; Q.subject = sk.subject;
    } else {
      sk = Q.focus || (Q.pool ? recommendedFromList(Q.pool, true) : recommendedSkill(Q.subject));
      p = pickProblem(sk, Q.seen);
    }
    Q.seen[p.id] = true;
    Q.p = p; Q.skill = sk;
    Q.foe = A.enemies.forSubject(Q.subject, sk._i); Q.fx = "appear"; Q.taunt = TAUNTS[Math.floor(Math.random() * TAUNTS.length)];
    var nc = Math.max(2, S().settings.nChoice || 3);
    var wrongs = p.choices.filter(function (c) { return c !== p.answer; }).slice(0, nc - 1);
    Q.choices = A.shuffle([p.answer].concat(wrongs));
    Q.fresh = true;
    /* こたえかた: うてる もんだいは キーボードが さいしょ(みやすさで「えらぶ」を さいしょにも できる) */
    Q.km = A.keypadMode(p, sk);
    Q.mode = Q.km && S().settings.answerMode !== "choice" ? "type" : "choice";
    Q.wrong = []; Q.hints = 0; Q.helped = false; Q.done = false; Q.correct = null; Q.afterTutor = false; Q.failed = false; Q.lastTyped = null;
    renderQuiz();
  }
  /* まちがえて いい かいすう(おとなのへやで かえる。0 = なんかいでも) */
  function tries() { var t = S().settings.tries; return t === undefined ? 2 : t; }
  function triesLeft() { var t = tries(); return t ? Math.max(0, t - Q.wrong.length) : 99; }
  function questionSpeech() {
    if (Q.mode === "type") return Q.p.question;
    return Q.p.question + "。 こたえは、 " + Q.choices.filter(function (c) { return Q.wrong.indexOf(c) < 0; }).join("、 か、 ") + "。";
  }
  function foodFor(typed, clean) {
    if (clean) return typed ? 2 : 1;          // ひとりで: うって 2こ / えらんで 1こ
    if (Q.afterTutor) return 1;               // わからない → いっしょに まなんで できた
    return typed ? 1 : 0;                     // まちがえた あと: えらび なおしでは もらえない
  }
  function renderQuiz() {
    var p = Q.p, sub = subjectInfo(Q.subject), pr = [];
    var stage = battleStage();
    for (var i = 0; i < Q.target; i++) pr.push(h("span", { class: "mdot small" + (i < Q.count ? " on" : i === Q.count ? " now" : "") }));
    var head = h("div", { class: "quiz-head" },
      h("button", { class: "btn-ghost", onclick: function () { A.stopSpeak(); home(); } }, "× やめる"),
      h("div", { class: "mdots" }, pr),
      h("div", { class: "quiz-pet" }, A.petEmoji()));
    var qcard = h("section", { class: "qcard", style: { "--c": sub.color } },
      h("div", { class: "qtag" }, sub.emoji + " " + (Q.label ? Q.label + " ▸ " : "") + Q.skill.name),
      h("p", { class: "qtext" }, p.question),
      p.visual ? A.renderVisual(p.visual) : null,
      h("button", { class: "btn small", "aria-label": "よみあげ", onclick: function (e) {
        var b = e.currentTarget;
        if (!A.speak(questionSpeech(), true)) { A.toast("このたんまつは こえが でないよ"); return; }
        b.textContent = "🔊 よんでるよ…";
        setTimeout(function () { b.textContent = "🔊 もういちど よんで"; }, 1800);
      } }, "🔊 よんで"));
    if (Q.fresh) {
      Q.fresh = false;
      if (S().settings.voice && S().settings.autoRead) setTimeout(function () { A.speak(questionSpeech()); }, 450);
    }
    var kids = [head];
    if (stage) kids.push(stage);
    if (Q.afterTutor && !Q.done) kids.push(h("div", { class: "note good" }, "さっき おぼえたことで もういちど ちょうせん!"));
    kids.push(qcard);

    var typing = Q.mode === "type" && !Q.done;
    if (typing) {
      kids.push(A.keypad({ mode: Q.km, say: S().settings.voice, onSubmit: function (v) { answer(v, "type"); } }));
    } else {
      kids.push(h("div", { class: "choice-col" }, Q.choices.map(function (c) {
        var wrong = Q.wrong.indexOf(c) >= 0;
        var isAns = Q.done && c === p.answer;
        return h("div", { class: "choice-wrap" },
          h("button", { class: "btn big choice" + (wrong ? " wrong" : "") + (isAns ? " right" : ""), disabled: wrong || Q.done ? true : null, onclick: function () { answer(c, "choice"); } }, c),
          h("button", { class: "btn-ghost icon say", "aria-label": "この こたえを よむ", onclick: function () { if (!A.speak(c, true)) A.toast("このたんまつは こえが でないよ"); } }, "🔊"));
      })));
    }

    if (Q.done && Q.correct) {
      var indep = !Q.helped && Q.wrong.length === 0;
      var gain = Q.lastFood > 0 ? "🍙 ごはん +" + Q.lastFood + " (ふくろに ゲット!)" : "🍙 こんどは ひとりで できたら ごはんが もらえるよ";
      kids.push(h("div", { class: "feedback good" },
        h("div", { class: "fb-title" }, indep ? "🎉 ばっちり!" : "⭕ できたね!"),
        Q.answeredBy === "type" ? h("p", { class: "typed-ans" }, "こたえ: ", h("b", null, p.answer)) : null,
        h("p", null, p.explanation, " ", h("button", { class: "btn-ghost icon say", "aria-label": "よむ", onclick: function () { A.speak(p.explanation, true); } }, "🔊")),
        h("p", { class: "gain" }, gain + (Q.newCard ? "   🃏 カード ゲット!" : "")),
        indep && Q.answeredBy === "choice" && Q.km ? h("p", { class: "muted" }, "⌨️ うって こたえると ごはんが 2こ もらえるよ") : null,
        Q.learnedNow ? h("p", { class: "gain" }, "📒 おぼえた! ふくしゅうリストから きえたよ") : null,
        h("button", { class: "btn big go", onclick: afterAnswer }, Q.count >= Q.target ? "けっかを 見る ▶" : "つぎへ ▶")));
    } else if (Q.done && Q.failed) {
      /* チャンスを つかいきった: こたえと わけを 見せて、ふくしゅうへ。ごはんは なし */
      kids.push(h("div", { class: "feedback soft" },
        h("div", { class: "fb-title" }, "こたえは「", h("b", null, p.answer), "」だったよ"),
        h("p", null, p.explanation, " ", h("button", { class: "btn-ghost icon say", "aria-label": "よむ", onclick: function () { A.speak(p.explanation, true); } }, "🔊")),
        h("p", { class: "gain" }, "📒 ふくしゅうリストに いれたよ。あとで もういちど やってみよう"),
        h("div", { class: "tool-row" },
          h("button", { class: "btn big help pulse", onclick: openTutor }, "😵 わからない(いっしょに かんがえる)"),
          h("button", { class: "btn big go", onclick: afterAnswer }, Q.count >= Q.target ? "けっかを 見る ▶" : "つぎへ ▶"))));
    } else {
      if (Q.wrong.length) {
        var left = triesLeft();
        kids.push(h("div", { class: "feedback soft" },
          h("div", { class: "fb-title" }, "おしい! だいじょうぶ"),
          Q.lastTyped != null ? h("p", null, "「" + Q.lastTyped + "」 では ないみたい。") : null,
          h("p", null, (left < 99 ? "あと " + left + "かい ちょうせん できるよ。" : "") + (Q.wrong.length >= 2 || left <= 1 ? "むずかしいときは「わからない」を おしてね。いっしょに もどって かんがえよう!" : "ヒントも あるよ。"))));
      }
      if (Q.hints > 0) {
        kids.push(h("div", { class: "hintbox" }, p.hints.slice(0, Q.hints).map(function (t, i) {
          return h("p", null, "💡 ヒント" + (i + 1) + ": ", t, " ", h("button", { class: "btn-ghost icon say", "aria-label": "ヒントを よむ", onclick: function () { A.speak(t, true); } }, "🔊"));
        })));
      }
      var tools = [];
      if (Q.km) {
        if (Q.mode === "type") tools.push(h("button", { class: "btn big alt", onclick: function () { A.sfx("tap"); Q.mode = "choice"; Q.lastTyped = null; renderQuiz(); if (S().settings.voice && S().settings.autoRead) A.speak(questionSpeech()); } }, "👆 えらんで こたえる"));
        else tools.push(h("button", { class: "btn big alt", onclick: function () { A.sfx("tap"); Q.mode = "type"; renderQuiz(); } }, "⌨️ うって こたえる"));
      }
      if (Q.hints < p.hints.length) {
        tools.push(h("button", { class: "btn big alt", onclick: function () {
          Q.hints++; Q.helped = true; A.sfx("pop"); renderQuiz();
          if (S().settings.voice) A.speak(p.hints[Q.hints - 1]);
        } }, "💡 ヒント"));
      }
      tools.push(h("button", { class: "btn big help" + (Q.wrong.length >= 2 || (Q.wrong.length && triesLeft() <= 1) ? " pulse" : ""), onclick: openTutor }, "😵 わからない"));
      kids.push(h("div", { class: "tool-row" }, tools));
    }
    view.apply(null, kids);
  }
  function answer(c, how) {
    var p = Q.p, typed = how === "type", r = rec(Q.skill.id);
    var ok = typed ? A.keypadCheck(Q.km, c) : c === p.answer;
    var pr = r.probs[p.id] || (r.probs[p.id] = { indep: false, last: 0 });
    if (ok) {
      var indep = !Q.helped && Q.wrong.length === 0;
      var beforeStars = stars(Q.skill.id);
      r.ok++;
      pr.last = Date.now();
      if (indep) pr.indep = true;
      Q.correct = true; Q.done = true; Q.count++; Q.answeredBy = typed ? "type" : "choice";
      Q.fx = Q.afterTutor ? "special" : indep ? "crit" : "attack";
      var fo = S().foes || (S().foes = {}); fo[Q.foe.e.id] = (fo[Q.foe.e.id] || 0) + 1;
      Q.lastFood = foodFor(typed, indep);
      Q.food += Q.lastFood; if (indep) Q.ok++;
      Q.newCard = beforeStars === 0;
      if (Q.newCard) Q.newCards.push(Q.skill.id);
      touchDay(true);
      if (Q.lastFood > 0) A.gacha.onSolved(); // あてずっぽうの えらび なおしは ミッションにも かぞえない
      if (indep && A.gacha.clearReview(p.id)) { Q.learnedNow = true; if (Q.review) { Q.learned++; A.gacha.onReviewSolved(); } } else Q.learnedNow = false;
      logEvent({ t: Date.now(), pid: p.id, skill: Q.skill.id, subject: Q.subject, ok: true, help: Q.helped, wrong: Q.wrong.length, how: Q.answeredBy });
      if (Q.lastFood > 0) Q.events = Q.events.concat(earn(Q.lastFood));
      A.save();
      A.sfx("good"); A.confetti(indep ? 22 : 10);
      if (S().settings.voice && S().settings.autoRead) setTimeout(function () { A.speak((indep ? "ばっちり! " : "できたね! ") + p.explanation); }, 300);
    } else {
      if (Q.wrong.length === 0) r.ng++;
      Q.wrong.push(typed ? "⌨" + c : c);
      Q.lastTyped = typed ? c : null;
      A.gacha.addReview(p);
      Q.fx = "counter";
      A.sfx("ng");
      if (tries() && Q.wrong.length >= tries()) {
        // チャンスを つかいきった: こたえを 見せて つぎへ(ごはん なし・ふくしゅうへ)
        Q.done = true; Q.failed = true; Q.correct = false; Q.count++;
        touchDay(false);
        logEvent({ t: Date.now(), pid: p.id, skill: Q.skill.id, subject: Q.subject, ok: false, help: Q.helped, wrong: Q.wrong.length, how: typed ? "type" : "choice", given: Q.wrong.map(function (w) { return String(w).replace(/^⌨/, ""); }) });
        A.save();
        if (S().settings.voice && S().settings.autoRead) setTimeout(function () { A.speak("こたえは、 " + p.answer + " だよ。 " + p.explanation); }, 300);
      } else {
        A.save();
        if (S().settings.voice && S().settings.autoRead) setTimeout(function () { A.speak(Q.wrong.length >= 2 || triesLeft() <= 1 ? "おしい! むずかしい ときは、わからない を おしてね。" : "おしい! もういちど やってみよう。"); }, 300);
      }
    }
    renderQuiz();
  }
  function afterAnswer() {
    var events = Q.events; Q.events = [];
    var go = function () { if (Q.count >= Q.target) result(); else nextQuestion(); };
    showEvents(events, go);
  }
  function openTutor() {
    A.sfx("tap");
    if (!Q.helped) { Q.helped = true; }
    var r = rec(Q.skill.id);
    r.help++;
    A.gacha.addReview(Q.p);
    A.save();
    Q.tutorPassed = 0;
    var root = h("div", { class: "tutor" });
    view(root);
    A.tutorStart(root, Q.p, {
      subject: Q.subject,
      onPass: function (cid) {
        var ev = earn(1);
        Q.events = Q.events.concat(ev);
        Q.tutorPassed++;
        logEvent({ t: Date.now(), pid: Q.p.id, skill: Q.skill.id, subject: Q.subject, insight: cid });
        A.save();
      },
      onExit: function (res) {
        if (Q.failed) { Q.failed = false; Q.done = false; Q.correct = null; Q.count--; } // まなんだら もういちど ちょうせん
        Q.wrong = []; Q.lastTyped = null; // 学んだあとで、もう一度ぜんぶ選べる
        Q.afterTutor = true;
        var events = Q.events; Q.events = [];
        if (res.done) A.confetti(20);
        showEvents(events, renderQuiz);
      },
    });
  }

  /* ================= けっか ================= */
  function result() {
    var cards = Q.newCards.map(function (id) {
      var sk = skillMap[id];
      return h("div", { class: "card-get pop" }, h("div", { class: "card-icon" }, sk._icon), h("small", null, sk.name));
    });
    var p = activePet();
    view(h("section", { class: "result" },
      h("div", { class: "result-face jump" }, A.petEmoji()),
      h("h1", null, Q.review ? "ふくしゅう クリア!" : "ミッション クリア!"),
      h("p", null, Q.target + "もん クリア。ごはん +" + Q.food + " もらったよ"),
      Q.review ? h("p", { class: "gain" }, "📒 おぼえた もんだい: " + Q.learned + "もん" + (A.gacha.reviewCount() ? "(のこり " + A.gacha.reviewCount() + "もん)" : "(ぜんぶ おぼえた!)")) : null,
      h("p", { class: "muted" }, petName(p) + "  ごはん " + p.food + " / " + THRESH[3]),
      cards.length ? h("div", null, h("h3", null, "あたらしい カード"), h("div", { class: "card-row" }, cards)) : null,
      h("div", { class: "choice-col" },
        h("button", { class: "btn big go", onclick: function () { if (Q.review) A.gacha.reviewHome(); else if (Q.mix) quickStart(); else startMission(Q.subject, Q.focus, { pool: Q.pool, label: Q.label }); } }, Q.review ? "📒 ふくしゅうに もどる ▶" : "つづけて あそぶ ▶"),
        A.gacha.state().tickets ? h("button", { class: "btn big good pulse", onclick: A.gacha.home }, "🎰 ガチャチケットが あるよ!") : null,
        h("button", { class: "btn big alt", onclick: home }, "ホームに もどる"))));
    A.sfx("levelup"); A.confetti(30);
    A.speak("ミッション クリア! よくがんばったね");
  }

  /* ================= ずかん ================= */
  function zukan(tab) {
    var tabs = h("div", { class: "tabs" },
      h("button", { class: "tab" + (tab === "pets" ? " on" : ""), onclick: function () { zukan("pets"); } }, "🐾 なかま"),
      h("button", { class: "tab" + (tab === "foes" ? " on" : ""), onclick: function () { zukan("foes"); } }, "👾 てき"),
      h("button", { class: "tab" + (tab === "gacha" ? " on" : ""), onclick: function () { zukan("gacha"); } }, "🎰 ガチャ"),
      h("button", { class: "tab" + (tab === "cards" ? " on" : ""), onclick: function () { zukan("cards"); } }, "🃏 カード"));
    var body;
    if (tab === "pets") {
      var gotN = 0;
      var items = CREATURES.map(function (c, i) {
        var mine = S().pets.filter(function (p) { return p.kind === i; });
        var done = mine.some(function (p) { return p.done; });
        var growing = !done && mine.some(function (p) { return formOf(p) >= 2; });
        if (done) gotN++;
        var art = done ? A.creatures.el(i, 3) : growing ? A.creatures.el(i, 2) : A.creatures.silhouette(i);
        return h("div", { class: "z-item" + (done || growing ? " on" : "") },
          h("div", { class: "z-face cr-face" }, art),
          h("small", null, done ? c.n : growing ? c.n + "(そだち中)" : "???"),
          h("div", { class: "z-stars" }, done || growing ? (c.type === "cool" ? "⚔️ " : "💗 ") + "★".repeat(c.r) + "☆".repeat(3 - c.r) : ""));
      });
      body = h("div", null, h("p", { class: "muted" }, "あつめた " + gotN + " / " + CREATURES.length + "。そだてあげると ずかんに のるよ。"), h("div", { class: "z-grid" }, items));
    } else if (tab === "gacha") {
      var gl = A.gacha.list, gotG = 0;
      var gitems = gl.map(function (d) {
        var o = A.gacha.owned(d.id); if (o) gotG++;
        var rr = A.gacha.rare[d.r];
        return h("div", { class: "z-item" + (o ? " on" : "") },
          h("div", { class: "z-face cr-face" }, o ? A.gacha.el(d.id) : A.gacha.el(d.id, 2, "cr-sil")),
          h("small", null, o ? d.n : "???"),
          h("div", { class: "z-stars", style: { color: rr.color } }, rr.star));
      });
      body = h("div", null, h("p", { class: "muted" }, "ガチャなかま " + gotG + " / " + gl.length + "。ガチャで あつめよう!"), h("div", { class: "z-grid" }, gitems));
    } else if (tab === "foes") {
      var fo = S().foes || {}, total = 0;
      var fitems = A.enemies.list.map(function (e) {
        var n = fo[e.id] || 0; total += n;
        return h("div", { class: "z-item" + (n ? " on" : "") },
          h("div", { class: "z-face cr-face" }, A.enemies.el(e.id, 0, n ? "" : "cr-sil")),
          h("small", null, n ? e.n : "???"),
          h("div", { class: "z-stars" }, n ? e.subject + " ×" + n : ""));
      });
      body = h("div", null, h("p", { class: "muted" }, "たおした てき: " + total + "たい。もんだいを とくと なかまが たおすよ!"), h("div", { class: "z-grid" }, fitems));
    } else {
      body = h("div", null, SUBJECTS.filter(function (sub) { return bySubject[sub.id].some(function (sk) { return stars(sk.id) || skillGrade(sk.id) === grade(); }); }).map(function (sub) {
        return h("section", { class: "z-sub" },
          h("h3", { style: { color: sub.color } }, sub.emoji + " " + sub.id),
          h("div", { class: "z-grid cards" }, bySubject[sub.id].filter(function (sk) { return stars(sk.id) || skillGrade(sk.id) === grade(); }).map(function (sk) {
            var st = stars(sk.id);
            return h("div", { class: "z-card" + (st ? " on" : "") },
              h("div", { class: "z-face" }, st ? sk._icon : "❓"),
              h("small", null, st ? sk.name : "???"),
              h("div", { class: "z-stars" }, "⭐".repeat(st) + "☆".repeat(3 - st)));
          })));
      }));
    }
    view(topbar("ずかん", home), tabs, body);
  }

  /* ================= きろくの ほぞん・ひきつぎ ================= */
  function encodeSave() { return "MANATAMA-" + btoa(unescape(encodeURIComponent(JSON.stringify(A.S)))); }
  function decodeSave(code) {
    var t = String(code || "").replace(/\s+/g, "");
    if (t.indexOf("MANATAMA-") === 0) t = t.slice(9);
    var o = JSON.parse(decodeURIComponent(escape(atob(t))));
    if (!o || typeof o !== "object" || !o.pets || !o.skills) throw new Error("bad");
    return o;
  }
  function saveRoom() {
    var out = h("textarea", { class: "export", readonly: "", rows: "4" });
    out.value = encodeSave();
    var inp = h("textarea", { class: "export", rows: "4", placeholder: "ここに ひきつぎコードを はりつけ" });
    view(topbar("きろくの ほぞん", home),
      h("section", { class: "adult" },
        h("p", null, "ブラウザを とじたり、べつの たんまつや ホーム画面から ひらくと、きろくが きえることが あるよ。そんなときのために、ひきつぎコードを とっておこう。"),
        h("h3", null, "① コードを コピーして とっておく"),
        out,
        h("button", { class: "btn big", onclick: function () {
          out.value = encodeSave(); out.select();
          var done = function () { A.toast("コピーしました! メモなどに はりつけて とっておいてね"); };
          try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(out.value).then(done, done); return; } } catch (e) {}
          try { document.execCommand("copy"); } catch (e2) {}
          done();
        } }, "📋 コードを コピー"),
        h("h3", null, "② ひきつぎコードから つづきを よみこむ"),
        inp,
        h("button", { class: "btn big alt", onclick: function () {
          var o;
          try { o = decodeSave(inp.value); } catch (e) { A.toast("コードが ただしくないみたい…"); return; }
          if (!confirm("いまの きろくを コードの きろくに おきかえます。よろしいですか?")) return;
          var d = A.S; A.S = o; Object.keys(d).forEach(function (k) { if (A.S[k] === undefined) A.S[k] = d[k]; });
          A.S.first = false; A.save(); A.sfx("good"); A.toast("つづきから はじめられるよ!"); home();
        } }, "📥 つづきを よみこむ")));
  }

  /* ================= おとなのへや ================= */
  /* こたえる チャンスの かいすう(おとなが きめる) */
  function triesBlock() {
    var cur = tries();
    var opts = [[1, "1回"], [2, "2回"], [3, "3回"], [0, "何回でも"]];
    return h("section", { class: "set-row" },
      h("div", { class: "set-title" }, "🎯 1問で こたえられる回数"),
      h("div", { class: "set-opts" }, opts.map(function (o) {
        return h("button", { class: "set-opt" + (cur === o[0] ? " on" : ""), onclick: function () { S().settings.tries = o[0]; A.save(); A.sfx("tap"); adultRoom(); } }, o[1]);
      })),
      h("p", { class: "muted" }, "回数を使いきると、答えと説明を見せて次へ進みます(ごはんは出ません。問題は「ふくしゅう」に入ります)。「わからない」から一緒に学び直すと、もう一度ちょうせんできます。ごはん: キーボードで1回目に正解=2こ / 選んで1回目に正解=1こ / まちがえた後の正解=キーボード1こ・選択0こ / わからないで学んだ後の正解=1こ。「何回でも」にすると選択肢を順に押せば正解にたどり着けますが、まちがえた後の選択での正解ではごはんもミッションも進みません。"));
  }
  function adultRoom() {
    var s = S();
    var keys = Object.keys(s.days).sort();
    var recent = keys.slice(-14).map(function (k) {
      var d = s.days[k];
      return h("tr", null, h("td", null, k.slice(5)), h("td", null, d.n + "もん"), h("td", null, d.ok + " せいかい"));
    });
    var skillRows = [];
    SUBJECTS.forEach(function (sub) {
      bySubject[sub.id].forEach(function (sk) {
        var r = s.skills[sk.id];
        if (!r) return;
        skillRows.push(h("tr", null, h("td", null, sub.id + skillGrade(sk.id)), h("td", null, sk.name), h("td", null, "⭐".repeat(stars(sk.id)) || "-"), h("td", null, r.ok + "/" + r.ng), h("td", null, r.help)));
      });
    });
    var logRows = s.log.slice(-20).reverse().map(function (e) {
      var p = D.problems.filter(function (x) { return x.id === e.pid; })[0];
      var d = new Date(e.t);
      var when = (d.getMonth() + 1) + "/" + d.getDate() + " " + d.getHours() + ":" + (d.getMinutes() < 10 ? "0" : "") + d.getMinutes();
      var how = e.how === "type" ? "⌨️" : e.how === "choice" ? "👆" : "";
      var what = e.insight ? "💡 前提を理解: " + A.tutorConceptTitle(e.insight) : (e.ok ? "⭕" : "❌") + how + (e.help ? "(助けあり)" : "") + (e.ok && e.wrong ? "(" + e.wrong + "回まちがえてから)" : "") + " " + (p ? A.plain(p.question).slice(0, 22) : e.pid) + (e.given ? " → 答え:" + e.given.join("/") + "(正:" + (p ? A.plain(p.answer) : "?") + ")" : "");
      return h("tr", null, h("td", null, when), h("td", null, what));
    });
    var total = s.log.filter(function (e) { return e.ok; }).length;
    var insights = s.log.filter(function (e) { return e.insight; }).length;
    var box = h("textarea", { class: "export", readonly: "", rows: "4", style: { display: "none" } });
    view(topbar("おとなのへや", home),
      h("section", { class: "adult" },
        h("div", { class: "choice-col" },
          h("button", { class: "btn alt", onclick: function () { A.gradePick(adultRoom); } }, "🎒 がくねんを かえる(いま " + grade() + "年)"),
          h("button", { class: "btn alt", onclick: function () { A.settingsRoom(adultRoom); } }, "👀 みやすさ・こえの せってい")),
        triesBlock(),
        h("p", { class: "muted" }, "学年は「どの単元の問題が出るか」だけを決めます。文字の大きさ・ふりがな・選択肢の数・読み上げは学年に関係なく、その子に合わせて変えられます。わからない問題では、前の学年の内容までボタンだけでさかのぼれます(子どもの画面には学年は表示されません)。"),
        h("p", null, "つづけた日数: " + s.streak.n + "日 / 使った日: " + keys.length + "日 / 正解: " + total + "もん / 前提まで戻って理解: " + insights + "回"),
        h("h3", null, "最近の学習(日ごと)"), h("table", null, recent.length ? recent : h("tr", null, h("td", null, "まだ記録がありません"))),
        h("h3", null, "単元ごと(正解/ミス・助けた回数)"),
        h("table", null, h("tr", null, h("th", null, "教科・学年"), h("th", null, "単元"), h("th", null, "星"), h("th", null, "○/×"), h("th", null, "わからない")), skillRows),
        h("h3", null, "さいきんの記録"), h("table", null, logRows),
        h("div", { class: "choice-col" },
          h("button", { class: "btn alt", onclick: function () {
            box.value = JSON.stringify(s); box.style.display = "block"; box.select();
            try { if (navigator.clipboard) navigator.clipboard.writeText(box.value); A.toast("コピーしました"); } catch (e) {}
          } }, "記録を書き出す(バックアップ)"),
          box,
          h("button", { class: "btn danger", onclick: function () {
            if (confirm("ぜんぶの記録を消して、さいしょからにします。よろしいですか?")) { A.reset(); home(); }
          } }, "記録を ぜんぶ消す"))));
  }

  /* ================= 起動 ================= */
  A.start = function () {
    try { A.applyView(); home(); } catch (e) {
      app.appendChild(h("pre", { class: "err" }, "エラー: " + (e && e.message)));
    }
  };
  A.core = { quickStart: quickStart, startReviewMission: startReviewMission, grade: grade, gradeSkills: gradeSkills, playableSubjects: playableSubjects, feed: earn, earn: earn, touchDay: touchDay, logEvent: logEvent, showEvents: showEvents, view: view, topbar: topbar, stars: stars, skillMap: skillMap, startMission: startMission, home: home, SUBJECTS: SUBJECTS, subjectInfo: subjectInfo, save: function () { A.save(); } };
  A.debug = { adult: adultRoom, skill: function (id) { return skillMap[id]; }, stars: stars, Q: function () { return Q; }, startMission: startMission, home: home, feed: growBy, view: view };
})();
