function escapeHtml(x){return String(x).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

function applyProvenanceBadges(){document.querySelectorAll('.provBadge').forEach(x=>x.remove());const conf=importMeta.confidence||{},src=importMeta.fieldSources||{};for(const [id,c] of Object.entries(conf)){const e=$(id);if(!e||!['high','medium','low'].includes(c))continue;const label=e.closest('div')?.querySelector('label');if(!label)continue;const b=document.createElement('span');b.className=`provBadge prov-${c}`;b.textContent=c.toUpperCase();const sv=src[id];if(sv)b.title=typeof sv==='string'?sv:JSON.stringify(sv);label.appendChild(b)}}
function exportData(){
  const values={};ids.forEach(id=>{const e=$(id);if(!e)return;values[id]=e.type==='checkbox'?e.checked:(e.value===''?null:(e.type==='number'?Number(e.value):e.value))});
  return {schema:'immobilien-investmentcheck-v4',generatedAt:new Date().toISOString(),values,meta:importMeta};
}
function downloadJson(){const blob=new Blob([JSON.stringify(exportData(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='immobilien-investmentcheck-v4.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function extractJson(text){text=text.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');try{return JSON.parse(text)}catch(e){}const a=text.indexOf('{'),b=text.lastIndexOf('}');if(a>=0&&b>a)return JSON.parse(text.slice(a,b+1));throw new Error('Kein gültiges JSON gefunden.')}
function importData(obj){
  if(!obj||typeof obj!=='object')throw new Error('Ungültiges Datenformat.');if(obj.schema&&obj.schema!=='immobilien-investmentcheck-v4'&&obj.schema!=='immobilien-investmentcheck-v3'&&obj.schema!=='immobilien-investmentcheck-v2')throw new Error('Nicht unterstütztes Schema: '+obj.schema);const values=obj.values||obj.data||obj;let count=0;
  ids.forEach(id=>{if(!(id in values)||values[id]===null||values[id]===undefined||values[id]==='')return;const e=$(id);if(!e)return;if(e.type==='checkbox')e.checked=!!values[id];else e.value=values[id];count++});
  if(obj.meta&&typeof obj.meta==='object')importMeta={sources:obj.meta.sources||[],warnings:obj.meta.warnings||[],conflicts:obj.meta.conflicts||[],confidence:obj.meta.confidence||{},fieldSources:obj.meta.fieldSources||{},comparables:obj.meta.comparables||[],rentComparables:obj.meta.rentComparables||[]};
  if(v('state')&&GR[v('state')]!=null)$('grest').value=GR[v('state')];if(v('afaMode')==='linear'&&!v('afa'))defaultAfa(true);save();
  const src=importMeta.sources?.length||0,w=importMeta.warnings?.length||0,c=importMeta.conflicts?.length||0;$('importStatus').className='importStatus ok';applyProvenanceBadges();$('importStatus').textContent=`${count} Felder importiert · ${src} Quellen · ${w} Hinweise · ${c} Konflikte. Bitte kritische Werte kurz plausibilisieren.`;return count;
}
function importPrompt(){return `Du bist ein unabhängiger Immobilien-Investmentanalyst für Deutschland. Analysiere genau EINE potenzielle vermietete Wohnimmobilie anhand aller Unterlagen, Bilder, E-Mails und verknüpften Quellen, die ich dir in diesem Chat ausdrücklich bereitstelle oder benenne.

ZIEL: Erzeuge einen belastbaren Importdatensatz für den "Immobilien-Investmentcheck v4". Der Datensatz soll Fakten, Schätzungen und Unsicherheiten strikt trennen. Erfinde nichts.

PRIORITÄT DER QUELLEN:
1. Notar-/Kaufvertragsunterlagen, Grundbuch, Teilungserklärung, Mietvertrag, Wirtschaftsplan/Jahresabrechnung, Vermögensbericht, Beschlüsse/WEG-Protokolle, Energieausweis, Finanzierungsangebot.
2. Offizielle aktuelle Quellen: Gutachterausschuss/Kaufpreissammlung bzw. Marktbericht, offizieller Mietspiegel, Bodenrichtwert, kommunale Wärmeplanung, Hochwasser-/Starkregen-/Altlasten-/Radonkarten, amtliche Statistik.
3. Mehrere seriöse Marktquellen ergänzend. Einzelne Immobilienanzeigen nie als alleinige Marktwertquelle behandeln.

AUFGABEN:
- Extrahiere Kaufpreis, Fläche, echte Kaltmiete, Stellplatz-/Nebeneinnahmen, Baujahr, Mietvertragsart, Kaufnebenkosten, Hausgeldaufteilung, WEG-Rücklage, Verwaltung, bekannte Reparaturen/Sonderumlagen, Finanzierung und steuerlich relevante Daten.
- Prüfe die Mietvertragsart: normal / Index / Staffel. Extrahiere bei Staffelmiete nach Möglichkeit einen exakten jährlichen Mietpfad in rentSchedule (Format z. B. "1=850\n2=850\n3=900"). Ermittle bei Neuvermietung, wenn belastbar, zusätzlich legalRentM2 als rechtlich/vertraglich plausibles Mietlimit. Bei Neuvermietung aktuelle Mietpreisbremse/Ausnahmen nur dann bewerten, wenn Lage und Fakten reichen.
- Ermittle – wenn die genaue Lage verfügbar ist – eine belastbare Vergleichs-Marktmiete und Vergleichs-Kaufpreis €/m². Bevorzuge Mietspiegel/Gutachterausschuss. Dokumentiere Datenstichtag und Quelle. Wenn mindestens drei hinreichend vergleichbare Transaktionen/Marktfälle verfügbar sind, gib sie zusätzlich in meta.comparables mit pricePerM2, source, date und kurzer Vergleichbarkeitsbegründung aus; keine einzelnen Angebotsanzeigen als alleinigen Marktwertbeleg.
- Suche, wenn möglich, Liegenschaftszinssatz, Bodenwert/Bodenrichtwert und plausible Restnutzungsdauer für eine Ertragswert-Plausibilisierung. Nur ausgeben, wenn Quelle und Zuordnung ausreichend belastbar sind.
- Prüfe WEG: Rücklagenstand, geplante Maßnahmen, Sonderumlagen, Beschlüsse, Rechtsstreitigkeiten, Hausgeldrückstände, Verwalter-/Versicherungsprobleme.
- Prüfe Technik anhand Unterlagen und Fotos vorsichtig: Heizung, Dach, Fassade, Fenster, Leitungen, Feuchte/Schäden. Fotos allein bestätigen niemals einen mangelfreien Zustand.
- Prüfe Energie/Wärme: Energieklasse, Heizungsart/-alter, kommunale Wärmeplanung und erkennbare zukünftige Capex-Risiken nach aktuellem Recht. Keine pauschalen Sanierungskosten erfinden.
- Prüfe Standort-/Umweltrisiken, soweit offizielle Quellen verfügbar sind: Hochwasser/Starkregen, Altlasten, Radon, erheblicher Lärm/Immissionen.
- Prüfe Finanzierung gegen das konkrete Angebot und extrahiere, wenn vorhanden, einmalige Finanzierungs-/Bereitstellungskosten sowie eine tatsächlich vorgesehene Liquiditätsreserve. Wenn kein Angebot existiert, lasse Zinssatz/Darlehensbetrag lieber null statt einen aktuellen Marktzins zu erfinden. Du darfst aktuelle Bundesbankdaten als Benchmark in meta.warnings nennen.
- Erfasse bekannte zukünftige Einmalzahlungen/Sonderumlagen als bis zu drei Capex-Ereignisse mit Jahr ab Erwerb und Betrag.
- Wachstumsannahmen (Miete, Wert, Kosten) nur übernehmen, wenn ich sie vorgebe. Sonst null.

REGELN:
1. Unbekannt = null. Keine stillen Defaults.
2. Jede wesentliche Zahl muss eine Quelle oder eine klare Kennzeichnung als "user_assumption" erhalten.
3. Bei Konflikten: nicht heimlich entscheiden. Nutze die autoritativste/neueste Quelle und liste den Konflikt in meta.conflicts.
4. confidence je befülltem Feld: high / medium / low.
5. Due-Diligence-Checkboxen nur true, wenn der jeweilige Bereich wirklich belastbar geprüft wurde.
6. cTech niemals allein wegen Fotos true setzen.
7. cMarket nur true, wenn mehrere geeignete Vergleichsdaten oder eine amtliche Quelle vorliegen.
8. cEnergy nur true, wenn Energieausweis/Heizung plus aktuelle Wärmerechts-/Wärmeplanungsrisiken ausreichend geprüft wurden.
9. cEnv nur true, wenn standortabhängige Risiken anhand geeigneter Karten/Quellen geprüft wurden.
10. Gib ausschließlich valides JSON aus, ohne Markdown-Codeblock und ohne Text davor/danach.

ENUMS:
type: etw | mfh | efh
occupied: yes | new | vacant
rentType: standard | index | step
heatingType: gas | oil | district | heatpump | electric | other
state: BW BY BE BB HB HH HE MV NI NW RP SL SN ST SH TH
renoTax: capitalized | immediate | ignore
afaMode: linear | declining
lossOffset: yes | no
exitMethod: growth | yield | market
taxFreeSale: yes | no
energyClass: A+ | A | B | C | D | E | F | G | H

EINHEITEN:
EUR: price, reno, furn, loanAmount, specialAfa, otherCost, taxMaint, cashMaint, landValue, wegReserveBalance, capex1Amount, capex2Amount, capex3Amount
EUR/Monat: rent, otherRent, nonAlloc, wegReserve, admin, vacOps
EUR/m²/Monat kalt: marketRentM2
EUR/m²: marketPriceM2
EUR/m²/Jahr: maintM2
Prozent: notary, broker, vacancy, ltv, interest, repay, refiRate, refiRepay, tax, building, afa, target, rentGrowth, costGrowth, priceGrowth, inflation, sellCost, exitYield, liegenschaft
Jahre/Zahlen: year, heatingYear, fixed, furnYears, specialAfaYears, horizon, restLife, capex1Year, capex2Year, capex3Year

JSON-SCHEMA:
{
 "schema":"immobilien-investmentcheck-v4",
 "values":{
  "price":null,"area":null,"rent":null,"otherRent":null,"year":null,"type":null,"occupied":null,"rentType":null,"rentSchedule":null,"legalRentM2":null,"energyClass":null,"heatingType":null,"heatingYear":null,"address":null,"marketRentM2":null,"marketPriceM2":null,"state":null,
  "notary":null,"broker":null,"reno":null,"furn":null,"renoTax":null,
  "nonAlloc":null,"housegeldTotal":null,"wegReserve":null,"maintM2":null,"cashMaint":null,"admin":null,"vacancy":null,"otherCost":null,"vacOps":null,"taxMaint":null,
  "ltv":null,"interest":null,"repay":null,"fixed":null,"loanAmount":null,"refiRate":null,"refiRepay":null,"financingFees":null,"liquidityReserve":null,
  "tax":null,"taxMethod":null,"baseZvE":null,"jointTax":null,"includeSoli":null,"building":null,"afaMode":null,"afa":null,"furnYears":null,"specialAfa":null,"specialAfaYears":null,"lossOffset":null,
  "horizon":null,"target":null,"rentGrowth":null,"costGrowth":null,"priceGrowth":null,"inflation":null,"sellCost":null,"exitMethod":null,"exitYield":null,"taxFreeSale":null,"minDscr":null,"minDebtYield":null,"minCashflowMonthly":null,"minStressIrr":null,"minDataQuality":null,
  "liegenschaft":null,"restLife":null,"landValue":null,"wegReserveBalance":null,
  "capex1Year":null,"capex1Amount":null,"capex2Year":null,"capex2Amount":null,"capex3Year":null,"capex3Amount":null,
  "cRent":false,"cWeg":false,"cTech":false,"cLegal":false,"cMarket":false,"cFinance":false,"cEnergy":false,"cEnv":false
 },
 "meta":{
  "sources":[{"name":"","type":"","date":"","details":"","url":""}],
  "warnings":[],"conflicts":[],"confidence":{},"fieldSources":{},"comparables":[],"rentComparables":[]
 }
}`}
function auditPrompt(){return `Prüfe dieses Immobilieninvestment als unabhängiger Senior-Reviewer für deutsche Wohnimmobilien. Nutze aktuelle Primärquellen und suche aktiv nach Gründen, warum die Rechnung zu optimistisch oder unvollständig sein könnte.

PRÜFE MINDESTENS:
1. Marktwert: geeignete Vergleichspreise/Gutachterausschuss, nicht nur Angebotsportale; falls Daten reichen zusätzlich ertragsorientierte Plausibilisierung nach ImmoWertV.
2. Miete: tatsächliche Vertragsmiete, Mietvertragsart, Mietspiegel, Mietpreisbremse, Kappungsgrenzen, realistische Steigerungspfade.
3. WEG: Wirtschaftsplan, Jahresabrechnung, Vermögensbericht, Rücklagenstand, letzte Protokolle/Beschlüsse, Sonderumlagen, Rechtsstreitigkeiten, Sanierungsstau.
4. Technik/Energie: Heizung, Dach, Fassade, Fenster, Leitungen, Feuchte, Energieausweis, kommunale Wärmeplanung, aktuelle Heizungs-/Energieanforderungen und wahrscheinliche Capex-Risiken.
5. Standort/Umwelt: Hochwasser/Starkregen, Altlasten, Radon, Lärm, Mikrolage, Vermietbarkeit.
6. Finanzierung: konkretes Angebot vs. aktuelle Bundesbank-Benchmarks; Anschlussfinanzierung, Kapitaldienst, Beleihung und Liquiditätsreserve.
7. Steuer: Gebäude-/Bodenanteil, AfA, § 6 Abs. 1 Nr. 1a, § 7/7b EStG, Werbungskosten, WEG-Rücklage, § 23 EStG. Keine Steuerannahme bestätigen, wenn Fakten fehlen.
8. Rendite: rechne IRR, NPV bei Zielrendite, Cash-on-Cash, DSCR, Debt Yield und Stressfälle gegen. Prüfe die Investment-Gates einzeln und widersprich dem Score, wenn Gate-Logik oder Datenqualität eine andere Schlussfolgerung erfordern. Prüfe, ob IRR wegen mehrfacher Vorzeichenwechsel mehrdeutig sein kann.
9. Exit: prüfe, ob Wertsteigerungsannahme oder Exit-Rendite plausibel ist. Nenne Rendite ohne Wertsteigerung.
10. Kaufentscheidung: nenne maximal vertretbaren Kaufpreis, Break-even-Miete, größte drei Risiken und welche Unterlagen vor Notartermin zwingend noch fehlen.

Unterscheide: BELEGT / PLAUSIBLE ANNAHME / NICHT BELEGT. Korrigiere erkennbare Fehler. Gib am Ende zusätzlich ein vollständiges, valides JSON im Schema immobilien-investmentcheck-v4 aus, das wieder in die Website importiert werden kann.

AKTUELLER DATENSATZ:
${JSON.stringify(exportData(),null,2)}`}
async function copyText(txt,msg='Kopiert.'){try{await navigator.clipboard.writeText(txt);alert(msg)}catch(e){prompt('Bitte kopieren:',txt)}}
function resultText(){return $('res').innerText.replace(/\n{3,}/g,'\n\n').trim()}

$('start').onclick=()=>show(1);
$('openAi').onclick=()=>{$('aiPanel').classList.remove('hide');$('aiPanel').scrollIntoView({behavior:'smooth'})};
$('closeAi').onclick=()=>$('aiPanel').classList.add('hide');
$('copyImportPrompt').onclick=()=>copyText(importPrompt(),'Import-Prompt kopiert. Jetzt in ChatGPT einfügen und Unterlagen bereitstellen.');
$('doImport').onclick=()=>{try{const c=importData(extractJson($('importBox').value));if(c>0)show(1)}catch(e){$('importStatus').className='importStatus bad';$('importStatus').textContent=e.message}};
$('jsonFile').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{importData(JSON.parse(await f.text()));show(1)}catch(err){$('importStatus').className='importStatus bad';$('importStatus').textContent=err.message}};
document.querySelectorAll('.next').forEach(b=>b.onclick=()=>{if(valid(step))show(step+1)});document.querySelectorAll('.prev').forEach(b=>b.onclick=()=>show(step-1));
$('calc').onclick=calc;$('state').onchange=sync;$('year').oninput=()=>{if(v('afaMode')==='linear'){$('afa').value='';defaultAfa(true)}save()};$('afaMode').onchange=()=>{$('afa').value='';defaultAfa(true);save()};
document.querySelectorAll('input,select,textarea').forEach(e=>{e.addEventListener('input',save);e.addEventListener('change',save)});
$('pdf').onclick=()=>print();$('copy').onclick=()=>copyText(resultText(),'Auswertung kopiert.');$('share').onclick=async()=>{try{if(navigator.share)await navigator.share({title:'Immobilien-Investmentcheck',text:resultText()});else await copyText(resultText())}catch(e){}};$('exportJson').onclick=downloadJson;$('auditPrompt').onclick=()=>copyText(auditPrompt(),'Deep-Check-Prompt mit aktuellem Datensatz kopiert.');$('edit').onclick=()=>{$('res').classList.remove('on');show(1)};$('resetAll').onclick=()=>{if(!confirm('Alle lokal gespeicherten Angaben für dieses Objekt löschen?'))return;['iic_v4','iic_v3','iic_v2','iic'].forEach(k=>localStorage.removeItem(k));location.reload()};load();