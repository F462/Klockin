/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      '$0': 'jest',
      config: 'e2e/jest.config.js'
    },
    jest: {
      setupTimeout: 120000
    }
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/Klockin.app',
      build: 'cd ios && xcodebuild build-for-testing -workspace Klockin.xcworkspace -scheme Klockin -configuration Debug -destination "platform=iOS Simulator,name=iPhone 16" -derivedDataPath build'
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/Klockin.app',
      build: 'cd ios && xcodebuild build-for-testing -workspace Klockin.xcworkspace -scheme Klockin -configuration Release -destination "platform=iOS Simulator,name=iPhone 16" -derivedDataPath build'
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      // Scoped to :app on purpose: running `assembleAndroidTest` at the root
      // would also compile third-party libraries' androidTest sources, some of
      // which (e.g. react-native-encrypted-storage) do not compile.
      // -PenableDetox wires in the Detox driver (maven repo + androidTest dep)
      // that is otherwise gated out of production builds.
      build: 'cd android && ./gradlew :app:assembleDebug :app:assembleAndroidTest -DtestBuildType=debug -PenableDetox',
      reversePorts: [
        8081
      ]
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd android && ./gradlew :app:assembleRelease :app:assembleAndroidTest -DtestBuildType=release -PenableDetox'
    }
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15'
      }
    },
    attached: {
      type: 'android.attached',
      device: {
        adbName: '.*'
      }
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_7_API_34'
      }
    }
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug'
    },
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.release'
    },
    'android.att.debug': {
      device: 'attached',
      app: 'android.debug'
    },
    'android.att.release': {
      device: 'attached',
      app: 'android.release'
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug'
    },
    'android.emu.release': {
      device: 'emulator',
      app: 'android.release'
    }
  }
};
