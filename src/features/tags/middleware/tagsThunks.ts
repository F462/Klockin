import {api} from 'src/features/account/utils/ApiClient';
import {createAppAsyncThunk} from 'src/features/data/middleware/createAppAsyncThunk';
import {
	tagCreated,
	tagRemoved,
	tagsReceived,
	tagSynced,
} from '../context/tagsSlice';
import {Tag} from '../types';

const createLocalTag = (name: string, tags: {[id: number]: Tag}): Tag => {
	const localIds = Object.keys(tags)
		.map(Number)
		.filter((id) => Number.isInteger(id) && id < 0);
	const id = localIds.length > 0 ? Math.min(...localIds) - 1 : -1;

	return {id, name};
};

export const fetchTags = createAppAsyncThunk(
	'tags/fetchTags',
	async (_, {dispatch}) => {
		try {
			// The "find" endpoint only returns results when the "name" filter
			// parameter is present (Kimai's TagController::findTags skips the
			// repository call entirely for a missing/empty parameter type), so
			// it is sent explicitly with an empty search term.
			const response = await api.get<Tag[]>('api/tags/find?name=');
			dispatch(tagsReceived(response));
		} catch (error: any) {
			// Offline (or any other transport error): keep the locally known
			// tags and do not surface an error to the caller.
			console.warn(`Got error on fetch request: ${error.toString()}`);
		}
	},
);

export const createTag = createAppAsyncThunk<Tag, string>(
	'tags/createTag',
	async (name, {dispatch, getState}) => {
		const saveLocally = () => {
			const tag = createLocalTag(name, getState().tags.tags);
			dispatch(tagCreated(tag));
			return tag;
		};

		if (!api.isConfigured()) {
			return saveLocally();
		}

		try {
			const response = await api.post<Tag>('api/tags', {name});
			dispatch(tagCreated(response));
			return response;
		} catch (error: any) {
			// A transport failure (offline, DNS, timeout, ...) has no HTTP
			// status: fall back to a local tag that is synchronized later.
			if (error?.status === undefined) {
				return saveLocally();
			}
			throw error;
		}
	},
);

export const deleteTag = createAppAsyncThunk<void, number>(
	'tags/deleteTag',
	async (id, {dispatch}) => {
		if (id < 0) {
			// Locally created, never sent to the cloud: just drop it.
			dispatch(tagRemoved(id));
			return;
		}

		try {
			await api.delete(`api/tags/${id.toString()}`);
			dispatch(tagRemoved(id));
		} catch (error: any) {
			console.warn(`Got error on delete request: ${error.toString()}`);
		}
	},
);

export const synchronizeLocalTags = createAppAsyncThunk(
	'tags/synchronizeLocalTags',
	async (_, {dispatch, getState}) => {
		if (!api.isConfigured()) {
			return;
		}

		const localTags = Object.values(getState().tags.tags)
			.filter((tag) => tag.id < 0)
			.sort((first, second) => first.id - second.id);

		for (const tag of localTags) {
			try {
				const response = await api.post<Tag>('api/tags', {name: tag.name});
				dispatch(tagSynced({localId: tag.id, tag: response}));
			} catch (error: any) {
				console.warn(`Could not synchronize local tag: ${error.toString()}`);
			}
		}
	},
);
