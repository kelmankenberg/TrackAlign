# Architecture

## Proposed Structure

- **Electron main process**: window lifecycle, secure IPC handlers, OAuth callback coordination, Spotify API calls, filesystem access, metadata extraction, matching orchestration, rename execution, and operation manifests.
- **React renderer**: the persistent app shell and stateful workspace for folder selection, Spotify source loading, review, template editing, confirmation, completion, undo, Settings, contextual Help, and status reporting.
- **Shared domain layer**: typed models and pure functions for collection tracks, local files, match candidates, rename plans, template rendering, sanitization, and validation.

## Renderer Shell

The renderer should implement a persistent shell with:

- a custom top toolbar containing the far-left navigation collapse button, app title, and global control buttons;
- a left navigation rail with Lucide icon buttons and accessible labels;
- a page outlet for the workspace and Settings pages;
- a right-side Help panel that can slide in with page/state-specific content;
- a persistent status bar driven by application state.

Keep the workflow state separate from page presentation so navigating to Settings or opening Help does not discard an in-progress matching or rename plan. The shell should support direct manipulation and conditional controls instead of requiring a rigid wizard state machine.

Represent navigation layout as an explicit renderer state, for example `expanded`, `iconOnly`, or `toolbar`. The expanded rail must constrain to 240-280px. In `iconOnly`, keep the rail visible with icons only. In `toolbar`, hide the rail and render the complete navigation icon group immediately after the title. The collapse control remains at the far left of the toolbar in every state and cycles back to `expanded` from `toolbar`.

## Security Boundaries

The renderer must not receive unrestricted filesystem or Node.js access. Use a preload bridge with explicit methods for:

- choosing a folder;
- reading the selected audio-file inventory;
- starting Spotify authentication and loading a collection;
- generating or updating a match plan;
- validating and applying a rename plan;
- undoing an operation.

Validate paths and plans in the main process even when the renderer already validated them. OAuth tokens should remain in the main process or an encrypted platform-appropriate store and should not be persisted in renderer state or logs.

## Core Domain Models

- `LocalAudioFile`: absolute path, original filename, extension, parsed metadata, selection state.
- `SpotifyTrack`: collection position, Spotify ID, title, artists, album, release year, duration, and track number.
- `MatchProposal`: local file ID, collection track ID, confidence score, evidence, source (`automatic` or `manual`), and status.
- `RenamePlanItem`: source path, target filename/path, match reference, included flag, and validation warnings.
- `RenameOperation`: timestamp, completed items, original paths, new paths, and undo eligibility.
- `AppPreferences`: persisted user settings such as the default rename template and other supported preferences.
- `UiStatus`: current operation, progress, warnings, errors, and undo availability for the status bar.

## Data Flow

1. Renderer requests folder selection.
2. Main process enumerates supported files and extracts metadata.
3. Renderer requests Spotify collection loading after OAuth.
4. Main process obtains ordered tracks and returns normalized data.
5. Matching runs in the domain layer and returns proposals with evidence.
6. Renderer edits selection, matches, and template; the main process revalidates each plan.
7. Main process performs a collision-aware staged rename, records the manifest, and reports results.

## Filesystem Rename Strategy

Use a two-phase operation for batches: first move sources to unique temporary names within the same folder, then move temporary names to final names. This avoids source/target cycles and makes swaps safe. Do not overwrite existing paths. Add a deterministic suffix such as ` (1)`, ` (2)` before the extension when a target is already occupied.

Write the operation manifest only after the relevant moves are known, and update it as execution progresses so partial failures can be reported accurately. Undo should use the manifest and verify the current path before moving anything back.

## External Dependencies

- Electron
- React
- `spotify-web-api-node` or a maintained equivalent client
- `music-metadata`
- A maintained string similarity or fuzzy matching library

Dependency choices should be confirmed against current maintenance and licensing before implementation.
