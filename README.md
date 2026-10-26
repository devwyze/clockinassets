# CLOCK IN Assets

Public images and NFT metadata for **CLOCK IN** badges on Solana. The CLOCK IN program stores URLs to these files on-chain when it mints a badge, so everything here is public and served through [jsDelivr](https://www.jsdelivr.com/) from a pinned commit.

## Layout

```
collection.json        Metadata for the "CLOCK IN Badges" collection NFT
images/
  collection.png       Collection cover art
  0_intern.png … 7_ceo.png    One image per rank (1024×1024, transparent PNG)
metadata/
  0_intern.json … 7_ceo.json  One Metaplex metadata file per rank
scripts/
  pin-urls.mjs         Publishing helper (see below)
```

| Level | Rank | Metadata | Image |
|---|---|---|---|
| 0 | Intern | `metadata/0_intern.json` | `images/0_intern.png` |
| 1 | Analyst | `metadata/1_analyst.json` | `images/1_analyst.png` |
| 2 | Associate | `metadata/2_associate.json` | `images/2_associate.png` |
| 3 | Manager | `metadata/3_manager.json` | `images/3_manager.png` |
| 4 | Director | `metadata/4_director.json` | `images/4_director.png` |
| 5 | VP | `metadata/5_vp.json` | `images/5_vp.png` |
| 6 | SVP | `metadata/6_svp.json` | `images/6_svp.png` |
| 7 | CEO | `metadata/7_ceo.json` | `images/7_ceo.png` |

The NFT's on-chain name is set by the program (`CLOCK IN Badge #<n>`); the `name` in these files is the rank-level name some tools display.

## URLs

Every URL is pinned to a commit, never a branch:

```
https://cdn.jsdelivr.net/gh/<owner>/<repo>@<commit-sha>/<path>
```

A pinned URL always returns the same bytes, so a badge's art can't change after it's minted, and nobody with push access can swap it. To change art, add new files in a new commit and point the program and frontend at the new commit.

## Publishing

URLs inside the JSON point at images, and the program points at the JSON, so it takes two commits:

1. **Push the images.** Commit `images/` (and this README and `scripts/`) and push. Note the commit SHA; this is `<images-commit>`.
2. **Pin and push the metadata:**
   ```bash
   node scripts/pin-urls.mjs pin <owner>/<repo> <images-commit>
   git add collection.json metadata && git commit -m "Pin metadata to images@<images-commit>" && git push
   ```
   Note this commit SHA; this is `<metadata-commit>`.
3. **Check every URL** (jsDelivr can take a minute to see a new commit):
   ```bash
   node scripts/pin-urls.mjs check <owner>/<repo> <metadata-commit>
   ```
4. **Use `<metadata-commit>` in the app repo:**
   - Program `BADGE_URI` (`contract/solana/programs/clock_in/src/constants.rs`):
     `https://cdn.jsdelivr.net/gh/<owner>/<repo>@<metadata-commit>/metadata/0_intern.json`
   - `init_collection` URI at deploy:
     `https://cdn.jsdelivr.net/gh/<owner>/<repo>@<metadata-commit>/collection.json`
   - Frontend image and metadata base URLs (`frontend/src/config/clockin.config.ts`).

## Notes

- New badges always start as Intern, so every badge points at `metadata/0_intern.json` when minted. The other rank files are ready for when metadata follows a badge's rank.
- Traits list only rules the program enforces today (seats, points, tenure, fast-track cost, challenge deposit). Add traits like payroll weight once those features ship.
- Some ranks share art for now (VP/Manager, SVP/Associate, CEO/Director, collection/Intern). Replace any `images/*.png` with new art in a new commit.
- Images are 1024×1024 PNGs, downscaled from 5000×5000 originals.
