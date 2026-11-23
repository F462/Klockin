import {useCallback} from 'react';

import {useAppSelector} from 'src/features/data/context/store';
import {Capability} from 'src/features/roles/permissions';
import {selectCapabilities} from '../context/accountSelectors';

/**
 * Returns a `can` function that checks whether the user may perform a
 * capability.
 *
 * In local/offline mode every capability is allowed. When the app is
 * connected to a server, the check is scoped to the roles of the signed in
 * user (see {@link selectCapabilities}).
 *
 * @example
 * const can = useCan();
 * if (can('createCustomer')) { ... }
 */
export const useCan = (): ((capability: Capability) => boolean) => {
	const capabilities = useAppSelector(selectCapabilities);

	return useCallback(
		(capability: Capability) => capabilities.has(capability),
		[capabilities],
	);
};
