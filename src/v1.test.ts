import { expect } from 'chai';

import { RawLockfile } from './types';
import { files } from './test-resources/index.test';
import { parse, synth } from './v1';

describe('For v1 lockfiles', () => {
	describe('the parse() function', () => {

		it('should return something that is not null or undefined', async () => {
			const parsed = parse(await files.basic.v1() as RawLockfile);
			expect(parsed).to.not.be.undefined;
		});

		it('should return object containing the correct version property', async () => {
			const parsed = parse(await files.basic.v1() as RawLockfile);
			expect(parsed).to.have.property('version').that.equals(1);
		});

	});

	describe('the synth() function', () => {

		it('should return something that is not null or undefined', async () => {
			const parsed = parse(await files.basic.v1() as RawLockfile);
			const synthesized = synth(parsed);
			expect(synthesized).to.not.be.undefined;
		});

		it('should return synthesized output correct lockfileVersion property', async () => {
			const parsed = parse(await files.basic.v1() as RawLockfile);
			const synthesized = synth(parsed);
			expect(synthesized.lockfileVersion).to.equals(1);
		});

	});
});
