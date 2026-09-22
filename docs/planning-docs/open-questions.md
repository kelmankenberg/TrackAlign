# Open Questions

Answer these questions inline. The decisions will guide the product requirements, architecture, UX, implementation plan, and testing strategy.

## Product Scope

1. **MVP platforms:** Should the app support Linux only initially, or Windows and macOS too?
   - Answer: Linux (primary) and Windows initially, with macOS planned for a later release.

2. **Planning-doc scope:** Should the planning set include product requirements, architecture, UX/workflow, matching algorithm, implementation plan, testing strategy, and release plan, or a smaller set?
   - Answer: a larger set

## Technical Direction

3. **Electron stack:** Do you have a preference for the renderer, such as React, Vue, or plain HTML/CSS/JavaScript?
   - Answer: React

4. **Spotify authentication:** Should users authenticate through Spotify OAuth in the app, or paste/configure a token manually?
   - Answer: Spotify OAuth

5. **Playlist access:** Must private playlists be supported, or only public playlists?
   - Answer: Private playlists should be supported given adequate authorization

## Input and Matching

6. **Input workflow:** Should users select one folder, multiple files, or both?
   - Answer: Users should be able to select multiple files (including Select All/None) within a folder. Thge idea is to have a column of current filenames and a column of expected filenames.

7. **Metadata fallback:** If tags are missing or unreliable, should matching also use filenames?
   - Answer: yes

8. **Confidence behavior:** Should low-confidence matches require explicit confirmation, or should every match appear in the review table?
   - Answer: every match should appear

9. **Manual matching:** Should users be able to assign any local file to any Spotify track, leave tracks unmatched, and exclude files from renaming?
   - Answer: Users should be able to select any number of files from a loaded folder, compare them against a specific playlist/album on spotify and decide which files to include in the renaming.

10. **Playlist structure:** Should duplicate tracks in a playlist remain duplicated in the output order?
    - Answer: I would expect no duplicate tracks in a playlist. If there are duplicate filenames initially, they would become distinct on the renaming.

## Rename Behavior

11. **Rename format:** Is `01 - Artist - Title.ext` the required format, and should users be able to customize it?
    - Answer: they should be able to customize it using typical file renaming practices: Artist, Album, Track Number, Year, etc.

12. **Existing filenames:** What should happen when the target filename already exists: skip, add a suffix, overwrite only with confirmation, or use a staging rename?
    - Answer: add a suffix

13. **Undo and recovery:** Is an undo operation or rename manifest required for the first release?
    - Answer: yes, there should be an undo feature.
