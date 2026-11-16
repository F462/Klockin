import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {ScrollView, StyleSheet, View} from 'react-native';
import {
	Button,
	Modal,
	Portal,
	Switch,
	Text,
	TextInput,
	useTheme,
} from 'react-native-paper';

import {CustomerColorField} from 'src/features/customers/components/CustomerColorField';
import {fetchCustomerColors} from 'src/features/customers/middleware/customersThunks';
import {useAppDispatch, useAppSelector} from 'src/features/data/context/store';
import {useStyle} from 'src/features/theming/utils/useStyle';
import {selectTagList} from '../context/tagsSelectors';
import {createTag, deleteTag} from '../middleware/tagsThunks';
import {Tag} from '../types';

const styles = StyleSheet.create({
	modal: {
		padding: 20,
		margin: 16,
		maxHeight: '85%',
	},
	header: {
		marginBottom: 8,
	},
	field: {
		marginVertical: 6,
	},
	warning: {
		marginTop: 8,
	},
	switchRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginVertical: 8,
		gap: 12,
	},
	switchText: {
		flex: 1,
	},
	switchHelp: {
		opacity: 0.7,
	},
	message: {
		marginTop: 10,
	},
	actions: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'flex-end',
		marginTop: 16,
		gap: 12,
	},
});

export const TagModal = ({
	tag,
	visible,
	onHideModal,
}: {
	tag?: Tag;
	visible: boolean;
	onHideModal: () => void;
}) => {
	const dispatch = useAppDispatch();
	const {t} = useTranslation();
	const theme = useTheme();
	const tags = useAppSelector(selectTagList);

	const dynamicStyles = useStyle(
		() => ({
			modal: {
				backgroundColor: theme.colors.background,
			},
			warningText: {
				color: theme.colors.onSurfaceVariant,
			},
			errorText: {
				color: theme.colors.error,
			},
		}),
		[
			theme.colors.background,
			theme.colors.error,
			theme.colors.onSurfaceVariant,
		],
	);

	const [name, setName] = useState(tag?.name ?? '');
	const [color, setColor] = useState<string | null>(tag?.color ?? null);
	const [isVisible, setIsVisible] = useState(tag?.visible ?? true);
	const [tagColors, setTagColors] = useState<Record<string, string>>({});
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!visible) {
			// Clear the form while hidden, so stale input from a previous
			// open (e.g. the name that was just created) cannot pre-fill
			// the next open or re-trigger the "already exists" warning.
			setName('');
			setColor(null);
			setIsVisible(true);
			setError(null);
			return;
		}

		setName(tag?.name ?? '');
		setColor(tag?.color ?? null);
		setIsVisible(tag?.visible ?? true);
		setError(null);
	}, [tag, visible]);

	useEffect(() => {
		if (!visible) {
			return;
		}

		let active = true;
		setTagColors({});
		dispatch(fetchCustomerColors())
			.unwrap()
			.then((colors) => {
				if (active) {
					setTagColors(colors);
				}
			})
			.catch((fetchError: unknown) => {
				console.warn(`Could not load configured colors: ${String(fetchError)}`);
			});

		return () => {
			active = false;
		};
	}, [dispatch, visible]);

	const trimmedName = name.trim();
	const hasInvalidCharacter = /[,<>=]/.test(trimmedName);
	const isTooShort = trimmedName.length > 0 && trimmedName.length < 2;
	const hasDuplicate = tags.some(
		(existingTag) =>
			existingTag.id !== tag?.id &&
			existingTag.name.toLocaleLowerCase() === trimmedName.toLocaleLowerCase(),
	);
	const canSave =
		trimmedName.length >= 2 && !hasInvalidCharacter && !hasDuplicate && !saving;
	// While a save is in progress the tag list already contains the tag
	// that is being created (or, when renaming, both the old and the new
	// one), which would otherwise briefly trigger the "already exists"
	// warning right after a successful save.
	const showValidationError =
		!saving &&
		(isTooShort || hasInvalidCharacter || hasDuplicate || error !== null);

	const save = async () => {
		if (!canSave) {
			return;
		}

		setSaving(true);
		setError(null);
		try {
			if (tag) {
				const unchanged =
					trimmedName === tag.name &&
					color === (tag.color ?? null) &&
					isVisible === (tag.visible ?? true);
				if (unchanged) {
					onHideModal();
					return;
				}
				// The Kimai API has no update endpoint for tags, so an edit is
				// performed by creating the updated tag and deleting the old one.
				await dispatch(
					createTag({name: trimmedName, color, visible: isVisible}),
				).unwrap();
				await dispatch(deleteTag(tag.id)).unwrap();
			} else {
				await dispatch(
					createTag({name: trimmedName, color, visible: isVisible}),
				).unwrap();
			}
			onHideModal();
		} catch (saveError: unknown) {
			setError((saveError as {message?: string})?.message ?? t('tagSaveError'));
		} finally {
			setSaving(false);
		}
	};

	return (
		<Portal>
			<Modal
				visible={visible}
				onDismiss={onHideModal}
				contentContainerStyle={[styles.modal, dynamicStyles.modal]}>
				<Text variant="titleLarge" style={styles.header}>
					{t(tag ? 'editTag' : 'addTag')}
				</Text>
				<ScrollView>
					<TextInput
						accessibilityLabel={t('tagName')}
						label={`${t('name')} *`}
						mode="outlined"
						maxLength={100}
						style={styles.field}
						value={name}
						onChangeText={setName}
					/>
					<CustomerColorField
						value={color}
						colors={tagColors}
						onChange={setColor}
					/>
					<View style={styles.switchRow}>
						<View style={styles.switchText}>
							<Text variant="bodyMedium">{t('visible')}</Text>
							<Text variant="bodySmall" style={styles.switchHelp}>
								{t('tagVisibleHelp')}
							</Text>
						</View>
						<Switch value={isVisible} onValueChange={setIsVisible} />
					</View>
					{tag && (
						<Text style={[styles.warning, dynamicStyles.warningText]}>
							{t('tagRenameWarning')}
						</Text>
					)}
					{showValidationError && (
						<Text style={[styles.message, dynamicStyles.errorText]}>
							{error ??
								(isTooShort || hasInvalidCharacter
									? t('tagInvalidName')
									: t('tagAlreadyExists'))}
						</Text>
					)}
				</ScrollView>
				<View style={styles.actions}>
					<Button onPress={onHideModal}>{t('cancel')}</Button>
					<Button
						mode="contained"
						disabled={!canSave}
						onPress={() => {
							save().catch(console.error);
						}}>
						{t('save')}
					</Button>
				</View>
			</Modal>
		</Portal>
	);
};
