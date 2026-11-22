import {createSelector} from '@reduxjs/toolkit';

import {RootState} from 'src/features/data/context/store';

const selectRolesState = (state: RootState) => state.roles;

export const selectRoles = createSelector(
	[selectRolesState],
	(rolesState) => rolesState.roles,
);

/**
 * The number of users that have each known role assigned. Roles without any
 * user are reported with a count of zero, so a deleted-but-still-tracked role
 * can be distinguished from one that is actually in use.
 */
export const selectRoleUsageCounts = createSelector(
	[selectRolesState, (state: RootState) => state.users.users],
	(rolesState, users) => {
		const counts: {[name: string]: number} = {};
		Object.keys(rolesState.roles).forEach((name) => {
			counts[name] = 0;
		});
		Object.values(users).forEach((user) => {
			(user.roles ?? []).forEach((name) => {
				counts[name] = (counts[name] ?? 0) + 1;
			});
		});
		return counts;
	},
);

export const selectRoleList = createSelector([selectRoles], (roles) =>
	Object.values(roles).sort((first, second) =>
		first.name.localeCompare(second.name),
	),
);

export const selectRoleNames = createSelector([selectRoleList], (roles) =>
	roles.map((role) => role.name),
);
