import {startAccountListeners} from 'src/features/account/middleware/accountListeners';
import {startActivityListeners} from 'src/features/activities/middleware/activitiesListener';
import {startCustomerListeners} from 'src/features/customers/middleware/customersListener';
import {startNetworkListeners} from 'src/features/network/middleware/networkListeners';
import {startOverviewListeners} from 'src/features/overview/middleware/overviewListener';
import {startProjectListeners} from 'src/features/projects/middleware/projectsListener';
import {startRolesListener} from 'src/features/roles/middleware/rolesListener';
import {startSettingsListeners} from 'src/features/settings/middleware/settingsListener';
import {startSynchronizationListeners} from 'src/features/synchronization/middleware/synchronizationListeners';
import {startTagListeners} from 'src/features/tags/middleware/tagsListener';
import {startTimesheetsListeners} from 'src/features/timesheets/middleware/timesheetsListener';
import {AppStartListening} from '../context/store';

export const startRootListener = (startListening: AppStartListening) => {
	startAccountListeners(startListening);
	startActivityListeners(startListening);
	startCustomerListeners(startListening);
	startNetworkListeners(startListening);
	startOverviewListeners(startListening);
	startProjectListeners(startListening);
	startRolesListener(startListening);
	startSettingsListeners(startListening);
	startSynchronizationListeners(startListening);
	startTagListeners(startListening);
	startTimesheetsListeners(startListening);
};
