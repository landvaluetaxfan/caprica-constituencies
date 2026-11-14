// Candidate lists for the 2076 election (live view).
// Usage: node tools/generate_live.js   (rewrites the CANDS_LIVE line in index.html)
//
// Every seat gets one candidate per 2076 party; the page only shows the parties the count sheet
// says are standing in that region. Sitting MPs from the 2072 election stand again
// for the party their old party maps to (MAP below); everyone else gets a generated name.
const fs = require("fs"), path = require("path");
const { makeNamer } = require("./names.js");
const FILE = path.join(__dirname, "..", "index.html");
const html = fs.readFileSync(FILE, "utf8");
const line = p => html.split("\n").find(l => l.startsWith(p));
const DATA = JSON.parse(line("const DATA = ").slice(13).replace(/;\s*$/, ""));
const RESULTS = JSON.parse(line("const RESULTS = ").slice(16).replace(/;\s*$/, ""));

// 2072 parties -> 2076 parties (keep in step with MAP_TO_LIVE in index.html)
const MAP = { SDA: "AA", REJ: "AA", DEM: "DEM", DM: "DM", REG: "AR", NPP: "CON", RE: "CON", PP: "A", AC: "A", IND: "IND" };
const P_LIVE = ["AA", "DEM", "DM", "AR", "JF", "CON", "A", "IND"];

let seed = 20800101;
const R = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return ((seed >>> 0) % 1000000) / 1000000; };
// generated names that were later swapped for named MPs (SWAPS in generate_results.js) stay reserved, so no other names move
const SWAPPED_OUT = ["Teresa Domínguez"];
const exampleNames = new Set(SWAPPED_OUT); Object.values(RESULTS).forEach(r => r.cands.forEach(c => exampleNames.add(c.name)));
const incumbents = [...Object.values(RESULTS).map(r => [...r.cands].sort((a, b) => b.votes - a.votes)[0].name), ...SWAPPED_OUT];
const namer = makeNamer(R, incumbents);
const parse = d => d.replace(/Z/g, "").split(/[ML]/).filter(Boolean).map(p => p.trim().split(/\s+/).map(Number));
const area = r => { let a = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a / 2); };

const out = {};
DATA.seats.forEach(s => {
  const a = s.d.split("M").filter(Boolean).reduce((t, part) => t + area(parse("M" + part)), 0);
  const u = Math.max(0, Math.min(1, (Math.log(2500) - Math.log(Math.max(a, 1))) / (Math.log(2500) - Math.log(60))));
  const w = [...RESULTS[s.id].cands].sort((x, y) => y.votes - x.votes)[0];
  const row = {};
  P_LIVE.forEach(p => {
    if (MAP[w.party] === p) { row[p] = w.name; return; } // sitting MP stands again
    let n; do { n = namer(s.region, u); } while (exampleNames.has(n));
    row[p] = n;
  });
  out[s.id] = row;
});
// named 2076 candidates: [name, region, 2076 party, seat (optional)]. Without a seat they go to the party's
// strongest seat in the region (one it held in 2072 if possible), replacing a generated candidate.
const NAMED_LIVE = [
  ["Élodie Vasmer", "Cambria", "AA", "Alto West"], // Social Democrat, standing for the Autumn Accords
  ["Kelly Ayotte", "Pittston", "CON", "Losana South"], // Caprican Democratic Movement, standing for Convergence
  ["William Rodgers", "Pleucadeuc", "CON", "Fievreau-Est"], // Caprican Democratic Movement, standing for Convergence
  ["Consuelo Preiss", "Mezata", "CON", "Las Acacias"], // Caprican Democratic Movement, standing for Convergence
];
NAMED_LIVE.forEach(([name, region, party, seatName]) => {
  const seats = DATA.seats.filter(s => s.region === region && (!seatName || s.name === seatName));
  const held = seats.filter(s => MAP[[...RESULTS[s.id].cands].sort((a, b) => b.votes - a.votes)[0].party] === party);
  const s = (held.length ? held : seats)[0]; if (!s) throw `no seat in ${region} for ${name}`;
  out[s.id][party] = name;
  console.error(`${name} stands for ${party} in ${s.name}, ${region}`);
});
// sitting MPs who have changed party since 2072: [name, 2076 party]. They swap places with that
// party's generated candidate in their seat, so no other name moves.
const SWITCHED = [
  ["George Miliband", "JF"], // Democrat in 2072, now Jasmine-Scarfelts (also its Senate candidate in Kazana)
];
SWITCHED.forEach(([name, party]) => {
  const id = Object.keys(out).find(k => Object.values(out[k]).includes(name)); if (!id) throw `no seat for ${name}`;
  const row = out[id], old = Object.keys(row).find(p => row[p] === name);
  [row[old], row[party]] = [row[party], name];
  console.error(`${name} stands for ${party} (not ${old}) in ${id}; ${row[old]} takes the ${old} slot`);
});
const lines = html.split(/\r?\n/);
const k = lines.findIndex(l => l.startsWith("const CANDS_LIVE = "));
const text = "const CANDS_LIVE = " + JSON.stringify(out) + ";";
if (k >= 0) lines[k] = text;
else { const j = lines.findIndex(l => l.startsWith("const RESULTS = ")); lines.splice(j + 1, 0, "// 2076 candidates: one per party per seat (see tools/generate_live.js); sitting MPs stand again", text); }
fs.writeFileSync(FILE, lines.join("\n"));
console.error("CANDS_LIVE written for", Object.keys(out).length, "seats");
