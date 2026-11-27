# Klockin

**One-tap time tracking for [Kimai](https://github.com/kimai/kimai) — even offline.**

Klockin is a native time-tracking companion for [Kimai](https://github.com/kimai/kimai), the open-source time-tracking server. Start, stop, and pause timesheets with a single tap — with or without an internet connection. Entries are stored locally and synchronized with your Kimai server as soon as a connection is available.

> :warning: Klockin has **not** been published to the app stores yet and is still **under active development**. Distribution (F-Droid) is being prepared — see [Releasing](#releasing--distribution).

![License: GPL-3.0-only](https://img.shields.io/badge/license-GPL--3.0--only-blue)
![Platforms: Android · iOS](https://img.shields.io/badge/platforms-Android%20%C2%B7%20iOS-green)

## Feature scope

The sections below reflect the capabilities implemented in the current codebase.

### Time tracking

- **One-tap tracking** — start, stop, pause, and resume the active timesheet instantly.
- **Offline-first** — track time with no connection; entries are stored on-device and synced later.
- **Sync visibility** — per-timesheet sync state (pending / syncing / done / failed) with error details.
- **Rich entries** — attach a description and multiple tags to a timesheet.
- **Default context** — pick a default project and activity to use when starting a new timesheet.

### Kimai data management

- **Customers, projects & activities** — full create / read / update / delete, including customer colors.
- **Timesheets** — browse, delete, and synchronize entries with the server.
- **Tags** — create and delete timesheet tags, and apply them to entries.
- **Teams, roles & users** — view, and create / update / delete teams and users; manage roles.

### NFC

- **Register tags** — associate an NFC tag with a specific project and activity.
- **Tap to track** — start or stop the active timesheet by simply tapping a known tag.
- **Any state** — works in the foreground, in the background, and on cold app launch (Android & iOS).
- **Reprogram tags** — write the `application/x.klockin` NDEF record onto a tag.
- Unknown tags are ignored for tracking and can be registered on the NFC screen.

### Account & security

- **Log in** with a Kimai server URL and API token.
- **QR-code login** — scan a Kimai QR code to fill in the credentials automatically (FOSS `react-native-nitro-zxing`, no Google/ML Kit).
- **Quick token creation** — jump straight to the "create API token" page in your Kimai web UI.
- **Optional app lock** — protect the app with a biometric (fingerprint or face).

### Offline mode & synchronization

- **Offline onboarding** — choose offline mode on first launch and set up customers, projects, and activities locally, without a Kimai account.
- **Delayed sync** — entries are pushed to Kimai once a connection is available.
- **Work-contract sync** — standard working hours per day can be synchronized with the server.

### Backup & restore

- **Manual backup & restore** of all app data via a portable file.
- **Automatic backups** at a configurable interval (off, daily, weekly, bi-weekly, or monthly).
- Covers account, active timesheet, customers, projects, activities, timesheets, tags, NFC tags, onboarding, settings, and synchronization state.

### Home-screen widget

- **Home-screen widget** (Android & iOS) showing today's worked duration, the active timesheet, and the current project / activity — with start / stop controls.
  - The **iOS widget requires iOS 17 or later**. Enable the `group.com.github.f462.klockin` App Group for both the app and the `TimesheetWidget` extension in the Apple Developer account used for signing.

### Overview & work contract

- **Overview dashboard** — yearly and monthly breakdown of worked hours.
- **Work contract** — configure standard working hours per weekday (Monday–Sunday).
- **Daily-hours notification** — a scheduled notification that fires when the day's contracted working hours are reached.
- **Ongoing notification** — a persistent notification tracking the active timesheet (foreground service on Android).

### Preferences & utilities

- **Theming** — system / light / dark, plus a dark-OLED variant.
- **Localization** — German and English (architecture is i18next-based, so more languages can be added).
- **Log export** — export app logs from the About screen to help with support.

## Platform requirements

- **Android** and **iOS** (React Native).
- Optional hardware features, all declared **not required**:
  - **NFC** — for tap-to-track.
  - **Biometrics** — for the app lock.
  - **Camera** — for QR-code login.
- The iOS home-screen widget requires **iOS 17 or later**.

## Getting started

Prerequisites: **Node.js `>= 22.11.0`**, **Yarn 4.x (Berry)**, and either the Android SDK or Xcode.

```sh
# Install dependencies (immutable lockfile)
yarn install --immutable

# Run the app
yarn android    # Android
yarn ios        # iOS

# Start the Metro dev server (separate terminal)
yarn start
```

## Development

| Task                   | Command                                                         |
| ---------------------- | --------------------------------------------------------------- |
| Type-check             | `yarn typecheck`                                                |
| Lint                   | `yarn lint`                                                     |
| Unit tests (Jest)      | `yarn test`                                                     |
| E2E tests (Detox)      | `yarn test:e2e` · `yarn test:e2e:ios` · `yarn test:e2e:android` |
| Dependency-cycle check | `yarn depcyclecheck`                                            |
| Run everything         | `yarn verify`                                                   |

## Releasing / distribution

Klockin targets the [F-Droid](https://f-droid.org/) repository and ships **no proprietary native SDKs** (FOSS-only native dependencies). See [`docs/RELEASE.md`](docs/RELEASE.md) for the build setup (Detox gating, release signing, versioning), the Fastlane / F-Droid metadata, and the release checklist.

The F-Droid metadata is currently a **draft** at [`fdroid/metadata/com.github.f462.klockin.yml`](fdroid/metadata/com.github.f462.klockin.yml) and must be validated before submission.

## Contributing

You want to contribute? The best way is to open an issue. Thanks for helping make this app great!

## License

Klockin is licensed under the **GNU General Public License v3.0 only** (GPL-3.0-only). See the [LICENSE](LICENSE) file for details.
