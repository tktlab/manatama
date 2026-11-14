/* 「わからない」の説明が その問題を 教えているか: 答えの 言葉が 説明(意味・例・手順・この問題のヒント)に 出てくるか しらべる */
const fs=require("fs"),vm=require("vm"),path=require("path");const ctx={window:{}};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,"..","js","data.js"),"utf8"),ctx);
const D=ctx.window.AOTO_DATA;const pl=t=>String(t).replace(/\{([^{}|]+)\|[^{}|]+\}/g,"$1").replace(/[¦«»\s]/g,"");
const C={};D.concepts.forEach(c=>C[c.id]=c);
const only=process.argv[2]?new RegExp(process.argv[2]):null;
let miss=[];
D.problems.forEach(p=>{ if(only&&!only.test(p.skill))return; if(/^\d/.test(pl(p.answer)))return;
  const c=C[D.skillConcept[p.skill]]; const text=pl([c.title,c.meaning,c.examples.join(""),c.steps.join(""),p.hints[0],p.explanation].join(""));
  const a=pl(p.answer).replace(/[。、!?().・]/g,""); const core=a.replace(/(が|は|を|に|で|と|の|です|ます|する|した|なる|いる)$/,"");
  if(text.indexOf(core)<0 && text.indexOf(core.slice(0,Math.max(2,Math.ceil(core.length*0.6))))<0) miss.push(p.skill+" | "+pl(p.question).slice(0,40)+" | ○"+a);
});
console.log(miss.length);console.log(miss.join("\n"));
