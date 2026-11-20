import {userLoggedIn} from 'src/features/account/context/accountActions';
import {AppStartListening} from 'src/features/data/context/store';
import {internetReachabilityChanged} from 'src/features/network/context/networkSlice';
import {fetchTeams, synchronizeLocalTeams} from './teamsThunks';

const fetchTeamsOnUserLogin = (startListening: AppStartListening) => {
	startListening({
		actionCreator: userLoggedIn,
		effect: async (_, listenerApi) => {
			await listenerApi.dispatch(synchronizeLocalTeams());
			await listenerApi.dispatch(fetchTeams());
		},
	});
};

const synchronizeTeamsOnReconnect = (startListening: AppStartListening) => {
	startListening({
		actionCreator: internetReachabilityChanged,
		effect: async ({payload: isInternetReachable}, listenerApi) => {
			if (isInternetReachable) {
				await listenerApi.dispatch(synchronizeLocalTeams());
			}
		},
	});
};

export const startTeamsListeners = (startListening: AppStartListening) => {
	fetchTeamsOnUserLogin(startListening);
	synchronizeTeamsOnReconnect(startListening);
};
