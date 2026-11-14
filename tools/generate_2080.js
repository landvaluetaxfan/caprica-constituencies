// Candidate lists for the 2080 election (live view).
// Usage: node tools/generate_2080.js   (rewrites the CANDS_2080 line in index.html)
//
// Every seat gets one candidate per 2080 party; the page only shows the parties the count sheet
// says are standing in that region. Sitting MPs from the 2076 election stand again
// for the party their old party maps to (MAP below); everyone else gets a generated name.
const fs = require("fs"), path = require("path");
const { makeNamer } = require("./names.js");
const FILE = path.join(__dirname, "..", "index.html");
const html = fs.readFileSync(FILE, "utf8");
const line = p => html.split("\n").find(l => l.startsWith(p));
const DATA = JSON.parse(line("const DATA = ").slice(13).replace(/;\s*$/, ""));
const RESULTS = JSON.parse(line("const RESULTS = ").slice(16).replace(/;\s*$/, ""));

// 2076 parties -> 2080 parties (keep in step with MAP_EX_2080 in index.html)
const MAP = { SDA: "AA", REJ: "AA", DEM: "DEM", DM: "DM", REG: "AR", NPP: "CON", RE: "CON", PP: "A", AC: "A", IND: "IND" };
const P2080 = ["AA", "DEM", "DM", "AR", "JF", "CON", "A", "IND"];

let seed = 20800101;
const R = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return ((seed >>> 0) % 1000000) / 1000000; };
const exampleNames = new Set(); Object.values(RESULTS).forEach(r => r.cands.forEach(c => exampleNames.add(c.name)));
const incumbents = Object.values(RESULTS).map(r => [...r.cands].sort((a, b) => b.votes - a.votes)[0].name);
const namer = makeNamer(R, incumbents);
const parse = d => d.replace(/Z/g, "").split(/[ML]/).filter(Boolean).map(p => p.trim().split(/\s+/).map(Number));
const area = r => { let a = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a / 2); };

const out = {};
DATA.seats.forEach(s => {
  const a = s.d.split("M").filter(Boolean).reduce((t, part) => t + area(parse("M" + part)), 0);
  const u = Math.max(0, Math.min(1, (Math.log(2500) - Math.log(Math.max(a, 1))) / (Math.log(2500) - Math.log(60))));
  const w = [...RESULTS[s.id].cands].sort((x, y) => y.votes - x.votes)[0];
  const row = {};
  P2080.forEach(p => {
    if (MAP[w.party] === p) { row[p] = w.name; return; } // sitting MP stands again
    let n; do { n = namer(s.region, u); } while (exampleNames.has(n));
    row[p] = n;
  });
  out[s.id] = row;
});
const lines = html.split(/\r?\n/);
const k = lines.findIndex(l => l.startsWith("const CANDS_2080 = "));
const text = "const CANDS_2080 = " + JSON.stringify(out) + ";";
if (k >= 0) lines[k] = text;
else { const j = lines.findIndex(l => l.startsWith("const RESULTS = ")); lines.splice(j + 1, 0, "// 2080 candidates: one per party per seat (see tools/generate_2080.js); sitting MPs stand again", text); }
fs.writeFileSync(FILE, lines.join("\n"));
console.error("CANDS_2080 written for", Object.keys(out).length, "seats");
