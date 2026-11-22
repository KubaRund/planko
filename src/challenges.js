export const CHALLENGES = [
  {id:'training',icon:'01',title:'První kroky',description:'Polož tři destičky naplocho na sebe. Vyzkoušej tlačítko POLOŽIT.',limit:8,min:3,height:2.1,hold:2,level:'VÝUKA',tools:['flat'],connected:true},
  {id:'cross',icon:'02',title:'Křížem přes sebe',description:'Postav čtyři propojené destičky s výškou 2,8 cm.',limit:8,min:4,height:2.8,hold:2,level:'LEHKÁ',tools:['flat'],connected:true},
  {id:'first',icon:'Ⅰ',title:'První konstrukce',description:'Nejméně 4 destičky a výška 5 cm.',limit:10,min:4,height:5,hold:2,level:'LEHKÁ'},
  {id:'tower',icon:'Ⅱ',title:'Věž 20',description:'Dosáhni 20 cm. Stavba musí stát bez pomoci.',limit:20,min:5,height:20,hold:3,level:'LEHKÁ'},
  {id:'bridge',icon:'Ⅲ',title:'Most přes propast',description:'Překleneš mezeru 9,2 cm dvěma souběžnými destičkami?',limit:12,min:2,bridge:2,hold:3,level:'STŘEDNÍ',scenario:'bridge'},
  {id:'layer',icon:'Ⅳ',title:'Poctivé vrstvy',description:'Věž 15 cm bez destiček nastojato.',limit:30,min:7,height:15,hold:3,level:'STŘEDNÍ',tools:['flat','edge']},
  {id:'efficient',icon:'Ⅴ',title:'Méně je více',description:'Postav stabilních 25 cm z nejvýše 12 destiček.',limit:12,min:5,height:25,hold:4,level:'STŘEDNÍ'},
  {id:'wide',icon:'Ⅵ',title:'Architektura',description:'Postav propojený objekt 25 cm široký a 8 cm vysoký.',limit:35,min:8,height:8,span:25,hold:3,level:'STŘEDNÍ',connected:true},
  {id:'quake',icon:'Ⅶ',title:'Zátěžová zkouška',description:'Věž 15 cm z alespoň 8 destiček musí vydržet test stability.',limit:30,min:8,height:15,hold:4,shake:true,level:'TĚŽKÁ'},
  {id:'narrow',icon:'Ⅷ',title:'Úzká základna',description:'Výška 22 cm, nejvýše dvě destičky na podlaze.',limit:25,min:8,height:22,foundation:2,hold:4,level:'TĚŽKÁ'},
  {id:'giant',icon:'Ⅸ',title:'Obří věž',description:'Dosáhni 45 cm s minimálně dvanácti destičkami.',limit:60,min:12,height:45,hold:5,level:'TĚŽKÁ'},
  {id:'master',icon:'Ⅹ',title:'Mistr stavebník',description:'Konstrukce vysoká 25 cm a široká 30 cm, nejméně 18 destiček.',limit:70,min:18,height:25,span:30,hold:5,level:'EXPERT',connected:true},
  {id:'wall',icon:'11',title:'Dřevěná zeď',description:'Propojená konstrukce široká 20 cm, vysoká 5 cm. Bez stavění nastojato.',limit:30,min:10,height:5,span:20,hold:3,level:'STŘEDNÍ',tools:['flat','edge'],connected:true},
  {id:'platform',icon:'12',title:'Pevná platforma',description:'Čtyři propojené destičky u podlahy a výška 3 cm.',limit:24,min:10,height:3,minFoundation:4,hold:3,level:'STŘEDNÍ',connected:true},
  {id:'bridgeplus',icon:'13',title:'Most pro náklad',description:'Čtyři souběžné nosníky přes mezeru, nejméně šest destiček celkem.',limit:22,min:6,bridge:4,hold:4,level:'TĚŽKÁ',scenario:'bridge'},
  {id:'minimal',icon:'14',title:'Mikrověž',description:'Dosáhni 12 cm pouze se šesti destičkami nebo méně.',limit:6,min:3,height:12,hold:4,level:'TĚŽKÁ',connected:true},
  {id:'quakeplus',icon:'15',title:'Odolná pevnost',description:'Propojená stavba vysoká 12 cm, široká 15 cm a odolná vůči otřesu.',limit:40,min:12,height:12,span:15,hold:5,shake:true,level:'EXPERT',connected:true},
  {id:'skyscraper',icon:'16',title:'Mrakodrap',description:'Postav propojenou věž vysokou 60 cm, která stojí 6 sekund.',limit:100,min:20,height:60,hold:6,level:'EXPERT',connected:true}
];
export const challengeById = id => CHALLENGES.find(c=>c.id===id)||null;
export const nextChallenge = id => CHALLENGES[CHALLENGES.findIndex(c=>c.id===id)+1]||null;
export const recommendedChallenge = achievements => CHALLENGES.find(c=>!achievements[c.id])||null;
export const campaignStats = achievements => ({completed:CHALLENGES.filter(c=>achievements[c.id]).length,stars:CHALLENGES.reduce((sum,c)=>sum+Math.max(0,Math.min(3,Number(achievements[c.id]?.stars)||0)),0),maxStars:CHALLENGES.length*3});
export function rating(c,count){return count<=c.min+1?3:count<=c.limit*.75?2:1}
const pct=(x,t)=>Math.max(0,Math.min(1,x/t));
export function evaluate(c,m,{shakePassed=false}={}) {
  if(!c)return {qualified:false,progress:0,detail:''};
  if(c.connected&&m.connected)m={...m,...m.connected,count:m.count};
  const rules=[{ok:m.count>=c.min,progress:pct(m.count,c.min),label:`${m.count}/${c.min} dest.`}];
  if(c.connected)rules.push({ok:(m.componentCount??m.count)>=c.min,progress:pct(m.componentCount??m.count,c.min),label:`${m.componentCount??m.count}/${c.min} spojených`});
  if(c.minFoundation)rules.push({ok:m.foundation>=c.minFoundation,progress:pct(m.foundation,c.minFoundation),label:`${m.foundation}/${c.minFoundation} základna`});
  if(c.height)rules.push({ok:m.height>=c.height-.05,progress:pct(m.height,c.height),label:`${m.height.toFixed(1)}/${c.height} cm výšky`});
  if(c.span)rules.push({ok:m.span>=c.span-.05,progress:pct(m.span,c.span),label:`${m.span.toFixed(1)}/${c.span} cm šířky`});
  if(c.bridge)rules.push({ok:m.bridge>=c.bridge,progress:pct(m.bridge,c.bridge),label:`${m.bridge}/${c.bridge} nosníků`});
  if(c.foundation)rules.push({ok:m.foundation<=c.foundation,progress:m.foundation<=c.foundation?1:0,label:`${m.foundation}/${c.foundation} na podlaze`});
  if(c.shake)rules.push({ok:shakePassed,progress:shakePassed?1:0,label:shakePassed?'otřes ✓':'čeká na otřes'});
  return {qualified:rules.every(r=>r.ok)&&m.count<=c.limit,progress:rules.reduce((s,r)=>s+r.progress,0)/rules.length,detail:rules.map(r=>r.label).join(' · ')};
}
