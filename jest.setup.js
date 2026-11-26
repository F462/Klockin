import {jest} from '@jest/globals';

jest.mock('react-native-notify-kit', () =>
	require('react-native-notify-kit/jest-mock')
);

jest.mock('@react-native-async-storage/async-storage', () =>
	require('@react-native-async-storage/async-storage/jest')
);

jest.mock('react-native-worklets', () =>
	require('react-native-worklets/lib/module/mock')
);

// The test renderer hits a react-native-paper portal-context error in this
// environment even when the component tree is wrapped correctly. Keep the real
// Paper components for styling and inputs, but render portal content inline so
// the tests can exercise the app logic without the portal manager crashing.
jest.mock('react-native-paper', () => {
	const React = require('react');
	const actual = jest.requireActual('react-native-paper');
	const Portal = ({children}) => React.createElement(React.Fragment, null, children);
	Portal.Host = ({children}) => React.createElement(React.Fragment, null, children);
	return {
		...actual,
		Portal,
	};
});

// see https://react.i18next.com/misc/testing
// Return a stable `t` and a stable object across renders: the real
// `useTranslation` keeps the same reference while the language is unchanged.
// A fresh object per call makes `t` (and any callback built on it) change on
// every render, which re-runs effects on every render and can cause render
// loops once those effects schedule state updates.
jest.mock('react-i18next', () => {
	const t = (key) => key;
	const value = {t, i18n: {language: 'en'}};
	return {
		useTranslation: () => value,
		initReactI18next: {
			type: '3rdParty',
			init: () => {}
		}
	};
});

jest.mock('@react-navigation/drawer', () => {
	const React = require('react');
	const { View } = require('react-native');

	return {
		createDrawerNavigator: () => ({
			Navigator: ({ children }) => <View>{children}</View>,
			Screen: ({ children }) => <View>{children}</View>,
		}),
		DrawerContentScrollView: ({ children }) => <View>{children}</View>,
		DrawerItemList: () => null,
		DrawerItem: () => null,
	};
});

jest.mock('react-native-localize', () => ({
	findBestLanguageTag: jest.fn()
}));

jest.mock('react-native-encrypted-storage', () => ({
	setItem: jest.fn(() => Promise.resolve()),
	getItem: jest.fn(() => Promise.resolve(null)),
	removeItem: jest.fn(() => Promise.resolve()),
	clear: jest.fn(() => Promise.resolve())
}));

// react-native-paper resolves its icons through this package, whose entry
// requires a binary .ttf font that Jest cannot parse. Mock it so the icon
// loader succeeds instead of falling back to the "no icon library installed"
// warning.
jest.mock('@react-native-vector-icons/material-design-icons', () => {
	const React = require('react');
	const {Text} = require('react-native');
	const MaterialDesignIcons = ({name, size, ...props}) =>
		React.createElement(Text, props, name || '');
	MaterialDesignIcons.displayName = 'MaterialDesignIcons';
	return {
		__esModule: true,
		default: MaterialDesignIcons,
		MaterialDesignIcons,
	};
});

// Return a static time instead of scheduling a real setInterval. A live
// interval is an open handle that keeps a Jest worker process from exiting
// gracefully after the test that rendered it has finished.
jest.mock('src/features/utils/useTime', () => {
	const dayjs = require('dayjs');
	return {
		useTime: () => dayjs(),
	};
});

jest.mock('react-native-bootsplash', () => {
	return {
		hide: jest.fn().mockResolvedValue(),
		isVisible: jest.fn().mockResolvedValue(false),
		useHideAnimation: jest.fn().mockReturnValue({
			container: {},
			logo: {source: 0},
			brand: {source: 0}
		})
	};
});

// NativeModules.WidgetBridge is mocked per-test where needed.

// see https://www.npmjs.com/package/@react-native-community/netinfo
import mockRNCNetInfo from '@react-native-community/netinfo/jest/netinfo-mock.js';
jest.mock('@react-native-community/netinfo', () => mockRNCNetInfo);

// see https://github.com/react-native-share/react-native-share/issues/598
jest.mock('react-native-share', () => ({
	default: jest.fn()
}));

jest.mock('react-native-zip-archive', () => ({
	zip: jest.fn()
}));

// see https://gist.github.com/sipamungkas/8922cded82ac909cd62369957eb17c81
jest.mock('react-native-blob-util', () => {
	return {
		__esModule: true,
		default: {
			DocumentDir: jest.fn(),
			config: jest.fn(() => ({
				fetch: jest.fn(() => ({
					progress: jest.fn().mockResolvedValue(true)
				}))
			})),
			fs: {
				cp: jest.fn().mockResolvedValue(true),
				dirs: {
					CacheDir: '/mockCacheDir'
				},
				unlink: jest.fn()
			}
		}
	};
});

jest.mock('react-native-file-logger', () => ({
	FileLogger: {
		configure: jest.fn(() => Promise.resolve()),
		debug: jest.fn(),
		info: jest.fn(),
		warn: jest.fn(),
		error: jest.fn()
	}
}));

// to fix RN 0.80 bug, see https://github.com/facebook/react-native/issues/51993
jest.mock('react-native/Libraries/Components/RefreshControl/RefreshControl', () => ({
	__esModule: true,
	default: require('./__mocks__/RefreshControlMock'),
}));

// Mock VisionCamera and Nitro Zxing for Jest
jest.mock('react-native-vision-camera', () => {
  return {
    Camera: (props) => null,
    useCameraDevice: () => ({ id: '0', position: 'back', facing: 'back' }),
    useCameraPermission: () => ({
      hasPermission: true,
      requestPermission: jest.fn().mockResolvedValue(true),
    }),
    useFrameOutput: () => ({
      // mock frame output, not used in tests directly
    }),
  };
});

jest.mock('react-native-nitro-zxing', () => {
  return {
    useBarcodeScanner: () => ({
      scanCodes: jest.fn(() => []),
    }),
  };
});

// Mock react-native-reanimated for Jest (minimal stub)
jest.mock('react-native-reanimated', () => {
  return {
    // Provide a no-op implementation of runOnJS used in QrScanner
    runOnJS: (fn) => fn,
    // Stub other common exports as no-ops to avoid runtime errors
    createAnimatedComponent: (Component) => Component,
    useSharedValue: () => ({ value: 0 }),
    useAnimatedStyle: () => ({}),
    withTiming: (value) => value,
    useEvent: () => {},
  };
});


