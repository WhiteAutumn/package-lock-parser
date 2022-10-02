/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { expect } from 'chai';

import { lockfiles } from '../test/resources';
import { parse } from './parse';
import { synth } from './synth';

describe('The v1 synth() function', () => {

	it('should synth basic singular dependency', async () => {
		const parsed = parse(await lockfiles.basic.v1(), await lockfiles.basic.packagefile());
		const synthed = synth(parsed);

		expect(synthed).to.deep.equal(await lockfiles.basic.v1());
	});

	it('should synth basic singular dev dependency', async () => {
		const parsed = parse(await lockfiles.basicDev.v1(), await lockfiles.basicDev.packagefile());
		const synthed = synth(parsed);

		expect(synthed).to.deep.equal(await lockfiles.basicDev.v1());
	});

	it('should synth dependency with one own dependency', async () => {
		const parsed = parse(await lockfiles.nested.v1(), await lockfiles.nested.packagefile());
		const synthed = synth(parsed);

		expect(synthed).to.deep.equal(await lockfiles.nested.v1());
	});

	it('should synth single dependency for dependencies with multiple references', async () => {
		const parsed = parse(await lockfiles.nestedVersionMatch.v1(), await lockfiles.nestedVersionMatch.packagefile());
		const synthed = synth(parsed);

		expect(synthed).to.deep.equal(await lockfiles.nestedVersionMatch.v1());
	});

	it('should synth separate dependencies for same dependency with different versions', async () => {
		const parsed = parse(await lockfiles.nestedVersionMismatch.v1(), await lockfiles.nestedVersionMismatch.packagefile());
		const synthed = synth(parsed);

		expect(synthed).to.deep.equal(await lockfiles.nestedVersionMismatch.v1());
	});

	it('should synth in alphabetical order', async () => {
		const parsed = parse(await lockfiles.deep.v1(), await lockfiles.deep.packagefile());
		const synthed = synth(parsed);

		expect(synthed.dependencies['@package-lock-parser/test-resource-pure'].version).to.equal('2.0.0');
	});

	it('should synth lockfile with correct packages when a branch is cut off', async () => {
		let parsed = parse(await lockfiles.nestedVersionMatch.v1(), await lockfiles.nestedVersionMatch.packagefile());
		delete parsed.dependencies['@package-lock-parser/test-resource-pure'];
		let synthed = synth(parsed);

		expect(synthed.dependencies).to.have.property('@package-lock-parser/test-resource-pure');
		expect(synthed.dependencies).to.have.property('@package-lock-parser/test-resource-nested');


		parsed = parse(await lockfiles.nestedVersionMismatch.v1(), await lockfiles.nestedVersionMismatch.packagefile());
		delete parsed.dependencies['@package-lock-parser/test-resource-pure'];
		synthed = synth(parsed);

		expect(synthed.dependencies).to.have.property('@package-lock-parser/test-resource-pure');
		expect(synthed.dependencies).to.have.property('@package-lock-parser/test-resource-nested');

		const synthedDependency = synthed.dependencies['@package-lock-parser/test-resource-pure']!;
		expect(synthedDependency.version).to.equal('2.0.0');
	});

	it('should synth lockfile with correct dev flags when a branch is cut off', async () => {
		const parsed = parse(await lockfiles.nestedMixedDev.v1(), await lockfiles.nestedMixedDev.packagefile());
		delete parsed.dependencies['@package-lock-parser/test-resource-pure'];
		const synthed = synth(parsed);

		expect(synthed.dependencies).to.have.property('@package-lock-parser/test-resource-pure');
		expect(synthed.dependencies).to.have.property('@package-lock-parser/test-resource-nested');

		const synthedDependency = synthed.dependencies['@package-lock-parser/test-resource-pure']!;
		expect(synthedDependency.dev).to.equal(true);
	});

	it('should save synthed packages in alphabetical order', async () => {
		const parsed = parse(await lockfiles.deep.v1(), await lockfiles.deep.packagefile());
		const synthed = synth(parsed);

		const expected = Object.keys(synthed.dependencies).sort();
		const actual = Object.keys(synthed.dependencies);

		expect(actual).to.deep.equal(expected);
	});

	it('should order synthesized package properties in canonical order', async () => {
		const parsed = parse(await lockfiles.nestedDev.v1(), await lockfiles.nestedDev.packagefile());
		const synthed = synth(parsed);

		const synthedPurePackage = synthed.dependencies['@package-lock-parser/test-resource-pure']!;
		const synthedNestedPackage = synthed.dependencies['@package-lock-parser/test-resource-nested']!;
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
