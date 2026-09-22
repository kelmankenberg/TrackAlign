# User Experience

## Application Shell

TrackAlign uses a formless desktop workspace: the user works directly with the loaded folder, Spotify collection, matching results, and rename preview instead of progressing through a rigid wizard. The workspace can expose the right controls as data becomes available while preserving the user's current context.

The persistent shell contains:

- **Custom top toolbar**: displays the TrackAlign app title and app control buttons such as navigation/context actions, undo, and other global commands. Controls should use icons where the meaning is familiar and include accessible labels/tooltips.
- **Left navigation rail**: contains icon buttons for all primary pages. Use Lucide icons consistently, show the active page, and provide accessible names and tooltips for every icon button.
- **Page content area**: hosts the current workflow or settings page without nesting the experience inside a modal or decorative card.
- **Right Help panel**: slides in from the right when the page Help icon is selected. It displays context-sensitive guidance for the current page and can be dismissed without losing state.
- **Status bar**: remains available at the bottom of the window and reports relevant folder, collection, matching, rename, warning, and undo information.

## Primary Pages

The initial navigation should include:

- **Workspace**: folder loading, file selection, Spotify source loading, matching review, expected filename preview, and rename confirmation.
- **Settings**: preferences such as rename template defaults and other user-configurable behavior.

Additional pages may be added when they represent a durable user task rather than a transient dialog. Global actions should remain available from the toolbar or the relevant page.

## Help Behavior

The Help button appears on every page and uses a Lucide help icon with an accessible label. Help content is specific to the current page and should reflect the current workflow state, such as explaining why a match is low confidence or why a rename is blocked. Opening and closing the panel must preserve selections, edits, and scroll position where practical.

## Status Bar Behavior

The status bar should show concise, current information rather than instructional copy. Examples include `12 files selected`, `Playlist loaded`, `Matching 8 of 24`, `3 warnings`, `Rename complete`, or `Undo available`. Use a distinct visual treatment for warnings and errors and provide more detail in the page or Help panel when needed.

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
- Keyboard navigation must reach all left-rail and toolbar icon buttons, the Help button, and the Help panel close action.
- Icon-only controls must have accessible names and tooltips; Lucide icons are visual affordances, not the only label.
- Dialogs must have clear focus management and cancel actions.
- Long filenames and track titles must truncate visually without changing the underlying value.
- Use platform-native folder/file dialogs through Electron.
- The right-side Help panel must have logical focus behavior and must not trap focus after it is closed.
