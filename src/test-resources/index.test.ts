import path from 'path';
import fs from 'fs';

import { Any } from '../types';


export type LockfileBundle = {
	v1: () => Promise<Any>;
	v2: () => Promise<Any>;
	packagefile: () => Promise<Any>;
};

const dirname = path.join('.', 'src', 'test-resources');

const loadLockfileBundle = (dir: string): LockfileBundle => {
	const v1 = fs.promises.readFile(path.join(dirname, dir, 'v1.package-lock.json'))
		.then(it => it.toString())
		.then(it => JSON.parse(it));

	const v2 = fs.promises.readFile(path.join(dirname, dir, 'v2.package-lock.json'))
		.then(it => it.toString())
		.then(it => JSON.parse(it));

	const packagefile = fs.promises.readFile(path.join(dirname, dir, 'package.json'))
		.then(it => it.toString())
		.then(it => JSON.parse(it));

	return {
		v1: async () => await v1,
		v2: async () => await v2,
		packagefile: async () => await packagefile
	};
};

export const lockfiles = {
	basic: loadLockfileBundle('basic'),
	basicDev: loadLockfileBundle('basic-dev'),
	basicLocal: loadLockfileBundle('basic-local'),
	nested: loadLockfileBundle('nested'),
	nestedVersionMatch: loadLockfileBundle('nested-version-match'),
	nestedVersionMismatch: loadLockfileBundle('nested-version-mismatch'),
	nestedVersionMismatchAlternate: loadLockfileBundle('nested-version-mismatch-alternate')
};
