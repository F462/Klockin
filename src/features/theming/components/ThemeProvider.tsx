import {DefaultTheme as NavigationDefaultTheme} from '@react-navigation/native';
import deepmerge from 'deepmerge';
import React, {useMemo} from 'react';
import {Appearance} from 'react-native';
import {
	adaptNavigationTheme,
	MD3DarkTheme as PaperDefaultDarkTheme,
	MD3LightTheme as PaperDefaultLightTheme,
	PaperProvider,
} from 'react-native-paper';

import {useAppSelector} from 'src/features/data/context/store';
import {
	selectAppTheme,
	selectIsDarkOledEnabled,
} from 'src/features/settings/context/settingsSelectors';
import {AppTheme} from 'src/features/settings/types';

const {LightTheme: navigationLightTheme, DarkTheme: navigationDarkTheme} =
	adaptNavigationTheme({
		reactNavigationLight: NavigationDefaultTheme,
		reactNavigationDark: NavigationDefaultTheme,
	});

const paperLightTheme = {
	...PaperDefaultLightTheme,
	colors: {
		// Material 3 tonal palette seeded with #059669 (emerald)
		primary: 'rgb(5, 150, 105)',
		onPrimary: 'rgb(255, 255, 255)',
		primaryContainer: 'rgb(209, 250, 229)',
		onPrimaryContainer: 'rgb(2, 44, 34)',
		secondary: 'rgb(72, 91, 85)',
		onSecondary: 'rgb(255, 255, 255)',
		secondaryContainer: 'rgb(224, 235, 231)',
		onSecondaryContainer: 'rgb(31, 46, 42)',
		tertiary: 'rgb(55, 98, 151)',
		onTertiary: 'rgb(255, 255, 255)',
		tertiaryContainer: 'rgb(221, 233, 247)',
		onTertiaryContainer: 'rgb(10, 45, 80)',
		error: 'rgb(186, 26, 26)',
		onError: 'rgb(255, 255, 255)',
		errorContainer: 'rgb(255, 218, 214)',
		onErrorContainer: 'rgb(65, 0, 2)',
		background: 'rgb(245, 250, 248)',
		onBackground: 'rgb(23, 30, 27)',
		surface: 'rgb(245, 250, 248)',
		onSurface: 'rgb(23, 30, 27)',
		surfaceVariant: 'rgb(226, 233, 231)',
		onSurfaceVariant: 'rgb(67, 86, 80)',
		outline: 'rgb(87, 117, 108)',
		outlineVariant: 'rgb(196, 212, 207)',
		shadow: 'rgb(0, 0, 0)',
		scrim: 'rgb(0, 0, 0)',
		inverseSurface: 'rgb(47, 55, 53)',
		inverseOnSurface: 'rgb(207, 226, 220)',
		inversePrimary: 'rgb(110, 231, 183)',
		elevation: {
			level0: 'transparent',
			level1: 'rgb(240, 245, 243)',
			level2: 'rgb(234, 240, 238)',
			level3: 'rgb(229, 235, 233)',
			level4: 'rgb(226, 233, 231)',
			level5: 'rgb(222, 230, 227)',
		},
		surfaceDisabled: 'rgba(23, 30, 27, 0.12)',
		onSurfaceDisabled: 'rgba(23, 30, 27, 0.38)',
		backdrop: 'rgba(23, 30, 27, 0.4)',
	},
};
const combinedLightTheme = deepmerge(navigationLightTheme, paperLightTheme);

const paperDarkTheme = {
	...PaperDefaultDarkTheme,
	colors: {
		// Material 3 tonal palette seeded with #059669 (emerald)
		primary: 'rgb(110, 231, 183)',
		onPrimary: 'rgb(6, 78, 59)',
		primaryContainer: 'rgb(6, 95, 70)',
		onPrimaryContainer: 'rgb(167, 243, 208)',
		secondary: 'rgb(182, 201, 195)',
		onSecondary: 'rgb(41, 55, 50)',
		secondaryContainer: 'rgb(59, 79, 73)',
		onSecondaryContainer: 'rgb(211, 222, 219)',
		tertiary: 'rgb(179, 200, 230)',
		onTertiary: 'rgb(20, 46, 82)',
		tertiaryContainer: 'rgb(39, 66, 104)',
		onTertiaryContainer: 'rgb(199, 218, 245)',
		error: 'rgb(255, 180, 171)',
		onError: 'rgb(105, 0, 5)',
		errorContainer: 'rgb(147, 0, 10)',
		onErrorContainer: 'rgb(255, 180, 171)',
		background: 'rgb(21, 25, 24)',
		onBackground: 'rgb(222, 227, 225)',
		surface: 'rgb(21, 25, 24)',
		onSurface: 'rgb(222, 227, 225)',
		surfaceVariant: 'rgb(56, 66, 63)',
		onSurfaceVariant: 'rgb(193, 205, 201)',
		outline: 'rgb(129, 152, 145)',
		outlineVariant: 'rgb(56, 66, 63)',
		shadow: 'rgb(0, 0, 0)',
		scrim: 'rgb(0, 0, 0)',
		inverseSurface: 'rgb(222, 227, 225)',
		inverseOnSurface: 'rgb(52, 61, 58)',
		inversePrimary: 'rgb(5, 150, 105)',
		elevation: {
			level0: 'transparent',
			level1: 'rgb(29, 32, 31)',
			level2: 'rgb(32, 35, 34)',
			level3: 'rgb(34, 37, 36)',
			level4: 'rgb(35, 39, 38)',
			level5: 'rgb(38, 41, 40)',
		},
		surfaceDisabled: 'rgba(222, 227, 225, 0.12)',
		onSurfaceDisabled: 'rgba(222, 227, 225, 0.38)',
		backdrop: 'rgba(23, 30, 27, 0.6)',
	},
};
const combinedDarkTheme = deepmerge(navigationDarkTheme, paperDarkTheme);

const combinedDarkOledTheme = deepmerge(combinedDarkTheme, {
	colors: {
		background: 'rgb(0, 0, 0)',
	},
});

export const ThemeProvider = ({children}: React.PropsWithChildren<{}>) => {
	const appThemeSetting = useAppSelector(selectAppTheme);
	const isDarkOledEnabled = useAppSelector(selectIsDarkOledEnabled);

	const theme = useMemo(() => {
		let isDark: boolean;
		switch (appThemeSetting) {
			case AppTheme.DARK:
				isDark = true;
				break;
			case AppTheme.SYSTEM:
				isDark = Appearance.getColorScheme() === 'dark';
				break;
			default:
				isDark = false;
				break;
		}

		if (!isDark) {
			return combinedLightTheme;
		}
		return isDarkOledEnabled ? combinedDarkOledTheme : combinedDarkTheme;
	}, [appThemeSetting, isDarkOledEnabled]);

	return <PaperProvider theme={theme}>{children}</PaperProvider>;
};
