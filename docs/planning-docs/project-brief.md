Project Brief: Desktop App for Renaming Local Audio Files to Match Spotify Playlist Order

Problem:
SpotDL (a popular Spotify-to-MP3 downloader) does not preserve playlist track order when downloading files. It downloads tracks in parallel, resulting in files saved in unpredictable order. There is no built-in way to number or sequence the output files to match the original playlist sequence.

Solution:
A lightweight Electron desktop application that:

Accepts a folder of local audio files (MP3, FLAC, OGG, M4A)
Accepts a Spotify playlist URL
Fetches the playlist's track list (in order) via the Spotify Web API
Fuzzy-matches each local file's metadata (title, artist, duration) to its corresponding playlist track
Presents a review table showing each file ↔ matched track ↔ confidence score
Allows the user to manually correct mismatches or drag-to-reorder
Renames files sequentially in playlist order (e.g., 01 - Artist - Title.mp3)
Technical Stack:

Electron — desktop shell
Node.js — backend logic
Spotify Web API (via spotify-web-api-node package) — fetch playlist tracks in order; requires free OAuth token from Spotify Developer Dashboard
music-metadata (Node.js) — read ID3/FLAC tags from local audio files
Fuzzy matching — string-similarity or fuzzy library for title/artist comparison, with duration_ms as a tiebreaker
fs.renameSync — apply sequential numbering to filenames
Key Challenge:
The matching step is the hardest part. Title/artist strings won't always align perfectly (e.g., "feat." vs. "ft.", remix labels, missing or inconsistent tags). A review UI where the user can manually assign unmatched files or drag-to-reorder is essential. Duration matching helps disambiguate when multiple versions of a track exist.

Prior Art / References:

SpotifyMatcher (GitHub) — matches local files to Spotify tracks
integrating-local-music-library-to-spotify (GitHub) — matches via ID tags or filename, scores with string-similarity
spotify-matcher (GitHub) — reusable JS module for metadata→Spotify ID matching
App Name Candidates:
Align, TrackAlign, SeqTrack, TrackFlow, Orderly, Seq

One-line description:

Match local audio files to a Spotify playlist and rename them in track order.

Target User:
Anyone who downloads music via SpotDL (or similar tools) and wants their local library organized to match the original playlist sequence without manual file renaming.