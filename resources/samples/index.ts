import fs from 'fs/promises';

import index from './index.json';

const variants = <const>['v1', 'v2', 'v3'];
const directories = <Directories[]>Object.keys(index);

type Variant = typeof variants[number];
type Directories = keyof typeof index;

const pendingLockfiles = <Record<Directories, Record<Variant, Promise<unknown>>>>{};
const pendingPackageJsons = <Record<Directories, Promise<unknown>>>{};

for (const directory of directories) {
	pendingLockfiles[directory] = <Record<Variant, Promise<unknown>>>{};
	pendingPackageJsons[directory] = fs.readFile(`./resources/samples/${directory}/package.json`, 'utf8')
		.then(JSON.parse);

	for (const variant of variants) {
		pendingLockfiles[directory][variant] = fs.readFile(`./resources/samples/${directory}/package-lock.${variant}.json`, 'utf8')
			.then(JSON.parse);
	}
}

export const getPackageJson = (directory: Directories) => pendingPackageJsons[directory];

export const getLockfile = (directory: Directories, variant: Variant) => pendingLockfiles[directory][variant];
