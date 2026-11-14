# Caprica — 203 Constituencies (Draft)

An interactive draft map of the Caprican House of Representatives' 203 single-member constituencies, drawn from the 17 regional seat allocations.

- `index.html` — the interactive map (hover or tap a seat for its details; metropolitan insets; region, results and population-balance views)
- `Caprica_203_Constituencies_Draft.svg` — the editable boundary file, in the election-map app's format
- `caprica_constituencies.csv` — seat list with names, estimated populations and deviation from each region's quota

## Results

The Results view has two elections: **2080 · Live** (the default) and the **2076 general election** (open it with `#2076`).

**2080 · Live** reads the published count sheet every five minutes: the share of each region counted so far and each party's share of it, plus the national popular vote. Seat results are simulated from that: each seat starts from its 2076 result (mapped onto the 2080 parties by `MAP_EX_2080`; Renaissance and the New Progressives fight 2080 as part of Convergence), swings with its region, and reports at its own pace. How many seats each party leads in follows the sheet's seat table for each region (the last complete table is kept if a fetch comes back blank). Seats are called only when most of the vote is in and the lead is safe. Sitting MPs stand again for their successor party; other candidates come from `tools/generate_2080.js`. If the sheet cannot be reached, a saved snapshot (`LIVE_SNAPSHOT`) is used.


The Results view lays the page out to fit the window: metropolitan insets stacked on the left, the main map in the middle, and on the right the House seat totals with a list of every constituency (vote-share bar coloured by party, with gains/flips tagged and filterable).

Results live in the `RESULTS` line of `index.html`, keyed by seat id (the CSV `id` column). Party codes and colours are in `PARTIES`. Each seat has `cands` (name, party code, votes), `prev` (the notional previous winner, which drives the flip tags) and optional `turnout`/`inc`.

The current results are **simulated**. `tools/generate_results.js` builds them from the seat table for each region (the player-NPC sheet), a regional left-right lean, how urban each seat is and each party's base. It applies the electoral pacts (SDA/Rejuvenation, NPP/Renaissance and Avenir/People's Party never stand against each other), invents a previous election from story rules (the `FLIPS` list) and places the named player NPCs from its `NAMED` list. Everyone else gets a name from `tools/names.js`. Edit either file, then run `node tools/generate_results.js` to rewrite `index.html`.

Each constituency has a one-line description in `SEAT_NOTES` and each region a note in `REGION_NOTES` (both in `index.html`). The sentence on how a seat voted is written from the results when it is shown, so it stays correct if the results are regenerated.

The boundaries and names are drafts and will change region by region.
