import {createSlice} from '@reduxjs/toolkit';

import {OnboardingState} from '../types';

const initialState: OnboardingState = {};

const onboardingSlice = createSlice({
	name: 'onboarding',
	initialState,
	reducers: {
		developmentWarningShown: (state) => {
			state.hasDevelopmentWarningBeenShown = true;
		},
		notificationPermissionSkipped: (state) => {
			state.hasSkippedNotificationPermission = true;
		},
		chosenOfflineWorkflow: (state) => {
			state.hasChosenOfflineWorkflow = true;
		},
		serverSetupCompleted: (state) => {
			state.hasCompletedServerSetup = true;
		},
	},
});

export const {
	developmentWarningShown,
	notificationPermissionSkipped,
	chosenOfflineWorkflow,
	serverSetupCompleted,
} = onboardingSlice.actions;
export const onboardingReducer = onboardingSlice.reducer;
