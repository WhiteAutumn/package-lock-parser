import path from 'path';
import fs from 'fs/promises';

import { Any } from '../types';

const defineFile = (name: string): () => Promise<Any> => {
	const file = fs.readFile(path.join('src', 'test-resources', name))
		.then(it => it.toString());

	return async () => (
		JSON.parse(await file)
	);
};

type Versions = 1|2;
type FilesDefinition = Record<string, Record<`v${Versions}`, () => Promise<Any>>>;
const defineFiles = <T extends FilesDefinition> (definition: T): T => definition; 

export const files = defineFiles({
	basic: {
		v1: defineFile('v1_basic.json'),
		v2: defineFile('v2_basic.json'),
	}
});
