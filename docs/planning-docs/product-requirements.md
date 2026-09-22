# Product Requirements

## Goal

Enable users to select local audio files, compare them with a Spotify playlist or album in its intended order, review the proposed matches and filenames, then rename the selected files safely and undo the operation when needed.

## MVP Users

People who download music with SpotDL or similar tools and need local filenames to reflect Spotify ordering without renaming tracks one by one.

## In Scope

- Linux and Windows desktop builds.
- Folder selection and display of audio files supported by the application: MP3, FLAC, OGG, and M4A.
- Per-file selection, including Select All and Select None.
- Spotify OAuth login and authorization-aware access to public and private playlists.
- Loading a Spotify playlist or album by URL.
- Reading title, artist, album, year, track number, and duration where available.
- Matching selected local files to Spotify tracks using metadata and filename fallback.
- Review of every proposed match, including confidence and expected filename.
- Manual correction or removal of a proposed match before renaming.
- User-configurable rename templates using fields such as artist, album, title, track number, and year.
- Safe rename execution with collision suffixes rather than overwriting existing files.
- Undo of the most recent completed rename operation.

## Out of Scope for MVP

- macOS distribution.
- Downloading audio from Spotify or any other service.
- Editing embedded audio metadata.
- Automatic synchronization of a local library after the initial rename.
- Cloud storage or multi-device operation.
- Batch processing of multiple folders in one operation.

## Functional Requirements

### FR-1: Load Local Files

The user can choose a folder and see supported audio files with their current filenames and readable metadata. The user can select any subset of the files.

### FR-2: Load Spotify Collection

The user can authenticate with Spotify, enter a playlist or album URL, and load the ordered track list. The application must explain authorization failures and unavailable collections.

### FR-3: Generate Matches

The application proposes at most one selected local file for each playlist/album track and at most one collection track for each local file. It uses metadata, filename fallback, and duration as matching evidence.

### FR-4: Review Matches

The review table shows at minimum current filename, expected filename, matched Spotify track, confidence, and status. Every proposed match is visible, including high- and low-confidence results.

### FR-5: Correct the Plan

The user can change a file's matched track, leave a file unmatched, exclude files, and inspect or resolve unmatched collection tracks. Selection determines which files are renamed.

### FR-6: Configure Names

The user can choose a rename template from supported metadata fields and preview the resulting filename for every selected file. The original extension is preserved.

### FR-7: Apply Renames

The application validates the complete rename plan before changing files. Existing target names are preserved; collisions receive a deterministic suffix. Partial failures are reported with per-file status.

### FR-8: Undo

After a successful or partially successful operation, the user can undo the file changes represented by the operation manifest. Undo must never overwrite a newer file without explicit handling and explanation.

## Quality Requirements

- Never overwrite an existing file silently.
- Do not rename files until the user explicitly confirms the reviewed plan.
- Keep filesystem work in the main process and expose only narrow, validated IPC operations.
- Preserve file extensions unless the user explicitly configures otherwise in a future version.
- Make network, authorization, parsing, matching, and filesystem failures actionable.
- Keep a local operation manifest sufficient to undo the most recent rename operation.
