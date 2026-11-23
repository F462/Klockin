import {REHYDRATE} from 'redux-persist';

import {AppStartListening} from 'src/features/data/context/store';
import {userLoggedIn} from '../context/accountActions';
import {selectServerUrl} from '../context/accountSelectors';
import {fetchCurrentUser, loginUser} from './accountThunks';

const setAxiosHeadersOnAppStart = (startListening: AppStartListening) => {
	startListening({
		type: REHYDRATE,
		effect: async (_, listenerApi) => {
			const serverUrl = selectServerUrl(listenerApi.getState());

			if (serverUrl === undefined) {
				return;
			}

			listenerApi.dispatch(loginUser({serverUrl})).catch(console.error);
		},
	});
};

/**
 * Whenever a login is established (either freshly or after rehydration),
 * fetch the signed in user's roles so the role based feature gating can be
 * applied while the app is connected to a server.
 */
const fetchCurrentUserRolesOnLogin = (startListening: AppStartListening) => {
	startListening({
		actionCreator: userLoggedIn,
		effect: async (_, listenerApi) => {
			await listenerApi.dispatch(fetchCurrentUser());
		},
	});
};

export const startAccountListeners = (startListening: AppStartListening) => {
	setAxiosHeadersOnAppStart(startListening);
	fetchCurrentUserRolesOnLogin(startListening);
};
