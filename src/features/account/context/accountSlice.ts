import {createSlice} from '@reduxjs/toolkit';

import {AccountState} from '../types';
import {
	currentRolesReceived,
	userLoggedIn,
	userLoggedOut,
} from './accountActions';

const initialState: AccountState = {
	serverUrl: undefined,
	currentRoles: [],
};

const accountSlice = createSlice({
	name: 'account',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(userLoggedIn, (state, {payload: serverUrl}) => {
				state.serverUrl = serverUrl;
			})
			.addCase(userLoggedOut, (state) => {
				state.serverUrl = undefined;
				state.currentRoles = [];
			})
			.addCase(currentRolesReceived, (state, {payload}) => {
				state.currentRoles = payload;
			});
	},
});

export const accountReducer = accountSlice.reducer;
