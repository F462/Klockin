import React from 'react';
import {useTranslation} from 'react-i18next';
import {StyleSheet, View} from 'react-native';
import {Button, Icon, Text, useTheme} from 'react-native-paper';

import {selectActivityList} from 'src/features/activities/context/activitiesSelectors';
import {selectCustomerList} from 'src/features/customers/context/customersSelectors';
import {useAppDispatch, useAppSelector} from 'src/features/data/context/store';
import {useAppNavigation} from 'src/features/navigation/context/hooks';
import {selectProjectList} from 'src/features/projects/context/projectsSelectors';
import {BaseScreen} from 'src/ui/BaseScreen';
import {
	onboardingCompleted,
	selectedModeChanged,
} from '../context/onboardingSlice';

const styles = StyleSheet.create({
	content: {flex: 1, justifyContent: 'center', padding: 24},
	icon: {alignSelf: 'center', marginBottom: 24},
	text: {textAlign: 'center', marginBottom: 20},
	button: {marginTop: 12},
});

type Stage = 'Customers' | 'Projects' | 'Activities' | 'ActiveTimesheet';

export const OfflineSetupScreen = () => {
	const {t} = useTranslation();
	const theme = useTheme();
	const navigation = useAppNavigation();
	const dispatch = useAppDispatch();
	const customers = useAppSelector(selectCustomerList);
	const projects = useAppSelector(selectProjectList);
	const activities = useAppSelector(selectActivityList);
	let next: Stage = 'ActiveTimesheet';
	if (customers.length === 0) {
		next = 'Customers';
	} else if (projects.length === 0) {
		next = 'Projects';
	} else if (activities.length === 0) {
		next = 'Activities';
	}
	const offlineStage: Record<Stage, {icon: string; message: string}> = {
		Customers: {
			icon: 'account-plus-outline',
			message: t('onboarding.offlineCustomers'),
		},
		Projects: {
			icon: 'briefcase-plus-outline',
			message: t('onboarding.offlineProjects'),
		},
		Activities: {
			icon: 'timer-plus-outline',
			message: t('onboarding.offlineActivities'),
		},
		ActiveTimesheet: {
			icon: 'check-decagram',
			message: t('onboarding.offlineReady'),
		},
	};
	const continueSetup = () => {
		if (next === 'ActiveTimesheet') {
			dispatch(onboardingCompleted());
			navigation.navigate('ActiveTimesheet');
		} else {
			navigation.navigate(next, {openCreateModal: true});
		}
	};
	const switchToOnline = () => {
		dispatch(selectedModeChanged('online'));
		navigation.navigate('Account');
	};

	return (
		<BaseScreen>
			<View style={styles.content}>
				<View style={styles.icon}>
					<Icon
						source={offlineStage[next].icon}
						color={theme.colors.primary}
						size={56}
					/>
				</View>
				<Text variant="headlineSmall" style={styles.text}>
					{t('onboarding.offlineTitle')}
				</Text>
				<Text variant="bodyLarge" style={styles.text}>
					{offlineStage[next].message}
				</Text>
				<Button mode="contained" style={styles.button} onPress={continueSetup}>
					{next === 'ActiveTimesheet'
						? t('onboarding.startTracking')
						: t('onboarding.createFirst', {
								entity: t(`onboarding.${next.toLowerCase()}`),
							})}
				</Button>
				{next !== 'ActiveTimesheet' && (
					<Button mode="text" style={styles.button} onPress={switchToOnline}>
						{t('onboarding.switchToOnline')}
					</Button>
				)}
			</View>
		</BaseScreen>
	);
};
