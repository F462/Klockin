import {useCameraPermission as useVisionCameraPermission} from 'react-native-vision-camera';

/**
 * Wrapper around VisionCamera's useCameraPermission hook that provides a stable API
 * expected by the QrScanner component.
 *
 * Returns:
 * - hasPermission: boolean indicating if camera permission is granted.
 * - canRequestPermission: true if we can still prompt the user (VisionCamera always allows request).
 * - requestPermission: async function that resolves to true when permission granted.
 */
export const useCameraPermission = () => {
	const {hasPermission, requestPermission} = useVisionCameraPermission();

	// VisionCamera's requestPermission resolves to boolean indicating granted status.
	const request = async (): Promise<boolean> => {
		const granted = await requestPermission();
		return granted;
	};

	const canRequestPermission = true;

	return {hasPermission, canRequestPermission, requestPermission: request};
};
