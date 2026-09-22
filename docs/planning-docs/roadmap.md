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
  - [x] Light/dark mode toggle in Settings and More menu with persisted preference.

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
- [ ] Implement Authorization Code with PKCE.
- [ ] Securely store and refresh tokens in the main process.
- [ ] Implement sign-in, sign-out, missing-scope, expiry, rate-limit, and network-error states.
- [ ] Load public and authorized private/collaborative playlists.
- [ ] Load albums and preserve album track order.
- [ ] Preserve playlist positions and duplicate playlist occurrences.

## Matching and Review

- [ ] Normalize metadata and filenames.
- [ ] Implement fuzzy candidate scoring with duration as a disambiguator.
- [ ] Implement one-to-one assignment by collection occurrence.
- [ ] Show every proposal, confidence, evidence, and warning.
- [ ] Support manual reassignment, exclusion, and unmatched files.
- [ ] Preserve collection-position numbering gaps.

## Rename and Recovery

- [ ] Implement token editor and visual template builder.
- [ ] Support artist, album, title, track number, and year fields.
- [ ] Omit unavailable fields and sanitize platform-invalid characters.
- [ ] Add collision suffixes without overwriting existing files.
- [ ] Use staged renames for cycles and swaps.
- [ ] Persist multiple rename-operation manifests.
- [ ] Provide guarded undo for eligible operations.

## Quality and Release

- [ ] Add unit tests for matching, templates, sanitization, ordering, and collisions.
- [ ] Add integration tests for metadata, OAuth, IPC, filesystem safety, and undo history.
- [ ] Add UI and accessibility tests for the shell and primary workflow.
- [ ] Run packaged smoke tests on Linux and Windows.
- [ ] Prepare user setup, OAuth, troubleshooting, and release documentation.

## Current Slice

**Completed checkpoint:** project foundation plus the app shell using mocked workspace data. The first usable checkpoint demonstrates the three navigation states, Settings, Help, Changelog, status bar, and preserved UI state without requiring Spotify or filesystem integration.

**Next slice:** begin Spotify OAuth with mocked collection loading, then connect the review model to selected local files.

## Open Blockers

- None for the shell slice. Spotify credentials will be supplied through Git-excluded development configuration and public packaged client configuration as documented in the planning docs.
