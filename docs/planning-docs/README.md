# TrackAlign Planning Docs

TrackAlign is a desktop application that matches selected local audio files to an ordered Spotify playlist or album and renames the files accordingly.

## Decisions

- MVP platforms: Linux and Windows; macOS is planned for a later release.
- Desktop shell: Electron.
- Renderer: React.
- Interaction model: a formless, direct-manipulation workspace rather than a traditional multi-step form flow.
- App shell: custom top toolbar with the app title and control buttons, plus an icon-based left navigation rail.
- Navigation layout: the rail cycles between expanded, icon-only, and toolbar-navigation modes.
- Navigation layout state persists between launches; the rail is not resizable.
- Help: every page exposes a Help button that opens context-sensitive help in a right-side slide-out panel.
- Help is static in the initial release; Help and Changelog panels can resize up to 40% of the window width.
- Status: a persistent status bar displays relevant operational information.
- Spotify access: OAuth, including private playlists when authorization permits.
- Spotify desktop authentication: Authorization Code with PKCE; users authorize in Spotify and never provide a password or client secret to TrackAlign.
- Spotify configuration: development uses Git-excluded local environment/configuration; packaged builds include the public client ID and registered platform-specific redirect URIs.
- Filesystem safety: symbolic links are ignored and reported in the inventory summary.
- Input: select any number of files from a loaded folder, with Select All and Select None controls.
- Matching: use audio metadata first, with filenames as a fallback; every result appears in review.
- Rename output: user-customizable metadata tokens, with collision suffixes.
- Rename templates support token editing and a visual builder; missing fields are omitted.
- Recovery: retain history for multiple undoable rename operations.
- Ordering: playlists use playlist position, albums use album track order, and excluded/unmatched positions leave numbering gaps.
- Preferences: provide a Settings page for user-configurable app behavior.
- Appearance: provide persisted light and dark modes, accessible from Settings and the More menu.

## Document Map

0. [Implementation Roadmap](roadmap.md)
1. [Product Requirements](product-requirements.md)
2. [User Experience](user-experience.md)
3. [Architecture](architecture.md)
4. [Matching Design](matching-design.md)
5. [Implementation Plan](implementation-plan.md)
6. [Testing Strategy](testing-strategy.md)
7. [Release Plan](release-plan.md)
8. [Open Questions](open-questions.md)

The open questions document should be updated as implementation reveals decisions that still need product or technical confirmation.
