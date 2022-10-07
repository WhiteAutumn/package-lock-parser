import path from 'path';
import fs from 'fs';

import { Any, LockfileV1, PackageJson } from '../../util/types';

export type LockfileBundle = {
	v1: () => Promise<LockfileV1>;
	v2: () => Promise<Any>;
	packagefile: () => Promise<PackageJson>;
};

const dirname = path.join('.', 'src', 'test', 'resources');

const loadLockfileBundle = (dir: string): LockfileBundle => {
	const v1 = fs.promises.readFile(path.join(dirname, dir, 'v1.package-lock.json'))
		.then(it => it.toString());

	const v2 = fs.promises.readFile(path.join(dirname, dir, 'v2.package-lock.json'))
		.then(it => it.toString());

	const packagefile = fs.promises.readFile(path.join(dirname, dir, 'package.json'))
		.then(it => it.toString());

	return {
		v1: async () => JSON.parse(await v1),
		v2: async () => JSON.parse(await v2),
		packagefile: async () => JSON.parse(await packagefile)
	};
};

export const lockfiles = {
	deep1: loadLockfileBundle('deep-1'),
	deep1Dev: loadLockfileBundle('deep-1-dev'),
	deep2: loadLockfileBundle('deep-2'),
	devMixed: loadLockfileBundle('dev-mixed'),
	notAlphabetical: loadLockfileBundle('not-alphabetical'),
	simple: loadLockfileBundle('simple'),
	simpleDev: loadLockfileBundle('simple-dev'),
	versionMatch: loadLockfileBundle('version-match'),
	versionMismatch: loadLockfileBundle('version-mismatch')
};
