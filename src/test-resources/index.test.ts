import path from 'path';
import fs from 'fs';

import { Any } from '../types';

const defineFile = (name: string): () => Promise<Any> => {
	const file = fs.promises.readFile(path.join('src', 'test-resources', name))
		.then(it => it.toString())
		.then(it => JSON.parse(it));

	return async () => await file;
};

type Versions = 1|2;
type LockfilesDefinition = Record<string, Record<`v${Versions}`, () => Promise<Any>>>;
const defineLockfiles = <T extends LockfilesDefinition> (definition: T): T => definition; 

export const lockfiles = defineLockfiles({
	basic: {
		v1: defineFile('v1_basic.json'),
		v2: defineFile('v2_basic.json'),
	}
});

type PackagesDefinition<T extends string> = Record<T, () => Promise<Any>>;
const definePackages = <T extends PackagesDefinition<keyof typeof lockfiles>> (definition: T): T => definition;

export const packages = definePackages({
	basic: defineFile('v1_basic.package.json')
});
