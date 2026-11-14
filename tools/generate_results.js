// Simulated House results: matches the per-region seat table exactly and places the named people below.
// Usage: node tools/generate_results.js   (rewrites the RESULTS line in index.html)
const fs = require("fs");
const path = require("path"); const FILE = path.join(__dirname, "..", "index.html");
const html = fs.readFileSync(FILE, "utf8");
const line = html.split("\n").find(l => l.startsWith("const DATA = "));
const DATA = JSON.parse(line.slice("const DATA = ".length).replace(/;\s*$/, ""));
const S = DATA.seats; S.forEach((s, i) => s.i = i);

let x = 20261113;
const R = () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 1000000) / 1000000; };
const N = () => (R() + R() + R() - 1.5) / 1.5; // ~[-1,1], bell-ish
const pick = a => a[Math.floor(R() * a.length)];

// cols: REJ SDA ALP DGC DM KNP NPP RE PP AC IND  (ALP+DGC -> DEM, KNP -> REG)
const RAW = {
  Ambarino:[1,1,2,2,2,0,2,1,0,0,0], Ambrosia:[0,0,1,0,1,0,0,1,1,0,0], Cambria:[1,2,1,0,1,0,1,1,0,0,0],
  Carnapol:[0,1,0,1,3,0,2,0,0,1,0], Chasmia:[0,1,1,1,1,0,1,2,1,1,0], "Costa Blanca":[5,3,2,2,1,0,1,1,1,0,0],
  Kalahooska:[1,0,1,1,2,14,2,0,0,1,0], Kazana:[5,7,3,2,2,0,1,1,1,1,0], Mezata:[2,2,1,1,1,0,1,4,2,1,0],
  Moeras:[0,0,0,1,1,0,0,1,0,0,0], Montiablo:[1,1,1,2,1,0,2,3,7,4,0], Myrati:[1,0,1,1,1,0,1,0,0,0,2],
  Oplana:[1,2,1,1,1,0,1,1,1,0,0], Pittston:[0,0,1,0,1,0,2,1,1,1,0], Pleucadeuc:[1,1,1,1,1,0,1,3,3,7,0],
  Reno:[0,1,1,1,1,0,2,1,2,1,0], Ventura:[1,0,1,2,2,0,2,1,1,0,1] };
const T = {};
for (const r in RAW) { const a = RAW[r]; T[r] = { REJ:a[0], SDA:a[1], DEM:a[2]+a[3], DM:a[4], REG:a[5], NPP:a[6], RE:a[7], PP:a[8], AC:a[9], IND:a[10] }; }
const PARTIES = ["DEM","DM","SDA","RE","NPP","PP","REJ","AC","REG","IND"];
const urban = new Set(); DATA.insets.forEach(i => i.ids.forEach(id => urban.add(id)));
const regions = Object.keys(DATA.regions);
regions.forEach(r => { const n = S.filter(s => s.region === r).length, t = Object.values(T[r]).reduce((a,b)=>a+b,0); if (n !== t) throw `${r}: ${n} seats vs ${t}`; });
const lean = {};
regions.forEach(r => { lean[r] = {}; PARTIES.forEach(p => lean[r][p] = N() * 0.05); lean[r].REG = r === "Kalahooska" ? 0.25 : ["Ambrosia","Moeras","Cambria"].includes(r) ? -0.08 : -0.4; lean[r].IND = T[r].IND ? -0.02 : -0.5; });
const URB = { DEM: 0.05, DM: 0.06, NPP: 0.04, SDA: 0.01, RE: 0.0, PP: -0.04, REJ: -0.03, AC: -0.02, REG: -0.02, IND: 0 };
const base = { DEM: 0.2, DM: 0.18, SDA: 0.18, RE: 0.18, NPP: 0.17, PP: 0.17, REJ: 0.16, AC: 0.15, REG: 0.10, IND: 0.08 };
const sc = S.map(s => { const o = {}; PARTIES.forEach(p => o[p] = base[p] + lean[s.region][p] + (urban.has(s.i) ? URB[p] : -URB[p] * 0.5) + N() * 0.06); return o; });
const off = {}; regions.forEach(r => { off[r] = {}; PARTIES.forEach(p => off[r][p] = 0); });
const elig = (r, p) => p !== "IND" || T[r].IND > 0;
const val = (i, p) => sc[i][p] + off[S[i].region][p];
const winner = i => { const r = S[i].region; let b = null, bv = -9; PARTIES.forEach(p => { if (!elig(r, p)) return; const v = val(i, p); if (v > bv) { bv = v; b = p; } }); return b; };
regions.forEach(r => {
  const idx = S.filter(s => s.region === r).map(s => s.i);
  const counts = () => { const c = {}; PARTIES.forEach(p => c[p] = 0); idx.forEach(i => c[winner(i)]++); return c; };
  for (let it = 0; it < 3000; it++) { const c = counts(); let done = true;
    PARTIES.forEach(p => { if (!elig(r, p)) return; const d = T[r][p] - c[p]; if (d) done = false; off[r][p] += 0.0015 * d; }); if (done) break; }
  for (let g = 0; g < 300; g++) { const c = counts(); const under = PARTIES.find(p => c[p] < T[r][p]); if (!under) break;
    const overs = PARTIES.filter(p => c[p] > T[r][p]); let best = null, gap = 9;
    idx.forEach(i => { const w = winner(i); if (!overs.includes(w)) return; const d = val(i, w) - val(i, under); if (d < gap) { gap = d; best = i; } });
    sc[best][under] += gap + 0.004 + R() * 0.01; }
  const c = counts(); PARTIES.forEach(p => { if (c[p] !== T[r][p]) throw `fit failed ${r} ${p}`; });
});


// names
const POOLS = {
  welsh: [["Rhys","Carys","Owain","Seren","Gethin","Nia","Dafydd","Ffion","Iestyn","Lowri","Emrys","Mared"],["Pryce","Llewellyn","Morgan","Vaughan","Rees","Griffiths","Bowen","Hughes","Prosser","Gwynne","Meredith","Tudor"]],
  french: [["Élodie","Mathis","Camille","Théo","Margaux","Julien","Solène","Antoine","Clémence","Rémi","Inès","Bastien","Aurélie","Gaël","Maëlle","Yannick"],["Lefebvre","Morel","Dufresne","Bélanger","Kerbrat","Le Goff","Gauthier","Tremblay","Rousseau","Picard","Lacroix","Fournier","Le Roux","Moreau","Ouellet","Brassard"]],
  spanish: [["Alejandro","Lucía","Mateo","Valentina","Diego","Ximena","Rafael","Camila","Joaquín","Paloma","Esteban","Marisol","Tomás","Inés","Andrés","Rocío"],["Herrera","Castillo","Navarro","Ortega","Salazar","Delgado","Fuentes","Vidal","Montoya","Ibarra","Cabrera","Serrano","Quintero","Robles","Aguilar","Paredes"]],
  portuguese: [["João","Beatriz","Tiago","Mariana","Rui","Leonor","Duarte","Inês","Gonçalo","Carolina","Afonso","Matilde"],["Ferreira","Moura","Carvalho","Teixeira","Lacerda","Pimentel","Barros","Azevedo","Cardoso","Magalhães","Sequeira","Valente"]],
  dutch: [["Daan","Femke","Joris","Sanne","Pieter","Lotte","Bram","Anouk"],["de Vries","van Dijk","Bakker","Visser","Smit","Mulder","van Leeuwen","Hendriks"]],
  anglo: [["Eleanor","Marcus","Harriet","Callum","Imogen","Declan","Priya","Theo","Rosalind","Jonah","Abigail","Nathaniel","Maeve","Desmond","Wren","Felix","Tamsin","Graham","Odette","Silas"],["Ashworth","Pemberton","Calloway","Whitcombe","Okafor","Hartigan","Lindqvist","Fairbanks","Thorne","Mercer","Galloway","Brennan","Holloway","Achebe","Sutcliffe","Kingsley","Rowntree","Castellan","Vance","Ellery"]],
};
const RPOOL = { Myrati: "welsh", Chasmia: "french", Ambarino: "french", Carnapol: "french", Pleucadeuc: "french", Mezata: "spanish", Ventura: "spanish", "Costa Blanca": "spanish", Pittston: "spanish", Oplana: "spanish", Kazana: "portuguese", Moeras: "dutch" };
const used = new Set();
function name(region) {
  for (let k = 0; k < 50; k++) {
    const pool = POOLS[R() < 0.75 ? (RPOOL[region] || "anglo") : pick(["anglo", "spanish", "french"])];
    const n = pick(pool[0]) + " " + pick(pool[1]);
    if (!used.has(n)) { used.add(n); return n; }
  }
  let n = pick(POOLS.anglo[0]) + " " + pick(POOLS.anglo[1]) + "-" + pick(POOLS.anglo[1]);
  for (let k = 0; used.has(n); k++) n = n.replace(/-[^-]+$/, "") + "-" + POOLS.anglo[1][k % POOLS.anglo[1].length] + (k >= POOLS.anglo[1].length ? " " + k : "");
  used.add(n); return n;
}

const out = {};
let flips = 0;
S.forEach((s, i) => {
  let entries = PARTIES.filter(p => elig(s.region, p)).map(p => [p, val(i, p)]);
  if (lean[s.region].REG < -0.2) entries = entries.filter(e => e[0] !== "REG");
  entries.sort((a, b) => b[1] - a[1]);
  const nC = 5 + Math.floor(R() * 2);
  entries = entries.slice(0, nC);
  const floor = 0.015;
  let w = entries.map(([p, v], k) => Math.max(floor + (nC - k) * 0.002, v));
  // sharpen a bit so winners get realistic shares (~30-50%)
  w = entries.map(([p, v]) => Math.exp(24 * v));
  const sum = w.reduce((a, b) => a + b, 0);
  const turnout = 0.58 + R() * 0.17, electorate = s.pop * 0.74;
  const tot = Math.round(electorate * turnout);
  const cands = entries.map(([p], k) => ({ name: name(s.region), party: p, votes: Math.round(tot * w[k] / sum) }));
  const win = cands[0].party, ru = cands[1].party;
  const margin = (cands[0].votes - cands[1].votes) / tot;
  let prev = win;
  if (win === "IND") prev = R() < 0.5 ? ru : "IND";
  else if (margin < 0.05 && R() < 0.3) prev = ru;
  else if (margin < 0.1 && R() < 0.07) prev = ru;
  if (prev !== win) flips++;
  const res = { cands, pct_in: "100%", prev, turnout: Math.round(turnout * 1000) / 10 };
  const incC = cands.find(c => c.party === prev);
  if (incC && R() < 0.82) res.inc = incC.name;
  out[s.id] = res;
});
console.error("flips", flips);

// ---- real people supplied by the user.
// Default: they won a seat in that region for that party. win:false = ran and lost
// (renames that party's losing candidate in some seat, or adds them as a close runner-up).
// Winners are placed before losers, in list order; the script fails if a region runs out of seats for a party.
const NAMED = [
  { name: "Kerri Bouvier", region: "Ambarino", party: "REJ" },
  { name: "Rainier Leclerc", region: "Ambarino", party: "DEM", win: false }, // the full Democratic list fills all 4 Ambarino seats
  { name: "Yeeun Bluespan II", region: "Ambarino", party: "IND", win: false },
  { name: "Alina Charliennes", region: "Ambrosia", party: "DEM" },
  { name: "Minette Niamh", region: "Moeras", party: "DEM", win: false }, // Moeras's one Democratic seat goes to Christian Lindner
  // People's Party (House)
  { name: "Alistair Foulke-McKeon", region: "Ambrosia", party: "PP" },
  { name: "Jon Fraser", region: "Montiablo", party: "PP" },
  { name: "Sarah Palin", region: "Montiablo", party: "PP" },
  { name: "Walter Black", region: "Reno", party: "PP" },
  // Renaissance
  { name: "Sejin Bluespan", region: "Ambarino", party: "RE" },
  { name: "Eduardo DiValera", region: "Cambria", party: "RE" },
  { name: "Joe Azhadron", region: "Carnapol", party: "RE", win: false },
  { name: "John Phillip Stanford", region: "Chasmia", party: "RE" },
  { name: "Rupert Pagi Shaw", region: "Kalahooska", party: "RE", win: false },
  { name: "Darth Ron Paul", region: "Mezata", party: "RE" },
  { name: "Mariah Minogue", region: "Moeras", party: "RE" },
  { name: "Bak Ki-Ha", region: "Moeras", party: "RE", win: false },
  { name: "JB Stoner", region: "Myrati", party: "RE", win: false },
  { name: "Tony Blair", region: "Oplana", party: "RE" },
  { name: "Kate Masto", region: "Pittston", party: "RE" },
  { name: "Daichi van Ryneveld", region: "Pleucadeuc", party: "RE" },
  { name: "Mathieu Jeon", region: "Pleucadeuc", party: "RE" },
  { name: "Jean-Jacques LeRoy-Du Lac", region: "Pleucadeuc", party: "RE" },
  { name: "Roberto Libero", region: "Reno", party: "RE" },
  { name: "Myat Noe Win", region: "Reno", party: "RE", win: false },
  { name: "Robert Bluespan", region: "Ventura", party: "RE" },
  // Democracy Manifest MPs standing for re-election (inc: incumbent, so the seat is a hold)
  ...[["Ambarino","Maria Carter"],["Ambarino","Oliver Williams"],["Ambrosia","Elizabeth Harris"],["Cambria","Amelia McLean"],
      ["Carnapol","Cordelia Lynn Edinburgh"],["Carnapol","Robyn Pantic-Slater"],["Carnapol","Avery Sladen"],["Chasmia","Donna Christensen"],
      ["Costa Blanca","Tomomi Kawaguchi"],["Kalahooska","Klara Ludvigsson"],["Kalahooska","Sandy Barber"],["Kazana","Cheryl Williamson"],
      ["Kazana","Jacqui Karlson"],["Mezata","Ignacio Díaz"],["Moeras","James Wilson"],["Montiablo","Geraldine Trent"],
      ["Myrati","Sophie Jean-Larsson"],["Oplana","Meredith Astor"],["Pittston","Shirley Ballas"],["Pleucadeuc","Ophélie Merrine"],
      ["Reno","Christina McElroy"],["Ventura","Sydney Kostas Pastry II"],["Ventura","Nicholas Jakobssen"]]
    .map(([region, name]) => ({ name, region, party: "DM", inc: true })),
  // Democrats (full list of winners; Ambrosia's Alina Charliennes is above, Cambria's is unnamed)
  ...Object.entries({
    Ambarino: ["Jordan Montgomery", "Ezequiel Duran", "Corey Seager", "Cam Cauley"],
    Carnapol: ["Marion Wheeler"],
    Chasmia: ["Ghislaine Plessis", "Marina Sadoul"],
    "Costa Blanca": ["David Davalillo", "Robert Garcia", "Ricardo Obrero", "Madeline Blair Flash"],
    Kalahooska: ["Donald Trump", "Jackson G. Smith"],
    Kazana: ["Luna Day", "Winston Santos", "Ben Peoples", "Sophia Hammerschmidt", "Diane Poulin"],
    Mezata: ["Lina Castrillón", "Maria Jose Padrón"],
    Moeras: ["Christian Lindner"],
    Montiablo: ["Alphonse de Bourbon", "Jose Manuel Mesonero", "Jack Leiter"],
    Myrati: ["Dafydd Jenkins", "Branwyn Stackpoole"],
    Oplana: ["Cagney Metzger", "Amanda F. Jenkins"],
    Pittston: ["MacKenzie Gore"],
    Pleucadeuc: ["René Cellier", "Céleste Du Toit"],
    Reno: ["Gavin Collyer", "Nathan Eovaldi"],
    Ventura: ["Erika Hasumi-Inaba", "Jacob Latz", "John Wyatt Langford"],
  }).flatMap(([region, names]) => names.map(name => ({ name, region, party: "DEM" }))),
];
const sorted = c => [...c].sort((a, b) => b.votes - a.votes);
const namedIn = {}; // seat id -> count of named people placed there
const used2 = new Set(); // "seat|party"
const placed = [];
[...NAMED.filter(n => n.win !== false), ...NAMED.filter(n => n.win === false)].forEach(n => {
  const seats = S.filter(s => s.region === n.region && !used2.has(s.id + "|" + n.party))
    .sort((a, b) => (namedIn[a.id] || 0) - (namedIn[b.id] || 0));
  let s, cand;
  if (n.win !== false) {
    s = seats.find(s => !(namedIn[s.id] && sorted(out[s.id].cands)[0].named) && sorted(out[s.id].cands)[0].party === n.party);
    if (!s) throw "no " + n.party + " seat left in " + n.region + " for " + n.name;
    cand = sorted(out[s.id].cands)[0];
  } else {
    s = seats.find(s => out[s.id].cands.some((c, k) => c.party === n.party && sorted(out[s.id].cands)[0] !== c));
    if (s) cand = out[s.id].cands.find(c => c.party === n.party);
    else {
      s = seats[0]; if (!s) throw "no seat for " + n.name;
      const r = out[s.id], c = sorted(r.cands);
      r.cands = r.cands.filter(x => x !== c[c.length - 1]);
      cand = { party: n.party, votes: Math.round(c[0].votes * (0.9 + R() * 0.06)) }; r.cands.push(cand);
    }
  }
  const r = out[s.id];
  if (r.inc && r.inc === cand.name) r.inc = n.name;
  cand.name = n.name; cand.named = true;
  if (n.inc) { r.inc = n.name; if (n.win !== false) r.prev = n.party; }
  namedIn[s.id] = (namedIn[s.id] || 0) + 1; used2.add(s.id + "|" + n.party);
  placed.push(`${n.name} (${n.party}) ${n.region} / ${s.name}: ${sorted(r.cands)[0] === cand ? "won" : "lost"}`);
});
Object.values(out).forEach(r => r.cands.forEach(c => delete c.named));
console.error(placed.join("\n"));

const lines = html.split(/\r?\n/); const k = lines.findIndex(l => l.startsWith("const RESULTS = "));
if (k < 0) throw "RESULTS line not found";
lines[k] = "const RESULTS = " + JSON.stringify(out) + ";";
fs.writeFileSync(FILE, lines.join("\n"));
console.error("index.html updated");
