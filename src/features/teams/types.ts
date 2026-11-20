/**
 * The user embedded in a team membership, as returned by the Kimai API.
 * Only the fields the app needs to display and address the user are kept.
 */
export type TeamMemberUser = {
	id: number;
	username: string;
	alias?: string | null;
	color?: string | null;
};

/** A user that belongs to a team, and whether they lead it. */
export type TeamMember = {
	user: TeamMemberUser;
	teamlead: boolean;
};

/**
 * A Kimai team, as returned by `GET /api/teams`.
 *
 * The list endpoint returns the lightweight form (`id`, `name`, `color`);
 * the single-team endpoint additionally includes `members`.
 */
export type Team = {
	id: number;
	name: string;
	color?: string | null;
	'color-safe'?: string;
	members?: Array<TeamMember>;
};

export type TeamsState = {
	teams: {[id: number]: Team};
};
