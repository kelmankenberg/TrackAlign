# Release Plan

## MVP Release Criteria

- Linux and Windows packages install and launch successfully.
- Spotify OAuth works in development and packaged builds.
- Packaged builds use PKCE and do not expose a Spotify client secret; redirect URI registration is verified for Linux and Windows.
- Development credentials use Git-excluded local configuration; packaged builds include only the public client ID and registered platform-specific redirect URIs.
- Authorized users can load public collections and private collections available to their account.
- Supported local formats can be inventoried and matched with filename fallback.
- The review table shows every proposed match and expected filename.
- Playlist positions and album track order are preserved, including duplicate playlist occurrences and gaps.
- Users can exclude files and manually correct assignments.
- Templates support both token editing and visual construction; missing fields are omitted.
- Renames use collision suffixes and never silently overwrite files.
- Multiple rename operations are retained and eligible operations can be undone safely.
- Hidden audio files and read-only/unrenameable files are clearly represented; unsupported non-audio files are hidden.
- The navigation layout persists, and the More menu exposes Restart TrackAlign, Changelog, and version information.
- Automated tests and platform smoke tests pass.

## Rollout Stages

1. **Internal development**: use mocked Spotify responses and local fixture libraries.
2. **Private beta**: test with a small group using real OAuth and varied SpotDL output.
3. **MVP release**: publish signed or appropriately packaged Linux and Windows builds with troubleshooting documentation.
4. **Post-MVP**: evaluate matching failures, collision behavior, and undo reports before prioritizing macOS and additional workflow improvements.

## Operational Concerns

- Spotify API credentials and redirect configuration must be managed separately from source control.
- Logs must redact access tokens and avoid unnecessary personal filenames.
- Rate limits and network outages need user-visible recovery guidance.
- Packaging must document required permissions for reading and renaming local files.
- Spotify setup documentation must distinguish developer app configuration from user authorization. Users authorize through Spotify and should never provide a password or client secret to TrackAlign.
- OAuth scopes, token refresh, sign-out, and unavailable/private collection errors must be tested without exposing tokens in logs.
- The app should make clear that it organizes files and does not download or distribute music.

## Success Signals

- Most selected files receive useful automatic proposals.
- Users can resolve low-confidence matches without leaving the review screen.
- Rename operations complete without accidental overwrites.
- Undo is understandable and succeeds for normal operations.
- Support reports reveal specific matching or platform issues rather than opaque failures.
