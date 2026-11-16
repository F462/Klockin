import {configureStore} from '@reduxjs/toolkit';
import {fireEvent, render, waitFor} from '@testing-library/react-native';
import React from 'react';
import {Provider as PaperProvider} from 'react-native-paper';
import {Provider} from 'react-redux';

import {api} from 'src/features/account/utils/ApiClient';
import {screens} from 'src/features/navigation/screens';
import {TagsScreen} from 'src/features/tags/components/TagsScreen';
import {tagsReducer} from 'src/features/tags/context/tagsSlice';
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

const planningTag: Tag = {id: 4, name: 'planning'};
const reviewTag: Tag = {id: 9, name: 'review'};
const makeStore = () => configureStore({reducer: {tags: tagsReducer}});

const renderScreen = () => {
	const store = makeStore();
	const view = render(
		<Provider store={store}>
			<PaperProvider>
				<TagsScreen />
			</PaperProvider>
		</Provider>,
	);
	return {store, view};
};

describe('TagsScreen', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(api.isConfigured as jest.Mock).mockReturnValue(true);
		(api.get as jest.Mock).mockResolvedValue([planningTag]);
		(api.post as jest.Mock).mockResolvedValue(reviewTag);
		(api.delete as jest.Mock).mockResolvedValue({});
	});

	it('is registered after Activities in the administration drawer routes', () => {
		expect(screens).toContainEqual(
			expect.objectContaining({name: 'Tags', component: TagsScreen}),
		);
	});

	it('shows the empty state when the server has no tags', async () => {
		(api.get as jest.Mock).mockResolvedValue([]);
		const {view} = renderScreen();

		await waitFor(() => expect(view.getByText('noManagedTags')).toBeTruthy());
	});

	it('loads tags and creates a new tag from the screen', async () => {
		const {view} = renderScreen();

		await waitFor(() => expect(view.getByText('planning')).toBeTruthy());
		expect(api.get).toHaveBeenCalledWith('api/tags/find?name=');

		fireEvent.press(view.getByText('addTag'));
		fireEvent.changeText(view.getByLabelText('tagName'), ' review ');
		fireEvent.press(view.getByText('save'));

		await waitFor(() =>
			expect(api.post).toHaveBeenCalledWith('api/tags', {
				name: 'review',
				visible: true,
			}),
		);
	});

	it('does not show the "already exists" warning after a tag was created', async () => {
		const {view} = renderScreen();

		await waitFor(() => expect(view.getByText('planning')).toBeTruthy());

		fireEvent.press(view.getByText('addTag'));
		fireEvent.changeText(view.getByLabelText('tagName'), 'review');
		fireEvent.press(view.getByText('save'));

		await waitFor(() =>
			expect(api.post).toHaveBeenCalledWith('api/tags', {
				name: 'review',
				visible: true,
			}),
		);
		await waitFor(() =>
			expect(view.queryByText('tagAlreadyExists')).toBeNull(),
		);
	});

	it('replaces a tag when its name is edited', async () => {
		const {store, view} = renderScreen();

		await waitFor(() => expect(view.getByText('planning')).toBeTruthy());
		fireEvent.press(view.getByText('planning'));
		expect(view.getByText('tagRenameWarning')).toBeTruthy();
		fireEvent.changeText(view.getByLabelText('tagName'), 'review');
		fireEvent.press(view.getByText('save'));

		await waitFor(() => {
			expect(api.post).toHaveBeenCalledWith('api/tags', {
				name: 'review',
				visible: true,
			});
			expect(api.delete).toHaveBeenCalledWith('api/tags/4');
			expect(store.getState().tags.tags).toEqual({9: reviewTag});
		});
	});
});
