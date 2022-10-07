/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { expect } from 'chai';

import { lockfiles } from '../test/resources';
import { parse } from './parse';
import { synth } from './synth';

describe('The v1 synth() function', () => {

	it('should synth basic singular dependency', async () => {
		const parsed = parse(await lockfiles.simple.v1(), await lockfiles.simple.packagefile());
		const synthed = synth(parsed);

		expect(synthed).to.deep.equal(await lockfiles.simple.v1());
	});

	it('should synth basic singular dev dependency', async () => {
		const parsed = parse(await lockfiles.simpleDev.v1(), await lockfiles.simpleDev.packagefile());
		const synthed = synth(parsed);

		expect(synthed).to.deep.equal(await lockfiles.simpleDev.v1());
	});

	it('should synth dependency with one own dependency', async () => {
		const parsed = parse(await lockfiles.deep1.v1(), await lockfiles.deep1.packagefile());
		const synthed = synth(parsed);

		expect(synthed).to.deep.equal(await lockfiles.deep1.v1());
	});

	it('should synth single dependency for dependencies with multiple references', async () => {
		const parsed = parse(await lockfiles.versionMatch.v1(), await lockfiles.versionMatch.packagefile());
		const synthed = synth(parsed);

		expect(synthed).to.deep.equal(await lockfiles.versionMatch.v1());
	});

	it('should synth separate dependencies for same dependency with different versions', async () => {
		const parsed = parse(await lockfiles.versionMismatch.v1(), await lockfiles.versionMismatch.packagefile());
		const synthed = synth(parsed);

		expect(synthed).to.deep.equal(await lockfiles.versionMismatch.v1());
	});

	it('should synth lockfile with correct packages when a branch is cut off', async () => {
		let parsed = parse(await lockfiles.versionMatch.v1(), await lockfiles.versionMatch.packagefile());
		delete parsed.dependencies['@package-lock-parser/test-package-depth-0'];
		let synthed = synth(parsed);

		expect(synthed.dependencies).to.have.property('@package-lock-parser/test-package-depth-0');
		expect(synthed.dependencies).to.have.property('@package-lock-parser/test-package-depth-1');


		parsed = parse(await lockfiles.versionMismatch.v1(), await lockfiles.versionMismatch.packagefile());
		delete parsed.dependencies['@package-lock-parser/test-package-depth-0'];
		synthed = synth(parsed);

		expect(synthed.dependencies).to.have.property('@package-lock-parser/test-package-depth-0');
		expect(synthed.dependencies).to.have.property('@package-lock-parser/test-package-depth-1');

		const synthedDependency = synthed.dependencies['@package-lock-parser/test-package-depth-0']!;
		expect(synthedDependency.version).to.equal('1.0.0');
	});

	it('should synth lockfile with correct dev flags when a branch is cut off', async () => {
		const parsed = parse(await lockfiles.devMixed.v1(), await lockfiles.devMixed.packagefile());
		delete parsed.dependencies['@package-lock-parser/test-package-beta'];
		const synthed = synth(parsed);

		expect(synthed.dependencies).to.have.property('@package-lock-parser/test-package-depth-0');
		expect(synthed.dependencies).to.have.property('@package-lock-parser/test-package-alpha');

		const synthedDependency = synthed.dependencies['@package-lock-parser/test-package-depth-0']!;
		expect(synthedDependency.dev).to.equal(true);
	});

	it('should synth in alphabetical order', async () => {
		const parsed = parse(await lockfiles.notAlphabetical.v1(), await lockfiles.notAlphabetical.packagefile());
		const synthed = synth(parsed);

		expect(synthed.dependencies['@package-lock-parser/test-package-depth-0'].version).to.equal('2.0.0');
	});

	it('should save synthed packages in alphabetical order', async () => {
		const parsed = parse(await lockfiles.notAlphabetical.v1(), await lockfiles.notAlphabetical.packagefile());
		const synthed = synth(parsed);

		const expected = Object.keys(synthed.dependencies).sort();
		const actual = Object.keys(synthed.dependencies);

		expect(actual).to.deep.equal(expected);
	});

	it('should order synthesized package properties in canonical order', async () => {
		const parsed = parse(await lockfiles.deep1Dev.v1(), await lockfiles.deep1Dev.packagefile());
		const synthed = synth(parsed);

		const synthedPurePackage = synthed.dependencies['@package-lock-parser/test-package-depth-0']!;
		const synthedNestedPackage = synthed.dependencies['@package-lock-parser/test-package-depth-1']!;
		const actualPureKeys = Object.keys(synthedPurePackage);
		const actualNestedKeys = Object.keys(synthedNestedPackage);

		const expectedPureKeys = [
			'version',
			'resolved',
			'integrity',
			'dev'
		];

		const expectedNestedKeys = [
			'version',
			'resolved',
			'integrity',
			'dev',
			'requires'
		];

		expect(actualPureKeys).to.deep.equal(expectedPureKeys);
		expect(actualNestedKeys).to.deep.equal(expectedNestedKeys);
	});

});
