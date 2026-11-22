export type Role = {
	name: string;
};

export type RolesState = {
	roles: {[name: string]: Role};
};
