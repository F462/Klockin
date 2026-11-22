import {createSlice, PayloadAction} from '@reduxjs/toolkit';

import {Role, RolesState} from '../types';

const initialState: RolesState = {roles: {}};

const rolesSlice = createSlice({
	name: 'roles',
	initialState,
	reducers: {
		rolesReceived: (state, {payload}: PayloadAction<Array<Role>>) => {
			// Merge the freshly derived roles with the locally tracked ones so
			// a re-derivation never discards a role that is only known locally.
			const merged = [...Object.values(state.roles), ...payload];
			state.roles = merged.reduce(
				(container, element) => ({...container, [element.name]: element}),
				{},
			);
		},
		roleAdded: (state, {payload}: PayloadAction<Role>) => {
			state.roles[payload.name] = payload;
		},
		roleDeleted: (state, {payload}: PayloadAction<string>) => {
			delete state.roles[payload];
		},
	},
});

export const {rolesReceived, roleAdded, roleDeleted} = rolesSlice.actions;
export const rolesReducer = rolesSlice.reducer;
