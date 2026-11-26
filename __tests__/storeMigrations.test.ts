import type {PersistedRootState} from 'src/features/data/context/migrations';
import {migrate, STORE_VERSION} from 'src/features/data/context/migrations';

describe('store migrations', () => {
	const makeState = (): PersistedRootState =>
		({
			_persist: {version: STORE_VERSION, rehydrated: false},
			settings: {appTheme: 'system'},
		}) as unknown as PersistedRootState;

	it('exposes the current store version', () => {
		expect(Number.isInteger(STORE_VERSION)).toBe(true);
		expect(STORE_VERSION).toBeGreaterThanOrEqual(0);
	});

	it('is a no-op when the stored version matches the current version', async () => {
		const state = makeState();

		await expect(migrate(state, STORE_VERSION)).resolves.toBe(state);
	});

	it('skips migration when there is no stored state', async () => {
		await expect(migrate(undefined, STORE_VERSION)).resolves.toBeUndefined();
	});
});
