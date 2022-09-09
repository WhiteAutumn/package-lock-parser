/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect } from 'chai';

import { PackageJson, RawLockfileV1 } from './types';
import { lockfiles, packages } from './test-resources/index.test';
import { parse, synth } from './v1';

describe('For v1 lockfiles', () => {
	describe('the parse() function', () => {

		it('should return something that is not null or undefined', async () => {
			const parsed = parse(<RawLockfileV1> await lockfiles.basic.v1(), <PackageJson> await packages.basic());
			expect(parsed).to.not.be.undefined;
		});

		it('should return object containing the correct version property', async () => {
			const parsed = parse(<RawLockfileV1> await lockfiles.basic.v1(), <PackageJson> await packages.basic());
			expect(parsed).to.have.property('version').that.equals(1);
		});

		it('should return object with correctly parsed basic package', async () => {
			const parsed = parse(<RawLockfileV1> await lockfiles.basic.v1(), <PackageJson> await packages.basic());
			expect(parsed).to.have.property('dependencies');
			const dependencies = parsed.dependencies;
			expect(dependencies).to.have.property('@package-lock-parser/test-resource-pure');
			const module = dependencies!['@package-lock-parser/test-resource-pure'];
			expect(module).to.have.property('version');
			expect(module.version).to.equal('1.0.0');
		});

	});

	describe('the synth() function', () => {

		it('should return something that is not null or undefined', async () => {
			const parsed = parse(<RawLockfileV1> await lockfiles.basic.v1(), <PackageJson> await packages.basic());
			const synthesized = synth(parsed);
			expect(synthesized).to.not.be.undefined;
		});

		it('should return synthesized output with correct lockfileVersion property', async () => {
			const parsed = parse(<RawLockfileV1> await lockfiles.basic.v1(), <PackageJson> await packages.basic());
			const synthesized = synth(parsed);
			expect(synthesized.lockfileVersion).to.equals(1);
		});

		it('should return synthesized output with correctly synthesized basic package', async () => {
			const parsed = parse(<RawLockfileV1> await lockfiles.basic.v1(), <PackageJson> await packages.basic());
			const synthesized = synth(parsed);
			expect(synthesized).to.have.property('dependencies');
			const dependencies = synthesized.dependencies;
			expect(dependencies).to.have.property('@package-lock-parser/test-resource-pure');
			const module = dependencies!['@package-lock-parser/test-resource-pure'];
			expect(module.version).to.equal('1.0.0');
			expect(module.resolved).to.equal('https://registry.npmjs.org/@package-lock-parser/test-resource-pure/-/test-resource-pure-1.0.0.tgz');
			expect(module.integrity).to.equal('sha512-nKkblBoJUPTOq4ZE1fZ5EtrtcfSP6XF/iJgS8IhqHObotn+5nr7g/i6isiEW0ZIVVkp0fJxO1jwKVosOurEUbA==');
		});

	});
});
