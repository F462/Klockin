import dayjs from 'dayjs';
import {NativeModules, Platform} from 'react-native';

import {syncActiveTimesheetNotification} from 'src/features/activeTimesheet/components/ActiveTimesheetNotificationIntegration';
import {runWidgetAction} from 'src/features/activeTimesheet/components/widgetActionTask';
import {
	newTimesheetStarted,
	notificationPausedSet,
} from 'src/features/activeTimesheet/context/activeTimesheetSlice';
import {store} from 'src/features/data/context/store';
import {selectActiveTimesheet} from 'src/features/timesheets/context/timesheetsSelectors';
import {timesheetsUpdated} from 'src/features/timesheets/context/timesheetsSlice';

describe('ActiveTimesheetNotificationIntegration', () => {
	const originalPlatformOs = Platform.OS;
	const originalWidgetBridge = NativeModules.WidgetBridge;
	const updateActiveTimesheetNotification = jest.fn();

	beforeEach(() => {
		Platform.OS = 'android';
		NativeModules.WidgetBridge = {
			...originalWidgetBridge,
			updateActiveTimesheetNotification,
			publishState: jest.fn(),
		};
		jest.useFakeTimers();
		jest.setSystemTime(new Date('2026-11-25T10:00:00.000Z'));
		jest.clearAllMocks();
		store.dispatch(notificationPausedSet({paused: false}));
		store.dispatch(
			timesheetsUpdated({timesheets: {}, newTimesheetsIdTable: {}}),
		);
	});

	afterEach(() => {
		Platform.OS = originalPlatformOs;
		NativeModules.WidgetBridge = originalWidgetBridge;
		jest.useRealTimers();
	});

	it('publishes inactive state when no timesheet is running', () => {
		syncActiveTimesheetNotification(store.getState());

		expect(updateActiveTimesheetNotification).toHaveBeenCalledWith(
			expect.objectContaining({
				active: false,
				paused: false,
				activeBeginAt: 0,
				workedSeconds: 0,
			}),
		);
	});

	it('publishes active timesheet start timestamp, worked seconds, and localized template', () => {
		const completedBegin = dayjs().subtract(3, 'hour').toISOString();
		const completedEnd = dayjs().subtract(90, 'minute').toISOString();
		store.dispatch(
			timesheetsUpdated({
				timesheets: {
					'completed-1': {
						id: 'completed-1',
						begin: completedBegin,
						end: completedEnd,
						duration: 5400,
						project: 1,
						activity: 2,
					},
				},
				newTimesheetsIdTable: {},
			}),
		);

		const activeBegin = dayjs().subtract(30, 'minute').toISOString();
		store.dispatch(
			newTimesheetStarted({
				id: 'active-1',
				begin: activeBegin,
				project: 1,
				activity: 2,
			}),
		);

		syncActiveTimesheetNotification(store.getState());

		expect(updateActiveTimesheetNotification).toHaveBeenCalledWith({
			active: true,
			paused: false,
			activeBeginAt: dayjs(activeBegin).valueOf(),
			workedSeconds: 7200,
			workdaySeconds: 28800,
			snapshotAt: Date.now(),
			channelName: 'Active timesheet',
			title: 'Timesheet running',
			pausedTitle: 'Timesheet paused',
			bodyTemplate: 'Current: __CURRENT__ • Total today: __TOTAL__',
			pauseLabel: 'Pause',
			resumeLabel: 'Resume',
			stopLabel: 'Stop',
		});
	});

	it('publishes inactive state when the running timesheet stops', () => {
		const activeBegin = dayjs().subtract(10, 'minute').toISOString();
		store.dispatch(
			newTimesheetStarted({
				id: 'active-2',
				begin: activeBegin,
				project: 1,
				activity: 2,
			}),
		);

		syncActiveTimesheetNotification(store.getState());
		expect(updateActiveTimesheetNotification).toHaveBeenLastCalledWith(
			expect.objectContaining({
				active: true,
				workedSeconds: 600,
			}),
		);

		store.dispatch(
			timesheetsUpdated({timesheets: {}, newTimesheetsIdTable: {}}),
		);
		syncActiveTimesheetNotification(store.getState());

		expect(updateActiveTimesheetNotification).toHaveBeenLastCalledWith(
			expect.objectContaining({
				active: false,
				paused: false,
				activeBeginAt: 0,
				workedSeconds: 0,
				workdaySeconds: 28800,
			}),
		);
	});

	it('pauses the active timesheet while keeping notification shown and resumes a new timesheet', async () => {
		const activeBegin = dayjs().subtract(20, 'minute').toISOString();
		store.dispatch(
			newTimesheetStarted({
				id: 'active-pause-1',
				begin: activeBegin,
				project: 3,
				activity: 4,
			}),
		);

		await runWidgetAction({action: 'pause'});

		expect(selectActiveTimesheet(store.getState())).toBeUndefined();
		expect(
			store.getState().timesheets.timesheets['active-pause-1']?.end,
		).toBeDefined();
		expect(updateActiveTimesheetNotification).toHaveBeenLastCalledWith(
			expect.objectContaining({
				active: false,
				paused: true,
				activeBeginAt: 0,
				workedSeconds: 1200,
			}),
		);

		jest.setSystemTime(new Date('2026-11-25T10:05:00.000Z'));
		await runWidgetAction({action: 'resume'});

		const resumedTimesheet = selectActiveTimesheet(store.getState());
		expect(resumedTimesheet).toBeDefined();
		expect(resumedTimesheet?.id).not.toBe('active-pause-1');
		expect(resumedTimesheet?.project).toBe(3);
		expect(resumedTimesheet?.activity).toBe(4);
		expect(updateActiveTimesheetNotification).toHaveBeenLastCalledWith(
			expect.objectContaining({
				active: true,
				paused: false,
				workedSeconds: 1200,
			}),
		);
	});

	it('dismisses a paused notification when stopped', async () => {
		const activeBegin = dayjs().subtract(15, 'minute').toISOString();
		store.dispatch(
			newTimesheetStarted({
				id: 'active-stop-1',
				begin: activeBegin,
				project: 1,
				activity: 2,
			}),
		);

		await runWidgetAction({action: 'pause'});
		expect(updateActiveTimesheetNotification).toHaveBeenLastCalledWith(
			expect.objectContaining({
				active: false,
				paused: true,
			}),
		);

		await runWidgetAction({action: 'stop'});
		expect(selectActiveTimesheet(store.getState())).toBeUndefined();
		expect(updateActiveTimesheetNotification).toHaveBeenLastCalledWith(
			expect.objectContaining({
				active: false,
				paused: false,
			}),
		);
	});

	it('stops a running timesheet and dismisses notification when stopped', async () => {
		const activeBegin = dayjs().subtract(15, 'minute').toISOString();
		store.dispatch(
			newTimesheetStarted({
				id: 'active-stop-2',
				begin: activeBegin,
				project: 1,
				activity: 2,
			}),
		);

		await runWidgetAction({action: 'stop'});

		expect(selectActiveTimesheet(store.getState())).toBeUndefined();
		expect(
			store.getState().timesheets.timesheets['active-stop-2']?.end,
		).toBeDefined();
		expect(updateActiveTimesheetNotification).toHaveBeenLastCalledWith(
			expect.objectContaining({
				active: false,
				paused: false,
			}),
		);
	});

	it('publishes zero workdaySeconds on non-working days', () => {
		jest.setSystemTime(new Date('2026-11-28T10:00:00.000Z'));

		syncActiveTimesheetNotification(store.getState());

		expect(updateActiveTimesheetNotification).toHaveBeenCalledWith(
			expect.objectContaining({
				workdaySeconds: 0,
			}),
		);
	});
});
