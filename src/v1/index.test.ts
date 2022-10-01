import Exception from 'exceptions-with-cause';
import { expect } from 'chai';

import { LockfileV1 } from '../util/types';
import { lockfiles } from '../test/resources';
import { parse } from './parse';
import { synth } from './synth';

describe('The v1 parse() & synth() functions', () => {

	it('should for each lockfile in test resource synthesize the same lockfile as parsed', async () => {
		for (const [bundleName, { v1, packagefile }] of Object.entries(lockfiles)) {

			let expected: LockfileV1, actual: LockfileV1;
			try {
				const [v1Awaited, packagefileAwaited] = await Promise.all([v1(), packagefile()]);
			
				expected = v1Awaited;
				const parsed = parse(v1Awaited, packagefileAwaited);
				actual = synth(parsed);
			}
			catch (error) {
				throw new Exception(`An error occurred while processing lockfile bundle '${bundleName}'`, error);
			}

			expect(actual).to.deep.equal(expected);
		}
	});

});
