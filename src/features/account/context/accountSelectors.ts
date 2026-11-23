import {createSelector} from '@reduxjs/toolkit';

import {RootState} from 'src/features/data/context/store';
import {
	ALL_CAPABILITIES_SET,
	capabilitiesForRoles,
	Capability,
} from 'src/features/roles/permissions';

const selectAccountState = (state: RootState) => state.account;

export const selectServerUrl = createSelector(
	[selectAccountState],
	(accountState) => {
		return accountState.serverUrl;
	},
);

export const selectIsUserLoggedIn = createSelector(
	[selectServerUrl],
	(serverUrl) => serverUrl !== undefined,
);

/** The roles of the currently signed in (connected) user. */
export const selectCurrentRoles = createSelector(
	[selectAccountState],
	(accountState) => accountState.currentRoles,
);

/**
 * The capabilities the user may exercise right now.
 *
 * - Local/offline mode (no server configured): every capability — the user
 *   owns all data.
 * - Connected mode: only the capabilities granted by the user's roles.
 */
export const selectCapabilities = createSelector(
	[selectIsUserLoggedIn, selectCurrentRoles],
	(isLoggedIn, roles) => {
		if (!isLoggedIn) {
			return ALL_CAPABILITIES_SET;
		}
		return capabilitiesForRoles(roles);
	},
);

/** True when the user is currently allowed to perform a capability. */
export const selectCan = (capability: Capability) =>
	createSelector([selectCapabilities], (capabilities) =>
		capabilities.has(capability),
	);
