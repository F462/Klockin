import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {StyleSheet, View} from 'react-native';
import {
	Button,
	Chip,
	IconButton,
	Modal,
	Portal,
	Text,
	TextInput,
	useTheme,
} from 'react-native-paper';

import {useAppDispatch, useAppSelector} from 'src/features/data/context/store';
import {selectTagList} from 'src/features/tags/context/tagsSelectors';
import {createTag} from 'src/features/tags/middleware/tagsThunks';

const styles = StyleSheet.create({
	container: {
		gap: 8,
	},
	header: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	tags: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 6,
	},
	availableTags: {
		gap: 4,
	},
	modal: {
		margin: 20,
		padding: 20,
	},
	modalActions: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'flex-end',
		marginTop: 16,
	},
});

type TimesheetTagsEditorProps = {
	tags: string[];
	onChange: (tags: string[]) => void;
};

export const TimesheetTagsEditor = ({
	tags,
	onChange,
}: TimesheetTagsEditorProps) => {
	const dispatch = useAppDispatch();
	const {t} = useTranslation();
	const theme = useTheme();
	const managedTags = useAppSelector(selectTagList);
	const [modalVisible, setModalVisible] = useState(false);
	const [editingIndex, setEditingIndex] = useState<number | undefined>();
	const [tagName, setTagName] = useState('');
	const [saveError, setSaveError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	const openAddModal = () => {
		setEditingIndex(undefined);
		setTagName('');
		setSaveError(null);
		setModalVisible(true);
	};

	const openEditModal = (index: number) => {
		setEditingIndex(index);
		setTagName(tags[index]);
		setSaveError(null);
		setModalVisible(true);
	};

	const closeModal = () => setModalVisible(false);
	const trimmedTagName = tagName.trim();
	const hasInvalidName = /[,<>=]/.test(trimmedTagName);
	const isTooShort = trimmedTagName.length > 0 && trimmedTagName.length < 2;
	const hasDuplicate = tags.some(
		(tag, index) =>
			index !== editingIndex &&
			tag.toLocaleLowerCase() === trimmedTagName.toLocaleLowerCase(),
	);
	const canSave =
		trimmedTagName.length >= 2 && !hasInvalidName && !hasDuplicate && !saving;
	const availableTags = managedTags.filter(
		(managedTag) =>
			!tags.some(
				(tag) =>
					tag.toLocaleLowerCase() === managedTag.name.toLocaleLowerCase(),
			),
	);

	const saveTag = async () => {
		if (!canSave) {
			return;
		}

		setSaving(true);
		setSaveError(null);
		try {
			const existingTag = managedTags.find(
				(tag) =>
					tag.name.toLocaleLowerCase() === trimmedTagName.toLocaleLowerCase(),
			);
			const savedName = existingTag
				? existingTag.name
				: (await dispatch(createTag({name: trimmedTagName})).unwrap()).name;

			if (editingIndex === undefined) {
				onChange([...tags, savedName]);
			} else {
				onChange(
					tags.map((tag, index) => (index === editingIndex ? savedName : tag)),
				);
			}
			closeModal();
		} catch (error: unknown) {
			setSaveError((error as {message?: string})?.message ?? t('tagSaveError'));
		} finally {
			setSaving(false);
		}
	};

	const deleteTag = () => {
		if (editingIndex !== undefined) {
			onChange(tags.filter((_, index) => index !== editingIndex));
		}
		closeModal();
	};

	const deleteTagAtIndex = (index: number) => {
		onChange(tags.filter((_, tagIndex) => tagIndex !== index));
	};

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text variant="titleSmall">{t('tags')}</Text>
				<IconButton
					accessibilityLabel={t('addTag')}
					icon="plus"
					size={20}
					onPress={openAddModal}
				/>
			</View>
			<View style={styles.tags}>
				{tags.map((tag, index) => (
					<Chip
						key={`${tag}-${index}`}
						compact
						mode="outlined"
						onPress={() => openEditModal(index)}
						onClose={() => deleteTagAtIndex(index)}>
						{tag}
					</Chip>
				))}
			</View>
			{availableTags.length > 0 && (
				<View style={styles.availableTags}>
					<Text variant="bodySmall">{t('availableTags')}</Text>
					<View style={styles.tags}>
						{availableTags.map((tag) => (
							<Chip
								key={tag.id}
								compact
								mode="outlined"
								onPress={() => onChange([...tags, tag.name])}>
								{tag.name}
							</Chip>
						))}
					</View>
				</View>
			)}
			<Portal>
				<Modal
					visible={modalVisible}
					onDismiss={closeModal}
					contentContainerStyle={[
						styles.modal,
						{backgroundColor: theme.colors.background},
					]}>
					<Text variant="headlineSmall">
						{t(editingIndex === undefined ? 'addTag' : 'editTag')}
					</Text>
					<TextInput
						accessibilityLabel={t('tagName')}
						label={t('tagName')}
						maxLength={100}
						value={tagName}
						onChangeText={setTagName}
						autoFocus
					/>
					{(isTooShort || hasInvalidName || saveError !== null) && (
						<Text variant="bodySmall" style={{color: theme.colors.error}}>
							{saveError ?? t('tagInvalidName')}
						</Text>
					)}
					{hasDuplicate && (
						<Text variant="bodySmall" style={{color: theme.colors.error}}>
							{t('tagAlreadyExists')}
						</Text>
					)}
					<View style={styles.modalActions}>
						{editingIndex !== undefined && (
							<Button textColor={theme.colors.error} onPress={deleteTag}>
								{t('delete')}
							</Button>
						)}
						<Button onPress={closeModal}>{t('cancel')}</Button>
						<Button
							mode="contained"
							disabled={!canSave}
							onPress={() => {
								saveTag().catch(console.error);
							}}>
							{t('save')}
						</Button>
					</View>
				</Modal>
			</Portal>
		</View>
	);
};
