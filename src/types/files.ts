import * as mercury from './mercury';

export type PackageJson = {
	dependencies?: Record<string, string>;
};

export type Lockfile = LockfileV1;

export type LockfileV1 = {
	lockfileVersion: 1;
	requires?: boolean;
	dependencies?: mercury.Packages;
};
