# User Experience

## Primary Flow

1. **Choose folder**: the user selects a folder. TrackAlign lists supported audio files with checkboxes, current filenames, and available metadata. Select All and Select None are available.
2. **Choose Spotify source**: the user signs in with Spotify OAuth, enters a playlist or album URL, and loads the ordered collection.
3. **Review matches**: TrackAlign proposes matches and displays a two-column comparison: current filename and expected filename. The row also shows the matched track and confidence.
4. **Resolve the plan**: the user selects or excludes files, changes matches, and adjusts the rename template. The expected filename preview updates as the plan changes.
5. **Confirm rename**: the user reviews warnings, including unmatched items and collisions, then confirms the operation.
6. **Completion**: the app reports per-file results and offers Undo for the operation.

## Review Table

Recommended columns:

- Include checkbox
- Current filename
- Matched Spotify track and artist
- Confidence indicator and score
- Expected filename
- Status or warning
- Manual match action

The table should remain useful with long names, missing metadata, duplicate artists, and a large folder. Sorting and filtering by status are useful early enhancements but should not hide the core workflow.

## Match Editing

A user can open a row's match selector and choose from collection tracks not already assigned, clear the match, or mark the file excluded. Manual changes should be visually distinct from automatic proposals. The interface should make duplicate assignments impossible unless the product explicitly supports playlist duplicates later.

## Rename Template

Provide a template input with token insertion rather than requiring users to memorize syntax. Initial tokens:

- `{trackNumber}`
- `{artist}`
- `{album}`
- `{title}`
- `{year}`

Preview the rendered name for each row. Sanitize characters that are invalid on the target platform and show when a value is missing. Preserve the source extension.

## States and Errors

The UI should have explicit states for loading a folder, authenticating, loading a Spotify collection, matching, reviewing, renaming, completed, and undoing. Errors should identify whether the problem is authentication, network access, invalid input, unsupported audio, a missing metadata value, or filesystem permissions.

## Accessibility and Platform Behavior

- Keyboard navigation must reach file selection, match controls, template controls, and confirmation actions.
- Dialogs must have clear focus management and cancel actions.
- Long filenames and track titles must truncate visually without changing the underlying value.
- Use platform-native folder/file dialogs through Electron.
