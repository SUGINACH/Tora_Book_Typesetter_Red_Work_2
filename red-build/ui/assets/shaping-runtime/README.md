# RED shaping runtime assets

Hash-locked assets exported by the Node/classic-Worker compatibility build.
This staged artifact does not activate shaping in the RED production engine.

- HarfBuzzJS package: harfbuzzjs@1.6.4; pinned dist files only.
- Unicode itemizer: Unicode 18.0.0 from servo/unicode-bidi revision 9a8c7b03be01def5cf7014b89d5af90f7382fdad.
- No fonts are included. Production FontResolver must supply bytes and verify full source hashes.
- Raw WOFF2 shaping remains unsupported; normalize to SFNT first.
- Tight ink bounds are not included; control bounds must not be presented as ink bounds.
- Current analytic outline proof covers cubic CFF M/L/C/Z; quadratic outlines remain unproven.
