import React, {useCallback, useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {StyleSheet, View} from 'react-native';
import {FAB, Text, useTheme} from 'react-native-paper';

import {selectIsUserLoggedIn} from 'src/features/account/context/accountSelectors';
import {useAppDispatch, useAppSelector} from 'src/features/data/context/store';
import {useStyle} from 'src/features/theming/utils/useStyle';
import {BaseScreen} from 'src/ui/BaseScreen';
import {DividedList} from 'src/ui/DividedList';
import {EntityListItem} from 'src/ui/EntityListItem';
import {selectTeamList} from '../context/teamsSelectors';
import {fetchTeams} from '../middleware/teamsThunks';
import {Team} from '../types';
import {TeamItemContextMenu} from './TeamItemContextMenu';
import {TeamModal} from './TeamModal';

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
	emptyHint: {
		marginTop: 8,
		textAlign: 'center',
	},
});

const TeamItem = ({team}: {team: Team}) => {
	const isUserLoggedIn = useAppSelector(selectIsUserLoggedIn);
	const [contextMenuVisible, setContextMenuVisible] = useState(false);
	const [editModalVisible, setEditModalVisible] = useState(false);
	const hideContextMenu = useCallback(() => setContextMenuVisible(false), []);
	const showEditModal = useCallback(() => setEditModalVisible(true), []);

	return (
		<>
			<TeamItemContextMenu
				team={team}
				visible={contextMenuVisible}
				onHideMenu={hideContextMenu}
				onEdit={showEditModal}
			/>
			<EntityListItem
				name={team.name}
				color={team.color ?? team['color-safe']}
				isSyncPending={isUserLoggedIn && team.id < 0}
				onPress={showEditModal}
				onLongPress={() => setContextMenuVisible(true)}
			/>
			<TeamModal
				team={team}
				visible={editModalVisible}
				onHideModal={() => setEditModalVisible(false)}
			/>
		</>
	);
};

const EmptyState = () => {
	const {t} = useTranslation();
	const theme = useTheme();
	const dynamicStyles = useStyle(
		() => ({
			title: {color: theme.colors.onSurface},
			hint: {color: theme.colors.onSurfaceVariant},
		}),
		[theme.colors.onSurface, theme.colors.onSurfaceVariant],
	);

	return (
		<View style={styles.emptyState}>
			<Text variant="titleMedium" style={dynamicStyles.title}>
				{t('noTeams')}
			</Text>
			<Text variant="bodySmall" style={[styles.emptyHint, dynamicStyles.hint]}>
				{t('teamsHint')}
			</Text>
		</View>
	);
};

export const TeamsScreen = () => {
	const {t} = useTranslation();
	const dispatch = useAppDispatch();
	const teams = useAppSelector(selectTeamList);
	const [addModalVisible, setAddModalVisible] = useState(false);

	const onRefresh = useCallback(() => dispatch(fetchTeams()), [dispatch]);

	useEffect(() => {
		onRefresh().catch(console.error);
	}, [onRefresh]);

	return (
		<BaseScreen>
			<DividedList
				data={teams}
				onRefresh={onRefresh}
				showDividers={false}
				renderItem={({item}) => <TeamItem team={item} />}
				emptyComponent={<EmptyState />}
			/>
			<FAB
				icon="plus"
				label={t('addTeam')}
				onPress={() => setAddModalVisible(true)}
				style={styles.fab}
			/>
			<TeamModal
				visible={addModalVisible}
				onHideModal={() => setAddModalVisible(false)}
			/>
		</BaseScreen>
	);
};
