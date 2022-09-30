/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect } from 'chai';

import { PackageJson, RawLockfileV1 } from './types';
import { lockfiles } from './test-resources/index.test';
import { parse, synth } from './v1';

describe('For v1 lockfiles', () => {
	describe('the parse() function', () => {

		it('should return something that is not null or undefined', async () => {
			const parsed = parse(<RawLockfileV1> await lockfiles.basic.v1(), <PackageJson> await lockfiles.basic.packagefile());
			expect(parsed).to.not.be.null;
			expect(parsed).to.not.be.undefined;
		});

		it('should return result with correct version property', async () => {
			const parsed = parse(<RawLockfileV1> await lockfiles.basic.v1(), <PackageJson> await lockfiles.basic.packagefile());
			expect(parsed).to.have.property('version').that.equals(1);
		});

		it('should return parsed package with correct version property', async () => {
			const parsed = parse(<RawLockfileV1> await lockfiles.basic.v1(), <PackageJson> await lockfiles.basic.packagefile());
			expect(parsed).to.have.property('dependencies');
			
			const dependencies = parsed.dependencies;
			expect(dependencies).to.have.property('@package-lock-parser/test-resource-pure');

			const module = dependencies!['@package-lock-parser/test-resource-pure'];
			expect(module).to.have.property('version');
			expect(module.version).to.equal('1.0.0');
		});

		it('should return parsed package with correct name property', async () => {
			const parsed = parse(<RawLockfileV1> await lockfiles.basic.v1(), <PackageJson> await lockfiles.basic.packagefile());
			expect(parsed).to.have.property('dependencies');

			const dependencies = parsed.dependencies;
			expect(dependencies).to.have.property('@package-lock-parser/test-resource-pure');

			const module = dependencies!['@package-lock-parser/test-resource-pure'];
			expect(module).to.have.property('name');
			expect(module.name).to.equal('@package-lock-parser/test-resource-pure');
		});

		it('should return parsed package with immutable name property', async () => {
			const parsed = parse(<RawLockfileV1> await lockfiles.basic.v1(), <PackageJson> await lockfiles.basic.packagefile());
			expect(parsed).to.have.property('dependencies');

			const dependencies = parsed.dependencies;
			expect(dependencies).to.have.property('@package-lock-parser/test-resource-pure');

			const module = dependencies!['@package-lock-parser/test-resource-pure'];
			expect(module).to.have.property('name');
			//@ts-expect-error The name property is marked as read-only so assigning to it should give an error
			module.name = 'something-else';
			expect(module.name).to.equal('@package-lock-parser/test-resource-pure');
		});

		it('should return result with dev dependency in the correct location', async () => {
			const parsed = parse(<RawLockfileV1> await lockfiles.basicDev.v1(), <PackageJson> await lockfiles.basicDev.packagefile());
			expect(parsed).to.have.property('devDependencies');
			expect(parsed).to.not.have.property('dependencies');

			const dependencies = parsed.devDependencies;
			expect(dependencies).to.have.property('@package-lock-parser/test-resource-pure');
		});

		it('should return parsed package that is a dependency of another', async () => {
			const parsed = parse(<RawLockfileV1> await lockfiles.nested.v1(), <PackageJson> await lockfiles.nested.packagefile());
			expect(parsed).to.have.property('dependencies');

			const dependencies = parsed.dependencies;
			expect(dependencies).to.have.property('@package-lock-parser/test-resource-nested');

			const module = dependencies!['@package-lock-parser/test-resource-nested'];
			expect(module).to.have.property('dependencies');

			const moduleDependencies = module.dependencies;
			expect(moduleDependencies).to.have.property('@package-lock-parser/test-resource-pure');
		});

		it('should parse packages of differing versions where one is a dependency of root and another is a dependency of a package', async () => {
			const parsed = parse(<RawLockfileV1> await lockfiles.nestedVersionMismatch.v1(), <PackageJson> await lockfiles.nestedVersionMismatch.packagefile());
			expect(parsed).to.have.property('dependencies');

			const dependencies = parsed.dependencies;
			expect(dependencies).to.have.property('@package-lock-parser/test-resource-pure');
			expect(dependencies).to.have.property('@package-lock-parser/test-resource-nested');

			const testResourcePure = dependencies['@package-lock-parser/test-resource-pure']!;
			expect(testResourcePure.version).to.equal('1.0.0');

			const testResourceNested = dependencies['@package-lock-parser/test-resource-nested']!;
			expect(testResourceNested).to.have.property('dependencies');

			const testResourceNestedDependencies = testResourceNested.dependencies;
			expect(testResourceNestedDependencies).to.have.property('@package-lock-parser/test-resource-pure');

			const testResourcePureNested = testResourceNestedDependencies['@package-lock-parser/test-resource-pure']!;
			expect(testResourcePureNested.version).to.equal('2.0.0');
		});

		it('should only create one object for packages with multiple dependents', async () => {
			const parsed = parse(<RawLockfileV1> await lockfiles.nestedVersionMatch.v1(), <PackageJson> await lockfiles.nestedVersionMatch.packagefile());
			expect(parsed).to.have.property('dependencies');

			const dependencies = parsed.dependencies;
			expect(dependencies).to.have.property('@package-lock-parser/test-resource-pure');
			expect(dependencies).to.have.property('@package-lock-parser/test-resource-nested-alternate');

			const rootDependantPackage = dependencies['@package-lock-parser/test-resource-pure']!;
			const nestedDependantPackage = dependencies['@package-lock-parser/test-resource-nested-alternate']!.dependencies['@package-lock-parser/test-resource-pure']!;

			expect(rootDependantPackage).to.equal(nestedDependantPackage);
		});

	});

	describe('the synth() function', () => {

		it('should return something that is not null or undefined', async () => {
			const parsed = parse(<RawLockfileV1> await lockfiles.basic.v1(), <PackageJson> await lockfiles.basic.packagefile());
			const synthesized = synth(parsed);
			expect(synthesized).to.not.be.null;
			expect(synthesized).to.not.be.undefined;
		});

		it('should synthesize lockfile with correct lockfileVersion property', async () => {
			const parsed = parse(<RawLockfileV1> await lockfiles.basic.v1(), <PackageJson> await lockfiles.basic.packagefile());
			const synthesized = synth(parsed);
			expect(synthesized.lockfileVersion).to.equals(1);
		});

		it('should synthesize package with correct properties', async () => {
			const parsed = parse(<RawLockfileV1> await lockfiles.basic.v1(), <PackageJson> await lockfiles.basic.packagefile());
			const synthesized = synth(parsed);
			expect(synthesized).to.have.property('dependencies');

			const dependencies = synthesized.dependencies;
			expect(dependencies).to.have.property('@package-lock-parser/test-resource-pure');
			
			const module = dependencies!['@package-lock-parser/test-resource-pure'];
			expect(module.version).to.equal('1.0.0');
			expect(module.resolved).to.equal('https://registry.npmjs.org/@package-lock-parser/test-resource-pure/-/test-resource-pure-1.0.0.tgz');
			expect(module.integrity).to.equal('sha512-nKkblBoJUPTOq4ZE1fZ5EtrtcfSP6XF/iJgS8IhqHObotn+5nr7g/i6isiEW0ZIVVkp0fJxO1jwKVosOurEUbA==');
		});

		it('should synthesize dev dependency package with correct dev flag', async () => {
			const parsed = parse(<RawLockfileV1> await lockfiles.basicDev.v1(), <PackageJson> await lockfiles.basicDev.packagefile());
			const synthesized = synth(parsed);
			expect(synthesized).to.have.property('dependencies');

			const dependencies = synthesized.dependencies;
			expect(dependencies).to.have.property('@package-lock-parser/test-resource-pure');

			const module = dependencies!['@package-lock-parser/test-resource-pure'];
			expect(module.dev).to.equal(true);
		});

		it('should synthesize package as regular dependency when moved from dev dependencies', async () => {
			const parsed = parse(<RawLockfileV1> await lockfiles.basicDev.v1(), <PackageJson> await lockfiles.basicDev.packagefile());
			parsed.dependencies = {};
			parsed.dependencies['@package-lock-parser/test-resource-pure'] = parsed.devDependencies['@package-lock-parser/test-resource-pure'];
			delete parsed.devDependencies['@package-lock-parser/test-resource-pure'];

			const synthesized = synth(parsed);
			expect(synthesized).to.have.property('dependencies');

			const dependencies = synthesized.dependencies;
			expect(dependencies).to.have.property('@package-lock-parser/test-resource-pure');

			const module = dependencies!['@package-lock-parser/test-resource-pure'];
			expect(module).to.not.have.property('dev');
		});

		it('should synthesize package as dev dependency when moved from regular dependencies', async () => {
			const parsed = parse(<RawLockfileV1> await lockfiles.basic.v1(), <PackageJson> await lockfiles.basic.packagefile());
			parsed.devDependencies = {};
			parsed.devDependencies['@package-lock-parser/test-resource-pure'] = parsed.dependencies['@package-lock-parser/test-resource-pure'];
			delete parsed.dependencies['@package-lock-parser/test-resource-pure'];

			const synthesized = synth(parsed);
			expect(synthesized).to.have.property('dependencies');

			const dependencies = synthesized.dependencies;
			expect(dependencies).to.have.property('@package-lock-parser/test-resource-pure');

			const module = dependencies!['@package-lock-parser/test-resource-pure'];
			expect(module.dev).to.equal(true);
		});

		it('should synthesize package that is a dependency of another', async () => {
			const parsed = parse(<RawLockfileV1> await lockfiles.nested.v1(), <PackageJson> await lockfiles.nested.packagefile());
			const synthesized = synth(parsed);
			expect(synthesized).to.have.property('dependencies');

			const dependencies = synthesized.dependencies;
			expect(dependencies).to.have.property('@package-lock-parser/test-resource-nested');
			expect(dependencies).to.have.property('@package-lock-parser/test-resource-pure');
		});

		it('should synthesize packages of differing versions where one is a dependency of root and another is a dependency of a package', async () => {
			const parsed = parse(<RawLockfileV1> await lockfiles.nestedVersionMismatch.v1(), <PackageJson> await lockfiles.nestedVersionMismatch.packagefile());
			const synthesized = synth(parsed);
			expect(synthesized).to.have.property('dependencies');

			const dependencies = synthesized.dependencies;
			expect(dependencies).to.have.property('@package-lock-parser/test-resource-nested');
			expect(dependencies).to.have.property('@package-lock-parser/test-resource-pure');

			const testResourcePure = dependencies['@package-lock-parser/test-resource-pure']!;
			expect(testResourcePure.version).to.equal('1.0.0');

			const testResourceNested = dependencies['@package-lock-parser/test-resource-nested']!;
			expect(testResourceNested).to.have.property('dependencies');

			const testResourceNestedDependencies = testResourceNested.dependencies;
			expect(testResourceNestedDependencies).to.have.property('@package-lock-parser/test-resource-pure');

			const testResourcePureNested = testResourceNestedDependencies['@package-lock-parser/test-resource-pure']!;
			expect(testResourcePureNested.version).to.equal('2.0.0');
		});

		it('should synthesize packages of differing versions from different packages', async () => {
			const parsed = parse(<RawLockfileV1> await lockfiles.nestedVersionMismatchAlternate.v1(), <PackageJson> await lockfiles.nestedVersionMismatchAlternate.packagefile());
			const synthesized = synth(parsed);
			expect(synthesized).to.have.property('dependencies');

			const dependencies = synthesized.dependencies;
			expect(dependencies).to.have.property('@package-lock-parser/test-resource-pure');
			expect(dependencies).to.have.property('@package-lock-parser/test-resource-nested');
			expect(dependencies).to.have.property('@package-lock-parser/test-resource-nested-alternate');

			const testResourcePure = dependencies['@package-lock-parser/test-resource-pure']!;
			expect(testResourcePure.version).to.equal('2.0.0');

			const testResourceAlternate = dependencies['@package-lock-parser/test-resource-nested-alternate']!;
			expect(testResourceAlternate).to.have.property('dependencies');

			const testResourceAlternateDependencies = testResourceAlternate.dependencies;
			expect(testResourceAlternateDependencies).to.have.property('@package-lock-parser/test-resource-pure');

			const testResourcePureAlternate = testResourceAlternateDependencies['@package-lock-parser/test-resource-pure']!;
			expect(testResourcePureAlternate.version).to.equal('1.0.0');
		});

	});
});
