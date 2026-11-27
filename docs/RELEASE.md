# Releasing to F-Droid

Klockin targets the [F-Droid](https://f-droid.org/) repository. This document
describes how to prepare, build, and submit a release.

## Hard blockers (already resolved)

F-Droid forbids proprietary libraries and Google Play / ML Kit dependencies.
Klockin ships **no** proprietary native SDKs:

- QR scanning uses the FOSS [`react-native-nitro-zxing`](https://github.com/margelo/nitro-modules)
  (no `react-native-vision-camera-barcode-scanner` / Google ML Kit).
- App version/build info is exposed through the native `WidgetBridge` module
  (no `react-native-device-info` / Play Install Referrer).

If you add a new native dependency, verify it is free software and pulls no
`com.google.*` (non-FDroid) artifacts before it can ship on F-Droid.

## Gradle build setup

### Detox is gated behind `-PenableDetox`

The Detox E2E driver ships a prebuilt `.aar` inside `node_modules`, which
F-Droid's scanner flags. It is therefore **only** wired into the build when you
opt in with the `enableDetox` Gradle property:

- `android/build.gradle` — the local Maven repo (`node_modules/detox/Detox-android`).
- `android/app/build.gradle` — the `proguardFile` and `androidTestImplementation('com.wix:detox:+')`.

So:

```sh
# Regular / F-Droid-style release build (no Detox, unsigned APK)
cd android && ./gradlew assembleRelease

# E2E build (pulls the Detox driver + its ProGuard rules)
cd android && ./gradlew :app:assembleDebug :app:assembleAndroidTest -DtestBuildType=debug -PenableDetox
```

The `detox` scripts already pass `-PenableDetox` (see `.detoxrc.js`), so
`yarn test:e2e` / `yarn build:e2e` continue to work unchanged.

### Release signing

F-Droid signs every APK with its own key, so **no** release keystore is
required in the repo. The `release` build type is left unsigned by default.
To self-sign (e.g. for a custom store), drop a `signing.properties` file next to
`android/app/build.gradle`:

```properties
storeFile=/absolute/path/release.keystore
storePassword=...
keyAlias=...
keyPassword=...
```

`signing.properties` is git-ignored — never commit keystore secrets.

### Versioning

`versionCode` and `versionName` live in `android/app/build.gradle` and must stay
in sync with `version` in `package.json`. F-Droid uses
`UpdateCheckMode: Tags` + `AutoUpdateMode: Version`, so it parses these two
values from each tagged release. Bump both when cutting a release.

## Fastlane / F-Droid metadata

- `fastlane/metadata/android/en-US/` — title, short/full description, changelog,
  and `images/icon.png` (reused from the launcher icon). **Add phone
  screenshots** under `images/phoneScreenshots/` before submitting.
- `fdroid/metadata/com.github.f462.klockin.yml` — a **draft** F-Droid metadata
  file. Validate it before submitting.

## Build environment

- Node `>= 22.11.0`, Yarn `4.x` (Berry).
- Gradle `9.4.1` (`android/gradle/wrapper/gradle-wrapper.properties`).
- `compileSdkVersion 37`, `buildToolsVersion 37.0.0`, `ndkVersion 27.1.12297006`.
- The custom Yarn plugin `.yarn/plugins/@yarnpkg/plugin-licenses.cjs` referenced
  by `.yarnrc.yml` is committed, so `yarn install --immutable` works in
  F-Droid's offline phase.

## Submitting a release (checklist)

1. **Bump the version.** Update `package.json` (`version`),
   `android/app/build.gradle` (`versionCode` + `versionName`), and the F-Droid
   metadata (`VersionCode` + `VersionName`) so all three match.
2. **Add a changelog** at `fastlane/metadata/android/en-US/changelogs/<versionCode>.txt`.
3. **Validate locally** with `fdroidserver`:
   ```sh
   fdroid build --draft fdroid/metadata/com.github.f462.klockin.yml   # or your draft copy
   fdroid scanner <path-to-apk>
   ```
   Fix any binary blobs, non-free repositories, or offline-build failures.
4. **Tag the release** in git (F-Droid's `UpdateCheckMode: Tags` relies on this):
   ```sh
   git tag -a v0.0.1 -m "Release 0.0.1"
   git push origin v0.0.1
   ```
5. **Submit** a merge request to <https://gitlab.com/fdroid/fdroiddata> adding
   `metadata/com.github.f462.klockin.yml` (derived from the draft in this repo),
   or open a **Request for Packaging** issue with the same file.

## Git tags

F-Droid discovers new versions via git tags. Currently the repository has no
release tags yet. From now on, tag every release as `v<versionName>`
(e.g. `v1.0.0`) and push the tag after the F-Droid metadata and changelog are
in place.
