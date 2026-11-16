import {useCallback} from 'react';
import {useTranslation} from 'react-i18next';

import {useAppDispatch} from 'src/features/data/context/store';
import {EntityItemContextMenu} from 'src/ui/EntityItemContextMenu';
import {deleteTag} from '../middleware/tagsThunks';
import {Tag} from '../types';

export const TagItemContextMenu = ({
	tag,
	visible,
	onHideMenu,
	onEdit,
}: {
	tag: Tag;
	visible: boolean;
	onHideMenu: () => void;
	onEdit: () => void;
}) => {
	const {t} = useTranslation();
	const dispatch = useAppDispatch();
	const onConfirmDelete = useCallback(() => {
		dispatch(deleteTag(tag.id)).catch(console.error);
	}, [dispatch, tag.id]);

	return (
		<EntityItemContextMenu
			visible={visible}
			onHideMenu={onHideMenu}
			title={tag.name}
			deleteTitle={t('deleteTag')}
			deleteWarning={t('deleteTagWarning')}
			onConfirmDelete={onConfirmDelete}
			onEdit={onEdit}
		/>
	);
};
