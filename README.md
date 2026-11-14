# Caprica — 203 Constituencies (Draft)

An interactive draft map of the Caprican House of Representatives' 203 single-member constituencies, drawn from the 17 regional seat allocations.

- `index.html` — the interactive map (hover or tap a seat for its details; metropolitan insets; region, results and population-balance views)
- `Caprica_203_Constituencies_Draft.svg` — the editable boundary file, in the election-map app's format
- `caprica_constituencies.csv` — seat list with names, estimated populations and deviation from each region's quota

## Results

The Results view lays the page out to fit the window: metropolitan insets stacked on the left, the main map in the middle, and on the right the House seat totals with a list of every constituency (vote-share bar coloured by party, with gains/flips tagged and filterable).

Results live in the `RESULTS` line of `index.html`, keyed by seat id (the CSV `id` column). Party codes and colours are in `PARTIES`. Each seat has `cands` (name, party code, votes), `prev` (the notional previous winner, which drives the flip tags) and optional `turnout`/`inc`.

The current results are **simulated**. `tools/generate_results.js` builds them to match the seat table for each region exactly, and places the named real candidates listed in its `NAMED` array. Edit that list, then run `node tools/generate_results.js` to rewrite `index.html`.

The boundaries and names are drafts and will change region by region.
