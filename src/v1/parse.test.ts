/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { expect } from 'chai';

import { lockfiles } from '../test/resources';
import { parse } from './parse';

describe('The v1 parse() function', () => {

	it('should return parsed lockfile with correct version version', async () => {
		const parsed = parse(await lockfiles.simple.v1(), await lockfiles.simple.packagefile());
		expect(parsed.version).to.equal(1);
	});

	it('return packages with immutable version and name properties', async () => {
		const parsed = parse(await lockfiles.simple.v1(), await lockfiles.simple.packagefile());
		const parsedDependency = parsed.dependencies['@package-lock-parser/test-package-depth-0']!;
	
		//@ts-expect-error Writing to immutable property
		parsedDependency.name = 'other-value';
		expect(parsedDependency.name).to.equal('@package-lock-parser/test-package-depth-0');
		//@ts-expect-error Writing to immutable property
		parsedDependency.version = 'other-value';
		expect(parsedDependency.version).to.equal('1.0.0');
	});

	it('should return parsed lockfile with simple dependency', async () => {
		const parsed = parse(await lockfiles.simple.v1(), await lockfiles.simple.packagefile());

		expect(parsed.dependencies).to.have.property('@package-lock-parser/test-package-depth-0');

		const parsedDependency = parsed.dependencies['@package-lock-parser/test-package-depth-0']!;
		expect(parsedDependency.name).to.equal('@package-lock-parser/test-package-depth-0');
		expect(parsedDependency.version).to.equal('1.0.0');
	});

	it('should return parsed lockfile with simple dev dependency', async () => {
		const parsed = parse(await lockfiles.simpleDev.v1(), await lockfiles.simpleDev.packagefile());

		expect(parsed.devDependencies).to.have.property('@package-lock-parser/test-package-depth-0');

		const parsedDependency = parsed.devDependencies['@package-lock-parser/test-package-depth-0']!;
		expect(parsedDependency.name).to.equal('@package-lock-parser/test-package-depth-0');
		expect(parsedDependency.version).to.equal('1.0.0');
	});

	it('should return parsed lockfile with dependency with its own dependencies', async () => {
		const parsed = parse(await lockfiles.deep1.v1(), await lockfiles.deep1.packagefile());
		
		expect(parsed.dependencies).to.have.property('@package-lock-parser/test-package-depth-1');

		const parsedDependency = parsed.dependencies['@package-lock-parser/test-package-depth-1']!;
		expect(parsedDependency.name).to.equal('@package-lock-parser/test-package-depth-1');
		expect(parsedDependency.version).to.equal('1.0.0');
		expect(parsedDependency.dependencies).to.have.property('@package-lock-parser/test-package-depth-0');

		const parsedDependencyDependency = parsedDependency.dependencies['@package-lock-parser/test-package-depth-0']!;
		expect(parsedDependencyDependency.name).to.equal('@package-lock-parser/test-package-depth-0');
		expect(parsedDependencyDependency.version).to.equal('1.0.0');
	});

	it('should return parsed lockfile with dev dependency with its own dependencies', async () => {
		const parsed = parse(await lockfiles.deep1Dev.v1(), await lockfiles.deep1Dev.packagefile());
		
		expect(parsed.devDependencies).to.have.property('@package-lock-parser/test-package-depth-1');

		const parsedDependency = parsed.devDependencies['@package-lock-parser/test-package-depth-1']!;
		expect(parsedDependency.dependencies).to.have.property('@package-lock-parser/test-package-depth-0');

		const parsedDependencyDependency = parsedDependency.dependencies['@package-lock-parser/test-package-depth-0']!;
		expect(parsedDependencyDependency.name).to.equal('@package-lock-parser/test-package-depth-0');
		expect(parsedDependencyDependency.version).to.equal('1.0.0');
	});

	it('should return parsed lockfile where multiple reference to a package of the same version should result in one object in memory', async () => {
		const parsed = parse(await lockfiles.versionMatch.v1(), await lockfiles.versionMatch.packagefile());

		expect(parsed.dependencies).to.have.property('@package-lock-parser/test-package-depth-0');
		expect(parsed.dependencies).to.have.property('@package-lock-parser/test-package-depth-1');

		const rootPurePackage = parsed.dependencies['@package-lock-parser/test-package-depth-0']!;
		const nestedPurePackage = parsed.dependencies['@package-lock-parser/test-package-depth-1']!.dependencies['@package-lock-parser/test-package-depth-0'];

		expect(rootPurePackage).to.equal(nestedPurePackage);
	});

	it('should return parsed lockfile where multiple reference to a package of a different version should result in multiple objects in memory', async () => {
		const parsed = parse(await lockfiles.versionMismatch.v1(), await lockfiles.versionMismatch.packagefile());

		expect(parsed.dependencies).to.have.property('@package-lock-parser/test-package-depth-0');
		expect(parsed.dependencies).to.have.property('@package-lock-parser/test-package-depth-1');

		const rootPurePackage = parsed.dependencies['@package-lock-parser/test-package-depth-0']!;
		const nestedPurePackage = parsed.dependencies['@package-lock-parser/test-package-depth-1']!.dependencies['@package-lock-parser/test-package-depth-0'];

		expect(rootPurePackage.version).to.equal('2.0.0');
		expect(nestedPurePackage.version).to.equal('1.0.0');
	});

});
