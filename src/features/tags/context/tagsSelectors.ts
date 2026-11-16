import {createSelector} from '@reduxjs/toolkit';

import {RootState} from 'src/features/data/context/store';

const selectTagsState = (state: RootState) => state.tags;

export const selectTags = createSelector(
	[selectTagsState],
	(tagsState) => tagsState.tags,
);

export const selectTagList = createSelector([selectTags], (tags) =>
	Object.values(tags).sort((first, second) =>
		first.name.localeCompare(second.name),
	),
);

export const selectHasUnsynchronizedTags = createSelector(
	[selectTags],
	(tags) => Object.values(tags).some((tag) => tag.id < 0),
);
