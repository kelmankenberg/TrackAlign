# TrackAlign Implementation Roadmap

Use this document as the at-a-glance progress view. Update the status and notes as each slice is completed.

Status key: `[ ]` not started, `[-]` in progress, `[x]` complete, `[!]` blocked or needs a decision.

## Foundation

- [x] Initialize Electron + React + TypeScript project structure.
- [x] Establish main process, preload bridge, renderer, and shared domain boundaries.
- [x] Add build and typecheck commands.
- [ ] Add Linux and Windows packaging configuration.

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
  - [x] Changelog panel with collapsible versions, latest expanded by default.
  - [x] Persistent status bar.
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

## Spotify Integration

- [ ] Register Spotify application configuration and platform redirect URIs.
- [-] Implement Authorization Code with PKCE.
- [x] Keep access and refresh tokens in the main process and refresh access tokens when needed.
- [x] Reuse an existing Spotify session across collection loads instead of re-authorizing every time.
- [ ] Implement sign-out, missing-scope, expiry, rate-limit, and network-error states.
- [x] Load public and authorized private/collaborative playlists through the Spotify API bridge.
- [x] Load albums and preserve album track order through the Spotify API bridge.
- [x] Document and surface the Spotify platform restriction on algorithmic/personalized playlists (in-app Help and error messages).
- [ ] Preserve playlist positions and duplicate playlist occurrences.
- [x] Provide playlist/album URL loading and ordered collection preview through the Spotify API bridge.

## Matching and Review

- [x] Normalize metadata and filenames.
- [x] Implement initial fuzzy candidate scoring with duration as a disambiguator.
- [x] Implement initial one-to-one assignment by collection occurrence.
- [x] Show every proposal, confidence, evidence, and warning in the review table.
- [x] Support manual reassignment, exclusion, and unmatched files.
- [ ] Preserve collection-position numbering gaps.

## Rename and Recovery

- [x] Implement initial token editor with persisted template state.
- [x] Support artist, title, and track number fields in the expected filename preview.
- [x] Omit unavailable fields and sanitize platform-invalid characters.
- [ ] Complete the visual template builder with album and year field previews.
- [x] Add collision suffixes without overwriting existing files.
- [x] Use staged renames for cycles and swaps.
- [x] Persist multiple rename-operation manifests.
- [x] Provide guarded undo for eligible operations.

## Quality and Release

- [-] Add unit tests for matching, templates, sanitization, ordering, and collisions.
  - [x] Album/year template rendering and duplicate playlist occurrence coverage.
- [ ] Add integration tests for metadata, OAuth, IPC, filesystem safety, and undo history.
- [ ] Add UI and accessibility tests for the shell and primary workflow.
- [ ] Run packaged smoke tests on Linux and Windows.
- [ ] Prepare user setup, OAuth, troubleshooting, and release documentation.

## Current Slice

**Completed checkpoint:** project foundation plus the app shell using mocked workspace data. The first usable checkpoint demonstrates the three navigation states, Settings, Help, Changelog, status bar, and preserved UI state without requiring Spotify or filesystem integration.

**Next slice:** add filesystem safety tests, strengthen OAuth callback/error coverage, and complete album/year template preview fields.

## Open Blockers

- Local Spotify credentials are required to exercise OAuth: copy `.env.example` to `.env` and provide `SPOTIFY_CLIENT_ID` plus a registered redirect URI. No client secret is needed.
- Shared matching and filename unit tests are passing with `npm test`.
