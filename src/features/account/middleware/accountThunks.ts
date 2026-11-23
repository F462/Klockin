import {createAppAsyncThunk} from 'src/features/data/middleware/createAppAsyncThunk';
import {
	currentRolesReceived,
	userLoggedIn,
	userLoggedOut,
} from '../context/accountActions';
import {getApiToken} from '../utils/accountPersistor';
import {api} from '../utils/ApiClient';

export const loginUser = createAppAsyncThunk<void, {serverUrl: string}>(
	'account/loginUser',
	async ({serverUrl}, {dispatch}) => {
		const apiToken = await getApiToken();

		if (apiToken === null || apiToken === undefined) {
			return;
		}

		api.configure(serverUrl, apiToken);

		dispatch(userLoggedIn(serverUrl));
	},
);

/**
 * Loads the signed in user (`GET /api/users/me`) and stores the roles the
 * server reports for them. The roles drive the role based feature gating
 * while the app is connected to a server.
 *
 * A failure to load the roles is not fatal: the app falls back to the safe
 * baseline of "time tracking only" (see `capabilitiesForRoles`) instead of
 * silently granting full access.
 */
export const fetchCurrentUser = createAppAsyncThunk<void, void>(
	'account/fetchCurrentUser',
	async (_payload, {dispatch}) => {
		if (!api.isConfigured()) {
			return;
		}

		try {
			const user = await api.get<{roles?: Array<string>}>('api/users/me');
			dispatch(currentRolesReceived(user.roles ?? []));
		} catch (error) {
			console.warn(
				'Unable to load the current user, falling back to a reduced ' +
					`set of permissions: ${error instanceof Error ? error.message : error}`,
			);
			// We intentionally do NOT clear the roles here. If a previous
			// request succeeded we keep what we know; if we never loaded them
			// the state stays empty and only the safe baseline is granted.
		}
	},
);

export const logoutUser = createAppAsyncThunk<void, void>(
	'account/logoutUser',
	async (_payload, {dispatch}) => {
		api.reset();

		dispatch(userLoggedOut());
	},
);
