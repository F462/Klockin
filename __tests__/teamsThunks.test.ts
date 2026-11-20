import {configureStore} from '@reduxjs/toolkit';

import {api} from 'src/features/account/utils/ApiClient';
import type {AppDispatch} from 'src/features/data/context/store';
import {
	teamCreated,
	teamsReceived,
	teamsReducer,
} from 'src/features/teams/context/teamsSlice';
import {
	createTeam,
	fetchTeams,
	removeTeam,
	synchronizeLocalTeams,
	updateTeam,
} from 'src/features/teams/middleware/teamsThunks';
import {Team} from 'src/features/teams/types';

jest.mock('src/features/account/utils/ApiClient', () => ({
	api: {
		isConfigured: jest.fn(),
		get: jest.fn(),
		post: jest.fn(),
		patch: jest.fn(),
		delete: jest.fn(),
	},
	ApiClient: {getInstance: jest.fn()},
}));

const existingTeam: Team = {id: 4, name: 'devops'};
const createdTeam: Team = {id: 9, name: 'frontend'};
const makeStore = () => configureStore({reducer: {teams: teamsReducer}});
type TestStore = Omit<ReturnType<typeof makeStore>, 'dispatch'> & {
	dispatch: AppDispatch;
};
const createTestStore = () => makeStore() as TestStore;

describe('fetchTeams', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(api.isConfigured as jest.Mock).mockReturnValue(true);
	});

	it('fetches all teams and stores them by id', async () => {
		(api.get as jest.Mock).mockResolvedValue([existingTeam]);
		const store = createTestStore();

		await store.dispatch(fetchTeams());

		expect(api.get).toHaveBeenCalledWith('api/teams');
		expect(store.getState().teams.teams).toEqual({4: existingTeam});
	});

	it('keeps unsynced local teams when server teams are received', () => {
		const store = createTestStore();
		const localTeam: Team = {id: -1, name: 'local'};

		store.dispatch(teamCreated(localTeam));
		store.dispatch(teamsReceived([existingTeam]));

		expect(store.getState().teams.teams[-1]).toEqual(localTeam);
		expect(store.getState().teams.teams[4]).toEqual(existingTeam);
	});

	it('resolves with an empty list when the request fails offline', async () => {
		(api.get as jest.Mock).mockRejectedValue(
			new TypeError('Network request failed'),
		);
		const store = createTestStore();
		store.dispatch(teamCreated({id: -1, name: 'local'}));

		const result = await store.dispatch(fetchTeams());

		expect(fetchTeams.fulfilled.match(result)).toBe(true);
		expect(result.payload).toEqual([]);
		expect(store.getState().teams.teams[-1]).toEqual({id: -1, name: 'local'});
	});
});

describe('createTeam', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('creates a team through the API and stores the response', async () => {
		(api.isConfigured as jest.Mock).mockReturnValue(true);
		(api.post as jest.Mock).mockResolvedValue(createdTeam);
		const store = createTestStore();

		await store.dispatch(createTeam({name: 'frontend'}));

		expect(api.post).toHaveBeenCalledWith('api/teams', {
			name: 'frontend',
		});
		expect(store.getState().teams.teams).toEqual({9: createdTeam});
	});

	it('sends the configured color and members', async () => {
		(api.isConfigured as jest.Mock).mockReturnValue(true);
		(api.post as jest.Mock).mockResolvedValue({
			id: 9,
			name: 'frontend',
			color: 'green',
		});
		const store = createTestStore();

		await store.dispatch(
			createTeam({
				name: 'frontend',
				color: 'green',
				members: [{userId: 1, teamlead: true}],
			}),
		);

		expect(api.post).toHaveBeenCalledWith('api/teams', {
			name: 'frontend',
			color: 'green',
			members: [{user: 1, teamlead: true}],
		});
	});

	it('creates and stores a local team when the API is not configured', async () => {
		(api.isConfigured as jest.Mock).mockReturnValue(false);
		const store = createTestStore();

		const result = await store.dispatch(createTeam({name: 'frontend'}));

		expect(createTeam.fulfilled.match(result)).toBe(true);
		expect(result.payload).toMatchObject({
			id: -1,
			name: 'frontend',
			color: null,
		});
		expect(store.getState().teams.teams[-1]).toEqual(result.payload);
		expect(api.post).not.toHaveBeenCalled();
	});

	it('falls back to a local team when the request fails offline', async () => {
		(api.isConfigured as jest.Mock).mockReturnValue(true);
		(api.post as jest.Mock).mockRejectedValue(
			new TypeError('Network request failed'),
		);
		const store = createTestStore();

		const result = await store.dispatch(createTeam({name: 'frontend'}));

		expect(createTeam.fulfilled.match(result)).toBe(true);
		expect(result.payload).toMatchObject({id: -1, name: 'frontend'});
		expect(store.getState().teams.teams[-1]).toEqual(result.payload);
	});

	it('assigns a unique negative id per local team', async () => {
		(api.isConfigured as jest.Mock).mockReturnValue(false);
		const store = createTestStore();

		await store.dispatch(createTeam({name: 'first'}));
		await store.dispatch(createTeam({name: 'second'}));

		expect(store.getState().teams.teams[-1].name).toBe('first');
		expect(store.getState().teams.teams[-2].name).toBe('second');
	});

	it('rethrows server errors (e.g. validation) instead of saving locally', async () => {
		(api.isConfigured as jest.Mock).mockReturnValue(true);
		const serverError = new Error('Validation Failed');
		(serverError as Error & {status?: number}).status = 400;
		(api.post as jest.Mock).mockRejectedValue(serverError);
		const store = createTestStore();

		const result = await store.dispatch(createTeam({name: 'frontend'}));

		expect(createTeam.rejected.match(result)).toBe(true);
		expect(Object.keys(store.getState().teams.teams)).toHaveLength(0);
	});
});

describe('updateTeam', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(api.isConfigured as jest.Mock).mockReturnValue(true);
	});

	it('updates a cloud team through the API and stores the response', async () => {
		const updatedTeam: Team = {id: 4, name: 'renamed', color: 'blue'};
		(api.patch as jest.Mock).mockResolvedValue(updatedTeam);
		const store = createTestStore();

		await store.dispatch(updateTeam({id: 4, name: 'renamed', color: 'blue'}));

		expect(api.patch).toHaveBeenCalledWith('api/teams/4', {
			name: 'renamed',
			color: 'blue',
		});
		expect(store.getState().teams.teams[4]).toEqual(updatedTeam);
	});

	it('updates a local team without contacting the API', async () => {
		const store = createTestStore();
		const localTeam: Team = {id: -1, name: 'old'};
		store.dispatch(teamCreated(localTeam));

		const result = await store.dispatch(updateTeam({id: -1, name: 'new'}));

		expect(updateTeam.fulfilled.match(result)).toBe(true);
		expect(api.patch).not.toHaveBeenCalled();
		expect(store.getState().teams.teams[-1]).toEqual({id: -1, name: 'new'});
	});
});

describe('removeTeam', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(api.isConfigured as jest.Mock).mockReturnValue(true);
	});

	it('deletes a team through the API and removes it from state', async () => {
		(api.delete as jest.Mock).mockResolvedValue({});
		const store = createTestStore();
		store.dispatch(teamCreated(existingTeam));

		await store.dispatch(removeTeam(existingTeam.id));

		expect(api.delete).toHaveBeenCalledWith('api/teams/4');
		expect(store.getState().teams.teams).toEqual({});
	});

	it('removes a local team without contacting the API', async () => {
		const store = createTestStore();
		const localTeam: Team = {id: -1, name: 'local'};
		store.dispatch(teamCreated(localTeam));

		await store.dispatch(removeTeam(-1));

		expect(store.getState().teams.teams[-1]).toBeUndefined();
		expect(api.delete).not.toHaveBeenCalled();
	});
});

describe('synchronizeLocalTeams', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('synchronizes local teams and remaps them to the cloud ids', async () => {
		(api.isConfigured as jest.Mock).mockReturnValue(true);
		const store = createTestStore();
		const localTeam: Team = {id: -1, name: 'review'};
		const remoteTeam: Team = {id: 17, name: 'review'};
		store.dispatch(teamCreated(localTeam));
		(api.post as jest.Mock).mockResolvedValue(remoteTeam);

		await store.dispatch(synchronizeLocalTeams());

		expect(api.post).toHaveBeenCalledWith('api/teams', {
			name: 'review',
		});
		expect(store.getState().teams.teams[-1]).toBeUndefined();
		expect(store.getState().teams.teams[17]).toEqual(remoteTeam);
	});

	it('sends members when a local team has them', async () => {
		(api.isConfigured as jest.Mock).mockReturnValue(true);
		const store = createTestStore();
		const localTeam: Team = {
			id: -1,
			name: 'review',
			members: [{user: {id: 2, username: 'ann'}, teamlead: true}],
		};
		store.dispatch(teamCreated(localTeam));
		(api.post as jest.Mock).mockResolvedValue({id: 18, name: 'review'});

		await store.dispatch(synchronizeLocalTeams());

		expect(api.post).toHaveBeenCalledWith('api/teams', {
			name: 'review',
			members: [{user: 2, teamlead: true}],
		});
	});

	it('does nothing when the API is not configured', async () => {
		(api.isConfigured as jest.Mock).mockReturnValue(false);
		const store = createTestStore();
		store.dispatch(teamCreated({id: -1, name: 'review'}));

		await store.dispatch(synchronizeLocalTeams());

		expect(api.post).not.toHaveBeenCalled();
		expect(store.getState().teams.teams[-1]).toEqual({
			id: -1,
			name: 'review',
		});
	});

	it('keeps a local team when its synchronization fails', async () => {
		(api.isConfigured as jest.Mock).mockReturnValue(true);
		const store = createTestStore();
		store.dispatch(teamCreated({id: -1, name: 'review'}));
		(api.post as jest.Mock).mockRejectedValue(
			new TypeError('Network request failed'),
		);

		await store.dispatch(synchronizeLocalTeams());

		expect(store.getState().teams.teams[-1]).toEqual({
			id: -1,
			name: 'review',
		});
	});
});
