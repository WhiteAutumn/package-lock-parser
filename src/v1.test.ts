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

		it('should return result with dev dependency in the correct location', async () => {
			const parsed = parse(<RawLockfileV1> await lockfiles.basicDev.v1(), <PackageJson> await lockfiles.basicDev.packagefile());
			expect(parsed).to.have.property('devDependencies');
			expect(parsed).to.not.have.property('dependencies');

			const dependencies = parsed.devDependencies;
			expect(dependencies).to.have.property('@package-lock-parser/test-resource-pure');
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

	});
});
