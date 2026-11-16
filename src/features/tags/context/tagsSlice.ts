import {createSlice, PayloadAction} from '@reduxjs/toolkit';

import {Tag, TagsState} from '../types';

const initialState: TagsState = {tags: {}};

const tagsSlice = createSlice({
	name: 'tags',
	initialState,
	reducers: {
		tagsReceived: (state, {payload}: PayloadAction<Tag[]>) => {
			// Preserve tags that were created locally and have not been
			// synchronized to the cloud yet, so a re-fetch does not discard them.
			const localTags = Object.values(state.tags).filter((tag) => tag.id < 0);
			state.tags = payload.reduce(
				(container, element) => ({...container, [element.id]: element}),
				Object.fromEntries(localTags.map((tag) => [tag.id, tag])),
			);
		},
		tagCreated: (state, {payload}: PayloadAction<Tag>) => {
			state.tags[payload.id] = payload;
		},
		tagRemoved: (state, {payload}: PayloadAction<number>) => {
			delete state.tags[payload];
		},
		tagSynced: (
			state,
			{payload: {localId, tag}}: PayloadAction<{localId: number; tag: Tag}>,
		) => {
			// Replace the locally created tag (negative id) with the one the
			// cloud assigned (positive id).
			delete state.tags[localId];
			state.tags[tag.id] = tag;
		},
	},
});

export const {tagsReceived, tagCreated, tagRemoved, tagSynced} =
	tagsSlice.actions;
export const tagsReducer = tagsSlice.reducer;
