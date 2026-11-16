import {configureStore} from '@reduxjs/toolkit';
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import React from 'react';
import {Provider as PaperProvider} from 'react-native-paper';
import {Provider as ReduxProvider} from 'react-redux';

import {tagCreated, tagsReducer} from 'src/features/tags/context/tagsSlice';
import {Tag} from 'src/features/tags/types';
import {TimesheetTagsEditor} from 'src/features/timesheets/components/TimesheetTagsEditor';

jest.mock('src/features/account/utils/ApiClient', () => ({
	api: {
		isConfigured: jest.fn().mockReturnValue(false),
		get: jest.fn(),
		post: jest.fn(),
		delete: jest.fn(),
	},
}));

const renderEditor = (
	tags: string[],
	onChange = jest.fn(),
	managedTags: Tag[] = [],
) => {
	const store = configureStore({reducer: {tags: tagsReducer}});
	managedTags.forEach((tag) => store.dispatch(tagCreated(tag)));
	const view = render(
		<ReduxProvider store={store}>
			<PaperProvider>
				<TimesheetTagsEditor tags={tags} onChange={onChange} />
			</PaperProvider>
		</ReduxProvider>,
	);
	return {view, onChange, store};
};

describe('TimesheetTagsEditor', () => {
	it('adds a trimmed tag to the timesheet and managed tags', async () => {
		const {view, onChange, store} = renderEditor(['planning']);

		fireEvent.press(view.getByLabelText('addTag'));
		fireEvent.changeText(view.getByLabelText('tagName'), ' review ');
		await act(async () => {
			fireEvent.press(view.getByText('save'));
			await waitFor(() =>
				expect(onChange).toHaveBeenCalledWith(['planning', 'review']),
			);
		});
		expect(Object.values(store.getState().tags.tags)).toContainEqual(
			expect.objectContaining({name: 'review'}),
		);
	});

	it('selects a tag already in management', () => {
		const {view, onChange} = renderEditor([], jest.fn(), [
			{id: 3, name: 'planning'},
		]);

		fireEvent.press(view.getByText('planning'));

		expect(onChange).toHaveBeenCalledWith(['planning']);
	});

	it('edits an existing tag', async () => {
		const {view, onChange} = renderEditor(['planning']);

		fireEvent.press(view.getByText('planning'));
		fireEvent.changeText(view.getByLabelText('tagName'), 'review');
		await act(async () => {
			fireEvent.press(view.getByText('save'));
			await waitFor(() => expect(onChange).toHaveBeenCalledWith(['review']));
		});
	});

	it('deletes an existing tag from the draft', () => {
		const {view, onChange} = renderEditor(['planning', 'review']);

		fireEvent.press(view.getByText('planning'));
		fireEvent.press(view.getByText('delete'));

		expect(onChange).toHaveBeenCalledWith(['review']);
	});
});
