/* まなたま てき(問題のモンスター)9しゅるい: 教科ごとに1しゅるい。SVG・オリジナル */
(function () {
  "use strict";
  var A = window.A;
  var INK = "#1d1840";
  function eyes(x1, x2, y, r, brow) {
    brow = brow || INK;
    return '<g class="cr-blink"><circle cx="' + x1 + '" cy="' + y + '" r="' + r + '" fill="#fff"/><circle cx="' + x2 + '" cy="' + y + '" r="' + r + '" fill="#fff"/>' +
      '<circle cx="' + (x1 + 2) + '" cy="' + (y + 2) + '" r="' + (r * 0.5) + '" fill="' + INK + '"/><circle cx="' + (x2 - 2) + '" cy="' + (y + 2) + '" r="' + (r * 0.5) + '" fill="' + INK + '"/></g>' +
      '<path d="M' + (x1 - r - 4) + ' ' + (y - r - 4) + 'L' + (x1 + r) + ' ' + (y - r + 4) + 'M' + (x2 + r + 4) + ' ' + (y - r - 4) + 'L' + (x2 - r) + ' ' + (y - r + 4) + '" stroke="' + brow + '" stroke-width="5" stroke-linecap="round"/>';
  }
  function grin(cx, y, w, col) {
    col = col || INK; var h = w * 0.32;
    return '<path d="M' + (cx - w / 2) + ' ' + y + 'Q' + cx + ' ' + (y + h * 2.2) + ' ' + (cx + w / 2) + ' ' + y + 'Q' + cx + ' ' + (y + h * 0.9) + ' ' + (cx - w / 2) + ' ' + y + 'Z" fill="' + col + '"/>' +
      '<path d="M' + (cx - w * 0.3) + ' ' + (y + 1.5) + 'l' + (w * 0.1) + ' 0l-' + (w * 0.05) + ' ' + (h * 0.9) + 'zM' + (cx + w * 0.2) + ' ' + (y + 1.5) + 'l' + (w * 0.1) + ' 0l-' + (w * 0.05) + ' ' + (h * 0.9) + 'z" fill="#fff"/>';
  }
  var LIST = [
    { id: "numbo", n: "ナンバーン", subject: "算数", g: ["#8db4ff", "#2f55c4"], art: function (G) {
      return '<text x="34" y="64" font-size="34" font-weight="900" fill="#ffd23a" class="cr-shard">＋</text><text x="150" y="54" font-size="34" font-weight="900" fill="#7ef0ff" class="cr-shard b">−</text><text x="158" y="126" font-size="30" font-weight="900" fill="#ff9ad0" class="cr-shard c">×</text>' +
        '<ellipse cx="38" cy="124" rx="12" ry="18" fill="#3a63d0" transform="rotate(20 38 124)"/><ellipse cx="162" cy="124" rx="12" ry="18" fill="#3a63d0" transform="rotate(-20 162 124)"/>' +
        '<rect x="66" y="156" width="26" height="22" rx="8" fill="#2a47a0"/><rect x="108" y="156" width="26" height="22" rx="8" fill="#2a47a0"/>' +
        '<rect x="48" y="58" width="104" height="104" rx="28" fill="url(#' + G + ')"/><rect x="58" y="66" width="40" height="10" rx="5" fill="#fff" opacity=".35"/>' +
        eyes(80, 120, 98, 13, "#14286b") + grin(100, 126, 56, "#14286b"); } },
    { id: "alphabee", n: "アルファビー", subject: "英語", g: ["#ff9fd0", "#d63c8c"], art: function (G) {
      return '<path d="M56 96C26 70 14 80 6 56C28 58 40 52 50 40C48 62 62 76 72 86Z" fill="#b8326f"/><g transform="translate(200 0) scale(-1 1)"><path d="M56 96C26 70 14 80 6 56C28 58 40 52 50 40C48 62 62 76 72 86Z" fill="#b8326f"/></g>' +
        '<path d="M66 70L60 42L86 62Z" fill="#fff0c0"/><path d="M134 70L140 42L114 62Z" fill="#fff0c0"/>' +
        '<ellipse cx="78" cy="176" rx="14" ry="8" fill="#a82a74"/><ellipse cx="122" cy="176" rx="14" ry="8" fill="#a82a74"/>' +
        '<circle cx="100" cy="112" r="54" fill="url(#' + G + ')"/><ellipse cx="100" cy="146" rx="30" ry="22" fill="#fff" opacity=".92"/>' +
        '<text x="100" y="158" font-size="38" font-weight="900" fill="#d63c8c" text-anchor="middle">A</text>' +
        eyes(80, 120, 96, 12, "#6a1245") + '<path d="M86 114Q100 122 114 114" stroke="' + INK + '" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M90 116L94 116L92 124ZM106 116L110 116L108 124Z" fill="#fff"/>'; } },
    { id: "mojimojin", n: "モジモジン", subject: "国語", g: ["#ffc16a", "#e8761c"], art: function (G) {
      return '<path d="M150 30L124 76" stroke="#7a4a10" stroke-width="5" stroke-linecap="round"/><path d="M150 30C170 28 178 44 168 58C160 66 146 54 150 30Z" fill="#ffe9c0" stroke="#d9a55a" stroke-width="2"/>' +
        '<path d="M100 56C142 52 168 84 160 118C156 140 170 154 152 172C138 184 122 170 114 182C106 192 94 176 84 182C70 188 62 168 54 162C36 146 46 122 42 102C36 70 66 58 100 56Z" fill="url(#' + G + ')"/>' +
        '<ellipse cx="72" cy="78" rx="14" ry="7" fill="#fff" opacity=".4" transform="rotate(-28 72 78)"/>' +
        '<text x="100" y="164" font-size="34" font-weight="900" fill="#fff" text-anchor="middle" opacity=".9">あ</text>' +
        eyes(82, 118, 100, 12, "#7a3a08") + grin(100, 118, 40, "#5a2a08"); } },
    { id: "flaskon", n: "フラスコン", subject: "理科", g: ["#7ff0a8", "#25a85c"], art: function (G) {
      return '<g class="cr-flame"><circle cx="92" cy="14" r="6" fill="#fff" opacity=".7"/><circle cx="108" cy="22" r="8" fill="#fff" opacity=".6"/></g>' +
        '<rect x="80" y="26" width="40" height="16" rx="5" fill="#a8743a"/>' +
        '<path d="M84 42H116V86L158 156C166 172 156 184 140 184H60C44 184 34 172 42 156L84 86Z" fill="#dff7ee" stroke="#8fd9b6" stroke-width="5" stroke-linejoin="round"/>' +
        '<path d="M60 136H140L156 160C160 172 152 178 140 178H60C48 178 40 172 44 160Z" fill="url(#' + G + ')"/>' +
        '<circle cx="74" cy="168" r="4" fill="#fff" opacity=".7"/><circle cx="130" cy="146" r="3" fill="#fff" opacity=".7"/><circle cx="116" cy="170" r="5" fill="#fff" opacity=".6"/>' +
        eyes(82, 118, 148, 10, "#0f5a2c") + '<path d="M88 166Q100 174 112 166" stroke="#0f5a2c" stroke-width="3.5" fill="none" stroke-linecap="round"/>'; } },
    { id: "chizura", n: "チズラ", subject: "社会", g: ["#b99cff", "#6a42c8"], art: function (G) {
      return '<ellipse cx="100" cy="184" rx="38" ry="8" fill="#3b2a80"/><path d="M52 50Q24 112 58 166" stroke="#3b2a80" stroke-width="7" fill="none" stroke-linecap="round"/>' +
        '<path d="M100 48V26" stroke="#3b2a80" stroke-width="4"/><path d="M100 26L124 34L100 42Z" fill="#ff5a5a"/>' +
        '<circle cx="100" cy="112" r="58" fill="url(#' + G + ')"/>' +
        '<path d="M60 92C70 80 86 82 92 92C86 104 72 108 62 106Z" fill="#7ad884"/><path d="M116 84C132 78 148 90 146 104C140 112 124 112 116 102Z" fill="#7ad884"/><path d="M96 138C110 132 124 144 118 156C108 162 98 154 96 138Z" fill="#7ad884"/>' +
        '<path d="M100 54Q70 112 100 168M100 54Q130 112 100 168M44 112H156" stroke="#fff" stroke-width="2" fill="none" opacity=".35"/>' +
        eyes(82, 118, 104, 12, "#2a1860") + grin(100, 128, 40, "#2a1860"); } },
    { id: "onpuler", n: "オンプラー", subject: "音楽", g: ["#ff9a9a", "#d03a3a"], art: function (G) {
      return '<path d="M168 96Q184 110 168 126M180 84Q202 110 180 138" stroke="#ffb3b3" stroke-width="4" fill="none" stroke-linecap="round" class="cr-glow"/>' +
        '<rect x="112" y="34" width="14" height="104" rx="7" fill="#8f1f1f"/><path d="M126 36C156 48 176 68 162 104C164 80 148 72 126 70Z" fill="#8f1f1f"/>' +
        '<ellipse cx="86" cy="140" rx="46" ry="38" fill="url(#' + G + ')" transform="rotate(-14 86 140)"/><ellipse cx="66" cy="124" rx="12" ry="6" fill="#fff" opacity=".4" transform="rotate(-30 66 124)"/>' +
        '<ellipse cx="62" cy="178" rx="14" ry="7" fill="#8f1f1f"/><ellipse cx="102" cy="176" rx="14" ry="7" fill="#8f1f1f"/>' +
        eyes(68, 102, 134, 11, "#5a0f0f") + '<ellipse cx="86" cy="160" rx="11" ry="9" fill="#5a0f0f"/><ellipse cx="86" cy="165" rx="6" ry="4" fill="#ff7a7a"/>'; } },
    { id: "penking", n: "ペンキング", subject: "美術", g: ["#ffa8e8", "#c43fb0"], art: function (G) {
      return '<polygon points="64,64 70,36 84,56 100,30 116,56 130,36 136,64" fill="#ffd23a" stroke="#e8a21c" stroke-width="2" stroke-linejoin="round"/><circle cx="70" cy="36" r="5" fill="#4ad8ff"/><circle cx="100" cy="30" r="5" fill="#7aef6a"/><circle cx="130" cy="36" r="5" fill="#ff6a6a"/>' +
        '<path d="M100 58C138 54 160 82 158 114C158 138 148 160 130 172C116 180 84 180 70 172C52 160 42 138 42 114C40 82 62 62 100 58Z" fill="url(#' + G + ')"/>' +
        '<path d="M60 168C58 184 70 190 70 176ZM126 172C124 190 138 192 136 176Z" fill="#c43fb0"/><circle cx="30" cy="104" r="7" fill="#4ad8ff"/><circle cx="172" cy="86" r="6" fill="#7aef6a"/><circle cx="168" cy="150" r="8" fill="#ffd23a"/>' +
        '<ellipse cx="72" cy="84" rx="14" ry="7" fill="#fff" opacity=".4" transform="rotate(-28 72 84)"/>' +
        eyes(80, 120, 102, 12, "#6a1a60") + '<path d="M82 126Q100 142 118 126Z" fill="#6a1a60"/><path d="M92 130Q100 150 108 130Z" fill="#ff6a8a"/>'; } },
    { id: "borgon", n: "ボルゴン", subject: "保健体育", g: ["#ffffff", "#cfdcec"], art: function (G) {
      function pent(cx, cy, r) { var p = []; for (var i = 0; i < 5; i++) { var a = -Math.PI / 2 + i * 2 * Math.PI / 5; p.push((cx + r * Math.cos(a)).toFixed(1) + "," + (cy + r * Math.sin(a)).toFixed(1)); } return '<polygon points="' + p.join(" ") + '" fill="#2fb5c7"/>'; }
      return '<ellipse cx="74" cy="178" rx="16" ry="8" fill="#1d7a88"/><ellipse cx="126" cy="178" rx="16" ry="8" fill="#1d7a88"/>' +
        '<circle cx="100" cy="112" r="58" fill="url(#' + G + ')" stroke="#b6c8de" stroke-width="3"/>' + pent(100, 62, 13) + pent(52, 112, 12) + pent(148, 112, 12) + pent(74, 164, 11) + pent(126, 164, 11) +
        '<rect x="44" y="86" width="112" height="14" rx="6" fill="#ff5a5a"/><path d="M152 90L176 80L172 100Z" fill="#ff5a5a"/>' +
        eyes(82, 118, 118, 11, INK) + grin(100, 138, 34, INK); } },
    { id: "nejira", n: "ネジラ", subject: "技術家庭", g: ["#f0dd6a", "#8a8a1f"], art: function (G) {
      var teeth = ""; for (var i = 0; i < 12; i++) teeth += '<rect x="92" y="46" width="16" height="22" rx="4" fill="#9a9a2a" transform="rotate(' + (i * 30) + ' 100 110)"/>';
      return '<path d="M150 124L176 94" stroke="#9aa6b8" stroke-width="10" stroke-linecap="round"/><circle cx="178" cy="90" r="11" fill="none" stroke="#9aa6b8" stroke-width="7"/>' +
        '<ellipse cx="78" cy="178" rx="14" ry="8" fill="#6a6a18"/><ellipse cx="122" cy="178" rx="14" ry="8" fill="#6a6a18"/>' +
        '<g class="cr-sway" style="transform-origin:50% 50%">' + teeth + '</g><circle cx="100" cy="110" r="50" fill="url(#' + G + ')"/>' +
        '<path d="M88 66H112M100 54V78" stroke="#6a6a18" stroke-width="5" stroke-linecap="round" opacity=".6"/>' +
        eyes(82, 118, 108, 11, "#4a4a10") + grin(100, 130, 34, "#4a4a10"); } },
  ];
  var defs = "", by = {}, subj = {};
  LIST.forEach(function (e, i) {
    e.idx = i; e.gid = "gn-" + e.id; by[e.id] = e; subj[e.subject] = e;
    defs += '<linearGradient id="' + e.gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + e.g[0] + '"/><stop offset="1" stop-color="' + e.g[1] + '"/></linearGradient>';
  });
  var holder = document.createElement("div");
  holder.setAttribute("aria-hidden", "true");
  holder.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
  holder.innerHTML = '<svg width="0" height="0"><defs>' + defs + "</defs></svg>";
  document.body.insertBefore(holder, document.body.firstChild);
  var HUES = [0, 30, -35, 70, -70];
  A.enemies = {
    list: LIST,
    forSubject: function (subject, variant) { subject = { 生活: "理科" }[subject] || subject; return { e: subj[subject] || LIST[0], hue: HUES[(variant || 0) % HUES.length] }; },
    el: function (id, hue, cls) {
      var e = by[id], s = document.createElement("span");
      s.className = "cr-wrap foe-art" + (cls ? " " + cls : "");
      if (hue) s.style.filter = "hue-rotate(" + hue + "deg)";
      s.innerHTML = '<svg class="cr" viewBox="0 0 200 200" aria-hidden="true" focusable="false"><ellipse cx="100" cy="186" rx="50" ry="7" class="cr-shadow"/>' + e.art(e.gid) + "</svg>";
      return s;
    },
  };
})();
