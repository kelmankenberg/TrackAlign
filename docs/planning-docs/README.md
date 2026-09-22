# TrackAlign Planning Docs

TrackAlign is a desktop application that matches selected local audio files to an ordered Spotify playlist or album and renames the files accordingly.

## Decisions

- MVP platforms: Linux and Windows; macOS is planned for a later release.
- Desktop shell: Electron.
- Renderer: React.
- Interaction model: a formless, direct-manipulation workspace rather than a traditional multi-step form flow.
- App shell: custom top toolbar with the app title and control buttons, plus an icon-based left navigation rail.
- Help: every page exposes a Help button that opens context-sensitive help in a right-side slide-out panel.
- Status: a persistent status bar displays relevant operational information.
- Spotify access: OAuth, including private playlists when authorization permits.
- Input: select any number of files from a loaded folder, with Select All and Select None controls.
- Matching: use audio metadata first, with filenames as a fallback; every result appears in review.
- Rename output: user-customizable metadata tokens, with collision suffixes.
- Recovery: provide undo support.
- Preferences: provide a Settings page for user-configurable app behavior.

## Document Map

1. [Product Requirements](product-requirements.md)
2. [User Experience](user-experience.md)
3. [Architecture](architecture.md)
4. [Matching Design](matching-design.md)
5. [Implementation Plan](implementation-plan.md)
6. [Testing Strategy](testing-strategy.md)
7. [Release Plan](release-plan.md)
8. [Open Questions](open-questions.md)

The open questions document should be updated as implementation reveals decisions that still need product or technical confirmation.
