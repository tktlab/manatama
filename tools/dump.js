const fs=require("fs"),vm=require("vm"),path=require("path");const ctx={window:{}};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,"..","js","data.js"),"utf8"),ctx);
const D=ctx.window.AOTO_DATA;const pl=t=>String(t).replace(/\{([^{}|]+)\|[^{}|]+\}/g,"$1").replace(/[¦]/g,"");
const only=process.argv[2]?new RegExp(process.argv[2]):null;const per=+process.argv[3]||2;const cnt={};
D.problems.forEach(p=>{if(only&&!only.test(p.skill))return;cnt[p.skill]=(cnt[p.skill]||0)+1;if(cnt[p.skill]>per)return;
console.log(p.id+" | "+pl(p.question).replace(/\n/g," ")+" | ○"+pl(p.answer)+" | ×"+p.choices.filter(c=>c!==p.answer).map(pl).join(",")+" | ヒ:"+pl(p.hints[0])+" | 解:"+pl(p.explanation));});
