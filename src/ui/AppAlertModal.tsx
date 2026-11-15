import React, {useCallback} from 'react';
import {useTranslation} from 'react-i18next';
import {StyleSheet, View} from 'react-native';
import {
	createModalStack,
	ModalComponentProp,
	ModalProvider,
	useModal,
} from 'react-native-modalfy';
import {Button, Surface, Text, useTheme} from 'react-native-paper';

export type AppAlertButton = {
	text: string;
	style?: 'default' | 'cancel' | 'destructive';
	onPress?: () => void;
};

export type AppAlertParams = {
	title: string;
	message?: string;
	buttons?: AppAlertButton[];
};

type AppModalParams = {
	AppAlert: AppAlertParams;
};

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		width: '100%',
	},
	dialog: {
		borderRadius: 12,
		maxWidth: 440,
		padding: 24,
		width: '88%',
	},
	message: {
		marginTop: 12,
	},
	buttons: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'flex-end',
		marginTop: 20,
	},
});

const AppAlertModal = ({
	modal,
}: ModalComponentProp<AppModalParams, {}, 'AppAlert'>) => {
	const {params, closeModal} = modal;
	const theme = useTheme();
	const {t} = useTranslation();
	const buttons = params?.buttons?.length
		? params.buttons
		: [{text: t('dismiss')}];
	const getButtonColor = (style?: AppAlertButton['style']) => {
		if (style === 'cancel') {
			return theme.colors.onSurfaceVariant;
		}
		if (style === 'destructive') {
			return theme.colors.error;
		}
		return theme.colors.primary;
	};

	return (
		<View style={styles.container}>
			<Surface
				elevation={3}
				style={[styles.dialog, {backgroundColor: theme.colors.surface}]}>
				<Text variant="headlineSmall">{params?.title}</Text>
				{params?.message ? (
					<Text style={styles.message}>{params.message}</Text>
				) : null}
				<View style={styles.buttons}>
					{buttons.map((button, index) => (
						<Button
							key={`${button.text}-${index}`}
							mode="text"
							textColor={getButtonColor(button.style)}
							onPress={() => closeModal('AppAlert', button.onPress)}>
							{button.text}
						</Button>
					))}
				</View>
			</Surface>
		</View>
	);
};

const appAlertStack = createModalStack<AppModalParams>(
	{AppAlert: AppAlertModal},
	{backdropOpacity: 0.48, position: 'center'},
);

export const AppModalProvider = ({children}: React.PropsWithChildren) => (
	<ModalProvider stack={appAlertStack}>{children}</ModalProvider>
);

export const useAppAlert = () => {
	const {openModal} = useModal<AppModalParams>();
	return useCallback(
		(title: string, message?: string, buttons?: AppAlertButton[]) =>
			openModal('AppAlert', {title, message, buttons}),
		[openModal],
	);
};
