import {AboutScreen} from 'src/features/about/components/AboutScreen';
import {AccountScreen} from 'src/features/account/components/AccountScreen';
import {ActiveTimesheetScreen} from 'src/features/activeTimesheet/components/ActiveTimesheetScreen';
import {ActivitiesScreen} from 'src/features/activities/components/ActivitiesScreen';
import {CustomersScreen} from 'src/features/customers/components/CustomersScreen';
import {NfcTagsScreen} from 'src/features/nfc/components/NfcTagsScreen';
import {OfflineSetupScreen} from 'src/features/onboarding/components/OfflineSetupScreen';
import {WelcomeScreen} from 'src/features/onboarding/components/WelcomeScreen';
import {OverviewScreen} from 'src/features/overview/components/OverviewScreen';
import {ProjectsScreen} from 'src/features/projects/components/ProjectsScreen';
import {RolesScreen} from 'src/features/roles/components/RolesScreen';
import {SettingsScreen} from 'src/features/settings/components/SettingsScreen';
import {WorkContractScreen} from 'src/features/settings/components/WorkContractScreen';
import {TagsScreen} from 'src/features/tags/components/TagsScreen';
import {TimesheetsScreen} from 'src/features/timesheets/components/TimesheetsScreen';
import {UsersScreen} from 'src/features/users/components/UsersScreen';
import {createDrawerIconFunction} from './components/DrawerItemIcon';
import {ScreenParameters} from './ScreenParameters';

export const screens: Array<{
	name: keyof ScreenParameters;
	component: React.FC<any>;
	options?: any;
}> = [
	{
		name: 'About',
		component: AboutScreen,
		options: {
			drawerIcon: createDrawerIconFunction('information-variant'),
		},
	},
	{
		name: 'Account',
		component: AccountScreen,
		options: {
			drawerIcon: createDrawerIconFunction('account-outline'),
		},
	},
	{
		name: 'ActiveTimesheet',
		component: ActiveTimesheetScreen,
		options: {
			drawerIcon: createDrawerIconFunction('progress-clock'),
		},
	},
	{
		name: 'Activities',
		component: ActivitiesScreen,
		options: {
			drawerIcon: createDrawerIconFunction('run'),
		},
	},
	{
		name: 'Customers',
		component: CustomersScreen,
		options: {
			drawerIcon: createDrawerIconFunction('face-agent'),
		},
	},
	{
		name: 'NfcTags',
		component: NfcTagsScreen,
		options: {
			drawerIcon: createDrawerIconFunction('nfc-variant'),
		},
	},
	{
		name: 'Overview',
		component: OverviewScreen,
		options: {
			drawerIcon: createDrawerIconFunction('view-dashboard-outline'),
		},
	},
	{
		name: 'Projects',
		component: ProjectsScreen,
		options: {
			drawerIcon: createDrawerIconFunction('hammer'),
		},
	},
	{
		name: 'Settings',
		component: SettingsScreen,
		options: {
			drawerIcon: createDrawerIconFunction('cog'),
		},
	},
	{
		name: 'Tags',
		component: TagsScreen,
		options: {
			drawerIcon: createDrawerIconFunction('tag-multiple'),
		},
	},
	{
		name: 'OfflineSetup',
		component: OfflineSetupScreen,
		options: {drawerItemStyle: {display: 'none'}},
	},
	{
		name: 'Welcome',
		component: WelcomeScreen,
		options: {drawerItemStyle: {display: 'none'}},
	},
	{
		name: 'WorkContract',
		component: WorkContractScreen,
		options: {
			drawerIcon: createDrawerIconFunction('calendar-clock'),
		},
	},
	{
		name: 'Timesheets',
		component: TimesheetsScreen,
		options: {
			drawerIcon: createDrawerIconFunction('calendar-clock'),
		},
	},
	{
		name: 'Roles',
		component: RolesScreen,
		options: {
			drawerIcon: createDrawerIconFunction('account-key-outline'),
		},
	},
	{
		name: 'Users',
		component: UsersScreen,
		options: {
			drawerIcon: createDrawerIconFunction('account-multiple-outline'),
		},
	},
];
