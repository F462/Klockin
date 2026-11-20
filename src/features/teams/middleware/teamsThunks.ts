import {api} from 'src/features/account/utils/ApiClient';
import {createAppAsyncThunk} from 'src/features/data/middleware/createAppAsyncThunk';
import {
	teamCreated,
	teamRemoved,
	teamsReceived,
	teamSynced,
	teamUpdated,
} from '../context/teamsSlice';
import {Team} from '../types';

/**
 * The members to assign to a team, expressed as user ids. This keeps the
 * payload simple for callers (e.g. a multi-select of users) and is translated
 * into the API's `{user, teamlead}` shape when the request is built.
 */
export type CreateTeamMemberPayload = {
	userId: number;
	teamlead?: boolean;
};

export type CreateTeamPayload = {
	name: string;
	color?: string | null;
	members?: Array<CreateTeamMemberPayload>;
};

const toApiMembers = (members: Array<{userId: number; teamlead?: boolean}>) =>
	members.map((member) => ({
		user: member.userId,
		teamlead: member.teamlead ?? false,
	}));

const createTeamBody = (payload: CreateTeamPayload) => {
	const body: Record<string, unknown> = {name: payload.name};

	if (payload.color) {
		body.color = payload.color;
	}

	const members = toApiMembers(payload.members ?? []);
	if (members.length > 0) {
		body.members = members;
	}

	return body;
};

const createLocalTeam = (
	payload: CreateTeamPayload,
	teams: {[id: number]: Team},
): Team => {
	const localIds = Object.keys(teams)
		.map(Number)
		.filter((id) => Number.isInteger(id) && id < 0);
	const id = localIds.length > 0 ? Math.min(...localIds) - 1 : -1;

	return {
		id,
		name: payload.name,
		color: payload.color ?? null,
		members: (payload.members ?? []).map((member) => ({
			user: {id: member.userId, username: ''},
			teamlead: member.teamlead ?? false,
		})),
	};
};

export const fetchTeams = createAppAsyncThunk(
	'teams/fetchTeams',
	async (_, {dispatch}) => {
		try {
			const response = await api.get<Array<Team>>('api/teams');
			dispatch(teamsReceived(response));
			return response;
		} catch (error: any) {
			// Offline (or any other transport error): keep the locally known
			// teams and do not surface an error to the caller.
			console.warn(`Got error on fetch request: ${error.toString()}`);
			return [];
		}
	},
);

/**
 * Fetch a single team, including its members. `GET /api/teams` only returns
 * the lightweight form (`id`, `name`, `color`), so the full entity has to be
 * loaded before a team can be edited.
 */
export const fetchTeam = createAppAsyncThunk<Team, number>(
	'teams/fetchTeam',
	async (teamId, {dispatch}) => {
		try {
			const response = await api.get<Team>(`api/teams/${teamId.toString()}`);
			dispatch(teamUpdated(response));
			return response;
		} catch (error: any) {
			console.warn(`Got error on fetch request: ${error.toString()}`);
			throw error;
		}
	},
);

export const createTeam = createAppAsyncThunk<Team, CreateTeamPayload>(
	'teams/createTeam',
	async (payload, {dispatch, getState}) => {
		const saveLocally = () => {
			const team = createLocalTeam(payload, getState().teams.teams);
			dispatch(teamCreated(team));
			return team;
		};

		if (!api.isConfigured()) {
			return saveLocally();
		}

		try {
			const response = await api.post<Team>(
				'api/teams',
				createTeamBody(payload),
			);
			dispatch(teamCreated(response));
			return response;
		} catch (error: any) {
			// A transport failure (offline, DNS, timeout, ...) has no HTTP
			// status: fall back to a local team that is synchronized later.
			if (error?.status === undefined) {
				return saveLocally();
			}
			throw error;
		}
	},
);

/**
 * Update an existing team. Passing `members` replaces all existing members
 * (Kimai's `PATCH /api/teams/{id}` semantics), so the full current member
 * list must be supplied.
 */
export const updateTeam = createAppAsyncThunk<Team, Team>(
	'teams/updateTeam',
	async (team, {dispatch}) => {
		if (team.id < 0) {
			// Locally created, never sent to the cloud: just update locally.
			dispatch(teamUpdated(team));
			return team;
		}

		try {
			const body: Record<string, unknown> = {name: team.name};

			if (team.color) {
				body.color = team.color;
			}

			const members = toApiMembers(
				(team.members ?? []).map((member) => ({
					userId: member.user.id,
					teamlead: member.teamlead,
				})),
			);
			if (members.length > 0) {
				body.members = members;
			}

			const response = await api.patch<Team>(
				`api/teams/${team.id.toString()}`,
				body,
			);
			dispatch(teamUpdated(response));
			return response;
		} catch (error: any) {
			console.warn(`Got error on update request: ${error.toString()}`);
			throw error;
		}
	},
);

export const removeTeam = createAppAsyncThunk<void, number>(
	'teams/removeTeam',
	async (teamId, {dispatch}) => {
		if (teamId < 0) {
			// Locally created, never sent to the cloud: just drop it.
			dispatch(teamRemoved(teamId));
			return;
		}

		try {
			await api.delete(`api/teams/${teamId.toString()}`);
			dispatch(teamRemoved(teamId));
		} catch (error: any) {
			console.warn(`Got error on delete request: ${error.toString()}`);
		}
	},
);

export const synchronizeLocalTeams = createAppAsyncThunk(
	'teams/synchronizeLocalTeams',
	async (_, {dispatch, getState}) => {
		if (!api.isConfigured()) {
			return;
		}

		const localTeams = Object.values(getState().teams.teams)
			.filter((team) => team.id < 0)
			.sort((first, second) => first.id - second.id);

		for (const team of localTeams) {
			try {
				const response = await api.post<Team>('api/teams', {
					name: team.name,
					...(team.color ? {color: team.color} : {}),
					...(team.members && team.members.length > 0
						? {
								members: team.members.map((member) => ({
									user: member.user.id,
									teamlead: member.teamlead,
								})),
							}
						: {}),
				});
				dispatch(teamSynced({localId: team.id, team: response}));
			} catch (error: any) {
				console.warn(`Could not synchronize local team: ${error.toString()}`);
			}
		}
	},
);
