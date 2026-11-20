import {createSlice, PayloadAction} from '@reduxjs/toolkit';

import {Team, TeamsState} from '../types';

const initialState: TeamsState = {teams: {}};

const teamsSlice = createSlice({
	name: 'teams',
	initialState,
	reducers: {
		teamsReceived: (state, {payload}: PayloadAction<Team[]>) => {
			// Preserve teams that were created locally and have not been
			// synchronized to the cloud yet, so a re-fetch does not discard them.
			const localTeams = Object.values(state.teams).filter(
				(team) => team.id < 0,
			);
			state.teams = payload.reduce(
				(container, team) => ({...container, [team.id]: team}),
				Object.fromEntries(localTeams.map((team) => [team.id, team])),
			);
		},
		teamCreated: (state, {payload: team}: PayloadAction<Team>) => {
			state.teams[team.id] = team;
		},
		teamRemoved: (state, {payload: teamId}: PayloadAction<number>) => {
			delete state.teams[teamId];
		},
		teamUpdated: (state, {payload: team}: PayloadAction<Team>) => {
			state.teams[team.id] = team;
		},
		teamSynced: (
			state,
			{payload: {localId, team}}: PayloadAction<{localId: number; team: Team}>,
		) => {
			// Replace the locally created team (negative id) with the one the
			// cloud assigned (positive id).
			delete state.teams[localId];
			state.teams[team.id] = team;
		},
	},
});

export const {
	teamsReceived,
	teamCreated,
	teamRemoved,
	teamUpdated,
	teamSynced,
} = teamsSlice.actions;
export const teamsReducer = teamsSlice.reducer;
