import React, {useCallback, useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {StyleSheet, View} from 'react-native';
import {FAB, Text} from 'react-native-paper';

import {useCan} from 'src/features/account/utils/useCan';
import {useAppDispatch, useAppSelector} from 'src/features/data/context/store';
import {BaseScreen} from 'src/ui/BaseScreen';
import {DividedList} from 'src/ui/DividedList';
import {EntityListItem} from 'src/ui/EntityListItem';
import {selectTagList} from '../context/tagsSelectors';
import {fetchTags} from '../middleware/tagsThunks';
import {Tag} from '../types';
import {TagItemContextMenu} from './TagItemContextMenu';
import {TagModal} from './TagModal';

const styles = StyleSheet.create({
	fab: {
		position: 'absolute',
		right: 20,
		bottom: 20,
	},
	emptyState: {
		alignItems: 'center',
		flex: 1,
		justifyContent: 'center',
		padding: 24,
	},
});

const TagItem = ({tag}: {tag: Tag}) => {
	const [contextMenuVisible, setContextMenuVisible] = useState(false);
	const [editModalVisible, setEditModalVisible] = useState(false);
	const hideContextMenu = useCallback(() => setContextMenuVisible(false), []);
	const showEditModal = useCallback(() => setEditModalVisible(true), []);

	return (
		<>
			<TagItemContextMenu
				tag={tag}
				visible={contextMenuVisible}
				onHideMenu={hideContextMenu}
				onEdit={showEditModal}
			/>
			<EntityListItem
				name={tag.name}
				color={tag.color ?? tag['color-safe']}
				onPress={showEditModal}
				onLongPress={() => setContextMenuVisible(true)}
			/>
			<TagModal
				tag={tag}
				visible={editModalVisible}
				onHideModal={() => setEditModalVisible(false)}
			/>
		</>
	);
};

const EmptyState = () => {
	const {t} = useTranslation();
	return (
		<View style={styles.emptyState}>
			<Text variant="titleMedium">{t('noManagedTags')}</Text>
		</View>
	);
};

export const TagsScreen = () => {
	const {t} = useTranslation();
	const dispatch = useAppDispatch();
	const can = useCan();
	const tags = useAppSelector(selectTagList);
	const [addModalVisible, setAddModalVisible] = useState(false);

	const onRefresh = useCallback(() => dispatch(fetchTags()), [dispatch]);

	useEffect(() => {
		onRefresh().catch(console.error);
	}, [onRefresh]);

	return (
		<BaseScreen>
			<DividedList
				data={tags}
				onRefresh={onRefresh}
				showDividers={false}
				renderItem={({item}) => <TagItem tag={item} />}
				emptyComponent={<EmptyState />}
			/>
			{can('createTag') && (
				<FAB
					icon="plus"
					label={t('addTag')}
					onPress={() => setAddModalVisible(true)}
					style={styles.fab}
				/>
			)}
			<TagModal
				visible={addModalVisible}
				onHideModal={() => setAddModalVisible(false)}
			/>
		</BaseScreen>
	);
};
