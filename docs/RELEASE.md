# Releasing to the Play Store

## Prerequisites

- Android Studio installed (build script reuses its bundled JRE)
- `android/keystore.properties` present locally (release signing config, not committed)

## Steps

1. **Bump the version** in `android/app/build.gradle`:
   ```gradle
   versionCode 4    // increment by 1 — must be higher than any version ever uploaded
   versionName "1.3" // human-readable version, bump as appropriate (semver-ish)
   ```
   Play Console rejects a `versionCode` that's already been used, even by a build you never
   published — check the Play Console release history if unsure what the last used code was.

2. **Build the signed AAB**:
   ```bash
   ./scripts/release-aab.sh
   ```
   This builds the web app, syncs Capacitor, and runs `gradlew bundleRelease`. Output:
   ```
   android/app/build/outputs/bundle/release/app-release.aab
   ```

3. **Upload to Play Console**:
   - Go to Play Console > your app > Release > (choose track, e.g. Production/Internal testing)
   - Create new release, upload `app-release.aab`
   - Add release notes for each supported locale (e.g. `en-US`)
   - Review and roll out

4. **Commit the version bump** (`android/app/build.gradle`) and push/PR it, so the repo stays
   in sync with what's live.
