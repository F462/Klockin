import {
	DrawerContentComponentProps,
	DrawerItem,
} from '@react-navigation/drawer';
import React, {useCallback, useMemo, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {ScrollView, StyleSheet, View} from 'react-native';
import {List, useTheme} from 'react-native-paper';

import {useStyle} from 'src/features/theming/utils/useStyle';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 10,
	},
	indentedItem: {
		paddingLeft: 24,
	},
});

interface DrawerItemProps {
	routeName: string;
	indent?: boolean;
	routes: ReadonlyArray<{key?: string; name: string}>;
	index: number;
	descriptors: DrawerContentComponentProps['descriptors'];
	navigation: DrawerContentComponentProps['navigation'];
}

const DrawerItemComponent = ({
	routeName,
	indent = false,
	routes,
	index,
	descriptors,
	navigation,
}: DrawerItemProps) => {
	const {t} = useTranslation();
	const routeKey = routes.find((route) => route.name === routeName)?.key;

	if (routeKey === undefined) {
		return null;
	}

	const drawerIcon = descriptors[routeKey]?.options?.drawerIcon;
	return (
		<DrawerItem
			focused={routes.findIndex((route) => route.name === routeName) === index}
			label={t(`screenTitles.${routeName}`)}
			key={routeKey}
			onPress={() => navigation.navigate(routeName)}
			icon={drawerIcon}
			style={indent ? styles.indentedItem : undefined}
		/>
	);
};

interface AccordionSectionProps {
	id: string;
	title: string;
	icon: string;
	expanded: boolean;
	onToggle: () => void;
	routeNames: string[];
	itemProps: Omit<DrawerItemProps, 'indent' | 'routeName'>;
}

const AccordionSection = ({
	id,
	title,
	icon,
	expanded,
	onToggle,
	routeNames,
	itemProps,
}: AccordionSectionProps) => {
	const {t} = useTranslation();
	return (
		<List.Accordion
			id={id}
			title={t(`menuSections.${title}`)}
			// eslint-disable-next-line react/no-unstable-nested-components -- react-native-paper's `left` prop requires a render function
			left={(props) => <List.Icon {...props} icon={icon} />}
			expanded={expanded}
			onPress={onToggle}>
			{routeNames.map((routeName) => (
				<DrawerItemComponent
					{...itemProps}
					routeName={routeName}
					indent
					key={routeName}
				/>
			))}
		</List.Accordion>
	);
};

export const DefaultDrawerContent = ({
	state,
	navigation,
	descriptors,
}: DrawerContentComponentProps) => {
	const theme = useTheme();
	const [expandedSections, setExpandedSections] = useState({
		timeTracking: true,
		workContract: true,
		administration: true,
		system: true,
		app: true,
	});

	const toggleSection = useCallback(
		(section: keyof typeof expandedSections) => {
			setExpandedSections((current) => ({
				...current,
				[section]: !current[section],
			}));
		},
		[],
	);

	const itemProps = useMemo(
		() => ({
			routes: state.routes,
			index: state.index,
			descriptors,
			navigation,
		}),
		[descriptors, navigation, state.index, state.routes],
	);

	const dynamicStyles = useStyle(
		() => ({
			container: {
				backgroundColor: theme.colors.background,
			},
		}),
		[theme.colors.background],
	);

	return (
		<View style={[styles.container, dynamicStyles.container]}>
			<DrawerItemComponent {...itemProps} routeName="Account" />
			<ScrollView>
				<DrawerItemComponent {...itemProps} routeName="Overview" />
				<AccordionSection
					id="timeTracking"
					title="timeTracking"
					icon="clock"
					expanded={expandedSections.timeTracking}
					onToggle={() => toggleSection('timeTracking')}
					routeNames={['ActiveTimesheet', 'Timesheets']}
					itemProps={itemProps}
				/>
				<AccordionSection
					id="workContract"
					title="workContract"
					icon="scale-balance"
					expanded={expandedSections.workContract}
					onToggle={() => toggleSection('workContract')}
					routeNames={['WorkContract']}
					itemProps={itemProps}
				/>
				<AccordionSection
					id="administration"
					title="administration"
					icon="briefcase"
					expanded={expandedSections.administration}
					onToggle={() => toggleSection('administration')}
					routeNames={['Customers', 'Projects', 'Activities', 'Tags']}
					itemProps={itemProps}
				/>
				<AccordionSection
					id="system"
					title="system"
					icon="cog"
					expanded={expandedSections.system}
					onToggle={() => toggleSection('system')}
					routeNames={['Users']}
					itemProps={itemProps}
				/>
				<AccordionSection
					id="app"
					title="app"
					icon="cellphone"
					expanded={expandedSections.app}
					onToggle={() => toggleSection('app')}
					routeNames={['NfcTags', 'Settings', 'About']}
					itemProps={itemProps}
				/>
			</ScrollView>
		</View>
	);
};
