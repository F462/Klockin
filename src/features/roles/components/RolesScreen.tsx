import React, {useCallback, useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {StyleSheet, View} from 'react-native';
import {Icon, Text, useTheme} from 'react-native-paper';

import {useAppDispatch, useAppSelector} from 'src/features/data/context/store';
import {useStyle} from 'src/features/theming/utils/useStyle';
import {fetchUsers} from 'src/features/users/middleware/usersThunks';
import {BaseScreen} from 'src/ui/BaseScreen';
import {DividedList} from 'src/ui/DividedList';
import {ListItem} from 'src/ui/ListItem';
import {ListItemText} from 'src/ui/ListItemText';
import {selectRoleList, selectRoleUsageCounts} from '../context/rolesSelectors';
import {fetchRoles} from '../middleware/rolesThunks';
import {Role} from '../types';
import {RoleItemContextMenu} from './RoleItemContextMenu';

const styles = StyleSheet.create({
	item: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingHorizontal: 16,
	},
	itemBody: {
		flex: 1,
	},
	secondary: {
		opacity: 0.72,
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

const RoleItem = ({role, userCount}: {role: Role; userCount: number}) => {
	const theme = useTheme();
	const {t} = useTranslation();
	const [contextMenuVisible, setContextMenuVisible] = useState(false);
	const hideContextMenu = useCallback(() => setContextMenuVisible(false), []);

	return (
		<>
			<RoleItemContextMenu
				role={role}
				visible={contextMenuVisible}
				onHideMenu={hideContextMenu}
			/>
			<ListItem onLongPress={() => setContextMenuVisible(true)}>
				<View style={styles.item}>
					<Icon
						source="account-key-outline"
						size={24}
						color={theme.colors.onSurfaceVariant}
					/>
					<View style={styles.itemBody}>
						<ListItemText>{role.name}</ListItemText>
						<Text variant="bodySmall" style={styles.secondary}>
							{t('roleUserCount', {count: userCount})}
						</Text>
					</View>
				</View>
			</ListItem>
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
				{t('noRoles')}
			</Text>
			<Text variant="bodySmall" style={[styles.emptyHint, dynamicStyles.hint]}>
				{t('rolesHint')}
			</Text>
		</View>
	);
};

export const RolesScreen = () => {
	const dispatch = useAppDispatch();
	const roles = useAppSelector(selectRoleList);
	const usageCounts = useAppSelector(selectRoleUsageCounts);

	const onRefresh = useCallback(async () => {
		// The role catalog is derived from the users, so make sure both are
		// current before the list is shown.
		await dispatch(fetchUsers());
		await dispatch(fetchRoles());
	}, [dispatch]);

	useEffect(() => {
		onRefresh().catch(console.error);
	}, [onRefresh]);

	return (
		<BaseScreen>
			<DividedList
				data={roles}
				onRefresh={onRefresh}
				showDividers={false}
				renderItem={({item}) => (
					<RoleItem role={item} userCount={usageCounts[item.name] ?? 0} />
				)}
				emptyComponent={<EmptyState />}
			/>
		</BaseScreen>
	);
};
