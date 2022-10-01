/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { expect } from 'chai';

import { lockfiles } from '../test/resources';
import { parse } from './parse';

describe('The v1 parse() function', () => {

	it('should return object with correct lockfile version', async () => {
		const parsed = parse(await lockfiles.basic.v1(), await lockfiles.basic.packagefile());
		expect(parsed.version).to.equal(1);
	});

	it('return parsed packages with immutable version and name properties', async () => {
		const parsed = parse(await lockfiles.basic.v1(), await lockfiles.basic.packagefile());
		const parsedDependency = parsed.dependencies['@package-lock-parser/test-resource-pure']!;

		//@ts-expect-error Writing to immutable property
		parsedDependency.name = 'other-value';
		expect(parsedDependency.name).to.equal('@package-lock-parser/test-resource-pure');
		//@ts-expect-error Writing to immutable property
		parsedDependency.version = 'other-value';
		expect(parsedDependency.version).to.equal('1.0.0');
	});

	it('should parse basic singular dependency', async () => {
		const parsed = parse(await lockfiles.basic.v1(), await lockfiles.basic.packagefile());

		expect(parsed.dependencies).to.have.property('@package-lock-parser/test-resource-pure');

		const parsedDependency = parsed.dependencies['@package-lock-parser/test-resource-pure']!;
		expect(parsedDependency.name).to.equal('@package-lock-parser/test-resource-pure');
		expect(parsedDependency.version).to.equal('1.0.0');
	});

	it('should parse basic singular dev dependency', async () => {
		const parsed = parse(await lockfiles.basicDev.v1(), await lockfiles.basicDev.packagefile());

		expect(parsed.devDependencies).to.have.property('@package-lock-parser/test-resource-pure');

		const parsedDependency = parsed.devDependencies['@package-lock-parser/test-resource-pure']!;
		expect(parsedDependency.name).to.equal('@package-lock-parser/test-resource-pure');
		expect(parsedDependency.version).to.equal('1.0.0');
	});

	it('should parse dependency with one own dependency', async () => {
		const parsed = parse(await lockfiles.nested.v1(), await lockfiles.nested.packagefile());
		
		expect(parsed.dependencies).to.have.property('@package-lock-parser/test-resource-nested');

		const parsedDependency = parsed.dependencies['@package-lock-parser/test-resource-nested']!;
		expect(parsedDependency.dependencies).to.have.property('@package-lock-parser/test-resource-pure');

		const parsedDependencyDependency = parsedDependency.dependencies['@package-lock-parser/test-resource-pure']!;
		expect(parsedDependencyDependency.name).to.equal('@package-lock-parser/test-resource-pure');
		expect(parsedDependencyDependency.version).to.equal('1.0.0');
	});

	it('should parse dev dependency with one own dependency', async () => {
		const parsed = parse(await lockfiles.nestedDev.v1(), await lockfiles.nestedDev.packagefile());
		
		expect(parsed.devDependencies).to.have.property('@package-lock-parser/test-resource-nested');

		const parsedDependency = parsed.devDependencies['@package-lock-parser/test-resource-nested']!;
		expect(parsedDependency.dependencies).to.have.property('@package-lock-parser/test-resource-pure');

		const parsedDependencyDependency = parsedDependency.dependencies['@package-lock-parser/test-resource-pure']!;
		expect(parsedDependencyDependency.name).to.equal('@package-lock-parser/test-resource-pure');
		expect(parsedDependencyDependency.version).to.equal('1.0.0');
	});

	it('should parse dependencies with multiple references to the same object', async () => {
		const parsed = parse(await lockfiles.nestedVersionMatch.v1(), await lockfiles.nestedVersionMatch.packagefile());

		expect(parsed.dependencies).to.have.property('@package-lock-parser/test-resource-pure');
		expect(parsed.dependencies).to.have.property('@package-lock-parser/test-resource-nested');

		const rootPurePackage = parsed.dependencies['@package-lock-parser/test-resource-pure']!;
		const nestedPurePackage = parsed.dependencies['@package-lock-parser/test-resource-nested']!.dependencies['@package-lock-parser/test-resource-pure'];

		expect(rootPurePackage).to.equal(nestedPurePackage);
	});

	it('should parse dependencies with differing versions into separate objects', async () => {
		const parsed = parse(await lockfiles.nestedVersionMismatch.v1(), await lockfiles.nestedVersionMismatch.packagefile());

		expect(parsed.dependencies).to.have.property('@package-lock-parser/test-resource-pure');
		expect(parsed.dependencies).to.have.property('@package-lock-parser/test-resource-nested');

		const rootPurePackage = parsed.dependencies['@package-lock-parser/test-resource-pure']!;
		const nestedPurePackage = parsed.dependencies['@package-lock-parser/test-resource-nested']!.dependencies['@package-lock-parser/test-resource-pure'];

		expect(rootPurePackage.version).to.equal('1.0.0');
		expect(nestedPurePackage.version).to.equal('2.0.0');
	});

});
