import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {ScrollView, StyleSheet, View} from 'react-native';
import {
	Button,
	Modal,
	Portal,
	Text,
	TextInput,
	useTheme,
} from 'react-native-paper';

import {CustomerColorField} from 'src/features/customers/components/CustomerColorField';
import {fetchCustomerColors} from 'src/features/customers/middleware/customersThunks';
import {useAppDispatch, useAppSelector} from 'src/features/data/context/store';
import {useStyle} from 'src/features/theming/utils/useStyle';
import {selectUserList} from 'src/features/users/context/usersSelectors';
import {fetchUsers} from 'src/features/users/middleware/usersThunks';
import {BaseMultiSelector} from 'src/ui/Selectors/BaseMultiSelector';
import {BaseSelector} from 'src/ui/Selectors/BaseSelector';
import {createTeam, fetchTeam, updateTeam} from '../middleware/teamsThunks';
import {Team} from '../types';

const styles = StyleSheet.create({
	modal: {
		padding: 20,
		margin: 16,
		maxHeight: '85%',
	},
	header: {
		marginBottom: 8,
	},
	errorContainer: {
		marginBottom: 12,
	},
	field: {
		marginVertical: 6,
	},
	help: {
		marginTop: 4,
		marginBottom: 10,
	},
	actions: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		marginTop: 16,
		gap: 12,
	},
});

type MemberChoice = {id: number; name: string};

export const TeamModal = ({
	team,
	visible,
	onHideModal,
}: {
	team?: Team;
	visible: boolean;
	onHideModal: () => void;
}) => {
	const dispatch = useAppDispatch();
	const {t} = useTranslation();
	const theme = useTheme();
	const userList = useAppSelector(selectUserList);

	const dynamicStyles = useStyle(
		() => ({
			modal: {
				backgroundColor: theme.colors.background,
			},
			errorText: {
				color: theme.colors.error,
			},
			helpText: {
				color: theme.colors.onSurfaceVariant,
			},
		}),
		[
			theme.colors.background,
			theme.colors.error,
			theme.colors.onSurfaceVariant,
		],
	);

	const isEdit = team !== undefined;

	const [name, setName] = useState('');
	const [color, setColor] = useState<string | null>(null);
	const [teamColors, setTeamColors] = useState<Record<string, string>>({});
	const [memberIds, setMemberIds] = useState<number[]>([]);
	const [teamLeadId, setTeamLeadId] = useState<number | null>(null);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!visible) {
			setSaveError(null);
			return;
		}

		setSaveError(null);
		setName(team?.name ?? '');
		setColor(team?.color ?? null);
		const ids = (team?.members ?? []).map((member) => member.user.id);
		setMemberIds(ids);
		setTeamLeadId(
			team?.members?.find((member) => member.teamlead)?.user.id ??
				ids[0] ??
				null,
		);
	}, [visible, team]);

	useEffect(() => {
		if (!visible) {
			return;
		}

		let active = true;
		setTeamColors({});
		dispatch(fetchCustomerColors())
			.unwrap()
			.then((colors) => {
				if (active) {
					setTeamColors(colors);
				}
			})
			.catch((error: unknown) => {
				console.warn(`Could not load configured colors: ${String(error)}`);
			});

		// Make sure the member choices are available for the multi-select.
		dispatch(fetchUsers()).catch(() => {
			// The picker simply stays empty until the users are known.
		});

		// The list endpoint does not include members, so the full team has to
		// be loaded before it can be edited. Locally created teams (negative
		// ids) already carry their members.
		if (team && team.id > 0 && team.members === undefined) {
			dispatch(fetchTeam(team.id))
				.unwrap()
				.then((loaded) => {
					if (!active) {
						return;
					}
					const ids = (loaded.members ?? []).map((member) => member.user.id);
					setMemberIds(ids);
					setTeamLeadId(
						loaded.members?.find((member) => member.teamlead)?.user.id ??
							ids[0] ??
							null,
					);
				})
				.catch((error: unknown) => {
					console.warn(`Could not load team: ${String(error)}`);
				});
		}

		return () => {
			active = false;
		};
	}, [dispatch, visible, team]);

	const memberChoices = useMemo<MemberChoice[]>(
		() =>
			userList
				.filter((user) => user.enabled !== false)
				.map((user) => ({
					id: user.id,
					name: user.alias ?? user.username,
				})),
		[userList],
	);

	const selectedMembers = useMemo(
		() => memberChoices.filter((member) => memberIds.includes(member.id)),
		[memberChoices, memberIds],
	);

	const selectedLead = selectedMembers.find(
		(member) => member.id === teamLeadId,
	);

	const trimmedName = name.trim();
	const canSave = trimmedName.length > 0 && memberIds.length > 0 && !saving;

	const onMemberSelection = useCallback((selected: MemberChoice[]) => {
		const ids = selected.map((member) => member.id);
		setMemberIds(ids);
		// Keep the lead inside the team: fall back to the first member.
		setTeamLeadId((current) =>
			current !== null && ids.includes(current) ? current : (ids[0] ?? null),
		);
	}, []);

	const extractErrorMessage = useCallback(
		(action: {error?: {message?: string}}) => {
			const message = action.error?.message;
			return message && message.length > 0 ? message : t('teamSaveError');
		},
		[t],
	);

	const onSave = useCallback(async () => {
		if (!canSave) {
			return;
		}

		setSaving(true);
		setSaveError(null);
		const leadId = teamLeadId ?? memberIds[0];
		try {
			if (team) {
				const resultAction = await dispatch(
					updateTeam({
						...team,
						name: trimmedName,
						color,
						members: memberIds.map((id) => ({
							user: {
								id,
								username:
									userList.find((user) => user.id === id)?.username ?? '',
							},
							teamlead: id === leadId,
						})),
					}),
				);
				if (updateTeam.rejected.match(resultAction)) {
					setSaveError(extractErrorMessage(resultAction));
					return;
				}
			} else {
				const resultAction = await dispatch(
					createTeam({
						name: trimmedName,
						color,
						members: memberIds.map((id) => ({
							userId: id,
							teamlead: id === leadId,
						})),
					}),
				);
				if (createTeam.rejected.match(resultAction)) {
					setSaveError(extractErrorMessage(resultAction));
					return;
				}
			}
			onHideModal();
		} finally {
			setSaving(false);
		}
	}, [
		canSave,
		color,
		dispatch,
		extractErrorMessage,
		memberIds,
		onHideModal,
		team,
		teamLeadId,
		trimmedName,
		userList,
	]);

	return (
		<Portal>
			<Modal
				visible={visible}
				onDismiss={onHideModal}
				contentContainerStyle={[styles.modal, dynamicStyles.modal]}>
				<Text variant="titleLarge" style={styles.header}>
					{isEdit ? t('editTeam') : t('addTeam')}
				</Text>
				{saveError !== null && (
					<View style={styles.errorContainer}>
						<Text variant="labelLarge" style={dynamicStyles.errorText}>
							{t('teamSaveError')}
						</Text>
						{saveError !== t('teamSaveError') && (
							<Text variant="bodySmall" style={dynamicStyles.errorText}>
								{saveError}
							</Text>
						)}
					</View>
				)}
				<ScrollView>
					<TextInput
						label={`${t('name')} *`}
						mode="outlined"
						value={name}
						onChangeText={setName}
						style={styles.field}
					/>
					<CustomerColorField
						value={color}
						colors={teamColors}
						onChange={setColor}
					/>
					<View style={styles.field}>
						<BaseMultiSelector
							elements={memberChoices}
							selectedElements={selectedMembers}
							label={`${t('teamMembers')} *`}
							onSelection={onMemberSelection}
						/>
						<Text
							variant="bodySmall"
							style={[styles.help, dynamicStyles.helpText]}>
							{t('teamMembersHelp')}
						</Text>
					</View>
					{memberIds.length === 0 ? (
						<Text variant="bodySmall" style={dynamicStyles.errorText}>
							{t('teamNoMembers')}
						</Text>
					) : (
						<View style={styles.field}>
							<BaseSelector
								elements={selectedMembers}
								selectedElement={selectedLead}
								label={t('teamLead')}
								onSelection={(selection) => {
									const selected = selection.selectedList[0];
									if (selected) {
										setTeamLeadId(Number(selected._id));
									}
								}}
							/>
						</View>
					)}
				</ScrollView>
				<View style={styles.actions}>
					<Button onPress={onHideModal}>{t('cancel')}</Button>
					<Button
						mode="contained"
						disabled={!canSave}
						onPress={() => {
							onSave().catch(console.error);
						}}>
						{t('save')}
					</Button>
				</View>
			</Modal>
		</Portal>
	);
};
