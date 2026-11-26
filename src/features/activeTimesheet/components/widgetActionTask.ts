import dayjs from 'dayjs';
import uuid from 'react-native-uuid';

import {
	persistor,
	store,
	waitForStoreRehydration,
} from 'src/features/data/context/store';
import {getWorkingHoursInSeconds} from 'src/features/overview/utils/overviewUtils';
import {
	selectActiveTimesheet,
	selectTimesheetListOfCurrentDay,
} from '../../timesheets/context/timesheetsSelectors';
import {
	selectActiveTimesheetId,
	selectCanTimesheetBeStarted,
	selectIsNotificationPaused,
} from '../context/activeTimesheetSelectors';
import {
	newTimesheetStarted,
	notificationPausedSet,
} from '../context/activeTimesheetSlice';
import {
	pauseActiveTimesheet,
	resumePausedTimesheet,
	stopActiveTimesheet,
} from '../middleware/activeTimesheetThunks';
import {syncActiveTimesheetNotification} from './ActiveTimesheetNotificationIntegration';
import {publishTimesheetWidgetState} from './TimesheetWidgetIntegration';

const publishCurrentWidgetState = () => {
	const state = store.getState();
	const activeTimesheet = selectActiveTimesheet(state);
	const workedSeconds = getWorkingHoursInSeconds(
		selectTimesheetListOfCurrentDay(state),
		dayjs(),
	);

	publishTimesheetWidgetState({
		workedSeconds: Math.max(0, Math.floor(workedSeconds)),
		active: activeTimesheet !== undefined,
		activeBeginAt: activeTimesheet?.begin
			? dayjs(activeTimesheet.begin).valueOf()
			: 0,
		snapshotAt: Date.now(),
	});
};

export const runWidgetAction = async ({action}: {action: string}) => {
	if (
		action !== 'toggle' &&
		action !== 'pause' &&
		action !== 'resume' &&
		action !== 'stop'
	) {
		return;
	}

	await waitForStoreRehydration();
	const state = store.getState();
	const activeTimesheetId = selectActiveTimesheetId(state);

	if (action === 'toggle') {
		if (activeTimesheetId !== undefined) {
			await store.dispatch(stopActiveTimesheet()).unwrap();
		} else if (selectCanTimesheetBeStarted(state)) {
			store.dispatch(
				newTimesheetStarted({
					id: uuid.v4(),
					begin: new Date().toISOString(),
					project: state.projects.selectedProjectId,
					activity: state.activities.selectedActivityId,
				}),
			);
		}
	} else if (action === 'pause') {
		if (activeTimesheetId !== undefined) {
			await store.dispatch(pauseActiveTimesheet()).unwrap();
		}
	} else if (action === 'resume') {
		await store.dispatch(resumePausedTimesheet()).unwrap();
	} else if (action === 'stop') {
		if (activeTimesheetId !== undefined) {
			await store.dispatch(stopActiveTimesheet()).unwrap();
		} else if (selectIsNotificationPaused(state)) {
			store.dispatch(notificationPausedSet({paused: false}));
		}
	}

	await persistor.flush();
	publishCurrentWidgetState();
	syncActiveTimesheetNotification(store.getState());
};
