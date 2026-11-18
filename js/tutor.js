/* まなたま 「わからない」→ やさしい説明 → 確かめる → ひとつ前へ戻る
   既存AOTOの 82 の説明(前提つき)をそのまま使い、声とアニメで一度に一つずつ見せる。 */
(function () {
  "use strict";
  var A = window.A, h = A.h;
  var D = window.AOTO_DATA;
  var concepts = {};
  D.concepts.forEach(function (c) { concepts[c.id] = c; });
  A.concepts = concepts;

  var FOUNDATION = { 算数: "s1-count", 国語: "k1-hira" };

  /* 確かめ問題の プール: 説明に ついている 問題 ＋ おなじ 単元の 問題(もとの 問題は のぞく)。ランダムに 出す */
  var poolBy = {};
  D.problems.forEach(function (p) {
    var cid = D.skillConcept[p.skill];
    if (cid) (poolBy[cid] = poolBy[cid] || []).push(p);
  });
  function checkPool(cid, excludeId) {
    var c = concepts[cid];
    var ex = excludeId ? D.problems.filter(function (p) { return p.id === excludeId; })[0] : null;
    var exAns = ex ? A.plain(ex.answer) : null;
    // もとの もんだいと おなじ こたえの 問題は 出さない(たしかめで こたえが わかって しまう ため)
    var all = (c.checks || []).concat(poolBy[cid] || []).filter(function (p) { return p.id !== excludeId; });
    var safe = all.filter(function (p) { return A.plain(p.answer) !== exAns; });
    return safe.length ? safe : all;
  }

  /* 説明の ならび。もとの もんだいでは「ヒント → あと ひといき(こたえの 一歩手前)→ もとに なる きほん → たとえば → ひとつずつ」と
     だんだん やさしく、ふかく もどっていく。こたえは いきなり 言わない。 */
  function pieces(c, ex, prob) {
    var n = c.examples.length || 1;
    var i = ex % n;
    var list = [];
    if (prob) {
      if (prob.hints && prob.hints[0]) list.push({ head: "まずは ヒント", text: prob.hints[0], visual: prob.visual || null, quote: prob.question });
      if (prob.hints && prob.hints[1]) list.push({ head: "あと ひといき", text: prob.hints[1], visual: prob.visual || null, quote: prob.question });
    }
    list.push({ head: prob ? "もとに なる きほん「" + c.title + "」" : "まず、ことばの いみ", text: c.meaning, visual: null });
    list.push({ head: "たとえば", text: c.examples[i] || c.meaning, visual: c.visuals ? c.visuals[i] || c.visuals[0] : null });
    c.steps.forEach(function (st, k) {
      list.push({ head: "ひとつずつ " + (k + 1), text: st, visual: c.visuals ? c.visuals[i] || c.visuals[0] : null });
    });
    return list;
  }

  /* opts: { subject, skill, onPass(conceptId), onExit({done,closed,passed}) } */
  A.tutorStart = function (root, problem, opts) {
    var first = D.skillConcept[problem.skill] || FOUNDATION[opts.subject] || "s1-count";
    if (!concepts[first]) first = FOUNDATION[opts.subject] || "s1-count";
    var frames = [{ cid: first, piece: 0, ex: 0 }];
    var check = null; // {q, choices, answer, correct, submitted}
    var usedChecks = [];
    function newCheck() {
      var pool = checkPool(cur().cid, problem.id);
      var fresh = pool.filter(function (q) { return usedChecks.indexOf(q) < 0; });
      if (!fresh.length) fresh = pool;
      var q = fresh[Math.floor(Math.random() * fresh.length)];
      usedChecks.push(q);
      var nc = Math.max(2, A.S.settings.nChoice || 4);
      var choices = A.shuffle([q.answer].concat(A.shuffle(q.choices.filter(function (x) { return x !== q.answer; })).slice(0, nc - 1)));
      return { q: q, choices: choices, answer: null, correct: null, submitted: false };
    }
    var chooser = false;
    var passed = 0;
    var rev = 0;

    function cur() { return frames[frames.length - 1]; }
    var nHints = problem && problem.hints ? Math.min(2, problem.hints.filter(Boolean).length) : 0;
    function exPiece() { return frames.length === 1 && problem ? nHints + 1 : 1; } // 「たとえば」の ばしょ
    if (opts.startPiece) frames[0].piece = Math.min(opts.startPiece, nHints);
    function concept() { return concepts[cur().cid]; }

    function prereqs() {
      var used = {};
      frames.forEach(function (f) { used[f.cid] = true; });
      return (concept().prerequisites || []).filter(function (id) { return concepts[id] && !used[id]; });
    }

    function speakPanel(p) {
      if (A.S.settings.voice && A.S.settings.autoRead) A.speak(p.head + "。 " + p.text);
    }

    var seen = 0; // 見た 説明の かず(すぐ とじて やりなおしを ふやせないように)
    function descend(id) {
      A.sfx("pop");
      frames.push({ cid: id, piece: 0, ex: 0 });
      check = null; chooser = false; rev++;
      render();
    }
    function askEasier() {
      var list = prereqs();
      if (!list.length) {
        // いちばん やさしいところ: 別の例でもう一度
        var f = cur();
        f.ex++; f.piece = exPiece(); check = null; rev++;
        render(true);
        return;
      }
      if (list.length === 1) return descend(list[0]);
      chooser = true;
      render();
    }
    function finishOrPop() {
      passed++;
      if (opts.onPass) opts.onPass(cur().cid, !cur().missed);
      if (frames.length > 1) {
        frames.pop();
        var f = cur();
        f.ex++; f.piece = exPiece(); check = null; chooser = false; rev++;
        render(true);
      } else {
        A.stopSpeak();
        opts.onExit({ done: true, passed: passed, seen: seen });
      }
    }
    function close() {
      A.stopSpeak();
      opts.onExit({ closed: true, passed: passed, seen: seen });
    }

    function ladder() {
      var chips = [h("span", { class: "rung start" }, "もんだい")];
      frames.forEach(function (f, i) {
        chips.push(h("span", { class: "rung-arrow" }, "▸"));
        chips.push(h("span", { class: "rung" + (i === frames.length - 1 ? " here" : "") }, concepts[f.cid].title));
      });
      return h("div", { class: "ladder", "aria-label": "いま どこまで もどっているか" }, chips);
    }

    function guide(text) {
      return h("div", { class: "guide" },
        h("div", { class: "guide-pet" }, A.petEmoji()),
        h("div", { class: "bubble" }, text));
    }

    function render(autoSpeak) {
      A.clear(root);
      var c = concept(), f = cur();
      var top = h("div", { class: "topbar" },
        h("button", { class: "btn-ghost", onclick: close }, "← もんだいへ"),
        h("button", { class: "btn-ghost icon", "aria-label": "こえ", onclick: function () {
          A.S.settings.voice = !A.S.settings.voice; A.save(); if (!A.S.settings.voice) A.stopSpeak(); render();
        } }, A.S.settings.voice ? "🔊" : "🔇"));
      var body;

      if (chooser) {
        body = h("section", { class: "card" },
          guide("どこが わからないかな? おしえてね"),
          h("div", { class: "choice-col" }, prereqs().map(function (id) {
            return h("button", { class: "btn big alt", onclick: function () { descend(id); } }, "🪜 " + concepts[id].title);
          })),
          h("button", { class: "btn-ghost", onclick: function () { chooser = false; render(); } }, "← やっぱり もどる"));
        root.appendChild(top); root.appendChild(ladder()); root.appendChild(body);
        return;
      }

      if (check) {
        var q = check.q, choices = check.choices;
        var cardKids = [guide(check.submitted ? (check.correct ? "せいかい! すごい!" : "おしい! だいじょうぶ、いっしょに") : "たしかめてみよう!"),
          h("p", { class: "big-text" }, q.question, " ", h("button", { class: "btn-ghost icon say", "aria-label": "よむ", onclick: function () { A.speak(q.question + "。 " + choices.join("、 か、 "), true); } }, "🔊")),
          q.visual ? A.renderVisual(q.visual) : null];
        if (!check.submitted) {
          cardKids.push(h("div", { class: "choice-col" }, choices.map(function (ch) {
            return h("button", { class: "btn big choice", onclick: function () {
              check.answer = ch; check.correct = ch === q.answer; check.submitted = true;
              if (!check.correct) cur().missed = true; // まちがえた あとの 正解では ごはんは でない
              A.sfx(check.correct ? "ok" : "ng");
              if (check.correct) A.confetti(12);
              render();
              if (A.S.settings.voice) A.speak((check.correct ? "せいかい。" : "おしい。") + q.explanation);
            } }, ch);
          }).map(function (b, k) { return h("div", { class: "choice-wrap" }, b, h("button", { class: "btn-ghost icon say", "aria-label": "よむ", onclick: function () { A.speak(choices[k], true); } }, "🔊")); })));
          cardKids.push(h("button", { class: "btn-ghost", onclick: function () { check = null; render(); } }, "← もういちど 見る"));
        } else {
          cardKids.push(h("p", { class: "explain " + (check.correct ? "good" : "soft") }, q.explanation, " ", h("button", { class: "btn-ghost icon say", "aria-label": "よむ", onclick: function () { A.speak(q.explanation, true); } }, "🔊")));
          var acts = [];
          if (check.correct) {
            acts.push(h("button", { class: "btn big good", onclick: finishOrPop }, frames.length > 1 ? "☑ わかった! ひとつ もどる ▶" : "☑ わかった! もんだいへ ▶"));
          } else {
            acts.push(h("button", { class: "btn big", onclick: function () {
              var ff = cur(); ff.ex++; ff.piece = exPiece(); check = null; rev++; render(true);
            } }, "🔁 べつの れいで もういちど"));
            if (prereqs().length) acts.push(h("button", { class: "btn big alt", onclick: askEasier }, "🪜 もっと やさしく"));
          }
          cardKids.push(h("div", { class: "choice-col" }, acts));
        }
        body = h("section", { class: "card" }, cardKids);
        root.appendChild(top); root.appendChild(ladder()); root.appendChild(body);
        return;
      }

      var list = pieces(c, f.ex, frames.length === 1 ? problem : null);
      if (f.piece >= list.length) f.piece = list.length - 1;
      var p = list[f.piece];
      var last = f.piece === list.length - 1;
      var vis = p.visual ? A.renderVisual(p.visual) : null;
      var dots = h("div", { class: "dots" }, list.map(function (_, i) {
        return h("span", { class: "dot-i" + (i === f.piece ? " on" : i < f.piece ? " past" : "") });
      }));
      var nav = [];
      nav.push(h("button", { class: "btn small", "aria-label": "もういちど きく", onclick: function () {
        if (!A.speak(p.text, true)) A.toast("このたんまつは こえが でないよ");
      } }, "🔊"));
      nav.push(h("button", { class: "btn small", disabled: f.piece === 0 && frames.length === 1 ? true : null, onclick: function () {
        if (f.piece > 0) f.piece--; else if (frames.length > 1) frames.pop();
        rev++; render(true);
      } }, "◀"));
      var actions = [];
      var easier = prereqs().length;
      if (!last) {
        // つぎへ = もっと わかりやすく(ヒント → 一歩手前 → きほん → たとえ → ひとつずつ)
        nav.push(h("button", { class: "btn big grow", onclick: function () { f.piece++; seen++; rev++; render(true); } }, f.piece < nHints - 1 && frames.length === 1 ? "🪜 もっと ヒント ▶" : "🪜 もっと わかりやすく ▶"));
      }
      actions.push(h("div", { class: "nav-row" }, nav));
      if (frames.length === 1 && problem) {
        // もとの もんだいに もどって、じぶんで やってみる(こたえは ここでは 言わない)
        actions.push(h("button", { class: "btn big good", onclick: function () { close(); } }, "😊 わかった! もんだいで やってみる"));
        if (last && checkPool(cur().cid, problem.id).length) actions.push(h("button", { class: "btn big", onclick: function () {
          check = newCheck(); rev++; render();
          if (A.S.settings.voice && A.S.settings.autoRead) A.speak("たしかめてみよう。 " + check.q.question);
        } }, "✏️ にた もんだいで れんしゅう"));
      } else if (last) {
        actions.push(h("button", { class: "btn big good", onclick: function () {
          check = newCheck();
          rev++; render();
          if (A.S.settings.voice && A.S.settings.autoRead) A.speak("たしかめてみよう。 " + check.q.question);
        } }, "😊 わかった! たしかめる"));
      }
      if (last && easier) {
        actions.push(h("button", { class: "btn big alt", onclick: function () { seen++; askEasier(); } }, "🪜 まだ むずかしい → もっと まえの きほんへ"));
      } else if (!last && easier && f.piece >= (frames.length === 1 && problem ? nHints : 0)) {
        actions.push(h("button", { class: "btn alt", onclick: function () { seen++; askEasier(); } }, "🪜 もっと まえの きほんへ とぶ"));
      } else if (last) {
        actions.push(h("button", { class: "btn big alt", onclick: function () { f.ex++; f.piece = exPiece(); seen++; rev++; render(true); } }, "🔁 べつの たとえを 見る"));
      }
      body = h("section", { class: "card" },
        h("div", { class: "concept-title" }, c.title),
        guide(p.head),
        p.quote ? h("div", { class: "tutor-quote" }, "もんだい: ", p.quote) : null,
        h("p", { class: "big-text" }, p.text),
        vis, dots, actions);
      root.appendChild(top); root.appendChild(ladder()); root.appendChild(body);
      if (autoSpeak !== false) speakPanel(p);
    }

    render();
  };

  A.tutorConceptTitle = function (id) { return concepts[id] ? concepts[id].title : id; };
})();
