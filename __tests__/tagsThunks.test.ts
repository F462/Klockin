import {configureStore} from '@reduxjs/toolkit';

import {api} from 'src/features/account/utils/ApiClient';
import type {AppDispatch} from 'src/features/data/context/store';
import {
	tagCreated,
	tagsReceived,
	tagsReducer,
} from 'src/features/tags/context/tagsSlice';
import {
	createTag,
	deleteTag,
	fetchTags,
	synchronizeLocalTags,
} from 'src/features/tags/middleware/tagsThunks';
import {Tag} from 'src/features/tags/types';

jest.mock('src/features/account/utils/ApiClient', () => ({
	api: {
		isConfigured: jest.fn(),
		get: jest.fn(),
		post: jest.fn(),
		delete: jest.fn(),
	},
	ApiClient: {getInstance: jest.fn()},
}));

const existingTag: Tag = {id: 4, name: 'planning'};
const createdTag: Tag = {id: 9, name: 'review'};
const makeStore = () => configureStore({reducer: {tags: tagsReducer}});
type TestStore = Omit<ReturnType<typeof makeStore>, 'dispatch'> & {
	dispatch: AppDispatch;
};
const createTestStore = () => makeStore() as TestStore;

describe('fetchTags', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(api.isConfigured as jest.Mock).mockReturnValue(true);
	});

	it('fetches all tags and stores them by id', async () => {
		(api.get as jest.Mock).mockResolvedValue([existingTag]);
		const store = createTestStore();

		await store.dispatch(fetchTags());

		expect(api.get).toHaveBeenCalledWith('api/tags/find?name=');
		expect(store.getState().tags.tags).toEqual({4: existingTag});
	});

	it('keeps unsynced local tags when server tags are received', () => {
		const store = createTestStore();
		const localTag: Tag = {id: -1, name: 'local'};

		store.dispatch(tagCreated(localTag));
		store.dispatch(tagsReceived([existingTag]));

		expect(store.getState().tags.tags[-1]).toEqual(localTag);
		expect(store.getState().tags.tags[4]).toEqual(existingTag);
	});

	it('does not reject when the request fails offline', async () => {
		(api.get as jest.Mock).mockRejectedValue(
			new TypeError('Network request failed'),
		);
		const store = createTestStore();
		store.dispatch(tagCreated({id: -1, name: 'local'}));

		const result = await store.dispatch(fetchTags());

		expect(fetchTags.fulfilled.match(result)).toBe(true);
		expect(store.getState().tags.tags[-1]).toEqual({id: -1, name: 'local'});
	});
});

describe('createTag', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('creates a tag through the API and stores the response', async () => {
		(api.isConfigured as jest.Mock).mockReturnValue(true);
		(api.post as jest.Mock).mockResolvedValue(createdTag);
		const store = createTestStore();

		await store.dispatch(createTag({name: 'review'}));

		expect(api.post).toHaveBeenCalledWith('api/tags', {
			name: 'review',
			visible: true,
		});
		expect(store.getState().tags.tags).toEqual({9: createdTag});
	});

	it('sends the configured color and visibility', async () => {
		(api.isConfigured as jest.Mock).mockReturnValue(true);
		(api.post as jest.Mock).mockResolvedValue({
			id: 9,
			name: 'review',
			color: 'green',
			visible: false,
		});
		const store = createTestStore();

		await store.dispatch(
			createTag({name: 'review', color: 'green', visible: false}),
		);

		expect(api.post).toHaveBeenCalledWith('api/tags', {
			name: 'review',
			color: 'green',
			visible: false,
		});
	});

	it('creates and stores a local tag when the API is not configured', async () => {
		(api.isConfigured as jest.Mock).mockReturnValue(false);
		const store = createTestStore();

		const result = await store.dispatch(createTag({name: 'review'}));

		expect(createTag.fulfilled.match(result)).toBe(true);
		expect(result.payload).toMatchObject({
			id: -1,
			name: 'review',
			color: null,
			visible: true,
		});
		expect(store.getState().tags.tags[-1]).toEqual(result.payload);
		expect(api.post).not.toHaveBeenCalled();
	});

	it('falls back to a local tag when the request fails offline', async () => {
		(api.isConfigured as jest.Mock).mockReturnValue(true);
		(api.post as jest.Mock).mockRejectedValue(
			new TypeError('Network request failed'),
		);
		const store = createTestStore();

		const result = await store.dispatch(createTag({name: 'review'}));

		expect(createTag.fulfilled.match(result)).toBe(true);
		expect(result.payload).toMatchObject({id: -1, name: 'review'});
		expect(store.getState().tags.tags[-1]).toEqual(result.payload);
	});

	it('assigns a unique negative id per local tag', async () => {
		(api.isConfigured as jest.Mock).mockReturnValue(false);
		const store = createTestStore();

		await store.dispatch(createTag({name: 'first'}));
		await store.dispatch(createTag({name: 'second'}));

		expect(store.getState().tags.tags[-1].name).toBe('first');
		expect(store.getState().tags.tags[-2].name).toBe('second');
	});

	it('rethrows server errors (e.g. validation) instead of saving locally', async () => {
		(api.isConfigured as jest.Mock).mockReturnValue(true);
		const serverError = new Error('Validation Failed');
		(serverError as Error & {status?: number}).status = 400;
		(api.post as jest.Mock).mockRejectedValue(serverError);
		const store = createTestStore();

		const result = await store.dispatch(createTag({name: 'review'}));

		expect(createTag.rejected.match(result)).toBe(true);
		expect(Object.keys(store.getState().tags.tags)).toHaveLength(0);
	});
});

describe('deleteTag', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(api.isConfigured as jest.Mock).mockReturnValue(true);
	});

	it('deletes a tag through the API and removes it from state', async () => {
		(api.delete as jest.Mock).mockResolvedValue({});
		const store = createTestStore();
		store.dispatch(tagCreated(existingTag));

		await store.dispatch(deleteTag(existingTag.id));

		expect(api.delete).toHaveBeenCalledWith('api/tags/4');
		expect(store.getState().tags.tags).toEqual({});
	});

	it('removes a local tag without contacting the API', async () => {
		const store = createTestStore();
		const localTag: Tag = {id: -1, name: 'local'};
		store.dispatch(tagCreated(localTag));

		await store.dispatch(deleteTag(-1));

		expect(store.getState().tags.tags[-1]).toBeUndefined();
		expect(api.delete).not.toHaveBeenCalled();
	});

	it('does not reject when deleting a cloud tag offline', async () => {
		(api.delete as jest.Mock).mockRejectedValue(
			new TypeError('Network request failed'),
		);
		const store = createTestStore();
		store.dispatch(tagCreated(existingTag));

		const result = await store.dispatch(deleteTag(existingTag.id));

		expect(deleteTag.fulfilled.match(result)).toBe(true);
		// The cloud tag is kept locally; it is simply not deleted on the server.
		expect(store.getState().tags.tags[4]).toEqual(existingTag);
	});
});

describe('synchronizeLocalTags', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('synchronizes local tags and remaps them to the cloud ids', async () => {
		(api.isConfigured as jest.Mock).mockReturnValue(true);
		const store = createTestStore();
		const localTag: Tag = {id: -1, name: 'review'};
		const remoteTag: Tag = {id: 17, name: 'review'};
		store.dispatch(tagCreated(localTag));
		(api.post as jest.Mock).mockResolvedValue(remoteTag);

		await store.dispatch(synchronizeLocalTags());

		expect(api.post).toHaveBeenCalledWith('api/tags', {
			name: 'review',
			visible: true,
		});
		expect(store.getState().tags.tags[-1]).toBeUndefined();
		expect(store.getState().tags.tags[17]).toEqual(remoteTag);
	});

	it('does nothing when the API is not configured', async () => {
		(api.isConfigured as jest.Mock).mockReturnValue(false);
		const store = createTestStore();
		store.dispatch(tagCreated({id: -1, name: 'review'}));

		await store.dispatch(synchronizeLocalTags());

		expect(api.post).not.toHaveBeenCalled();
		expect(store.getState().tags.tags[-1]).toEqual({id: -1, name: 'review'});
	});

	it('keeps a local tag when its synchronization fails', async () => {
		(api.isConfigured as jest.Mock).mockReturnValue(true);
		const store = createTestStore();
		store.dispatch(tagCreated({id: -1, name: 'review'}));
		(api.post as jest.Mock).mockRejectedValue(
			new TypeError('Network request failed'),
		);

		await store.dispatch(synchronizeLocalTags());

		expect(store.getState().tags.tags[-1]).toEqual({id: -1, name: 'review'});
	});
});
