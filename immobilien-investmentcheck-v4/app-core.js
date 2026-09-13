const $=id=>document.getElementById(id);
const EUR=new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0});
const NUM=new Intl.NumberFormat('de-DE',{maximumFractionDigits:2});
const GR={BW:5,BY:3.5,BE:6,BB:6.5,HB:5.5,HH:5.5,HE:6,MV:6,NI:5,NW:6.5,RP:5,SL:6.5,SN:5.5,ST:5,SH:6.5,TH:5};
const SN={BW:'Baden-Württemberg',BY:'Bayern',BE:'Berlin',BB:'Brandenburg',HB:'Bremen',HH:'Hamburg',HE:'Hessen',MV:'Mecklenburg-Vorpommern',NI:'Niedersachsen',NW:'Nordrhein-Westfalen',RP:'Rheinland-Pfalz',SL:'Saarland',SN:'Sachsen',ST:'Sachsen-Anhalt',SH:'Schleswig-Holstein',TH:'Thüringen'};
const CHECKS=['cRent','cWeg','cTech','cLegal','cMarket','cFinance','cEnergy','cEnv'];
const ids=['price','area','rent','otherRent','year','type','occupied','rentType','rentSchedule','legalRentM2','energyClass','heatingType','heatingYear','address','marketRentM2','marketPriceM2','state','grest','notary','broker','reno','furn','renoTax','nonAlloc','housegeldTotal','wegReserve','maintM2','cashMaint','admin','vacancy','otherCost','vacOps','taxMaint','ltv','interest','repay','fixed','loanAmount','refiRate','refiRepay','financingFees','liquidityReserve','tax','taxMethod','baseZvE','jointTax','includeSoli','building','afaMode','afa','furnYears','specialAfa','specialAfaYears','lossOffset','horizon','target','rentGrowth','costGrowth','priceGrowth','inflation','sellCost','exitMethod','exitYield','liegenschaft','restLife','landValue','wegReserveBalance','capex1Year','capex1Amount','capex2Year','capex2Amount','capex3Year','capex3Amount','taxFreeSale','minDscr','minDebtYield','minCashflowMonthly','minStressIrr','minDataQuality',...CHECKS];
let step=0, importMeta={sources:[],warnings:[],conflicts:[],confidence:{},fieldSources:{},comparables:[],rentComparables:[]};
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
  try{const d={};ids.forEach(id=>{const e=$(id);if(!e)return;d[id]=e.type==='checkbox'?e.checked:e.value});localStorage.setItem('iic_v4',JSON.stringify({values:d,meta:importMeta}))}catch(e){}
}
function load(){
  try{let raw=localStorage.getItem('iic_v4')||localStorage.getItem('iic_v3')||localStorage.getItem('iic_v2');if(raw){const obj=JSON.parse(raw),d=obj.values||obj;ids.forEach(id=>{const e=$(id);if(!e||d[id]==null)return;if(e.type==='checkbox')e.checked=!!d[id];else e.value=d[id]});if(obj.meta)importMeta=obj.meta}}catch(e){}
  if(v('state')&&GR[v('state')]!=null)$('grest').value=GR[v('state')];defaultAfa(false);applyProvenanceBadges();
}
function show(s){
  step=s;document.querySelectorAll('.step').forEach(e=>e.classList.toggle('on',+e.dataset.s===s));$('intro').classList.add('hide');$('aiPanel').classList.add('hide');$('prog').classList.remove('hide');$('res').classList.remove('on');$('stxt').textContent=`Schritt ${s} von 7`;$('spct').textContent=Math.round(s/7*100)+' %';$('bar').style.width=(s/7*100)+'%';window.scrollTo({top:0,behavior:'smooth'});
}
function valid(s){
  const sec=document.querySelector(`[data-s="${s}"]`),missing=[];sec.querySelectorAll('[data-r]').forEach(e=>{if(e.value==='')missing.push(e)});const er=$('e'+s);if(er){if(missing.length){er.textContent='Bitte die fehlenden Pflichtangaben ergänzen.';er.classList.add('on');missing[0].focus();return false}er.classList.remove('on')}return true;
}
function purchase(price=val('price'),opts={}){
  const pct=(val('grest')+val('notary')+val('broker'))/100,closing=price*pct,reno=val('reno'),furn=val('furn'),financingFees=opts.unlevered?0:val('financingFees'),liquidityReserve=opts.unlevered?0:val('liquidityReserve');
  return {closing,financingFees,liquidityReserve,all:price+closing+reno+furn+financingFees+liquidityReserve,capitalizedCost:price+closing+reno+furn+financingFees,capReno:v('renoTax')==='capitalized'?reno:0,immediateReno:v('renoTax')==='immediate'?reno:0};
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
function parseRentSchedule(){
  const text=v('rentSchedule').trim(),out={};if(!text)return out;
  text.split(/[\n;,]+/).forEach(part=>{const m=part.trim().match(/^(\d+)\s*[:=]\s*([\d.,]+)$/);if(!m)return;const y=Number(m[1]),amt=Number(m[2].replace(',','.'));if(y>=1&&Number.isFinite(amt)&&amt>=0)out[y]=amt});return out;
}
function residentialRentForYear(y,opts={}){
  if(Number.isFinite(opts.totalRentMonthly))return opts.totalRentMonthly;
  const schedule=parseRentSchedule(),keys=Object.keys(schedule).map(Number).sort((a,b)=>a-b);let start=val('rent');
  if(v('occupied')!=='yes'&&Number.isFinite(n('legalRentM2')))start=Math.min(start,n('legalRentM2')*val('area'));
  let base=start;
  if(keys.length){for(const k of keys){if(k<=y)base=schedule[k];else break};if(y===1&&v('occupied')!=='yes'&&Number.isFinite(n('legalRentM2')))base=Math.min(base,n('legalRentM2')*val('area'))}
  else if(v('rentType')==='step'){base=start}
  else base=start*Math.pow(1+(val('rentGrowth')+(opts.rentGrowthDelta||0))/100,y-1);
  return base;
}
function grossRentForYear(y,opts={}){
  if(Number.isFinite(opts.totalRentMonthly))return opts.totalRentMonthly*12;
  const growth=(val('rentGrowth')+(opts.rentGrowthDelta||0))/100,res=residentialRentForYear(y,opts),other=val('otherRent')*Math.pow(1+growth,y-1);return (res+other)*12*(opts.rentFactor??1);
}
function incomeTaxSingle2026(zve){const x=Math.max(0,Math.floor(zve));let t=0;if(x<=12348)t=0;else if(x<=17799){const y=(x-12348)/10000;t=(914.51*y+1400)*y}else if(x<=69878){const z=(x-17799)/10000;t=(173.10*z+2397)*z+1034.87}else if(x<=277825)t=.42*x-11135.63;else t=.45*x-19470.38;return Math.max(0,Math.floor(t))}
function incomeTax2026(zve,joint=false){return joint?2*incomeTaxSingle2026(Math.max(0,zve)/2):incomeTaxSingle2026(zve)}
function soli2026(est,joint=false){const free=joint?40700:20350;if(est<=free)return 0;return Math.max(0,Math.min(est*.055,(est-free)*.119))}
function totalTax2026(zve){const joint=v('jointTax')==='yes',est=incomeTax2026(zve,joint),soli=v('includeSoli')==='yes'?soli2026(est,joint):0;return est+soli}
function rentalTaxCash(taxable,extraBase=0){if(v('taxMethod')==='none')return 0;if(taxable<0&&v('lossOffset')!=='yes')return 0;if(v('taxMethod')==='exact2026'&&Number.isFinite(n('baseZvE'))){const base=Math.max(0,n('baseZvE')+extraBase),after=Math.max(0,base+taxable);return totalTax2026(after)-totalTax2026(base)}const rate=val('tax')/100;return taxable*rate}
function median(a){if(!a.length)return NaN;const x=[...a].sort((a,b)=>a-b),m=Math.floor(x.length/2);return x.length%2?x[m]:(x[m-1]+x[m])/2}
function comparisonStats(){const vals=(importMeta.comparables||[]).map(x=>Number(x.pricePerM2??x.value??x)).filter(Number.isFinite);if(vals.length>=3){const sorted=[...vals].sort((a,b)=>a-b);return {value:median(vals),n:vals.length,min:sorted[0],max:sorted[sorted.length-1]}}if(Number.isFinite(n('marketPriceM2')))return {value:n('marketPriceM2'),n:1,min:n('marketPriceM2'),max:n('marketPriceM2')};return {value:NaN,n:0,min:NaN,max:NaN}}
function normalizedMarketNoi(vacancy=null){
  const vac=vacancy==null?clamp(val('vacancy')/100,0,.9):vacancy;
  let marketRes=Number.isFinite(n('marketRentM2'))?n('marketRentM2')*val('area'):val('rent');if(v('occupied')!=='yes'&&Number.isFinite(n('legalRentM2')))marketRes=Math.min(marketRes,n('legalRentM2')*val('area'));const base=marketRes+val('otherRent');
  const eff=base*12*(1-vac),cost=annualNoiCosts(vac,1);return {eff,cost,noi:eff-cost};
}
function comparisonValue(){const cs=comparisonStats();return Number.isFinite(cs.value)?cs.value*val('area'):NaN}
function simplifiedIncomeValue(){
  const i=n('liegenschaft')/100,life=n('restLife'),land=n('landValue');if(!Number.isFinite(i)||i<0||!Number.isFinite(life)||life<=0||!Number.isFinite(land)||land<0)return NaN;
  const noi=normalizedMarketNoi().noi,landInterest=land*i,buildingIncome=noi-landInterest;const factor=i===0?life:(1-Math.pow(1+i,-life))/i;return buildingIncome*factor+land;
}
function exitValue(year,price,vacancy,costGrowth,priceGrowth,opts={}){
  const method=v('exitMethod');
  if(method==='yield'&&val('exitYield')>0){const nextGross=grossRentForYear(year+1,opts),nextEff=nextGross*(1-vacancy),nextCosts=annualNoiCosts(vacancy,1)*Math.pow(1+costGrowth,year),nextNoi=nextEff-nextCosts;return Math.max(0,nextNoi/(val('exitYield')/100))}
  if(method==='market'){const cs=comparisonStats();if(Number.isFinite(cs.value))return cs.value*val('area')*Math.pow(1+priceGrowth,year)}
  return price*Math.pow(1+priceGrowth,year);
}