import uuid from 'react-native-uuid';

import {selectSelectedActivityId} from 'src/features/activities/context/activitiesSelectors';
import {createAppAsyncThunk} from 'src/features/data/middleware/createAppAsyncThunk';
import {selectSelectedProjectId} from 'src/features/projects/context/projectsSelectors';
import {selectActiveTimesheet} from 'src/features/timesheets/context/timesheetsSelectors';
import {
	selectActiveTimesheetId,
	selectPausedTimesheetTemplate,
} from '../context/activeTimesheetSelectors';
import {
	newTimesheetStarted,
	notificationPausedSet,
	timesheetStopped,
} from '../context/activeTimesheetSlice';

export const stopActiveTimesheet = createAppAsyncThunk<void, void>(
	'timesheets/stopActiveTimesheet',
	async (_, {dispatch, getState}) => {
		const activeTimesheetId = selectActiveTimesheetId(getState());

		if (activeTimesheetId === undefined) {
			throw Error('no timesheet active');
		}

		dispatch(timesheetStopped(activeTimesheetId));
	},
);

export const pauseActiveTimesheet = createAppAsyncThunk<void, void>(
	'timesheets/pauseActiveTimesheet',
	async (_, {dispatch, getState}) => {
		const state = getState();
		const activeTimesheetId = selectActiveTimesheetId(state);

		if (activeTimesheetId === undefined) {
			return;
		}

		const activeTimesheet = selectActiveTimesheet(state);
		const template = activeTimesheet
			? {
					project: activeTimesheet.project,
					activity: activeTimesheet.activity,
					description: activeTimesheet.description,
					tags: activeTimesheet.tags,
				}
			: undefined;

		dispatch(timesheetStopped(activeTimesheetId));
		dispatch(notificationPausedSet({paused: true, template}));
	},
);

export const resumePausedTimesheet = createAppAsyncThunk<void, void>(
	'timesheets/resumePausedTimesheet',
	async (_, {dispatch, getState}) => {
		const state = getState();
		if (selectActiveTimesheetId(state) !== undefined) {
			return;
		}

		const template = selectPausedTimesheetTemplate(state);
		const project = template?.project ?? selectSelectedProjectId(state);
		const activity = template?.activity ?? selectSelectedActivityId(state);

		if (project === undefined || activity === undefined) {
			return;
		}

		dispatch(
			newTimesheetStarted({
				id: uuid.v4(),
				begin: new Date().toISOString(),
				project,
				activity,
				...(template?.description !== undefined
					? {description: template.description}
					: {}),
				...(template?.tags !== undefined ? {tags: template.tags} : {}),
			}),
		);
	},
);
