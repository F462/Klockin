import {useCallback} from 'react';
import {useTranslation} from 'react-i18next';

import {useAppDispatch} from 'src/features/data/context/store';
import {EntityItemContextMenu} from 'src/ui/EntityItemContextMenu';
import {removeTeam} from '../middleware/teamsThunks';
import {Team} from '../types';

export const TeamItemContextMenu = ({
	team,
	visible,
	onHideMenu,
	onEdit,
}: {
	team: Team;
	visible: boolean;
	onHideMenu: () => void;
	onEdit: () => void;
}) => {
	const {t} = useTranslation();
	const dispatch = useAppDispatch();
	const onConfirmDelete = useCallback(() => {
		dispatch(removeTeam(team.id)).catch(console.error);
	}, [dispatch, team.id]);

	return (
		<EntityItemContextMenu
			visible={visible}
			onHideMenu={onHideMenu}
			title={team.name}
			deleteTitle={t('deleteTeam')}
			deleteWarning={t('deleteTeamWarning')}
			onConfirmDelete={onConfirmDelete}
			onEdit={onEdit}
		/>
	);
};
