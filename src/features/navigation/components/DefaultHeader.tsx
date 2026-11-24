import {DrawerHeaderProps} from '@react-navigation/drawer';
import React from 'react';
import {useTranslation} from 'react-i18next';
import {StyleSheet, View} from 'react-native';
import {IconButton, Text} from 'react-native-paper';

import {useAppSelector} from 'src/features/data/context/store';
import i18n from 'src/features/localization/utils/i18n';
import {selectHasCompletedOnboarding} from 'src/features/onboarding/context/onboardingSelectors';
import {SynchronizationIndicator} from 'src/features/synchronization/components/SynchronizationIndicator';

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		marginHorizontal: 10,
		marginTop: 5,
	},
	headerText: {
		flex: 1,
		marginLeft: 20,
		textAlignVertical: 'center',
	},
	headerTextNoMenu: {
		marginLeft: 0,
	},
});

export const DefaultHeader = ({navigation, route}: DrawerHeaderProps) => {
	const {t} = useTranslation();
	// While onboarding is not finished yet (e.g. the mode is still being
	// chosen or the offline setup is running) the navigation drawer is
	// hidden so that the user stays in the guided flow.
	const hasCompletedOnboarding = useAppSelector(selectHasCompletedOnboarding);

	const routeName = route.name;

	const title = (() => {
		if (i18n.exists(`screenTitles.${routeName}`)) {
			return t(`screenTitles.${routeName}`);
		} else {
			return routeName;
		}
	})();
	return (
		<View style={styles.container}>
			{hasCompletedOnboarding && (
				<IconButton icon="menu" onPress={navigation.openDrawer} />
			)}
			<Text
				variant="titleLarge"
				style={[
					styles.headerText,
					!hasCompletedOnboarding && styles.headerTextNoMenu,
				]}>
				{title}
			</Text>
			<SynchronizationIndicator />
		</View>
	);
};
