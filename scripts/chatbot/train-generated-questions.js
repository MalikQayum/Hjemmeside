#!/usr/bin/env node
/* Verify generated questions against the real browser search/answer engine, then promote passes. */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const chatbotPath = path.join(ROOT, "assets/js/chatbot.js");
const knowledgePath = path.join(ROOT, "chatbot/data/knowledge.json");
const candidatesPath = path.join(ROOT, "chatbot/data/generated-questions.json");
const rulesPath = path.join(ROOT, "chatbot/config/response-rules.json");
const reportPath = path.join(ROOT, "chatbot/data/learning-results.json");

const source = fs.readFileSync(chatbotPath, "utf8");
const insertionPoint = '  const style = document.createElement("link");';
if (!source.includes(insertionPoint)) throw new Error("Chatbot test hook insertion point not found.");
const instrumented = source.replace(
  insertionPoint,
  '  globalThis.__chatbotTest = { setKnowledge(v) { knowledge = v; }, setRules(v) { responseRules = v; }, search, formatAnswer }; return;\n' + insertionPoint
);

const context = {
  navigator: { language: "da" },
  document: { baseURI: "https://skyttegaardvej.dk/", getElementById: () => null },
  console, URL, Set, RegExp, String, Math, globalThis: null
};
context.globalThis = context;
vm.runInNewContext(instrumented, context, { filename: chatbotPath });

const api = context.__chatbotTest;
const knowledge = JSON.parse(fs.readFileSync(knowledgePath, "utf8"));
const candidates = JSON.parse(fs.readFileSync(candidatesPath, "utf8"));
const rules = JSON.parse(fs.readFileSync(rulesPath, "utf8"));
const previousReport = fs.existsSync(reportPath)
  ? JSON.parse(fs.readFileSync(reportPath, "utf8"))
  : { attempted_questions: [] };
api.setKnowledge(knowledge);
api.setRules({ schema_version: 1, rules: [] });

function normalize(value) {
  return String(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/æ/g, "ae").replace(/ø/g, "o").replace(/å/g, "a")
    .replace(/[.!?]+$/g, "").trim().replace(/\s+/g, " ");
}

function isNaturalQuestion(question) {
  const words = question.match(/[A-Za-zÆØÅæøå0-9]+/g) || [];
  if (!question.endsWith("?") || question.length < 12 || question.length > 160 || words.length < 4) return false;
  if (words.some(word => word.length === 1 && !/^(i|å|[0-9])$/i.test(word))) return false;
  if (/^(hvad gælder om|hvad gælder for|hvad skal jeg vide om|hvor kan jeg læse om)\b/i.test(question)) return false;
  if (/^(må jeg ikke|må jeg anvende til|skal sikkerhed:|hvad gælder for hvis)\b/i.test(question)) return false;
  return true;
}

const existing = new Set((rules.rules || []).map(rule => normalize(rule.question)));
const docs = new Map(knowledge.documents.map(doc => [doc.id, doc]));
const accepted = [];
const rejected = [];

for (const candidate of candidates.questions || []) {
  const question = String(candidate.question || "").trim();
  const expected = docs.get(candidate.document_id);
  if (!isNaturalQuestion(question)) {
    rejected.push({ question, reason: "low_question_quality" });
    continue;
  }
  if (!question || !expected || existing.has(normalize(question))) {
    rejected.push({ question, reason: !expected ? "unknown_source" : "duplicate_or_empty" });
    continue;
  }
  const matches = api.search(question);
  const matchedDoc = matches[0]?.doc;
  const sameId = matchedDoc && matchedDoc.id === expected.id;
  const sameCategoryAndSection = matchedDoc &&
    matchedDoc.category === expected.category &&
    (expected.section !== undefined ? Number(matchedDoc.section) === Number(expected.section) : matchedDoc.source?.url === expected.source?.url);

  if (!matchedDoc || (!sameId && !sameCategoryAndSection)) {
    rejected.push({
      question,
      reason: "wrong_or_missing_source",
      expected: expected.title,
      actual: matchedDoc?.title || null
    });
    continue;
  }
  const answer = api.formatAnswer(matches, question);
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  if (!answer.trim() || wordCount > 120) {
    rejected.push({ question, reason: "answer_too_long_or_empty", word_count: wordCount });
    continue;
  }
  if (!matchedDoc.source?.url || !matchedDoc.content?.trim()) {
    rejected.push({ question, reason: "source_incomplete" });
    continue;
  }
  accepted.push({
    question,
    document_id: matchedDoc.id,
    source_file: matchedDoc.source.file,
    source_url: matchedDoc.source.url,
    answer_word_count: wordCount,
    approved_by: "automated-source-and-answer-test"
  });
  existing.add(normalize(question));
}

const now = new Date().toISOString();
for (const item of accepted) {
  rules.rules.push({
    ...item,
    approved_at: now
  });
}
rules.schema_version = 1;
rules.description = "Automatisk godkendte spørgsmål, der peger på verificerede kildeafsnit. Regler indeholder ikke selvstændige foreningsfakta.";
fs.writeFileSync(rulesPath, JSON.stringify(rules, null, 2) + "\n");

const attemptedQuestions = new Set([
  ...(previousReport.attempted_questions || []),
  ...(candidates.questions || []).map(item => String(item.question || "").trim()).filter(Boolean)
]);
const report = {
  schema_version: 1,
  tested_at: now,
  generated: (candidates.questions || []).length,
  approved: accepted.length,
  rejected: rejected.length,
  total_unique_attempted: attemptedQuestions.size,
  attempted_questions: [...attemptedQuestions],
  approved_questions: accepted.map(item => item.question),
  rejected_questions: rejected
};
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
console.log(`Træning færdig: ${accepted.length} godkendt, ${rejected.length} afvist.`);
if (!accepted.length && (candidates.questions || []).length) {
  console.log("Ingen spørgsmål bestod denne runde. response-rules.json er ikke udvidet.");
}
