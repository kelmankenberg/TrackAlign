# Spotify Discovery: Browse and Search

Status: **planning — not yet implemented.** This document covers two related but distinct feature proposals for making it easier to find a Spotify playlist or album to load, beyond pasting a URL directly.

## Motivation

Today, loading a Spotify collection requires the user to already have the playlist/album URL in hand (copied from Spotify itself). That's a real point of friction — the user has to leave TrackAlign, find the item in Spotify, copy its share link, and come back. Both proposals below aim to remove that round trip.

## Feature A: "Browse Spotify" slideout

Let the user open a Spotify browsing surface inside TrackAlign, find a playlist or album visually, and select it — with manual URL paste remaining available as a fallback (this already exists today in the current "Load a playlist or album" dialog).

### Two possible implementations

**A1. Embed the real open.spotify.com web player** (via Electron `<webview>` or `BrowserView`), let the user browse/search however they like using Spotify's own UI, detect when they've navigated to a playlist or album page (URL matches `open.spotify.com/playlist/:id` or `/album/:id`), and surface a "Use this playlist/album" action in TrackAlign's UI.

- Pros: Full fidelity — the user gets Spotify's actual browsing/search/recommendation experience, including anything not exposed by the Web API.
- Cons / risks:
  - Requires a **second, separate Spotify sign-in** — the embedded browser needs the user's normal Spotify *website* session (cookies), which is entirely independent of the OAuth access token TrackAlign already obtains for API calls. Users would effectively "connect to Spotify" twice, in two different ways, which is likely to be confusing.
  - Electron webviews embedding third-party sites carry real security considerations (OWASP-relevant): the embedded content is untrusted remote JS. It must run with `nodeIntegration: false`, `contextIsolation: true`, no preload script exposure, and navigation should be restricted (`will-navigate`/`will-redirect` handlers) to Spotify's own domains to prevent the embedded surface from being used to phish or load arbitrary/malicious content.
  - Heavier to build and maintain than a native list (embedding a full site's layout/CSS inside our app, handling Spotify's own login flow inside the webview, keeping up with Spotify web UI changes).

**A2. Native "Your Library" browse list**, built from the Spotify Web API using the OAuth token TrackAlign already has: list the connected user's own playlists (`GET /me/playlists`) and saved albums (`GET /me/albums`) as a native, styled list (cover art, name, owner, track count) inside a TrackAlign slideout. Clicking an item loads it, same as pasting its URL today.

- Pros: No embedded browser, no second sign-in, no new security surface — reuses the existing OAuth flow and fetch-based pattern from `src/shared/spotify.ts`. Consistent with the rest of the app's native UI.
- Cons: Only surfaces playlists/albums already in the user's own library (or ones they follow) — not arbitrary public content by name. That gap is exactly what Feature B (Search) fills.
- Requires an additional OAuth scope: `playlist-read-private` is already requested; would also need `user-library-read` for saved albums.

**Recommendation:** A2 (native library browse), combined with Feature B (search) in the same slideout, gives equivalent practical value to A1 with far less complexity and no duplicate-auth confusion. I'd suggest treating A1 (embedded browser) as a "maybe later" idea rather than committing to it now, unless there's a specific reason the native API-driven approach won't cover your use case.

## Feature B: Search Spotify by name

Add a search box (in the same slideout as Feature A, or standalone) that calls Spotify's `GET /v1/search?q=...&type=playlist,album` endpoint using the existing OAuth token, shows native result cards (cover art, name, owner/artist, track count), and lets the user pick one to load — auto-filling the source URL, same end state as pasting it manually.

- No new OAuth scopes needed — search works with any valid user token.
- Low implementation risk: purely additive to `src/shared/spotify.ts`, no new auth flow, no embedded browser.
- This is very likely the highest-value, lowest-risk piece of the two proposals, and could ship on its own even without Feature A.

## Proposed combined UX

Replace/extend today's "Load a playlist or album" dialog with a slideout that has:
1. A search box at the top (Feature B) — the default/primary way to find something.
2. Below it, a "Your playlists" / "Your saved albums" native list (Feature A2) for quick access to things already in the user's library.
3. The existing manual URL paste field, kept as a fallback/power-user path.

## Open questions

1. **Scope for Feature A2:** Do you want both "Your playlists" *and* "Your saved albums" browsable, or just one? Saved albums require adding the `user-library-read` scope (a re-consent the next time the user connects/reconnects Spotify).
2. **Search scope:** Should search cover playlists, albums, or both by default (with a toggle), matching the existing Playlist/Album tabs in today's dialog?
3. **Result count/pagination:** Should search results be a fixed short list (e.g. top 10) with no pagination, or support "load more"?
4. **Feature A1 (embedded browser):** Given the tradeoffs above, are you okay dropping this in favor of A2 + Search, or is there a specific reason you want the actual Spotify web UI embedded (e.g. discovering things via Spotify's own recommendations/browse tab that the Web API doesn't expose)?
5. **Rollout:** Build Search (Feature B) first as a standalone, low-risk improvement, then layer in the native library browse (A2) afterward? Or build them together as one slideout from the start?
