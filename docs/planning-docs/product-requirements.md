# Product Requirements

## Goal

Enable users to select local audio files, compare them with a Spotify playlist or album in its intended order, review the proposed matches and filenames, then rename the selected files safely and undo the operation when needed.

## MVP Users

People who download music with SpotDL or similar tools and need local filenames to reflect Spotify ordering without renaming tracks one by one.

## In Scope

- Linux and Windows desktop builds.
- A formless desktop workspace organized around persistent navigation and direct manipulation rather than a traditional wizard or form sequence.
- A custom top toolbar containing the TrackAlign title and app control buttons.
- The TrackAlign app icon uses Lucide `ListOrdered` in the custom titlebar and a matching native window/taskbar asset.
- A collapsible left navigation rail containing icon buttons for all primary pages and actions, using the Lucide icon library. The expanded rail is 240-280px wide.
- A far-left top-toolbar collapse button, before the app title, that cycles navigation through expanded rail, icon-only rail, and toolbar-navigation modes. In toolbar-navigation mode, all navigation icons appear in a button group immediately after the title; another toggle restores the expanded rail.
- A Settings page for user preferences.
- Four light and four dark appearance presets, including the existing greenish dark mode and a VS Code Default Dark-inspired option. The selected preset persists between launches and is configured in Settings.
- A context-sensitive Help button on every page that opens a right-side slide-out Help panel.
- A More menu containing Restart TrackAlign, Changelog, and version information. Changelog opens a structured collapsible panel with only the latest version expanded by default.
- A status bar for current operation, selection, loading, warning, and completion information.
- Folder selection and display of audio files supported by the application: MP3, FLAC, OGG, and M4A.
- Per-file selection, including Select All and Select None.
- Spotify OAuth login and authorization-aware access to public and private playlists.
- OAuth uses PKCE. Users authorize TrackAlign through Spotify and never enter a Spotify password or client secret into the app.
- The app requests only the scopes needed for the selected workflow, including private and collaborative playlist-read access when required.
- Loading a Spotify playlist or album by URL.
- Reading title, artist, album, year, track number, and duration where available.
- Matching selected local files to Spotify tracks using metadata and filename fallback.
- Review of every proposed match, including confidence and expected filename.
- Manual correction or removal of a proposed match before renaming.
- User-configurable rename templates using fields such as artist, album, title, track number, and year.
- Safe rename execution with collision suffixes rather than overwriting existing files.
- Undo history for multiple completed rename operations.
- Hidden audio files shown with distinct visual treatment; unsupported non-audio files hidden from the inventory.
- Visible read-only or otherwise unrenameable file warnings when a folder is loaded.
- Symbolic links are ignored and reported in the folder inventory summary.

## Out of Scope for MVP

- macOS distribution.
- Downloading audio from Spotify or any other service.
- Editing embedded audio metadata.
- Automatic synchronization of a local library after the initial rename.
- Cloud storage or multi-device operation.
- Batch processing of multiple folders in one operation.
- Dynamic/action-oriented Help content beyond static contextual documentation.

## Functional Requirements

### FR-0: Provide the Application Shell

The application presents a persistent shell with a custom top toolbar, left navigation rail, page content area, contextual Help panel, and status bar. Page transitions must preserve relevant in-progress work unless the user explicitly discards it.

The primary workflow should feel like a direct-manipulation workspace: users can inspect, select, compare, and adjust files from the relevant page without being forced through a rigid wizard sequence.

### FR-0.1: Navigate Primary Pages

The left rail provides icon buttons for all primary pages. Each icon has an accessible name and tooltip. The initial page set includes the workspace/review page, Settings, and any additional pages needed by the implementation. The active page is visually clear.

### FR-0.2: Configure Preferences

The Settings page allows users to customize supported preferences, including the rename template, appearance mode, and other app behavior selected during implementation. Settings must be persisted locally and have clear defaults and reset behavior.

### FR-0.3: Provide Contextual Help

Every page includes a Help icon button. Selecting it opens a right-side slide-out panel containing help relevant to the current page and state. The panel can be closed without losing work and must not obscure essential controls without an available way to dismiss or resize it.

Help is static documentation in the initial release. The Help and Changelog panels may be resized up to 40% of the app window width. The left navigation rail is not resizable.

### FR-0.3.1: Provide Global App Menu

The More menu provides Restart TrackAlign, Changelog, and version information. Changelog opens in a structured panel using collapsible version sections, with only the latest version expanded by default. Changelog expansion state does not need to persist.


### FR-0.4: Display Status

The status bar displays specific current information such as selected folder, file counts, Spotify collection state, matching progress, warnings, rename results, and undo availability. Status updates must distinguish normal information, warnings, errors, and in-progress work.

### FR-1: Load Local Files

The user can choose a folder and see supported audio files with their current filenames and readable metadata. Hidden audio files are included and visually distinguished. Unsupported non-audio files are hidden. Read-only or otherwise unrenameable files are visibly flagged when the folder is loaded, and cannot be silently treated as safe to rename.

### FR-2: Load Spotify Collection

The user can authenticate with Spotify, enter a playlist or album URL, and load the ordered track list. OAuth is also used for public collection access where the API requires an access token, not only for private playlists. The application must explain authorization failures, missing scopes, expired sessions, rate limits, and unavailable collections. Spotify client secrets and user passwords must never be requested or stored by the renderer.

### FR-3: Generate Matches

The application proposes at most one selected local file for each collection occurrence and at most one collection occurrence for each local file. It uses metadata, filename fallback, and duration as matching evidence. Duplicate Spotify tracks are distinct occurrences identified by playlist position. Playlist numbering follows playlist position; album numbering follows album track order. Numbering preserves source positions, including gaps caused by excluded or unmatched tracks.

### FR-4: Review Matches

The review table shows at minimum current filename, expected filename, matched Spotify track, confidence, and status. Every proposed match is visible, including high- and low-confidence results.

### FR-5: Correct the Plan

The user can change a file's matched track, leave a file unmatched, exclude files, and inspect or resolve unmatched collection tracks. Selection determines which files are renamed.

### FR-6: Configure Names

The user can configure a rename template using both token editing and a visual template builder, then preview the resulting filename for every selected file. Missing fields are omitted. The original extension is preserved.

### FR-7: Apply Renames

The application validates the complete rename plan before changing files. Existing target names are preserved; collisions receive a deterministic suffix. Partial failures are reported with per-file status.

### FR-8: Undo

After a successful or partially successful operation, the user can choose from retained rename-operation history and undo an operation represented by its manifest. Undo must never overwrite a newer file without explicit handling and explanation.

## Quality Requirements

- Never overwrite an existing file silently.
- Do not rename files until the user explicitly confirms the reviewed plan.
- Keep filesystem work in the main process and expose only narrow, validated IPC operations.
- Preserve file extensions unless the user explicitly configures otherwise in a future version.
- Make network, authorization, parsing, matching, and filesystem failures actionable.
- Keep a local history of operation manifests sufficient to undo multiple rename operations.
