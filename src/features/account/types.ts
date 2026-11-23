export type AccountState = {
	serverUrl: string | undefined;
	/**
	 * The roles of the currently signed in (connected) user, as reported by
	 * the server (`GET /api/users/me`). Empty when not connected or when the
	 * roles could not be determined.
	 */
	currentRoles: Array<string>;
};
