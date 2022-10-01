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
	basic: loadLockfileBundle('basic'),
	basicDev: loadLockfileBundle('basic-dev'),
	basicLocal: loadLockfileBundle('basic-local'),
	deep: loadLockfileBundle('deep'),
	nested: loadLockfileBundle('nested'),
	nestedDev: loadLockfileBundle('nested-dev'),
	nestedMixedDev: loadLockfileBundle('nested-mixed-dev'),
	nestedMixedDevReverse: loadLockfileBundle('nested-mixed-dev-reverse'),
	nestedVersionMatch: loadLockfileBundle('nested-version-match'),
	nestedVersionMismatch: loadLockfileBundle('nested-version-mismatch'),
	nestedVersionMismatchAlternate: loadLockfileBundle('nested-version-mismatch-alternate')
};
