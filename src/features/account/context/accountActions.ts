import {createAction} from '@reduxjs/toolkit';

export const userLoggedIn = createAction<string>('account/userLoggedIn');
export const userLoggedOut = createAction<void>('account/userLoggedOut');
export const currentRolesReceived = createAction<Array<string>>(
	'account/currentRolesReceived',
);
