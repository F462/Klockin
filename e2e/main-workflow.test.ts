/// <reference types="detox" />

/**
 * E2E test for the Klockin app's main offline workflow.
 *
 * This spec drives the app through the complete "offline" onboarding and
 * time-tracking flow on a physical Android device (see `detox.config.js` →
 * `android.att.debug`):
 *
 *   1. Dismiss the notification-permission gate.
 *   2. Choose the offline workflow on the welcome screen.
 *   3. Create the first customer, project and activity (offline setup).
 *   4. Start and then stop a timesheet (clock in / out).
 *   5. Navigate between screens via the navigation drawer.
 *
 * The tests are intentionally independent of the device's system language:
 * every interaction targets a stable `testID` (Detox `by.id`), because the UI
 * strings are localized and would differ per device locale.
 *
 * The first test resets the app to a clean state (uninstall + install +
 * launch) so the onboarding flow always starts from scratch, regardless of
 * any data left over from a previous run.
 */

const CUSTOMER_NAME = 'E2E Customer';
const PROJECT_NAME = 'E2E Project';
const ACTIVITY_NAME = 'E2E Activity';

/**
 * Open a `PaperSelect`-backed field (project/activity selector) by its
 * `testID`, wait for the dropdown, and pick the option with the given name.
 *
 * Single-select `PaperSelect` auto-completes when an option is tapped (it
 * invokes `onSelection` and closes the dialog), so no extra "Done" tap is
 * required.
 */
async function selectOptionInField(
	fieldId: string,
	optionName: string,
): Promise<void> {
	await element(by.id(fieldId)).tap();
	await expect(element(by.text(optionName))).toBeVisible();
	await element(by.text(optionName)).tap();
}

describe('Klockin main workflow (offline)', () => {
	it('resets to a clean state, skips notifications and picks offline mode', async () => {
		// Ensure the app is installed, then reset it to a clean state so the
		// onboarding flow always starts from scratch, regardless of any data
		// left over from a previous run. On Android this clears the app data
		// (`pm clear`) without uninstalling.
		await device.installApp();
		await device.resetAppState();
		await device.launchApp();

		// On Android the app opens with the notification-permission gate.
		// Dismiss it without requesting the permission (avoids a system dialog).
		await expect(element(by.id('skipNotificationPermission'))).toBeVisible();
		await element(by.id('skipNotificationPermission')).tap();

		// The welcome screen now offers online/offline; pick offline.
		await expect(element(by.id('welcome-offline'))).toBeVisible();
		await element(by.id('welcome-offline')).tap();

		// We land on the offline setup (Customers stage first).
		await expect(element(by.id('offlineSetupContinue'))).toBeVisible();
	});

	it('creates the first customer', async () => {
		// The offline setup opens the customer creation modal.
		await element(by.id('offlineSetupContinue')).tap();
		await expect(element(by.id('entityNameField'))).toBeVisible();

		await element(by.id('entityNameField')).replaceText(CUSTOMER_NAME);
		// Element taps on Android go through Espresso's view click action, so
		// the software keyboard does not block the save button.
		await element(by.id('entitySave')).tap();

		// Back on the offline setup, now on the Projects stage.
		await expect(element(by.id('offlineSetupContinue'))).toBeVisible();
	});

	it('creates the first project', async () => {
		// The offline setup opens the project creation modal. The single
		// existing customer is auto-selected, so only a name is required.
		await element(by.id('offlineSetupContinue')).tap();
		await expect(element(by.id('entityNameField'))).toBeVisible();

		await element(by.id('entityNameField')).replaceText(PROJECT_NAME);
		await element(by.id('entitySave')).tap();

		// Back on the offline setup, now on the Activities stage.
		await expect(element(by.id('offlineSetupContinue'))).toBeVisible();
	});

	it('creates the first activity and completes onboarding', async () => {
		// The offline setup opens the activity creation modal.
		await element(by.id('offlineSetupContinue')).tap();
		await expect(element(by.id('entityNameField'))).toBeVisible();

		await element(by.id('entityNameField')).replaceText(ACTIVITY_NAME);
		await element(by.id('entitySave')).tap();

		// We are back on the offline setup, now on its final stage
		// ("you are ready to start tracking"). Tapping again completes
		// onboarding and navigates to the active timesheet screen.
		await expect(element(by.id('offlineSetupContinue'))).toBeVisible();
		await element(by.id('offlineSetupContinue')).tap();

		// On the active timesheet screen, no timesheet is running yet, so the
		// stop button is not present.
		await expect(element(by.id('stopTimesheet'))).not.toBeVisible();
	});

	it('starts a timesheet (clock in)', async () => {
		// Select a project and an activity so a timesheet can be started.
		await selectOptionInField('activeTimesheetProjectSelector', PROJECT_NAME);
		await selectOptionInField('activeTimesheetActivitySelector', ACTIVITY_NAME);

		// The start button is only enabled once both are selected.
		await expect(element(by.id('startTimesheet'))).toBeVisible();
		await element(by.id('startTimesheet')).tap();

		// The timesheet is now running, so the stop button is shown.
		await expect(element(by.id('stopTimesheet'))).toBeVisible();
	});

	it('stops the timesheet (clock out)', async () => {
		await expect(element(by.id('stopTimesheet'))).toBeVisible();
		await element(by.id('stopTimesheet')).tap();

		// Back to the idle state: stop button gone, start button available again.
		await expect(element(by.id('stopTimesheet'))).not.toBeVisible();
		await expect(element(by.id('startTimesheet'))).toBeVisible();
	});

	it('navigates to the overview via the drawer', async () => {
		// Open the navigation drawer.
		await element(by.id('openDrawerMenu')).tap();

		// Pick the Overview route (locale-independent `testID`).
		await expect(element(by.id('drawer-Overview'))).toBeVisible();
		await element(by.id('drawer-Overview')).tap();

		// We are now on the Overview screen.
		await expect(element(by.id('overviewScreen'))).toBeVisible();
	});
});
