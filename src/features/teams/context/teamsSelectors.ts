import {createSelector} from '@reduxjs/toolkit';

import {RootState} from 'src/features/data/context/store';

const selectTeamsState = (state: RootState) => state.teams;

export const selectTeams = createSelector(
	[selectTeamsState],
	(teamsState) => teamsState.teams,
);

export const selectTeam = (teamId: number | undefined) =>
	createSelector([selectTeams], (teams) =>
		teamId ? teams[teamId] : undefined,
	);

export const selectTeamList = createSelector([selectTeams], (teams) =>
	Object.values(teams).sort((first, second) =>
		first.name.localeCompare(second.name),
	),
);

export const selectHasUnsynchronizedTeams = createSelector(
	[selectTeams],
	(teams) => Object.values(teams).some((team) => team.id < 0),
);
