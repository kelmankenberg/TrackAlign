# User Experience

## Application Shell

TrackAlign uses a formless desktop workspace: the user works directly with the loaded folder, Spotify collection, matching results, and rename preview instead of progressing through a rigid wizard. The workspace can expose the right controls as data becomes available while preserving the user's current context.

The persistent shell contains:

- **Custom top toolbar**: displays a navigation collapse button at the far left, followed by the TrackAlign app title and app control buttons such as undo and other global commands. Controls should use icons where the meaning is familiar and include accessible labels/tooltips.
- **Left navigation rail**: contains icon buttons for all primary pages. Use Lucide icons consistently, show the active page, and provide accessible names and tooltips for every icon button. In expanded mode, the rail is 240-280px wide and may show icon labels alongside the icons.
- **Page content area**: hosts the current workflow or settings page without nesting the experience inside a modal or decorative card.
- **Right Help panel**: slides in from the right when the page Help icon is selected. It displays context-sensitive guidance for the current page and can be dismissed without losing state.
- **More menu and Changelog panel**: the More menu contains Restart TrackAlign, Changelog, and version information. Changelog opens as a resizable structured panel, with one collapsible section per version and only the latest version expanded by default.
- **Status bar**: remains available at the bottom of the window and reports relevant folder, collection, matching, rename, warning, and undo information.

### Navigation Layout States

The collapse button cycles through these states in order:

1. **Expanded rail**: a 240-280px left rail shows navigation icons and their labels.
2. **Icon-only rail**: the left rail remains visible at a compact width and shows only navigation icons with tooltips.
3. **Toolbar navigation**: the left rail is hidden and all navigation icons appear in a button group immediately after the app title in the top toolbar.

Activating the toggle in toolbar-navigation mode returns the app to the expanded rail. The current page remains selected and the content area must resize without losing workflow state. The toggle itself must expose an accessible label describing the next layout state.

## Primary Pages

The initial navigation should include:

- **Workspace**: folder loading, file selection, Spotify source loading, matching review, expected filename preview, and rename confirmation.
- **Settings**: preferences such as rename template defaults and other user-configurable behavior.

Additional pages may be added when they represent a durable user task rather than a transient dialog. Global actions should remain available from the toolbar or the relevant page.

## Help Behavior

The Help button appears on every page and uses a Lucide help icon with an accessible label. Help content is specific to the current page and should reflect the current workflow state, such as explaining why a match is low confidence or why a rename is blocked. Opening and closing the panel must preserve selections, edits, and scroll position where practical.

Help is static documentation initially. Dynamic actions may be considered later. The Help and Changelog panels can be resized up to 40% of the app window width; the left navigation rail cannot be resized.

## Status Bar Behavior

The status bar should show concise, current information rather than instructional copy. Examples include `12 files selected`, `Playlist loaded`, `Matching 8 of 24`, `3 warnings`, `Rename complete`, or `Undo available`. Use a distinct visual treatment for warnings and errors and provide more detail in the page or Help panel when needed.

## Primary Flow

1. **Choose folder**: the user selects a folder. TrackAlign lists supported audio files with checkboxes, current filenames, and available metadata. Select All and Select None are available.
2. **Choose Spotify source**: the user signs in with Spotify OAuth, enters a playlist or album URL, and loads the ordered collection.
3. **Review matches**: TrackAlign proposes matches and displays a two-column comparison: current filename and expected filename. The row also shows the matched track and confidence.
4. **Resolve the plan**: the user selects or excludes files, changes matches, and adjusts the rename template. The expected filename preview updates as the plan changes.
5. **Confirm rename**: the user reviews warnings, including unmatched items and collisions, then confirms the operation.
6. **Completion**: the app reports per-file results and offers Undo for the operation.

Navigation layout state and user preferences persist between launches. Multiple completed rename operations remain available in undo history.

## Review Table

Recommended columns:

- Include checkbox
- Current filename
- Matched Spotify track and artist
- Confidence indicator and score
- Expected filename
- Source collection position
- Status or warning
- Manual match action

The table should remain useful with long names, missing metadata, duplicate artists, and a large folder. Sorting and filtering by status are useful early enhancements but should not hide the core workflow.

## Match Editing

A user can open a row's match selector and choose from collection tracks not already assigned, clear the match, or mark the file excluded. Manual changes should be visually distinct from automatic proposals. The interface should make duplicate assignments impossible unless the product explicitly supports playlist duplicates later.

## Rename Template

Provide both a token editor and a visual template builder. Initial tokens:

- `{trackNumber}`
- `{artist}`
- `{album}`
- `{title}`
- `{year}`

Preview the rendered name for each row. Sanitize characters that are invalid on the target platform and omit unavailable fields. Preserve the source extension.

## States and Errors

The UI should have explicit states for loading a folder, authenticating, loading a Spotify collection, matching, reviewing, renaming, completed, and undoing. Errors should identify whether the problem is authentication, network access, invalid input, unsupported audio, a missing metadata value, or filesystem permissions.

## Accessibility and Platform Behavior

- Keyboard navigation must reach file selection, match controls, template controls, and confirmation actions.
- Keyboard navigation must reach all left-rail and toolbar icon buttons, the Help button, and the Help panel close action.
- Icon-only controls must have accessible names and tooltips; Lucide icons are visual affordances, not the only label.
- Dialogs must have clear focus management and cancel actions.
- Long filenames and track titles must truncate visually without changing the underlying value.
- Hidden files and read-only files must have clear, non-color-only visual indicators; read-only rows may use the agreed light-red treatment without relying on color alone.
- Use platform-native folder/file dialogs through Electron.
- The right-side Help panel must have logical focus behavior and must not trap focus after it is closed.
