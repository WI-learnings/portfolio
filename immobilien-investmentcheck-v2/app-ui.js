function ensureV3UI(){
  const add=(step,html)=>{const g=document.querySelector(`.step[data-s="${step}"] .g`);if(g)g.insertAdjacentHTML('beforeend',html)};
  if(!$('rentType'))add(1,`<div><label>Mietvertragsart</label><select id="rentType"><option value="standard">Normale Miete</option><option value="index">Indexmiete</option><option value="step">Staffelmiete</option></select></div><div><label>Energieklasse <span class="help">optional</span></label><select id="energyClass"><option value="">Unbekannt</option><option>A+</option><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option><option>F</option><option>G</option><option>H</option></select></div><div><label>Heizung <span class="help">optional</span></label><select id="heatingType"><option value="">Unbekannt</option><option value="gas">Gas</option><option value="oil">Öl</option><option value="district">Fern-/Nahwärme</option><option value="heatpump">Wärmepumpe</option><option value="electric">Elektrisch</option><option value="other">Sonstige</option></select></div><div><label>Baujahr Heizung</label><input id="heatingYear" type="number" min="1900" max="2035"></div>`);
  if(!$('cashMaint'))add(3,`<div><label>Zusätzliche private Cash-Reserve p.a.</label><div class="e"><input id="cashMaint" type="number" min="0" placeholder="optional"></div></div>`);
  if(!$('refiRepay'))add(4,`<div><label>Anschluss-Tilgung p.a.</label><div class="pct"><input id="refiRepay" type="number" min="0" max="20" step="0.1" placeholder="leer = wie bisher"></div></div>`);
  if(!$('inflation'))add(6,`<div><label>Inflation p.a.</label><div class="pct"><input id="inflation" type="number" value="2" step="0.25"></div></div><div><label>Exit-Methode</label><select id="exitMethod"><option value="growth">Wertsteigerung</option><option value="yield">Exit-Rendite</option><option value="market">Vergleich €/m²</option></select></div><div><label>Exit-Rendite</label><div class="pct"><input id="exitYield" type="number" value="4" step="0.1"></div></div><div class="full"><details><summary>Professionelle Wert-Plausibilisierung</summary><div class="adv g"><div><label>Liegenschaftszins</label><div class="pct"><input id="liegenschaft" type="number" step="0.1"></div></div><div><label>Restnutzungsdauer</label><input id="restLife" type="number"></div><div><label>Bodenwert</label><div class="e"><input id="landValue" type="number"></div></div><div><label>WEG-Rücklage Anteil Einheit</label><div class="e"><input id="wegReserveBalance" type="number"></div></div></div></details></div><div class="full"><details><summary>Bekannte künftige Capex/Sonderumlagen</summary><div class="adv g"><div><label>Jahr 1</label><input id="capex1Year" type="number"></div><div><label>Betrag 1</label><div class="e"><input id="capex1Amount" type="number"></div></div><div><label>Jahr 2</label><input id="capex2Year" type="number"></div><div><label>Betrag 2</label><div class="e"><input id="capex2Amount" type="number"></div></div><div><label>Jahr 3</label><input id="capex3Year" type="number"></div><div><label>Betrag 3</label><div class="e"><input id="capex3Amount" type="number"></div></div></div></details></div>`);
  const s7=document.querySelector('.step[data-s="7"] .card');
  if(s7&&!$('cEnergy')){const nav=s7.querySelector('.nav');nav?.insertAdjacentHTML('beforebegin',`<label class="check"><input type="checkbox" id="cEnergy"><div><b>Energie & Wärmeversorgung geprüft</b></div></label><label class="check"><input type="checkbox" id="cEnv"><div><b>Umwelt-/Standortrisiken geprüft</b></div></label>`)}
  const rep=$('report');
  if(rep&&!$('sensitivity'))rep.insertAdjacentHTML('beforebegin','<h3 class="sectiontitle">Sensitivitätsmatrix</h3><div id="sensitivity"></div><h3 class="sectiontitle">Marktwert-Plausibilisierung</h3><div id="valuation"></div>');
  if(!localStorage.getItem('iic_v3')&&$('building')?.value==='80')$('building').value='';
}
function exportData(){
  const values={};ids.forEach(id=>{const e=$(id);if(!e)return;values[id]=e.type==='checkbox'?e.checked:(e.value===''?null:(e.type==='number'?Number(e.value):e.value))});
  return {schema:'immobilien-investmentcheck-v3',generatedAt:new Date().toISOString(),values,meta:importMeta};
}
function downloadJson(){const blob=new Blob([JSON.stringify(exportData(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='immobilien-investmentcheck-v3.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function extractJson(text){text=text.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');try{return JSON.parse(text)}catch(e){}const a=text.indexOf('{'),b=text.lastIndexOf('}');if(a>=0&&b>a)return JSON.parse(text.slice(a,b+1));throw new Error('Kein gültiges JSON gefunden.')}
function importData(obj){
  if(!obj||typeof obj!=='object')throw new Error('Ungültiges Datenformat.');if(obj.schema&&obj.schema!=='immobilien-investmentcheck-v3'&&obj.schema!=='immobilien-investmentcheck-v2')throw new Error('Nicht unterstütztes Schema: '+obj.schema);const values=obj.values||obj.data||obj;let count=0;
  ids.forEach(id=>{if(!(id in values)||values[id]===null||values[id]===undefined||values[id]==='')return;const e=$(id);if(!e)return;if(e.type==='checkbox')e.checked=!!values[id];else e.value=values[id];count++});
  if(obj.meta&&typeof obj.meta==='object')importMeta={sources:obj.meta.sources||[],warnings:obj.meta.warnings||[],conflicts:obj.meta.conflicts||[],confidence:obj.meta.confidence||{},fieldSources:obj.meta.fieldSources||{}};
  if(v('state')&&GR[v('state')]!=null)$('grest').value=GR[v('state')];if(v('afaMode')==='linear'&&!v('afa'))defaultAfa(true);save();
  const src=importMeta.sources?.length||0,w=importMeta.warnings?.length||0,c=importMeta.conflicts?.length||0;$('importStatus').className='importStatus ok';$('importStatus').textContent=`${count} Felder importiert · ${src} Quellen · ${w} Hinweise · ${c} Konflikte. Bitte kritische Werte kurz plausibilisieren.`;return count;
}
function importPrompt(){return `Du bist ein unabhängiger Immobilien-Investmentanalyst für Deutschland. Analysiere genau EINE potenzielle vermietete Wohnimmobilie anhand aller Unterlagen, Bilder, E-Mails und verknüpften Quellen, die ich dir in diesem Chat ausdrücklich bereitstelle oder benenne.

ZIEL: Erzeuge einen belastbaren Importdatensatz für den "Immobilien-Investmentcheck v3". Der Datensatz soll Fakten, Schätzungen und Unsicherheiten strikt trennen. Erfinde nichts.

PRIORITÄT DER QUELLEN:
1. Notar-/Kaufvertragsunterlagen, Grundbuch, Teilungserklärung, Mietvertrag, Wirtschaftsplan/Jahresabrechnung, Vermögensbericht, Beschlüsse/WEG-Protokolle, Energieausweis, Finanzierungsangebot.
2. Offizielle aktuelle Quellen: Gutachterausschuss/Kaufpreissammlung bzw. Marktbericht, offizieller Mietspiegel, Bodenrichtwert, kommunale Wärmeplanung, Hochwasser-/Starkregen-/Altlasten-/Radonkarten, amtliche Statistik.
3. Mehrere seriöse Marktquellen ergänzend. Einzelne Immobilienanzeigen nie als alleinige Marktwertquelle behandeln.

AUFGABEN:
- Extrahiere Kaufpreis, Fläche, echte Kaltmiete, Stellplatz-/Nebeneinnahmen, Baujahr, Mietvertragsart, Kaufnebenkosten, Hausgeldaufteilung, WEG-Rücklage, Verwaltung, bekannte Reparaturen/Sonderumlagen, Finanzierung und steuerlich relevante Daten.
- Prüfe die Mietvertragsart: normal / Index / Staffel. Bei Neuvermietung aktuelle Mietpreisbremse/Ausnahmen nur dann bewerten, wenn Lage und Fakten reichen.
- Ermittle – wenn die genaue Lage verfügbar ist – eine belastbare Vergleichs-Marktmiete und Vergleichs-Kaufpreis €/m². Bevorzuge Mietspiegel/Gutachterausschuss. Dokumentiere Datenstichtag und Quelle.
- Suche, wenn möglich, Liegenschaftszinssatz, Bodenwert/Bodenrichtwert und plausible Restnutzungsdauer für eine Ertragswert-Plausibilisierung. Nur ausgeben, wenn Quelle und Zuordnung ausreichend belastbar sind.
- Prüfe WEG: Rücklagenstand, geplante Maßnahmen, Sonderumlagen, Beschlüsse, Rechtsstreitigkeiten, Hausgeldrückstände, Verwalter-/Versicherungsprobleme.
- Prüfe Technik anhand Unterlagen und Fotos vorsichtig: Heizung, Dach, Fassade, Fenster, Leitungen, Feuchte/Schäden. Fotos allein bestätigen niemals einen mangelfreien Zustand.
- Prüfe Energie/Wärme: Energieklasse, Heizungsart/-alter, kommunale Wärmeplanung und erkennbare zukünftige Capex-Risiken nach aktuellem Recht. Keine pauschalen Sanierungskosten erfinden.
- Prüfe Standort-/Umweltrisiken, soweit offizielle Quellen verfügbar sind: Hochwasser/Starkregen, Altlasten, Radon, erheblicher Lärm/Immissionen.
- Prüfe Finanzierung gegen das konkrete Angebot. Wenn kein Angebot existiert, lasse Zinssatz/Darlehensbetrag lieber null statt einen aktuellen Marktzins zu erfinden. Du darfst aktuelle Bundesbankdaten als Benchmark in meta.warnings nennen.
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
 "schema":"immobilien-investmentcheck-v3",
 "values":{
  "price":null,"area":null,"rent":null,"otherRent":null,"year":null,"type":null,"occupied":null,"rentType":null,"energyClass":null,"heatingType":null,"heatingYear":null,"address":null,"marketRentM2":null,"marketPriceM2":null,"state":null,
  "notary":null,"broker":null,"reno":null,"furn":null,"renoTax":null,
  "nonAlloc":null,"wegReserve":null,"maintM2":null,"cashMaint":null,"admin":null,"vacancy":null,"otherCost":null,"vacOps":null,"taxMaint":null,
  "ltv":null,"interest":null,"repay":null,"fixed":null,"loanAmount":null,"refiRate":null,"refiRepay":null,
  "tax":null,"building":null,"afaMode":null,"afa":null,"furnYears":null,"specialAfa":null,"specialAfaYears":null,"lossOffset":null,
  "horizon":null,"target":null,"rentGrowth":null,"costGrowth":null,"priceGrowth":null,"inflation":null,"sellCost":null,"exitMethod":null,"exitYield":null,"taxFreeSale":null,
  "liegenschaft":null,"restLife":null,"landValue":null,"wegReserveBalance":null,
  "capex1Year":null,"capex1Amount":null,"capex2Year":null,"capex2Amount":null,"capex3Year":null,"capex3Amount":null,
  "cRent":false,"cWeg":false,"cTech":false,"cLegal":false,"cMarket":false,"cFinance":false,"cEnergy":false,"cEnv":false
 },
 "meta":{
  "sources":[{"name":"","type":"","date":"","details":"","url":""}],
  "warnings":[],"conflicts":[],"confidence":{},"fieldSources":{}
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
8. Rendite: rechne IRR, NPV bei Zielrendite, Cash-on-Cash, DSCR, Debt Yield und Stressfälle gegen. Prüfe, ob IRR wegen mehrfacher Vorzeichenwechsel mehrdeutig sein kann.
9. Exit: prüfe, ob Wertsteigerungsannahme oder Exit-Rendite plausibel ist. Nenne Rendite ohne Wertsteigerung.
10. Kaufentscheidung: nenne maximal vertretbaren Kaufpreis, Break-even-Miete, größte drei Risiken und welche Unterlagen vor Notartermin zwingend noch fehlen.

Unterscheide: BELEGT / PLAUSIBLE ANNAHME / NICHT BELEGT. Korrigiere erkennbare Fehler. Gib am Ende zusätzlich ein vollständiges, valides JSON im Schema immobilien-investmentcheck-v3 aus, das wieder in die Website importiert werden kann.

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
document.querySelectorAll('input,select').forEach(e=>{e.addEventListener('input',save);e.addEventListener('change',save)});
$('pdf').onclick=()=>print();$('copy').onclick=()=>copyText(resultText(),'Auswertung kopiert.');$('share').onclick=async()=>{try{if(navigator.share)await navigator.share({title:'Immobilien-Investmentcheck',text:resultText()});else await copyText(resultText())}catch(e){}};$('exportJson').onclick=downloadJson;$('auditPrompt').onclick=()=>copyText(auditPrompt(),'Deep-Check-Prompt mit aktuellem Datensatz kopiert.');$('edit').onclick=()=>{$('res').classList.remove('on');show(1)};ensureV3UI();load();
