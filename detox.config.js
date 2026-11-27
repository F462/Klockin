/**
 * Detox configuration for the Klockin app.
 *
 * `android.att.debug` is the default configuration (see the `test:e2e` script in
 * package.json). It targets a physical Android device in USB-debugging mode
 * ("attached"), which is preferred here because the emulator currently does not
 * work for this project.
 *
 * The other configurations exist so the `test:e2e:*` / `build:e2e:*` scripts keep
 * working, but on this machine the attached-device one is the one to use.
 *
 * @type {import('detox').Config}
 */
module.exports = {
	// `detox test` spawns the runner with the args below. By default it runs
	// bare `jest`, which would pick up the root `jest.config.js` (the unit-test
	// config that intentionally excludes `e2e/`). We therefore point jest at the
	// dedicated E2E config so the right tests run.
	testRunner: {
		args: {
			$0: 'jest',
			_: [],
			config: 'e2e/jest.config.js',
		},
	},

	configurations: {
		'ios.sim.debug': {
			device: {
				type: 'iOS Simulator',
				manufacturer: 'Apple',
				platform: 'iOS',
				id: 'iPhone 16',
			},
			app: {
				bundleId: 'com.github.f462.klockin',
				buildCommand:
					'xcodebuild -workspace ios/Klockin.xcworkspace -scheme Klockin -configuration Debug -sdk iphonesimulator -derivedDataPath build/ios',
				artifactPath:
					'build/ios/Build/Products/Debug-iphonesimulator/Klockin.app',
			},
		},

		// Physical Android device ("attached") — the primary E2E target.
		'android.att.debug': {
			device: {
				type: 'android.device',
			},
			app: {
				package: 'com.github.f462.klockin.debug',
				activity: 'com.github.f462.klockin.MainActivity',
				buildCommand:
					'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
				artifactPath:
					'android/app/build/outputs/apk/debug/app-debug.apk',
				cleanupCommand: 'cd android && ./gradlew clean',
			},
		},

		'android.att.release': {
			device: {
				type: 'android.device',
			},
			app: {
				package: 'com.github.f462.klockin',
				activity: 'com.github.f462.klockin.MainActivity',
				buildCommand:
					'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release',
				artifactPath:
					'android/app/build/outputs/apk/release/app-release.apk',
				cleanupCommand: 'cd android && ./gradlew clean',
			},
		},

		// Emulator configuration (kept for CI / other machines; the emulator
		// currently does not work on this development machine).
		'android.emu.debug': {
			device: {
				type: 'android.emulator',
			},
			app: {
				package: 'com.github.f462.klockin.debug',
				activity: 'com.github.f462.klockin.MainActivity',
				buildCommand:
					'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
				artifactPath:
					'android/app/build/outputs/apk/debug/app-debug.apk',
				cleanupCommand: 'cd android && ./gradlew clean',
			},
		},
	},
};
