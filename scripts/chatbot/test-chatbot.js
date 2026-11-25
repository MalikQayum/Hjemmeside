#!/usr/bin/env node
/* Regressionstest af chatbot-søgning og svarformatering uden browser eller npm-pakker. */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const jsPath = path.join(ROOT, "assets/js/chatbot.js");
const dataPath = path.join(ROOT, "chatbot/data/knowledge.json");
const cssPath = path.join(ROOT, "assets/css/chatbot.css");
const loaderPath = path.join(ROOT, "assets/js/load-sidebar.js");
const configPath = path.join(ROOT, "chatbot/config/config.json");
let source = fs.readFileSync(jsPath, "utf8");
const insertionPoint = '  const style = document.createElement("link");';
if (!source.includes(insertionPoint)) throw new Error("Could not locate chatbot test hook");
source = source.replace(insertionPoint,
  '  globalThis.__chatbotTest = { setKnowledge(v) { knowledge = v; }, setRules(v) { responseRules = v; }, search, formatAnswer, predefinedAnswer, topics: TOPICS }; return;\n' + insertionPoint);

const context = {
  navigator: { language: "da" },
  document: { baseURI: "https://skyttegaardvej.dk/", getElementById: () => null },
  console, URL, Set, RegExp, String, Math, globalThis: null
};
context.globalThis = context;
vm.runInNewContext(source, context, { filename: jsPath });
const css = fs.readFileSync(cssPath, "utf8");
const loader = fs.readFileSync(loaderPath, "utf8");
const chatbotConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
if (typeof chatbotConfig.enabled !== "boolean") {
  throw new Error('chatbot/config/config.json skal have en boolesk "enabled"-værdi');
}
if (!loader.includes('/chatbot/config/config.json') || !loader.includes('config.enabled === false')) {
  throw new Error('load-sidebar.js skal styre chatbotindlæsning via config.json');
}
if (!loader.includes('cache: "no-store"') || !loader.includes('configUrl.searchParams.set')) {
  throw new Error('Chatbot-konfigurationen skal hentes uden at fastholde en gammel cacheværdi');
}
console.log(`OK: Chatbotten er som standard ${chatbotConfig.enabled ? "aktiveret" : "deaktiveret"} via config.json`);
if (source.includes('class="acb-close"') || source.includes('querySelector(".acb-close")')) {
  throw new Error("Den separate luk-knap skal være fjernet");
}
if (source.includes('acb-language') || source.includes('Dansk / English')) {
  throw new Error("Sprogskift og engelsk skal være fjernet fra chatbotten");
}
if (!source.includes('launcher.addEventListener("click"') || !source.includes('launcher.setAttribute("aria-expanded", String(!panel.hidden))')) {
  throw new Error("Spørg os-knappen skal åbne og lukke chatten");
}
if (!css.includes("grid-template-columns: repeat(2, minmax(0, 1fr))") || !css.includes("overflow-wrap: break-word")) {
  throw new Error("Emneknappernes kompakte layout mangler");
}
console.log("OK: Kompakte emneknapper og lukning via Spørg os-knappen");

const api = context.__chatbotTest;
api.setKnowledge(JSON.parse(fs.readFileSync(dataPath, "utf8")));
const responseRulesPath = path.join(ROOT, "chatbot/config/response-rules.json");
const responseRules = JSON.parse(fs.readFileSync(responseRulesPath, "utf8"));
if (responseRules.schema_version !== 1 || !Array.isArray(responseRules.rules)) {
  throw new Error("response-rules.json har forkert struktur");
}
api.setRules({ schema_version: 1, rules: [] });

const tests = [
  ["må vi have hund", doc => doc.section === 6, "Det er ikke tilladt at holde husdyr"],
  ["hvad med nattero", doc => doc.section === 7, "Der står ikke et bestemt klokkeslæt"],
  ["parkering", doc => doc.topic === "overview", "Du kan skrive dig på ventelisten"],
  ["hvordan kommer jeg på ventelisten", doc => doc.topic === "waitlist", "kontaktformularen"],
  ["nogen holder på min plads", doc => doc.topic === "enforcement", "DinParkering"]
];

for (const [question, expectedDocument, expectedAnswer] of tests) {
  const results = api.search(question);
  if (!results.length || !expectedDocument(results[0].doc)) {
    throw new Error(`Forkert kilderesultat for '${question}': ${results[0]?.doc?.title || "intet resultat"}`);
  }
  const answer = api.formatAnswer(results, question);
  if (!answer.includes(expectedAnswer)) throw new Error(`Forkert svar for '${question}': ${answer}`);
  console.log(`OK: ${question} → ${results[0].doc.title}`);
}

const husdyrDoc = api.search("må vi have hund")[0].doc;
api.setRules({ schema_version: 1, rules: [{ question: "må jeg have en lille hund?", document_id: husdyrDoc.id }] });
const learnedMatch = api.search("må jeg have en lille hund?");
if (!learnedMatch.length || learnedMatch[0].doc.id !== husdyrDoc.id) {
  throw new Error("En godkendt læringsregel pegede ikke på det rigtige kildeafsnit");
}
api.setRules({ schema_version: 1, rules: [] });
console.log("OK: Godkendte læringsregler kan pege på et verificeret kildeafsnit");

const expectedTopics = [
  "parkering", "vedtaegter", "husorden", "kontakt", "kaelderrum",
  "noeglebrikker", "nyheder", "affald", "generalforsamling", "udlejning", "vedligeholdelse", "generelt"
];
for (const topic of expectedTopics) {
  if (!api.topics.some(item => item.id === topic)) throw new Error(`Mangler chatbot-emnet: ${topic}`);
}
console.log("OK: Alle tolv emner er tilgængelige");

const generalAnswer = api.predefinedAnswer("Hvad kan jeg spørge om?");
if (!generalAnswer || !generalAnswer.includes("parkering") || !generalAnswer.includes("vedtægter")) {
  throw new Error("Det generelle FAQ-svar mangler relevante emner");
}
const usageAnswer = api.predefinedAnswer("Hvordan bruger jeg chatbotten?");
if (!usageAnswer || !usageAnswer.includes("hele hjemmesidens vidensdatabase")) {
  throw new Error("FAQ-svaret forklarer ikke, at søgningen er global");
}
console.log("OK: Generelle spørgsmål får prædefinerede svar");

const bylawResults = api.search("Hvad siger vedtægterne om udlejning?");
if (!bylawResults.length || bylawResults[0].doc.category !== "vedtaegter") {
  throw new Error("Vedtægtsspørgsmålet fandt ikke vedtægtskilden");
}
const keyResults = api.search("Hvordan bestiller jeg en nøglebrik?");
if (!keyResults.length || keyResults[0].doc.category !== "noeglebrikker" ||
    keyResults[0].doc.source?.url !== "/noegler/") {
  throw new Error("Nøglebrikspørgsmålet fandt ikke nøglebrikskilden");
}
const newsResults = api.search("Hvor finder jeg nyhedsbreve fra bestyrelsen?");
if (!newsResults.length || newsResults[0].doc.category !== "nyheder") {
  throw new Error("Nyhedsspørgsmålet fandt ikke nyhedskilden");
}
const wasteResults = api.search("Hvor ligger skralderum og storskraldsrum?");
if (!wasteResults.length || wasteResults[0].doc.source?.url !== "/affald-storskrald/") {
  throw new Error("Affaldsspørgsmålet fandt ikke /affald-storskrald/");
}
const gfResults = api.search("Hvor finder jeg referater, regnskab og prisblad?");
if (!gfResults.length || gfResults[0].doc.source?.url !== "/generalforsamling/") {
  throw new Error("Generalforsamlingsspørgsmålet fandt ikke /generalforsamling/");
}
const rentalResults = api.search("Hvad er reglerne for Airbnb og korttidsudlejning?");
if (!rentalResults.length || rentalResults[0].doc.source?.url !== "/udlejning/") {
  throw new Error("Udlejningsspørgsmålet fandt ikke /udlejning/");
}
const maintResults = api.search("Hvad er proceduren ved lukning af vand?");
if (!maintResults.length || maintResults[0].doc.source?.url !== "/vedligeholdelse/") {
  throw new Error("Vedligeholdelsesspørgsmålet fandt ikke /vedligeholdelse/");
}

const waterDamageResults = api.search("vandskade i mit badeværelse");
if (!waterDamageResults.length || waterDamageResults[0].doc.source?.url !== "/vedligeholdelse/") {
  throw new Error("Vandskadespørgsmålet fandt ikke /vedligeholdelse/");
}
const waterDamageAnswer = api.formatAnswer(waterDamageResults, "vandskade i mit badeværelse");
if (
  !waterDamageAnswer.includes("forgrening") ||
  !waterDamageAnswer.includes("policens vilkår") ||
  !waterDamageAnswer.includes("70 12 20 20")
) {
  throw new Error(`Vandskadesvaret mangler præcis sondring eller FLD kontakt: ${waterDamageAnswer}`);
}

const burstPipeResults = api.search("mit vandrør er sprunget");
if (!burstPipeResults.length || burstPipeResults[0].doc.source?.url !== "/vedligeholdelse/") {
  throw new Error("Sprunget rør-spørgsmålet fandt ikke /vedligeholdelse/");
}
const burstPipeAnswer = api.formatAnswer(burstPipeResults, "mit vandrør er sprunget");
if (
  !burstPipeAnswer.includes("afspærringshanen lukkes omgående") ||
  !burstPipeAnswer.includes("rørforgreninger") ||
  !burstPipeAnswer.includes("70 12 20 20")
) {
  throw new Error(`Sprunget rør-svaret mangler akut afspærring eller rørskelsætning: ${burstPipeAnswer}`);
}

const branchResults = api.search("hvem har ansvaret for rørforgreninger i lejligheden");
if (!branchResults.length || branchResults[0].doc.source?.url !== "/vedligeholdelse/") {
  throw new Error("Forgreningsspørgsmålet fandt ikke /vedligeholdelse/");
}
const branchAnswer = api.formatAnswer(branchResults, "hvem har ansvaret for rørforgreninger i lejligheden");
if (!branchAnswer.includes("ejerens eget ansvar") || !branchAnswer.includes("lodrette hovedstigstrenge")) {
  throw new Error(`Forgreningssvaret mangler klar ansvarsfordeling: ${branchAnswer}`);
}

const verticalResults = api.search("hvem har ansvaret for lodrette faldstammer");
if (!verticalResults.length || verticalResults[0].doc.source?.url !== "/vedligeholdelse/") {
  throw new Error("Faldstammespørgsmålet fandt ikke /vedligeholdelse/");
}
const verticalAnswer = api.formatAnswer(verticalResults, "hvem har ansvaret for lodrette faldstammer");
if (!verticalAnswer.includes("frem til den individuelle forgrening") || !verticalAnswer.includes("§ 7, stk. 2")) {
  throw new Error(`Faldstammesvaret mangler henvisning til forgrening og § 7, stk. 2: ${verticalAnswer}`);
}

const insuranceResults = api.search("hvad dækker bygningsforsikringen ved skade");
if (!insuranceResults.length || insuranceResults[0].doc.source?.url !== "/vedligeholdelse/") {
  throw new Error("Forsikringsspørgsmålet fandt ikke /vedligeholdelse/");
}
const insuranceAnswer = api.formatAnswer(insuranceResults, "hvad dækker bygningsforsikringen ved skade");
if (!insuranceAnswer.includes("policens vilkår") || insuranceAnswer.includes("pludselige rør- og vandskader på ejendommen")) {
  throw new Error(`Forsikringssvaret bruger upræcis formulering: ${insuranceAnswer}`);
}

const toiletResults = api.search("mit toilet løber");
if (!toiletResults.length || toiletResults[0].doc.source?.url !== "/vedligeholdelse/") {
  throw new Error("Toiletspørgsmålet fandt ikke /vedligeholdelse/");
}
const toiletAnswer = api.formatAnswer(toiletResults, "mit toilet løber");
if (!toiletAnswer.includes("ansvaret") || !toiletAnswer.includes("sanitet")) {
  throw new Error("Toiletsvaret mangler ejerens indvendige ansvar");
}

console.log("OK: Vedtægter, nøglebrikker, nyheder, affald, generalforsamling, udlejning, vedligeholdelse, forgreninger, vandskade og forsikring giver præcise svar");
