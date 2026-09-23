# TrackAlign Implementation Roadmap

Use this document as the at-a-glance progress view. Update the status and notes as each slice is completed.

Status key: `[ ]` not started, `[-]` in progress, `[x]` complete, `[!]` blocked or needs a decision.

## Foundation

- [x] Initialize Electron + React + TypeScript project structure.
- [x] Establish main process, preload bridge, renderer, and shared domain boundaries.
- [x] Add build and typecheck commands.
- [x] Add Linux and Windows packaging configuration.
  - [x] electron-builder config for Linux (AppImage, deb) and Windows (nsis, portable); `npm run package:linux` / `npm run package:win`.
  - [x] Verified `electron-builder --linux --dir` produces a valid unpacked build.
  - [ ] Custom packaged app icon assets (PNG/ICO) beyond the placeholder SVG.
  - [!] Unpacked Linux debug builds segfault under the default sandbox in this environment (missing root-owned setuid `chrome-sandbox`); this is a known Linux/Electron limitation for `--dir` builds, not expected to affect real AppImage/deb artifacts.

## App Shell

- [x] Build the formless workspace shell with mocked workspace data.
  - [x] Custom top toolbar with TrackAlign title and global controls.
  - [x] ListOrdered app icon in the titlebar and native window/taskbar.
  - [x] Frameless Electron window with custom minimize, maximize, and close controls.
  - [x] Three-state navigation cycle: expanded rail, icon-only rail, toolbar navigation.
  - [x] Persist navigation layout state between launches.
  - [x] Lucide icon buttons with accessible names and tooltips.
  - [x] Workspace and Settings pages.
  - [x] Static right-side Help panel.
  - [x] Made Help content collapsible per-section and page-specific (Workspace, Settings, Discussions each show only their own relevant sections, defaulting to the first expanded).
  - [x] Changelog panel with collapsible versions, latest expanded by default.
  - [x] Persistent status bar.
  - [x] Ctrl+0/-/=/mouse-wheel zoom control with the current level shown at the right of the status bar.
  - [x] Four light and four dark mode presets, including VS Code Default Dark, with persisted selection in Settings and a More-menu family toggle.

## Local Files

- [x] Select a folder through Electron's native dialog.
- [x] Enumerate MP3, FLAC, OGG, and M4A files.
- [x] Include hidden audio files with distinct visual treatment.
- [x] Hide unsupported non-audio files.
- [x] Ignore and report symbolic links.
- [x] Detect and visibly flag read-only or otherwise unrenameable files.
- [x] Add Select All and Select None controls.
- [x] Extract basic audio metadata.
- [x] Add a refresh action to rescan the current folder for newly added files without reopening the picker.

## Spotify Integration

- [ ] Register Spotify application configuration and platform redirect URIs.
- [x] Implement Authorization Code with PKCE.
- [x] Keep access and refresh tokens in the main process and refresh access tokens when needed.
- [x] Reuse an existing Spotify session across collection loads instead of re-authorizing every time.
- [x] Implement sign-out and a connection-status indicator; surface rate-limit (429, with Retry-After) and API error detail in load failures.
  - [ ] Explicit missing-scope UI state (network-offline detection is now implemented and tested).
- [x] Load public and authorized private/collaborative playlists through the Spotify API bridge.
- [x] Load albums and preserve album track order through the Spotify API bridge.
- [x] Document and surface the Spotify platform restriction on algorithmic/personalized playlists (in-app Help and error messages).
- [x] Preserve playlist positions and duplicate playlist occurrences (unit-tested in `src/shared/spotify.test.ts`).
- [x] Provide playlist/album URL loading and ordered collection preview through the Spotify API bridge.
- [x] Spotify Discovery: search Spotify by name (playlists/albums) to select and load a collection without pasting a URL. See [spotify-discovery.md](spotify-discovery.md). Building first, ahead of native library browse.
- [ ] Spotify Discovery: native "Your library" browse list (playlists and saved albums, via the Web API; adds `user-library-read` scope). See [spotify-discovery.md](spotify-discovery.md).

## Matching and Review

- [x] Normalize metadata and filenames.
- [x] Implement initial fuzzy candidate scoring with duration as a disambiguator.
- [x] Implement initial one-to-one assignment by collection occurrence.
- [x] Show every proposal, confidence, evidence, and warning in the review table.
  - [x] Merged the local file inventory and match review into one checkbox-driven table; unchecking a file is now the single exclusion mechanism.
  - [x] Made the Spotify collection and local files panels independently collapsible/expandable.
  - [x] Persisted window size and position between sessions.
  - [x] Persisted the last selected local folder, defaulting the folder picker to it (falling back to the OS default if it no longer exists).
  - [x] Persisted the Spotify connection (refresh token, encrypted at rest via OS keychain through `safeStorage`) so re-authorization isn't needed after restarting the app.
  - [x] Removed the non-functional Startup behavior setting and replaced the static Navigation layout label with real Full/Collapsed/Titlebar Nav options.
  - [x] Added in-app GitHub integration: a "Report an issue" slideout (reachable from the More menu) that submits GitHub issues, a Discussions page for browsing/starting/replying to GitHub Discussions, and a GitHub connection row in Settings. Auth uses the OAuth Device Flow with the token encrypted at rest via `safeStorage`.
  - [x] Kept Workspace, Discussions, and Settings mounted at all times (toggled via inline `display: none`) so the loaded folder and Spotify collection survive navigating to another page and back, for the lifetime of the running app.
  - [x] Added a "Start over" button to the Workspace page (shown once a folder or Spotify collection is loaded) that clears the loaded folder, collection, selections, and manual matches so the user can begin fresh.
  - [x] Show collection tracks with no matching local file as a distinctly highlighted "missing" row in the same review table, resolvable by assigning an unmatched local file to it directly from that row.
- [x] Support manual reassignment, exclusion, and unmatched files.
- [x] Preserve collection-position numbering gaps (unmatched/excluded tracks are simply not renamed, so no renumbering occurs).

## Rename and Recovery

- [x] Implement initial token editor with persisted template state.
- [x] Support artist, title, and track number fields in the expected filename preview.
- [x] Omit unavailable fields and sanitize platform-invalid characters.
- [x] Complete the visual template builder with album and year field previews.
- [x] Add collision suffixes without overwriting existing files.
- [x] Use staged renames for cycles and swaps.
- [x] Persist multiple rename-operation manifests.
- [x] Provide guarded undo for eligible operations.

## Quality and Release

- [-] Add unit tests for matching, templates, sanitization, ordering, and collisions.
  - [x] Album/year template rendering and duplicate playlist occurrence coverage.
- [-] Add integration tests for metadata, OAuth, IPC, filesystem safety, and undo history.
  - [x] Filesystem safety and undo-history tests (collision suffixing, staged swaps, no-op renames, invalid names, guarded undo) against real temp directories.
  - [x] Folder inventory tests against real temp directories (extension filtering, hidden files, symlinks, read-only flags, graceful metadata fallback).
  - [x] Spotify collection tests with a mocked fetch (URL parsing, pagination, duplicate/position preservation, album metadata, 403/429 error detail).
  - [ ] IPC boundary tests (renderer ↔ main) and packaged OAuth callback tests.
- [x] Add UI and accessibility tests for the shell and primary workflow.
  - [x] Navigation, page switching, appearance presets, and rename template controls (`src/renderer/src/App.test.tsx`, Vitest + jsdom + Testing Library).
  - [x] Accessible-name coverage for icon-only toolbar controls.
- [ ] Run packaged smoke tests on Linux and Windows.
- [x] Prepare user setup, OAuth, troubleshooting, and release documentation (see project [README.md](../../README.md)).

## Current Slice

**Completed checkpoint:** project foundation plus the app shell using mocked workspace data. The first usable checkpoint demonstrates the three navigation states, Settings, Help, Changelog, status bar, and preserved UI state without requiring Spotify or filesystem integration.

**Next slice:** add filesystem safety tests, strengthen OAuth callback/error coverage, and complete album/year template preview fields.

## Open Blockers

- Local Spotify credentials are required to exercise OAuth: copy `.env.example` to `.env` and provide `SPOTIFY_CLIENT_ID` plus a registered redirect URI. No client secret is needed.
- Shared matching and filename unit tests are passing with `npm test`.
