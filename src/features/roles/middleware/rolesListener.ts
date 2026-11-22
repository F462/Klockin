import {userLoggedIn} from 'src/features/account/context/accountActions';
import {AppStartListening} from 'src/features/data/context/store';
import {
	userCreated,
	usersReceived,
	userSynced,
	userUpdated,
} from 'src/features/users/context/usersSlice';
import {fetchRoles} from './rolesThunks';

// The role catalog is derived from the user base, so it is re-derived
// whenever the known users change. This keeps it in sync whether the users
// came from the server or were created/updated locally.
const deriveRolesOnUserChanges = (startListening: AppStartListening) => {
	startListening({
		predicate: (action) =>
			action.type === usersReceived.type ||
			action.type === userCreated.type ||
			action.type === userUpdated.type ||
			action.type === userSynced.type,
		effect: async (_, listenerApi) => {
			await listenerApi.dispatch(fetchRoles());
		},
	});
};

const fetchRolesOnUserLogin = (startListening: AppStartListening) => {
	startListening({
		actionCreator: userLoggedIn,
		effect: async (_, listenerApi) => {
			await listenerApi.dispatch(fetchRoles());
		},
	});
};

export const startRolesListener = (startListening: AppStartListening) => {
	deriveRolesOnUserChanges(startListening);
	fetchRolesOnUserLogin(startListening);
};
