/**
 * Role based capability model for the connected (server) mode.
 *
 * Klockin is a local first app: when no server is configured, the user owns
 * all data and every capability is available. As soon as the app is connected
 * to a Kimai server (server URL + API key set), the functionality the app
 * offers must be limited to what the connected user may do in his role.
 *
 * Kimai does not expose a granular "list of permissions" via its API — roles
 * are just names such as `ROLE_USER`, `ROLE_ADMIN` or `ROLE_SUPER_ADMIN`.
 * We therefore map the well known standard roles onto the capabilities this
 * app provides. The server remains the final authority and will reject any
 * call the role is not allowed (HTTP 403); this mapping simply keeps the UI
 * honest by hiding what the role can not do.
 */

export type Capability =
	| 'createTimesheet'
	| 'editTimesheet'
	| 'deleteTimesheet'
	| 'createCustomer'
	| 'editCustomer'
	| 'deleteCustomer'
	| 'createProject'
	| 'editProject'
	| 'deleteProject'
	| 'createActivity'
	| 'editActivity'
	| 'deleteActivity'
	| 'createTag'
	| 'editTag'
	| 'deleteTag'
	| 'manageUsers'
	| 'manageRoles';

const TIME_TRACKING: ReadonlyArray<Capability> = [
	'createTimesheet',
	'editTimesheet',
	'deleteTimesheet',
];

const ADMINISTRATION: ReadonlyArray<Capability> = [
	'createCustomer',
	'editCustomer',
	'deleteCustomer',
	'createProject',
	'editProject',
	'deleteProject',
	'createActivity',
	'editActivity',
	'deleteActivity',
	'createTag',
	'editTag',
	'deleteTag',
];

const SYSTEM: ReadonlyArray<Capability> = ['manageUsers', 'manageRoles'];

/** Every capability the app knows about. */
export const ALL_CAPABILITIES: ReadonlyArray<Capability> = [
	...TIME_TRACKING,
	...ADMINISTRATION,
	...SYSTEM,
];

/**
 * The well-known standard roles shipped with Kimai.
 *
 * These are the fixed roles that make sense to assign to a user when
 * creating or editing one. They map onto the capability model below and
 * are what the user editor offers as role choices.
 */
export const WELL_KNOWN_ROLES: ReadonlyArray<string> = [
	'ROLE_USER',
	'ROLE_ADMIN',
	'ROLE_SUPER_ADMIN',
];

/** The set of every known capability (used for local/offline mode). */
export const ALL_CAPABILITIES_SET = new Set<Capability>(ALL_CAPABILITIES);

/**
 * Returns the set of capabilities a given list of roles is granted.
 *
 * - `ROLE_USER` (or any unknown/empty role set): only own time tracking.
 * - `ROLE_ADMIN`: time tracking + managing customers, projects, activities
 *   and tags.
 * - `ROLE_SUPER_ADMIN`: everything, including managing users and roles.
 *
 * Roles are matched case-insensitively and may contain a mix of standard and
 * custom roles; a capability is granted as soon as any of the roles implies
 * it.
 */
export const capabilitiesForRoles = (
	roles: ReadonlyArray<string> | undefined | null,
): ReadonlySet<Capability> => {
	if (!roles || roles.length === 0) {
		// Without any role information (e.g. roles could not be loaded) we only
		// grant the capabilities that are always safe for a signed in user.
		return new Set<Capability>(TIME_TRACKING);
	}

	const normalized = roles.map((role) => role.trim().toUpperCase());

	const isSuperAdmin = normalized.includes('ROLE_SUPER_ADMIN');
	const isAdmin = isSuperAdmin || normalized.includes('ROLE_ADMIN');

	const capabilities = new Set<Capability>(TIME_TRACKING);

	if (isAdmin) {
		ADMINISTRATION.forEach((capability) => capabilities.add(capability));
	}
	if (isSuperAdmin) {
		SYSTEM.forEach((capability) => capabilities.add(capability));
	}

	return capabilities;
};

/** Checks whether the given roles are allowed to perform a capability. */
export const canDo = (
	roles: ReadonlyArray<string> | undefined | null,
	capability: Capability,
): boolean => capabilitiesForRoles(roles).has(capability);
