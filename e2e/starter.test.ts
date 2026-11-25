/// <reference types="detox" />

/**
 * Basic smoke test for the Klockin app.
 *
 * The app has a fairly involved startup flow (session locker, onboarding
 * warning, optional biometrics), so this first spec simply boots the app and
 * asserts that it becomes idle without crashing. Use this as a starting point
 * for more detailed E2E scenarios.
 *
 * `device.launchApp` already waits for the React Native runtime to reach an
 * idle state, so a clean launch is effectively a "the app booted" assertion.
 */
describe('Klockin (E2E)', () => {
	it('boots the app without crashing', async () => {
		// Grant any native permission prompt (e.g. notifications) that appears
		// during startup so the flow can proceed on iOS. Ignored on Android.
		//
		// `launchApp` only resolves once the React Native runtime has booted
		// and reached an idle state; if the app crashes during startup, this
		// call rejects and the test fails. That is the smoke-test assertion.
		await device.launchApp({
			permissions: {
				notifications: 'YES',
			},
		});
	});
});
