export type OnboardingMode = 'online' | 'offline';

export type OnboardingState = {
	hasDevelopmentWarningBeenShown?: boolean;
	hasSkippedNotificationPermission?: boolean;
	selectedMode?: OnboardingMode;
	hasCompletedOnboarding?: boolean;
};
