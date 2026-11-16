import {userLoggedIn} from 'src/features/account/context/accountActions';
import {AppStartListening} from 'src/features/data/context/store';
import {internetReachabilityChanged} from 'src/features/network/context/networkSlice';
import {fetchTags, synchronizeLocalTags} from './tagsThunks';

const fetchTagsOnUserLogin = (startListening: AppStartListening) => {
	startListening({
		actionCreator: userLoggedIn,
		effect: async (_, listenerApi) => {
			await listenerApi.dispatch(synchronizeLocalTags());
			await listenerApi.dispatch(fetchTags());
		},
	});
};

const synchronizeTagsOnReconnect = (startListening: AppStartListening) => {
	startListening({
		actionCreator: internetReachabilityChanged,
		effect: async ({payload: isInternetReachable}, listenerApi) => {
			if (isInternetReachable) {
				await listenerApi.dispatch(synchronizeLocalTags());
			}
		},
	});
};

export const startTagListeners = (startListening: AppStartListening) => {
	fetchTagsOnUserLogin(startListening);
	synchronizeTagsOnReconnect(startListening);
};
