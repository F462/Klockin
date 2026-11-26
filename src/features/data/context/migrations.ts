import type {MigrationManifest, PersistState} from 'redux-persist';
import {createMigrate} from 'redux-persist';

import type {RootState} from './store';

/**
 * The shape of the state as it is persisted to storage: the redux root state
 * plus the `_persist` metadata that redux-persist adds to track the schema
 * version and rehydration status.
 */
export type PersistedRootState = RootState & {
	_persist: PersistState;
};

/**
 * A single store migration. It receives the persisted state as it was stored
 * at the previous version and returns the state upgraded to this migration's
 * version.
 */
export type Migration = (state: PersistedRootState) => PersistedRootState;

/**
 * The manifest of all store migrations, keyed by the version they upgrade TO.
 *
 * redux-persist runs the migrations in ascending order for any persisted state
 * whose `_persist.version` is older than {@link STORE_VERSION}. For example, a
 * state stored at version `0` while {@link STORE_VERSION} is `2` runs migration
 * `1` and then migration `2`.
 *
 * There are no migrations yet, so the manifest is intentionally empty. To add
 * one:
 * 1. Add an entry below keyed by the new version that upgrades the previous
 *    version's shape, e.g. `1: (state) => {...}`.
 * 2. Bump {@link STORE_VERSION} to that same version.
 */
const migrations: Record<number, Migration> = {
	// Example (uncomment and adapt when the schema changes):
	// 1: (state) => {
	// 	const {legacyField, ...rest} = state;
	// 	return {...rest, newField: transform(legacyField)};
	// },
};

/**
 * The current version of the persisted store schema.
 *
 * Bump this — and add a matching entry to {@link migrations} — whenever the
 * shape of the persisted state changes. Migrations only ever run forward, so a
 * stored state is upgraded step by step from its version up to this one.
 */
export const STORE_VERSION = 0;

/**
 * The redux-persist `migrate` function built from {@link migrations}. It is a
 * no-op (resolving the state unchanged) while the stored `_persist.version`
 * equals {@link STORE_VERSION}.
 *
 * The manifest is typed with the concrete {@link PersistedRootState} so that
 * individual migrations get full type safety on the real state. redux-persist's
 * `MigrationManifest` types the parameter loosely as `PersistedState`, so the
 * cast below is required to bridge the two. It is safe: redux-persist always
 * invokes a migration with the actual persisted state (the root state plus
 * `_persist`), which is exactly {@link PersistedRootState}.
 */
export const migrate = createMigrate(
	migrations as unknown as MigrationManifest,
);
