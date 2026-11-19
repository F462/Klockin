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
} from '../context/activeTimesheetSelectors';
import {newTimesheetStarted} from '../context/activeTimesheetSlice';
import {stopActiveTimesheet} from '../middleware/activeTimesheetThunks';
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
	if (action !== 'toggle') {
		return;
	}

	await waitForStoreRehydration();
	const state = store.getState();
	const activeTimesheetId = selectActiveTimesheetId(state);

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

	await persistor.flush();
	publishCurrentWidgetState();
};
