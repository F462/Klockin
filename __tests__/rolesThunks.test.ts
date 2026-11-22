import {configureStore} from '@reduxjs/toolkit';

import {api} from 'src/features/account/utils/ApiClient';
import type {AppDispatch} from 'src/features/data/context/store';
import {roleAdded, rolesReducer} from 'src/features/roles/context/rolesSlice';
import {
	deleteRole,
	fetchRoles,
} from 'src/features/roles/middleware/rolesThunks';
import {
	usersReceived,
	usersReducer,
} from 'src/features/users/context/usersSlice';
import {User} from 'src/features/users/types';

jest.mock('src/features/account/utils/ApiClient', () => ({
	api: {
		isConfigured: jest.fn(),
		get: jest.fn(),
		delete: jest.fn(),
	},
	ApiClient: {getInstance: jest.fn()},
}));

const makeStore = () =>
	configureStore({
		reducer: {
			roles: rolesReducer,
			users: usersReducer,
		},
	});
type TestStore = Omit<ReturnType<typeof makeStore>, 'dispatch'> & {
	dispatch: AppDispatch;
};
const createTestStore = () => makeStore() as TestStore;

const userWithRoles = (id: number, roles: Array<string>): User => ({
	id,
	username: `user${id}`,
	email: `user${id}@example.com`,
	roles,
});

describe('fetchRoles', () => {
	it('derives the role catalog from the roles assigned to known users', async () => {
		const store = createTestStore();
		store.dispatch(
			usersReceived([
				userWithRoles(1, ['ROLE_USER', 'ROLE_ADMIN']),
				userWithRoles(2, ['ROLE_USER']),
			]),
		);

		const result = await store.dispatch(fetchRoles());

		expect(fetchRoles.fulfilled.match(result)).toBe(true);
		expect(store.getState().roles.roles).toEqual({
			ROLE_ADMIN: {name: 'ROLE_ADMIN'},
			ROLE_USER: {name: 'ROLE_USER'},
		});
	});

	it('returns an empty catalog when no roles are known', async () => {
		const store = createTestStore();

		const result = await store.dispatch(fetchRoles());

		expect(fetchRoles.fulfilled.match(result)).toBe(true);
		expect(store.getState().roles.roles).toEqual({});
	});

	it('loads roles from each server user entity', async () => {
		(api.isConfigured as jest.Mock).mockReturnValue(true);
		(api.get as jest.Mock).mockImplementation((path: string) => {
			if (path === 'api/users/1') {
				return Promise.resolve(userWithRoles(1, ['ROLE_USER', 'ROLE_ADMIN']));
			}
			return Promise.resolve(userWithRoles(2, ['ROLE_USER', 'ROLE_MANAGER']));
		});
		const store = createTestStore();
		store.dispatch(usersReceived([userWithRoles(1, []), userWithRoles(2, [])]));

		await store.dispatch(fetchRoles());

		expect(api.get).toHaveBeenCalledWith('api/users/1');
		expect(api.get).toHaveBeenCalledWith('api/users/2');
		expect(store.getState().roles.roles).toEqual({
			ROLE_ADMIN: {name: 'ROLE_ADMIN'},
			ROLE_MANAGER: {name: 'ROLE_MANAGER'},
			ROLE_USER: {name: 'ROLE_USER'},
		});
	});

	it('keeps locally tracked roles when re-deriving', async () => {
		const store = createTestStore();
		store.dispatch(roleAdded({name: 'ROLE_LOCAL'}));
		store.dispatch(usersReceived([userWithRoles(1, ['ROLE_USER'])]));

		await store.dispatch(fetchRoles());

		expect(store.getState().roles.roles.ROLE_LOCAL).toEqual({
			name: 'ROLE_LOCAL',
		});
	});
});

describe('deleteRole', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('deletes the role through the API and strips it locally', async () => {
		(api.isConfigured as jest.Mock).mockReturnValue(true);
		(api.delete as jest.Mock).mockResolvedValue({});
		const store = createTestStore();
		store.dispatch(
			usersReceived([userWithRoles(1, ['ROLE_USER', 'ROLE_ADMIN'])]),
		);

		const result = await store.dispatch(deleteRole('ROLE_ADMIN'));

		expect(deleteRole.fulfilled.match(result)).toBe(true);
		expect(api.delete).toHaveBeenCalledWith('api/users/roles/ROLE_ADMIN');
		expect(store.getState().users.users[1].roles).toEqual(['ROLE_USER']);
	});

	it('strips the role from local users and the catalog when offline', async () => {
		(api.isConfigured as jest.Mock).mockReturnValue(false);
		const store = createTestStore();
		store.dispatch(usersReceived([userWithRoles(-1, ['ROLE_USER'])]));
		store.dispatch(roleAdded({name: 'ROLE_USER'}));

		const result = await store.dispatch(deleteRole('ROLE_USER'));

		expect(deleteRole.fulfilled.match(result)).toBe(true);
		expect(api.delete).not.toHaveBeenCalled();
		expect(store.getState().roles.roles).toEqual({});
		expect(store.getState().users.users[-1].roles).toEqual([]);
	});

	it('strips the role locally when the request fails without an HTTP status', async () => {
		(api.isConfigured as jest.Mock).mockReturnValue(true);
		(api.delete as jest.Mock).mockRejectedValue(
			new TypeError('Network request failed'),
		);
		const store = createTestStore();
		store.dispatch(usersReceived([userWithRoles(1, ['ROLE_USER'])]));

		const result = await store.dispatch(deleteRole('ROLE_USER'));

		expect(deleteRole.fulfilled.match(result)).toBe(true);
		expect(store.getState().users.users[1].roles).toEqual([]);
	});

	it('rejects when the server rejects the deletion', async () => {
		(api.isConfigured as jest.Mock).mockReturnValue(true);
		const serverError = new Error('Forbidden');
		(serverError as Error & {status?: number}).status = 403;
		(api.delete as jest.Mock).mockRejectedValue(serverError);
		const store = createTestStore();

		const result = await store.dispatch(deleteRole('ROLE_ADMIN'));

		expect(deleteRole.rejected.match(result)).toBe(true);
	});
});
