import {NativeModules, Platform} from 'react-native';

interface NativeAppInfoConstants {
	appName?: string;
	versionName?: string;
	versionCode?: string;
	deviceModel?: string;
	systemName?: string;
	systemVersion?: string;
}

const getNativeAppInfo = (): NativeAppInfoConstants =>
	(NativeModules.WidgetBridge as NativeAppInfoConstants | undefined) ?? {};

export const getAppName = (): string => getNativeAppInfo().appName ?? 'Klockin';

export const getAppVersion = (): string =>
	getNativeAppInfo().versionName ?? '0.0.0';

export const getBuildNumber = (): string =>
	getNativeAppInfo().versionCode ?? '0';

export const getReadableVersion = (): string =>
	`${getAppVersion()} (${getBuildNumber()})`;

export const getDeviceModel = (): string =>
	getNativeAppInfo().deviceModel ?? 'Unknown';

export const getSystemName = (): string =>
	getNativeAppInfo().systemName ?? (Platform.OS === 'ios' ? 'iOS' : 'Android');

export const getSystemVersion = (): string =>
	getNativeAppInfo().systemVersion ?? String(Platform.Version);
