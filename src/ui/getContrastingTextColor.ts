const parseColor = (color: string): [number, number, number] | undefined => {
	const hex = color.trim().match(/^#([\da-f]{3,8})$/i)?.[1];
	if (hex) {
		const expanded =
			hex.length === 3 || hex.length === 4
				? hex
						.slice(0, 3)
						.split('')
						.map((part) => part + part)
						.join('')
				: hex.slice(0, 6);
		if (expanded.length === 6) {
			return [0, 2, 4].map((index) =>
				Number.parseInt(expanded.slice(index, index + 2), 16),
			) as [number, number, number];
		}
	}

	const rgb = color.match(
		/^rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)/i,
	);
	return rgb
		? ([Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] as [
				number,
				number,
				number,
			])
		: undefined;
};

const luminance = ([red, green, blue]: [number, number, number]) => {
	const linearize = (value: number) => {
		const channel = value / 255;
		return channel <= 0.04045
			? channel / 12.92
			: ((channel + 0.055) / 1.055) ** 2.4;
	};
	return (
		0.2126 * linearize(red) +
		0.7152 * linearize(green) +
		0.0722 * linearize(blue)
	);
};

/** Select black or white text for the stronger contrast on a tag color. */
export const getContrastingTextColor = (
	backgroundColor?: string | null,
	fallbackColor = '#000000',
) => {
	const rgb = backgroundColor ? parseColor(backgroundColor) : undefined;
	if (!rgb) {
		return fallbackColor;
	}
	const backgroundLuminance = luminance(rgb);
	const blackContrast = (backgroundLuminance + 0.05) / 0.05;
	const whiteContrast = 1.05 / (backgroundLuminance + 0.05);
	return whiteContrast > blackContrast ? '#ffffff' : '#000000';
};
