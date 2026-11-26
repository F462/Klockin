import dayjs from 'dayjs';
import {useEffect} from 'react';
import {NativeModules, Platform} from 'react-native';

import {
	RootState,
	store,
	useAppSelector,
} from 'src/features/data/context/store';
import i18n from 'src/features/localization/utils/i18n';
import {
	getWorkContractHoursForDate,
	getWorkingHoursInSeconds,
} from 'src/features/overview/utils/overviewUtils';
import {selectWorkContractHoursPerDay} from 'src/features/settings/context/settingsSelectors';
import {
	selectActiveTimesheet,
	selectTimesheetListOfCurrentDay,
} from 'src/features/timesheets/context/timesheetsSelectors';

export type ActiveTimesheetNotificationState = {
	active: boolean;
	activeBeginAt: number;
	workedSeconds: number;
	workdaySeconds: number;
	snapshotAt: number;
	channelName: string;
	title: string;
	bodyTemplate: string;
};

type WidgetBridge = {
	updateActiveTimesheetNotification?: (
		state: ActiveTimesheetNotificationState,
	) => void;
};

export const syncActiveTimesheetNotification = (
	state: RootState = store.getState(),
) => {
	if (Platform.OS !== 'android') {
		return;
	}

	const widgetBridge = NativeModules.WidgetBridge as WidgetBridge | undefined;
	const activeTimesheet = selectActiveTimesheet(state);
	const now = dayjs();
	const workedSeconds = getWorkingHoursInSeconds(
		selectTimesheetListOfCurrentDay(state),
		now,
	);
	const workdayHours = getWorkContractHoursForDate(
		selectWorkContractHoursPerDay(state),
		now,
	);

	widgetBridge?.updateActiveTimesheetNotification?.({
		active: activeTimesheet !== undefined,
		activeBeginAt: activeTimesheet?.begin
			? dayjs(activeTimesheet.begin).valueOf()
			: 0,
		workedSeconds: Math.max(0, Math.floor(workedSeconds)),
		workdaySeconds: Math.max(0, Math.round(workdayHours * 3600)),
		snapshotAt: Date.now(),
		channelName: i18n.t('activeTimesheetChannel'),
		title: i18n.t('activeTimesheetNotificationTitle'),
		bodyTemplate: i18n.t('activeTimesheetNotificationBody', {
			current: '__CURRENT__',
			total: '__TOTAL__',
		}),
	});
};

export const ActiveTimesheetNotificationIntegration = () => {
	const activeTimesheet = useAppSelector(selectActiveTimesheet);
	const timesheetsOfCurrentDay = useAppSelector(
		selectTimesheetListOfCurrentDay,
	);
	const workContractHoursPerDay = useAppSelector(selectWorkContractHoursPerDay);

	useEffect(() => {
		syncActiveTimesheetNotification(store.getState());
	}, [activeTimesheet, timesheetsOfCurrentDay, workContractHoursPerDay]);

	return null;
};
