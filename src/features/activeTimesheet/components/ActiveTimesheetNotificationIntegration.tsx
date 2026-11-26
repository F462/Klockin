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
import {selectIsNotificationPaused} from '../context/activeTimesheetSelectors';

export type ActiveTimesheetNotificationState = {
	active: boolean;
	paused: boolean;
	activeBeginAt: number;
	workedSeconds: number;
	workdaySeconds: number;
	snapshotAt: number;
	channelName: string;
	title: string;
	pausedTitle: string;
	bodyTemplate: string;
	pauseLabel: string;
	resumeLabel: string;
	stopLabel: string;
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
	const paused = selectIsNotificationPaused(state);
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
		paused,
		activeBeginAt: activeTimesheet?.begin
			? dayjs(activeTimesheet.begin).valueOf()
			: 0,
		workedSeconds: Math.max(0, Math.floor(workedSeconds)),
		workdaySeconds: Math.max(0, Math.round(workdayHours * 3600)),
		snapshotAt: Date.now(),
		channelName: i18n.t('activeTimesheetChannel'),
		title: i18n.t('activeTimesheetNotificationTitle'),
		pausedTitle: i18n.t('activeTimesheetNotificationPausedTitle'),
		bodyTemplate: i18n.t('activeTimesheetNotificationBody', {
			current: '__CURRENT__',
			total: '__TOTAL__',
		}),
		pauseLabel: i18n.t('activeTimesheetNotificationPause'),
		resumeLabel: i18n.t('activeTimesheetNotificationResume'),
		stopLabel: i18n.t('activeTimesheetNotificationStop'),
	});
};

export const ActiveTimesheetNotificationIntegration = () => {
	const activeTimesheet = useAppSelector(selectActiveTimesheet);
	const isNotificationPaused = useAppSelector(selectIsNotificationPaused);
	const timesheetsOfCurrentDay = useAppSelector(
		selectTimesheetListOfCurrentDay,
	);
	const workContractHoursPerDay = useAppSelector(selectWorkContractHoursPerDay);

	useEffect(() => {
		syncActiveTimesheetNotification(store.getState());
	}, [
		activeTimesheet,
		isNotificationPaused,
		timesheetsOfCurrentDay,
		workContractHoursPerDay,
	]);

	return null;
};
