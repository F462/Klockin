import {configureStore} from '@reduxjs/toolkit';

import type {RootState} from 'src/features/data/context/store';
import {
	selectRoleList,
	selectRoleUsageCounts,
} from 'src/features/roles/context/rolesSelectors';
import {
	roleAdded,
	roleDeleted,
	rolesReceived,
	rolesReducer,
} from 'src/features/roles/context/rolesSlice';
import {
	usersReceived,
	usersReducer,
} from 'src/features/users/context/usersSlice';
import {User} from 'src/features/users/types';

const makeStore = () =>
	configureStore({
		reducer: {
			roles: rolesReducer,
			users: usersReducer,
		},
	});

const userWithRoles = (id: number, roles: Array<string>): User => ({
	id,
	username: `user${id}`,
	email: `user${id}@example.com`,
	roles,
});

describe('rolesReceived', () => {
	it('stores the received roles by name', () => {
		const store = makeStore();

		store.dispatch(rolesReceived([{name: 'ROLE_USER'}, {name: 'ROLE_ADMIN'}]));

		expect(store.getState().roles.roles).toEqual({
			ROLE_ADMIN: {name: 'ROLE_ADMIN'},
			ROLE_USER: {name: 'ROLE_USER'},
		});
	});

	it('keeps locally tracked roles that are no longer derived', () => {
		const store = makeStore();
		store.dispatch(roleAdded({name: 'ROLE_LOCAL'}));

		store.dispatch(rolesReceived([{name: 'ROLE_USER'}]));

		expect(store.getState().roles.roles).toEqual({
			ROLE_LOCAL: {name: 'ROLE_LOCAL'},
			ROLE_USER: {name: 'ROLE_USER'},
		});
	});
});

describe('roleAdded', () => {
	it('stores a new role by name', () => {
		const store = makeStore();

		store.dispatch(roleAdded({name: 'ROLE_USER'}));

		expect(store.getState().roles.roles).toEqual({
			ROLE_USER: {name: 'ROLE_USER'},
		});
	});
});

describe('roleDeleted', () => {
	it('removes the role from the catalog', () => {
		const store = makeStore();
		store.dispatch(roleAdded({name: 'ROLE_USER'}));
		store.dispatch(roleAdded({name: 'ROLE_ADMIN'}));

		store.dispatch(roleDeleted('ROLE_USER'));

		expect(store.getState().roles.roles).toEqual({
			ROLE_ADMIN: {name: 'ROLE_ADMIN'},
		});
	});
});

describe('selectRoleList', () => {
	it('returns the roles sorted by name', () => {
		const store = makeStore();
		store.dispatch(rolesReceived([{name: 'ROLE_ZEBRA'}, {name: 'ROLE_APPLE'}]));

		expect(
			selectRoleList(store.getState() as unknown as RootState).map(
				(role) => role.name,
			),
		).toEqual(['ROLE_APPLE', 'ROLE_ZEBRA']);
	});
});

describe('selectRoleUsageCounts', () => {
	it('counts the users that have each role assigned', () => {
		const store = makeStore();
		store.dispatch(rolesReceived([{name: 'ROLE_USER'}, {name: 'ROLE_ADMIN'}]));
		store.dispatch(
			usersReceived([
				userWithRoles(1, ['ROLE_USER', 'ROLE_ADMIN']),
				userWithRoles(2, ['ROLE_USER']),
			]),
		);

		expect(
			selectRoleUsageCounts(store.getState() as unknown as RootState),
		).toEqual({
			ROLE_ADMIN: 1,
			ROLE_USER: 2,
		});
	});

	it('reports zero for roles that are tracked but unused', () => {
		const store = makeStore();
		store.dispatch(rolesReceived([{name: 'ROLE_UNUSED'}]));

		expect(
			selectRoleUsageCounts(store.getState() as unknown as RootState),
		).toEqual({
			ROLE_UNUSED: 0,
		});
	});
});
