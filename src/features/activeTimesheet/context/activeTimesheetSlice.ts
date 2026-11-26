import {createSlice, PayloadAction} from '@reduxjs/toolkit';

import {timesheetEdited} from 'src/features/timesheets/context/timesheetActions';
import {Timesheet} from 'src/features/timesheets/types';
import {ActiveTimesheetState, PausedTimesheetTemplate} from '../types';

const initialState: ActiveTimesheetState = {
	activeTimesheetId: undefined,
	notificationPaused: false,
	pausedTimesheetTemplate: undefined,
};

const activeTimesheetSlice = createSlice({
	name: 'activeTimesheet',
	initialState,
	reducers: {
		newTimesheetStarted: (
			state,
			{payload: timesheet}: PayloadAction<Timesheet>,
		) => {
			state.activeTimesheetId = timesheet.id;
			state.notificationPaused = false;
			state.pausedTimesheetTemplate = undefined;
		},
		nextTimesheetStartDatetimeSet: (
			state,
			{payload}: PayloadAction<number | undefined>,
		) => {
			state.nextTimesheetStartDatetime = payload;
		},
		timesheetStopped: (
			state,
			{payload: timesheetId}: PayloadAction<string>,
		) => {
			if (timesheetId === state.activeTimesheetId) {
				state.activeTimesheetId = undefined;
				state.notificationPaused = false;
				state.pausedTimesheetTemplate = undefined;
			}
		},
		notificationPausedSet: (
			state,
			{
				payload,
			}: PayloadAction<{
				paused: boolean;
				template?: PausedTimesheetTemplate;
			}>,
		) => {
			state.notificationPaused = payload.paused;
			state.pausedTimesheetTemplate = payload.paused
				? payload.template
				: undefined;
		},
	},
	extraReducers: (builder) => {
		builder.addCase(timesheetEdited, (state, {payload: timesheet}) => {
			if (timesheet.end == null) {
				// The edited timesheet is ongoing (running), so it becomes the active timesheet.
				state.activeTimesheetId = timesheet.id;
				state.notificationPaused = false;
				state.pausedTimesheetTemplate = undefined;
			} else if (timesheet.id === state.activeTimesheetId) {
				// The edited timesheet was ended and it was the active one, so it is no longer active.
				state.activeTimesheetId = undefined;
				state.notificationPaused = false;
				state.pausedTimesheetTemplate = undefined;
			}
		});
	},
});

export const {
	newTimesheetStarted,
	nextTimesheetStartDatetimeSet,
	notificationPausedSet,
	timesheetStopped,
} = activeTimesheetSlice.actions;
export const activeTimesheetReducer = activeTimesheetSlice.reducer;
