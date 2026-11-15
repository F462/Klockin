import {useEffect} from 'react';
import {useTranslation} from 'react-i18next';

import {useAppDispatch, useAppSelector} from 'src/features/data/context/store';
import {useAppAlert} from 'src/ui/AppAlertModal';
import {selectHasDevelopmentWarningBeenShown} from '../context/onboardingSelectors';
import {developmentWarningShown} from '../context/onboardingSlice';

export const Onboarding = () => {
	const dispatch = useAppDispatch();
	const {t} = useTranslation();
	const showAlert = useAppAlert();

	const hasDevelopmentWarningBeenShown = useAppSelector(
		selectHasDevelopmentWarningBeenShown,
	);
	useEffect(() => {
		if (!hasDevelopmentWarningBeenShown) {
			showAlert(t('warning'), t('onboarding.appStillInDevelopment'));
			dispatch(developmentWarningShown());
		}
	}, [dispatch, hasDevelopmentWarningBeenShown, showAlert, t]);

	return null;
};
