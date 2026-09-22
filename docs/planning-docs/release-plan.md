# Release Plan

## MVP Release Criteria

- Linux and Windows packages install and launch successfully.
- Spotify OAuth works in development and packaged builds.
- Authorized users can load public collections and private collections available to their account.
- Supported local formats can be inventoried and matched with filename fallback.
- The review table shows every proposed match and expected filename.
- Users can exclude files and manually correct assignments.
- Templates support artist, album, title, track number, and year.
- Renames use collision suffixes and never silently overwrite files.
- Undo works for the most recent operation and handles changed files safely.
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
- The app should make clear that it organizes files and does not download or distribute music.

## Success Signals

- Most selected files receive useful automatic proposals.
- Users can resolve low-confidence matches without leaving the review screen.
- Rename operations complete without accidental overwrites.
- Undo is understandable and succeeds for normal operations.
- Support reports reveal specific matching or platform issues rather than opaque failures.
