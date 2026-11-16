export type Tag = {
	id: number;
	name: string;
	color?: string | null;
	'color-safe'?: string;
	visible?: boolean;
};

export type TagsState = {
	tags: {[id: number]: Tag};
};
