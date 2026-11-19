import dayjs from 'dayjs';
import React, {useCallback, useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {
	Image,
	RefreshControl,
	ScrollView,
	StyleProp,
	StyleSheet,
	View,
	ViewStyle,
} from 'react-native';
import {IconButton, SegmentedButtons, Text, useTheme} from 'react-native-paper';
import uuid from 'react-native-uuid';

import {stopActiveTimesheet} from 'src/features/activeTimesheet/middleware/activeTimesheetThunks';
import {
	selectSelectedActivity,
	selectSelectedActivityId,
} from 'src/features/activities/context/activitiesSelectors';
import {activitySelected} from 'src/features/activities/context/activitiesSlice';
import {useAppDispatch, useAppSelector} from 'src/features/data/context/store';
import {
	selectSelectedProject,
	selectSelectedProjectId,
} from 'src/features/projects/context/projectsSelectors';
import {projectSelected} from 'src/features/projects/context/projectsSlice';
import {useResponsiveScale} from 'src/features/theming/utils/useResponsiveScale';
import {useStyle} from 'src/features/theming/utils/useStyle';
import {TimesheetList} from 'src/features/timesheets/components/TimesheetList';
import {useWorkingHoursOfCurrentDayInSeconds} from 'src/features/timesheets/context/timesheetHooks';
import {
	selectActiveTimesheet,
	selectTimesheetListOfCurrentDay,
} from 'src/features/timesheets/context/timesheetsSelectors';
import {fetchTimesheets} from 'src/features/timesheets/middleware/timesheetsThunks';
import {DateTimePicker} from 'src/ui/DateTimePicker';
import {ActivitySelector as ActivitySelectorComponent} from 'src/ui/Selectors/ActivitySelector';
import {ProjectSelector as ProjectSelectorComponent} from 'src/ui/Selectors/ProjectSelector';
import {
	selectCanTimesheetBeStarted,
	selectNextTimesheetStartDate,
} from '../context/activeTimesheetSelectors';
import {
	newTimesheetStarted,
	nextTimesheetStartDatetimeSet,
} from '../context/activeTimesheetSlice';

const styles = StyleSheet.create({
	mainContainer: {
		margin: 20,
		gap: 20,
		flex: 1,
	},
	scrollableContent: {
		flex: 1,
	},
	watermarkedButton: {
		alignSelf: 'center',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 20,
	},
	watermark: {
		position: 'absolute',
		top: '50%',
		left: '50%',
	},
	dayWorkingHoursContainer: {
		flexDirection: 'row',
		padding: 10,
		borderRadius: 5,
	},
	dayWorkingHourLabelText: {
		flex: 3,
	},
	dayWorkingHourValueText: {
		flex: 1,
		textAlign: 'right',
	},
	segmentedButtons: {
		marginVertical: 10,
	},
});

const ICON_SIZE = 200;

// The monogram sits in the foreground, fully inside the play/stop glyph, in a
// dark color so it contrasts against the primary-colored icon. It is sized as
// a fraction of the icon so it stays inside even the narrowest glyph (play).
const WATERMARK_RATIO = 0.25;
const WATERMARK = require('src/assets/bootsplash/logo_mono_dark.png');

// The icon-font glyphs are left- and baseline-aligned, so their visible center
// is offset from the centered icon box. Fractions of the icon size that move
// the watermark from the box center onto each glyph's center (y positive = down).
const WATERMARK_CENTER_OFFSETS: Record<string, {x: number; y: number}> = {
	play: {x: -0.1035, y: 0.0439},
	stop: {x: -0.125, y: 0.0625},
};

const WatermarkedIconButton = ({
	icon,
	size,
	onPress,
}: {
	icon: string;
	size: number;
	onPress: () => void;
}) => {
	const theme = useTheme();
	const watermarkSize = size * WATERMARK_RATIO;
	const {x: offsetX, y: offsetY} = WATERMARK_CENTER_OFFSETS[icon] ?? {
		x: 0,
		y: 0,
	};

	return (
		<View style={styles.watermarkedButton}>
			<IconButton
				icon={icon}
				size={size}
				iconColor={theme.colors.primary}
				onPress={onPress}
			/>
			<Image
				source={WATERMARK}
				style={[
					styles.watermark,
					{
						width: watermarkSize,
						height: watermarkSize,
						transform: [
							{translateY: '-50%'},
							{translateX: '-50%'},
							{translateX: offsetX * size},
							{translateY: offsetY * size},
						],
					},
				]}
				resizeMode="contain"
				accessible={false}
				accessibilityElementsHidden
				importantForAccessibility="no-hide-descendants"
			/>
		</View>
	);
};

const StopButton = () => {
	const dispatch = useAppDispatch();
	const scale = useResponsiveScale();

	const handleStop = useCallback(() => {
		dispatch(stopActiveTimesheet()).catch(console.warn);
	}, [dispatch]);

	return (
		<WatermarkedIconButton
			icon="stop"
			size={ICON_SIZE * scale}
			onPress={handleStop}
		/>
	);
};

const ActiveTimesheetContent = () => {
	return (
		<View>
			<StopButton />
		</View>
	);
};

const DatetimeSelector = () => {
	const dispatch = useAppDispatch();
	const {t} = useTranslation();
	const [startMode, setStartMode] = useState<'now' | 'fixed'>('now');

	useEffect(() => {
		dispatch(
			nextTimesheetStartDatetimeSet(
				startMode === 'now' ? undefined : dayjs().unix(),
			),
		);
	}, [dispatch, startMode]);

	const handleStartModeChange = useCallback(
		(value: string) => setStartMode(value as 'now' | 'fixed'),
		[],
	);

	const dateUnixTimestamp = useAppSelector(selectNextTimesheetStartDate);
	const handleDateTimePick = useCallback(
		(
			pickedDateTime: Parameters<
				React.ComponentProps<typeof DateTimePicker>['onDateTimePick']
			>[0],
		) => dispatch(nextTimesheetStartDatetimeSet(pickedDateTime.unix())),
		[dispatch],
	);

	return (
		<View>
			<SegmentedButtons
				style={styles.segmentedButtons}
				value={startMode}
				onValueChange={handleStartModeChange}
				buttons={[
					{value: 'now', label: t('now')},
					{value: 'fixed', label: t('specificTime')},
				]}
			/>
			{startMode === 'fixed' ? (
				<DateTimePicker
					initialValue={dateUnixTimestamp}
					onDateTimePick={handleDateTimePick}
				/>
			) : null}
		</View>
	);
};

const ActivitySelector = () => {
	const dispatch = useAppDispatch();

	const selectedActivity = useAppSelector(selectSelectedActivity);

	const handleSelectActivity = useCallback(
		(
			activity: Parameters<
				React.ComponentProps<
					typeof ActivitySelectorComponent
				>['onSelectActivity']
			>[0],
		) => {
			dispatch(activitySelected(activity?.id));
		},
		[dispatch],
	);

	return (
		<ActivitySelectorComponent
			selectedActivity={selectedActivity}
			onSelectActivity={handleSelectActivity}
		/>
	);
};

const ProjectSelector = () => {
	const dispatch = useAppDispatch();

	const selectedProject = useAppSelector(selectSelectedProject);

	const handleSelectProject = useCallback(
		(
			project: Parameters<
				React.ComponentProps<typeof ProjectSelectorComponent>['onSelectProject']
			>[0],
		) => dispatch(projectSelected(project?.id)),
		[dispatch],
	);

	return (
		<ProjectSelectorComponent
			selectedProject={selectedProject}
			onSelectProject={handleSelectProject}
		/>
	);
};

const StartButton = () => {
	const dispatch = useAppDispatch();
	const canTimesheetBeStarted = useAppSelector(selectCanTimesheetBeStarted);
	const selectedProjectId = useAppSelector(selectSelectedProjectId);
	const selectedActivityId = useAppSelector(selectSelectedActivityId);
	const nextTimesheetStartDatetime = useAppSelector(
		selectNextTimesheetStartDate,
	);
	const scale = useResponsiveScale();

	const handleStart = useCallback(() => {
		dispatch(
			newTimesheetStarted({
				id: uuid.v4(),
				begin: (nextTimesheetStartDatetime
					? dayjs.unix(nextTimesheetStartDatetime)
					: new Date()
				).toISOString(),
				project: selectedProjectId,
				activity: selectedActivityId,
			}),
		);
	}, [
		dispatch,
		nextTimesheetStartDatetime,
		selectedProjectId,
		selectedActivityId,
	]);

	return canTimesheetBeStarted ? (
		<WatermarkedIconButton
			icon="play"
			size={ICON_SIZE * scale}
			onPress={handleStart}
		/>
	) : null;
};

const NonActiveTimesheetContent = () => {
	return (
		<View>
			<DatetimeSelector />
			<ProjectSelector />
			<ActivitySelector />
			<StartButton />
		</View>
	);
};

type RefreshViewProps = React.PropsWithChildren<{
	style?: StyleProp<ViewStyle>;
}>;
const RefreshView = ({children, style}: RefreshViewProps) => {
	const dispatch = useAppDispatch();

	const [refreshing, setRefreshing] = React.useState(false);
	const onRefresh = React.useCallback(() => {
		setRefreshing(true);
		dispatch(fetchTimesheets())
			.then(() => setRefreshing(false))
			.catch(console.warn);
	}, [dispatch]);

	return (
		<ScrollView
			style={style}
			refreshControl={
				<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
			}>
			{children}
		</ScrollView>
	);
};

const DayWorkingHours = () => {
	const {t} = useTranslation();
	const theme = useTheme();

	const workingHoursOfCurrentDayInSeconds =
		useWorkingHoursOfCurrentDayInSeconds(5000);

	const displayedWorkingHours = dayjs
		.duration(workingHoursOfCurrentDayInSeconds * 1000)
		.format('HH:mm');

	const dynamicStyles = useStyle(
		() => ({
			dayWorkingHoursContainer: {
				backgroundColor: theme.colors.primaryContainer,
			},
			textOnContainer: {
				color: theme.colors.onPrimaryContainer,
			},
		}),
		[theme.colors.onPrimaryContainer, theme.colors.primaryContainer],
	);

	return (
		<View
			style={[
				styles.dayWorkingHoursContainer,
				dynamicStyles.dayWorkingHoursContainer,
			]}>
			<Text
				variant="titleMedium"
				style={[styles.dayWorkingHourLabelText, dynamicStyles.textOnContainer]}>
				{t('workingTimeToday')}
			</Text>
			<Text
				variant="titleMedium"
				style={[styles.dayWorkingHourValueText, dynamicStyles.textOnContainer]}>
				{displayedWorkingHours}
			</Text>
		</View>
	);
};

const TimesheetListOfCurrentDay = () => {
	const timesheetList = useAppSelector(selectTimesheetListOfCurrentDay);

	return <TimesheetList data={timesheetList} scrollEnabled={false} />;
};

export const ActiveTimesheetScreen = () => {
	const timesheet = useAppSelector(selectActiveTimesheet);

	return (
		<View style={styles.mainContainer}>
			<DayWorkingHours />
			<RefreshView style={styles.scrollableContent}>
				{timesheet !== undefined ? (
					<ActiveTimesheetContent />
				) : (
					<NonActiveTimesheetContent />
				)}
				<TimesheetListOfCurrentDay />
			</RefreshView>
		</View>
	);
};
