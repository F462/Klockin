export type PausedTimesheetTemplate = {
	project?: number;
	activity?: number;
	description?: null;
	tags?: string[];
};

export type ActiveTimesheetState = {
	activeTimesheetId: string | undefined;
	nextTimesheetStartDatetime?: number;
	notificationPaused?: boolean;
	pausedTimesheetTemplate?: PausedTimesheetTemplate;
};
