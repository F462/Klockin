import React from 'react';
import {useTranslation} from 'react-i18next';
import {Pressable, StyleSheet, View} from 'react-native';
import {Icon, Text, useTheme} from 'react-native-paper';

import {useAppDispatch} from 'src/features/data/context/store';
import {useAppNavigation} from 'src/features/navigation/context/hooks';
import {BaseScreen} from 'src/ui/BaseScreen';
import {selectedModeChanged} from '../context/onboardingSlice';
import {OnboardingMode} from '../types';

const styles = StyleSheet.create({
	content: {
		flex: 1,
		justifyContent: 'center',
		padding: 24,
	},
	headerIcon: {
		alignSelf: 'center',
		marginBottom: 24,
	},
	title: {
		textAlign: 'center',
		marginBottom: 12,
	},
	message: {
		textAlign: 'center',
		marginBottom: 32,
	},
	option: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
		borderRadius: 12,
		borderWidth: 1,
		marginBottom: 16,
	},
	optionIconWrap: {
		marginRight: 16,
	},
	optionText: {
		flex: 1,
		marginRight: 8,
	},
	optionTitle: {
		marginBottom: 4,
	},
});

const options: Array<{
	mode: OnboardingMode;
	icon: string;
	titleKey: string;
	messageKey: string;
}> = [
	{
		mode: 'online',
		icon: 'cloud-outline',
		titleKey: 'onboarding.onlineTitle',
		messageKey: 'onboarding.onlineMessage',
	},
	{
		mode: 'offline',
		icon: 'laptop-off',
		titleKey: 'onboarding.offlineModeTitle',
		messageKey: 'onboarding.offlineModeMessage',
	},
];

export const WelcomeScreen = () => {
	const {t} = useTranslation();
	const theme = useTheme();
	const navigation = useAppNavigation();
	const dispatch = useAppDispatch();

	const chooseMode = (mode: OnboardingMode) => {
		dispatch(selectedModeChanged(mode));
		navigation.navigate(mode === 'online' ? 'Account' : 'OfflineSetup');
	};

	return (
		<BaseScreen>
			<View style={styles.content}>
				<View style={styles.headerIcon}>
					<Icon
						source="rocket-launch-outline"
						color={theme.colors.primary}
						size={56}
					/>
				</View>
				<Text variant="headlineSmall" style={styles.title}>
					{t('onboarding.welcomeTitle')}
				</Text>
				<Text variant="bodyLarge" style={styles.message}>
					{t('onboarding.welcomeMessage')}
				</Text>
				{options.map((option) => (
					<Pressable
						key={option.mode}
						testID={`welcome-${option.mode}`}
						onPress={() => chooseMode(option.mode)}
						style={[
							styles.option,
							{
								backgroundColor: theme.colors.background,
								borderColor: theme.colors.outline,
							},
						]}>
						<View style={styles.optionIconWrap}>
							<Icon
								source={option.icon}
								color={theme.colors.primary}
								size={36}
							/>
						</View>
						<View style={styles.optionText}>
							<Text variant="titleMedium" style={styles.optionTitle}>
								{t(option.titleKey)}
							</Text>
							<Text variant="bodyMedium">{t(option.messageKey)}</Text>
						</View>
						<Icon
							source="chevron-right"
							color={theme.colors.primary}
							size={28}
						/>
					</Pressable>
				))}
			</View>
		</BaseScreen>
	);
};
