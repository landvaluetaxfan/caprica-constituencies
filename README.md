# Caprica — 203 Constituencies (Draft)

An interactive draft map of the Caprican House of Representatives' 203 single-member constituencies, drawn from the 17 regional seat allocations.

- `index.html` — the interactive map (hover or tap a seat for its details; metropolitan insets; region, results and population-balance views)
- `Caprica_203_Constituencies_Draft.svg` — the editable boundary file, in the election-map app's format
- `caprica_constituencies.csv` — seat list with names, estimated populations and deviation from each region's quota

## Adding results

Results go in the `RESULTS` object near the top of the script in `index.html`, keyed by seat id (listed in the CSV's `id` column). Party colours go in `PARTY_COLORS`. Until results are entered, the Results view shows labelled demo data.

The boundaries and names are drafts and will change region by region.
