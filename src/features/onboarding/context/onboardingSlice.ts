import {createSlice} from '@reduxjs/toolkit';

import {OnboardingMode, OnboardingState} from '../types';

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
		selectedModeChanged: (state, {payload}: {payload: OnboardingMode}) => {
			state.selectedMode = payload;
		},
		onboardingCompleted: (state) => {
			state.hasCompletedOnboarding = true;
		},
	},
});

export const {
	developmentWarningShown,
	notificationPermissionSkipped,
	selectedModeChanged,
	onboardingCompleted,
} = onboardingSlice.actions;
export const onboardingReducer = onboardingSlice.reducer;
