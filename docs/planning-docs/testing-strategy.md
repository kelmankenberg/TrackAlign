# Testing Strategy

## Unit Tests

Cover pure logic with table-driven fixtures:

- metadata and filename normalization;
- feature markers, punctuation, case, and whitespace variants;
- duration tolerance and missing durations;
- candidate scoring and evidence labels;
- one-to-one assignment and ambiguous candidates;
- template token rendering;
- invalid-character sanitization;
- collision suffix generation;
- playlist/album URL parsing;
- rename-plan validation.

## Integration Tests

- folder inventory with supported and unsupported extensions;
- metadata extraction from representative MP3, FLAC, OGG, and M4A fixtures;
- Spotify client behavior using mocked responses, including private-playlist authorization, pagination, rate limits, and expired tokens;
- IPC validation between renderer and main process;
- operation manifest creation and guarded undo.

## Filesystem Safety Tests

Use temporary directories to verify:

- files are not overwritten;
- target collisions receive stable suffixes;
- filename swaps complete safely;
- extensions remain unchanged;
- partial failures produce accurate status;
- undo restores original paths when the manifest is valid;
- undo refuses or reports changed paths rather than overwriting newer files.

## UI Tests

Verify the persistent shell and direct-manipulation behavior:

- the custom top toolbar renders the TrackAlign title and app control buttons;
- the far-left toolbar collapse button cycles from expanded rail to icon-only rail to toolbar navigation and back to expanded rail;
- the expanded left navigation rail is 240-280px wide and exposes all primary pages with Lucide icons, labels, accessible names, active state, and tooltips;
- the icon-only rail exposes every navigation destination through icons and tooltips;
- toolbar-navigation mode hides the rail and places all navigation icons in a button group immediately after the title;
- the selected page and in-progress workspace state survive every navigation layout transition;
- navigation preserves in-progress workspace state;
- Settings loads, persists, and resets supported preferences;
- every page exposes Help and the context-sensitive panel slides in from the right and closes without losing work;
- the status bar reports selection, loading, progress, warning, completion, and undo states;
- keyboard focus reaches toolbar, navigation, Help, and Help-panel controls.

Verify the primary flow and important states:

- folder selection and Select All/None;
- OAuth success and failure;
- playlist and album loading;
- every match appearing in the review table;
- low-confidence warnings;
- manual match changes and exclusions;
- expected filename preview updates;
- confirmation warnings and completion results;
- undo availability and result reporting.

## End-to-End Checks

Run packaged smoke tests on Linux and Windows before release. Use a controlled Spotify test account or mocked API boundary; do not place real credentials in test fixtures or logs.

## Acceptance Criteria

A release candidate is acceptable when a user can select a subset of a folder, load an authorized playlist or album, review and modify every proposed assignment, preview custom filenames, rename without overwriting files, and undo the completed operation in both supported MVP environments.
