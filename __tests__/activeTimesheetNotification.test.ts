import dayjs from 'dayjs';
import {NativeModules, Platform} from 'react-native';

import {syncActiveTimesheetNotification} from 'src/features/activeTimesheet/components/ActiveTimesheetNotificationIntegration';
import {newTimesheetStarted} from 'src/features/activeTimesheet/context/activeTimesheetSlice';
import {store} from 'src/features/data/context/store';
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
		};
		jest.useFakeTimers();
		jest.setSystemTime(new Date('2026-11-25T10:00:00.000Z'));
		jest.clearAllMocks();
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
			activeBeginAt: dayjs(activeBegin).valueOf(),
			workedSeconds: 7200,
			workdaySeconds: 28800,
			snapshotAt: Date.now(),
			channelName: 'Active timesheet',
			title: 'Timesheet running',
			bodyTemplate: 'Current: __CURRENT__ • Total today: __TOTAL__',
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
				activeBeginAt: 0,
				workedSeconds: 0,
				workdaySeconds: 28800,
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
