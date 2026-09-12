const $=id=>document.getElementById(id);
const EUR=new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0});
const NUM=new Intl.NumberFormat('de-DE',{maximumFractionDigits:2});
const GR={BW:5,BY:3.5,BE:6,BB:6.5,HB:5.5,HH:5.5,HE:6,MV:6,NI:5,NW:6.5,RP:5,SL:6.5,SN:5.5,ST:5,SH:6.5,TH:5};
const SN={BW:'Baden-Württemberg',BY:'Bayern',BE:'Berlin',BB:'Brandenburg',HB:'Bremen',HH:'Hamburg',HE:'Hessen',MV:'Mecklenburg-Vorpommern',NI:'Niedersachsen',NW:'Nordrhein-Westfalen',RP:'Rheinland-Pfalz',SL:'Saarland',SN:'Sachsen',ST:'Sachsen-Anhalt',SH:'Schleswig-Holstein',TH:'Thüringen'};
const CHECKS=['cRent','cWeg','cTech','cLegal','cMarket','cFinance','cEnergy','cEnv'];
const ids=['price','area','rent','otherRent','year','type','occupied','rentType','energyClass','heatingType','heatingYear','address','marketRentM2','marketPriceM2','state','grest','notary','broker','reno','furn','renoTax','nonAlloc','wegReserve','maintM2','cashMaint','admin','vacancy','otherCost','vacOps','taxMaint','ltv','interest','repay','fixed','loanAmount','refiRate','refiRepay','tax','building','afaMode','afa','furnYears','specialAfa','specialAfaYears','lossOffset','horizon','target','rentGrowth','costGrowth','priceGrowth','inflation','sellCost','exitMethod','exitYield','liegenschaft','restLife','landValue','wegReserveBalance','capex1Year','capex1Amount','capex2Year','capex2Amount','capex3Year','capex3Amount','taxFreeSale',...CHECKS];
let step=0, importMeta={sources:[],warnings:[],conflicts:[],confidence:{},fieldSources:{}};
const n=id=>{const e=$(id); if(!e||e.value==='') return NaN; const x=Number(e.value); return Number.isFinite(x)?x:NaN};
const v=id=>$(id)?.value??'';
const eu=x=>Number.isFinite(x)?EUR.format(x):'–';
const pc=x=>Number.isFinite(x)?NUM.format(x)+' %':'–';
const checked=id=>!!$(id)?.checked;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const val=(id,fallback=0)=>Number.isFinite(n(id))?n(id):fallback;

function defaultAfa(force=false){
  if(!$('afa')) return;
  if(!force && $('afa').value!=='') return;
  if(v('afaMode')==='declining'){$('afa').value='5';return;}
  const y=n('year'); if(!Number.isFinite(y)) return;
  $('afa').value=y>2022?'3':y<1925?'2.5':'2';
}
function sync(){
  if(v('state')&&GR[v('state')]!=null)$('grest').value=GR[v('state')];
  defaultAfa(false); save();
}
function save(){
  try{const d={};ids.forEach(id=>{const e=$(id);if(!e)return;d[id]=e.type==='checkbox'?e.checked:e.value});localStorage.setItem('iic_v3',JSON.stringify({values:d,meta:importMeta}))}catch(e){}
}
function load(){
  try{let raw=localStorage.getItem('iic_v3')||localStorage.getItem('iic_v2');if(raw){const obj=JSON.parse(raw),d=obj.values||obj;ids.forEach(id=>{const e=$(id);if(!e||d[id]==null)return;if(e.type==='checkbox')e.checked=!!d[id];else e.value=d[id]});if(obj.meta)importMeta=obj.meta}}catch(e){}
  if(v('state')&&GR[v('state')]!=null)$('grest').value=GR[v('state')];defaultAfa(false);
}
function show(s){
  step=s;document.querySelectorAll('.step').forEach(e=>e.classList.toggle('on',+e.dataset.s===s));$('intro').classList.add('hide');$('aiPanel').classList.add('hide');$('prog').classList.remove('hide');$('res').classList.remove('on');$('stxt').textContent=`Schritt ${s} von 7`;$('spct').textContent=Math.round(s/7*100)+' %';$('bar').style.width=(s/7*100)+'%';window.scrollTo({top:0,behavior:'smooth'});
}
function valid(s){
  const sec=document.querySelector(`[data-s="${s}"]`),missing=[];sec.querySelectorAll('[data-r]').forEach(e=>{if(e.value==='')missing.push(e)});const er=$('e'+s);if(er){if(missing.length){er.textContent='Bitte die fehlenden Pflichtangaben ergänzen.';er.classList.add('on');missing[0].focus();return false}er.classList.remove('on')}return true;
}
function purchase(price=val('price')){
  const pct=(val('grest')+val('notary')+val('broker'))/100,closing=price*pct,reno=val('reno'),furn=val('furn');
  return {closing,all:price+closing+reno+furn,capReno:v('renoTax')==='capitalized'?reno:0,immediateReno:v('renoTax')==='immediate'?reno:0};
}
function annualCashOwnerCosts(vacancy,mult=1){
  const monthly=(val('nonAlloc')+val('wegReserve')+val('admin'))*12;
  const fallbackMaint=v('type')==='etw'?0:val('maintM2')*val('area');
  const privateReserve=Number.isFinite(n('cashMaint'))?n('cashMaint'):fallbackMaint;
  const vacancyOps=val('vacOps')*12*vacancy;
  return (monthly+privateReserve+val('otherCost')+vacancyOps)*mult;
}
function annualNoiCosts(vacancy,mult=1){
  const monthly=(val('nonAlloc')+val('admin'))*12;
  const normalizedMaint=val('maintM2')*val('area');
  const vacancyOps=val('vacOps')*12*vacancy;
  return (monthly+normalizedMaint+val('otherCost')+vacancyOps)*mult;
}
function annualTaxDeductibleOwnerCosts(vacancy,mult=1){
  const base=(val('nonAlloc')+val('admin'))*12+val('otherCost')+val('taxMaint')+val('vacOps')*12*vacancy;
  return base*mult;
}
function capexForYear(y){
  let total=0;for(let i=1;i<=3;i++){const yr=n(`capex${i}Year`),amt=n(`capex${i}Amount`);if(Number.isFinite(yr)&&Number.isFinite(amt)&&Math.round(yr)===y)total+=amt}return total;
}
function loanInfo(ratePct=val('interest'),price=val('price'),loanOverride=NaN){
  const direct=n('loanAmount'),loan=Number.isFinite(loanOverride)?Math.max(0,loanOverride):(Number.isFinite(direct)&&direct>0?direct:price*val('ltv')/100),pay=loan*((ratePct+val('repay'))/100)/12;return {loan,pay};
}
function yearLoan(balance,ratePct,pay){
  let interest=0,principal=0;const i=ratePct/100/12;for(let m=0;m<12&&balance>.01;m++){const im=balance*i,pm=Math.min(balance,Math.max(0,pay-im));interest+=im;principal+=pm;balance-=pm}return {balance:Math.max(0,balance),interest,principal,debtService:interest+principal};
}
function npv(rate,cash){return cash.reduce((s,c,i)=>s+c/Math.pow(1+rate,i),0)}
function irr(cash){
  if(!cash.length||cash[0]>=0)return NaN;let lo=-.9999,hi=10;const f=r=>npv(r,cash);let a=f(lo),b=f(hi);if(!Number.isFinite(a)||!Number.isFinite(b)||a*b>0)return NaN;for(let k=0;k<150;k++){const mid=(lo+hi)/2,x=f(mid);if(Math.abs(x)<.001)return mid;if(a*x<=0){hi=mid;b=x}else{lo=mid;a=x}}return (lo+hi)/2;
}
function cashSignChanges(cash){let prev=0,c=0;for(const x of cash){const s=x>0?1:x<0?-1:0;if(!s)continue;if(prev&&s!==prev)c++;prev=s}return c}
function normalizedMarketNoi(vacancy=null){
  const vac=vacancy==null?clamp(val('vacancy')/100,0,.9):vacancy;
  const base=Number.isFinite(n('marketRentM2'))?n('marketRentM2')*val('area')+val('otherRent'):val('rent')+val('otherRent');
  const eff=base*12*(1-vac),cost=annualNoiCosts(vac,1);return {eff,cost,noi:eff-cost};
}
function comparisonValue(){return Number.isFinite(n('marketPriceM2'))?n('marketPriceM2')*val('area'):NaN}
function simplifiedIncomeValue(){
  const i=n('liegenschaft')/100,life=n('restLife'),land=n('landValue');if(!Number.isFinite(i)||i<0||!Number.isFinite(life)||life<=0||!Number.isFinite(land)||land<0)return NaN;
  const noi=normalizedMarketNoi().noi,landInterest=land*i,buildingIncome=noi-landInterest;const factor=i===0?life:(1-Math.pow(1+i,-life))/i;return buildingIncome*factor+land;
}
function exitValue(year,price,baseRent,rentGrowth,vacancy,costGrowth,priceGrowth){
  const method=v('exitMethod');
  if(method==='yield'&&val('exitYield')>0){
    const nextGross=baseRent*Math.pow(1+rentGrowth,year),nextEff=nextGross*(1-vacancy),nextCosts=annualNoiCosts(vacancy,1)*Math.pow(1+costGrowth,year),nextNoi=nextEff-nextCosts;return Math.max(0,nextNoi/(val('exitYield')/100));
  }
  if(method==='market'&&Number.isFinite(n('marketPriceM2'))){return n('marketPriceM2')*val('area')*Math.pow(1+priceGrowth,year)}
  return price*Math.pow(1+priceGrowth,year);
}
function project(opts={}){
  const price=Number.isFinite(opts.priceOverride)?opts.priceOverride:val('price'),baseRent=(Number.isFinite(opts.totalRentMonthly)?opts.totalRentMonthly:(val('rent')+val('otherRent'))*(opts.rentFactor??1))*12;
  const vacancy=clamp((val('vacancy')+(opts.vacancyAdd||0))/100,0,.9),rentGrowth=(val('rentGrowth')+(opts.rentGrowthDelta||0))/100,costGrowth=val('costGrowth')/100,priceGrowth=Number.isFinite(opts.priceGrowthOverride)?opts.priceGrowthOverride/100:(val('priceGrowth')+(opts.priceGrowthDelta||0))/100;
  const H=val('horizon'),tax=val('tax')/100,buildShare=val('building')/100,afaRate=val('afa')/100,acq=purchase(price),initialRate=val('interest')+(opts.initialRateAdd||0),fixed=Math.max(1,val('fixed',10));
  const baseRefi=Number.isFinite(n('refiRate'))?n('refiRate'):val('interest'),refiRate=baseRefi+(opts.refiRateAdd||0),refiRepay=Number.isFinite(n('refiRepay'))?n('refiRepay'):val('repay');
  const li=loanInfo(initialRate,price,opts.loanOverride);let balance=li.loan,payment=li.pay,refiPayment=null;const equity=acq.all-li.loan,cash=[-equity],rows=[];
  const depBase=(price+acq.closing)*buildShare+acq.capReno;let buildingBook=depBase,furnBook=val('furn'),cumBuildingDep=0;const furnYears=Math.max(1,val('furnYears',10)),specialYears=Math.max(0,val('specialAfaYears',4)),specialAnnual=val('specialAfa');
  for(let y=1;y<=H;y++){
    const gross=baseRent*Math.pow(1+rentGrowth,y-1),eff=gross*(1-vacancy),cashCosts=annualCashOwnerCosts(vacancy,opts.costFactor||1)*Math.pow(1+costGrowth,y-1),noiCosts=annualNoiCosts(vacancy,opts.costFactor||1)*Math.pow(1+costGrowth,y-1),capex=capexForYear(y)*(opts.capexFactor||1);
    let rate=initialRate;if(y>fixed){rate=refiRate;if(refiPayment===null)refiPayment=balance*((refiRate+refiRepay)/100)/12;payment=refiPayment}
    const L=yearLoan(balance,rate,payment);balance=L.balance;
    let normalDep=0;if(buildingBook>0){normalDep=v('afaMode')==='declining'?buildingBook*afaRate:depBase*afaRate;normalDep=Math.min(buildingBook,Math.max(0,normalDep))}
    const specialDep=y<=specialYears?Math.min(Math.max(0,buildingBook-normalDep),specialAnnual):0,buildingDep=normalDep+specialDep;buildingBook=Math.max(0,buildingBook-buildingDep);cumBuildingDep+=buildingDep;
    const furnDep=furnBook>0?Math.min(furnBook,val('furn')/furnYears):0;furnBook=Math.max(0,furnBook-furnDep);
    let deductible=annualTaxDeductibleOwnerCosts(vacancy,opts.costFactor||1)*Math.pow(1+costGrowth,y-1);if(y===1)deductible+=acq.immediateReno;
    const taxable=eff-deductible-L.interest-buildingDep-furnDep;let taxCash=0;if(tax>0){if(taxable>=0)taxCash=taxable*tax;else if(v('lossOffset')==='yes')taxCash=taxable*tax}
    const noi=eff-noiCosts,pre=eff-cashCosts-L.debtService-capex,after=pre-taxCash;rows.push({y,gross,eff,cashCosts,noiCosts,noi,capex,interest:L.interest,principal:L.principal,balance,pre,after,taxable,taxCash,rate,buildingDep,furnDep,deductible});cash.push(after);
  }
  const sale=exitValue(H,price,baseRent,rentGrowth,vacancy,costGrowth,priceGrowth),saleNet=sale*(1-val('sellCost')/100);let saleTax=0,taxableSaleGain=0;
  if(v('taxFreeSale')==='no'&&tax>0){const adjustedRealEstateBasis=(price+acq.closing+acq.capReno)-cumBuildingDep;taxableSaleGain=Math.max(0,saleNet-adjustedRealEstateBasis);saleTax=taxableSaleGain*tax}
  const terminal=saleNet-balance-saleTax;cash[H]+=terminal;const rr=irr(cash),target=val('target')/100,NPV=npv(target,cash),infl=val('inflation')/100,realIrr=Number.isFinite(rr)?(1+rr)/(1+infl)-1:NaN;
  return {cash,rows,irr:rr,npv:NPV,realIrr,equity,sale,saleNet,saleTax,taxableSaleGain,terminal,balance,acq,loan:li.loan,cumBuildingDep,signChanges:cashSignChanges(cash)};
}
function firstYear(opts={}){const pr=project(opts),r=pr.rows[0];if(!r)return {after:NaN,noi:NaN,ds:NaN,dscr:NaN,coc:NaN};const ds=r.interest+r.principal;return {...r,ds,dscr:ds>0?r.noi/ds:Infinity,icr:r.interest>0?r.noi/r.interest:Infinity,debtYield:pr.loan>0?r.noi/pr.loan:Infinity,coc:pr.equity>0?r.after/pr.equity:NaN,eq:pr.equity,loan:pr.loan}}
function stressProject(){return project({rentFactor:.9,vacancyAdd:5,costFactor:1.2,refiRateAdd:2,priceGrowthDelta:-2,capexFactor:1.2})}
function unleveredProject(){return project({loanOverride:0})}
function inputCompleteness(){const core=['price','area','rent','year','type','occupied','state','nonAlloc','vacancy','interest','repay','horizon','target'];const optional=['wegReserve','marketRentM2','marketPriceM2','refiRate','energyClass','heatingType'];let got=core.filter(x=>v(x)!=='').length/core.length*.75+optional.filter(x=>v(x)!=='').length/optional.length*.25;return Math.round(got*100)}
function evidenceQuality(){const due=CHECKS.filter(checked).length/CHECKS.length;const conf=importMeta.confidence||{},vals=Object.values(conf);let cs=vals.length?vals.reduce((s,x)=>s+(x==='high'?1:x==='medium'?.6:x==='low'?.25:0),0)/vals.length:.5;const src=Math.min(1,(importMeta.sources?.length||0)/5);return Math.round((due*.65+cs*.2+src*.15)*100)}
function dataQuality(){return Math.round(inputCompleteness()*.45+evidenceQuality()*.55)}
function financialScore(){
  const b=project(),f=firstYear(),s=stressProject(),target=val('target')/100;let score=50;if(Number.isFinite(b.irr))score+=clamp((b.irr-target)*220,-26,26);score+=f.after>=0?9:-clamp(Math.abs(f.after)/1200*3,3,14);if(f.dscr>=1.25)score+=10;else if(f.dscr<1)score-=14;else score-=3;if(Number.isFinite(s.irr)){if(s.irr>=Math.max(0,target-.03))score+=8;else if(s.irr<0)score-=12;else score-=3}if(b.npv>=0)score+=5;else score-=5;const cv=comparisonValue(),iv=simplifiedIncomeValue(),p=val('price');if(Number.isFinite(cv)&&p>cv*1.1)score-=6;if(Number.isFinite(iv)&&p>iv*1.15)score-=6;if(val('ltv')>90&&!Number.isFinite(n('loanAmount')))score-=5;return Math.round(clamp(score,0,100));
}
function maxPriceForTarget(){if(Number.isFinite(n('loanAmount'))&&n('loanAmount')>0)return NaN;const target=val('target')/100,current=val('price'),fn=p=>project({priceOverride:p}).irr-target;let lo=Math.max(1000,current*.15),hi=current*4,a=fn(lo),b=fn(hi);if(!Number.isFinite(a)||a<0)return NaN;for(let k=0;k<8&&Number.isFinite(b)&&b>0;k++){hi*=1.6;b=fn(hi)}if(!Number.isFinite(b)||b>0)return NaN;for(let k=0;k<80;k++){const mid=(lo+hi)/2,x=fn(mid);if(!Number.isFinite(x))return NaN;if(x>=0)lo=mid;else hi=mid}return(lo+hi)/2}
function breakEvenRent(){const current=Math.max(1,val('rent')+val('otherRent')),cf=monthly=>firstYear({totalRentMonthly:monthly}).after;let lo=0,hi=Math.max(current*4,5000),a=cf(lo),b=cf(hi);if(!Number.isFinite(a)||!Number.isFinite(b)||b<0)return NaN;for(let k=0;k<70;k++){const mid=(lo+hi)/2,x=cf(mid);if(x>=0)hi=mid;else lo=mid}return(lo+hi)/2}
function equityMultiple(cash){let invested=Math.max(0,-cash[0]),dist=0;for(let i=1;i<cash.length;i++){if(cash[i]<0)invested+=-cash[i];else dist+=cash[i]}return invested>0?dist/invested:NaN}
function additionalCashNeeded(cash){let add=0;for(let i=1;i<cash.length;i++)if(cash[i]<0)add+=-cash[i];return add}
function rating(){const b=project(),f=firstYear(),s=stressProject(),target=val('target')/100,strong=Number.isFinite(b.irr)&&b.irr>=target&&b.npv>=0&&f.after>=0&&f.dscr>=1.2&&Number.isFinite(s.irr)&&s.irr>=0,acceptable=Number.isFinite(b.irr)&&b.irr>=target-.02&&f.dscr>=1&&Number.isFinite(s.irr)&&s.irr>-.03;if(strong)return ['Wirtschaftlich attraktiv – Detailprüfung lohnt sich','Rendite, Liquidität und Kapitaldienst sind unter den eingegebenen Annahmen solide; Marktwert und Due Diligence bleiben entscheidend.','good'];if(acceptable)return ['Prüfenswert – Preis oder Annahmen nachschärfen','Das Investment kann funktionieren, besitzt aber nur begrenzten Sicherheitspuffer.','warn'];return ['Unter den Annahmen eher unattraktiv','Rendite, Liquidität oder Risikopuffer reichen derzeit nicht aus.','bad']}
