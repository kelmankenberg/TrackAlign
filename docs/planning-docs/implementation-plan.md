# Implementation Plan

## Phase 0: Project Foundation

- Initialize Electron, React, TypeScript, packaging, linting, and test tooling.
- Establish main/preload/renderer boundaries and typed IPC contracts.
- Add platform-aware path and filename utilities.

## Phase 1: Local Folder Inventory

- Implement folder selection.
- Enumerate supported audio files.
- Extract and normalize metadata with `music-metadata`.
- Build the selectable file inventory with Select All and Select None.

## Phase 2: Spotify Integration

- Register OAuth configuration and callback flow.
- Store tokens securely and refresh them as needed.
- Parse playlist and album URLs.
- Fetch ordered tracks, including private collections when authorized.
- Add clear handling for expired authorization, unavailable collections, rate limits, and network failures.

## Phase 3: Matching Domain

- Implement normalization and filename fallback.
- Implement candidate scoring and one-to-one assignment.
- Return evidence and confidence with every proposal.
- Build fixtures for realistic metadata inconsistencies.

## Phase 4: Review Experience

- Build the current-filename/expected-filename comparison table.
- Add selection, exclusion, manual match changes, and unmatched states.
- Add template tokens, sanitization, and live previews.
- Validate the complete plan before confirmation.

## Phase 5: Rename and Undo

- Implement collision suffixing.
- Implement two-phase temporary renaming for batches.
- Record operation manifests and partial results.
- Implement guarded undo for the most recent operation.

## Phase 6: Packaging and Release Hardening

- Add Linux and Windows packaging.
- Test OAuth callback behavior in packaged builds.
- Run accessibility, filesystem, and failure-path checks.
- Prepare user-facing documentation and release artifacts.

## Delivery Order

The first end-to-end vertical slice should support one folder, one public collection, automatic matching, review, and a safe rename. Private OAuth collections, manual correction, configurable templates, collision handling, and undo should be added before calling the MVP complete.
