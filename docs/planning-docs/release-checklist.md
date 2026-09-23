# GitHub Release Checklist

Use this checklist for every TrackAlign release. Replace `0.1.1` and `v0.1.1` with the version being published.

The More-menu version comes from Electron's `app.getVersion()`, which uses the version in `package.json`. The Changelog panel is generated from the root `CHANGELOG.md` file at build time, so both files must be correct before packaging.

## 1. Choose and prepare the version

- [ ] Choose the semantic version and decide whether it is a pre-release or full release.
- [ ] Confirm the version/tag does not already exist:

  ```bash
  git tag --list v0.1.1
  git ls-remote --tags origin refs/tags/v0.1.1
  gh release view v0.1.1
  ```

- [ ] Update `package.json` and `package-lock.json` without creating a tag yet:

  ```bash
  npm version 0.1.1 --no-git-tag-version
  ```

- [ ] Add the release to the top of `CHANGELOG.md` using the format consumed by the in-app panel:

  ```markdown
  ## 0.1.1

  ### Features

  - Added a user-visible feature.

  ### Enhancements

  - Improved an existing workflow.

  ### Fixes

  - Fixed a reported problem.
  ```

- [ ] Keep release sections in newest-first order. The first `##` release is expanded by default in the app.
- [ ] Update the roadmap and other release documentation as needed.
- [ ] Verify the package-derived version and ensure no runtime version is hard-coded in `src/`:

  ```bash
  node -p "require('./package.json').version"
  rg 'TrackAlign [0-9]+\.[0-9]+\.[0-9]+' src/ || true
  ```

## 2. Validate the source tree

- [ ] Pull or fetch before publishing and ensure `main` is current:

  ```bash
  git fetch origin
  git status --short --branch
  git log --oneline --decorate -5
  ```

- [ ] Review all intended changes and ensure secrets or local files are not tracked:

  ```bash
  git diff --check
  git status --short
  git ls-files .env
  ```

- [ ] Run the complete validation suite:

  ```bash
  npm run typecheck
  npm test
  npm run build
  ```

- [ ] Commit the version and release-preparation changes, then push `main`:

  ```bash
  git add package.json package-lock.json CHANGELOG.md README.md docs/
  git commit -m "Prepare TrackAlign v0.1.1 release"
  git push origin main
  ```

- [ ] Confirm the working tree is clean except for explicitly accepted local-only files.

## 3. Build distributable artifacts

- [ ] Remove or archive stale artifacts from `release/` so old binaries cannot be uploaded accidentally.
- [ ] Build Linux packages:

  ```bash
  npm run package:linux
  ```

- [ ] Build Windows packages (Wine is required when cross-building from Linux):

  ```bash
  npm run package:win
  ```

- [ ] Confirm the expected artifacts exist and contain the new version:

  ```bash
  find release -maxdepth 1 -type f -printf '%f\t%s bytes\n' | sort
  dpkg-deb -I release/trackalign_0.1.1_amd64.deb | grep Version
  ```

- [ ] Inspect packaging output for warnings about default icons, missing resources, signing, or desktop identity.
- [ ] Smoke-test the AppImage and `.deb` on Linux.
- [ ] Smoke-test the installer and portable executable on Windows when a Windows machine is available.
- [ ] Verify OAuth, filesystem access, window controls, app icons, the More-menu version, and Changelog content in an installed build.
- [ ] Confirm the packaged runtime reports the same version as `package.json`; the More menu should not require a separate version edit.
- [ ] Optionally generate checksums and upload them with the release:

  ```bash
  sha256sum \
    release/TrackAlign-0.1.1.AppImage \
    release/trackalign_0.1.1_amd64.deb \
    "release/TrackAlign Setup 0.1.1.exe" \
    "release/TrackAlign 0.1.1.exe" \
    > release/SHA256SUMS
  ```

## 4. Write and review release notes

- [ ] Use the matching `CHANGELOG.md` release section as the source for the GitHub release notes.
- [ ] Create a temporary release-notes file outside the repository, adapting the changelog bullets into a short release summary when needed.
- [ ] Include:
  - A short release summary.
  - Major features and user-visible changes.
  - Installation/download guidance.
  - Known limitations, unsigned-build warnings, and platform restrictions.
  - Upgrade or migration notes, if any.
- [ ] Proofread the notes before publishing.

## 5. Create and push the tag

- [ ] Confirm `HEAD` is the exact commit that was validated and packaged:

  ```bash
  git status --short --branch
  git rev-parse HEAD
  git rev-parse origin/main
  ```

- [ ] Create and push an annotated tag:

  ```bash
  git tag -a v0.1.1 -m "TrackAlign v0.1.1"
  git push origin v0.1.1
  ```

- [ ] Verify the local and remote tag targets match `HEAD`:

  ```bash
  git rev-list -n 1 v0.1.1
  git ls-remote origin refs/tags/v0.1.1^{}
  ```

Do not move or reuse a published tag. Publish a new patch version for corrections.

## 6. Create the GitHub release

- [ ] Confirm GitHub CLI authentication:

  ```bash
  gh auth status
  ```

- [ ] Create the release first, without large assets. Add `--prerelease` for pre-releases; omit it for full releases:

  ```bash
  gh release create v0.1.1 \
    --title "TrackAlign v0.1.1" \
    --notes-file /tmp/release-notes-v0.1.1.md \
    --prerelease
  ```

- [ ] Upload artifacts one at a time so a failed upload can be retried independently:

  ```bash
  gh release upload v0.1.1 release/TrackAlign-0.1.1.AppImage
  gh release upload v0.1.1 release/trackalign_0.1.1_amd64.deb
  gh release upload v0.1.1 "release/TrackAlign Setup 0.1.1.exe"
  gh release upload v0.1.1 "release/TrackAlign 0.1.1.exe"
  gh release upload v0.1.1 release/SHA256SUMS
  ```

Use `--clobber` only when intentionally replacing an incomplete or incorrect asset.

Do not start another terminal command while a large foreground upload is still running in the shared terminal session; doing so can interrupt the upload.

## 7. Verify the published release

- [ ] Verify metadata and every uploaded asset:

  ```bash
  gh release view v0.1.1 \
    --json url,tagName,name,isDraft,isPrerelease,assets \
    --jq '{url,tag: .tagName,name,draft: .isDraft,prerelease: .isPrerelease,assets: [.assets[] | {name,size,state}]}'
  ```

- [ ] Open the release page and verify formatting, links, labels, and download names.
- [ ] Download at least one asset from GitHub and compare its checksum with the local build.
- [ ] Install/download from the public release page and perform a final launch check.
- [ ] Confirm the release tag still points at the intended commit.

## 8. Clean up and follow up

- [ ] Find orphaned draft releases left by interrupted attempts:

  ```bash
  gh api repos/kelmankenberg/TrackAlign/releases \
    --jq '.[] | select(.draft) | {id,tag_name,name,created_at}'
  ```

- [ ] Delete only confirmed orphaned drafts using their release ID:

  ```bash
  gh api --method DELETE repos/kelmankenberg/TrackAlign/releases/RELEASE_ID
  ```

- [ ] Announce the release or link it from Discussions as appropriate.
- [ ] Record smoke-test results and newly discovered issues.
- [ ] Add the next version section to `CHANGELOG.md` when user-visible changes begin accumulating; do not add a separate hard-coded changelog in application code.
- [ ] Move the roadmap to the next development version or milestone.
- [ ] Keep `release/` untracked; release binaries belong in GitHub Releases, not Git history.
