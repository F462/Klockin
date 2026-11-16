import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {StyleSheet, View} from 'react-native';
import {
	Button,
	Modal,
	Portal,
	Text,
	TextInput,
	useTheme,
} from 'react-native-paper';

import {useAppDispatch, useAppSelector} from 'src/features/data/context/store';
import {selectTagList} from '../context/tagsSelectors';
import {createTag, deleteTag} from '../middleware/tagsThunks';
import {Tag} from '../types';

const styles = StyleSheet.create({
	modal: {
		margin: 20,
		padding: 20,
	},
	field: {
		marginTop: 12,
	},
	message: {
		marginTop: 10,
	},
	actions: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'flex-end',
		marginTop: 16,
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
	const [name, setName] = useState(tag?.name ?? '');
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (visible) {
			setName(tag?.name ?? '');
			setError(null);
		}
	}, [tag, visible]);

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

	const save = async () => {
		if (!canSave) {
			return;
		}

		setSaving(true);
		setError(null);
		try {
			if (tag) {
				if (trimmedName !== tag.name) {
					await dispatch(createTag(trimmedName)).unwrap();
					await dispatch(deleteTag(tag.id)).unwrap();
				}
			} else {
				await dispatch(createTag(trimmedName)).unwrap();
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
				contentContainerStyle={[
					styles.modal,
					{backgroundColor: theme.colors.background},
				]}>
				<Text variant="headlineSmall">{t(tag ? 'editTag' : 'addTag')}</Text>
				<TextInput
					accessibilityLabel={t('tagName')}
					label={t('tagName')}
					mode="outlined"
					maxLength={100}
					style={styles.field}
					value={name}
					onChangeText={setName}
				/>
				{tag && (
					<Text
						style={[styles.message, {color: theme.colors.onSurfaceVariant}]}>
						{t('tagRenameWarning')}
					</Text>
				)}
				{(isTooShort ||
					hasInvalidCharacter ||
					hasDuplicate ||
					error !== null) && (
					<Text style={[styles.message, {color: theme.colors.error}]}>
						{error ??
							(isTooShort || hasInvalidCharacter
								? t('tagInvalidName')
								: t('tagAlreadyExists'))}
					</Text>
				)}
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
