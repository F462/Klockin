import {api} from 'src/features/account/utils/ApiClient';
import {createAppAsyncThunk} from 'src/features/data/middleware/createAppAsyncThunk';
import {
	roleStrippedFromUsers,
	userRolesReceived,
} from 'src/features/users/context/usersSlice';
import {User} from 'src/features/users/types';
import {roleDeleted, rolesReceived} from '../context/rolesSlice';
import {Role} from '../types';

/**
 * Kimai does not expose a dedicated "list roles" endpoint. The set of roles
 * in use is therefore derived from the roles already assigned to the known
 * users, which keeps the local role catalog in sync with the user base.
 */
export const fetchRoles = createAppAsyncThunk(
	'roles/fetchRoles',
	async (_, {dispatch, getState}) => {
		const users: {[id: number]: User} = getState().users.users;
		const serverUsers = Object.values(users).filter((user) => user.id > 0);
		const serverUserDetails = api.isConfigured()
			? await Promise.all(
					serverUsers.map((user) =>
						api
							.get<User>(`api/users/${user.id.toString()}`)
							.catch(() => undefined),
					),
				)
			: [];
		serverUserDetails.forEach((user) => {
			if (user) {
				dispatch(userRolesReceived({userId: user.id, roles: user.roles ?? []}));
			}
		});
		const names = new Set<string>();
		Object.values(getState().users.users).forEach((user) => {
			user.roles?.forEach((name) => {
				if (name) {
					names.add(name);
				}
			});
		});
		const roles: Array<Role> = Array.from(names).map((name) => ({name}));
		dispatch(rolesReceived(roles));
		return roles;
	},
);

/**
 * Deletes a role and removes it from every user that owns it.
 *
 * Kimai's `DELETE /api/users/roles/{id}` endpoint performs both steps on the
 * server. To keep the local state consistent (especially offline), the role is
 * also stripped from the local role catalog and from every local user.
 */
export const deleteRole = createAppAsyncThunk<void, string>(
	'roles/deleteRole',
	async (name, {dispatch}) => {
		const cleanUpLocally = () => {
			dispatch(roleDeleted(name));
			dispatch(roleStrippedFromUsers(name));
		};

		if (!api.isConfigured()) {
			return cleanUpLocally();
		}

		try {
			await api.delete(`api/users/roles/${encodeURIComponent(name)}`);
			cleanUpLocally();
		} catch (error: any) {
			// A transport failure (offline, DNS, timeout, ...) has no HTTP
			// status: apply the deletion locally so it is not lost.
			if (error?.status === undefined) {
				return cleanUpLocally();
			}
			console.warn(`Got error on delete request: ${error.toString()}`);
			throw error;
		}
	},
);
