import {useCallback} from 'react';
import {useTranslation} from 'react-i18next';

import {useAppDispatch} from 'src/features/data/context/store';
import {EntityItemContextMenu} from 'src/ui/EntityItemContextMenu';
import {deleteRole} from '../middleware/rolesThunks';
import {Role} from '../types';

export const RoleItemContextMenu = ({
	role,
	visible,
	onHideMenu,
}: {
	role: Role;
	visible: boolean;
	onHideMenu: () => void;
}) => {
	const {t} = useTranslation();
	const dispatch = useAppDispatch();
	const onConfirmDelete = useCallback(() => {
		dispatch(deleteRole(role.name)).catch(console.error);
	}, [dispatch, role.name]);

	return (
		<EntityItemContextMenu
			visible={visible}
			onHideMenu={onHideMenu}
			title={role.name}
			deleteTitle={t('deleteRole')}
			deleteWarning={t('deleteRoleWarning')}
			onConfirmDelete={onConfirmDelete}
		/>
	);
};
