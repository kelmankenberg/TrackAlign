# Open Questions

This document contains active decisions that still need confirmation. Resolved decisions are recorded in the planning documents and summarized below.

## Resolved Decisions

- Duplicate Spotify tracks are supported by playlist position.
- Playlist numbering follows playlist position; album numbering follows album track order.
- Numbering preserves source collection positions, including gaps for excluded or unmatched tracks.
- Missing template fields are omitted.
- Unmatched selected files remain untouched while matched files can be renamed.
- Template editing supports both token editing and a visual builder.
- Collision suffixes use ` (1)`, ` (2)`, and so on before the extension.
- Multiple rename operations are retained for undo history.
- Hidden audio files are shown with distinct visual treatment.
- Unsupported non-audio files are hidden.
- Read-only or otherwise unrenameable files are visibly flagged when the folder is loaded.
- Navigation layout state persists between launches.
- The More menu contains Restart TrackAlign, Changelog, and version information.
- Changelog is a structured, collapsible panel with only the latest version expanded by default; its expansion state does not persist.
- Contextual Help is static in the initial release; dynamic actions are a later consideration.
- The status bar may persistently show the selected folder path and Spotify collection name.
- The left rail is not resizable. Help and Changelog panels may be resized up to 40% of the app window width.

## Remaining Decisions

1. **Spotify app credentials:** How should the Spotify client ID and redirect URI be configured for development and packaged releases?
   - Answer: currently unknown

2. **Symbolic links:** Should symbolic links be ignored, included, or reported separately?
   - Answer:
