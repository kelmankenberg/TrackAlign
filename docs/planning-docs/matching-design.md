# Matching Design

## Inputs

For each local file, normalize:

- title;
- artist and artist list;
- album;
- duration in milliseconds;
- track number and year;
- filename without extension.

For each Spotify track, normalize title, artists, album, duration, track number, year, and collection position.

## Normalization

Normalize case, Unicode punctuation, whitespace, common separators, and filename numbering. Treat common feature markers such as `feat.` and `ft.` consistently. Keep remix, live, version, and edition markers as meaningful evidence, while allowing them to be compared as optional annotations when the base title is otherwise equal.

Do not discard artist or version information permanently; retain the raw values for review and diagnostics.

## Candidate Scoring

Generate candidates using title/filename and artist similarity, then score each candidate with weighted evidence:

- title similarity: primary signal;
- artist similarity: primary signal;
- duration proximity: disambiguator;
- album similarity: supporting signal;
- track number and year: supporting signals;
- filename similarity: fallback when tags are missing or unreliable.

The exact weights should be calibrated with fixtures rather than treated as permanent product policy. The output must include score components or evidence labels so a user can understand why a result was proposed.

## Assignment Rules

Use a global assignment step rather than independently selecting the best track for every file. This reduces duplicate assignments and improves results when several files are similar. Enforce one-to-one assignment for the selected files and collection tracks in the MVP.

If a playlist contains the same Spotify track more than once, represent the occurrences by collection position and make the duplicate behavior an explicit product decision before implementation. The current product assumption is that duplicate tracks are not expected; duplicate local filenames should still be handled as separate files.

## Review Thresholds

Every proposal appears in the review table. Confidence affects sorting, warning state, and suggested manual review; it must not silently remove a result. A low-confidence or ambiguous proposal should be clearly marked and remain editable.

Suggested initial statuses:

- `matched`: strong unique proposal;
- `review`: weak or ambiguous proposal;
- `unmatched`: no acceptable candidate;
- `manual`: user-selected match;
- `excluded`: local file will not be renamed.

Thresholds should be tuned using a representative fixture set containing missing tags, inconsistent punctuation, feature markers, remixes, duplicate artists, and duration differences.
