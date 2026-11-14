// Senate candidates for 2080, from the Senate candidate sheet.
// Usage: node tools/senate_candidates.js   (rewrites the SENATE_CANDS line in index.html)
//
// The sheet has one row per region and one column per party (REJ, SDA, DEM, DM, AR, JM, SP, NPP, CDM, RE, PP, AC, IND).
// Each candidate keeps their own party and is counted for the 2080 alliance it belongs to (ALLIANCE below).
const fs = require("fs"), path = require("path");
const FILE = path.join(__dirname, "..", "index.html");
const SHEET = "https://docs.google.com/spreadsheets/d/1_C0QFdjF0NECU-ILMeHisX9GUqIB_8l244NXA8hYP7s/export?format=csv";
const ALLIANCE = { REJ: "AA", SDA: "AA", DEM: "DEM", DM: "DM", AR: "AR", JM: "JF", SP: "JF", NPP: "CON", CDM: "CON", RE: "CON", PP: "A", AC: "A", IND: "IND" };

(async () => {
  const text = await (await fetch(SHEET)).text();
  const rows = text.split(/\r?\n/).map(r => r.split(","));
  const head = rows[0];
  const html = fs.readFileSync(FILE, "utf8");
  const D = JSON.parse(html.split("\n").find(l => l.startsWith("const DATA = ")).slice(13).replace(/;\s*$/, ""));
  const out = {};
  rows.forEach(r => {
    if (!D.regions[r[0]]) return;
    out[r[0]] = [];
    head.forEach((p, k) => { const n = (r[k] || "").trim(); if (k && ALLIANCE[p] && n) out[r[0]].push({ n, p, a: ALLIANCE[p] }); });
  });
  const missing = Object.keys(D.regions).filter(r => !out[r]);
  if (missing.length) throw "no Senate row for " + missing.join(", ");
  const lines = html.split(/\r?\n/);
  const k = lines.findIndex(l => l.startsWith("const SENATE_CANDS = "));
  const t = "const SENATE_CANDS = " + JSON.stringify(out) + ";";
  if (k >= 0) lines[k] = t;
  else { const j = lines.findIndex(l => l.startsWith("const CANDS_2080 = ")); lines.splice(j + 1, 0, "// Senate candidates, one row per region (see tools/senate_candidates.js); p = own party, a = 2080 alliance", t); }
  fs.writeFileSync(FILE, lines.join("\n"));
  console.error("SENATE_CANDS written:", Object.values(out).reduce((a, c) => a + c.length, 0), "candidates in", Object.keys(out).length, "regions");
})();
