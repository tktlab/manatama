/* まなたま: ログインボーナス・ガチャ・ガチャなかま(育成)・きょうのミッション・ふくしゅう
 * 毎日ひらく → ログインボーナスで チケット → ガチャ → ガチャなかまに ごはん → ごはんは もんだいで もらう
 * という くりかえしが 自然に できるように する。 */
(function () {
  "use strict";
  var A = window.A, h = A.h;
  function S() { return A.S; }
  function C() { return A.core; }
  var DARK = "#2a2f55";

  /* ================= ガチャなかま(オリジナル14しゅるい) ================= */
  // r: 1=ノーマル 2=レア 3=スーパーレア 4=ウルトラレア
  var LIST = [
    { id: "poteru", n: "ぽてまる", r: 1, shape: "blob", c: ["#d8fff0", "#57d6a8"], type: "cute", talk: "ぽてぽて〜" },
    { id: "kumoppi", n: "くもっぴ", r: 1, shape: "cloud", c: ["#ffffff", "#bcd8ff"], type: "cute", talk: "ふわふわ だよ" },
    { id: "shizukun", n: "しずくん", r: 1, shape: "drop", c: ["#c9ecff", "#4aa3ff"], type: "cute", talk: "ぽちゃん!" },
    { id: "happa", n: "はっぱっぱ", r: 1, shape: "leaf", c: ["#e6ffc7", "#79cf4d"], type: "cute", talk: "すくすく そだつよ" },
    { id: "piyomaru", n: "ぴよまる", r: 1, shape: "bird", c: ["#fff7b8", "#ffcc33"], type: "cute", talk: "ぴよぴよ!" },
    { id: "kirarin", n: "きらりん", r: 2, shape: "star", c: ["#fff6c2", "#ffc21a"], type: "cute", talk: "キラーン☆" },
    { id: "honopo", n: "ほのぽっぽ", r: 2, shape: "flame", c: ["#ffe08a", "#ff6a2b"], type: "cool", talk: "もえて きたぞ!" },
    { id: "usamimi", n: "うさみみぃ", r: 2, shape: "bunny", c: ["#fff0f6", "#ffb3d1"], type: "cute", talk: "ぴょこん♪" },
    { id: "shirokuma", n: "しろくまる", r: 2, shape: "bear", c: ["#ffffff", "#d7e6f5"], type: "cute", talk: "ひんやり〜" },
    { id: "chibidora", n: "ちびドラ", r: 3, shape: "dragon", c: ["#e3cbff", "#8b4dff"], type: "cool", talk: "ガオーッ!" },
    { id: "nijikujira", n: "にじクジラ", r: 3, shape: "whale", c: ["#bfeaff", "#3e7bff"], type: "cute", rainbow: true, talk: "ぷしゅ〜っ🌈" },
    { id: "kurisutan", n: "クリスタン", r: 3, shape: "crystal", c: ["#e9fbff", "#5fd4ff"], type: "cool", talk: "きらめく ちから!" },
    { id: "gyaranyan", n: "ギャラにゃん", r: 4, shape: "cat", c: ["#5a4fcf", "#1e1a5e"], type: "cool", galaxy: true, talk: "うちゅうの ちから にゃ" },
    { id: "tamaking", n: "たまごキング", r: 4, shape: "king", c: ["#fff6d6", "#ffcf4a"], type: "cute", talk: "わしが キングじゃ!" },
  ];
  var BY = {}; LIST.forEach(function (d, i) { d.i = i; BY[d.id] = d; });
  var RARE = { 1: { name: "ノーマル", star: "★", color: "#7fb3ff", cap: "#8fd0ff" }, 2: { name: "レア", star: "★★", color: "#ffb31a", cap: "#ffd34d" },
    3: { name: "スーパーレア", star: "★★★", color: "#b46bff", cap: "#c98bff" }, 4: { name: "ウルトラレア", star: "★★★★", color: "#ff4fa0", cap: "rainbow" } };
  var WEIGHT = { 1: 66, 2: 26, 3: 7, 4: 1 };
  // がったい: かぶった なかま(のこりの 1ぴきは かならず のこす)を あつめて 1つ上の ランクに
  var FUSE = { 1: 5, 2: 10, 3: 15 };
  var PITY = 30; // 30回 まわしても ★★★ が でなければ、つぎは かならず ★★★いじょう
  var STAGE = [0, 5, 15]; // ごはんの かず: ベビー / こども / おとな
  var MAXF = 30;
  var STAGE_NAME = ["ベビー", "こども", "おとな"];

  /* ---------- 絵(SVG) ---------- */
  var defs = "";
  LIST.forEach(function (d) {
    defs += '<linearGradient id="gg-' + d.id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + d.c[0] + '"/><stop offset="1" stop-color="' + d.c[1] + '"/></linearGradient>';
  });
  defs += '<linearGradient id="gg-rainbow" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5e7e"/><stop offset=".25" stop-color="#ffd23a"/><stop offset=".5" stop-color="#4fd98a"/><stop offset=".75" stop-color="#4aa3ff"/><stop offset="1" stop-color="#b46bff"/></linearGradient>';
  defs += '<radialGradient id="gg-aura" cx=".5" cy=".5" r=".5"><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset=".8" stop-color="#ffe680" stop-opacity=".55"/><stop offset="1" stop-color="#ffe680" stop-opacity="0"/></radialGradient>';
  var holder = document.createElement("div");
  holder.setAttribute("aria-hidden", "true");
  holder.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
  holder.innerHTML = '<svg width="0" height="0"><defs>' + defs + "</defs></svg>";
  document.body.insertBefore(holder, document.body.firstChild);

  function eye(x, y, rx, ry) {
    return '<g class="cr-blink"><ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + DARK + '"/><circle cx="' + (x + rx * 0.35) + '" cy="' + (y - ry * 0.4) + '" r="' + rx * 0.4 + '" fill="#fff"/><circle cx="' + (x - rx * 0.3) + '" cy="' + (y + ry * 0.35) + '" r="' + rx * 0.18 + '" fill="#fff"/></g>';
  }
  function face(cy, cool, light) {
    var e = cool
      ? '<g class="cr-blink"><ellipse cx="80" cy="' + cy + '" rx="9" ry="9" fill="#ffe066"/><ellipse cx="80" cy="' + cy + '" rx="3" ry="8" fill="#1b1440"/><ellipse cx="120" cy="' + cy + '" rx="9" ry="9" fill="#ffe066"/><ellipse cx="120" cy="' + cy + '" rx="3" ry="8" fill="#1b1440"/></g><path d="M67 ' + (cy - 13) + 'L91 ' + (cy - 6) + 'M133 ' + (cy - 13) + 'L109 ' + (cy - 6) + '" stroke="' + (light ? "#fff" : "#1b1440") + '" stroke-width="4" stroke-linecap="round"/>'
      : eye(80, cy, 9.5, 12) + eye(120, cy, 9.5, 12);
    return e + '<ellipse cx="62" cy="' + (cy + 18) + '" rx="9" ry="6" fill="#ff9fb8" opacity=".75"/><ellipse cx="138" cy="' + (cy + 18) + '" rx="9" ry="6" fill="#ff9fb8" opacity=".75"/>' +
      '<path d="M92 ' + (cy + 17) + 'Q100 ' + (cy + 27) + ' 108 ' + (cy + 17) + '" stroke="' + (light ? "#fff" : DARK) + '" stroke-width="3.2" fill="none" stroke-linecap="round"/>';
  }
  var BODY = {
    blob: function (G) { return '<path d="M100 52C146 52 170 94 166 130C163 164 136 180 100 180C64 180 37 164 34 130C30 94 54 52 100 52Z" fill="' + G + '"/><ellipse cx="70" cy="84" rx="14" ry="8" fill="#fff" opacity=".6" transform="rotate(-30 70 84)"/>'; },
    cloud: function (G) { return '<path d="M52 168C26 168 22 134 46 126C40 96 76 82 92 100C100 70 146 72 148 104C178 102 184 146 160 156C164 172 140 178 128 170C116 182 82 182 72 172C64 176 54 174 52 168Z" fill="' + G + '" stroke="#cfe0ff" stroke-width="3"/>'; },
    drop: function (G) { return '<path d="M100 36C112 70 162 100 162 136C162 166 136 182 100 182C64 182 38 166 38 136C38 100 88 70 100 36Z" fill="' + G + '"/><ellipse cx="74" cy="118" rx="8" ry="16" fill="#fff" opacity=".55" transform="rotate(18 74 118)"/>'; },
    leaf: function (G) { return '<path d="M100 54Q100 34 112 24" stroke="#4a9e2a" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M110 28C124 6 156 10 158 14C158 14 150 44 110 34Z" fill="#79cf4d"/><path d="M104 34C92 12 64 16 62 20C62 20 68 46 104 40Z" fill="#5fbb3a"/><ellipse cx="100" cy="124" rx="60" ry="56" fill="' + G + '"/>'; },
    bird: function (G) { return '<path d="M96 66Q90 44 104 40Q100 52 110 56" fill="#ffb300"/><ellipse cx="100" cy="124" rx="58" ry="56" fill="' + G + '"/><path d="M42 124Q28 112 34 96Q48 106 54 120Z" fill="#ffd84d"/><path d="M158 124Q172 112 166 96Q152 106 146 120Z" fill="#ffd84d"/><path d="M92 136L108 136L100 148Z" fill="#ff9a1a"/><ellipse cx="80" cy="178" rx="9" ry="5" fill="#ff9a1a"/><ellipse cx="120" cy="178" rx="9" ry="5" fill="#ff9a1a"/>'; },
    star: function (G) { return '<path d="M100 26L122 80L180 84L135 120L150 176L100 146L50 176L65 120L20 84L78 80Z" fill="' + G + '" stroke="#ffb300" stroke-width="5" stroke-linejoin="round"/>'; },
    flame: function (G) { return '<path class="cr-flame" d="M100 22C114 52 150 64 152 116C154 156 130 182 100 182C70 182 46 156 48 118C50 92 66 86 70 66C80 80 84 88 90 92C90 66 92 46 100 22Z" fill="' + G + '"/><path d="M100 96C108 112 126 124 124 146C122 164 112 172 100 172C88 172 78 164 78 148C78 132 92 124 100 96Z" fill="#fff3b0" opacity=".7"/>'; },
    bunny: function (G) { return '<ellipse cx="78" cy="56" rx="13" ry="38" fill="' + G + '" transform="rotate(-10 78 56)"/><ellipse cx="79" cy="60" rx="6" ry="25" fill="#ff8fb8" transform="rotate(-10 79 60)"/><ellipse cx="122" cy="56" rx="13" ry="38" fill="' + G + '" transform="rotate(10 122 56)"/><ellipse cx="121" cy="60" rx="6" ry="25" fill="#ff8fb8" transform="rotate(10 121 60)"/><ellipse cx="100" cy="130" rx="56" ry="50" fill="' + G + '"/>'; },
    bear: function (G) { return '<circle cx="58" cy="80" r="20" fill="' + G + '"/><circle cx="58" cy="80" r="9" fill="#ffc9da"/><circle cx="142" cy="80" r="20" fill="' + G + '"/><circle cx="142" cy="80" r="9" fill="#ffc9da"/><ellipse cx="100" cy="128" rx="58" ry="52" fill="' + G + '" stroke="#c8d8ea" stroke-width="3"/><ellipse cx="100" cy="150" rx="20" ry="14" fill="#fff"/>'; },
    dragon: function (G) { return '<path d="M154 150C190 150 194 112 176 104L170 122C164 130 158 136 150 138Z" fill="#7a3ff0"/><path d="M40 108C14 92 14 66 26 58C30 76 44 84 56 90Z" fill="#b48cff"/><path d="M160 108C186 92 186 66 174 58C170 76 156 84 144 90Z" fill="#b48cff"/><path d="M70 72L62 40L86 64Z" fill="#ffd23a"/><path d="M130 72L138 40L114 64Z" fill="#ffd23a"/><ellipse cx="100" cy="126" rx="58" ry="54" fill="' + G + '"/><ellipse cx="100" cy="150" rx="30" ry="22" fill="#f1e4ff"/>'; },
    whale: function (G) { return '<path d="M100 54Q94 34 84 30M100 54Q100 30 100 24M100 54Q106 34 116 30" stroke="#8fd3ff" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M164 120C186 98 196 110 190 124C184 134 186 146 194 158C178 160 168 148 160 140Z" fill="' + G + '"/><ellipse cx="96" cy="126" rx="70" ry="52" fill="' + G + '"/><path d="M40 140Q96 186 152 140Q130 172 96 174Q60 172 40 140Z" fill="#fff" opacity=".85"/>'; },
    crystal: function (G) { return '<polygon points="100,30 152,72 144,150 100,184 56,150 48,72" fill="' + G + '" stroke="#ffffff" stroke-width="3"/><polygon points="100,30 48,72 100,96" fill="#fff" opacity=".45"/><polygon points="100,30 152,72 100,96" fill="#bff1ff" opacity=".35"/>'; },
    cat: function (G) { return '<path d="M150 154C188 156 192 112 168 104" stroke="#2f2a80" stroke-width="13" fill="none" stroke-linecap="round"/><polygon points="58,92 52,40 96,70" fill="' + G + '"/><polygon points="142,92 148,40 104,70" fill="' + G + '"/><ellipse cx="100" cy="126" rx="58" ry="52" fill="' + G + '"/><circle cx="72" cy="104" r="3" fill="#fff"/><circle cx="130" cy="96" r="2.4" fill="#fff"/><circle cx="118" cy="160" r="2.6" fill="#ffe680"/><circle cx="66" cy="150" r="2" fill="#fff"/><polygon points="100,90 103,97 110,97 104,101 107,108 100,104 93,108 96,101 90,97 97,97" fill="#ffe680"/>'; },
    king: function (G) { return '<path d="M36 176C40 132 60 116 100 116C140 116 160 132 164 176Z" fill="#e0344b"/><path d="M100 46C140 46 160 96 160 128C160 160 134 178 100 178C66 178 40 160 40 128C40 96 60 46 100 46Z" fill="' + G + '"/><path d="M40 146C70 160 130 160 160 146L160 154C130 170 70 170 40 154Z" fill="#fff" opacity=".5"/>'; },
  };
  function crown(y) { return '<path d="M74 ' + y + 'L78 ' + (y - 24) + 'L90 ' + (y - 10) + 'L100 ' + (y - 30) + 'L110 ' + (y - 10) + 'L122 ' + (y - 24) + 'L126 ' + y + 'Z" fill="#ffd23a" stroke="#e0a800" stroke-width="3" stroke-linejoin="round"/><circle cx="100" cy="' + (y - 30) + '" r="4" fill="#ff4f7b"/>'; }
  function sparkles() { return '<g class="cr-glow"><polygon points="30,50 33,58 41,61 33,64 30,72 27,64 19,61 27,58" fill="#ffe066"/><polygon points="172,44 174,50 180,52 174,54 172,60 170,54 164,52 170,50" fill="#fff59a"/><polygon points="176,160 178,165 183,167 178,169 176,174 174,169 169,167 174,165" fill="#ffe066"/></g>'; }
  var FACE_Y = { blob: 120, cloud: 132, drop: 134, leaf: 124, bird: 116, star: 108, flame: 132, bunny: 126, bear: 122, dragon: 120, whale: 120, crystal: 112, cat: 122, king: 112 };

  function svg(id, stage) {
    var d = BY[id]; if (!d) return "";
    var G = "url(#gg-" + (d.rainbow && stage >= 2 ? "rainbow" : d.id) + ")";
    var s = '<ellipse cx="100" cy="186" rx="50" ry="7" class="cr-shadow"/>';
    if (stage >= 2 && d.r >= 3) s += '<circle cx="100" cy="112" r="96" fill="url(#gg-aura)" class="cr-glow"/>';
    s += BODY[d.shape](G) + face(FACE_Y[d.shape], d.type === "cool", d.galaxy);
    if (d.shape === "king") s += crown(54);
    if (stage >= 2 && d.r >= 2 && d.shape !== "king") s += sparkles();
    if (stage >= 2 && d.r === 4 && d.shape !== "king") s += crown(FACE_Y[d.shape] - 50);
    var scale = [0.72, 0.86, 1][stage] || 1;
    return '<svg class="cr gacha-cr" viewBox="0 0 200 200" aria-hidden="true" focusable="false"><g transform="translate(' + 100 * (1 - scale) + " " + 190 * (1 - scale) + ") scale(" + scale + ')">' + s + "</g></svg>";
  }
  function el(id, stage, cls) {
    var w = document.createElement("span");
    w.className = "cr-wrap" + (cls ? " " + cls : "");
    w.innerHTML = svg(id, stage == null ? stageOf(id) : stage);
    return w;
  }

  /* ---------- 状態 ---------- */
  function st() {
    var s = S();
    if (!s.gacha) s.gacha = { owned: {}, pulls: 0, pity: 0 };
    if (s.tickets == null) s.tickets = 0;
    if (!s.review) s.review = {};
    if (!s.login) s.login = { last: null, days: 0 };
    var today = A.dayKey();
    if (!s.daily || s.daily.date !== today) s.daily = { date: today, solved: 0, fed: 0, reviewed: 0, claimed: {}, bonus: false };
    return s;
  }
  function owned(id) { return st().gacha.owned[id]; }
  function stageOf(id) {
    var o = owned(id), f = o ? o.food : 0;
    return f >= STAGE[2] ? 2 : f >= STAGE[1] ? 1 : 0;
  }
  function count(id) { var o = owned(id); return o ? (o.count || 1 + (o.dup || 0)) : 0; }
  function spare(tier) { return LIST.reduce(function (n, d) { return n + (d.r === tier ? Math.max(0, count(d.id) - 1) : 0); }, 0); }
  /* がったい: tier の かぶりを FUSE[tier] ぴき つかって、tier+1 の なかまを 1ぴき */
  function fuse(tier) {
    var need = FUSE[tier];
    if (!need || spare(tier) < need) return;
    var left = need;
    while (left > 0) {
      var mine = LIST.filter(function (d) { return d.r === tier && count(d.id) > 1; }).sort(function (a, b) { return count(b.id) - count(a.id); });
      var o = owned(mine[0].id); o.count = count(mine[0].id) - 1; left--;
    }
    var pool = LIST.filter(function (d) { return d.r === tier + 1; }), d = pool[Math.floor(Math.random() * pool.length)];
    var was = owned(d.id);
    if (was) { was.count = count(d.id) + 1; was.food = Math.min(MAXF, was.food + 3); }
    else st().gacha.owned[d.id] = { food: 0, got: Date.now(), dup: 0, count: 1 };
    A.save();
    // えんしゅつ
    var orbs = h("div", { class: "fuse-orbs" });
    for (var i = 0; i < Math.min(need, 15); i++) orbs.appendChild(h("span", { class: "fuse-orb r" + tier, style: { "--a": (i / Math.min(need, 15)) * 360 + "deg", "animation-delay": i * 0.05 + "s" } }));
    C().view(h("section", { class: "gacha-stage fuse-stage" }, h("h2", null, "がったい!"), orbs, h("p", { class: "note center" }, RARE[tier].star + " を " + need + "ひき あつめて…")));
    A.sfx("pop"); A.speak("がったい!");
    setTimeout(function () { A.sfx("levelup"); reveal(d, !!was, "がったい"); }, 1700);
  }
  function fusePanel(after) {
    var rows = [1, 2, 3].map(function (t) {
      var have = spare(t), need = FUSE[t], ok = have >= need;
      return h("div", { class: "fuse-row" + (ok ? " ok" : "") },
        h("div", { class: "fuse-text" }, h("b", { style: { color: RARE[t].color } }, RARE[t].star), " かぶり ", h("b", null, have + " / " + need),
          h("span", null, " → "), h("b", { style: { color: RARE[t + 1].color } }, RARE[t + 1].star + " 1ぴき")),
        h("div", { class: "growbar small" }, h("div", { class: "growfill", style: { width: Math.min(100, Math.round(have / need * 100)) + "%" } })),
        ok ? h("button", { class: "btn small good pulse", onclick: function () { A.sfx("tap"); fuse(t); } }, "✨ がったい!") : null);
    });
    return h("section", { class: "fuse-panel" },
      h("div", { class: "mission-title" }, "✨ がったい ",
        h("button", { class: "btn-ghost icon say", "aria-label": "よむ", onclick: function () { A.speak("かぶった なかまを あつめると、1つ うえの ランクの なかまに がったい できるよ。ノーマル " + FUSE[1] + "ひきで レア、レア " + FUSE[2] + "ひきで スーパーレア、スーパーレア " + FUSE[3] + "ひきで ウルトラレア。"); } }, "🔊")),
      h("p", { class: "muted" }, "かぶった なかまを あつめると、1つ上の ランクに がったい できるよ!(どの子も 1ぴきは のこるよ)"),
      rows);
  }
  function ownedList() { return LIST.filter(function (d) { return owned(d.id); }); }

  /* ================= ログインボーナス ================= */
  var LOGIN = [ // 7日で 1しゅう(つづけて ログインしなくても すすむ。休んでも リセットしない)
    { t: 1, f: 0 }, { t: 1, f: 2 }, { t: 1, f: 0 }, { t: 1, f: 3 }, { t: 2, f: 0 }, { t: 1, f: 3 }, { t: 3, f: 5 },
  ];
  function loginCheck(after) {
    var s = st(), today = A.dayKey();
    if (s.first || !s.grade || s.login.last === today) return false;
    s.login.last = today;
    s.login.days = (s.login.days || 0) + 1;
    var idx = (s.login.days - 1) % 7, rw = LOGIN[idx];
    s.tickets += rw.t;
    if (rw.f) s.bag = (s.bag || 0) + rw.f;
    A.save();
    var stamps = LOGIN.map(function (x, i) {
      var done = i < idx, now = i === idx;
      return h("div", { class: "stamp" + (done ? " done" : "") + (now ? " now" : "") },
        h("small", null, (i + 1) + "日め"),
        h("b", null, "🎟️×" + x.t), x.f ? h("small", null, "🍙×" + x.f) : null,
        done ? h("span", { class: "stamp-ok" }, "✔") : null);
    });
    var box = h("div", { class: "overlay", role: "dialog", "aria-modal": "true" },
      h("div", { class: "overlay-card login-card" },
        h("h2", null, "ログインボーナス!"),
        h("p", null, "きょうも きてくれて ありがとう!"),
        h("div", { class: "stamps" }, stamps),
        h("div", { class: "login-get pop" }, "🎟️ ガチャチケット ×" + rw.t + (rw.f ? "   🍙 ごはん ×" + rw.f : "")),
        h("button", { class: "btn big good", onclick: function () { if (box.parentNode) box.parentNode.removeChild(box); after(); } }, "もらう!")));
    document.body.appendChild(box);
    A.sfx("levelup"); A.confetti(24);
    A.speak("ログインボーナス! ガチャチケットを " + rw.t + "まい ゲット!" + (rw.f ? " ごはんも " + rw.f + "こ!" : ""));
    return true;
  }

  /* ================= きょうの ミッション ================= */
  function missions() {
    var s = st(), d = s.daily, rv = Object.keys(s.review).length;
    return [
      { id: "solve", icon: "✏️", text: "もんだいを 3もん せいかい", now: Math.min(d.solved, 3), goal: 3, food: 1 },
      { id: "feed", icon: "🍙", text: "なかまに ごはんを 3かい あげる", now: Math.min(d.fed, 3), goal: 3, food: 1 },
      rv || d.reviewed ? { id: "review", icon: "📒", text: "ふくしゅうで 1もん せいかい", now: Math.min(d.reviewed, 1), goal: 1, food: 2 }
        : { id: "more", icon: "🚀", text: "もんだいを 6もん せいかい", now: Math.min(d.solved, 6), goal: 6, food: 2 },
    ];
  }
  function missionCard(refresh) {
    var s = st(), ms = missions(), all = ms.every(function (m) { return m.now >= m.goal; });
    var rows = ms.map(function (m) {
      var done = m.now >= m.goal, got = s.daily.claimed[m.id];
      return h("div", { class: "dm-row" + (done ? " done" : "") },
        h("span", { class: "dm-icon" }, done ? "✅" : m.icon),
        h("span", { class: "dm-text" }, m.text, h("small", null, " " + m.now + " / " + m.goal)),
        done && !got ? h("button", { class: "btn small good dm-get", onclick: function () {
          s.daily.claimed[m.id] = true; s.bag = (s.bag || 0) + m.food; A.save(); A.sfx("good"); A.confetti(10);
          A.toast("🍙 ごはん +" + m.food + "!"); refresh();
        } }, "🍙+" + m.food + " もらう") : got ? h("span", { class: "dm-got" }, "もらった") : h("span", { class: "dm-food" }, "🍙+" + m.food));
    });
    var bonus = s.daily.bonus ? h("div", { class: "dm-bonus got" }, "🎉 ぜんぶ クリア! チケット もらったよ")
      : all && ms.every(function (m) { return s.daily.claimed[m.id]; }) ? h("button", { class: "btn big good pulse", onclick: function () {
          s.daily.bonus = true; s.tickets += 1; A.save(); A.sfx("levelup"); A.confetti(26); A.speak("ミッション ぜんぶ クリア! ガチャチケットを ゲット!"); refresh();
        } }, "🎟️ ぜんぶ クリアの ごほうび!")
      : h("div", { class: "dm-bonus" }, "ぜんぶ クリアで 🎟️ ガチャチケット!");
    return h("section", { class: "daily" },
      h("div", { class: "mission-title" }, "📋 きょうの ミッション ",
        h("button", { class: "btn-ghost icon say", "aria-label": "よむ", onclick: function () { A.speak("きょうの ミッション。" + ms.map(function (m) { return m.text + "、" + m.now + "かい"; }).join("。 ")); } }, "🔊")),
      rows, bonus);
  }

  /* ================= ガチャ ================= */
  function draw() {
    var g = st().gacha, tier;
    if (g.pity >= PITY - 1) { tier = Math.random() < 0.15 ? 4 : 3; }
    else {
      var x = Math.random() * 100, acc = 0;
      for (tier = 1; tier <= 4; tier++) { acc += WEIGHT[tier]; if (x < acc) break; }
      if (tier > 4) tier = 1;
    }
    var pool = LIST.filter(function (d) { return d.r === tier; });
    var pick = pool[Math.floor(Math.random() * pool.length)]; // かぶりも ふつうに 出る
    g.pity = tier >= 3 ? 0 : g.pity + 1;
    g.pulls++;
    return pick;
  }
  function machineEl(spinning) {
    var cols = ["#8fd0ff", "#ffd34d", "#c98bff", "#ff8fb8", "#7fe0a8", "#ffb36b"], balls = "";
    for (var i = 0; i < 14; i++) {
      var x = 58 + (i * 37) % 84, y = 56 + Math.floor(i / 5) * 22 + (i % 2) * 8;
      balls += '<circle cx="' + x + '" cy="' + y + '" r="13" fill="' + cols[i % cols.length] + '" stroke="#fff" stroke-width="3"/>';
    }
    var w = document.createElement("div");
    w.className = "gm" + (spinning ? " spin" : "");
    w.innerHTML = '<svg viewBox="0 0 200 230" class="gm-svg" aria-hidden="true">' +
      '<rect x="40" y="120" width="120" height="96" rx="18" fill="#ff6b8b"/><rect x="40" y="120" width="120" height="20" rx="10" fill="#ff8fa6"/>' +
      '<circle cx="100" cy="76" r="62" fill="#e9f6ff" stroke="#fff" stroke-width="6"/><g class="gm-balls">' + balls + '</g>' +
      '<ellipse cx="78" cy="44" rx="16" ry="8" fill="#fff" opacity=".8" transform="rotate(-30 78 44)"/>' +
      '<g class="gm-handle"><circle cx="100" cy="168" r="20" fill="#ffd23a" stroke="#e0a800" stroke-width="4"/><rect x="96" y="150" width="8" height="36" rx="4" fill="#e0a800"/></g>' +
      '<rect x="128" y="186" width="26" height="22" rx="6" fill="#3a2a55"/><text x="100" y="138" text-anchor="middle" font-size="14" font-weight="800" fill="#fff">まなたま ガチャ</text></svg>';
    return w;
  }
  function gachaHome() {
    var s = st(), t = s.tickets;
    var rates = [4, 3, 2, 1].map(function (r) { return h("span", { class: "rate", style: { color: RARE[r].color } }, RARE[r].star + " " + RARE[r].name + " " + WEIGHT[r] + "%"); });
    C().view(C().topbar("🎰 ガチャ", C().home),
      h("section", { class: "gacha-top" },
        machineEl(false),
        h("div", { class: "ticket-count" }, "🎟️ ガチャチケット × " + t),
        h("button", { class: "btn big go" + (t ? " pulse" : ""), disabled: t ? null : true, onclick: function () { pull(); } }, t ? "🎰 ガチャを まわす!" : "チケットが ないよ"),
        t ? null : h("p", { class: "note" }, "チケットは まいにちの ログインボーナスと、「きょうの ミッション」を ぜんぶ クリアすると もらえるよ!"),
        h("div", { class: "rates" }, rates),
        h("p", { class: "muted center" }, "★★★は なかなか でないよ。でも " + PITY + "かい まわすと かならず でる!(あと " + Math.max(1, PITY - st().gacha.pity) + "かい)")),
      fusePanel(),
      h("button", { class: "btn big alt", onclick: function () { A.sfx("tap"); room(); } }, "🐾 ガチャなかまの へやへ"));
    A.speak(t ? "ガチャチケットが " + t + "まい あるよ。まわして みよう!" : "チケットが ないよ。ミッションを クリアしよう!");
  }
  function pull() {
    var s = st();
    if (!(s.tickets > 0)) return;
    s.tickets--;
    var d = draw(), was = owned(d.id), rare = RARE[d.r];
    if (was) { was.food = Math.min(MAXF, was.food + 3); was.dup = (was.dup || 0) + 1; was.count = count(d.id) + 1; }
    else s.gacha.owned[d.id] = { food: 0, got: Date.now(), dup: 0, count: 1 };
    A.save();
    // えんしゅつ: ハンドルが まわる → カプセルが おちる → タップで ひらく
    var m = machineEl(true);
    var cap = h("div", { class: "capsule drop r" + d.r, style: { "--cap": rare.cap === "rainbow" ? "#ff8fb8" : rare.cap } }, h("span", { class: "cap-top" }), h("span", { class: "cap-bot" }));
    var tip = h("p", { class: "note good center" }, "カプセルを タップして あけよう!");
    C().view(h("section", { class: "gacha-stage" }, m, cap, tip));
    A.sfx("pop");
    setTimeout(function () { A.sfx("pop"); }, 350);
    setTimeout(function () { A.sfx("tap"); if (d.r >= 3) { cap.classList.add("shine"); A.sfx("good"); } }, 900);
    var opened = false;
    cap.addEventListener("click", function () {
      if (opened) return; opened = true;
      cap.classList.add("open");
      setTimeout(function () { reveal(d, !!was); }, 520);
    });
    A.speak("ガチャ ガチャ… カプセルを タップして あけよう!");
  }
  function reveal(d, dup, how) {
    var rare = RARE[d.r];
    A.sfx(d.r >= 3 ? "levelup" : "good"); A.confetti(d.r >= 3 ? 44 : 20);
    var card = h("section", { class: "reveal r" + d.r },
      h("div", { class: "reveal-flash" }),
      h("div", { class: "reveal-rare", style: { color: rare.color } }, rare.star + " " + rare.name),
      h("div", { class: "reveal-art pop" }, el(d.id, 0)),
      h("h1", null, d.n),
      h("p", { class: "reveal-talk" }, "「" + d.talk + "」"),
      h("p", null, (how ? "がったいで " : "") + (dup ? "おなじ なかまが きたよ! " + d.n + "に ごはん +3!(×" + count(d.id) + ")" : "あたらしい なかまに なった!")),
      h("div", { class: "choice-col" },
        st().tickets ? h("button", { class: "btn big go", onclick: pull }, "🎰 もう1かい まわす(のこり " + st().tickets + ")") : null,
        h("button", { class: "btn big alt", onclick: function () { room(d.id); } }, "🐾 そだてに いく"),
        h("button", { class: "btn-ghost", onclick: C().home }, "ホームへ")));
    C().view(card);
    A.speak((d.r >= 3 ? "すごい! " + rare.name + "! " : "") + d.n + (dup ? "が また きたよ! ごはん プラス3!" : "が なかまに なったよ! " + d.talk));
  }

  /* ================= ガチャなかまの へや ================= */
  function feedFriend(id) {
    var s = st(), o = owned(id);
    if (!o || !(s.bag > 0)) { A.toast("ごはんが ないよ。もんだいを といて もらおう!"); A.speak("ごはんが ないよ。もんだいを といて もらおう!"); return null; }
    if (o.food >= MAXF) { A.toast("おなかいっぱい! なかよし MAX!"); return null; }
    var before = stageOf(id);
    s.bag--; o.food++; s.daily.fed++; A.save(); A.sfx("good");
    var after = stageOf(id);
    return after > before ? after : -1;
  }
  function room(focus) {
    var s = st(), list = ownedList();
    if (!list.length) {
      C().view(C().topbar("🐾 ガチャなかま", C().home),
        h("section", { class: "card center" }, h("p", { class: "big-text" }, "まだ ガチャなかまが いないよ。"),
          h("p", null, "ガチャを まわすと なかまが くるよ!"),
          h("button", { class: "btn big go", onclick: gachaHome }, "🎰 ガチャへ")));
      return;
    }
    if (focus) list = list.filter(function (d) { return d.id === focus; }).concat(list.filter(function (d) { return d.id !== focus; }));
    var cards = list.map(function (d) {
      var o = owned(d.id), sg = stageOf(d.id), rare = RARE[d.r];
      var lo = STAGE[sg], hi = sg < 2 ? STAGE[sg + 1] : MAXF;
      var pct = Math.max(0, Math.min(100, Math.round((o.food - lo) / (hi - lo) * 100)));
      var art = el(d.id, sg, "tap");
      art.addEventListener("click", function () { A.sfx("pop"); art.classList.remove("jump"); void art.offsetWidth; art.classList.add("jump"); A.speak(d.talk); });
      var isP = s.partner === d.id;
      return h("div", { class: "friend r" + d.r + (isP ? " partner" : "") },
        h("div", { class: "friend-rare", style: { color: rare.color } }, rare.star),
        h("div", { class: "friend-art" }, art),
        h("b", null, d.n, h("span", { class: "friend-count" }, " ×" + count(d.id))), h("small", null, STAGE_NAME[sg] + (o.food >= MAXF ? "・なかよしMAX" : "")),
        h("div", { class: "growbar small" }, h("div", { class: "growfill", style: { width: (o.food >= MAXF ? 100 : pct) + "%" } })),
        h("small", { class: "muted" }, o.food >= MAXF ? "🍙 " + o.food : sg < 2 ? "つぎの すがたまで 🍙" + (hi - o.food) : "なかよしMAXまで 🍙" + (MAXF - o.food)),
        h("button", { class: "btn small good", disabled: s.bag > 0 && o.food < MAXF ? null : true, onclick: function () {
          var r = feedFriend(d.id); if (r === null) return;
          if (r > 0) {
            A.confetti(30); A.sfx("levelup");
            var box = h("div", { class: "overlay", role: "dialog" }, h("div", { class: "overlay-card" },
              h("div", { class: "overlay-face" }, el(d.id, r)), h("h2", null, "せいちょう したよ!"), h("p", null, d.n + "が " + STAGE_NAME[r] + "に なった!"),
              h("button", { class: "btn big good", onclick: function () { if (box.parentNode) box.parentNode.removeChild(box); room(d.id); } }, "やったー!")));
            document.body.appendChild(box); A.speak(d.n + "が " + STAGE_NAME[r] + "に なったよ!");
          } else room(d.id);
        } }, "🍙 ごはん"),
        h("button", { class: "btn small" + (isP ? " alt" : ""), onclick: function () {
          s.partner = isP ? null : d.id; A.save(); A.sfx("tap");
          A.toast(isP ? "パートナーを やめたよ" : d.n + "が いっしょに たたかうよ!"); room(d.id);
        } }, isP ? "⚔️ パートナー中" : "⚔️ いっしょに たたかう"));
    });
    C().view(C().topbar("🐾 ガチャなかまの へや", C().home),
      h("div", { class: "room-head" }, h("span", null, "🍙 ごはん × " + (s.bag || 0)), h("span", null, "🎟️ × " + s.tickets)),
      h("p", { class: "note" }, "ごはんを あげると そだつよ。「いっしょに たたかう」に すると、もんだいの バトルに でてくれるよ!"),
      h("div", { class: "friend-grid" }, cards),
      fusePanel(),
      h("button", { class: "btn big go", onclick: function () { A.sfx("tap"); C().quickStart(); } }, "✏️ もんだいで ごはんを もらう ▶"));
  }

  /* ================= ふくしゅう ================= */
  function addReview(p, skill) {
    var s = st();
    if (!p || !p.id) return;
    var r = s.review[p.id] || (s.review[p.id] = { skill: p.skill, n: 0, at: 0 });
    r.n++; r.at = Date.now();
  }
  function clearReview(pid) { var s = st(); if (s.review[pid]) { delete s.review[pid]; return true; } return false; }
  function reviewHome() {
    var s = st(), D = window.AOTO_DATA, ids = Object.keys(s.review);
    var byId = {}; D.problems.forEach(function (p) { byId[p.id] = p; });
    ids = ids.filter(function (id) { return byId[id]; }).sort(function (a, b) { return s.review[a].at - s.review[b].at; });
    if (!ids.length) {
      C().view(C().topbar("📒 ふくしゅう", C().home),
        h("section", { class: "card center" }, h("div", { class: "result-face" }, A.petEmoji()),
          h("p", { class: "big-text" }, "ふくしゅうする もんだいは いま ないよ!"),
          h("p", null, "まちがえた もんだいや「わからない」を おした もんだいが、ここに たまるよ。"),
          h("button", { class: "btn big go", onclick: function () { C().quickStart(); } }, "✏️ もんだいを とく ▶")));
      return;
    }
    var subs = {};
    ids.forEach(function (id) { var sk = C().skillMap[byId[id].skill]; var sub = sk ? sk.subject : "?"; (subs[sub] = subs[sub] || []).push(id); });
    var groups = Object.keys(subs).map(function (sub) {
      var info = C().subjectInfo(sub) || { emoji: "📘", color: "#888" };
      return h("section", { class: "rv-group" },
        h("h3", { style: { color: info.color } }, info.emoji + " " + sub + " (" + subs[sub].length + ")"),
        subs[sub].slice(0, 8).map(function (id) {
          var p = byId[id];
          return h("button", { class: "rv-item", onclick: function () { startReview([id]); } }, h("span", null, p.question), h("small", null, "▶"));
        }),
        h("button", { class: "btn small", onclick: function () { startReview(subs[sub]); } }, info.emoji + " " + sub + "を ふくしゅう"));
    });
    C().view(C().topbar("📒 ふくしゅう", C().home),
      h("p", { class: "note" }, "まちがえた もんだいや「わからない」を おした もんだいだよ。じぶんで せいかい できたら「おぼえた!」で リストから きえるよ。"),
      h("button", { class: "btn big go pulse", onclick: function () { startReview(ids); } }, "📒 ふくしゅうを はじめる(" + ids.length + "もん)"),
      groups);
  }
  function startReview(ids) {
    ids = ids.slice(0, 3);
    if (!ids.length) return;
    A.sfx("tap");
    C().startReviewMission(ids);
  }

  /* ---------- 公開 ---------- */
  A.gacha = {
    list: LIST, rare: RARE, count: count, spare: spare, FUSE: FUSE, el: el, svg: svg, stageOf: stageOf, owned: owned, ownedList: ownedList, byId: BY,
    loginCheck: loginCheck, missionCard: missionCard, home: gachaHome, room: room, pull: pull,
    addReview: addReview, clearReview: clearReview, reviewHome: reviewHome, state: st,
    reviewCount: function () { return Object.keys(st().review).length; },
    onSolved: function () { st().daily.solved++; },
    onReviewSolved: function () { st().daily.reviewed++; },
    onFedPet: function () { st().daily.fed++; },
    partner: function () { var s = st(); return s.partner && owned(s.partner) ? BY[s.partner] : null; },
  };
})();
