// Simulated House results for the Caprica map.
// Usage: node tools/generate_results.js   (rewrites the RESULTS line in index.html)
//
// What it models
// - Exact seat totals for every region (the player-NPC sheet / seat table; ALP + DGC = Democrats, KNP = Régionale).
// - Geography: regional left-right lean, how urban each seat is, and each party's base (see SCORE below).
// - Pacts: SDA/Rejuvenation, NPP/Renaissance and Avenir/People's Party never stand against each other;
//   in each seat the partner with the stronger local base stands and most of the other's vote transfers.
// - The story of the previous election: flips are chosen by narrative rules (FLIPS below), mostly in narrow seats.
// - Named player NPCs (NAMED below) win or lose where stated; everyone else gets a generated name.
const fs = require("fs"), path = require("path");
const { makeNamer } = require("./names.js");
const FILE = path.join(__dirname, "..", "index.html");
const html = fs.readFileSync(FILE, "utf8");
const DATA = JSON.parse(html.split("\n").find(l => l.startsWith("const DATA = ")).slice(13).replace(/;\s*$/, ""));
const S = DATA.seats; S.forEach((s, i) => s.i = i);

let seed = 20261114;
const R = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return ((seed >>> 0) % 1000000) / 1000000; };
const N = () => (R() + R() + R() - 1.5) / 1.5;

// ---------- seat targets per region (from the sheet)  cols: REJ SDA ALP DGC DM KNP NPP RE PP AC IND
const RAW = {
  Ambarino:[1,1,2,2,2,0,2,1,0,0,0], Ambrosia:[0,0,1,0,1,0,0,1,1,0,0], Cambria:[2,1,1,0,1,0,1,1,0,0,0],
  Carnapol:[0,1,0,1,3,0,2,0,0,1,0], Chasmia:[0,1,1,1,1,0,1,2,1,1,0], "Costa Blanca":[5,3,2,2,1,0,1,1,1,0,0],
  Kalahooska:[1,0,1,1,2,14,2,0,0,1,0], Kazana:[5,7,3,2,2,0,1,1,1,1,0], Mezata:[2,2,1,1,1,0,1,4,2,1,0],
  Moeras:[0,0,0,1,1,0,0,1,0,0,0], Montiablo:[1,1,1,2,1,0,2,3,7,4,0], Myrati:[1,0,1,1,1,0,1,0,0,0,2],
  Oplana:[1,2,1,1,1,0,1,1,1,0,0], Pittston:[0,0,1,0,1,0,2,1,1,1,0], Pleucadeuc:[1,1,1,1,1,0,1,3,3,7,0],
  Reno:[0,1,1,1,1,0,2,1,2,1,0], Ventura:[1,0,1,2,2,0,2,1,1,0,1] };
const T = {};
for (const r in RAW) { const a = RAW[r]; T[r] = { REJ:a[0], SDA:a[1], DEM:a[2]+a[3], DM:a[4], REG:a[5], NPP:a[6], RE:a[7], PP:a[8], AC:a[9], IND:a[10] }; }
const PARTIES = ["DEM", "DM", "SDA", "REJ", "NPP", "RE", "PP", "AC", "REG", "IND"];
const PACT = { SDA: "REJ", REJ: "SDA", NPP: "RE", RE: "NPP", PP: "AC", AC: "PP" };
const regions = Object.keys(DATA.regions);
regions.forEach(r => { const n = S.filter(s => s.region === r).length, t = Object.values(T[r]).reduce((a, b) => a + b, 0); if (n !== t) throw `${r}: ${n} seats vs ${t}`; });

// ---------- geography
const LEAN = { Mezata: -4, Kazana: -4, "Costa Blanca": -3, Oplana: -3, Ambarino: -2, Moeras: -2, Carnapol: -1, Cambria: -1, Kalahooska: 0,
  Myrati: 1, Pittston: 1, Ventura: 2, Reno: 2, Montiablo: 3, Ambrosia: 3, Chasmia: 4, Pleucadeuc: 4 };
const AXIS = { REJ: -1, SDA: -0.7, REG: -0.5, DEM: -0.3, DM: -0.2, IND: 0, NPP: 0.1, RE: 0.35, PP: 0.6, AC: 0.9 };
const parse = d => d.replace(/Z/g, "").split(/[ML]/).filter(Boolean).map(p => p.trim().split(/\s+/).map(Number));
const area = r => { let a = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a / 2); };
const inInset = new Set(); DATA.insets.forEach(i => i.ids.forEach(id => inInset.add(id)));
S.forEach(s => { // urbanity 0 (rural) .. 1 (inner city), from seat area
  const a = s.d.split("M").filter(Boolean).reduce((t, part) => t + area(parse("M" + part)), 0);
  s.u = Math.max(0, Math.min(1, (Math.log(2500) - Math.log(Math.max(a, 1))) / (Math.log(2500) - Math.log(60))));
  if (inInset.has(s.i)) s.u = Math.max(s.u, 0.45);
});
const sub = u => 1 - Math.abs(u - 0.5) * 2; // suburban peak
// party bases. DEM = DGC wing (educated suburbs; Reno, Montiablo, Ventura) + ALP wing (rural populist; urban Ambarino)
const SPECIAL = {
  Ambarino: { DEM: 0.05 }, Reno: { DEM: 0.03, NPP: 0.02 }, Montiablo: { PP: 0.07, DEM: 0.01 }, Ventura: { DEM: 0.02 },
  Kazana: { SDA: 0.06, REJ: 0.04 }, "Costa Blanca": { REJ: 0.07 }, Pleucadeuc: { AC: 0.08 }, Mezata: { RE: 0.05 },
  Carnapol: { DM: 0.05, NPP: 0.02 }, Kalahooska: { REG: 0.3 }, Pittston: { NPP: 0.04 }, Chasmia: { RE: 0.02, DEM: 0.02 }, Myrati: { IND: 0.06 },
};
const BASE = { DEM: 0.2, DM: 0.17, SDA: 0.15, REJ: 0.13, NPP: 0.15, RE: 0.15, PP: 0.15, AC: 0.13, REG: 0.1, IND: 0.04 };
function score(s, p) {
  const u = s.u, L = LEAN[s.region];
  let v = BASE[p] + 0.018 * L * AXIS[p] + ((SPECIAL[s.region] || {})[p] || 0);
  v += { DEM: 0.03 * sub(u) + 0.03 * (1 - u), DM: 0.07 * u, SDA: 0.04 * u, REJ: 0.02 * (1 - sub(u)), NPP: 0.05 * sub(u), RE: 0.05 * u,
    PP: 0.05 * sub(u), AC: 0.08 * (1 - u) - 0.03, REG: 0.03 * (1 - u), IND: 0 }[p];
  return v + N() * 0.05;
}
const sc = S.map(s => Object.fromEntries(PARTIES.map(p => [p, score(s, p)])));
const elig = (r, p) => (p !== "REG" || r === "Kalahooska") && (p !== "IND" || T[r].IND > 0);

// ---------- fit exact winners per region
const off = {}; regions.forEach(r => { off[r] = Object.fromEntries(PARTIES.map(p => [p, 0])); });
const val = (i, p) => sc[i][p] + off[S[i].region][p];
const winnerOf = i => { const r = S[i].region; let b = null, bv = -9; PARTIES.forEach(p => { if (elig(r, p) && val(i, p) > bv) { bv = val(i, p); b = p; } }); return b; };
regions.forEach(r => {
  const idx = S.filter(s => s.region === r).map(s => s.i);
  const counts = () => { const c = Object.fromEntries(PARTIES.map(p => [p, 0])); idx.forEach(i => c[winnerOf(i)]++); return c; };
  for (let it = 0; it < 3000; it++) { const c = counts(); let done = true;
    PARTIES.forEach(p => { if (!elig(r, p)) return; const d = T[r][p] - c[p]; if (d) done = false; off[r][p] += 0.0015 * d; }); if (done) break; }
  for (let g = 0; g < 400; g++) { const c = counts(); const under = PARTIES.find(p => c[p] < T[r][p]); if (!under) break;
    const overs = PARTIES.filter(p => c[p] > T[r][p]); let best = null, gap = 9;
    idx.forEach(i => { const w = winnerOf(i); if (!overs.includes(w)) return; const d = val(i, w) - val(i, under); if (d < gap) { gap = d; best = i; } });
    sc[best][under] += gap + 0.004 + R() * 0.01; }
  const c = counts(); PARTIES.forEach(p => { if (c[p] !== T[r][p]) throw `fit failed ${r} ${p}`; });
});

// ---------- named player NPCs (sheet = definitive) + extra names given in chat
const LEADERS = new Set(["Adriana Flash", "Mandy Trottier", "Safiya Bethune-Fayyad", "Robert Bluespan", "David Breen Cutter", "Jon Fraser",
  "Klinton Arkas", "Zhaohua Li", "Jaco van Ryneveld"]);
// not a leader, but kept in the seat the old Régionale leader held (the party's safest), so a rerun gives the same result
const SAFE_SEAT = new Set([...LEADERS, "Margaret Ashby"]);
const W = (party, region, names, extra = {}) => names.map(name => ({ name, region, party, ...extra }));
const NAMED = [
  // --- from the player-NPC sheet
  ...W("REJ", "Ambarino", ["Kerry Bouvier"]), ...W("DEM", "Ambarino", ["Jason Herrera", "Rainier Leclerc"]), ...W("DM", "Ambarino", ["Maria Carter", "Oliver Williams"]), ...W("RE", "Ambarino", ["Sejin Bluespan"]),
  ...W("DEM", "Ambrosia", ["Alina Charliennes"]), ...W("DM", "Ambrosia", ["Elizabeth Harris"]), ...W("PP", "Ambrosia", ["Michael Lim"]),
  ...W("REJ", "Cambria", ["Miu Yamada"]), ...W("DEM", "Cambria", ["Minette Nine'oh Niamh"]), ...W("DM", "Cambria", ["Amelia McLean"]), ...W("NPP", "Cambria", ["George Macron"]), ...W("RE", "Cambria", ["Eduardo DiValera"]),
  ...W("DM", "Carnapol", ["Cordelia Lynn Edinburgh", "Robyn Pantic-Slater", "Avery Sladen"]), ...W("NPP", "Carnapol", ["Draqi Arkas"]), ...W("AC", "Carnapol", ["Joe Azhadron Jr."]),
  ...W("DM", "Chasmia", ["Donna Christensen"]), ...W("RE", "Chasmia", ["John Phillip Stanford"]),
  ...W("REJ", "Costa Blanca", ["Corey O'Sullivan"]), ...W("DEM", "Costa Blanca", ["Adriana Flash"]), ...W("DM", "Costa Blanca", ["Tomomi Kawaguchi"]), ...W("RE", "Costa Blanca", ["Kate Masto"]),
  ...W("DEM", "Kalahooska", ["Donald Trump"]), ...W("DM", "Kalahooska", ["Klara Ludvigsson", "Sandy Barber"]), ...W("REG", "Kalahooska", ["Camila Vega"]), ...W("AC", "Kalahooska", ["Rupert Pagi Shaw"]),
  ...W("REJ", "Kazana", ["Sandros Shaoqi Liu"]), ...W("DEM", "Kazana", ["George Miliband"]), ...W("SDA", "Kazana", ["Stephen Bratanovič", "Aveline Marchal"]), ...W("DM", "Kazana", ["Jacqui Karlson", "Cheryl Williamson"]),
  ...W("DEM", "Mezata", ["Mandy Trottier"]), ...W("DM", "Mezata", ["Ignacio Díaz"]), ...W("RE", "Mezata", ["Darth Ron Paul"]),
  ...W("DEM", "Moeras", ["Christian Lindner"]), ...W("DM", "Moeras", ["James Wilson"]), ...W("RE", "Moeras", ["Mariah Minogue"]),
  ...W("SDA", "Montiablo", ["Valentina Magres"]), ...W("DEM", "Montiablo", ["Tricky Lindegaard"]), ...W("DM", "Montiablo", ["Geraldine Trent"]), ...W("PP", "Montiablo", ["Sarah Palin", "Amber Brandt-Mercer"]),
  ...W("DM", "Myrati", ["Sophie Jean-Larsson"]), ...W("IND", "Myrati", ["Ronatans"]),
  ...W("SDA", "Oplana", ["Adam Scholz"]), ...W("DM", "Oplana", ["Meredith Astor"]), ...W("RE", "Oplana", ["Tony Blair"]),
  ...W("DM", "Pittston", ["Shirley Ballas"]), ...W("NPP", "Pittston", ["Jon Theroux"]),
  ...W("DM", "Pleucadeuc", ["Ophélie Merrine"]), ...W("AC", "Pleucadeuc", ["Daichi van Ryneveld", "Mathieu Jeon", "Jean-Jacques LeRoy-Du Lac"]),
  ...W("SDA", "Reno", ["Safiya Bethune-Fayyad"]), ...W("DM", "Reno", ["Christina McElroy"]), ...W("PP", "Reno", ["Walter Black"]), ...W("AC", "Reno", ["Myat Noe Win"]),
  ...W("REJ", "Ventura", ["Andrew McReary"]), ...W("DEM", "Ventura", ["Aster Skye"]), ...W("DM", "Ventura", ["Sydney Kostas Pastry II", "Nicholas Jakobssen"]), ...W("RE", "Ventura", ["Robert Bluespan"]), ...W("IND", "Ventura", ["Michelle Obama"]),
  // --- extra names given in chat, filling unnamed seats
  ...W("DEM", "Ambarino", ["Jordan Montgomery", "Ezequiel Duran"]), ...W("DEM", "Carnapol", ["Marion Wheeler"]), ...W("DEM", "Chasmia", ["Ghislaine Plessis", "Marina Sadoul"]),
  ...W("DEM", "Costa Blanca", ["David Davalillo", "Robert Garcia", "Madeline Blair Flash"]), ...W("DEM", "Kalahooska", ["Jackson G. Smith"]),
  ...W("DEM", "Kazana", ["Luna Day", "Winston Santos", "Ben Peoples", "Sophia Hammerschmidt"]), ...W("DEM", "Mezata", ["Lina Castrillón"]),
  ...W("DEM", "Montiablo", ["Alphonse de Bourbon", "Jose Manuel Mesonero"]), ...W("DEM", "Myrati", ["Dafydd Jenkins", "Branwyn Stackpoole"]),
  ...W("DEM", "Oplana", ["Cagney Metzger", "Amanda F. Jenkins"]), ...W("DEM", "Pittston", ["MacKenzie Gore"]), ...W("DEM", "Pleucadeuc", ["René Cellier", "Céleste Du Toit"]),
  ...W("DEM", "Reno", ["Gavin Collyer", "Nathan Eovaldi"]), ...W("DEM", "Ventura", ["Erika Hasumi-Inaba", "Jacob Latz"]),
  ...W("RE", "Reno", ["Roberto Libero"]), ...W("PP", "Montiablo", ["Jon Fraser"]),
  // party leaders not on the sheet, placed where their party (or family) is strongest
  ...W("NPP", "Carnapol", ["Klinton Arkas"]), ...W("REJ", "Costa Blanca", ["Zhaohua Li"]), ...W("AC", "Pleucadeuc", ["Jaco van Ryneveld"]),
  ...W("REG", "Kalahooska", ["Margaret Ashby"]), ...W("RE", "Chasmia", ["David Breen Cutter"]),
  // --- stood and lost
  ...W("IND", "Ambarino", ["Yeeun Bluespan II"], { win: false }), ...W("DEM", "Ambarino", ["Cam Cauley"], { win: false }),
  ...W("RE", "Moeras", ["Bak Ki-Ha"], { win: false }), ...W("RE", "Myrati", ["JB Stoner"], { win: false }),
];
const nameSet = new Set(); NAMED.forEach(n => { if (nameSet.has(n.name)) throw "duplicate named " + n.name; nameSet.add(n.name); });

// ---------- who stands, vote shares
const winners = S.map(s => winnerOf(s.i));
// a named loser forces their party to stand somewhere in the region: reserve one seat per such loser
const forced = {}; // seat index -> party that must stand
NAMED.filter(n => n.win === false && PACT[n.party]).forEach(n => {
  const cands = S.filter(s => s.region === n.region && winners[s.i] !== n.party && winners[s.i] !== PACT[n.party] && !forced[s.i]);
  const s = cands.sort((a, b) => val(b.i, n.party) - val(a.i, n.party))[0]; if (s) forced[s.i] = n.party;
});
const namer = makeNamer(R, NAMED.map(n => n.name));
const out = {};
S.forEach((s, i) => {
  const r = s.region, win = winners[i];
  const stand = new Set(["DEM", "DM"]);
  [["SDA", "REJ"], ["NPP", "RE"], ["PP", "AC"]].forEach(([a, b]) => {
    let st = win === a || win === b ? win : (val(i, a) >= val(i, b) ? a : b);
    if (forced[i] === a || forced[i] === b) st = forced[i];
    stand.add(st);
  });
  if (r === "Kalahooska") stand.add("REG");
  if (elig(r, "IND") && (win === "IND" || R() < 0.4)) stand.add("IND");
  // raw shares over every party, then fold the non-standing pact partner's vote into the one standing
  const raw = {}; PARTIES.filter(p => elig(r, p) || p === "IND").forEach(p => raw[p] = Math.exp(24 * (elig(r, p) ? val(i, p) : val(i, p) - 0.25)));
  if (!stand.has("IND")) delete raw.IND;
  if (!stand.has("REG")) delete raw.REG;
  const aside = [];
  for (const p of Object.keys(raw)) if (PACT[p] && !stand.has(p)) {
    const partner = PACT[p], v = raw[p]; delete raw[p]; aside.push(p);
    raw[partner] += v * 0.7; const rest = Object.keys(raw).filter(q => q !== partner), tot = rest.reduce((a, q) => a + raw[q], 0);
    rest.forEach(q => raw[q] += v * 0.3 * raw[q] / tot);
  }
  if (!stand.has("IND") && raw.IND) delete raw.IND;
  let sum = Object.values(raw).reduce((a, b) => a + b, 0); const sh = {}; for (const p in raw) sh[p] = raw[p] / sum;
  // make sure the fitted winner still tops the poll after transfers
  const top = Object.keys(sh).filter(p => p !== win).reduce((a, p) => Math.max(a, sh[p]), 0);
  if (sh[win] <= top) { const want = top + 0.004 + R() * 0.035, d = want - sh[win]; const others = Object.keys(sh).filter(p => p !== win), ot = others.reduce((a, p) => a + sh[p], 0);
    others.forEach(p => sh[p] -= d * sh[p] / ot); sh[win] = want; }
  const turnout = 0.6 + R() * 0.14 - 0.05 * s.u, tot = Math.round(s.pop * 0.74 * turnout);
  const cands = Object.keys(sh).sort((a, b) => sh[b] - sh[a]).map(p => ({ name: null, party: p, votes: Math.round(tot * sh[p]) }));
  out[s.id] = { cands, pct_in: "100%", turnout: Math.round(turnout * 1000) / 10, aside: aside.sort() };
});
const ranked = id => [...out[id].cands].sort((a, b) => b.votes - a.votes);
const marginOf = id => { const c = ranked(id), t = c.reduce((a, x) => a + x.votes, 0); return (c[0].votes - (c[1] ? c[1].votes : 0)) / t; };

// ---------- place named people
const namedSeat = {}; // seat id -> [{name, party, win}]
const placed = [];
const winnersFirst = [...NAMED.filter(n => n.win !== false)].sort((a, b) => SAFE_SEAT.has(b.name) - SAFE_SEAT.has(a.name));
winnersFirst.forEach(n => {
  let seats = S.filter(s => s.region === n.region && ranked(s.id)[0].party === n.party && !ranked(s.id)[0].name);
  if (SAFE_SEAT.has(n.name)) seats.sort((a, b) => marginOf(b.id) - marginOf(a.id)); // leaders sit in their party's safest seat
  const s = seats[0]; if (!s) throw `no ${n.party} seat left in ${n.region} for ${n.name}`;
  ranked(s.id)[0].name = n.name; (namedSeat[s.id] = namedSeat[s.id] || []).push(n);
  if (LEADERS.has(n.name)) out[s.id].leader = n.name;
  placed.push(`${n.name} (${n.party}) ${n.region} / ${s.name}: won${LEADERS.has(n.name) ? " [leader]" : ""}`);
});
NAMED.filter(n => n.win === false).forEach(n => {
  const regSeats = S.filter(s => s.region === n.region);
  let s = regSeats.find(s => forced[s.i] === n.party && out[s.id].cands.some(c => c.party === n.party && !c.name))
    || regSeats.find(s => out[s.id].cands.some((c, k) => c.party === n.party && !c.name && ranked(s.id)[0] !== c));
  let cand;
  if (s) cand = out[s.id].cands.find(c => c.party === n.party && !c.name);
  else { // party not standing anywhere suitable: add them as a strong runner-up (independents)
    s = regSeats.find(s => !namedSeat[s.id]); const r = out[s.id], c = ranked(s.id);
    r.cands = r.cands.filter(x => x !== c[c.length - 1]);
    cand = { name: null, party: n.party, votes: Math.round(c[0].votes * (0.88 + R() * 0.08)) }; r.cands.push(cand);
  }
  cand.name = n.name; (namedSeat[s.id] = namedSeat[s.id] || []).push(n);
  placed.push(`${n.name} (${n.party}) ${n.region} / ${s.name}: lost, place ${ranked(s.id).indexOf(cand) + 1}`);
});

// ---------- the previous election: story-driven flips
// Each rule: [label, quota, predicate(seat, winner, runnerUp)] -> previous winner = runner-up. Narrow seats first.
const lock = new Set(Object.entries(namedSeat).filter(([id, ns]) => ns.some(n => n.party === "DM" || LEADERS.has(n.name))).map(([id]) => id));
const prev = {}; S.forEach(s => prev[s.id] = ranked(s.id)[0].party);
// prev(seat, ranked candidates, total votes) -> previous winner, or null. "close(p)" = p finished within 12 points of the winner.
const DGC = ["Reno", "Montiablo", "Ventura"];
const FLIPS = [
  ["Liberal pact takes the DGC-era suburbs (NPP/RE gain from DEM)", 5, (s, w, close) => ["NPP", "RE"].includes(w) && s.u > 0.2 && s.u < 0.9 && close("DEM")],
  ["Labour heartland cracks in the countryside (gain from DEM)", 3, (s, w, close) => ["AC", "PP", "REG"].includes(w) && s.u < 0.5 && close("DEM")],
  ["Left pact squeezes the Democrats (SDA/REJ gain from DEM)", 3, (s, w, close) => ["SDA", "REJ"].includes(w) && close("DEM")],
  ["Mezata's split left lets Renaissance through (RE gain)", 2, (s, w, close) => s.region === "Mezata" && w === "RE" && (close("DEM") || close("SDA") || close("REJ"))],
  ["Myrati independent unseats a Democrat (IND gain)", 1, (s, w, close) => w === "IND" && close("DEM")],
  ["Avenir overtakes the People's Party in the hinterland (AC took over a PP seat)", 3, (s, w) => w === "AC" && s.u < 0.6 && "PP"],
  ["Centrists win a right-wing seat (NPP/RE gain from PP/AC)", 1, (s, w, close) => ["NPP", "RE"].includes(w) && (close("PP") || close("AC"))],
  ["DGC-wing suburbs hold firm (DEM gain from the right)", 3, (s, w, close) => w === "DEM" && DGC.includes(s.region) && (close("RE") || close("NPP") || close("PP") || close("AC"))],
  ["Chasmia's split right lets a Democrat in (DEM gain)", 1, (s, w, close) => w === "DEM" && s.region === "Chasmia" && (close("RE") || close("PP") || close("AC"))],
];
const flipLog = [];
FLIPS.forEach(([label, quota, rule]) => {
  const picks = [];
  S.filter(s => !lock.has(s.id) && prev[s.id] === ranked(s.id)[0].party)
    .map(s => { const c = ranked(s.id), t = c.reduce((a, x) => a + x.votes, 0);
      const close = p => { const x = c.find(y => y.party === p); return x && x !== c[0] && (c[0].votes - x.votes) / t < 0.12 ? p : false; };
      const res = rule(s, c[0].party, close); return res ? { s, p: res === true ? null : res, m: marginOf(s.id) } : null; })
    .filter(Boolean).sort((a, b) => a.m - b.m).slice(0, quota)
    .forEach(({ s, p }) => { prev[s.id] = p; picks.push(s.name + " (from " + p + ")"); });
  flipLog.push(`${label}: ${picks.length}/${quota}${picks.length ? " — " + picks.join(", ") : ""}`);
});

// ---------- fill remaining names, incumbents
S.forEach(s => {
  const r = out[s.id], c = ranked(s.id);
  c.forEach(x => { if (!x.name) x.name = namer(s.region, s.u); });
  r.prev = prev[s.id];
  if (prev[s.id] === c[0].party) { if ((namedSeat[s.id] || []).some(n => n.name === c[0].name) || R() < 0.85) r.inc = c[0].name; }
  else { const def = c.find(x => x.party === prev[s.id]); if (def && R() < 0.85) r.inc = def.name; }
  r.cands = c;
});

// ---------- report + write
const tally = (f) => { const t = {}; S.forEach(s => { const p = f(s); t[p] = (t[p] || 0) + 1; }); return t; };
const now = tally(s => out[s.id].cands[0].party), before = tally(s => out[s.id].prev);
console.error(placed.join("\n"));
console.error("\n" + flipLog.join("\n"));
console.error("\nseats now   ", JSON.stringify(now));
console.error("seats before", JSON.stringify(before));
console.error("flips", S.filter(s => out[s.id].prev !== out[s.id].cands[0].party).length);
const lines = html.split(/\r?\n/); const k = lines.findIndex(l => l.startsWith("const RESULTS = "));
if (k < 0) throw "RESULTS line not found";
lines[k] = "const RESULTS = " + JSON.stringify(out) + ";";
fs.writeFileSync(FILE, lines.join("\n"));
console.error("index.html updated");
