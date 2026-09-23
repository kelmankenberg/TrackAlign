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
- Contextual Help content is static text per page (Workspace, Settings, Discussions each show only their own sections); dynamic actions are a later consideration.
- The status bar may persistently show the selected folder path and Spotify collection name.
- The left rail is not resizable. Help and Changelog panels may be resized up to 40% of the app window width.
- Symbolic links are ignored by default and reported in the folder inventory summary.
- Spotify access uses OAuth with PKCE. Users authorize TrackAlign in Spotify; they do not provide their Spotify password or developer secret to the app.
- Development supplies the Spotify client ID and redirect URI through local environment/configuration excluded from Git. Packaged builds include the public client ID and use registered platform-specific redirect URIs; no client secret is shipped.
- Spotify Discovery browse uses a native "Your library" list built from the Spotify Web API (not an embedded Spotify web UI/webview) — avoids a second, separate sign-in and extra security hardening.
- The native browse list covers both playlists and saved albums (adds the `user-library-read` scope).
- Search covers both playlists and albums by default, with a toggle matching the existing Load dialog tabs.
- Search ships first as a standalone improvement; native library browse follows afterward.

## Remaining Decisions

- Spotify Discovery (browse/search) proposal — see [spotify-discovery.md](spotify-discovery.md) for full detail. Open items:
  - Should search results be a short fixed list, or support pagination?
