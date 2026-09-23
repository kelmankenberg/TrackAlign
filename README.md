# TrackAlign

TrackAlign is a desktop application that matches selected local audio files to an ordered Spotify playlist or album, then renames the files to match that order.

## Requirements

- Node.js 18 or later
- Linux or Windows (macOS is planned for a later release)
- A free Spotify account

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Copy the environment example file:
   ```
   cp .env.example .env
   ```
3. Register a Spotify app to get a client ID (see [Spotify setup](#spotify-setup) below).
4. Add your client ID to `.env`:
   ```
   SPOTIFY_CLIENT_ID=your-client-id-here
   SPOTIFY_REDIRECT_URI=http://127.0.0.1:43821/callback
   ```
5. Start the app:
   ```
   npm run dev
   ```

`.env` is excluded from Git and never committed. No Spotify client secret is needed — TrackAlign uses OAuth with PKCE.

## Spotify setup

1. Go to https://developer.spotify.com/dashboard and log in.
2. Click **Create app**.
3. Fill in:
   - **App name**: anything, e.g. `TrackAlign`
   - **App description**: anything
   - **Redirect URI**: `http://127.0.0.1:43821/callback` (must match exactly, click **Add**)
   - **Which API/SDKs are you planning to use?**: check **Web API**
4. Accept the terms and click **Save**.
5. Open the app, go to **Settings**, and copy the **Client ID**.
6. Paste that value into `.env` as `SPOTIFY_CLIENT_ID`.

This client ID is bundled by whoever distributes the packaged app — end users of a released build will not need to do this themselves. It's only required for local development right now, since packaging with a shared public client ID isn't set up yet.

## Using TrackAlign

1. **Choose a folder** — TrackAlign lists supported audio files (`.mp3`, `.flac`, `.ogg`, `.m4a`), with hidden files and read-only files clearly marked. Use the refresh button to rescan the folder if you add files while the app is open.
2. **Connect Spotify** — enter a playlist or album URL. The first load opens your browser to authorize; TrackAlign reuses that session for later loads.
3. **Review the plan** — every proposed match is shown with a confidence score and the expected filename. You can reassign or exclude any file.
4. **Customize the rename template** in Settings — build filenames from track number, artist, album, title, and year.
5. **Apply rename** — files are renamed safely; existing files are never overwritten (a numbered suffix is used instead).
6. **Undo** — the most recent rename operation can be undone from the review screen.

## Troubleshooting

**"Spotify is not configured"**
Copy `.env.example` to `.env` and set `SPOTIFY_CLIENT_ID` as described above, then restart the app.

**A Spotify playlist fails to load with a `403` error**
Spotify blocks third-party API access to algorithmic/personalized playlists (Discover Weekly, Daily Mix, Release Radar, Blend, Made For You), regardless of account or app. Albums and playlists you create yourself are unaffected — try one of those instead.

**Electron crashes with a GPU process error on Linux**
Hardware acceleration is disabled by default to avoid this in constrained environments. If you still see GPU errors, try running with `ELECTRON_DISABLE_GPU=1 npm run dev`.

**Toolbar buttons (minimize/maximize/close, folder picker) don't respond**
Make sure you're running the latest build — `npm run dev` must be fully restarted (not just hot-reloaded) after any change to `src/main/index.ts` or `src/preload/index.ts`, since Electron does not hot-reload the main process or preload script into an already-running window.

## Development

```
npm run dev         # start the app in development
npm test             # run the unit/integration test suite
npm run typecheck    # type-check the project
npm run build        # build production bundles
```

## Packaging

```
npm run package:linux   # AppImage and .deb via electron-builder
npm run package:win     # NSIS installer and portable exe via electron-builder
```

Packaged output is written to `release/` (excluded from Git). Packaging currently produces unsigned builds; a shared public Spotify client ID bundled into these builds is not yet configured (see [roadmap.md](docs/planning-docs/roadmap.md)).

## Project documentation

Detailed product, architecture, and planning documentation lives in [docs/planning-docs](docs/planning-docs/README.md), including the current [implementation roadmap](docs/planning-docs/roadmap.md).
